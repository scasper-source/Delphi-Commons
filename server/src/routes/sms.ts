/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FastifyInstance } from "fastify";
import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";
import { getServerConfig } from "../core/config.js";
import { getSmsProvider } from "../core/smsProvider.js";
import {
  auditSmsPolicyChange,
  buildMagicRoundContext,
  consumeMagicLinkToken,
  createSyntheticPhoneHandoffLink,
  magicSessionFromCookie,
  setMagicSessionCookie,
  sendRoundOpenSmsNotifications,
  startPhoneVerification,
  handleInboundSmsKeyword,
  updateDeliveryWebhook,
  updateParticipantSmsPreference,
  verifyPhoneOtp,
} from "../core/smsNotifications.js";
import {
  getContactPreference,
  getStudySmsPolicy,
  listSmsNotifications,
  publicContactPreference,
  upsertStudySmsPolicy,
} from "../stores/smsStore.js";
import { createResponse, listResponses } from "../stores/responseStore.js";
import { getRoundConfig } from "../stores/roundConfigStore.js";
import { getItem, listItems } from "../stores/itemStore.js";
import { buildParticipantControlledFeedback } from "../core/participantFeedback.js";
import { hasActiveConsent } from "../stores/consentStore.js";
import { participantCanSubmit } from "../stores/participantStatusStore.js";
import { getStudyVersion } from "../studies/store.js";
import { createDeletionRequest } from "../stores/deletionRequestStore.js";
import { createParticipantIssue, listParticipantIssuesForParticipant } from "../stores/participantIssueStore.js";
import { normalizeRoundOneResponsePayload } from "../studies/researchQuestions.js";

function frontendOrigin(req: any): string {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "http://127.0.0.1:5173";
  return origin.replace(/\/$/, "");
}

function registerUrlEncodedParser(app: FastifyInstance) {
  app.addContentTypeParser("application/x-www-form-urlencoded", { parseAs: "string" }, (_req, body, done) => {
    const parsed: Record<string, string> = {};
    for (const [key, value] of new URLSearchParams(String(body))) parsed[key] = value;
    done(null, parsed);
  });
}

function twilioSetupStatus() {
  const config = getServerConfig();
  const connectUrl = config.twilioConnectUrl ?? "https://console.twilio.com/us1/develop/sms/services";
  const required = {
    provider_twilio: config.smsProvider === "twilio",
    real_sms_enabled: config.realSmsEnabled,
    real_sms_acknowledged: config.realSmsAcknowledged,
    account_sid_configured: Boolean(config.twilioAccountSid),
    auth_token_configured: Boolean(config.twilioAuthToken),
    messaging_service_sid_configured: Boolean(config.twilioMessagingServiceSid),
    public_participant_origin_configured: Boolean(config.publicParticipantOrigin),
    webhook_base_url_configured: Boolean(config.twilioWebhookBaseUrl),
  };
  const ready = Object.values(required).every(Boolean);
  return {
    provider: config.smsProvider,
    real_sms_enabled: config.realSmsEnabled,
    real_sms_acknowledged: config.realSmsAcknowledged,
    ready_for_real_sms_attempt: ready,
    connect_url: connectUrl,
    messaging_service_console_url: "https://console.twilio.com/us1/develop/sms/services",
    required,
    public_participant_origin_configured: Boolean(config.publicParticipantOrigin),
    webhook_base_url_configured: Boolean(config.twilioWebhookBaseUrl),
    status_callback_configured: Boolean(config.twilioStatusCallbackUrl || config.twilioWebhookBaseUrl),
    account_sid_configured: Boolean(config.twilioAccountSid),
    auth_token_configured: Boolean(config.twilioAuthToken),
    messaging_service_sid_configured: Boolean(config.twilioMessagingServiceSid),
  };
}

function participantActor(participantId: string) {
  return { userId: participantId, role: "participant", systemRoles: ["participant" as any], authSource: "invitation" as const };
}

function getMagicSessionOrReply(req: any, reply: any) {
  const session = magicSessionFromCookie(req.headers.cookie);
  if (!session) {
    reply.code(401).send({ error: "secure_link_session_required" });
    return null;
  }
  return session;
}

