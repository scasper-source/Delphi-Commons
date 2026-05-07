import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const runtimeRoot = path.join(serverRoot, "data", "test-runtime", `auth-phase1-${Date.now()}-${Math.random().toString(16).slice(2)}`);

process.env.EDELPHI_DATA_DIR = path.join(runtimeRoot, "data");
process.env.EDELPHI_AUDIT_DIR = path.join(runtimeRoot, "audit");
process.env.EDELPHI_BACKUP_DIR = path.join(runtimeRoot, "backups");
process.env.EDELPHI_AUTH_REQUIRE_SESSION = "true";

const Fastify = (await import("fastify")).default;
const { getServerConfig } = await import("../dist/core/config.js");
const { registerSecurity, resetRateLimitsForTests } = await import("../dist/core/security.js");
const { authRoutes } = await import("../dist/routes/auth.js");
const { studiesRoutes } = await import("../dist/studies/routes.js");
const { listAuditEvents } = await import("../dist/core/audit.js");

async function buildApp() {
  resetRateLimitsForTests();
  const app = Fastify({ logger: false, bodyLimit: getServerConfig().bodyLimitBytes });
  registerSecurity(app, getServerConfig());
  await app.register(authRoutes);
  await studiesRoutes(app);
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

test("session required and membership/role boundaries enforced with audit trail", async (t) => {
  const app = await buildApp();
  t.after(async () => app.close());

  const noSession = await injectJson(app, {
    method: "POST",
    url: "/studies",
    headers: { "x-user-id": "owner-legacy", "x-user-role": "owner" },
    body: { title: "legacy blocked" },
  });
  assert.equal(noSession.response.statusCode, 401);

  const owner = await login(app, "owner@example.test", "demo-owner");
  const steward = await login(app, "steward@example.test", "demo-steward");

  const create = await injectJson(app, { method: "POST", url: "/studies", headers: owner.headers, body: { title: "Auth hardening" } });
  assert.equal(create.response.statusCode, 201);
  const studyId = create.body.study.id;

  const stewardEscalate = await injectJson(app, {
    method: "POST", url: `/studies/${studyId}/assignments`, headers: { ...steward.headers, "x-user-role": "admin" },
    body: { user_id: owner.user.user_id, role: "PrivacyLead" },
  });
  assert.equal(stewardEscalate.response.statusCode, 403);

  const ownerAssign = await injectJson(app, {
    method: "POST", url: `/studies/${studyId}/assignments`, headers: owner.headers,
    body: { user_id: steward.user.user_id, role: "Owner" },
  });
  assert.equal(ownerAssign.response.statusCode, 201);

  const removeOwnerRole = await injectJson(app, {
    method: "DELETE", url: `/studies/${studyId}/assignments/${steward.user.user_id}`, headers: owner.headers,
  });
  assert.equal(removeOwnerRole.response.statusCode, 200);

  const afterRemoval = await injectJson(app, {
    method: "GET", url: `/studies/${studyId}/assignments`, headers: { ...steward.headers, "x-user-role": "owner" },
  });
  assert.equal(afterRemoval.response.statusCode, 403);

  const events = listAuditEvents().filter((event) => ["study.assignment.upsert", "study.assignment.remove"].includes(event.action));
  assert.ok(events.some((event) => event.action === "study.assignment.upsert" && event.details?.assigned_user_id === steward.user.user_id));
  assert.ok(events.some((event) => event.action === "study.assignment.remove" && event.details?.removed_user_id === steward.user.user_id));
});
