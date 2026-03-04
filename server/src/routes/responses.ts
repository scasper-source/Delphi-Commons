import type { FastifyInstance } from "fastify";
import { createResponse, listResponses } from "../stores/responseStore.js";

import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";

export async function responsesRoutes(app: FastifyInstance) {
  const allowSubmit = requireRole(["participant", "owner", "methods_steward"]);
  const allowStaffRead = requireRole(["owner", "methods_steward"]);

  app.post(
    "/studies/:studyId/versions/:versionId/responses",
    { preHandler: allowSubmit },
    async (req, reply) => {
      const params = (req.params ?? {}) as any;
      const studyId =
        String(params.studyId ?? params.study_id ?? params.studyid ?? params.STUDYID ?? params.study ?? "");
      const versionId =
        String(params.versionId ?? params.version_id ?? params.versionid ?? params.VERSIONID ?? params.version ?? params.id ?? "");
      const body = (req.body ?? {}) as any;

      const actor = getActor(req);

      if (!body.participant_id) {
        return reply.code(400).send({ error: "participant_id_required" });
      }

      const rec = createResponse({
        study_id: studyId,
        version_id: versionId,
        participant_id: body.participant_id,
        response_json: body.response_json ?? {},
      });

      await writeAuditEvent({
        actor,
        action: "response.submit",
        object: { type: "response", id: rec.response_id },
        details: { studyId, versionId, participant_id: rec.participant_id },
      });

      return reply.code(201).send({ response_id: rec.response_id });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/responses",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const params = (req.params ?? {}) as any;
      const studyId =
        String(params.studyId ?? params.study_id ?? params.studyid ?? params.STUDYID ?? params.study ?? "");
      const versionId =
        String(params.versionId ?? params.version_id ?? params.versionid ?? params.VERSIONID ?? params.version ?? params.id ?? "");
      const actor = getActor(req);

      const list = listResponses({ study_id: studyId, version_id: versionId });

      await writeAuditEvent({
        actor,
        action: "response.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: list.length },
      });

      return reply.send({ responses: list });
    }
  );
}




