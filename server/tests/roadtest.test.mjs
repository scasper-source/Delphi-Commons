/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const runtimeRoot = path.join(
  serverRoot,
  "data",
  "test-runtime",
  `road-${Date.now()}-${Math.random().toString(16).slice(2)}`
);

process.env.EDELPHI_DATA_DIR = path.join(runtimeRoot, "data");
process.env.EDELPHI_AUDIT_DIR = path.join(runtimeRoot, "audit");
process.env.EDELPHI_BACKUP_DIR = path.join(runtimeRoot, "backups");
process.env.EDELPHI_RATE_LIMIT_AUTH_MAX = "2";
process.env.EDELPHI_AI_KEY_ENCRYPTION_SECRET = "test-only-ai-key-encryption-secret-for-roadtest";

const Fastify = (await import("fastify")).default;
const { getServerConfig } = await import("../dist/core/config.js");
const { PARTICIPANT_INVITATION_HEADER, registerSecurity, resetRateLimitsForTests } = await import("../dist/core/security.js");
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
const { verifyAuditIntegrity } = await import("../dist/core/audit.js");
const { getDatabase } = await import("../dist/core/database.js");
const { inspectDataIntegrity } = await import("../dist/core/dataIntegrity.js");
const { listExportManifests } = await import("../dist/stores/exportManifestStore.js");

const owner = { "x-user-id": "owner-1", "x-user-role": "owner" };
const steward = { "x-user-id": "steward-1", "x-user-role": "methods_steward" };
const participant = { "x-user-id": "participant-user", "x-user-role": "participant" };
const dataCustodian = { "x-user-id": "custodian-1", "x-user-role": "data_custodian" };

async function login(app, email, password) {
  const result = await injectJson(app, {
      method: "POST",
      url: "/auth/login",
      body: { email, password },
    });
  assert.equal(result.response.statusCode, 200, `POST /auth/login returned ${result.response.statusCode}: ${result.response.body}`);
  const body = result.body;
  const setCookie = result.response.headers["set-cookie"];
  const cookieHeader = Array.isArray(setCookie)
    ? setCookie.map((cookie) => cookie.split(";")[0]).join("; ")
    : typeof setCookie === "string"
      ? setCookie.split(",").map((cookie) => cookie.split(";")[0]).join("; ")
      : "";
  return {
    token: body.token,
    csrfToken: body.csrf_token,
    cookieHeader,
    user: body.user,
    headers: { authorization: `Bearer ${body.token}` },
    cookieHeaders: { cookie: cookieHeader, "x-csrf-token": body.csrf_token },
  };
}

async function buildApp() {
  resetRateLimitsForTests();
  const config = getServerConfig();
  const app = Fastify({ logger: false, bodyLimit: config.bodyLimitBytes });

  registerSecurity(app, config);
  app.get("/health", async () => ({ status: "ok", service: "edelphi-server" }));
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
  const response = await app.inject({
    ...options,
    payload: options.body,
  });

  const body = response.body ? response.json() : null;
  return { response, body };
}

async function expectStatus(app, options, statusCode) {
  const result = await injectJson(app, options);
  assert.equal(
    result.response.statusCode,
    statusCode,
    `${options.method} ${options.url} returned ${result.response.statusCode}: ${result.response.body}`
  );
  return result.body;
}

function uniqueParticipantId(index) {
  return `participant-${index}-${Date.now()}`;
}

