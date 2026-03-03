import type { FastifyInstance } from "fastify";
import { requireRole, getActor } from "../middleware/auth.ts";
import { writeAuditEvent } from "../core/audit.ts";

export async function adminRoutes(app: FastifyInstance) {
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