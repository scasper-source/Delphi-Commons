import test from "node:test";
import assert from "node:assert/strict";
import Fastify from "fastify";

import { getServerConfig } from "../dist/core/config.js";
import { registerSecurity } from "../dist/core/security.js";

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
  const app = makeApp(config);

  const response = await app.inject({ method: "GET", url: "/health" });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["strict-transport-security"], "max-age=31536000; includeSubDomains");

  await app.close();
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