function inviteTokenFromUrl(invitationUrl) {
  const parsed = new URL(invitationUrl);
  const token = new URLSearchParams(parsed.hash.replace(/^#/, "")).get("invite");
  assert.equal(typeof token, "string");
  return token;
}

async function completeStaffOrientation(app, studyId, versionId, participantId, headers = owner) {
  return expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/participants/${participantId}/orientation/complete`,
      headers,
      body: {},
    },
    201
  );
}

test("backend road test covers study, consent, AI, reporting, and audit flows", async (t) => {
  const app = await buildApp();
  t.after(async () => {
    await app.close();
  });

  const health = await expectStatus(app, { method: "GET", url: "/health" }, 200);
  assert.equal(health.status, "ok");

  const healthHeaders = await injectJson(app, { method: "GET", url: "/health" });
  assert.equal(healthHeaders.response.headers["x-content-type-options"], "nosniff");
  assert.match(String(healthHeaders.response.headers["content-security-policy"]), /default-src 'none'/);
  assert.equal(healthHeaders.response.headers["referrer-policy"], "no-referrer");

  await expectStatus(
    app,
    {
      method: "OPTIONS",
      url: "/health",
      headers: { origin: "https://evil.example" },
    },
    403
  );
  await expectStatus(
    app,
    {
      method: "GET",
      url: "/health",
      headers: { origin: "https://evil.example" },
    },
    403
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: "/auth/login",
      body: { email: "attacker@example.test", password: "wrong" },
    },
    401
  );
  await expectStatus(
    app,
    {
      method: "POST",
      url: "/auth/login",
      body: { email: "attacker@example.test", password: "wrong" },
    },
    401
  );
  await expectStatus(
    app,
    {
      method: "POST",
      url: "/auth/login",
      body: { email: "attacker@example.test", password: "wrong" },
    },
    429
  );

  const storageStatus = await expectStatus(
    app,
    {
      method: "GET",
      url: "/admin/storage-status",
      headers: owner,
    },
    200
  );
  assert.equal(storageStatus.ok, true);
  assert.equal(storageStatus.storage.driver, "sqlite");
  assert.ok(storageStatus.storage.migration_count >= 2);

  const previousAuthRequirement = process.env.EDELPHI_AUTH_REQUIRE_SESSION;
  process.env.EDELPHI_AUTH_REQUIRE_SESSION = "true";

  await expectStatus(
    app,
    {
      method: "GET",
      url: "/studies",
      headers: owner,
    },
    401
  );

  const ownerLogin = await login(app, "owner@example.test", "demo-owner");
  const stewardLogin = await login(app, "steward@example.test", "demo-steward");
  const participantLogin = await login(app, "participant@example.test", "demo-participant");

  assert.ok(ownerLogin.cookieHeader.includes("edelphi_session="));
  assert.ok(ownerLogin.cookieHeader.includes("edelphi_csrf="));

  await expectStatus(
    app,
    {
      method: "POST",
      url: "/auth/logout",
      headers: { cookie: ownerLogin.cookieHeader },
      body: {},
    },
    403
  );

  await expectStatus(
    app,
    {
      method: "GET",
      url: "/auth/me",
      headers: { cookie: ownerLogin.cookieHeader },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "GET",
      url: "/studies",
      headers: participantLogin.headers,
    },
    403
  );

  const authStudy = await expectStatus(
    app,
    {
      method: "POST",
      url: "/studies",
      headers: ownerLogin.headers,
      body: {
        title: "Session Auth Membership Study",
        description: "Confirms study membership is enforced by the backend.",
      },
    },
    201
  );

  await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${authStudy.study.id}`,
      headers: stewardLogin.headers,
    },
    403
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${authStudy.study.id}/versions`,
      headers: {
        ...stewardLogin.headers,
        "x-user-role": "owner",
        "x-user-id": "manipulated-owner",
      },
      body: {},
    },
    403
  );

  const assignment = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${authStudy.study.id}/assignments`,
      headers: ownerLogin.headers,
      body: { user_id: stewardLogin.user.user_id, role: "MethodsSteward" },
    },
    201
  );
  assert.equal(assignment.assignment.role, "MethodsSteward");

  const stewardStudyRead = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${authStudy.study.id}`,
      headers: stewardLogin.headers,
    },
    200
  );
  assert.equal(stewardStudyRead.study.id, authStudy.study.id);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${authStudy.study.id}/versions`,
      headers: {
        ...stewardLogin.headers,
        "x-user-role": "owner",
      },
      body: {},
    },
    403
  );

  const authVersion = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${authStudy.study.id}/versions`,
      headers: ownerLogin.headers,
      body: {},
    },
    201
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${authStudy.study.id}/assignments`,
      headers: ownerLogin.headers,
      body: { user_id: ownerLogin.user.user_id, role: "PrivacyLead" },
    },
    201
  );

  const concentratedRoleAssignments = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${authStudy.study.id}/assignments`,
      headers: ownerLogin.headers,
    },
    200
  );
  const ownerAssignedRoles = concentratedRoleAssignments.assignments
    .filter((assignment) => assignment.user_id === ownerLogin.user.user_id)
    .map((assignment) => assignment.role)
    .sort();
  assert.deepEqual(ownerAssignedRoles, ["Owner", "PrivacyLead"]);

  await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${authStudy.study.id}/versions/${authVersion.studyVersion.id}/export-packages`,
      headers: { ...ownerLogin.headers, "x-user-role": "privacy_lead" },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${authStudy.study.id}/versions/${authVersion.studyVersion.id}/export-packages`,
      headers: participantLogin.headers,
    },
    403
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${authStudy.study.id}/versions/${authVersion.studyVersion.id}/export-packages`,
      headers: participantLogin.headers,
      body: { export_type: "audit-package" },
    },
    403
  );

  const authParticipant = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${authStudy.study.id}/versions/${authVersion.studyVersion.id}/participants`,
      headers: ownerLogin.headers,
      body: { name: "Invitation Test Participant", email: "invitee@example.test" },
    },
    201
  );

  const authInvitation = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${authStudy.study.id}/versions/${authVersion.studyVersion.id}/participants/${authParticipant.participant_id}/invitations`,
      headers: ownerLogin.headers,
      body: {},
    },
    201
  );
  const revokedInviteToken = inviteTokenFromUrl(authInvitation.invitation_url);

  await expectStatus(
    app,
    {
      method: "DELETE",
      url: `/studies/${authStudy.study.id}/versions/${authVersion.studyVersion.id}/participants/${authParticipant.participant_id}/invitations/${authInvitation.invitation.invitation_id}`,
      headers: ownerLogin.headers,
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "GET",
      url: "/participant/invitation",
      headers: { [PARTICIPANT_INVITATION_HEADER]: revokedInviteToken },
    },
    404
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: "/participant/invitation/responses",
      headers: { [PARTICIPANT_INVITATION_HEADER]: revokedInviteToken },
      body: { text: "This revoked invitation should not submit." },
    },
    404
  );

  await expectStatus(
    app,
    {
      method: "GET",
      url: "/participant/invitation",
      headers: { [PARTICIPANT_INVITATION_HEADER]: "bad-token" },
    },
    400
  );

  await expectStatus(
    app,
    {
      method: "DELETE",
      url: `/studies/${authStudy.study.id}/assignments/${stewardLogin.user.user_id}`,
      headers: ownerLogin.headers,
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${authStudy.study.id}`,
      headers: stewardLogin.headers,
    },
    403
  );

  if (previousAuthRequirement === undefined) {
    delete process.env.EDELPHI_AUTH_REQUIRE_SESSION;
  } else {
    process.env.EDELPHI_AUTH_REQUIRE_SESSION = previousAuthRequirement;
  }

  await expectStatus(
    app,
    {
      method: "POST",
      url: "/studies",
      headers: participant,
      body: { title: "Forbidden Study" },
    },
    403
  );

  const ownerUserList = await expectStatus(
    app,
    {
      method: "GET",
      url: "/admin/users",
      headers: owner,
    },
    200
  );
  assert.ok(ownerUserList.users.some((user) => user.email === "owner@example.test"));

  await expectStatus(
    app,
    {
      method: "GET",
      url: "/admin/users",
      headers: participant,
    },
    403
  );

  const createdStudy = await expectStatus(
    app,
    {
      method: "POST",
      url: "/studies",
      headers: owner,
      body: {
        title: "Road Test Delphi",
        description: "End-to-end backend road test for the MVP workflow.",
      },
    },
    201
  );

  const studyId = createdStudy.study.id;

  const defaultAiConfig = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/ai-config`,
      headers: owner,
    },
    200
  );
  assert.equal(defaultAiConfig.ai_config.noExternalAiMode, true);
  assert.equal(defaultAiConfig.ai_config.externalAiEnabled, false);
  assert.equal(defaultAiConfig.ai_config.keyExists, false);
  assert.equal(defaultAiConfig.ai_config.apiKeyEncrypted, undefined);

  await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/ai-config`,
      headers: participant,
    },
    403
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/ai-config/external-call-check`,
      headers: owner,
      body: { feature: "item_drafting", payload: { text: "anonymized input" } },
    },
    403
  );

  const incompleteExternalAI = await expectStatus(
    app,
    {
      method: "PUT",
      url: `/studies/${studyId}/ai-config`,
      headers: owner,
      body: {
        noExternalAiMode: false,
        externalAiEnabled: true,
        providerName: "OpenAI",
        modelName: "",
        featurePermissions: { item_drafting: true },
        disclosure: { dataMayBeSentDescription: "Anonymized response text may be sent for drafting." },
      },
    },
    200
  );
  assert.match(incompleteExternalAI.validation.errors.join("|"), /external_ai_enabled_but_model_missing/);
  assert.equal(incompleteExternalAI.ai_config.apiKeyEncrypted, undefined);

  const savedKey = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/ai-config/api-key`,
      headers: owner,
      body: { apiKey: "sk-roadtest-secret-1234" },
    },
    200
  );
  assert.equal(savedKey.ai_config.maskedApiKey, "••••••1234");
  assert.equal(savedKey.ai_config.keyExists, true);
  assert.equal(savedKey.ai_config.apiKey, undefined);

  const aiConfigRowAfterSet = getDatabase()
    .prepare("SELECT api_key_encrypted, api_key_last_four, api_key_fingerprint_hash FROM study_ai_configs WHERE study_id = ?")
    .get(studyId);
  assert.equal(aiConfigRowAfterSet.api_key_last_four, "1234");
  assert.notEqual(aiConfigRowAfterSet.api_key_encrypted, "sk-roadtest-secret-1234");
  assert.ok(!String(aiConfigRowAfterSet.api_key_encrypted).includes("sk-roadtest-secret-1234"));
  assert.ok(aiConfigRowAfterSet.api_key_fingerprint_hash);

  const rotatedKey = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/ai-config/api-key`,
      headers: owner,
      body: { apiKey: "sk-roadtest-secret-9876" },
    },
    200
  );
  assert.equal(rotatedKey.ai_config.maskedApiKey, "••••••9876");
  const aiConfigRowAfterRotate = getDatabase()
    .prepare("SELECT api_key_encrypted, api_key_last_four FROM study_ai_configs WHERE study_id = ?")
    .get(studyId);
  assert.equal(aiConfigRowAfterRotate.api_key_last_four, "9876");
  assert.notEqual(aiConfigRowAfterRotate.api_key_encrypted, aiConfigRowAfterSet.api_key_encrypted);

  const completeExternalAI = await expectStatus(
    app,
    {
      method: "PUT",
      url: `/studies/${studyId}/ai-config`,
      headers: owner,
      body: {
        noExternalAiMode: false,
        externalAiEnabled: true,
        providerName: "OpenAI",
        modelName: "test-model",
        featurePermissions: { item_drafting: true },
        disclosure: {
          dataMayBeSentDescription: "Anonymized response text and non-identifying methodological context may be sent.",
          identifiersExcludedDescription: "Direct identifiers and identity-response mappings are excluded.",
          optOutDescription: "No External AI mode is available when external AI processing is not permitted.",
          humanInTheLoopDescription: "AI Suggestion (Not Final) outputs require human Accept/Edit/Reject action.",
        },
      },
    },
    200
  );
  assert.equal(completeExternalAI.validation.status, "ready");

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/ai-config/external-call-check`,
      headers: owner,
      body: { feature: "item_drafting", payload: { response_text: "Safe anonymized response" } },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/ai-config/external-call-check`,
      headers: owner,
      body: { feature: "item_drafting", payload: { email: "panelist@example.test" } },
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "PUT",
      url: `/studies/${studyId}/ai-config`,
      headers: owner,
      body: {
        noExternalAiMode: false,
        externalAiEnabled: false,
        featurePermissions: { item_drafting: true },
      },
    },
    200
  );
  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/ai-config/external-call-check`,
      headers: owner,
      body: { feature: "item_drafting", payload: { response_text: "Safe anonymized response" } },
    },
    409
  );

  const deletedKey = await expectStatus(
    app,
    {
      method: "DELETE",
      url: `/studies/${studyId}/ai-config/api-key`,
      headers: owner,
    },
    200
  );
  assert.equal(deletedKey.ai_config.keyExists, false);
  const aiConfigRowAfterDelete = getDatabase()
    .prepare("SELECT api_key_encrypted, api_key_deleted_at FROM study_ai_configs WHERE study_id = ?")
    .get(studyId);
  assert.equal(aiConfigRowAfterDelete.api_key_encrypted, null);
  assert.ok(aiConfigRowAfterDelete.api_key_deleted_at);

  const localAIConfig = await expectStatus(
    app,
    {
      method: "PUT",
      url: `/studies/${studyId}/ai-config`,
      headers: owner,
      body: {
        noExternalAiMode: true,
        externalAiEnabled: false,
        providerName: "local",
        modelName: "deterministic-local-assistant",
        featurePermissions: {
          clustering: true,
          item_drafting: true,
          neutrality_method_linting: true,
          reminders: true,
          irb_export_drafting: true,
          report_drafting: true,
        },
        disclosure: {
          dataMayBeSentDescription: "No external AI processing. Local deterministic helpers may use anonymized study content.",
          identifiersExcludedDescription: "Direct identifiers and identity-response mappings are excluded.",
          optOutDescription: "The study remains in No External AI mode.",
          humanInTheLoopDescription: "AI Suggestion (Not Final) outputs require human Accept/Edit/Reject action.",
        },
      },
    },
    200
  );
  assert.equal(localAIConfig.validation.status, "no_external_ai_mode");
  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/ai-config/external-call-check`,
      headers: owner,
      body: { feature: "item_drafting", payload: { response_text: "Safe anonymized response" } },
    },
    409
  );

  const createdVersion = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions`,
      headers: owner,
      body: {},
    },
    201
  );

  const versionId = createdVersion.studyVersion.id;

  const wizardPacket = {
    title: "Road Test Delphi Protocol Title",
    description: "End-to-end backend road test for the MVP workflow.",
    researchQuestion: "Which care transition practices should be prioritized by this expert panel?",
    panelCriteria: "Licensed clinicians with care transition expertise.",
    consentVersion: "Consent v1.0",
    confidentialityStatement:
      "Responses are confidential to the research team and linked across rounds through participant IDs.",
    consensusThreshold: 80,
    agreementMinRating: 7,
    retentionSchedule: "Retained according to approved protocol.",
  };

  const savedWizard = await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/wizard-packet`,
      headers: owner,
      body: { study_design_packet_json: wizardPacket },
    },
    200
  );
  assert.equal(savedWizard.studyVersion.study_design_packet_json.title, "Road Test Delphi Protocol Title");

  const renamedStudy = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}`,
      headers: owner,
    },
    200
  );
  assert.equal(renamedStudy.study.title, "Road Test Delphi Protocol Title");

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/submit-for-signoff`,
      headers: owner,
      body: {},
    },
    409
  );

  const design = await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/design`,
      headers: owner,
      body: {
        study_format: "ModifiedDelphi",
        planned_round_count: 3,
        terminal_round_number: 3,
        method_rationale:
          "A modified Delphi design fits this panel because Round 1 will gather open statements before two structured rating rounds.",
      },
    },
    200
  );
  assert.equal(design.studyVersion.study_format, "ModifiedDelphi");

  const panelInformedDraftConsensusRule = {
    type: "percent_agreement",
    threshold: 80,
    agreement_min_rating: 7,
    source: "panel_informed_pre_round",
    setting_process:
      "The Study Owner will review pre-round panel input before finalizing the consensus threshold for governance signoff.",
    pre_round_consensus_input: {
      enabled: true,
      status: "planned",
      prompt: "Please review the proposed consensus threshold and share any concerns about its appropriateness for this study.",
      summary: "",
      counts_as_delphi_round: false,
    },
  };

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/consensus-rule`,
      headers: owner,
      body: { consensus_rule_json: panelInformedDraftConsensusRule },
    },
    200
  );

  const blockedPanelInformedSignoff = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/submit-for-signoff`,
      headers: owner,
      body: {},
    },
    409
  );
  assert.equal(blockedPanelInformedSignoff.error, "pre_round_consensus_summary_missing");

  const consensusRule = {
    type: "percent_agreement",
    threshold: 80,
    agreement_min_rating: 7,
    source: "panel_informed_pre_round",
    setting_process:
      "The Study Owner reviewed pre-round panel input and finalized the threshold before Round 1 for governance signoff.",
    pre_round_consensus_input: {
      enabled: true,
      status: "reviewed",
      prompt: "Please review the proposed consensus threshold and share any concerns about its appropriateness for this study.",
      summary: "Pre-round panel input was reviewed; the threshold remained 80% agreement at rating 7+ before launch.",
      counts_as_delphi_round: false,
    },
  };

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/consensus-rule`,
      headers: owner,
      body: { consensus_rule_json: consensusRule },
    },
    200
  );

  const submitted = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/submit-for-signoff`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.equal(submitted.studyVersion.status, "ReadyForSignoff");
  assert.equal(typeof submitted.studyVersion.config_hash, "string");

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/consensus-rule`,
      headers: owner,
      body: { consensus_rule_json: consensusRule },
    },
    409
  );

  const blockedActivation = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/activate`,
      headers: owner,
      body: {},
    },
    409
  );
  assert.equal(blockedActivation.error, "missing_required_signoffs");

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/signoff`,
      headers: owner,
      body: { note: "Owner signoff for test." },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/signoff`,
      headers: steward,
      body: { note: "Methods signoff for test." },
    },
    200
  );

  const nonResponsePolicy = await expectStatus(
    app,
    {
      method: "PUT",
      url: `/studies/${studyId}/versions/${versionId}/non-response-policy`,
      headers: owner,
      body: {
        missedCurrentRoundDeadline: true,
        incompleteSubmissionCountsAsNonResponse: true,
        followUpWindowDays: 3,
        finalNoticeEnabled: true,
        autoProgressionEnabled: false,
      },
    },
    200
  );
  assert.equal(nonResponsePolicy.policy.follow_up_window_days, 3);
  assert.equal(nonResponsePolicy.policy.auto_progression_enabled, false);

  const activated = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/activate`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.equal(activated.studyVersion.status, "Active");

  await expectStatus(
    app,
    {
      method: "PUT",
      url: `/studies/${studyId}/versions/${versionId}/non-response-policy`,
      headers: owner,
      body: { followUpWindowDays: 4 },
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/rounds/1/config`,
      headers: owner,
      body: {
        task_type: "open_text",
        title: "Round 1 open-ended elicitation",
        prompt: "What care transition practices should this panel consider for later rating rounds?",
        participant_instructions:
          "Please provide one or more practices or concerns in your own words. Disagreement and uncertainty are useful to the study.",
        response_window_days: 7,
        reminder_subject: "Round 1 response window is open",
        reminder_body:
          "This is a neutral reminder that Round 1 is open. Participation is voluntary.",
        controlled_feedback_enabled: false,
        ai_curation_enabled: true,
        status: "Ready",
      },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/open-round-1`,
      headers: owner,
      body: {},
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/1/open`,
      headers: owner,
      body: {},
    },
    200
  );

  const participantIds = [uniqueParticipantId(1), uniqueParticipantId(2), uniqueParticipantId(3)];
  const nonResponseParticipantId = uniqueParticipantId(4);
  let invitedParticipantId = null;
  for (const [index, participantId] of participantIds.entries()) {
    const created = await expectStatus(
      app,
      {
        method: "POST",
        url: `/studies/${studyId}/versions/${versionId}/participants`,
        headers: owner,
        body: {
          name: `Panelist ${index + 1}`,
          email: `panelist-${index + 1}@example.test`,
        },
      },
      201
    );
    assert.equal(typeof created.participant_id, "string");
    if (index === 0) invitedParticipantId = created.participant_id;
  }

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/responses`,
      headers: participant,
      body: {
        participant_id: participantIds[0],
        response_json: { text: "This should be blocked until consent is active." },
      },
    },
    403
  );

  const consentVersion = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/consent-versions`,
      headers: owner,
      body: { text_md: "# Consent\nParticipation is voluntary." },
    },
    201
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/consent-versions/${consentVersion.consent_version.consent_version_id}/activate`,
      headers: owner,
      body: {},
    },
    200
  );

  assert.equal(typeof invitedParticipantId, "string");
  const invitation = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/participants/${invitedParticipantId}/invitations`,
      headers: owner,
      body: {},
    },
    201
  );
  assert.match(invitation.invitation_url, /#invite=/);
  assert.equal(new URL(invitation.invitation_url).search, "");
  const inviteToken = inviteTokenFromUrl(invitation.invitation_url);

  const invitationContext = await expectStatus(
    app,
    {
      method: "GET",
      url: "/participant/invitation",
      headers: { [PARTICIPANT_INVITATION_HEADER]: inviteToken },
    },
    200
  );
  assert.equal(invitationContext.invitation.participant_id, invitedParticipantId);
  assert.equal(invitationContext.active_consent_version.consent_version_id, consentVersion.consent_version.consent_version_id);
  assert.equal(invitationContext.orientation_completion, null);
  assert.equal(invitationContext.orientation_version, "participant-orientation-v1");

  await expectStatus(
    app,
    {
      method: "POST",
      url: "/participant/invitation/responses",
      headers: { [PARTICIPANT_INVITATION_HEADER]: inviteToken },
      body: { text: "This should be blocked until the invitee consents." },
    },
    403
  );

  const invitationConsent = await expectStatus(
    app,
    {
      method: "POST",
      url: "/participant/invitation/consent",
      headers: { [PARTICIPANT_INVITATION_HEADER]: inviteToken },
      body: {},
    },
    201
  );
  assert.equal(invitationConsent.consent_record.participant_id, invitedParticipantId);

  await expectStatus(
    app,
    {
      method: "POST",
      url: "/participant/invitation/responses",
      headers: { [PARTICIPANT_INVITATION_HEADER]: inviteToken },
      body: { text: "This should be blocked until orientation is completed." },
    },
    403
  );

  const orientationCompletion = await expectStatus(
    app,
    {
      method: "POST",
      url: "/participant/invitation/orientation/complete",
      headers: { [PARTICIPANT_INVITATION_HEADER]: inviteToken },
      body: {},
    },
    201
  );
  assert.equal(orientationCompletion.orientation_completion.participant_id, invitedParticipantId);

  const invitationResponse = await expectStatus(
    app,
    {
      method: "POST",
      url: "/participant/invitation/responses",
      headers: { [PARTICIPANT_INVITATION_HEADER]: inviteToken },
      body: { text: "Patients benefit when discharge instructions are written in plain language." },
    },
    201
  );
  assert.equal(typeof invitationResponse.response_id, "string");

  const invitationWithdrawal = await expectStatus(
    app,
    {
      method: "POST",
      url: "/participant/invitation/withdraw",
      headers: { [PARTICIPANT_INVITATION_HEADER]: inviteToken },
      body: {},
    },
    200
  );
  assert.equal(typeof invitationWithdrawal.consent_record.withdrew_at, "string");

  const deletionReviewRequest = await expectStatus(
    app,
    {
      method: "POST",
      url: "/participant/invitation/deletion-request",
      headers: { [PARTICIPANT_INVITATION_HEADER]: inviteToken },
      body: { request_text: "Please review retention or deletion options for my test records." },
    },
    201
  );
  assert.equal(deletionReviewRequest.deletion_request.participant_id, invitedParticipantId);
  assert.equal(deletionReviewRequest.deletion_request.status, "Requested");

  const deletionRequests = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/deletion-requests`,
      headers: owner,
    },
    200
  );
  assert.equal(deletionRequests.deletion_requests.length, 1);

  const reviewedDeletionRequest = await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/deletion-requests/${deletionReviewRequest.deletion_request.deletion_request_id}`,
      headers: owner,
      body: { status: "UnderReview", review_note: "Data custodian review opened." },
    },
    200
  );
  assert.equal(reviewedDeletionRequest.deletion_request.status, "UnderReview");

  await expectStatus(
    app,
    {
      method: "POST",
      url: "/participant/invitation/responses",
      headers: { [PARTICIPANT_INVITATION_HEADER]: inviteToken },
      body: { text: "This should be blocked after withdrawal." },
    },
    403
  );

  for (const participantId of [...participantIds, nonResponseParticipantId]) {
    await expectStatus(
      app,
      {
        method: "POST",
        url: `/studies/${studyId}/versions/${versionId}/consent`,
        headers: participant,
        body: { participant_id: participantId },
      },
      201
    );
  }
  for (const participantId of participantIds) {
    const completion = await completeStaffOrientation(app, studyId, versionId, participantId, owner);
    assert.equal(completion.orientation_completion.orientation_version, "participant-orientation-v1");
  }

  const roundOneResponses = [
    "Clinicians must always receive timely follow up and adequate staffing.",
    "Clinicians must always receive timely follow up and adequate staffing.",
    "Patients benefit when discharge instructions are written in plain language.",
  ];

  for (const [index, text] of roundOneResponses.entries()) {
    await expectStatus(
      app,
      {
        method: "POST",
        url: `/studies/${studyId}/versions/${versionId}/responses`,
        headers: participant,
        body: {
          participant_id: participantIds[index],
          response_json: { text },
        },
      },
      201
    );
  }

  const summary = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/response-summary`,
      headers: owner,
    },
    200
  );
  assert.equal(summary.response_count, 4);
  assert.equal(summary.unique_participant_count, 4);

  const blockedEarlySynthesis = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/synthesize-inter-round`,
      headers: owner,
      body: { target_round_number: 2 },
    },
    409
  );
  assert.equal(blockedEarlySynthesis.error, "round1_must_be_closed_before_curation");

  const blockedEarlyManualCuration = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/items`,
      headers: owner,
      body: {
        round_number: 2,
        text: "This candidate should not be created while Round 1 is still open.",
        provenance_links: [
          {
            source_type: "response",
            source_id: "not-yet-curated",
            source_round_number: 1,
            excerpt: "Round 1 is still open.",
          },
        ],
        rationale: "Negative lifecycle test.",
      },
    },
    409
  );
  assert.equal(blockedEarlyManualCuration.error, "round1_must_be_closed_before_curation");

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/1/close`,
      headers: owner,
      body: {},
    },
    200
  );

  const blockedReopenRoundOne = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/1/open`,
      headers: owner,
      body: {},
    },
    409
  );
  assert.equal(blockedReopenRoundOne.error, "round_already_closed");

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/responses`,
      headers: participant,
      body: {
        participant_id: participantIds[0],
        response_json: { round_number: 1, text: "Closed Round 1 should not accept edits." },
      },
    },
    409
  );

  const blockedRoundOneConfigEditAfterClose = await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/rounds/1/config`,
      headers: owner,
      body: {
        task_type: "open_text",
        title: "Round 1 altered after closure",
        prompt: "This should be blocked.",
        participant_instructions: "This should be blocked.",
        response_window_days: 7,
        reminder_subject: "Blocked",
        reminder_body: "Blocked",
        controlled_feedback_enabled: false,
        ai_curation_enabled: true,
        status: "Ready",
      },
    },
    409
  );
  assert.equal(blockedRoundOneConfigEditAfterClose.error, "round_config_locked_after_open");

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/config`,
      headers: owner,
      body: {
        task_type: "rating",
        title: "Round 2 structured rating",
        prompt: "Please rate each candidate statement.",
        participant_instructions:
          "Review each statement independently. Ratings should reflect your judgment for this study.",
        response_window_days: 7,
        reminder_subject: "Round 2 rating is open",
        reminder_body: "This is a neutral reminder that Round 2 is open.",
        controlled_feedback_enabled: true,
        ai_curation_enabled: false,
        status: "Ready",
      },
    },
    200
  );

  const blockedRoundTwoOpenWithoutItems = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/open`,
      headers: owner,
      body: {},
    },
    409
  );
  assert.equal(blockedRoundTwoOpenWithoutItems.error, "published_traceable_items_required_for_round");

  const roundTwoSynthesis = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/synthesize-inter-round`,
      headers: owner,
      body: { target_round_number: 2 },
    },
    201
  );

  const roundTwoSuggestion = roundTwoSynthesis.suggestion;
  const roundTwoCandidates = roundTwoSuggestion.output_json.candidates;
  assert.equal(roundTwoSuggestion.feature, "inter_round_synthesis");
  assert.equal(roundTwoCandidates.length, 2);
  const clusteredCandidate = roundTwoCandidates.find(
    (candidate) => candidate.synthesis_kind === "cluster"
  );
  assert.ok(clusteredCandidate);
  assert.equal(clusteredCandidate.requires_human_rationale, true);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundTwoSuggestion.suggestion_id}/items`,
      headers: owner,
      body: { candidate_ids: roundTwoCandidates.map((candidate) => candidate.candidate_id) },
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundTwoSuggestion.suggestion_id}/decision`,
      headers: owner,
      body: { decision: "Accepted", note: "Round 2 candidates accepted for test." },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundTwoSuggestion.suggestion_id}/items`,
      headers: owner,
      body: { candidate_ids: roundTwoCandidates.map((candidate) => candidate.candidate_id) },
    },
    400
  );

  const materializedRoundTwo = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundTwoSuggestion.suggestion_id}/items`,
      headers: owner,
      body: {
        candidate_ids: roundTwoCandidates.map((candidate) => candidate.candidate_id),
        rationales: Object.fromEntries(
          roundTwoCandidates
            .filter((candidate) => candidate.requires_human_rationale)
            .map((candidate) => [
              candidate.candidate_id,
              "The duplicate Round 1 responses use identical wording and preserve the same meaning.",
            ])
        ),
      },
    },
    201
  );

  const roundTwoItems = materializedRoundTwo.items;
  assert.equal(roundTwoItems.length, 2);
  assert.equal(roundTwoItems[0].created_from, "ai");
  assert.equal(roundTwoItems[0].source_ai_suggestion_id, roundTwoSuggestion.suggestion_id);
  assert.ok(roundTwoItems[0].ai_provenance_links.length >= 1);
  assert.ok(roundTwoItems.every((item) => item.status === "Draft"));

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/items/${roundTwoItems[1].item_id}/split`,
      headers: owner,
      body: { new_texts: ["Split candidate A", "Split candidate B"] },
    },
    400
  );

  const splitForProvenance = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/items/${roundTwoItems[1].item_id}/split`,
      headers: owner,
      body: {
        new_texts: ["Split candidate A", "Split candidate B"],
        rationale: "Human curator split a multi-concept statement for provenance testing.",
      },
    },
    201
  );
  assert.equal(splitForProvenance.items.length, 2);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/items/merge`,
      headers: owner,
      body: {
        from_item_ids: [splitForProvenance.items[0].item_id],
        to_item_id: splitForProvenance.items[1].item_id,
      },
    },
    400
  );

  const mergeForProvenance = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/items/merge`,
      headers: owner,
      body: {
        from_item_ids: [splitForProvenance.items[0].item_id],
        to_item_id: splitForProvenance.items[1].item_id,
        rationale: "Human curator merged related split statements with rationale.",
      },
    },
    201
  );
  assert.equal(typeof mergeForProvenance.merge.merge_id, "string");

  const manualCandidate = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/items`,
      headers: owner,
      body: {
        round_number: 2,
        text: "A candidate that will be edited and rejected during curation.",
        provenance_links: [
          {
            source_type: "response",
            source_id: "manual-source-for-rejection",
            source_round_number: 1,
            excerpt: "Manual curation source excerpt.",
          },
        ],
        rationale: "Manual candidate created to exercise the curation edit and reject workflow.",
      },
    },
    201
  );

  const editedManualCandidate = await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/items/${manualCandidate.item.item_id}`,
      headers: owner,
      body: {
        text: "Edited manual candidate retained for audit but not published.",
        rationale: "Human curator edited the candidate wording.",
      },
    },
    200
  );
  assert.equal(editedManualCandidate.item.text, "Edited manual candidate retained for audit but not published.");

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/items/${manualCandidate.item.item_id}`,
      headers: owner,
      body: { status: "Published", rationale: "Publication should require the publication gate." },
    },
    400
  );

  const rejectedManualCandidate = await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/items/${manualCandidate.item.item_id}`,
      headers: owner,
      body: { status: "Rejected", rationale: "Human curator rejected this candidate." },
    },
    200
  );
  assert.equal(rejectedManualCandidate.item.status, "Rejected");

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/items/${manualCandidate.item.item_id}/publish`,
      headers: owner,
      body: {},
    },
    409
  );

  const lintTarget = roundTwoItems.find((item) => item.text.includes("must always")) ?? roundTwoItems[0];
  const lint = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/lint-wording`,
      headers: owner,
      body: { item_ids: [lintTarget.item_id] },
    },
    201
  );
  const lintSuggestion = lint.suggestion;
  assert.equal(lintSuggestion.feature, "lint_wording");
  assert.equal(lintSuggestion.output_json.summary.target_count, 1);
  assert.ok(lintSuggestion.output_json.summary.flagged_count >= 1);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${lintSuggestion.suggestion_id}/decision`,
      headers: owner,
      body: { decision: "Accepted", note: "Lint suggestion accepted." },
    },
    200
  );

  const suggestedText =
    lintSuggestion.output_json.findings[0].suggested_text ??
    "Clinicians may need to receive timely follow up and adequate staffing.";

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${lintSuggestion.suggestion_id}/apply-wording`,
      headers: owner,
      body: {
        changes: [
          {
            item_id: lintTarget.item_id,
            text: suggestedText,
            rationale: "Human review accepted the neutralized wording.",
          },
        ],
      },
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${lintSuggestion.suggestion_id}/release-signoff`,
      headers: owner,
      body: { note: "Owner release signoff." },
    },
    200
  );
  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${lintSuggestion.suggestion_id}/release-signoff`,
      headers: steward,
      body: { note: "Methods release signoff." },
    },
    200
  );

  const revised = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${lintSuggestion.suggestion_id}/apply-wording`,
      headers: owner,
      body: {
        changes: [
          {
            item_id: lintTarget.item_id,
            text: suggestedText,
            rationale: "Human review accepted the neutralized wording.",
          },
        ],
      },
    },
    200
  );
  assert.equal(revised.items[0].text, suggestedText);
  assert.equal(revised.items[0].ai_assisted_revisions.length, 1);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/items/${lintTarget.item_id}/publish`,
      headers: owner,
      body: {},
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundTwoSuggestion.suggestion_id}/release-signoff`,
      headers: owner,
      body: { note: "Owner release signoff." },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/items/${lintTarget.item_id}/publish`,
      headers: owner,
      body: {},
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundTwoSuggestion.suggestion_id}/release-signoff`,
      headers: steward,
      body: { note: "Methods release signoff." },
    },
    200
  );

  for (const item of roundTwoItems) {
    const published = await expectStatus(
      app,
      {
        method: "POST",
        url: `/studies/${studyId}/versions/${versionId}/items/${item.item_id}/publish`,
        headers: owner,
        body: {},
      },
      200
    );
    assert.equal(published.item.status, "Published");
  }

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/config`,
      headers: owner,
      body: {
        task_type: "rating",
        title: "Round 2 structured rating",
        prompt: "Please rate each candidate statement.",
        participant_instructions:
          "Review each statement independently. Ratings should reflect your judgment for this study.",
        response_window_days: 7,
        reminder_subject: "Round 2 rating is open",
        reminder_body: "This is a neutral reminder that Round 2 is open.",
        controlled_feedback_enabled: true,
        ai_curation_enabled: false,
        feedback_config: {
          format: "distribution_summary",
          show_participant_prior_response: false,
        },
        status: "Ready",
      },
    },
    200
  );

  const openedRoundTwo = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/open`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.ok(openedRoundTwo.round_config.feedback_config.locked_at);

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/config`,
      headers: owner,
      body: {
        task_type: "rating",
        title: "Blocked Round 2 feedback edit",
        prompt: "Blocked",
        participant_instructions: "Blocked",
        response_window_days: 7,
        reminder_subject: "Blocked",
        reminder_body: "Blocked",
        controlled_feedback_enabled: true,
        ai_curation_enabled: false,
        feedback_config: { format: "distribution_rationales", show_participant_prior_response: true },
        status: "Ready",
      },
    },
    409
  );

  const participantRoundTwoItems = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/items?participant_id=${participantIds[0]}`,
      headers: participant,
    },
    200
  );
  assert.equal(participantRoundTwoItems.items[0].controlled_feedback.format, "distribution_summary");
  assert.equal(participantRoundTwoItems.items[0].controlled_feedback.show_participant_prior_response, false);
  assert.equal(participantRoundTwoItems.items[0].controlled_feedback.participant_prior_response, null);
  assert.equal(participantRoundTwoItems.items[0].controlled_feedback.neutral_summary.approved, true);
  assert.equal(participantRoundTwoItems.items[0].controlled_feedback.rationale_excerpts, null);
  assert.equal(typeof participantRoundTwoItems.items[0].controlled_feedback.item_source, "string");
  assert.equal(JSON.stringify(participantRoundTwoItems).includes("email"), false);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/ratings`,
      headers: participant,
      body: {
        participant_id: participantIds[0],
        item_id: roundTwoItems[0].item_id,
        action: "keep",
      },
    },
    400
  );

  const roundTwoRatings = [
    [8, 8, 6],
    [9, 9, 9],
  ];

  for (const [itemIndex, item] of roundTwoItems.entries()) {
    for (const [participantIndex, participantId] of participantIds.entries()) {
      await expectStatus(
        app,
        {
          method: "POST",
          url: `/studies/${studyId}/versions/${versionId}/rounds/2/ratings`,
          headers: participant,
          body: {
            participant_id: participantId,
            item_id: item.item_id,
            rating: roundTwoRatings[itemIndex][participantIndex],
            action: "revise",
          },
        },
        201
      );
    }
  }

  const detectedNonResponse = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/non-response/detect`,
      headers: owner,
      body: { as_of: "2099-01-01T00:00:00.000Z" },
    },
    200
  );
  assert.ok(detectedNonResponse.flagged.some((entry) => entry.participant_id === nonResponseParticipantId));

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/participants/${nonResponseParticipantId}/mark-inactive`,
      headers: owner,
      body: {
        inactive_from_round_number: 3,
        reason_code: "no_response_after_followup",
        note: "Should be blocked before reminder and follow-up expiration.",
        safeguard_acknowledged: true,
      },
    },
    409
  );

  const reminder = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/participants/${nonResponseParticipantId}/reminder`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.match(reminder.escalation.message_texts.at(-1).text, /There is no penalty for withdrawal/);

  const finalNotice = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/participants/${nonResponseParticipantId}/final-notice`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.match(finalNotice.escalation.message_texts.at(-1).text, /does not erase any prior contributions/);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/participants/${nonResponseParticipantId}/followup-expire`,
      headers: owner,
      body: { as_of: "2099-01-05T00:00:00.000Z" },
    },
    200
  );

  const markedInactive = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/participants/${nonResponseParticipantId}/mark-inactive`,
      headers: owner,
      body: {
        inactive_from_round_number: 3,
        reason_code: "no_response_after_followup",
        note: "Marked inactive for future rounds after configured follow-up window.",
        safeguard_acknowledged: true,
      },
    },
    200
  );
  assert.equal(markedInactive.participant_status.status, "WITHDRAWN_PI");
  assert.equal(markedInactive.participant_status.inactive_from_round_number, 3);

  const attritionSummary = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/attrition-summary`,
      headers: owner,
    },
    200
  );
  assert.ok(attritionSummary.attrition_summary.pi_inactive_count >= 1);
  assert.match(attritionSummary.attrition_summary.limitations_note, /Consensus indicates agreement among this panel; it does not establish correctness/);

  const feedback = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/items/${roundTwoItems[0].item_id}/feedback?participant_id=${participantIds[0]}`,
      headers: participant,
    },
    200
  );
  assert.equal(feedback.feedback.response_count, 3);
  assert.equal(feedback.feedback.median, 8);

  const roundTwoReport = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/report`,
      headers: owner,
    },
    200
  );
  assert.equal(roundTwoReport.report.report_stage, "interim");
  assert.equal(roundTwoReport.report.summary.published_item_count, 2);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/close`,
      headers: owner,
      body: {},
    },
    200
  );

  const roundThreeSynthesis = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/synthesize-inter-round`,
      headers: owner,
      body: { target_round_number: 3 },
    },
    201
  );

  const roundThreeSuggestion = roundThreeSynthesis.suggestion;
  const roundThreeCandidates = roundThreeSuggestion.output_json.candidates;
  assert.equal(roundThreeCandidates.length, 2);
  assert.ok(roundThreeCandidates.every((candidate) => candidate.synthesis_kind === "carry_forward"));

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundThreeSuggestion.suggestion_id}/decision`,
      headers: owner,
      body: { decision: "Accepted", note: "Round 3 carry-forward accepted." },
    },
    200
  );

  const materializedRoundThree = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundThreeSuggestion.suggestion_id}/items`,
      headers: owner,
      body: {
        candidate_ids: roundThreeCandidates.map((candidate) => candidate.candidate_id),
      },
    },
    201
  );

  const roundThreeItems = materializedRoundThree.items;
  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundThreeSuggestion.suggestion_id}/release-signoff`,
      headers: owner,
      body: { note: "Owner release signoff." },
    },
    200
  );
  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundThreeSuggestion.suggestion_id}/release-signoff`,
      headers: steward,
      body: { note: "Methods release signoff." },
    },
    200
  );

  for (const item of roundThreeItems) {
    const published = await expectStatus(
      app,
      {
        method: "POST",
        url: `/studies/${studyId}/versions/${versionId}/items/${item.item_id}/publish`,
        headers: owner,
        body: {},
      },
      200
    );
    assert.equal(published.item.status, "Published");
  }

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/rounds/3/config`,
      headers: owner,
      body: {
        task_type: "rating",
        title: "Round 3 terminal rating",
        prompt: "Please rate each carried-forward statement.",
        participant_instructions:
          "Review the controlled feedback neutrally and rate each statement using your judgment.",
        response_window_days: 7,
        reminder_subject: "Round 3 rating is open",
        reminder_body: "This is a neutral reminder that Round 3 is open.",
        controlled_feedback_enabled: true,
        ai_curation_enabled: false,
        feedback_config: {
          format: "distribution_rationales",
          show_participant_prior_response: true,
        },
        status: "Ready",
      },
    },
    200
  );

  const openedRoundThree = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/3/open`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.ok(openedRoundThree.round_config.feedback_config.locked_at);

  const participantRoundThreeItems = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/rounds/3/items?participant_id=${participantIds[0]}`,
      headers: participant,
    },
    200
  );
  assert.equal(participantRoundThreeItems.items[0].controlled_feedback.format, "distribution_rationales");
  assert.equal(participantRoundThreeItems.items[0].controlled_feedback.source_round_number, 2);
  assert.equal(participantRoundThreeItems.items[0].controlled_feedback.participant_prior_response.rating, 8);
  assert.equal(participantRoundThreeItems.items[0].controlled_feedback.group_summary.median, 8);
  assert.ok(Array.isArray(participantRoundThreeItems.items[0].controlled_feedback.rationale_excerpts.excerpts));

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/3/ratings`,
      headers: participant,
      body: {
        participant_id: nonResponseParticipantId,
        item_id: roundThreeItems[0].item_id,
        rating: 7,
        action: "revise",
      },
    },
    403
  );

  const roundThreeRatings = [
    [8, 6, 6],
    [9, 9, 9],
  ];

  for (const [itemIndex, item] of roundThreeItems.entries()) {
    for (const [participantIndex, participantId] of participantIds.entries()) {
      await expectStatus(
        app,
        {
          method: "POST",
          url: `/studies/${studyId}/versions/${versionId}/rounds/3/ratings`,
          headers: participant,
          body: {
            participant_id: participantId,
            item_id: item.item_id,
            rating: roundThreeRatings[itemIndex][participantIndex],
            action: "revise",
          },
        },
        201
      );
    }
  }

  const roundThreeReport = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/rounds/3/report`,
      headers: owner,
    },
    200
  );
  assert.equal(roundThreeReport.report.report_stage, "final");
  assert.equal(roundThreeReport.report.is_final_for_declared_design, true);

  await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/rounds/4/report`,
      headers: owner,
    },
    409
  );

  const closedTerminalRound = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/3/close`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.equal(closedTerminalRound.round_config.status, "Closed");
  assert.equal(closedTerminalRound.final_result_snapshot.terminalRoundNumber, 3);
  assert.equal(
    closedTerminalRound.final_result_snapshot.requiredStatement,
    "Consensus indicates agreement among this panel; it does not establish correctness."
  );
  assert.ok(closedTerminalRound.final_result_snapshot.itemOutcomes.some((item) => item.outcome === "no_consensus"));
  assert.equal(typeof closedTerminalRound.final_result_snapshot.exportHash, "string");

  const finalResults = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/final-results`,
      headers: owner,
    },
    200
  );
  assert.equal(finalResults.snapshot.snapshotId, closedTerminalRound.final_result_snapshot.snapshotId);
  assert.ok(finalResults.release_blockers.includes("study_owner_closeout_signoff_missing"));

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/final-results/release`,
      headers: owner,
      body: {},
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/final-results/signoff`,
      headers: owner,
      body: {},
    },
    200
  );
  const stewardCloseoutSignoff = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/final-results/signoff`,
      headers: steward,
      body: {},
    },
    200
  );
  assert.equal(stewardCloseoutSignoff.release_blockers.length, 0);
  const releasedCloseout = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/final-results/release`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.equal(releasedCloseout.snapshot.status, "released");

  const finalExport = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/export-report`,
      headers: owner,
    },
    200
  );
  assert.equal(finalExport.report.final_round_number, 3);
  assert.equal(finalExport.report.report_stage, "final");
  assert.ok(finalExport.report.summary.non_consensus_item_count >= 1);
  assert.equal(typeof finalExport.report.hashes.dataset_hash, "string");
  assert.equal(finalExport.export_manifest.package_type, "final-delphi-report");
  assert.equal(finalExport.export_manifest.audit_event_id.length > 0, true);
  assert.equal(finalExport.export_manifest.dataset_hash, finalExport.report.hashes.dataset_hash);
  assert.equal(finalExport.export_package.export_type, "final-delphi-report");
  assert.equal(finalExport.export_package.human_review_status, "pending_review");
  assert.equal(finalExport.export_package.release_status, "not_released");
  assert.ok(finalExport.export_package.export_format_set.includes(".docx"));
  assert.ok(finalExport.export_package.export_format_set.includes(".xlsx"));
  assert.ok(finalExport.export_package.export_format_set.includes(".csv"));
  assert.ok(finalExport.export_package.export_format_set.includes(".md"));
  assert.equal(finalExport.export_package.files.some((file) => file.path === "final_report/final_delphi_report.docx"), true);
  assert.equal(finalExport.export_package.files.some((file) => file.path === "final_report/final_item_results.xlsx"), true);
  assert.equal(finalExport.export_package.files.some((file) => file.path === "final_report/final_item_results.csv"), true);
  assert.equal(finalExport.export_package.files.some((file) => file.path === "final_report/required_limitations_and_disclosures.md"), true);
  assert.equal(finalExport.export_package.files.some((file) => file.path === "final_report/final_result_snapshot.json"), true);
  assert.equal(finalExport.export_package.files.some((file) => file.path === "final_report/final_item_outcomes_from_snapshot.csv"), true);
  assert.equal(finalExport.export_package.files.some((file) => file.path === "CITATION.md"), true);
  assert.equal(typeof finalExport.export_package.manifest_hash, "string");
  assert.equal(typeof finalExport.export_package.package_hash, "string");
  assert.ok(finalExport.report.limitations.includes("Consensus indicates agreement among this panel; it does not establish correctness."));
  assert.ok(finalExport.report.limitations.some((line) => line.includes("Attrition may affect interpretation of consensus")));
  assert.ok(finalExport.report.summary.attrition.pi_inactive_count >= 1);
  assert.equal(finalExport.report.methods.consensus_rule_source, "panel_informed_pre_round");
  assert.equal(finalExport.report.methods.pre_round_consensus_input.counts_as_delphi_round, false);
  assert.match(finalExport.report.appendices.software_citation.preferred, /Casper, Stephen T\./);

  const exportPackages = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/export-packages`,
      headers: owner,
    },
    200
  );
  assert.ok(exportPackages.export_packages.some((pkg) => pkg.export_package_id === finalExport.export_package.export_package_id));

  const exportPackageFiles = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/export-packages/${finalExport.export_package.export_package_id}/files`,
      headers: owner,
    },
    200
  );
  const itemResultsFile = exportPackageFiles.files.find((file) => file.path === "final_report/final_item_results.csv");
  assert.ok(itemResultsFile);
  assert.equal(itemResultsFile.content_encoding, "utf8");
  assert.match(itemResultsFile.content_text, /consensus_status/);
  assert.match(itemResultsFile.content_text, /non_consensus_flag/);
  const docxFile = exportPackageFiles.files.find((file) => file.path === "final_report/final_delphi_report.docx");
  const xlsxFile = exportPackageFiles.files.find((file) => file.path === "final_report/final_item_results.xlsx");
  const citationFile = exportPackageFiles.files.find((file) => file.path === "CITATION.md");
  assert.ok(docxFile);
  assert.ok(xlsxFile);
  assert.ok(citationFile);
  assert.match(citationFile.content_text, /How to Cite This Tool/);
  assert.match(citationFile.content_text, /@software\{casper_edelphi_/);
  assert.match(citationFile.content_text, /Software version:/);
  assert.match(citationFile.content_text, /DOI: Not assigned for this release\./);
  assert.equal(docxFile.content_encoding, "base64");
  assert.equal(xlsxFile.content_encoding, "base64");
  const docxBuffer = Buffer.from(docxFile.content_text, "base64");
  const xlsxBuffer = Buffer.from(xlsxFile.content_text, "base64");
  assert.equal(docxBuffer.subarray(0, 2).toString("utf8"), "PK");
  assert.equal(xlsxBuffer.subarray(0, 2).toString("utf8"), "PK");
  assert.match(docxBuffer.toString("utf8"), /word\/document\.xml/);
  assert.match(xlsxBuffer.toString("utf8"), /xl\/workbook\.xml/);
  assert.equal(docxFile.sha256.length, 64);
  assert.equal(xlsxFile.sha256.length, 64);

  const downloadedDocx = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/export-packages/${finalExport.export_package.export_package_id}/files/${docxFile.export_file_id}/download`,
      headers: owner,
    },
    200
  );
  assert.equal(downloadedDocx.file.path, "final_report/final_delphi_report.docx");
  assert.equal(downloadedDocx.file.content_encoding, "base64");

  const reviewedPackage = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/export-packages/${finalExport.export_package.export_package_id}/review`,
      headers: owner,
      body: {
        review_status: "approved",
        note: "Reviewed generated report, disclosures, and package hashes for release.",
      },
    },
    201
  );
  assert.equal(reviewedPackage.review.review_status, "approved");
  assert.equal(reviewedPackage.reviews.length, 1);

  const reviewedPackageList = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/export-packages`,
      headers: owner,
    },
    200
  );
  const reviewedPackageFromList = reviewedPackageList.export_packages.find(
    (pkg) => pkg.export_package_id === finalExport.export_package.export_package_id
  );
  assert.equal(reviewedPackageFromList.reviews.at(-1).review_status, "approved");

  const custodianFinalExport = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/export-report`,
      headers: dataCustodian,
    },
    200
  );
  assert.equal(custodianFinalExport.export_package.export_type, "final-delphi-report");

  const irbDraft = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/generate-irb-pack`,
      headers: owner,
      body: {
        panel_description: "Licensed clinicians with care transition expertise.",
        inclusion_criteria: "Adults with professional experience in care transitions.",
        recruitment_strategy: "Email invitations from the study team.",
        expected_time_commitment: "Three rounds, about 15 minutes per round.",
        response_window: "One week per round with neutral reminders.",
        contact_information: "study-team@example.test",
        retention_summary: "Retained according to approved protocol.",
      },
    },
    201
  );

  const irbSuggestion = irbDraft.suggestion;
  assert.equal(irbSuggestion.feature, "irb_pack");
  assert.equal(irbSuggestion.output_json.draft_status, "draft_requires_human_review");

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${irbSuggestion.suggestion_id}/decision`,
      headers: owner,
      body: { decision: "Accepted", note: "IRB draft accepted for release test." },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${irbSuggestion.suggestion_id}/export-irb-pack`,
      headers: owner,
      body: {},
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${irbSuggestion.suggestion_id}/release-signoff`,
      headers: owner,
      body: { note: "Owner release signoff." },
    },
    200
  );
  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${irbSuggestion.suggestion_id}/release-signoff`,
      headers: steward,
      body: { note: "Methods release signoff." },
    },
    200
  );

  const officialIrb = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${irbSuggestion.suggestion_id}/export-irb-pack`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.equal(officialIrb.irb_pack_export.official_status, "released_for_official_use");
  assert.equal(officialIrb.export_manifest.package_type, "irb-pack");
  assert.equal(officialIrb.export_manifest.audit_event_id.length > 0, true);

  const governedPackageTypes = [
    "final-delphi-report",
    "irb-pack",
    "anonymized-response-dataset",
    "audit-package",
    "provenance-bundle",
    "complete-archive",
  ];
  const governedPackages = new Map();

  for (const exportType of governedPackageTypes) {
    const createdPackage = await expectStatus(
      app,
      {
        method: "POST",
        url: `/studies/${studyId}/versions/${versionId}/export-packages`,
        headers: dataCustodian,
        body: { export_type: exportType },
      },
      201
    );
    assert.equal(createdPackage.export_manifest.package_type, exportType);
    assert.equal(createdPackage.export_package.export_type, exportType);
    assert.equal(createdPackage.export_package.human_review_status, "pending_review");
    assert.equal(createdPackage.export_package.manifest_hash.length, 64);
    assert.equal(createdPackage.export_package.package_hash.length, 64);
    assert.ok(
      createdPackage.export_package.files.some((file) => file.path === `${exportType}/export_manifest.json`),
      `${exportType} missing package manifest file`,
    );
    assert.equal(createdPackage.export_package.files.some((file) => file.path === "CITATION.md"), true);
    governedPackages.set(exportType, createdPackage.export_package);
  }

  const anonymizedDatasetPackage = governedPackages.get("anonymized-response-dataset");
  const anonymizedDatasetFiles = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/export-packages/${anonymizedDatasetPackage.export_package_id}/files`,
      headers: dataCustodian,
    },
    200
  );
  const anonymizedResponsesCsv = anonymizedDatasetFiles.files.find((file) => file.path.endsWith("/responses.csv"));
  assert.ok(anonymizedResponsesCsv);
  assert.match(anonymizedResponsesCsv.content_text, /participant_pseudonym/);
  assert.doesNotMatch(anonymizedResponsesCsv.content_text, /Panelist|example\.test|participant_id/);
  const anonymizedParticipantsCsv = anonymizedDatasetFiles.files.find((file) => file.path.endsWith("/participants_anonymized.csv"));
  assert.ok(anonymizedParticipantsCsv);
  assert.match(anonymizedParticipantsCsv.content_text, /WITHDRAWN_PI/);
  assert.match(anonymizedParticipantsCsv.content_text, /prior_round_response_presence/);

  const auditPackage = governedPackages.get("audit-package");
  const auditPackageFiles = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/export-packages/${auditPackage.export_package_id}/files`,
      headers: dataCustodian,
    },
    200
  );
  const auditEventsCsv = auditPackageFiles.files.find((file) => file.path.endsWith("/audit_events.csv"));
  assert.ok(auditEventsCsv);
  assert.match(auditEventsCsv.content_text, /study_version.signoff/);
  assert.match(auditEventsCsv.content_text, /export.file_download/);
  assert.match(auditEventsCsv.content_text, /export.package_review/);
  assert.match(auditEventsCsv.content_text, /ai\.suggestion/);
  assert.match(auditEventsCsv.content_text, /item\.update|item\.reject/);

  const provenancePackage = governedPackages.get("provenance-bundle");
  const provenanceFiles = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/export-packages/${provenancePackage.export_package_id}/files`,
      headers: dataCustodian,
    },
    200
  );
  const provenanceEdgesCsv = provenanceFiles.files.find((file) => file.path.endsWith("/provenance_edges.csv"));
  const transformationsCsv = provenanceFiles.files.find((file) => file.path.endsWith("/item_transformation_history.csv"));
  const aiHashesCsv = provenanceFiles.files.find((file) => file.path.endsWith("/ai_suggestion_hashes.csv"));
  assert.ok(provenanceEdgesCsv);
  assert.ok(transformationsCsv);
  assert.ok(aiHashesCsv);
  assert.match(provenanceEdgesCsv.content_text, /contributed_to|carried_forward_to/);
  assert.match(transformationsCsv.content_text, /reject|finalize|merge|split/);
  assert.match(transformationsCsv.content_text, /Edited manual candidate retained for audit but not published/);
  assert.match(transformationsCsv.content_text, /Human review accepted the neutralized wording/);
  assert.match(aiHashesCsv.content_text, /prompt_template_version_id/);
  assert.match(aiHashesCsv.content_text, /ai_output_hash/);

  const governedFinalPackage = governedPackages.get("final-delphi-report");
  const governedFinalFiles = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/export-packages/${governedFinalPackage.export_package_id}/files`,
      headers: dataCustodian,
    },
    200
  );
  const governedFinalJson = governedFinalFiles.files.find((file) => file.path.endsWith("/final_delphi_report.json"));
  assert.ok(governedFinalJson);
  assert.match(governedFinalJson.content_text, /Consensus indicates agreement among this panel; it does not establish correctness/);
  assert.match(governedFinalJson.content_text, /panel_informed_pre_round/);
  assert.match(governedFinalJson.content_text, /near_consensus_item_count/);
  assert.match(governedFinalJson.content_text, /non_consensus_item_count/);
  assert.match(governedFinalJson.content_text, /software_citation/);
  assert.match(governedFinalJson.content_text, /Casper, Stephen T\./);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/consent/${participantIds[0]}/withdraw`,
      headers: participant,
      body: {},
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/responses`,
      headers: participant,
      body: {
        participant_id: participantIds[0],
        response_json: { text: "A future response after withdrawal should be blocked." },
      },
    },
    409
  );

  const archived = await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/archive`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.equal(typeof archived.study.archived_at, "string");

  const visibleStudies = await expectStatus(
    app,
    {
      method: "GET",
      url: "/studies",
      headers: owner,
    },
    200
  );
  assert.equal(
    visibleStudies.studies.some((study) => study.id === studyId),
    false
  );

  const allStudies = await expectStatus(
    app,
    {
      method: "GET",
      url: "/studies?include_archived=true",
      headers: owner,
    },
    200
  );
  assert.equal(
    allStudies.studies.some((study) => study.id === studyId && study.archived_at),
    true
  );

  const auditPath = path.join(process.env.EDELPHI_AUDIT_DIR, "audit.log");
  const auditRaw = await fs.readFile(auditPath, "utf8");
  const auditEvents = auditRaw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const actions = new Set(auditEvents.map((event) => event.action));
  for (const action of [
    "study_version.open_round1",
    "round.config.upsert",
    "round.feedback_config.create",
    "round.feedback_config.lock",
    "round.feedback_config.update_blocked_locked",
    "NON_RESPONSE_POLICY_CREATED",
    "NON_RESPONSE_POLICY_UPDATE_BLOCKED_LOCKED_STUDY",
    "PARTICIPANT_NON_RESPONSE_FLAGGED",
    "PARTICIPANT_REMINDER_SENT",
    "PARTICIPANT_FOLLOWUP_WINDOW_STARTED",
    "PARTICIPANT_FINAL_NOTICE_SENT",
    "PARTICIPANT_FOLLOWUP_WINDOW_EXPIRED",
    "PARTICIPANT_MARKED_INACTIVE_BY_PI",
    "PARTICIPANT_WITHDRAWN_BY_PARTICIPANT",
    "participant.orientation.complete",
    "study_version.save_wizard_packet",
    "response.submit",
    "round.open_blocked_already_closed",
    "round.open_blocked_published_traceable_items_required",
    "ai.synthesis_blocked_lifecycle_gate",
    "ai.operation.blocked",
    "ai.operation.policy_allowed",
    "ai_config.api_key.set",
    "ai_config.api_key.rotate",
    "ai_config.api_key.delete",
    "ai.suggestion.synthesize_inter_round",
    "ai.suggestion.lint_wording",
    "ai.suggestion.generate_irb_pack",
    "ai.suggestion.export_irb_pack",
    "item.create_blocked_lifecycle_gate",
    "item.update",
    "item.reject",
    "item.publish_blocked_rejected",
    "report.export",
    "study.archive",
  ]) {
    assert.ok(actions.has(action), `missing audit action: ${action}`);
  }

  assert.ok(
    auditEvents.some(
      (event) =>
        event.action === "report.export" &&
        event.details.studyId === studyId &&
        event.details.versionId === versionId &&
        event.details.final_round_number === 3
    )
  );

  const manifestList = listExportManifests({ study_id: studyId, version_id: versionId });
  assert.ok(manifestList.some((manifest) => manifest.package_type === "final-delphi-report"));
  assert.ok(manifestList.some((manifest) => manifest.package_type === "irb-pack"));
  assert.doesNotMatch(auditRaw, /sk-roadtest-secret/);
  assert.doesNotMatch(auditRaw, /api_key_encrypted/);

  const exportedContentRows = getDatabase()
    .prepare("SELECT content_text FROM export_files WHERE export_package_id IN (SELECT export_package_id FROM export_packages WHERE study_id = ?)")
    .all(studyId);
  const exportedContent = JSON.stringify(exportedContentRows);
  assert.match(exportedContent, /No External AI mode|external_ai_enabled/);
  assert.doesNotMatch(exportedContent, /sk-roadtest-secret/);
  assert.doesNotMatch(exportedContent, /api_key_encrypted|apiKeyEncrypted|api_key_fingerprint_hash/);

  const auditIntegrity = verifyAuditIntegrity();
  assert.equal(auditIntegrity.ok, true);
  assert.equal(auditEvents.every((event) => typeof event.sequence === "number" && typeof event.eventHash === "string"), true);

  assert.throws(
    () => getDatabase().prepare("UPDATE audit_events SET action = action WHERE id = ?").run(auditEvents[0].id),
    /audit_events_append_only/,
  );
  assert.throws(
    () => getDatabase().prepare("DELETE FROM export_manifests WHERE export_id = ?").run(manifestList[0].export_id),
    /export_manifests_append_only/,
  );

  const dataIntegrity = inspectDataIntegrity();
  assert.equal(dataIntegrity.ok, true);
  assert.equal(dataIntegrity.separation_model.identity_collection, "identity_participants");
  assert.equal(dataIntegrity.separation_model.response_collection, "responses");

  const auditIntegrityEndpoint = await expectStatus(
    app,
    {
      method: "GET",
      url: "/admin/audit-integrity",
      headers: dataCustodian,
    },
    200
  );
  assert.equal(auditIntegrityEndpoint.audit_integrity.ok, true);

  const dataIntegrityEndpoint = await expectStatus(
    app,
    {
      method: "GET",
      url: "/admin/data-integrity",
      headers: dataCustodian,
    },
    200
  );
  assert.equal(dataIntegrityEndpoint.data_integrity.ok, true);

  const backup = await expectStatus(
    app,
    {
      method: "POST",
      url: "/admin/backups",
      headers: dataCustodian,
      body: { reason: "road test restore rehearsal" },
    },
    200
  );
  assert.equal(backup.backup.audit_integrity.ok, true);
  assert.equal(backup.backup.data_integrity.ok, true);
  assert.ok(backup.backup.files.some((file) => file.label === "database"));

  const restored = await expectStatus(
    app,
    {
      method: "POST",
      url: `/admin/backups/${backup.backup.backup_id}/restore`,
      headers: dataCustodian,
      body: {},
    },
    200
  );
  assert.equal(restored.audit_integrity.ok, true);
  assert.equal(restored.data_integrity.ok, true);
});
