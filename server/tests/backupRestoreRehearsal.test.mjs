import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const runtimeRoot = path.join(serverRoot, "data", "test-runtime", `backup-restore-rehearsal-${Date.now()}-${Math.random().toString(16).slice(2)}`);

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
const { adminRoutes } = await import("../dist/routes/admin.js");
const { listAuditEvents, writeAuditEvent } = await import("../dist/core/audit.js");
const { recordExportManifest, listExportManifests } = await import("../dist/stores/exportManifestStore.js");
const { getDatabase } = await import("../dist/core/database.js");

async function buildApp() {
  resetRateLimitsForTests();
  const app = Fastify({ logger: false, bodyLimit: getServerConfig().bodyLimitBytes });
  registerSecurity(app, getServerConfig());
  await app.register(authRoutes);
  await studiesRoutes(app);
  await app.register(participantsRoutes);
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

function inviteToken(invitationUrl) {
  const url = new URL(invitationUrl);
  return new URLSearchParams(url.hash.slice(1)).get("invite");
}

test("local backup/restore rehearsal preserves phase1-sensitive data and migration state", async (t) => {
  const app = await buildApp();
  t.after(async () => app.close());

  const owner = await login(app, "owner@example.test", "demo-owner");
  const custodian = await login(app, "custodian@example.test", "demo-custodian");

  const study = await injectJson(app, { method: "POST", url: "/studies", headers: owner.headers, body: { title: "Backup Restore Rehearsal" } });
  assert.equal(study.response.statusCode, 201);
  const studyId = study.body.study.id;

  const version = await injectJson(app, { method: "POST", url: `/studies/${studyId}/versions`, headers: owner.headers, body: {} });
  assert.equal(version.response.statusCode, 201);
  const versionId = version.body.studyVersion.id;

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
    body: { participant_id: `pt-${Date.now()}` },
  });
  assert.equal(participant.response.statusCode, 201);

  const invitation = await injectJson(app, {
    method: "POST",
    url: `/studies/${studyId}/versions/${versionId}/participants/${participant.body.participant_id}/invitations`,
    headers: owner.headers,
    body: {},
  });
  assert.equal(invitation.response.statusCode, 201);

  const token = inviteToken(invitation.body.invitation_url);
  assert.ok(token);

  const deletionRequest = await injectJson(app, {
    method: "POST",
    url: "/participant/invitation/deletion-request",
    headers: { [PARTICIPANT_INVITATION_HEADER]: token },
    body: { request_text: "Synthetic deletion request for backup rehearsal" },
  });
  assert.equal(deletionRequest.response.statusCode, 201);

  const exportAudit = await writeAuditEvent({
    actor: { userId: owner.user.user_id, role: "owner" },
    action: "export.package.create",
    object: { type: "study_version", id: versionId },
    details: { note: "synthetic manifest for backup rehearsal" },
  });

  recordExportManifest({
    study_id: studyId,
    version_id: versionId,
    package_type: "anonymized-response-dataset",
    generated_by: { userId: owner.user.user_id, role: "owner" },
    audit_event_id: exportAudit.id,
    content: { rows: 1 },
    data_scope: { rehearsal: true },
    redaction_profile: { direct_identifiers_removed: true },
  });

  const preBackupCounts = getDatabase()
    .prepare(`SELECT
      (SELECT COUNT(*) FROM documents WHERE collection = 'studies') AS studies_count,
      (SELECT COUNT(*) FROM documents WHERE collection = 'participants') AS participants_count,
      (SELECT COUNT(*) FROM documents WHERE collection = 'study_assignments') AS study_assignments_count,
      (SELECT COUNT(*) FROM documents WHERE collection = 'deletion_requests') AS deletion_requests_count,
      (SELECT COUNT(*) FROM audit_events) AS audit_events_count,
      (SELECT COUNT(*) FROM export_manifests) AS export_manifests_count,
      (SELECT COUNT(*) FROM schema_migrations) AS schema_migrations_count`)
    .get();

  const backup = await injectJson(app, {
    method: "POST",
    url: "/admin/backups",
    headers: { ...custodian.headers, "x-user-role": "data_custodian" },
    body: { reason: "phase1 local rehearsal" },
  });
  assert.equal(backup.response.statusCode, 200);
  assert.equal(backup.body.backup.audit_integrity.ok, true);
  assert.equal(backup.body.backup.data_integrity.ok, true);

  await injectJson(app, { method: "POST", url: "/studies", headers: owner.headers, body: { title: "Mutation after backup" } });

  const restore = await injectJson(app, {
    method: "POST",
    url: `/admin/backups/${backup.body.backup.backup_id}/restore`,
    headers: { ...custodian.headers, "x-user-role": "data_custodian" },
    body: {},
  });
  assert.equal(restore.response.statusCode, 200);
  assert.equal(restore.body.audit_integrity.ok, true);
  assert.equal(restore.body.data_integrity.ok, true);

  const postRestoreCounts = getDatabase()
    .prepare(`SELECT
      (SELECT COUNT(*) FROM documents WHERE collection = 'studies') AS studies_count,
      (SELECT COUNT(*) FROM documents WHERE collection = 'participants') AS participants_count,
      (SELECT COUNT(*) FROM documents WHERE collection = 'study_assignments') AS study_assignments_count,
      (SELECT COUNT(*) FROM documents WHERE collection = 'deletion_requests') AS deletion_requests_count,
      (SELECT COUNT(*) FROM audit_events) AS audit_events_count,
      (SELECT COUNT(*) FROM export_manifests) AS export_manifests_count,
      (SELECT COUNT(*) FROM schema_migrations) AS schema_migrations_count`)
    .get();

  assert.equal(postRestoreCounts.studies_count, preBackupCounts.studies_count);
  assert.equal(postRestoreCounts.participants_count, preBackupCounts.participants_count);
  assert.equal(postRestoreCounts.study_assignments_count, preBackupCounts.study_assignments_count);
  assert.equal(postRestoreCounts.deletion_requests_count, preBackupCounts.deletion_requests_count);
  assert.equal(postRestoreCounts.export_manifests_count, preBackupCounts.export_manifests_count);
  assert.equal(postRestoreCounts.schema_migrations_count, preBackupCounts.schema_migrations_count);
  assert.ok(postRestoreCounts.audit_events_count >= preBackupCounts.audit_events_count);
  assert.ok(listAuditEvents().length >= 1);
  assert.ok(listExportManifests().length >= 1);
});
