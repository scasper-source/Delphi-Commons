import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";

import { getServerConfig } from "../dist/core/config.js";
import {
  csrfCookie,
  registerSecurity,
  sessionCookie,
} from "../dist/core/security.js";
import { validateAllowedOrigins } from "../../scripts/verify-deployment-security.mjs";

function makeApp(config) {
  const app = Fastify({ logger: false, bodyLimit: config.bodyLimitBytes });
  registerSecurity(app, config);
  app.get("/health", async () => ({ ok: true }));
  app.post("/mutate", async () => ({ ok: true }));
  return app;
}

test("production mode sets secure cookie and HSTS", async () => {
  process.env.NODE_ENV = "production";
  process.env.EDELPHI_ALLOWED_ORIGINS = "https://app.example.org";
  const config = getServerConfig();
  assert.equal(config.secureCookies, true);

  const session = sessionCookie("session-token", "2030-01-01T00:00:00.000Z", config);
  assert.match(session, /HttpOnly/);
  assert.match(session, /SameSite=Strict/);
  assert.match(session, /Secure/);

  const csrf = csrfCookie("csrf-token", "2030-01-01T00:00:00.000Z", config);
  assert.doesNotMatch(csrf, /HttpOnly/);
  assert.match(csrf, /SameSite=Strict/);
  assert.match(csrf, /Secure/);

  const app = makeApp(config);

  const response = await app.inject({ method: "GET", url: "/health" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["strict-transport-security"], "max-age=31536000; includeSubDomains");

  await app.close();
});

test("deployment verifier rejects comma-separated wildcard origins", () => {
  const wildcard = validateAllowedOrigins("https://app.example.org,*");
  assert.equal(wildcard.ok, false);
  assert.match(wildcard.message, /does not include wildcard/);

  const allowed = validateAllowedOrigins("https://app.example.org, https://admin.example.org");
  assert.equal(allowed.ok, true);
});

test("csrf required for cookie-authenticated mutations", async () => {
  process.env.NODE_ENV = "test";
  process.env.EDELPHI_ALLOWED_ORIGINS = "http://localhost:5173";
  const config = getServerConfig();
  const app = makeApp(config);

  const blocked = await app.inject({
    method: "POST",
    url: "/mutate",
    headers: { cookie: "edelphi_session=testsession" },
  });
  assert.equal(blocked.statusCode, 403);

  const allowed = await app.inject({
    method: "POST",
    url: "/mutate",
    headers: { cookie: "edelphi_session=testsession; edelphi_csrf=token123", "x-csrf-token": "token123" },
  });
  assert.equal(allowed.statusCode, 200);

  await app.close();
});

test("CORS blocks non-allowlisted origins", async () => {
  process.env.NODE_ENV = "test";
  process.env.EDELPHI_ALLOWED_ORIGINS = "http://localhost:5173";
  const config = getServerConfig();
  const app = makeApp(config);

  const denied = await app.inject({ method: "GET", url: "/health", headers: { origin: "https://evil.example" } });
  assert.equal(denied.statusCode, 403);

  const allowed = await app.inject({ method: "GET", url: "/health", headers: { origin: "http://localhost:5173" } });
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.headers["access-control-allow-origin"], "http://localhost:5173");

  await app.close();
});
