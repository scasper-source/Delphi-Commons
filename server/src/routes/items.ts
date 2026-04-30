import type { FastifyInstance } from "fastify";
import {
  createItem,
  listItems,
  getItem,
  updateItem,
  type ItemProvenanceLink,
  type ItemRecord,
} from "../stores/itemStore.js";
import {
  createMergeAction,
  listMergeActions,
  createSplitAction,
  listSplitActions,
} from "../stores/mergeActionStore.js";
import { getAISuggestionPublicationGate } from "../stores/aiSuggestionStore.js";
import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";

export async function itemsRoutes(app: FastifyInstance) {
  const allowCuration = requireRole(["owner", "methods_steward"]);

  function parseManualProvenanceLinks(value: unknown): ItemProvenanceLink[] {
    if (!Array.isArray(value)) return [];

    return value.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const rec = entry as Record<string, unknown>;
      if (rec.source_type !== "response" && rec.source_type !== "item") return [];
      const sourceId = String(rec.source_id ?? "").trim();
      const sourceRoundNumber = Number(rec.source_round_number);
      if (!sourceId || !Number.isInteger(sourceRoundNumber) || sourceRoundNumber < 1) return [];

      return [{
        source_type: rec.source_type,
        source_id: sourceId,
        source_round_number: sourceRoundNumber,
        excerpt: typeof rec.excerpt === "string" ? rec.excerpt : null,
      }];
    });
  }

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
        ai_provenance_links: parseManualProvenanceLinks(body.provenance_links ?? body.ai_provenance_links),
        ai_provenance_rationale:
          typeof body.rationale === "string" && body.rationale.trim() !== ""
            ? body.rationale.trim()
            : null,
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
          provenance_source_ids: item.ai_provenance_links.map((link) => link.source_id),
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

      const aiSuggestionIds = new Set<string>();

      if (existing.created_from === "ai") {
        if (existing.source_ai_suggestion_id) {
          aiSuggestionIds.add(existing.source_ai_suggestion_id);
        } else {
          await writeAuditEvent({
            actor,
            action: "item.publish_blocked_ai_source_missing",
            object: { type: "item", id: String(itemId) },
            details: { studyId, versionId },
          });

          return reply.code(409).send({ error: "ai_source_suggestion_required" });
        }
      }

      for (const revision of existing.ai_assisted_revisions) {
        aiSuggestionIds.add(revision.suggestion_id);
      }

      for (const suggestionId of aiSuggestionIds) {
        const gate = getAISuggestionPublicationGate({
          suggestion_id: suggestionId,
          study_id: String(studyId),
          version_id: String(versionId),
        });

        if (!gate.ok) {
          await writeAuditEvent({
            actor,
            action: "item.publish_blocked_ai_gate",
            object: { type: "item", id: String(itemId) },
            details: {
              studyId,
              versionId,
              ai_suggestion_id: suggestionId,
              error: gate.error,
              hasOwner: gate.hasOwner ?? false,
              hasMethodsSteward: gate.hasMethodsSteward ?? false,
            },
          });

          return reply.code(409).send({
            error: gate.error,
            ai_suggestion_id: suggestionId,
            hasOwner: gate.hasOwner ?? false,
            hasMethodsSteward: gate.hasMethodsSteward ?? false,
          });
        }
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

  app.post(
    "/studies/:studyId/versions/:versionId/items/:itemId/split",
    { preHandler: allowCuration },
    async (req, reply) => {
      const { studyId, versionId, itemId } = req.params as any;
      const body = (req.body ?? {}) as any;
      const actor = getActor(req);

      const source = getItem(String(itemId));
      if (!source) {
        return reply.code(404).send({ error: "item_not_found" });
      }

      if (
        source.study_id !== String(studyId) ||
        source.version_id !== String(versionId)
      ) {
        return reply.code(404).send({ error: "item_not_found" });
      }

      const rationale = String(body.rationale ?? "").trim();
      if (!rationale) {
        return reply.code(400).send({ error: "rationale_required" });
      }

      const newTexts = Array.isArray(body.new_texts)
        ? body.new_texts.map((x: unknown) => String(x).trim()).filter((x: string) => x.length > 0)
        : [];

      if (newTexts.length < 2) {
        return reply.code(400).send({ error: "new_texts_min_2_required" });
      }

      const newItems: ItemRecord[] = newTexts.map((text: string) =>
        createItem({
          study_id: String(studyId),
          version_id: String(versionId),
          round_number: source.round_number,
          text,
          provenance_type: source.provenance_type,
          created_from: "manual",
          created_by_user_id: actor.userId,
        })
      );

      const split = createSplitAction({
        study_id: String(studyId),
        version_id: String(versionId),
        source_item_id: String(itemId),
        new_item_ids: newItems.map((i: ItemRecord) => i.item_id),
        rationale,
        actor_user_id: actor.userId,
      });

      await writeAuditEvent({
        actor,
        action: "item.split",
        object: { type: "item", id: String(itemId) },
        details: {
          studyId,
          versionId,
          new_item_ids: newItems.map((i: ItemRecord) => i.item_id),
          rationale,
          split_id: split.split_id,
        },
      });

      return reply.code(201).send({ split, items: newItems });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/split-actions",
    { preHandler: allowCuration },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const actor = getActor(req);

      const splits = listSplitActions({
        study_id: String(studyId),
        version_id: String(versionId),
      });

      await writeAuditEvent({
        actor,
        action: "item.split_list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: splits.length },
      });

      return reply.send({ splits });
    }
  );
}
