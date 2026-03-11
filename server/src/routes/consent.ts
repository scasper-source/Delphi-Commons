import type { FastifyInstance } from "fastify";
import {
  createConsentVersion,
  listConsentVersions,
  activateConsentVersion,
  getActiveConsentVersion,
  recordConsent,
  getConsentRecord,
  withdrawConsent,
} from "../stores/consentStore.js";
import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";

export async function consentRoutes(app: FastifyInstance) {
  const allowStaff = requireRole(["owner", "methods_steward"]);
  const allowParticipantOrStaff = requireRole(["participant", "owner", "methods_steward"]);

  app.post(
    "/studies/:studyId/versions/:versionId/consent-versions",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const body = (req.body ?? {}) as any;
      const actor = getActor(req);

      if (!body.text_md) {
        return reply.code(400).send({ error: "text_md_required" });
      }

      const rec = createConsentVersion({
        study_id: studyId,
        version_id: versionId,
        text_md: String(body.text_md),
      });

      await writeAuditEvent({
        actor,
        action: "consent_version.create",
        object: { type: "consent_version", id: rec.consent_version_id },
        details: { studyId, versionId },
      });

      return reply.code(201).send({ consent_version: rec });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/consent-versions",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const actor = getActor(req);

      const versions = listConsentVersions({
        study_id: studyId,
        version_id: versionId,
      });

      await writeAuditEvent({
        actor,
        action: "consent_version.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: versions.length },
      });

      return reply.send({ consent_versions: versions });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/consent-versions/:consentVersionId/activate",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId, consentVersionId } = req.params as any;
      const actor = getActor(req);

      const rec = activateConsentVersion({
        study_id: studyId,
        version_id: versionId,
        consent_version_id: consentVersionId,
      });

      if (!rec) {
        return reply.code(404).send({ error: "consent_version_not_found" });
      }

      await writeAuditEvent({
        actor,
        action: "consent_version.activate",
        object: { type: "consent_version", id: consentVersionId },
        details: { studyId, versionId },
      });

      return reply.send({ consent_version: rec });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/consent/active",
    { preHandler: allowParticipantOrStaff },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const actor = getActor(req);

      const active = getActiveConsentVersion({
        study_id: studyId,
        version_id: versionId,
      });

      await writeAuditEvent({
        actor,
        action: "consent_version.get_active",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, found: Boolean(active) },
      });

      if (!active) {
        return reply.code(404).send({ error: "active_consent_version_not_found" });
      }

      return reply.send({ consent_version: active });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/consent",
    { preHandler: allowParticipantOrStaff },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const body = (req.body ?? {}) as any;
      const actor = getActor(req);

      if (!body.participant_id) {
        return reply.code(400).send({ error: "participant_id_required" });
      }

      const active = getActiveConsentVersion({
        study_id: studyId,
        version_id: versionId,
      });

      if (!active) {
        return reply.code(400).send({ error: "active_consent_version_not_found" });
      }

      const rec = recordConsent({
        participant_id: String(body.participant_id),
        study_id: studyId,
        version_id: versionId,
        consent_version_id: active.consent_version_id,
      });

      await writeAuditEvent({
        actor,
        action: "consent.record",
        object: { type: "participant", id: rec.participant_id },
        details: {
          studyId,
          versionId,
          consent_version_id: rec.consent_version_id,
        },
      });

      return reply.code(201).send({ consent_record: rec });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/consent/:participantId",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);

      const rec = getConsentRecord({
        participant_id: participantId,
        study_id: studyId,
        version_id: versionId,
      });

      await writeAuditEvent({
        actor,
        action: "consent.get",
        object: { type: "participant", id: participantId },
        details: { studyId, versionId, found: Boolean(rec) },
      });

      if (!rec) {
        return reply.code(404).send({ error: "consent_record_not_found" });
      }

      return reply.send({ consent_record: rec });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/consent/:participantId/withdraw",
    { preHandler: allowParticipantOrStaff },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);

      const rec = withdrawConsent({
        participant_id: participantId,
        study_id: studyId,
        version_id: versionId,
      });

      if (!rec) {
        return reply.code(404).send({ error: "consent_record_not_found" });
      }

      await writeAuditEvent({
        actor,
        action: "consent.withdraw",
        object: { type: "participant", id: participantId },
        details: { studyId, versionId, withdrew_at: rec.withdrew_at },
      });

      return reply.send({ consent_record: rec });
    }
  );
}
