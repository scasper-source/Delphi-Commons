import type { FastifyInstance } from "fastify";
import {
  createParticipantMaster,
  listParticipantMasters,
  getParticipantMaster,
  updateParticipantMaster,
} from "../stores/participantMasterStore.js";
import {
  createParticipantInvitation,
  getInvitationByToken,
  listParticipantInvitations,
  markInvitationUsed,
  revokeInvitation,
} from "../stores/participantInvitationStore.js";

import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";
import { getStudy, getStudyVersion } from "../studies/store.js";
import {
  getActiveConsentVersion,
  getConsentRecord,
  hasActiveConsent,
  recordConsent,
  withdrawConsent,
} from "../stores/consentStore.js";
import { createResponse, listResponses } from "../stores/responseStore.js";
import { getRoundConfig } from "../stores/roundConfigStore.js";
import { getItem, listItems } from "../stores/itemStore.js";

export async function participantsRoutes(app: FastifyInstance) {
  const allowMasterList = requireRole(["owner", "methods_steward"]);

  function getFrontendOrigin(req: any): string {
    const origin = typeof req.headers.origin === "string" ? req.headers.origin : "http://127.0.0.1:5173";
    return origin.replace(/\/$/, "");
  }

  function invitationPublicPayload(invitation: NonNullable<ReturnType<typeof getInvitationByToken>>) {
    return {
      invitation_id: invitation.invitation_id,
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
      expires_at: invitation.expires_at,
    };
  }

  function getLatestRatingsForItem(itemId: string, roundNumber: number, responses: ReturnType<typeof listResponses>) {
    const latest = new Map<string, any>();
    for (const response of responses) {
      const payload = response.response_json as any;
      if (
        payload &&
        payload.round_number === roundNumber &&
        payload.item_id === itemId &&
        typeof payload.rating === "number"
      ) {
        latest.set(response.participant_id, response);
      }
    }
    return latest;
  }

  app.post(
    "/studies/:studyId/versions/:versionId/participants",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const body = (req.body ?? {}) as any;

      const actor = getActor(req);

      const participant = createParticipantMaster({
        name: body.name,
        email: body.email,
        created_by_user_id: actor.userId,
      });

      await writeAuditEvent({
        actor,
        action: "participant_master.create",
        object: { type: "participant_master", id: participant.participant_id },
        details: { studyId, versionId, participant_id: participant.participant_id },
      });

      return reply.code(201).send({ participant_id: participant.participant_id });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/participants",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const actor = getActor(req);

      const list = listParticipantMasters();

      await writeAuditEvent({
        actor,
        action: "participant_master.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: list.length },
      });

      return reply.send({ participants: list });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/participants/:participantId",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);

      const rec = getParticipantMaster(participantId);
      if (!rec) return reply.code(404).send({ error: "participant_not_found" });

      await writeAuditEvent({
        actor,
        action: "participant_master.get",
        object: { type: "participant_master", id: participantId },
        details: { studyId, versionId },
      });

      return reply.send({ participant: rec });
    }
  );

  app.patch(
    "/studies/:studyId/versions/:versionId/participants/:participantId",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as any;

      const updated = updateParticipantMaster(participantId, {
        name: body.name,
        email: body.email,
      });

      if (!updated) return reply.code(404).send({ error: "participant_not_found" });

      await writeAuditEvent({
        actor,
        action: "participant_master.update",
        object: { type: "participant_master", id: participantId },
        details: { studyId, versionId },
      });

      return reply.send({ participant: updated });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/participants/:participantId/invitations",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as { expires_at?: string };

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      const participant = getParticipantMaster(participantId);
      if (!participant) return reply.code(404).send({ error: "participant_not_found" });

      const { invitation, token } = createParticipantInvitation({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
        created_by_user_id: actor.userId,
        ...(body.expires_at ? { expires_at: body.expires_at } : {}),
      });
      const invitationUrl = `${getFrontendOrigin(req)}/?invite=${encodeURIComponent(token)}`;

      await writeAuditEvent({
        actor,
        action: "participant.invitation.create",
        object: { type: "participant_invitation", id: invitation.invitation_id },
        details: {
          studyId,
          versionId,
          participant_id: participantId,
          expires_at: invitation.expires_at,
        },
      });

      return reply.code(201).send({
        invitation: {
          invitation_id: invitation.invitation_id,
          participant_id: invitation.participant_id,
          expires_at: invitation.expires_at,
          revoked_at: invitation.revoked_at,
          last_used_at: invitation.last_used_at,
        },
        invitation_url: invitationUrl,
      });
    },
  );

  app.get(
    "/studies/:studyId/versions/:versionId/participants/:participantId/invitations",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);
      const invitations = listParticipantInvitations({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
      });

      await writeAuditEvent({
        actor,
        action: "participant.invitation.list",
        object: { type: "participant", id: participantId },
        details: { studyId, versionId, count: invitations.length },
      });

      return reply.send({
        invitations: invitations.map((invitation) => ({
          invitation_id: invitation.invitation_id,
          participant_id: invitation.participant_id,
          expires_at: invitation.expires_at,
          revoked_at: invitation.revoked_at,
          last_used_at: invitation.last_used_at,
        })),
      });
    },
  );

  app.delete(
    "/studies/:studyId/versions/:versionId/participants/:participantId/invitations/:invitationId",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId, invitationId } = req.params as any;
      const actor = getActor(req);
      const invitations = listParticipantInvitations({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
      });
      const invitation = invitations.find((entry) => entry.invitation_id === invitationId);
      if (!invitation) return reply.code(404).send({ error: "participant_invitation_not_found" });

      const revoked = revokeInvitation(invitationId);
      if (!revoked) return reply.code(404).send({ error: "participant_invitation_not_found" });

      await writeAuditEvent({
        actor,
        action: "participant.invitation.revoke",
        object: { type: "participant_invitation", id: invitationId },
        details: { studyId, versionId, participant_id: participantId },
      });

      return reply.send({
        invitation: {
          invitation_id: revoked.invitation_id,
          participant_id: revoked.participant_id,
          expires_at: revoked.expires_at,
          revoked_at: revoked.revoked_at,
          last_used_at: revoked.last_used_at,
        },
      });
    },
  );

  app.get("/participant/invitations/:token", async (req, reply) => {
    const { token } = req.params as any;
    const invitation = getInvitationByToken(String(token));
    if (!invitation) return reply.code(404).send({ error: "participant_invitation_not_found" });

    markInvitationUsed(invitation.invitation_id);
    const study = await getStudy(invitation.study_id);
    const studyVersion = await getStudyVersion(invitation.version_id);
    const activeConsent = getActiveConsentVersion({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
    });
    const consentRecord = getConsentRecord({
      participant_id: invitation.participant_id,
      study_id: invitation.study_id,
      version_id: invitation.version_id,
    });
    const roundConfigs = [1, 2, 3, 4]
      .map((roundNumber) => getRoundConfig({ study_id: invitation.study_id, version_id: invitation.version_id, round_number: roundNumber }))
      .filter(Boolean);

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "participant.invitation.open",
      object: { type: "participant_invitation", id: invitation.invitation_id },
      details: { studyId: invitation.study_id, versionId: invitation.version_id },
    });

    return reply.send({
      invitation: invitationPublicPayload(invitation),
      study,
      study_version: studyVersion,
      active_consent_version: activeConsent,
      consent_record: consentRecord,
      round_configs: roundConfigs,
    });
  });

  app.post("/participant/invitations/:token/consent", async (req, reply) => {
    const { token } = req.params as any;
    const invitation = getInvitationByToken(String(token));
    if (!invitation) return reply.code(404).send({ error: "participant_invitation_not_found" });

    const active = getActiveConsentVersion({ study_id: invitation.study_id, version_id: invitation.version_id });
    if (!active) return reply.code(400).send({ error: "active_consent_version_not_found" });

    const rec = recordConsent({
      participant_id: invitation.participant_id,
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      consent_version_id: active.consent_version_id,
    });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "consent.record",
      object: { type: "participant", id: rec.participant_id },
      details: { studyId: invitation.study_id, versionId: invitation.version_id, consent_version_id: rec.consent_version_id },
    });

    return reply.code(201).send({ consent_record: rec });
  });

  app.post("/participant/invitations/:token/withdraw", async (req, reply) => {
    const { token } = req.params as any;
    const invitation = getInvitationByToken(String(token));
    if (!invitation) return reply.code(404).send({ error: "participant_invitation_not_found" });

    const rec = withdrawConsent({
      participant_id: invitation.participant_id,
      study_id: invitation.study_id,
      version_id: invitation.version_id,
    });
    if (!rec) return reply.code(404).send({ error: "consent_record_not_found" });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "consent.withdraw",
      object: { type: "participant", id: rec.participant_id },
      details: { studyId: invitation.study_id, versionId: invitation.version_id, withdrew_at: rec.withdrew_at },
    });

    return reply.send({ consent_record: rec });
  });

  app.post("/participant/invitations/:token/responses", async (req, reply) => {
    const { token } = req.params as any;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const invitation = getInvitationByToken(String(token));
    if (!invitation) return reply.code(404).send({ error: "participant_invitation_not_found" });

    const roundOneConfig = getRoundConfig({ study_id: invitation.study_id, version_id: invitation.version_id, round_number: 1 });
    if (!roundOneConfig || roundOneConfig.status !== "Open") return reply.code(409).send({ error: "round1_not_open" });
    if (!hasActiveConsent({ participant_id: invitation.participant_id, study_id: invitation.study_id, version_id: invitation.version_id })) {
      return reply.code(403).send({ error: "active_consent_required" });
    }

    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) return reply.code(400).send({ error: "response_text_required" });

    const rec = createResponse({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
      response_json: { round_number: 1, text },
    });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "response.submit",
      object: { type: "response", id: rec.response_id },
      details: { studyId: invitation.study_id, versionId: invitation.version_id, participant_id: invitation.participant_id },
    });

    return reply.code(201).send({ response_id: rec.response_id });
  });

  app.get("/participant/invitations/:token/rounds/:roundNumber/items", async (req, reply) => {
    const { token, roundNumber: rawRoundNumber } = req.params as any;
    const invitation = getInvitationByToken(String(token));
    if (!invitation) return reply.code(404).send({ error: "participant_invitation_not_found" });
    const roundNumber = Number(rawRoundNumber);
    if (!Number.isInteger(roundNumber) || roundNumber < 2) return reply.code(400).send({ error: "rating_round_must_be_gte_2" });

    const roundConfig = getRoundConfig({ study_id: invitation.study_id, version_id: invitation.version_id, round_number: roundNumber });
    if (!roundConfig || roundConfig.status !== "Open") return reply.code(409).send({ error: "round_not_open" });

    const responses = listResponses({ study_id: invitation.study_id, version_id: invitation.version_id });
    const publishedItems = listItems({ study_id: invitation.study_id, version_id: invitation.version_id })
      .filter((item) => item.round_number === roundNumber && item.status === "Published");

    const items = publishedItems.map((item) => {
      const prior = getLatestRatingsForItem(item.item_id, roundNumber, responses).get(invitation.participant_id);
      const payload = prior?.response_json as any;
      return {
        item_id: item.item_id,
        text: item.text,
        round_number: item.round_number,
        provenance_type: item.provenance_type,
        your_prior_response: payload
          ? { rating: payload.rating, action: payload.action, submitted_at: prior.created_at }
          : null,
      };
    });

    return reply.send({ items });
  });

  app.post("/participant/invitations/:token/rounds/:roundNumber/ratings", async (req, reply) => {
    const { token, roundNumber: rawRoundNumber } = req.params as any;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const invitation = getInvitationByToken(String(token));
    if (!invitation) return reply.code(404).send({ error: "participant_invitation_not_found" });
    const roundNumber = Number(rawRoundNumber);
    if (!Number.isInteger(roundNumber) || roundNumber < 2) return reply.code(400).send({ error: "rating_round_must_be_gte_2" });

    const roundConfig = getRoundConfig({ study_id: invitation.study_id, version_id: invitation.version_id, round_number: roundNumber });
    if (!roundConfig || roundConfig.status !== "Open") return reply.code(409).send({ error: "round_not_open" });
    if (!hasActiveConsent({ participant_id: invitation.participant_id, study_id: invitation.study_id, version_id: invitation.version_id })) {
      return reply.code(403).send({ error: "active_consent_required" });
    }

    const itemId = String(body.item_id ?? "");
    const rating = Number(body.rating);
    const action = body.action === "keep" ? "keep" : "revise";
    if (!Number.isInteger(rating) || rating < 1 || rating > 9) return reply.code(400).send({ error: "rating_1_to_9_required" });

    const item = getItem(itemId);
    if (!item || item.study_id !== invitation.study_id || item.version_id !== invitation.version_id || item.round_number !== roundNumber || item.status !== "Published") {
      return reply.code(409).send({ error: "item_not_available_for_round_rating" });
    }

    const rec = createResponse({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
      response_json: { round_number: roundNumber, item_id: itemId, rating, action },
    });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "round.rating.submit",
      object: { type: "response", id: rec.response_id },
      details: { studyId: invitation.study_id, versionId: invitation.version_id, round_number: roundNumber, item_id: itemId },
    });

    return reply.code(201).send({ response_id: rec.response_id });
  });
}
