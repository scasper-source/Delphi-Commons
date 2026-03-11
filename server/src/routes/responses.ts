import type { FastifyInstance } from "fastify";
import { createResponse, listResponses } from "../stores/responseStore.js";
import { hasActiveConsent } from "../stores/consentStore.js";
import { getStudyVersion } from "../studies/store.js";

import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";

export async function responsesRoutes(app: FastifyInstance) {
  const allowSubmit = requireRole(["participant", "owner", "methods_steward"]);
  const allowStaffRead = requireRole(["owner", "methods_steward"]);

  app.post(
    "/studies/:studyId/versions/:versionId/responses",
    { preHandler: allowSubmit },
    async (req, reply) => {
      const params = (req.params ?? {}) as any;
      const studyId =
        String(params.studyId ?? params.study_id ?? params.studyid ?? params.STUDYID ?? params.study ?? "");
      const versionId =
        String(params.versionId ?? params.version_id ?? params.versionid ?? params.VERSIONID ?? params.version ?? params.id ?? "");
      const body = (req.body ?? {}) as any;

      const actor = getActor(req);

      if (!body.participant_id) {
        return reply.code(400).send({ error: "participant_id_required" });
      }

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      if (studyVersion.opened_round1_at === null) {
        await writeAuditEvent({
          actor,
          action: "response.submit_blocked_round1_not_open",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: {
            studyId,
            versionId,
            participant_id: String(body.participant_id),
          },
        });

        return reply.code(409).send({ error: "round1_not_open" });
      }

      const consentOk = hasActiveConsent({
        participant_id: String(body.participant_id),
        study_id: studyId,
        version_id: versionId,
      });

      if (!consentOk) {
        await writeAuditEvent({
          actor,
          action: "response.submit_blocked_no_active_consent",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: {
            studyId,
            versionId,
            participant_id: String(body.participant_id),
          },
        });

        return reply.code(403).send({ error: "active_consent_required" });
      }

      const rec = createResponse({
        study_id: studyId,
        version_id: versionId,
        participant_id: body.participant_id,
        response_json: body.response_json ?? {},
      });

      await writeAuditEvent({
        actor,
        action: "response.submit",
        object: { type: "response", id: rec.response_id },
        details: { studyId, versionId, participant_id: rec.participant_id },
      });

      return reply.code(201).send({ response_id: rec.response_id });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/responses",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const params = (req.params ?? {}) as any;
      const studyId =
        String(params.studyId ?? params.study_id ?? params.studyid ?? params.STUDYID ?? params.study ?? "");
      const versionId =
        String(params.versionId ?? params.version_id ?? params.versionid ?? params.VERSIONID ?? params.version ?? params.id ?? "");
      const actor = getActor(req);

      const list = listResponses({ study_id: studyId, version_id: versionId });

      await writeAuditEvent({
        actor,
        action: "response.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: list.length },
      });

      return reply.send({ responses: list });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/response-summary",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const params = (req.params ?? {}) as any;
      const studyId =
        String(params.studyId ?? params.study_id ?? params.studyid ?? params.STUDYID ?? params.study ?? "");
      const versionId =
        String(params.versionId ?? params.version_id ?? params.versionid ?? params.VERSIONID ?? params.version ?? params.id ?? "");
      const actor = getActor(req);

      const list = listResponses({ study_id: studyId, version_id: versionId });
      const uniqueParticipantCount = new Set(list.map((r) => r.participant_id)).size;

      await writeAuditEvent({
        actor,
        action: "response.summary",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          response_count: list.length,
          unique_participant_count: uniqueParticipantCount,
        },
      });

      return reply.send({
        study_id: studyId,
        version_id: versionId,
        response_count: list.length,
        unique_participant_count: uniqueParticipantCount,
      });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/reminders/log",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const params = (req.params ?? {}) as any;
      const studyId =
        String(params.studyId ?? params.study_id ?? params.studyid ?? params.STUDYID ?? params.study ?? "");
      const versionId =
        String(params.versionId ?? params.version_id ?? params.versionid ?? params.VERSIONID ?? params.version ?? params.id ?? "");
      const actor = getActor(req);
      const body = (req.body ?? {}) as any;

      await writeAuditEvent({
        actor,
        action: "response.reminder_logged",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          channel: String(body.channel ?? "manual"),
          note: String(body.note ?? ""),
        },
      });

      return reply.code(201).send({
        ok: true,
        logged: true,
        study_id: studyId,
        version_id: versionId,
        channel: String(body.channel ?? "manual"),
      });
    }
  );
}
