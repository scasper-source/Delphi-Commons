/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const runtimeRoot = path.join(
  serverRoot,
  "data",
  "test-runtime",
  `sms-${Date.now()}-${Math.random().toString(16).slice(2)}`,
);

process.env.EDELPHI_DATA_DIR ??= path.join(runtimeRoot, "data");
process.env.EDELPHI_AUDIT_DIR ??= path.join(runtimeRoot, "audit");
process.env.EDELPHI_BACKUP_DIR ??= path.join(runtimeRoot, "backups");
process.env.EDELPHI_AI_KEY_ENCRYPTION_SECRET ??= "test-only-ai-key-encryption-secret-for-sms";

const Fastify = (await import("fastify")).default;
const { getServerConfig } = await import("../dist/core/config.js");
const { registerSecurity, resetRateLimitsForTests } = await import("../dist/core/security.js");
const { authRoutes } = await import("../dist/routes/auth.js");
const { adminRoutes } = await import("../dist/routes/admin.js");
const { studiesRoutes } = await import("../dist/studies/routes.js");
const { participantsRoutes } = await import("../dist/routes/participants.js");
const { responsesRoutes } = await import("../dist/routes/responses.js");
const { consentRoutes } = await import("../dist/routes/consent.js");
const { itemsRoutes } = await import("../dist/routes/items.js");
const { reportsRoutes } = await import("../dist/routes/reports.js");
const { finalResultsRoutes } = await import("../dist/routes/finalResults.js");
const { smsRoutes } = await import("../dist/routes/sms.js");
const { aiConfigRoutes } = await import("../dist/routes/aiConfig.js");
const { aiRoutes } = await import("../dist/routes/ai.js");
const { createStudy, createStudyVersion } = await import("../dist/studies/store.js");
const { createParticipantMaster } = await import("../dist/stores/participantMasterStore.js");
const { ensureParticipantEnrollment } = await import("../dist/stores/participantStatusStore.js");
const { createConsentVersion, activateConsentVersion, recordConsent } = await import("../dist/stores/consentStore.js");
const { upsertRoundConfig } = await import("../dist/stores/roundConfigStore.js");
const { mockSmsOutbox, clearMockSmsOutbox } = await import("../dist/core/smsProvider.js");
const { getDatabase } = await import("../dist/core/database.js");
const { hashSecret, sendRoundOpenSmsNotifications } = await import("../dist/core/smsNotifications.js");
const { listSmsNotifications, markPhoneVerified, upsertContactPreference, upsertStudySmsPolicy } = await import("../dist/stores/smsStore.js");

const owner = { "x-user-id": "owner-1", "x-user-role": "owner" };
const analyst = { "x-user-id": "analyst-1", "x-user-role": "analyst" };

async function buildApp() {
  resetRateLimitsForTests();
  clearMockSmsOutbox();
  const config = getServerConfig();
  const app = Fastify({ logger: false, bodyLimit: config.bodyLimitBytes });
  registerSecurity(app, config);
  await app.register(authRoutes);
  await app.register(adminRoutes);
  await studiesRoutes(app);
  await app.register(participantsRoutes);
  await app.register(responsesRoutes);
  await app.register(consentRoutes);
  await app.register(itemsRoutes);
  await app.register(reportsRoutes);
  await app.register(finalResultsRoutes);
  await app.register(smsRoutes);
  await app.register(aiConfigRoutes);
  await app.register(aiRoutes);
  return app;
}

async function injectJson(app, options) {
  const response = await app.inject({ ...options, payload: options.body });
  const body = response.body ? response.json() : null;
  return { response, body };
}

async function expectStatus(app, options, statusCode) {
  const result = await injectJson(app, options);
  assert.equal(result.response.statusCode, statusCode, `${options.method} ${options.url}: ${result.response.body}`);
  return result;
}

