import type { FastifyInstance } from "fastify";
import { createResponse, listResponses, type ResponseRecord } from "../stores/responseStore.js";
import { hasActiveConsent } from "../stores/consentStore.js";
import { getStudyVersion } from "../studies/store.js";
import { getItem, listItems } from "../stores/itemStore.js";

import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";

type Round2RatingPayload = {
  round_number: 2;
  item_id: string;
  rating: number;
  action: "keep" | "revise";
};

function getStudyAndVersion(params: unknown): { studyId: string; versionId: string } {
  const p = (params ?? {}) as Record<string, unknown>;

  const studyId = String(
    p.studyId ?? p.study_id ?? p.studyid ?? p.STUDYID ?? p.study ?? ""
  );

  const versionId = String(
    p.versionId ??
      p.version_id ??
      p.versionid ??
      p.VERSIONID ??
      p.version ??
      p.id ??
      ""
  );

  return { studyId, versionId };
}

function isRound2RatingPayload(value: unknown): value is Round2RatingPayload {
  if (!value || typeof value !== "object") return false;

  const rec = value as Record<string, unknown>;

  return (
    rec.round_number === 2 &&
    typeof rec.item_id === "string" &&
    typeof rec.rating === "number" &&
    Number.isFinite(rec.rating) &&
    (rec.action === "keep" || rec.action === "revise")
  );
}

function getLatestRound2RatingsForItem(
  responses: ResponseRecord[],
  itemId: string
): Map<string, ResponseRecord> {
  const latest = new Map<string, ResponseRecord>();

  for (const response of responses) {
    if (!isRound2RatingPayload(response.response_json)) continue;
    if (response.response_json.item_id !== itemId) continue;
    latest.set(response.participant_id, response);
  }

  return latest;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    const value = sorted[mid];
    return value ?? null;
  }

  const left = sorted[mid - 1];
  const right = sorted[mid];

  if (left === undefined || right === undefined) return null;
  return (left + right) / 2;
}

function percentileFromSorted(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0] ?? null;

  const idx = (sorted.length - 1) * p;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);

  const lowerValue = sorted[lower];
  const upperValue = sorted[upper];

  if (lowerValue === undefined || upperValue === undefined) return null;
  if (lower === upper) return lowerValue;

  const fraction = idx - lower;
  return lowerValue + (upperValue - lowerValue) * fraction;
}

function buildDistribution(values: number[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const value of values) {
    const key = String(value);
    distribution[key] = (distribution[key] ?? 0) + 1;
  }

  return distribution;
}

