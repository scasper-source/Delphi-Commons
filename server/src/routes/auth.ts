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

function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export async function authRoutes(app: FastifyInstance) {
  ensureDemoUsers();

  app.post("/auth/login", async (req, reply) => {
    const body = (req.body ?? {}) as { email?: string; password?: string };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const user = email ? getUserByEmail(email) : null;
    if (!user || user.disabled_at || !verifyPassword(user, password)) {
      return reply.code(401).send({ error: "invalid_credentials" });
    }

    const { session, token } = createSession(user.user_id);

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

    return reply.send({
      token,
      session: {
        session_id: session.session_id,
        expires_at: session.expires_at,
      },
      user: sanitizeUser(user),
    });
  });

  app.post("/auth/logout", async (req, reply) => {
    const token = bearerToken(req.headers.authorization);
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
