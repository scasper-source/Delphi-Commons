import type { FastifyInstance } from "fastify";
import {
  createItem,
  listItems,
  getItem,
  updateItem,
} from "../stores/itemStore.js";
import {
  createMergeAction,
  listMergeActions,
} from "../stores/mergeActionStore.js";
import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";

export async function itemsRoutes(app: FastifyInstance) {
  const allowCuration = requireRole(["owner", "methods_steward"]);

  app.post(
    "/studies/:studyId/versions/:versionId/items",
    { preHandler: allowCuration },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const body = (req.body ?? {}) as any;
      const actor = getActor(req);

      if (!body.text || String(body.text).trim() === "") {
        return reply.code(400).send({ error: "text_required" });
      }

      const item = createItem({
        study_id: String(studyId),
        version_id: String(versionId),
        round_number: Number(body.round_number ?? 2),
        text: String(body.text),
        provenance_type: body.provenance_type === "LiteratureDerived"
          ? "LiteratureDerived"
          : "PanelDerived",
        created_from: "manual",
        created_by_user_id: actor.userId,
      });

      await writeAuditEvent({
        actor,
        action: "item.create",
        object: { type: "item", id: item.item_id },
        details: {
          studyId,
          versionId,
          round_number: item.round_number,
          provenance_type: item.provenance_type,
          status: item.status,
        },
      });

      return reply.code(201).send({ item });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/items",
    { preHandler: allowCuration },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const actor = getActor(req);

      const items = listItems({
        study_id: String(studyId),
        version_id: String(versionId),
      });

      await writeAuditEvent({
        actor,
        action: "item.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: items.length },
      });

      return reply.send({ items });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/items/:itemId/publish",
    { preHandler: allowCuration },
    async (req, reply) => {
      const { studyId, versionId, itemId } = req.params as any;
      const actor = getActor(req);

      const existing = getItem(String(itemId));
      if (!existing) {
        return reply.code(404).send({ error: "item_not_found" });
      }

      if (
        existing.study_id !== String(studyId) ||
        existing.version_id !== String(versionId)
      ) {
        return reply.code(404).send({ error: "item_not_found" });
      }

      const updated = updateItem(String(itemId), { status: "Published" });
      if (!updated) {
        return reply.code(404).send({ error: "item_not_found" });
      }

      await writeAuditEvent({
        actor,
        action: "item.publish",
        object: { type: "item", id: String(itemId) },
        details: { studyId, versionId, status: updated.status },
      });

      return reply.send({ item: updated });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/items/merge",
    { preHandler: allowCuration },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const body = (req.body ?? {}) as any;
      const actor = getActor(req);

      const fromItemIds = Array.isArray(body.from_item_ids) ? body.from_item_ids.map(String) : [];
      const toItemId = String(body.to_item_id ?? "");
      const rationale = String(body.rationale ?? "").trim();

      if (fromItemIds.length < 1) {
        return reply.code(400).send({ error: "from_item_ids_required" });
      }

      if (!toItemId) {
        return reply.code(400).send({ error: "to_item_id_required" });
      }

      if (!rationale) {
        return reply.code(400).send({ error: "rationale_required" });
      }

      const target = getItem(toItemId);
      if (!target) {
        return reply.code(404).send({ error: "target_item_not_found" });
      }

      if (
        target.study_id !== String(studyId) ||
        target.version_id !== String(versionId)
      ) {
        return reply.code(404).send({ error: "target_item_not_found" });
      }

      for (const fromId of fromItemIds) {
        const src = getItem(fromId);
        if (!src) return reply.code(404).send({ error: "source_item_not_found", item_id: fromId });
        if (src.study_id !== String(studyId) || src.version_id !== String(versionId)) {
          return reply.code(404).send({ error: "source_item_not_found", item_id: fromId });
        }
      }

      const merge = createMergeAction({
        study_id: String(studyId),
        version_id: String(versionId),
        from_item_ids: fromItemIds,
        to_item_id: toItemId,
        rationale,
        actor_user_id: actor.userId,
      });

      await writeAuditEvent({
        actor,
        action: "item.merge",
        object: { type: "item", id: toItemId },
        details: {
          studyId,
          versionId,
          from_item_ids: fromItemIds,
          rationale,
          merge_id: merge.merge_id,
        },
      });

      return reply.code(201).send({ merge });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/merge-actions",
    { preHandler: allowCuration },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const actor = getActor(req);

      const merges = listMergeActions({
        study_id: String(studyId),
        version_id: String(versionId),
      });

      await writeAuditEvent({
        actor,
        action: "item.merge_list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: merges.length },
      });

      return reply.send({ merges });
    }
  );
}