function ratingPayload(value: unknown, roundNumber: number) {
  const payload = value as any;
  if (
    payload &&
    payload.round_number === roundNumber &&
    typeof payload.item_id === "string" &&
    typeof payload.rating === "number"
  ) {
    return payload;
  }
  return null;
}

function latestRatingsForItem(itemId: string, roundNumber: number, responses: ReturnType<typeof listResponses>) {
  const latest = new Map<string, any>();
  for (const response of responses) {
    const payload = ratingPayload(response.response_json, roundNumber);
    if (payload?.item_id === itemId) latest.set(response.participant_id, response);
  }
  return latest;
}

export async function smsRoutes(app: FastifyInstance) {
  registerUrlEncodedParser(app);
  const allowStaff = requireRole(["owner", "methods_steward", "privacy_lead", "admin"]);

  app.get("/sms/setup-status", { preHandler: allowStaff }, async () => {
    return { setup: twilioSetupStatus() };
  });

  app.get("/studies/:studyId/versions/:versionId/sms-policy", { preHandler: allowStaff }, async (req, reply) => {
    const { studyId, versionId } = req.params as any;
    const actor = getActor(req);
    const policy = getStudySmsPolicy({ study_id: studyId, version_id: versionId }, actor.userId, getServerConfig().magicLinkTtlMinutes);
    return reply.send({ policy });
  });

  app.put("/studies/:studyId/versions/:versionId/sms-policy", { preHandler: allowStaff }, async (req, reply) => {
    const { studyId, versionId } = req.params as any;
    const actor = getActor(req);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const ttl = Math.min(Math.max(1, Number(body.magic_link_ttl_minutes ?? getServerConfig().magicLinkTtlMinutes)), 24 * 60);
    const policy = upsertStudySmsPolicy({
      study_id: studyId,
      version_id: versionId,
      sms_enabled: Boolean(body.sms_enabled),
      notification_safe_name: typeof body.notification_safe_name === "string" ? body.notification_safe_name.trim().slice(0, 80) : null,
      safe_name_is_sensitive: Boolean(body.safe_name_is_sensitive),
      magic_link_ttl_minutes: ttl,
      updated_by_user_id: actor.userId,
    });
    await auditSmsPolicyChange({ policy, actor_user_id: actor.userId });
    return reply.send({ policy });
  });

  app.get(
    "/studies/:studyId/versions/:versionId/participants/:participantId/contact-preferences",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { participantId } = req.params as any;
      return reply.send({ contact_preference: publicContactPreference(getContactPreference(participantId)) });
    },
  );

  app.patch(
    "/studies/:studyId/versions/:versionId/participants/:participantId/contact-preferences",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { participantId } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;
      try {
        const input: Parameters<typeof updateParticipantSmsPreference>[0] = {
          participant_id: participantId,
          notification_preference: body.notification_preference,
          actor_user_id: actor.userId,
        };
        if (typeof body.phone === "string") input.phone = body.phone;
        if (typeof body.sms_consent_granted === "boolean") input.sms_consent_granted = body.sms_consent_granted;
        const contactPreference = await updateParticipantSmsPreference(input);
        return reply.send({ contact_preference: contactPreference });
      } catch (error) {
        return reply.code(400).send({ error: error instanceof Error ? error.message : "contact_preference_update_failed" });
      }
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/participants/:participantId/rounds/:roundNumber/synthetic-phone-handoff",
    { preHandler: allowStaff },
    async (req, reply) => {
      const config = getServerConfig();
      if (!config.lanParticipantModeEnabled) return reply.code(403).send({ error: "lan_synthetic_mode_not_enabled" });
      const { studyId, versionId, participantId, roundNumber: rawRoundNumber } = req.params as any;
      const roundNumber = Number(rawRoundNumber);
      if (!Number.isInteger(roundNumber) || roundNumber < 1) return reply.code(400).send({ error: "round_number_required" });
      const actor = getActor(req);
      const handoff = await createSyntheticPhoneHandoffLink({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
        round_number: roundNumber,
        actor_user_id: actor.userId,
        frontend_origin: config.lanParticipantOrigin ?? frontendOrigin(req),
      });
      return reply.code(201).send({ handoff });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/participants/:participantId/phone-verification/start",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { participantId } = req.params as any;
      const actor = getActor(req);
      try {
        const challenge = await startPhoneVerification({ participant_id: participantId, actor_user_id: actor.userId });
        return reply.code(201).send(challenge);
      } catch (error) {
        return reply.code(400).send({ error: error instanceof Error ? error.message : "phone_verification_start_failed" });
      }
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/participants/:participantId/phone-verification/verify",
    { preHandler: allowStaff },
    async (req, reply) => {
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;
      try {
        const contactPreference = await verifyPhoneOtp({
          challenge_id: String(body.challenge_id ?? ""),
          otp: String(body.otp ?? ""),
          actor_user_id: actor.userId,
        });
        return reply.send({ contact_preference: contactPreference });
      } catch (error) {
        return reply.code(400).send({ error: error instanceof Error ? error.message : "phone_verification_failed" });
      }
    },
  );

  app.get("/studies/:studyId/versions/:versionId/sms-notifications", { preHandler: allowStaff }, async (req, reply) => {
    const { studyId, versionId } = req.params as any;
    const query = (req.query ?? {}) as Record<string, unknown>;
    const roundNumber = query.round_number ? Number(query.round_number) : undefined;
    const filter: Parameters<typeof listSmsNotifications>[0] = { study_id: studyId, version_id: versionId };
    if (Number.isInteger(roundNumber)) filter.round_number = Number(roundNumber);
    return reply.send({ notifications: listSmsNotifications(filter) });
  });

  app.post(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/sms/send",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId, roundNumber: rawRoundNumber } = req.params as any;
      const actor = getActor(req);
      const roundNumber = Number(rawRoundNumber);
      if (!Number.isInteger(roundNumber) || roundNumber < 1) return reply.code(400).send({ error: "round_number_required" });
      const result = await sendRoundOpenSmsNotifications({
        study_id: studyId,
        version_id: versionId,
        round_number: roundNumber,
        actor_user_id: actor.userId,
        frontend_origin: frontendOrigin(req),
      });
      return reply.send({ sms: result });
    },
  );

  app.post("/sms/webhook", async (req, reply) => {
    const ok = await updateDeliveryWebhook({ req });
    if (!ok) return reply.code(401).send({ error: "invalid_sms_webhook" });
    return reply.send({ ok: true });
  });

  app.post("/sms/twilio/inbound", async (req, reply) => {
    const provider = getSmsProvider();
    if (provider.name !== "twilio") return reply.code(404).send({ error: "twilio_sms_not_enabled" });
    if (!provider.verifyWebhookSignature(req)) return reply.code(401).send({ error: "invalid_twilio_webhook" });
    const inbound = provider.parseInboundWebhook(req);
    if (!inbound) return reply.code(400).send({ error: "invalid_twilio_inbound_sms" });
    const result = await handleInboundSmsKeyword({
      from_phone: inbound.from,
      message_text: inbound.body,
      actor_user_id: "sms-twilio-inbound",
      source: "twilio",
      provider_message_id: inbound.providerMessageId,
      opt_out_type: inbound.optOutType,
    });
    reply.header("Content-Type", "text/xml");
    if (!result.ok && result.reason !== "contact_preference_not_found") {
      return reply.code(400).send("<Response></Response>");
    }
    return reply.send("<Response></Response>");
  });

  app.post("/sms/mock/inbound-keyword", { preHandler: allowStaff }, async (req, reply) => {
    const actor = getActor(req);
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await handleInboundSmsKeyword({
      from_phone: String(body.from_phone ?? ""),
      message_text: String(body.message_text ?? ""),
      actor_user_id: actor.userId,
    });
    if (!result.ok) return reply.code(400).send({ error: result.reason ?? "mock_inbound_keyword_failed" });
    return reply.send({ inbound: result });
  });

  app.post("/magic-links/consume", async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const result = await consumeMagicLinkToken({ token: String(body.token ?? "") });
    if (!result) {
      return reply.code(410).send({
        error: "secure_link_unavailable",
        message: "This secure link has expired or has already been used.",
      });
    }
    setMagicSessionCookie(reply, result.session_token, result.expires_at);
    return reply.send({ context: result.context });
  });

  app.get("/magic-links/session", async (req, reply) => {
    const session = getMagicSessionOrReply(req, reply);
    if (!session) return;
    const context = await buildMagicRoundContext(session);
    return reply.send({ context });
  });

  app.get("/magic-links/rounds/:roundNumber/items", async (req, reply) => {
    const session = getMagicSessionOrReply(req, reply);
    if (!session) return;
    const roundNumber = Number((req.params as any).roundNumber);
    if (!Number.isInteger(roundNumber) || roundNumber !== session.round_number || roundNumber < 2) {
      return reply.code(403).send({ error: "round_unavailable" });
    }
    const roundConfig = getRoundConfig({ study_id: session.study_id, version_id: session.version_id, round_number: roundNumber });
    if (!roundConfig || roundConfig.status !== "Open") return reply.code(409).send({ error: "round_not_open" });

    const responses = listResponses({ study_id: session.study_id, version_id: session.version_id });
    const items = listItems({ study_id: session.study_id, version_id: session.version_id })
      .filter((item) => item.round_number === roundNumber && item.status === "Published")
      .map((item) => {
        const prior = latestRatingsForItem(item.item_id, roundNumber, responses).get(session.participant_id);
        const payload = prior ? ratingPayload(prior.response_json, roundNumber) : null;
        return {
          item_id: item.item_id,
          text: item.text,
          round_number: item.round_number,
          provenance_type: item.provenance_type,
          your_prior_response: payload
            ? { rating: payload.rating, action: payload.action, submitted_at: prior.created_at }
            : null,
          controlled_feedback: buildParticipantControlledFeedback({
            item,
            responses,
            roundNumber,
            participantId: session.participant_id,
            feedbackConfig: roundConfig.feedback_config,
          }),
        };
      });
    return reply.send({ items });
  });

  app.post("/magic-links/rounds/:roundNumber/responses", async (req, reply) => {
    const session = getMagicSessionOrReply(req, reply);
    if (!session) return;
    const roundNumber = Number((req.params as any).roundNumber);
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (roundNumber !== 1 || session.round_number !== 1) return reply.code(403).send({ error: "round_unavailable" });
    const roundConfig = getRoundConfig({ study_id: session.study_id, version_id: session.version_id, round_number: 1 });
    if (!roundConfig || roundConfig.status !== "Open") return reply.code(409).send({ error: "round1_not_open" });
    if (!hasActiveConsent({ participant_id: session.participant_id, study_id: session.study_id, version_id: session.version_id })) {
      return reply.code(403).send({ error: "active_consent_required" });
    }
    if (!participantCanSubmit({ ...session, round_number: 1 })) return reply.code(403).send({ error: "participant_inactive_or_withdrawn_for_round" });
    const studyVersion = await getStudyVersion(session.version_id);
    if (!studyVersion || studyVersion.study_id !== session.study_id) {
      return reply.code(404).send({ error: "study_version_not_found" });
    }
    const normalizedRoundOne = normalizeRoundOneResponsePayload(body, studyVersion.study_design_packet_json);
    if (!normalizedRoundOne.ok) return reply.code(400).send({ error: normalizedRoundOne.error });
    const rec = createResponse({
      study_id: session.study_id,
      version_id: session.version_id,
      participant_id: session.participant_id,
      response_json: normalizedRoundOne.payload,
    });
    await writeAuditEvent({
      actor: participantActor(session.participant_id),
      action: "round_completed",
      object: { type: "response", id: rec.response_id },
      details: { studyId: session.study_id, versionId: session.version_id, round_number: 1 },
    });
    return reply.code(201).send({ response_id: rec.response_id });
  });

  app.post("/magic-links/rounds/:roundNumber/ratings", async (req, reply) => {
    const session = getMagicSessionOrReply(req, reply);
    if (!session) return;
    const roundNumber = Number((req.params as any).roundNumber);
    const body = (req.body ?? {}) as Record<string, unknown>;
    if (!Number.isInteger(roundNumber) || roundNumber !== session.round_number || roundNumber < 2) {
      return reply.code(403).send({ error: "round_unavailable" });
    }
    const version = await getStudyVersion(session.version_id);
    const roundConfig = getRoundConfig({ study_id: session.study_id, version_id: session.version_id, round_number: roundNumber });
    if (!version || !roundConfig || roundConfig.status !== "Open") return reply.code(409).send({ error: "round_not_open" });
    if (!hasActiveConsent({ participant_id: session.participant_id, study_id: session.study_id, version_id: session.version_id })) {
      return reply.code(403).send({ error: "active_consent_required" });
    }
    if (!participantCanSubmit({ ...session, round_number: roundNumber })) return reply.code(403).send({ error: "participant_inactive_or_withdrawn_for_round" });
    const itemId = String(body.item_id ?? "");
    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 9) return reply.code(400).send({ error: "rating_1_to_9_required" });
    const item = getItem(itemId);
    if (!item || item.study_id !== session.study_id || item.version_id !== session.version_id || item.round_number !== roundNumber || item.status !== "Published") {
      return reply.code(409).send({ error: "item_not_available_for_round_rating" });
    }
    const rec = createResponse({
      study_id: session.study_id,
      version_id: session.version_id,
      participant_id: session.participant_id,
      response_json: {
        round_number: roundNumber,
        item_id: itemId,
        rating,
        action: body.action === "keep" ? "keep" : "revise",
        ...(typeof body.rationale_text === "string" && body.rationale_text.trim()
          ? { rationale_text: body.rationale_text.trim().slice(0, 4000) }
          : {}),
      },
    });
    await writeAuditEvent({
      actor: participantActor(session.participant_id),
      action: "round_completed",
      object: { type: "response", id: rec.response_id },
      details: { studyId: session.study_id, versionId: session.version_id, round_number: roundNumber, item_id: itemId },
    });
    return reply.code(201).send({ response_id: rec.response_id });
  });

  app.post("/magic-links/rounds/:roundNumber/decline", async (req, reply) => {
    const session = getMagicSessionOrReply(req, reply);
    if (!session) return;
    const roundNumber = Number((req.params as any).roundNumber);
    if (roundNumber !== session.round_number) return reply.code(403).send({ error: "round_unavailable" });
    await writeAuditEvent({
      actor: participantActor(session.participant_id),
      action: "round_declined",
      object: { type: "participant", id: session.participant_id },
      details: { studyId: session.study_id, versionId: session.version_id, round_number: roundNumber },
    });
    return reply.send({ declined: true });
  });

  app.post("/magic-links/withdrawal-info-viewed", async (req, reply) => {
    const session = getMagicSessionOrReply(req, reply);
    if (!session) return;
    await writeAuditEvent({
      actor: participantActor(session.participant_id),
      action: "withdrawal_info_viewed",
      object: { type: "participant", id: session.participant_id },
      details: { studyId: session.study_id, versionId: session.version_id, round_number: session.round_number },
    });
    return reply.send({ ok: true });
  });

  app.post("/magic-links/deletion-request", async (req, reply) => {
    const session = getMagicSessionOrReply(req, reply);
    if (!session) return;
    const request = createDeletionRequest({
      study_id: session.study_id,
      version_id: session.version_id,
      participant_id: session.participant_id,
      requested_by: "participant",
      request_text: "Participant requested review from mobile magic-link entry.",
    });
    return reply.code(201).send({ deletion_request: request });
  });

  app.post("/magic-links/issues", async (req, reply) => {
    const session = getMagicSessionOrReply(req, reply);
    if (!session) return;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const issue = createParticipantIssue({
      study_id: session.study_id,
      version_id: session.version_id,
      participant_id: session.participant_id,
      round_number: body.round_number ?? session.round_number,
      page_context: body.page_context,
      issue_type: body.issue_type,
      note: body.note,
      created_by: "magic_link",
    });

    await writeAuditEvent({
      actor: participantActor(session.participant_id),
      action: "participant_issue.create",
      object: { type: "participant_issue", id: issue.issue_id },
      details: {
        studyId: session.study_id,
        versionId: session.version_id,
        participant_alias: issue.participant_alias,
        round_number: issue.round_number,
        page_context: issue.page_context,
        issue_type: issue.issue_type,
      },
    });

    return reply.code(201).send({ issue });
  });

  app.get("/magic-links/issues", async (req, reply) => {
    const session = getMagicSessionOrReply(req, reply);
    if (!session) return;
    const issues = listParticipantIssuesForParticipant({
      study_id: session.study_id,
      version_id: session.version_id,
      participant_id: session.participant_id,
    });

    return reply.send({ issues });
  });
}