export async function responsesRoutes(app: FastifyInstance) {
  const allowSubmit = requireRole(["participant", "owner", "methods_steward"]);
  const allowStaffRead = requireRole(["owner", "methods_steward"]);
  const allowParticipantOrStaff = requireRole(["participant", "owner", "methods_steward"]);

  app.post(
    "/studies/:studyId/versions/:versionId/responses",
    { preHandler: allowSubmit },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const body = (req.body ?? {}) as Record<string, unknown>;

      const actor = getActor(req);

      if (!body.participant_id) {
        return reply.code(400).send({ error: "participant_id_required" });
      }

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      if (studyVersion.opened_round1_at === null) {
        await writeAuditEvent({
          actor,
          action: "response.submit_blocked_round1_not_open",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: {
            studyId,
            versionId,
            participant_id: String(body.participant_id),
          },
        });

        return reply.code(409).send({ error: "round1_not_open" });
      }

      const consentOk = hasActiveConsent({
        participant_id: String(body.participant_id),
        study_id: studyId,
        version_id: versionId,
      });

      if (!consentOk) {
        await writeAuditEvent({
          actor,
          action: "response.submit_blocked_no_active_consent",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: {
            studyId,
            versionId,
            participant_id: String(body.participant_id),
          },
        });

        return reply.code(403).send({ error: "active_consent_required" });
      }

      const rec = createResponse({
        study_id: studyId,
        version_id: versionId,
        participant_id: String(body.participant_id),
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
      const { studyId, versionId } = getStudyAndVersion(req.params);
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

  app.get(
    "/studies/:studyId/versions/:versionId/response-summary",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);

      const list = listResponses({ study_id: studyId, version_id: versionId });
      const uniqueParticipantCount = new Set(list.map((r) => r.participant_id)).size;

      await writeAuditEvent({
        actor,
        action: "response.summary",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          response_count: list.length,
          unique_participant_count: uniqueParticipantCount,
        },
      });

      return reply.send({
        study_id: studyId,
        version_id: versionId,
        response_count: list.length,
        unique_participant_count: uniqueParticipantCount,
      });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/reminders/log",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;

      await writeAuditEvent({
        actor,
        action: "response.reminder_logged",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          channel: String(body.channel ?? "manual"),
          note: String(body.note ?? ""),
        },
      });

      return reply.code(201).send({
        ok: true,
        logged: true,
        study_id: studyId,
        version_id: versionId,
        channel: String(body.channel ?? "manual"),
      });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/round2/items",
    { preHandler: allowParticipantOrStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);
      const query = (req.query ?? {}) as Record<string, unknown>;
      const participantId = query.participant_id ? String(query.participant_id) : null;

      const publishedItems = listItems({
        study_id: studyId,
        version_id: versionId,
      }).filter((item) => item.round_number === 2 && item.status === "Published");

      const responses = listResponses({ study_id: studyId, version_id: versionId });

      const items = publishedItems.map((item) => {
        const latestForItem = getLatestRound2RatingsForItem(responses, item.item_id);
        const prior = participantId ? latestForItem.get(participantId) ?? null : null;

        let yourPriorResponse: { rating: number; action: "keep" | "revise"; submitted_at: string } | null = null;

        if (prior && isRound2RatingPayload(prior.response_json)) {
          yourPriorResponse = {
            rating: prior.response_json.rating,
            action: prior.response_json.action,
            submitted_at: prior.created_at,
          };
        }

        return {
          item_id: item.item_id,
          text: item.text,
          round_number: item.round_number,
          provenance_type: item.provenance_type,
          your_prior_response: yourPriorResponse,
        };
      });

      await writeAuditEvent({
        actor,
        action: "round2.items.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          count: items.length,
          participant_id: participantId,
        },
      });

      return reply.send({ items });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/round2/ratings",
    { preHandler: allowSubmit },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const actor = getActor(req);

      const participantId = String(body.participant_id ?? "");
      const itemId = String(body.item_id ?? "");
      const action = body.action === "keep" ? "keep" : "revise";

      if (!participantId) {
        return reply.code(400).send({ error: "participant_id_required" });
      }

      if (!itemId) {
        return reply.code(400).send({ error: "item_id_required" });
      }

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      if (studyVersion.status !== "Active") {
        return reply.code(409).send({ error: "study_version_not_active" });
      }

      const consentOk = hasActiveConsent({
        participant_id: participantId,
        study_id: studyId,
        version_id: versionId,
      });

      if (!consentOk) {
        await writeAuditEvent({
          actor,
          action: "round2.rating_blocked_no_active_consent",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: {
            studyId,
            versionId,
            participant_id: participantId,
            item_id: itemId,
          },
        });

        return reply.code(403).send({ error: "active_consent_required" });
      }

      const item = getItem(itemId);
      if (!item || item.study_id !== studyId || item.version_id !== versionId) {
        return reply.code(404).send({ error: "item_not_found" });
      }

      if (item.round_number !== 2 || item.status !== "Published") {
        return reply.code(409).send({ error: "item_not_available_for_round2_rating" });
      }

      const allResponses = listResponses({ study_id: studyId, version_id: versionId });
      const prior = getLatestRound2RatingsForItem(allResponses, itemId).get(participantId) ?? null;

      let rating: number;

      if (action === "keep") {
        if (!prior || !isRound2RatingPayload(prior.response_json)) {
          return reply.code(400).send({ error: "prior_rating_required_for_keep" });
        }

        rating = prior.response_json.rating;
      } else {
        const bodyRating = body.rating;

        if (typeof bodyRating !== "number" || !Number.isFinite(bodyRating)) {
          return reply.code(400).send({ error: "numeric_rating_required" });
        }

        rating = bodyRating;
      }

      const rec = createResponse({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
        response_json: {
          round_number: 2,
          item_id: itemId,
          rating,
          action,
        } satisfies Round2RatingPayload,
      });

      await writeAuditEvent({
        actor,
        action: action === "keep" ? "round2.rating_keep" : "round2.rating_revise",
        object: { type: "item", id: itemId },
        details: {
          studyId,
          versionId,
          participant_id: participantId,
          response_id: rec.response_id,
          rating,
        },
      });

      return reply.code(201).send({
        response_id: rec.response_id,
        participant_id: participantId,
        item_id: itemId,
        rating,
        action,
      });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/round2/items/:itemId/feedback",
    { preHandler: allowParticipantOrStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const { itemId } = (req.params ?? {}) as { itemId?: string };
      const actor = getActor(req);
      const query = (req.query ?? {}) as Record<string, unknown>;
      const participantId = String(query.participant_id ?? "");

      if (!itemId) {
        return reply.code(400).send({ error: "item_id_required" });
      }

      if (!participantId) {
        return reply.code(400).send({ error: "participant_id_required" });
      }

      const item = getItem(String(itemId));
      if (!item || item.study_id !== studyId || item.version_id !== versionId) {
        return reply.code(404).send({ error: "item_not_found" });
      }

      if (item.round_number !== 2 || item.status !== "Published") {
        return reply.code(409).send({ error: "item_not_available_for_round2_feedback" });
      }

      const allResponses = listResponses({ study_id: studyId, version_id: versionId });
      const latestByParticipant = getLatestRound2RatingsForItem(allResponses, String(itemId));

      const latestRatings = Array.from(latestByParticipant.values())
        .flatMap((response) => {
          if (!isRound2RatingPayload(response.response_json)) return [];
          return [response.response_json.rating];
        });

      const sorted = [...latestRatings].sort((a, b) => a - b);
      const medianValue = median(sorted);
      const q1 = percentileFromSorted(sorted, 0.25);
      const q3 = percentileFromSorted(sorted, 0.75);
      const minValue = sorted.length > 0 ? sorted[0] ?? null : null;
      const maxValue = sorted.length > 0 ? sorted[sorted.length - 1] ?? null : null;

      const prior = latestByParticipant.get(participantId) ?? null;

      let yourPriorResponse: { rating: number; action: "keep" | "revise"; submitted_at: string } | null = null;

      if (prior && isRound2RatingPayload(prior.response_json)) {
        yourPriorResponse = {
          rating: prior.response_json.rating,
          action: prior.response_json.action,
          submitted_at: prior.created_at,
        };
      }

      const distribution = buildDistribution(sorted);

      await writeAuditEvent({
        actor,
        action: "round2.feedback_get",
        object: { type: "item", id: String(itemId) },
        details: {
          studyId,
          versionId,
          participant_id: participantId,
          response_count: sorted.length,
        },
      });

      return reply.send({
        item: {
          item_id: item.item_id,
          text: item.text,
          round_number: item.round_number,
        },
        feedback: {
          median: medianValue,
          dispersion: {
            min: minValue,
            max: maxValue,
            iqr: q1 !== null && q3 !== null ? q3 - q1 : null,
            q1,
            q3,
          },
          distribution,
          response_count: sorted.length,
        },
        your_prior_response: yourPriorResponse,
        actions: {
          primary: ["keep", "revise"],
        },
      });
    }
  );
}

