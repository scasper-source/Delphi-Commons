/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FastifyInstance } from "fastify";
import { ensureDemoUsers } from "../auth/demoUsers.js";
import {
  createSession,
  getSessionByToken,
  getUser,
  getUserByEmail,
  revokeSession,
  sanitizeUser,
  verifyPassword,
} from "../auth/userStore.js";
import { resolveActor, userResponse } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";
import { getServerConfig } from "../core/config.js";
import {
  bearerToken,
  clearSessionCookies,
  consumeRateLimit,
  csrfCookie,
  generateCsrfToken,
  parseCookies,
  requestSessionToken,
  sessionCookie,
} from "../core/security.js";

export async function authRoutes(app: FastifyInstance) {
  ensureDemoUsers();
  const config = getServerConfig();

  app.post("/auth/login", async (req, reply) => {
    const body = (req.body ?? {}) as { email?: string; password?: string };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const rate = consumeRateLimit(
      `auth:${req.ip}:${email || "blank"}`,
      config.authRateLimitMax,
      config.rateLimitWindowMs,
    );
    if (!rate.ok) {
      return reply.header("Retry-After", String(rate.retryAfterSeconds)).code(429).send({ error: "rate_limited" });
    }

    const user = email ? getUserByEmail(email) : null;
    if (!user || user.disabled_at || !verifyPassword(user, password)) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }

    const { session, token } = createSession(user.user_id);
    const csrfToken = generateCsrfToken();

    await writeAuditEvent({
      actor: {
        userId: user.user_id,
        role: user.system_roles[0] ?? "authenticated",
        systemRoles: user.system_roles,
        email: user.email,
        displayName: user.display_name,
        sessionId: session.session_id,
        authSource: "session",
      },
      action: "auth.login",
      object: { type: "user", id: user.user_id },
      details: { session_id: session.session_id },
    });

    reply.header("Set-Cookie", [
      sessionCookie(token, session.expires_at, config),
      csrfCookie(csrfToken, session.expires_at, config),
    ]);

    return reply.send({
      token,
      csrf_token: csrfToken,
      session: {
        session_id: session.session_id,
        expires_at: session.expires_at,
      },
      user: sanitizeUser(user),
    });
  });

  app.post("/auth/logout", async (req, reply) => {
    const token = bearerToken(req) ?? parseCookies(req.headers.cookie).edelphi_session ?? requestSessionToken(req);
    const session = token ? getSessionByToken(token) : null;

    if (session) {
      revokeSession(session.session_id);
      const user = getUser(session.user_id);
      const actor = {
        userId: session.user_id,
        role: user?.system_roles[0] ?? "authenticated",
        systemRoles: user?.system_roles ?? [],
        sessionId: session.session_id,
        authSource: "session",
        ...(user?.email ? { email: user.email } : {}),
        ...(user?.display_name ? { displayName: user.display_name } : {}),
      };
      await writeAuditEvent({
        actor,
        action: "auth.logout",
        object: { type: "session", id: session.session_id },
        details: {},
      });
    }

    reply.header("Set-Cookie", clearSessionCookies(config));
    return reply.send({ ok: true });
  });

  app.get("/auth/me", async (req, reply) => {
    const actor = await resolveActor(req);
    if (process.env.EDELPHI_AUTH_REQUIRE_SESSION === "true" && actor.authSource !== "session") {
      return reply.code(401).send({ error: "session_required" });
    }
    return reply.send({ user: userResponse(actor) });
  });
}
