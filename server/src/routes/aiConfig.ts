import type { FastifyInstance } from "fastify";
import { writeAuditEvent } from "../core/audit.js";
import { assertAIOperationAllowed, sanitizeExternalAIPayload } from "../core/aiGateway.js";
import { getActor, requireRole } from "../middleware/auth.js";
import { getStudy } from "../studies/store.js";
import {
  deleteStudyAIConfigApiKey,
  getStudyAIConfig,
  setStudyAIConfigApiKey,
  toPublicAIConfig,
  updateStudyAIConfig,
  validateStudyAIConfig,
  type StudyAIFeature,
} from "../stores/aiConfigStore.js";

const AI_FEATURES: StudyAIFeature[] = [
  "clustering",
  "item_drafting",
  "neutrality_method_linting",
  "reminders",
  "irb_export_drafting",
  "report_drafting",
];

function getStudyId(params: unknown): string {
  const p = (params ?? {}) as Record<string, unknown>;
  return String(p.studyId ?? "");
}

function hasSecretKey(body: Record<string, unknown>): boolean {
  return ["apiKey", "api_key", "Authorization", "authorization", "apiKeyEncrypted", "api_key_encrypted"].some((key) =>
    Object.hasOwn(body, key),
  );
}

function getString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function featureFromBody(value: unknown): StudyAIFeature | null {
  return typeof value === "string" && (AI_FEATURES as string[]).includes(value) ? value as StudyAIFeature : null;
}

async function requireStudy(studyId: string) {
  const study = await getStudy(studyId);
  if (!study) return null;
  return study;
}

