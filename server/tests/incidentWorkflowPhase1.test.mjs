import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const runtimeRoot = path.join(serverRoot, "data", "test-runtime", `incident-workflow-${Date.now()}-${Math.random().toString(16).slice(2)}`);
process.env.EDELPHI_DATA_DIR = path.join(runtimeRoot, "data");
process.env.EDELPHI_AUDIT_DIR = path.join(runtimeRoot, "audit");
process.env.EDELPHI_BACKUP_DIR = path.join(runtimeRoot, "backups");
process.env.EDELPHI_AUTH_REQUIRE_SESSION = "true";

const Fastify = (await import("fastify")).default;
const { getServerConfig } = await import("../dist/core/config.js");
const { registerSecurity, resetRateLimitsForTests } = await import("../dist/core/security.js");
const { authRoutes } = await import("../dist/routes/auth.js");
const { studiesRoutes } = await import("../dist/studies/routes.js");
const { adminRoutes } = await import("../dist/routes/admin.js");
const { verifyAuditIntegrity } = await import("../dist/core/audit.js");
const { getStudyVersion } = await import("../dist/studies/store.js");

async function buildApp() {
  resetRateLimitsForTests();
  const app = Fastify({ logger: false, bodyLimit: getServerConfig().bodyLimitBytes });
  registerSecurity(app, getServerConfig());
  await app.register(authRoutes);
  await studiesRoutes(app);
  await app.register(adminRoutes);
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

test("incident workflow records creation, pause, notification decisions, remediation/recovery, and audit integrity", async (t) => {
  const app = await buildApp();
  t.after(async () => app.close());
  const owner = await login(app, "owner@example.test", "demo-owner");
  const custodian = await login(app, "custodian@example.test", "demo-custodian");
  const participant = await login(app, "participant@example.test", "demo-participant");

  const study = await injectJson(app, { method: "POST", url: "/studies", headers: owner.headers, body: { title: "Incident drill study" } });
  assert.equal(study.response.statusCode, 201);
  const studyId = study.body.study.id;

  const version = await injectJson(app, { method: "POST", url: `/studies/${studyId}/versions`, headers: owner.headers, body: {} });
  assert.equal(version.response.statusCode, 201);
  const versionId = version.body.studyVersion.id;

  const unauthorizedCreate = await injectJson(app, {
    method: "POST", url: "/admin/incidents", headers: participant.headers,
    body: { study_id: studyId, study_version_id: versionId, title: "x", summary: "x", severity: "high", severity_rationale: "x" }
  });
  assert.equal(unauthorizedCreate.response.statusCode, 403);

  const created = await injectJson(app, {
    method: "POST", url: "/admin/incidents", headers: { ...custodian.headers, "x-user-role": "data_custodian" },
    body: {
      study_id: studyId, study_version_id: versionId, title: "Synthetic suspected confidentiality event",
      summary: "Tabletop-only incident to test workflow controls.", severity: "high", severity_rationale: "Possible exposure of participant-linked administrative metadata.",
    }
  });
  assert.equal(created.response.statusCode, 201);
  const incidentId = created.body.incident.incident_id;

  const paused = await injectJson(app, {
    method: "POST", url: `/admin/incidents/${incidentId}/pause-study`, headers: { ...custodian.headers, "x-user-role": "data_custodian" }, body: {}
  });
  assert.equal(paused.response.statusCode, 200);
  assert.equal(paused.body.incident.pause_applied, true);

  const refreshedVersion = await getStudyVersion(versionId);
  assert.equal(refreshedVersion.status, "Paused");

  const notificationAndStatus = await injectJson(app, {
    method: "PATCH", url: `/admin/incidents/${incidentId}`, headers: { ...custodian.headers, "x-user-role": "data_custodian" },
    body: { status: "monitoring", notification_decision: "required", notification_rationale: "Internal staff notification required; participant notification pending fact confirmation.", notification_channels: ["internal_governance", "security_privacy_lead"] }
  });
  assert.equal(notificationAndStatus.response.statusCode, 200);
  assert.equal(notificationAndStatus.body.incident.notification.decision, "required");

  const remediation = await injectJson(app, {
    method: "POST", url: `/admin/incidents/${incidentId}/timeline`, headers: { ...custodian.headers, "x-user-role": "data_custodian" },
    body: { category: "remediation", note: "Revoked affected credentials and rotated service key in tabletop simulation." }
  });
  assert.equal(remediation.response.statusCode, 200);

  const recovery = await injectJson(app, {
    method: "POST", url: `/admin/incidents/${incidentId}/timeline`, headers: { ...custodian.headers, "x-user-role": "data_custodian" },
    body: { category: "recovery", note: "Re-validated access controls and resumed controlled study operations in tabletop simulation." }
  });
  assert.equal(recovery.response.statusCode, 200);
  assert.equal(recovery.body.incident.timeline.length >= 2, true);

  const integrity = verifyAuditIntegrity();
  assert.equal(integrity.ok, true);
});
