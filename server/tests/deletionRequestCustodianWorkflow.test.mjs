import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const runtimeRoot = path.join(serverRoot, "data", "test-runtime", `deletion-custodian-${Date.now()}-${Math.random().toString(16).slice(2)}`);

process.env.EDELPHI_DATA_DIR = path.join(runtimeRoot, "data");
process.env.EDELPHI_AUDIT_DIR = path.join(runtimeRoot, "audit");
process.env.EDELPHI_BACKUP_DIR = path.join(runtimeRoot, "backups");
process.env.EDELPHI_AUTH_REQUIRE_SESSION = "true";

const Fastify = (await import("fastify")).default;
const { getServerConfig } = await import("../dist/core/config.js");
const { registerSecurity, resetRateLimitsForTests, PARTICIPANT_INVITATION_HEADER } = await import("../dist/core/security.js");
const { authRoutes } = await import("../dist/routes/auth.js");
const { studiesRoutes } = await import("../dist/studies/routes.js");
const { participantsRoutes } = await import("../dist/routes/participants.js");
const { listAuditEvents } = await import("../dist/core/audit.js");

async function buildApp() {
  resetRateLimitsForTests();
  const app = Fastify({ logger: false, bodyLimit: getServerConfig().bodyLimitBytes });
  registerSecurity(app, getServerConfig());
  await app.register(authRoutes);
  await studiesRoutes(app);
  await app.register(participantsRoutes);
  return app;
}

async function injectJson(app, options) {
  const response = await app.inject({ ...options, payload: options.body });
  return { response, body: response.body ? response.json() : null };
}

async function login(app, email, password) {
  const { response, body } = await injectJson(app, { method: "POST", url: "/auth/login", body: { email, password } });
  assert.equal(response.statusCode, 200);
  return { headers: { authorization: `Bearer ${body.token}` }, user: body.user };
}

function inviteToken(invitationUrl) {
  const url = new URL(invitationUrl);
  return new URLSearchParams(url.hash.slice(1)).get("invite");
}

test("deletion request approval/denial/completion require data custodian role", async (t) => {
  const app = await buildApp();
  t.after(async () => app.close());

  const owner = await login(app, "owner@example.test", "demo-owner");
  const custodian = await login(app, "custodian@example.test", "demo-custodian");

  const createdStudy = await injectJson(app, { method: "POST", url: "/studies", headers: owner.headers, body: { title: "Deletion review" } });
  assert.equal(createdStudy.response.statusCode, 201);
  const studyId = createdStudy.body.study.id;

  const createdVersion = await injectJson(app, { method: "POST", url: `/studies/${studyId}/versions`, headers: owner.headers, body: {} });
  assert.equal(createdVersion.response.statusCode, 201);
  const versionId = createdVersion.body.studyVersion.id;

  const assignCustodian = await injectJson(app, {
    method: "POST",
    url: `/studies/${studyId}/assignments`,
    headers: owner.headers,
    body: { user_id: custodian.user.user_id, role: "DataCustodian" },
  });
  assert.equal(assignCustodian.response.statusCode, 201);

  const participant = await injectJson(app, {
    method: "POST",
    url: `/studies/${studyId}/versions/${versionId}/participants`,
    headers: owner.headers,
    body: { participant_id: `p-${Date.now()}` },
  });
  assert.equal(participant.response.statusCode, 201);

  const custodianCreateParticipant = await injectJson(app, {
    method: "POST",
    url: `/studies/${studyId}/versions/${versionId}/participants`,
    headers: { ...custodian.headers, "x-user-role": "data_custodian" },
    body: { participant_id: `p-custodian-${Date.now()}` },
  });
  assert.equal(custodianCreateParticipant.response.statusCode, 403);

  const invitation = await injectJson(app, {
    method: "POST",
    url: `/studies/${studyId}/versions/${versionId}/participants/${participant.body.participant_id}/invitations`,
    headers: owner.headers,
    body: {},
  });
  assert.equal(invitation.response.statusCode, 201);

  const custodianCreateInvitation = await injectJson(app, {
    method: "POST",
    url: `/studies/${studyId}/versions/${versionId}/participants/${participant.body.participant_id}/invitations`,
    headers: { ...custodian.headers, "x-user-role": "data_custodian" },
    body: {},
  });
  assert.equal(custodianCreateInvitation.response.statusCode, 403);

  const token = inviteToken(invitation.body.invitation_url);
  assert.ok(token);

  const reqCreate = await injectJson(app, {
    method: "POST",
    url: "/participant/invitation/deletion-request",
    headers: { [PARTICIPANT_INVITATION_HEADER]: token },
    body: { request_text: "Please review deletion/restriction path." },
  });
  assert.equal(reqCreate.response.statusCode, 201);

  const requestId = reqCreate.body.deletion_request.deletion_request_id;

  const custodianListRequests = await injectJson(app, {
    method: "GET",
    url: `/studies/${studyId}/versions/${versionId}/deletion-requests`,
    headers: { ...custodian.headers, "x-user-role": "data_custodian" },
  });
  assert.equal(custodianListRequests.response.statusCode, 200);
  assert.equal(custodianListRequests.body.deletion_requests.length, 1);

  const ownerUnderReview = await injectJson(app, {
    method: "PATCH",
    url: `/studies/${studyId}/versions/${versionId}/deletion-requests/${requestId}`,
    headers: owner.headers,
    body: { status: "UnderReview" },
  });
  assert.equal(ownerUnderReview.response.statusCode, 200);

  const ownerApproveDenied = await injectJson(app, {
    method: "PATCH",
    url: `/studies/${studyId}/versions/${versionId}/deletion-requests/${requestId}`,
    headers: owner.headers,
    body: { status: "Approved", review_note: "ok" },
  });
  assert.equal(ownerApproveDenied.response.statusCode, 403);

  const custodianApprove = await injectJson(app, {
    method: "PATCH",
    url: `/studies/${studyId}/versions/${versionId}/deletion-requests/${requestId}`,
    headers: { ...custodian.headers, "x-user-role": "data_custodian" },
    body: { status: "Approved", review_note: "Retention exception approved for synthetic runbook." },
  });
  assert.equal(custodianApprove.response.statusCode, 200);
  assert.equal(custodianApprove.body.deletion_request.status, "Approved");

  const ownerExecuteDenied = await injectJson(app, {
    method: "POST",
    url: `/studies/${studyId}/versions/${versionId}/deletion-requests/${requestId}/execute`,
    headers: owner.headers,
    body: {},
  });
  assert.equal(ownerExecuteDenied.response.statusCode, 403);

  const custodianExecute = await injectJson(app, {
    method: "POST",
    url: `/studies/${studyId}/versions/${versionId}/deletion-requests/${requestId}/execute`,
    headers: { ...custodian.headers, "x-user-role": "data_custodian" },
    body: {},
  });
  assert.equal(custodianExecute.response.statusCode, 200);
  assert.equal(custodianExecute.body.deletion_request.status, "Completed");
  assert.equal(custodianExecute.body.enrollment.status, "WITHDRAWN_PARTICIPANT");
  assert.equal(custodianExecute.body.participant.name, "[DELETED_PARTICIPANT]");

  const executionAudit = listAuditEvents().filter((event) => event.action === "participant.deletion_request.execute");
  assert.equal(executionAudit.length, 1);
});
