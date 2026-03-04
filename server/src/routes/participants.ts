import type { FastifyInstance } from "fastify";
import {
  createParticipantMaster,
  listParticipantMasters,
  getParticipantMaster,
  updateParticipantMaster,
} from "../stores/participantMasterStore.js";

import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";

export async function participantsRoutes(app: FastifyInstance) {
  const allowMasterList = requireRole(["owner", "methods_steward"]);

  app.post(
    "/studies/:studyId/versions/:versionId/participants",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const body = (req.body ?? {}) as any;

      const actor = getActor(req);

      const participant = createParticipantMaster({
        name: body.name,
        email: body.email,
        created_by_user_id: actor.userId,
      });

      await writeAuditEvent({
        actor,
        action: "participant_master.create",
        object: { type: "participant_master", id: participant.participant_id },
        details: { studyId, versionId, participant_id: participant.participant_id },
      });

      return reply.code(201).send({ participant_id: participant.participant_id });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/participants",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const actor = getActor(req);

      const list = listParticipantMasters();

      await writeAuditEvent({
        actor,
        action: "participant_master.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: list.length },
      });

      return reply.send({ participants: list });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/participants/:participantId",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);

      const rec = getParticipantMaster(participantId);
      if (!rec) return reply.code(404).send({ error: "participant_not_found" });

      await writeAuditEvent({
        actor,
        action: "participant_master.get",
        object: { type: "participant_master", id: participantId },
        details: { studyId, versionId },
      });

      return reply.send({ participant: rec });
    }
  );

  app.patch(
    "/studies/:studyId/versions/:versionId/participants/:participantId",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as any;

      const updated = updateParticipantMaster(participantId, {
        name: body.name,
        email: body.email,
      });

      if (!updated) return reply.code(404).send({ error: "participant_not_found" });

      await writeAuditEvent({
        actor,
        action: "participant_master.update",
        object: { type: "participant_master", id: participantId },
        details: { studyId, versionId },
      });

      return reply.send({ participant: updated });
    }
  );
}
