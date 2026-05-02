import type { FastifyRequest, FastifyReply } from "fastify";
import { listAssignments } from "../studies/store.js";
import { getSessionByToken, getUser } from "../auth/userStore.js";
import type { AuthRole, UserRecord } from "../auth/types.js";
import type { StudyRole } from "../studies/types.js";
import { requestSessionToken } from "../core/security.js";

export type Actor = {
  userId: string;
  role: AuthRole | string;
  systemRoles: AuthRole[];
  email?: string;
  displayName?: string;
  sessionId?: string;
  authSource: "session" | "legacy-dev-header" | "anonymous" | "invitation";
};

const studyRoleToAuthRole: Record<StudyRole, AuthRole> = {
  Owner: "owner",
  MethodsSteward: "methods_steward",
  PrivacyLead: "privacy_lead",
  DataCustodian: "data_custodian",
  Maintainer: "maintainer",
};

function requestedRole(req: FastifyRequest): string | null {
  const role = req.headers["x-user-role"];
  return typeof role === "string" && role.trim() ? role.trim() : null;
}

function studyIdFromRequest(req: FastifyRequest): string | null {
  const params = (req.params ?? {}) as Record<string, unknown>;
  return typeof params.studyId === "string" && params.studyId.trim() !== "" ? params.studyId : null;
}

async function actorRoleForStudy(user: UserRecord, studyId: string | null, req: FastifyRequest): Promise<AuthRole | string> {
  const requested = requestedRole(req);
  if (user.system_roles.includes("admin") || user.system_roles.includes("maintainer")) return user.system_roles[0] ?? "anonymous";
  if (!studyId) return user.system_roles[0] ?? "anonymous";

  const assignments = await listAssignments(studyId);
  const userRoles = assignments
    .filter((entry) => entry.user_id === user.user_id)
    .map((assignment) => studyRoleToAuthRole[assignment.role]);
  if (requested && userRoles.includes(requested as AuthRole)) return requested;
  if (userRoles.length > 0) return userRoles[0] ?? "unassigned";

  return user.system_roles.includes("participant") ? "participant" : "unassigned";
}

async function getSessionActor(req: FastifyRequest): Promise<Actor | null> {
  const token = requestSessionToken(req);
  if (!token) return null;

  const session = getSessionByToken(token);
  if (!session) return null;

  const user = getUser(session.user_id);
  if (!user || user.disabled_at) return null;

  const role = await actorRoleForStudy(user, studyIdFromRequest(req), req);
  return {
    userId: user.user_id,
    role,
    systemRoles: user.system_roles,
    email: user.email,
    displayName: user.display_name,
    sessionId: session.session_id,
    authSource: "session",
  };
}

function getLegacyDevActor(req: FastifyRequest): Actor {
  const userId = String(req.headers["x-user-id"] ?? "anonymous");
  const role = String(req.headers["x-user-role"] ?? "anonymous");
  return {
    userId,
    role,
    systemRoles: [role as AuthRole],
    authSource: role === "anonymous" ? "anonymous" : "legacy-dev-header",
  };
}

export function getActor(req: FastifyRequest): Actor {
  const actor = (req as any).actor as Actor | undefined;
  return actor ?? getLegacyDevActor(req);
}

export function requireRole(allowed: string[]) {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const sessionActor = await getSessionActor(req);
    const actor = sessionActor ?? getLegacyDevActor(req);
    (req as any).actor = actor;

    if (process.env.EDELPHI_AUTH_REQUIRE_SESSION === "true" && actor.authSource !== "session") {
      reply.code(401).send({ error: "session_required" });
      return;
    }

    if (!allowed.includes(actor.role)) {
      reply.code(403).send({ error: "forbidden" });
      return;
    }
  };
}

export async function resolveActor(req: FastifyRequest): Promise<Actor> {
  const sessionActor = await getSessionActor(req);
  const actor = sessionActor ?? getLegacyDevActor(req);
  (req as any).actor = actor;
  return actor;
}

export function userResponse(actor: Actor) {
  return {
    user_id: actor.userId,
    email: actor.email ?? null,
    display_name: actor.displayName ?? actor.userId,
    active_role: actor.role,
    system_roles: actor.systemRoles,
    auth_source: actor.authSource,
  };
}
