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

function setPackageRuntimeEnv() {
  const runtimeRoot = path.join(
    serverRoot,
    "data",
    "test-runtime",
    `signoff-flow-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  process.env.NODE_ENV = "production";
  process.env.EDELPHI_ENABLE_INTERNAL_SYNTHETIC_AUTH_BOOTSTRAP = "1";
  process.env.EDELPHI_INTERNAL_SYNTHETIC_AUTH_ACK = "INTERNAL_SYNTHETIC_ONLY";
  process.env.EDELPHI_AUTH_REQUIRE_SESSION = "true";
  delete process.env.EDELPHI_DEMO_GOVERNANCE_ASSIGNMENTS;
  process.env.EDELPHI_DATA_DIR = path.join(runtimeRoot, "data");
  process.env.EDELPHI_AUDIT_DIR = path.join(runtimeRoot, "audit");
  process.env.EDELPHI_BACKUP_DIR = path.join(runtimeRoot, "backups");
}

async function buildApp() {
  const Fastify = (await import("fastify")).default;
  const { getServerConfig } = await import("../dist/core/config.js");
  const { registerSecurity, resetRateLimitsForTests } = await import("../dist/core/security.js");
  const { authRoutes } = await import("../dist/routes/auth.js");
  const { studiesRoutes } = await import("../dist/studies/routes.js");
  resetRateLimitsForTests();
  const app = Fastify({ logger: false, bodyLimit: getServerConfig().bodyLimitBytes });
  registerSecurity(app, getServerConfig());
  await app.register(authRoutes);
  await studiesRoutes(app);
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
    `${options.method} ${options.url} returned ${result.response.statusCode}: ${result.response.body}`,
  );
  return result.body;
}

async function login(app, email, password) {
  const result = await expectStatus(
    app,
    {
      method: "POST",
      url: "/auth/login",
      body: { email, password },
    },
    200,
  );
  return {
    user: result.user,
    headers: { authorization: `Bearer ${result.token}` },
  };
}

function packet() {
  return {
    title: "Synthetic Signoff Sequence Study",
    description: "Internal package-mode governance signoff regression.",
    roundOneMode: "open-ended",
    studyFormat: "ModifiedDelphi",
    plannedRoundCount: 3,
    terminalRoundNumber: 3,
    methodRationale: "Synthetic method rationale for package-mode signoff regression.",
    researchQuestion: "Which synthetic practices should the panel consider before launch?",
    researchQuestions: [
      {
        id: "rq-signoff",
        displayOrder: 1,
        text: "Which synthetic practices should the panel consider before launch?",
        shortLabel: "Signoff",
        description: "Synthetic signoff regression research question.",
        requiredForRound1Response: true,
        active: true,
        createdAt: "2026-05-31T00:00:00.000Z",
        updatedAt: "2026-05-31T00:00:00.000Z",
      },
    ],
  };
}

async function createReadyDraft(app, ownerHeaders) {
  const created = await expectStatus(
    app,
    {
      method: "POST",
      url: "/studies",
      headers: ownerHeaders,
      body: {
        title: "Synthetic Signoff Sequence Study",
        description: "Internal package-mode governance signoff regression.",
      },
    },
    201,
  );
  const studyId = created.study.id;

  const versionResult = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions`,
      headers: ownerHeaders,
      body: {},
    },
    201,
  );
  const versionId = versionResult.studyVersion.id;
  const studyPacket = packet();

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/wizard-packet`,
      headers: ownerHeaders,
      body: { study_design_packet_json: studyPacket },
    },
    200,
  );

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/design`,
      headers: ownerHeaders,
      body: {
        study_format: "ModifiedDelphi",
        planned_round_count: 3,
        terminal_round_number: 3,
        method_rationale: studyPacket.methodRationale,
      },
    },
    200,
  );

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/consensus-rule`,
      headers: ownerHeaders,
      body: {
        consensus_rule_json: {
          type: "percent_agreement",
          threshold: 80,
          agreement_min_rating: 7,
          source: "pi_defined",
          setting_process: "Study PI defined the threshold before governance signoff for a synthetic test.",
        },
      },
    },
    200,
  );

  return { studyId, versionId };
}

test("package-mode signoff sequence enforces charter roles and study-version scope", async (t) => {
  setPackageRuntimeEnv();
  const app = await buildApp();
  t.after(async () => app.close());

  const owner = await login(app, "owner@example.test", "demo-owner");
  const steward = await login(app, "steward@example.test", "demo-steward");
  const privacy = await login(app, "privacy@example.test", "demo-privacy");
  const ownerHeaders = owner.headers;
  const stewardHeaders = { ...steward.headers, "x-user-role": "methods_steward" };
  const privacyHeaders = { ...privacy.headers, "x-user-role": "privacy_lead" };

  const { studyId, versionId } = await createReadyDraft(app, ownerHeaders);

  const beforeSubmit = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/signoff`,
      headers: ownerHeaders,
      body: { note: "Premature Study PI signoff should fail." },
    },
    409,
  );
  assert.equal(beforeSubmit.error, "not_ready_for_signoff");

  const submitted = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/submit-for-signoff`,
      headers: ownerHeaders,
      body: {},
    },
    200,
  );
  assert.equal(submitted.studyVersion.status, "ReadyForSignoff");

  const unassignedSteward = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/signoff`,
      headers: stewardHeaders,
      body: { note: "Unassigned Ethics PI signoff should fail." },
    },
    403,
  );
  assert.equal(unassignedSteward.error, "forbidden");

  const wrongRole = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/signoff`,
      headers: privacyHeaders,
      body: { note: "Privacy lead cannot provide launch signoff." },
    },
    403,
  );
  assert.equal(wrongRole.error, "forbidden");

  const noSignoffsActivation = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/activate`,
      headers: ownerHeaders,
      body: {},
    },
    409,
  );
  assert.equal(noSignoffsActivation.error, "missing_required_signoffs");
  assert.equal(noSignoffsActivation.hasOwner, false);
  assert.equal(noSignoffsActivation.hasSteward, false);

  const ownerSignoff = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/signoff`,
      headers: ownerHeaders,
      body: { note: "Study PI signoff after review." },
    },
    200,
  );
  assert.equal(ownerSignoff.signoff.study_version_id, versionId);
  assert.equal(ownerSignoff.signoff.required_role, "Owner");
  assert.equal(ownerSignoff.signoff.signed_by_user_id, owner.user.user_id);

  const missingStewardActivation = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/activate`,
      headers: ownerHeaders,
      body: {},
    },
    409,
  );
  assert.equal(missingStewardActivation.error, "missing_required_signoffs");
  assert.equal(missingStewardActivation.hasOwner, true);
  assert.equal(missingStewardActivation.hasSteward, false);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/assignments`,
      headers: ownerHeaders,
      body: { user_id: steward.user.user_id, role: "MethodsSteward" },
    },
    201,
  );

  const stewardSignoff = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/signoff`,
      headers: stewardHeaders,
      body: { note: "Ethics PI signoff after independent review." },
    },
    200,
  );
  assert.equal(stewardSignoff.signoff.study_version_id, versionId);
  assert.equal(stewardSignoff.signoff.required_role, "MethodsSteward");
  assert.equal(stewardSignoff.signoff.signed_by_user_id, steward.user.user_id);

  const signoffs = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/signoffs`,
      headers: ownerHeaders,
    },
    200,
  );
  assert.deepEqual(
    signoffs.signoffs.map((signoff) => [signoff.study_version_id, signoff.required_role]).sort(),
    [
      [versionId, "MethodsSteward"],
      [versionId, "Owner"],
    ],
  );

  const activated = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/activate`,
      headers: ownerHeaders,
      body: {},
    },
    200,
  );
  assert.equal(activated.studyVersion.status, "Active");
});
