import type { FastifyInstance } from "fastify";
import { requireRole, getActor } from "../middleware/auth.js";
import { listAuditEvents, verifyAuditIntegrity, writeAuditEvent } from "../core/audit.js";
import { getStorageStatus, listAppliedMigrations } from "../core/database.js";
import { inspectDataIntegrity } from "../core/dataIntegrity.js";
import { listExportManifests } from "../stores/exportManifestStore.js";
import { createUser, listUsers, revokeUserSessions, sanitizeUser, updateUser } from "../auth/userStore.js";
import type { AuthRole } from "../auth/types.js";

function isAuthRole(value: unknown): value is AuthRole {
  return (
    value === "owner" ||
    value === "methods_steward" ||
    value === "privacy_lead" ||
    value === "data_custodian" ||
    value === "maintainer" ||
    value === "admin" ||
    value === "participant"
  );
}

export async function adminRoutes(app: FastifyInstance) {
  app.get(
    "/admin/users",
    { preHandler: requireRole(["admin", "maintainer"]) },
    async () => {
      return { users: listUsers().map(sanitizeUser) };
    }
  );

  app.post(
    "/admin/users",
    { preHandler: requireRole(["admin", "maintainer"]) },
    async (req, reply) => {
      const actor = getActor(req);
      const body = (req.body ?? {}) as {
        email?: string;
        display_name?: string;
        password?: string;
        system_roles?: unknown[];
      };

      if (!body.email || !body.password || body.password.length < 10) {
        return reply.code(400).send({ error: "valid_email_and_strong_password_required" });
      }

      const systemRoles = Array.isArray(body.system_roles)
        ? body.system_roles.filter(isAuthRole)
        : [];
      if (systemRoles.length === 0) return reply.code(400).send({ error: "system_role_required" });

      try {
        const user = createUser({
          email: body.email,
          display_name: body.display_name ?? body.email,
          password: body.password,
          system_roles: systemRoles,
        });

        await writeAuditEvent({
          actor,
          action: "auth.user.create",
          object: { type: "user", id: user.user_id },
          details: { email: user.email, system_roles: user.system_roles },
        });

        return reply.code(201).send({ user: sanitizeUser(user) });
      } catch (error) {
        if (error instanceof Error && error.message === "user_email_already_exists") {
          return reply.code(409).send({ error: "user_email_already_exists" });
        }
        throw error;
      }
    }
  );

  app.patch(
    "/admin/users/:userId",
    { preHandler: requireRole(["admin", "maintainer"]) },
    async (req, reply) => {
      const actor = getActor(req);
      const { userId } = req.params as { userId: string };
      const body = (req.body ?? {}) as {
        display_name?: string;
        system_roles?: unknown[];
        disabled?: boolean;
        revoke_sessions?: boolean;
      };

      const systemRoles = Array.isArray(body.system_roles)
        ? body.system_roles.filter(isAuthRole)
        : undefined;
      if (Array.isArray(body.system_roles) && (!systemRoles || systemRoles.length === 0)) {
        return reply.code(400).send({ error: "valid_system_role_required" });
      }

      const updated = updateUser(userId, {
        ...(typeof body.display_name === "string" ? { display_name: body.display_name } : {}),
        ...(systemRoles ? { system_roles: systemRoles } : {}),
        ...(typeof body.disabled === "boolean" ? { disabled_at: body.disabled ? new Date().toISOString() : null } : {}),
      });

      if (!updated) return reply.code(404).send({ error: "user_not_found" });

      const revokedSessionCount = body.revoke_sessions || body.disabled ? revokeUserSessions(userId) : 0;

      await writeAuditEvent({
        actor,
        action: "auth.user.update",
        object: { type: "user", id: userId },
        details: {
          system_roles: updated.system_roles,
          disabled_at: updated.disabled_at,
          revoked_session_count: revokedSessionCount,
        },
      });

      return reply.send({ user: sanitizeUser(updated), revoked_session_count: revokedSessionCount });
    }
  );

  app.get(
    "/admin/storage-status",
    { preHandler: requireRole(["owner", "methods_steward", "privacy_lead", "maintainer"]) },
    async () => {
      return {
        ok: true,
        storage: getStorageStatus(),
        migrations: listAppliedMigrations(),
        latest_audit_event: listAuditEvents().at(-1) ?? null,
      };
    }
  );

  app.get(
    "/admin/audit-integrity",
    { preHandler: requireRole(["privacy_lead", "data_custodian", "maintainer", "admin"]) },
    async () => {
      return {
        audit_integrity: verifyAuditIntegrity(),
        export_manifest_count: listExportManifests().length,
      };
    }
  );

  app.get(
    "/admin/data-integrity",
    { preHandler: requireRole(["privacy_lead", "data_custodian", "maintainer", "admin"]) },
    async () => {
      return {
        data_integrity: inspectDataIntegrity(),
      };
    }
  );

  app.post(
    "/admin/audit-test",
    { preHandler: requireRole(["owner", "methods_steward", "privacy_lead"]) },
    async (req) => {
      const actor = getActor(req);

      const evt = await writeAuditEvent({
        actor,
        action: "admin.audit_test",
        object: { type: "system" },
        details: { note: "audit log wiring test" },
      });

      return { ok: true, event: evt };
    }
  );
}