export async function aiConfigRoutes(app: FastifyInstance) {
  const viewConfig = requireRole(["owner", "methods_steward", "privacy_lead", "admin", "maintainer"]);
  const manageConfig = requireRole(["owner", "admin", "maintainer"]);

  for (const prefix of ["", "/api"]) {
    app.get(`${prefix}/studies/:studyId/ai-config`, { preHandler: viewConfig }, async (req, reply) => {
      const studyId = getStudyId(req.params);
      if (!(await requireStudy(studyId))) return reply.code(404).send({ error: "study_not_found" });

      const actor = getActor(req);
      const config = getStudyAIConfig(studyId);
      await writeAuditEvent({
        actor,
        action: "ai_config.view",
        object: { type: "study", id: studyId },
        details: { studyId, key_exists: Boolean(config.apiKeyEncrypted) },
      });

      return reply.send({ ai_config: toPublicAIConfig(config), validation: validateStudyAIConfig(config) });
    });

    app.put(`${prefix}/studies/:studyId/ai-config`, { preHandler: manageConfig }, async (req, reply) => {
      const studyId = getStudyId(req.params);
      if (!(await requireStudy(studyId))) return reply.code(404).send({ error: "study_not_found" });

      const body = (req.body ?? {}) as Record<string, unknown>;
      if (hasSecretKey(body)) {
        return reply.code(400).send({ error: "api_key_must_use_api_key_endpoint" });
      }

      const actor = getActor(req);
      const patch: Parameters<typeof updateStudyAIConfig>[2] = {};
      if (typeof body.externalAiEnabled === "boolean") patch.externalAiEnabled = body.externalAiEnabled;
      if (typeof body.noExternalAiMode === "boolean") patch.noExternalAiMode = body.noExternalAiMode;
      if (Object.hasOwn(body, "providerName")) patch.providerName = getString(body.providerName);
      if (Object.hasOwn(body, "modelName")) patch.modelName = getString(body.modelName);
      if (body.featurePermissions && typeof body.featurePermissions === "object") {
        patch.featurePermissions = body.featurePermissions as Record<string, boolean>;
      }
      if (body.disclosure && typeof body.disclosure === "object") {
        patch.disclosure = body.disclosure as Record<string, string>;
      }

      const config = updateStudyAIConfig(studyId, actor.userId, patch);

      await writeAuditEvent({
        actor,
        action: "ai_config.update",
        object: { type: "study", id: studyId },
        details: {
          studyId,
          external_ai_enabled: config.externalAiEnabled,
          no_external_ai_mode: config.noExternalAiMode,
          provider_name: config.providerName,
          model_name: config.modelName,
          feature_permissions: config.featurePermissions,
          disclosure_complete: validateStudyAIConfig(config).errors.length === 0,
        },
      });

      return reply.send({ ai_config: toPublicAIConfig(config), validation: validateStudyAIConfig(config) });
    });

    app.post(`${prefix}/studies/:studyId/ai-config/api-key`, { preHandler: manageConfig }, async (req, reply) => {
      const studyId = getStudyId(req.params);
      if (!(await requireStudy(studyId))) return reply.code(404).send({ error: "study_not_found" });
      const body = (req.body ?? {}) as Record<string, unknown>;
      const apiKey = getString(body.apiKey ?? body.api_key);
      if (!apiKey) return reply.code(400).send({ error: "api_key_required" });

      const actor = getActor(req);
      const before = getStudyAIConfig(studyId);
      const config = setStudyAIConfigApiKey(studyId, actor.userId, apiKey);

      await writeAuditEvent({
        actor,
        action: before.apiKeyEncrypted ? "ai_config.api_key.rotate" : "ai_config.api_key.set",
        object: { type: "study", id: studyId },
        details: {
          studyId,
          key_exists: true,
          key_last_four: config.apiKeyLastFour,
          provider_name: config.providerName,
          model_name: config.modelName,
        },
      });

      return reply.send({ ai_config: toPublicAIConfig(config), validation: validateStudyAIConfig(config) });
    });

    app.delete(`${prefix}/studies/:studyId/ai-config/api-key`, { preHandler: manageConfig }, async (req, reply) => {
      const studyId = getStudyId(req.params);
      if (!(await requireStudy(studyId))) return reply.code(404).send({ error: "study_not_found" });
      const actor = getActor(req);
      const config = deleteStudyAIConfigApiKey(studyId, actor.userId);

      await writeAuditEvent({
        actor,
        action: "ai_config.api_key.delete",
        object: { type: "study", id: studyId },
        details: { studyId, key_exists: false, provider_name: config.providerName, model_name: config.modelName },
      });

      return reply.send({ ai_config: toPublicAIConfig(config), validation: validateStudyAIConfig(config) });
    });

    app.post(`${prefix}/studies/:studyId/ai-config/validate`, { preHandler: viewConfig }, async (req, reply) => {
      const studyId = getStudyId(req.params);
      if (!(await requireStudy(studyId))) return reply.code(404).send({ error: "study_not_found" });
      const config = getStudyAIConfig(studyId);
      return reply.send({ validation: validateStudyAIConfig(config), ai_config: toPublicAIConfig(config) });
    });

    app.post(`${prefix}/studies/:studyId/ai-config/external-call-check`, { preHandler: viewConfig }, async (req, reply) => {
      const studyId = getStudyId(req.params);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const feature = featureFromBody(body.feature);
      if (!feature) return reply.code(400).send({ error: "invalid_ai_feature", allowed_features: AI_FEATURES });
      const actor = getActor(req);
      const payloadCheck = sanitizeExternalAIPayload(body.payload ?? {});
      if (!payloadCheck.ok) {
        const decision = await assertAIOperationAllowed({
          studyId,
          actor,
          feature,
          mode: "external",
          inputScopeIds: Array.isArray(body.inputScopeIds) ? body.inputScopeIds.map(String) : [],
          payload: body.payload ?? {},
        });
        return reply.code(decision.statusCode).send({ error: "ai_payload_direct_identifier_risk", details: payloadCheck.errors });
      }

      const decision = await assertAIOperationAllowed({
        studyId,
        actor,
        feature,
        mode: "external",
        inputScopeIds: Array.isArray(body.inputScopeIds) ? body.inputScopeIds.map(String) : [],
        payload: payloadCheck.value,
      });
      if (!decision.ok) return reply.code(decision.statusCode).send({ error: decision.error, details: decision.details ?? {} });
      return reply.send({ ok: true, provider_name: decision.providerName, model_name: decision.modelName });
    });
  }
}
