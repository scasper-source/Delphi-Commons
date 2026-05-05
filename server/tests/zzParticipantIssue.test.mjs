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

const owner = { "x-user-id": "owner-issue", "x-user-role": "owner" };
let modules;

async function loadModules() {
  if (!process.env.EDELPHI_DATA_DIR) {
    const runtimeRoot = path.join(
      serverRoot,
      "data",
      "test-runtime",
      `issue-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    process.env.EDELPHI_DATA_DIR = path.join(runtimeRoot, "data");
    process.env.EDELPHI_AUDIT_DIR = path.join(runtimeRoot, "audit");
    process.env.EDELPHI_BACKUP_DIR = path.join(runtimeRoot, "backups");
  }
  modules ??= {
    Fastify: (await import("fastify")).default,
    ...(await import("../dist/core/config.js")),
    ...(await import("../dist/core/security.js")),
    ...(await import("../dist/studies/routes.js")),
    ...(await import("../dist/routes/participants.js")),
    ...(await import("../dist/core/audit.js")),
  };
  return modules;
}

async function buildApp() {
  const {
    Fastify,
    getServerConfig,
    registerSecurity,
    resetRateLimitsForTests,
    studiesRoutes,
    participantsRoutes,
  } = await loadModules();
  resetRateLimitsForTests();
  const config = getServerConfig();
  const app = Fastify({ logger: false, bodyLimit: config.bodyLimitBytes });
  registerSecurity(app, config);
  await studiesRoutes(app);
  await app.register(participantsRoutes);
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
  assert.equal(result.response.statusCode, statusCode, `${options.method} ${options.url}: ${result.response.body}`);
  return result.body;
}

function invitationToken(invitationUrl) {
  const parsed = new URL(invitationUrl);
  const token = new URLSearchParams(parsed.hash.replace(/^#/, "")).get("invite");
  assert.equal(typeof token, "string");
  return token;
}

test("participant issue reporter records safe support notes without audit note leakage", async (t) => {
  const { PARTICIPANT_INVITATION_HEADER, listAuditEvents } = await loadModules();
  const app = await buildApp();
  t.after(async () => {
    await app.close();
  });

  const { study } = await expectStatus(app, {
    method: "POST",
    url: "/studies",
    headers: owner,
    body: { title: "Participant Issue Test", description: "Issue reporter route test" },
  }, 201);
  const { studyVersion } = await expectStatus(app, {
    method: "POST",
    url: `/studies/${study.id}/versions`,
    headers: owner,
    body: {},
  }, 201);
  const { participant_id: participantId } = await expectStatus(app, {
    method: "POST",
    url: `/studies/${study.id}/versions/${studyVersion.id}/participants`,
    headers: owner,
    body: { name: "Panelist Example", email: "panelist@example.test" },
  }, 201);
  const { invitation_url: invitationUrl } = await expectStatus(app, {
    method: "POST",
    url: `/studies/${study.id}/versions/${studyVersion.id}/participants/${participantId}/invitations`,
    headers: owner,
    body: {},
  }, 201);

  const token = invitationToken(invitationUrl);
  const created = await expectStatus(app, {
    method: "POST",
    url: "/participant/invitation/issues",
    headers: { [PARTICIPANT_INVITATION_HEADER]: token },
    body: {
      issue_type: "button_or_textbox_not_working",
      page_context: "participant_portal: Round 1",
      round_number: 1,
      note: "The save button did not show a confirmation.",
    },
  }, 201);

  assert.equal(created.issue.issue_type, "button_or_textbox_not_working");
  assert.equal(created.issue.participant_alias.startsWith("participant-"), true);

  const listed = await expectStatus(app, {
    method: "GET",
    url: `/studies/${study.id}/versions/${studyVersion.id}/participant-issues`,
    headers: owner,
  }, 200);

  assert.equal(listed.issues.length, 1);
  assert.equal(listed.issues[0].note, "The save button did not show a confirmation.");

  const responded = await expectStatus(app, {
    method: "PATCH",
    url: `/studies/${study.id}/versions/${studyVersion.id}/participant-issues/${created.issue.issue_id}`,
    headers: owner,
    body: {
      status: "reviewed",
      staff_response_note: "Thank you. We are checking this control now.",
    },
  }, 200);

  assert.equal(responded.issue.status, "reviewed");
  assert.equal(responded.issue.staff_response_note, "Thank you. We are checking this control now.");

  const participantVisible = await expectStatus(app, {
    method: "GET",
    url: "/participant/invitation/issues",
    headers: { [PARTICIPANT_INVITATION_HEADER]: token },
  }, 200);

  assert.equal(participantVisible.issues.length, 1);
  assert.equal(participantVisible.issues[0].staff_response_note, "Thank you. We are checking this control now.");

  const portalCreated = await expectStatus(app, {
    method: "POST",
    url: `/studies/${study.id}/versions/${studyVersion.id}/participants/demo-panelist-001/issues`,
    headers: { "x-user-id": "participant-dev-user", "x-user-role": "participant" },
    body: {
      issue_type: "cannot_start_or_continue",
      page_context: "participant_portal: Round 1 task",
      round_number: 1,
      note: "The next button did not respond.",
    },
  }, 201);

  assert.equal(portalCreated.issue.created_by, "participant_portal");

  const staffVisibleAfterPortalNote = await expectStatus(app, {
    method: "GET",
    url: `/studies/${study.id}/versions/${studyVersion.id}/participant-issues`,
    headers: owner,
  }, 200);

  assert.equal(staffVisibleAfterPortalNote.issues.length, 2);
  assert.equal(staffVisibleAfterPortalNote.issues.some((issue) => issue.issue_id === portalCreated.issue.issue_id), true);

  const audit = listAuditEvents().filter((event) => event.action === "participant_issue.create");
  assert.equal(audit.length, 2);
  assert.equal(JSON.stringify(audit[0].details).includes("save button"), false);
  const responseAudit = listAuditEvents().filter((event) => event.action === "participant_issue.respond");
  assert.equal(responseAudit.length, 1);
  assert.equal(JSON.stringify(responseAudit[0].details).includes("checking this control"), false);
});
