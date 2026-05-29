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

function setPackageRuntimeEnv(tag) {
  const runtimeRoot = path.join(
    serverRoot,
    "data",
    "test-runtime",
    `multi-study-${tag}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  );
  process.env.NODE_ENV = "production";
  process.env.EDELPHI_ENABLE_INTERNAL_SYNTHETIC_AUTH_BOOTSTRAP = "1";
  process.env.EDELPHI_INTERNAL_SYNTHETIC_AUTH_ACK = "INTERNAL_SYNTHETIC_ONLY";
  process.env.EDELPHI_AUTH_REQUIRE_SESSION = "true";
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

function studyPacket(label) {
  return {
    title: `Synthetic ${label} Study`,
    description: `Package-mode multi-study persistence test for ${label}.`,
    roundOneMode: "open-ended",
    studyFormat: "ModifiedDelphi",
    plannedRoundCount: 3,
    terminalRoundNumber: 3,
    methodRationale: `Synthetic ${label} method rationale for backend regression coverage.`,
    researchQuestion: `Which synthetic ${label} practices should the panel consider?`,
    researchQuestions: [
      {
        id: `rq-${label.toLowerCase()}`,
        displayOrder: 1,
        text: `Which synthetic ${label} practices should the panel consider?`,
        shortLabel: label,
        description: `Synthetic ${label} research question.`,
        requiredForRound1Response: true,
        active: true,
        createdAt: "2026-05-29T00:00:00.000Z",
        updatedAt: "2026-05-29T00:00:00.000Z",
      },
    ],
  };
}

async function createActivatedStudy(app, ownerHeaders, stewardHeaders, stewardUserId, label) {
  const created = await expectStatus(
    app,
    {
      method: "POST",
      url: "/studies",
      headers: ownerHeaders,
      body: {
        title: `Synthetic ${label} Study`,
        description: `Package-mode multi-study persistence test for ${label}.`,
      },
    },
    201,
  );
  const studyId = created.study.id;

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/assignments`,
      headers: ownerHeaders,
      body: { user_id: stewardUserId, role: "MethodsSteward" },
    },
    201,
  );

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
  const packet = studyPacket(label);

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/wizard-packet`,
      headers: ownerHeaders,
      body: { study_design_packet_json: packet },
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
        method_rationale: packet.methodRationale,
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
          setting_process: "PI-defined before launch for synthetic package-mode testing.",
        },
      },
    },
    200,
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/submit-for-signoff`,
      headers: ownerHeaders,
      body: {},
    },
    200,
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/signoff`,
      headers: ownerHeaders,
      body: { note: `Owner signoff for ${label}.` },
    },
    200,
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/signoff`,
      headers: stewardHeaders,
      body: { note: `Methods steward signoff for ${label}.` },
    },
    200,
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

  return { studyId, versionId, packet };
}

test("package-mode backend preserves multiple active studies and reopens each independently", async (t) => {
  setPackageRuntimeEnv("active");
  const app = await buildApp();
  t.after(async () => app.close());

  const owner = await login(app, "owner@example.test", "demo-owner");
  const steward = await login(app, "steward@example.test", "demo-steward");
  const ownerHeaders = owner.headers;
  const stewardHeaders = { ...steward.headers, "x-user-role": "methods_steward" };

  const alpha = await createActivatedStudy(app, ownerHeaders, stewardHeaders, steward.user.user_id, "Alpha");
  const beta = await createActivatedStudy(app, ownerHeaders, stewardHeaders, steward.user.user_id, "Beta");
  assert.notEqual(alpha.studyId, beta.studyId);
  assert.notEqual(alpha.versionId, beta.versionId);

  const listedForOwner = await expectStatus(app, { method: "GET", url: "/studies", headers: ownerHeaders }, 200);
  assert.deepEqual(
    new Set(listedForOwner.studies.map((study) => study.id)),
    new Set([alpha.studyId, beta.studyId]),
  );

  const listedForSteward = await expectStatus(app, { method: "GET", url: "/studies", headers: stewardHeaders }, 200);
  assert.deepEqual(
    new Set(listedForSteward.studies.map((study) => study.id)),
    new Set([alpha.studyId, beta.studyId]),
  );

  for (const record of [alpha, beta]) {
    const versionList = await expectStatus(
      app,
      {
        method: "GET",
        url: `/studies/${record.studyId}/versions`,
        headers: ownerHeaders,
      },
      200,
    );
    assert.equal(versionList.studyVersions.length, 1);
    assert.equal(versionList.studyVersions[0].id, record.versionId);
    assert.equal(versionList.studyVersions[0].status, "Active");
    assert.equal(versionList.studyVersions[0].study_design_packet_json.title, record.packet.title);
    assert.equal(versionList.studyVersions[0].study_design_packet_json.researchQuestion, record.packet.researchQuestion);

    const reopened = await expectStatus(
      app,
      {
        method: "GET",
        url: `/studies/${record.studyId}/versions/${record.versionId}`,
        headers: ownerHeaders,
      },
      200,
    );
    assert.equal(reopened.studyVersion.study_id, record.studyId);
    assert.equal(reopened.studyVersion.study_design_packet_json.title, record.packet.title);

    const signoffs = await expectStatus(
      app,
      {
        method: "GET",
        url: `/studies/${record.studyId}/versions/${record.versionId}/signoffs`,
        headers: ownerHeaders,
      },
      200,
    );
    assert.deepEqual(
      signoffs.signoffs.map((signoff) => signoff.required_role).sort(),
      ["MethodsSteward", "Owner"],
    );
  }
});
