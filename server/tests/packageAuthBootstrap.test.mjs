import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");

async function buildApp() {
  const Fastify = (await import("fastify")).default;
  const { getServerConfig } = await import("../dist/core/config.js");
  const { registerSecurity, resetRateLimitsForTests } = await import("../dist/core/security.js");
  const { authRoutes } = await import("../dist/routes/auth.js");
  resetRateLimitsForTests();
  const app = Fastify({ logger: false, bodyLimit: getServerConfig().bodyLimitBytes });
  registerSecurity(app, getServerConfig());
  await app.register(authRoutes);
  return app;
}

function setSyntheticRuntimeEnv(tag) {
  const runtimeRoot = path.join(serverRoot, "data", "test-runtime", `pkg-auth-${tag}-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  process.env.EDELPHI_DATA_DIR = path.join(runtimeRoot, "data");
  process.env.EDELPHI_AUDIT_DIR = path.join(runtimeRoot, "audit");
  process.env.EDELPHI_BACKUP_DIR = path.join(runtimeRoot, "backups");
  process.env.EDELPHI_AUTH_REQUIRE_SESSION = "true";
}

test("production auth rejects built-in demo users when internal synthetic bootstrap is not explicitly enabled", async (t) => {
  process.env.NODE_ENV = "production";
  delete process.env.EDELPHI_ENABLE_INTERNAL_SYNTHETIC_AUTH_BOOTSTRAP;
  delete process.env.EDELPHI_INTERNAL_SYNTHETIC_AUTH_ACK;
  setSyntheticRuntimeEnv("blocked");

  const app = await buildApp();
  t.after(async () => app.close());

  const denied = await app.inject({ method: "POST", url: "/auth/login", payload: { email: "owner@example.test", password: "demo-owner" } });
  assert.equal(denied.statusCode, 401);
  assert.equal(denied.json().error, "invalid_credentials");
});

test("production auth allows built-in demo users only with explicit internal synthetic bootstrap gate", async (t) => {
  process.env.NODE_ENV = "production";
  process.env.EDELPHI_ENABLE_INTERNAL_SYNTHETIC_AUTH_BOOTSTRAP = "1";
  process.env.EDELPHI_INTERNAL_SYNTHETIC_AUTH_ACK = "INTERNAL_SYNTHETIC_ONLY";
  setSyntheticRuntimeEnv("enabled");

  const app = await buildApp();
  t.after(async () => app.close());

  const allowed = await app.inject({ method: "POST", url: "/auth/login", payload: { email: "owner@example.test", password: "demo-owner" } });
  assert.equal(allowed.statusCode, 200);
  assert.ok(allowed.json().token);
});