test("round_open_sms_magic_link_mobile_entry sends neutral opt-in SMS and uses opaque single-use magic link", async (t) => {
  const app = await buildApp();
  t.after(async () => {
    await app.close();
  });

  const now = new Date().toISOString();
  const studyId = "sms-study-1";
  const versionId = "sms-version-1";
  await createStudy(
    {
      id: studyId,
      title: "Care Transitions Expert Delphi",
      description: "A mobile smoke test for secure round entry.",
      created_by: "owner-1",
      created_at: now,
    },
    { study_id: studyId, user_id: "owner-1", role: "Owner", created_at: now },
  );
  await createStudyVersion({
    id: versionId,
    study_id: studyId,
    version_number: 1,
    status: "Active",
    study_format: "ModifiedDelphi",
    planned_round_count: 3,
    terminal_round_number: 3,
    method_rationale: "Structured expert judgement across rounds.",
    consensus_rule_json: { threshold: 80, agreement_min_rating: 7 },
    feedback_config_json: null,
    retention_policy_json: null,
    study_design_packet_json: {
      researchQuestion: "What should this panel consider?",
      researchQuestions: [{
        id: "rq-sms-1",
        displayOrder: 1,
        text: "What should this panel consider?",
        shortLabel: "Research question 1",
        description: "",
        requiredForRound1Response: true,
        active: true,
        createdAt: now,
        updatedAt: now,
      }],
    },
    config_hash: "sms-test-config",
    opened_round1_at: null,
    created_by: "owner-1",
    created_at: now,
  });
  upsertRoundConfig({
    study_id: studyId,
    version_id: versionId,
    round_number: 1,
    task_type: "open_text",
    title: "Round 1: Open-ended elicitation",
    prompt: "What should this panel consider?",
    participant_instructions: "Provide independent judgement. There are no correct answers.",
    response_window_days: 7,
    reminder_subject: "Round 1 is open",
    reminder_body: "Participation remains voluntary.",
    controlled_feedback_enabled: false,
    ai_curation_enabled: false,
    feedback_config: null,
    status: "Ready",
  });
  const participant = createParticipantMaster({
    name: "SMS Participant",
    email: "sms-participant@example.test",
    created_by_user_id: "owner-1",
  });
  ensureParticipantEnrollment({
    study_id: studyId,
    version_id: versionId,
    participant_id: participant.participant_id,
    created_by_user_id: "owner-1",
  });
  const consentVersion = createConsentVersion({
    study_id: studyId,
    version_id: versionId,
    text_md: "Consent includes optional SMS study text reminders.",
  });
  activateConsentVersion({ study_id: studyId, version_id: versionId, consent_version_id: consentVersion.consent_version_id });
  recordConsent({
    participant_id: participant.participant_id,
    study_id: studyId,
    version_id: versionId,
    consent_version_id: consentVersion.consent_version_id,
  });

  await expectStatus(
    app,
    {
      method: "PUT",
      url: `/studies/${studyId}/versions/${versionId}/sms-policy`,
      headers: owner,
      body: { sms_enabled: true, notification_safe_name: "Care Delphi", magic_link_ttl_minutes: 60 },
    },
    200,
  );
  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/participants/${participant.participant_id}/contact-preferences`,
      headers: owner,
      body: { notification_preference: "both", phone: "+1 555 010 1234", sms_consent_granted: true },
    },
    200,
  );
  const challenge = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/participants/${participant.participant_id}/phone-verification/start`,
      headers: owner,
      body: {},
    },
    201,
  );
  assert.equal(challenge.body.masked_phone, "***-***-1234");
  assert.match(challenge.body.dev_otp, /^\d{6}$/);
  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/participants/${participant.participant_id}/phone-verification/verify`,
      headers: owner,
      body: { challenge_id: challenge.body.challenge_id, otp: challenge.body.dev_otp },
    },
    200,
  );

  const opened = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/1/open`,
      headers: owner,
      body: {},
    },
    200,
  );
  assert.equal(opened.body.sms.sent, 1);
  assert.equal(mockSmsOutbox.length, 1);
  const sms = mockSmsOutbox[0];
  assert.match(sms.body, /^Delphi study update: your secure session link is ready:/);
  assert.match(sms.body, /Participation is optional\./);
  assert.match(sms.body, /Reply HELP for support or STOP to opt out\./);
  assert.doesNotMatch(sms.body.toLowerCase(), /you must respond|consensus depends on you|align with the group/);
  const linkMatch = sms.body.match(/http:\/\/127\.0\.0\.1:5173\/m\/([A-Za-z0-9_-]+)/);
  assert.ok(linkMatch, "SMS includes opaque /m/{token} link");
  const token = linkMatch[1];
  assert.doesNotMatch(token, new RegExp(participant.participant_id));
  assert.doesNotMatch(sms.body, new RegExp(`${studyId}|${versionId}|${participant.email}`));
  assert.doesNotMatch(sms.body, /[?&](participant|study|email|phone|role)=/i);
  assert.doesNotMatch(sms.body, /5550101234|\+15550101234/);

  const tokenRows = getDatabase().prepare("SELECT token_hash FROM magic_link_tokens").all();
  assert.equal(tokenRows.length, 1);
  assert.notEqual(tokenRows[0].token_hash, token);

  const resendAttempt = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/1/sms/send`,
      headers: owner,
      body: {},
    },
    200,
  );
  assert.equal(resendAttempt.body.sms.sent, 0);
  assert.equal(mockSmsOutbox.length, 1);
  const activeTokenCount = getDatabase()
    .prepare("SELECT COUNT(*) as c FROM magic_link_tokens WHERE participant_id = ? AND study_id = ? AND version_id = ? AND round_number = 1 AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at > datetime('now')")
    .get(participant.participant_id, studyId, versionId).c;
  assert.equal(activeTokenCount, 1);

  const consumed = await expectStatus(
    app,
    {
      method: "POST",
      url: "/magic-links/consume",
      body: { token },
    },
    200,
  );
  assert.equal(consumed.body.context.round.round_number, 1);
  assert.equal(consumed.body.context.round.status, "open");
  assert.match(consumed.body.context.voluntary_reminder, /withdraw/);
  const setCookie = consumed.response.headers["set-cookie"];
  assert.match(String(setCookie), /edelphi_magic_session=/);

  await expectStatus(app, { method: "POST", url: "/magic-links/consume", body: { token } }, 410);

  const cookieHeader = Array.isArray(setCookie)
    ? setCookie.map((cookie) => cookie.split(";")[0]).join("; ")
    : String(setCookie).split(";")[0];
  const submitted = await expectStatus(
    app,
    {
      method: "POST",
      url: "/magic-links/rounds/1/responses",
      headers: { cookie: cookieHeader },
      body: { text: "A clear transition plan matters." },
    },
    201,
  );
  assert.ok(submitted.body.response_id);

  const auditRows = getDatabase().prepare("SELECT event_json FROM audit_events").all();
  const auditRaw = JSON.stringify(auditRows);
  assert.match(auditRaw, /round_open_sms_sent/);
  assert.match(auditRaw, /magic_link_used/);
  assert.doesNotMatch(auditRaw, new RegExp(token));
  assert.doesNotMatch(auditRaw, /5550101234|\+15550101234/);
  assert.doesNotMatch(auditRaw, new RegExp(challenge.body.dev_otp));
  assert.doesNotMatch(auditRaw, /\"participantId\"\s*:/);
  assert.doesNotMatch(auditRaw, /\"participant_id\"\s*:/);

});

test("twilio public link configuration failures mark each SMS notification failed", async (t) => {
  const originalSmsProvider = process.env.EDELPHI_SMS_PROVIDER;
  const originalPublicParticipantOrigin = process.env.EDELPHI_PUBLIC_PARTICIPANT_ORIGIN;
  process.env.EDELPHI_SMS_PROVIDER = "twilio";
  delete process.env.EDELPHI_PUBLIC_PARTICIPANT_ORIGIN;
  t.after(() => {
    if (originalSmsProvider === undefined) delete process.env.EDELPHI_SMS_PROVIDER;
    else process.env.EDELPHI_SMS_PROVIDER = originalSmsProvider;
    if (originalPublicParticipantOrigin === undefined) delete process.env.EDELPHI_PUBLIC_PARTICIPANT_ORIGIN;
    else process.env.EDELPHI_PUBLIC_PARTICIPANT_ORIGIN = originalPublicParticipantOrigin;
  });

  const now = new Date().toISOString();
  const studyId = "sms-study-twilio-link-config";
  const versionId = "sms-version-twilio-link-config";
  await createStudy(
    {
      id: studyId,
      title: "Twilio Link Config Study",
      description: "Synthetic SMS fanout failure handling test.",
      created_by: "owner-1",
      created_at: now,
    },
    { study_id: studyId, user_id: "owner-1", role: "Owner", created_at: now },
  );
  await createStudyVersion({
    id: versionId,
    study_id: studyId,
    version_number: 1,
    status: "Active",
    study_format: "ModifiedDelphi",
    planned_round_count: 1,
    terminal_round_number: 1,
    method_rationale: "test",
    consensus_rule_json: { threshold: 80, agreement_min_rating: 7 },
    feedback_config_json: null,
    retention_policy_json: null,
    study_design_packet_json: { researchQuestion: "q", researchQuestions: [] },
    config_hash: "twilio-link-config",
    opened_round1_at: null,
    created_by: "owner-1",
    created_at: now,
  });
  upsertRoundConfig({
    study_id: studyId,
    version_id: versionId,
    round_number: 1,
    task_type: "open_text",
    title: "R1",
    prompt: "prompt",
    participant_instructions: "instructions",
    response_window_days: 7,
    reminder_subject: "s",
    reminder_body: "b",
    controlled_feedback_enabled: false,
    ai_curation_enabled: false,
    feedback_config: null,
    status: "Open",
  });
  const consentVersion = createConsentVersion({ study_id: studyId, version_id: versionId, text_md: "consent" });
  activateConsentVersion({ study_id: studyId, version_id: versionId, consent_version_id: consentVersion.consent_version_id });
  upsertStudySmsPolicy({
    study_id: studyId,
    version_id: versionId,
    sms_enabled: true,
    notification_safe_name: "Config Test",
    magic_link_ttl_minutes: 60,
    updated_by_user_id: "owner-1",
  });

  for (const suffix of ["1010", "2020"]) {
    const participant = createParticipantMaster({
      name: `Twilio Config ${suffix}`,
      email: `twilio-config-${suffix}@example.test`,
      created_by_user_id: "owner-1",
    });
    ensureParticipantEnrollment({
      study_id: studyId,
      version_id: versionId,
      participant_id: participant.participant_id,
      created_by_user_id: "owner-1",
    });
    recordConsent({
      participant_id: participant.participant_id,
      study_id: studyId,
      version_id: versionId,
      consent_version_id: consentVersion.consent_version_id,
    });
    const phone = `+1555010${suffix}`;
    upsertContactPreference({
      participant_id: participant.participant_id,
      notification_preference: "both",
      phone_e164: phone,
      phone_hash: hashSecret(phone),
      phone_last_four: suffix,
      sms_consent_granted: true,
      sms_consent_version: "sms-study-texts-v1",
      updated_by_user_id: "owner-1",
    });
    markPhoneVerified({
      participant_id: participant.participant_id,
      method: "test",
      updated_by_user_id: "owner-1",
    });
  }

  const outboxCountBefore = mockSmsOutbox.length;
  const result = await sendRoundOpenSmsNotifications({
    study_id: studyId,
    version_id: versionId,
    round_number: 1,
    actor_user_id: "owner-1",
    frontend_origin: "http://127.0.0.1:5173",
  });

  assert.equal(result.eligible_checked, 2);
  assert.equal(result.sent, 0);
  assert.equal(result.skipped, 2);
  assert.equal(result.notifications.length, 2);
  assert.deepEqual(
    result.notifications.map((notification) => notification.status),
    ["failed", "failed"],
  );
  assert.deepEqual(
    result.notifications.map((notification) => notification.failure_code),
    ["public_participant_origin_required_for_twilio_sms", "public_participant_origin_required_for_twilio_sms"],
  );
  const persisted = listSmsNotifications({ study_id: studyId, version_id: versionId, round_number: 1 });
  assert.equal(persisted.length, 2);
  assert.ok(persisted.every((notification) => notification.status === "failed"));
  assert.equal(mockSmsOutbox.length, outboxCountBefore);
});

test("sms governance candidate controls enforce opt-in gates, stop/help simulation, rate limits, and role gates", async (t) => {
  const app = await buildApp();
  t.after(async () => {
    await app.close();
  });
  const now = new Date().toISOString();
  const studyId = "sms-study-2";
  const versionId = "sms-version-2";
  await createStudy({ id: studyId, title: "Sandbox SMS Study", description: "Mock inbound controls.", created_by: "owner-1", created_at: now }, { study_id: studyId, user_id: "owner-1", role: "Owner", created_at: now });
  await createStudyVersion({ id: versionId, study_id: studyId, version_number: 1, status: "Active", study_format: "ModifiedDelphi", planned_round_count: 2, terminal_round_number: 2, method_rationale: "test", consensus_rule_json: { threshold: 80, agreement_min_rating: 7 }, feedback_config_json: null, retention_policy_json: null, study_design_packet_json: { researchQuestion: "q", researchQuestions: [] }, config_hash: "x", opened_round1_at: null, created_by: "owner-1", created_at: now });
  upsertRoundConfig({ study_id: studyId, version_id: versionId, round_number: 1, task_type: "open_text", title: "R1", prompt: "prompt", participant_instructions: "instructions", response_window_days: 7, reminder_subject: "s", reminder_body: "b", controlled_feedback_enabled: false, ai_curation_enabled: false, feedback_config: null, status: "Open" });
  const participant = createParticipantMaster({ name: "Governance SMS", email: "governance@example.test", created_by_user_id: "owner-1" });
  ensureParticipantEnrollment({ study_id: studyId, version_id: versionId, participant_id: participant.participant_id, created_by_user_id: "owner-1" });
  const consentVersion = createConsentVersion({ study_id: studyId, version_id: versionId, text_md: "consent" });
  activateConsentVersion({ study_id: studyId, version_id: versionId, consent_version_id: consentVersion.consent_version_id });
  recordConsent({ participant_id: participant.participant_id, study_id: studyId, version_id: versionId, consent_version_id: consentVersion.consent_version_id });
  await expectStatus(app, { method: "PUT", url: `/studies/${studyId}/versions/${versionId}/sms-policy`, headers: owner, body: { sms_enabled: true, notification_safe_name: "Sandbox" } }, 200);

  await expectStatus(app, { method: "POST", url: `/studies/${studyId}/versions/${versionId}/rounds/1/sms/send`, headers: owner, body: {} }, 200);
  let notifications = await expectStatus(app, { method: "GET", url: `/studies/${studyId}/versions/${versionId}/sms-notifications`, headers: owner }, 200);
  assert.equal(notifications.body.notifications[0].failure_code, "no_sms_preference");

  await expectStatus(app, { method: "PATCH", url: `/studies/${studyId}/versions/${versionId}/participants/${participant.participant_id}/contact-preferences`, headers: owner, body: { notification_preference: "both", phone: "+15550109999", sms_consent_granted: true } }, 200);
  const challenge = await expectStatus(app, { method: "POST", url: `/studies/${studyId}/versions/${versionId}/participants/${participant.participant_id}/phone-verification/start`, headers: owner, body: {} }, 201);
  await expectStatus(app, { method: "POST", url: `/studies/${studyId}/versions/${versionId}/participants/${participant.participant_id}/phone-verification/verify`, headers: owner, body: { challenge_id: challenge.body.challenge_id, otp: challenge.body.dev_otp } }, 200);
  await expectStatus(app, { method: "POST", url: `/studies/${studyId}/versions/${versionId}/rounds/1/sms/send`, headers: owner, body: {} }, 200);
  assert.equal(mockSmsOutbox.length, 1);
  await expectStatus(app, { method: "POST", url: `/studies/${studyId}/versions/${versionId}/rounds/1/sms/send`, headers: owner, body: {} }, 200);
  notifications = await expectStatus(app, { method: "GET", url: `/studies/${studyId}/versions/${versionId}/sms-notifications`, headers: owner }, 200);
  assert.ok(notifications.body.notifications.some((n) => n.failure_code === "resend_cooldown_active"));

  await expectStatus(app, { method: "POST", url: "/sms/mock/inbound-keyword", headers: owner, body: { from_phone: "+1 (555) 010-9999", message_text: "HELP" } }, 200);
  await expectStatus(app, { method: "POST", url: "/sms/mock/inbound-keyword", headers: owner, body: { from_phone: "+1 (555) 010-9999", message_text: "STOP" } }, 200);
  await expectStatus(app, { method: "POST", url: `/studies/${studyId}/versions/${versionId}/rounds/1/sms/send`, headers: owner, body: {} }, 200);
  notifications = await expectStatus(app, { method: "GET", url: `/studies/${studyId}/versions/${versionId}/sms-notifications`, headers: owner }, 200);
  assert.ok(notifications.body.notifications.some((n) => n.failure_code === "no_sms_preference"));

  await expectStatus(app, { method: "PUT", url: `/studies/${studyId}/versions/${versionId}/sms-policy`, headers: analyst, body: { sms_enabled: true } }, 403);
  await expectStatus(app, { method: "PATCH", url: `/studies/${studyId}/versions/${versionId}/participants/${participant.participant_id}/contact-preferences`, headers: analyst, body: { notification_preference: "both" } }, 403);
  await expectStatus(app, { method: "POST", url: `/studies/${studyId}/versions/${versionId}/participants/${participant.participant_id}/phone-verification/start`, headers: analyst, body: {} }, 403);
  await expectStatus(app, { method: "POST", url: `/studies/${studyId}/versions/${versionId}/rounds/1/sms/send`, headers: analyst, body: {} }, 403);

  const auditRows = getDatabase().prepare("SELECT event_json FROM audit_events").all();
  const auditRaw = JSON.stringify(auditRows);
  assert.match(auditRaw, /sms_inbound_help_requested/);
  assert.match(auditRaw, /sms_inbound_stop_processed/);
  assert.doesNotMatch(auditRaw, /\+15550109999|5550109999/);
});
