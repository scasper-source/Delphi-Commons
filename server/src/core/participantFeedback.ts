import type { ItemRecord } from "../stores/itemStore.js";
import type { ResponseRecord } from "../stores/responseStore.js";
import type { FeedbackConfig } from "../stores/roundConfigStore.js";

type RatingPayload = {
  round_number: number;
  item_id: string;
  rating: number;
  action: "keep" | "revise";
};

function isRatingPayload(value: unknown, roundNumber: number): value is RatingPayload {
  if (!value || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  return (
    rec.round_number === roundNumber &&
    typeof rec.item_id === "string" &&
    typeof rec.rating === "number" &&
    Number.isFinite(rec.rating) &&
    (rec.action === "keep" || rec.action === "revise")
  );
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid] ?? null;
  const left = sorted[mid - 1];
  const right = sorted[mid];
  return left === undefined || right === undefined ? null : (left + right) / 2;
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0] ?? null;
  const idx = (sorted.length - 1) * p;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  const lowerValue = sorted[lower];
  const upperValue = sorted[upper];
  if (lowerValue === undefined || upperValue === undefined) return null;
  if (lower === upper) return lowerValue;
  return lowerValue + (upperValue - lowerValue) * (idx - lower);
}

function distribution(values: number[]): Record<string, number> {
  const output: Record<string, number> = {};
  for (const value of values) output[String(value)] = (output[String(value)] ?? 0) + 1;
  return output;
}

export function participantProvenanceLabel(item: ItemRecord):
  | "panel-generated"
  | "literature-derived"
  | "researcher-added"
  | "AI-assisted draft, human approved" {
  if (item.created_from === "ai" && item.status === "Published") return "AI-assisted draft, human approved";
  if (item.provenance_type === "LiteratureDerived") return "literature-derived";
  if (item.ai_provenance_links.length > 0) return "panel-generated";
  return "researcher-added";
}

function sourceItemIds(item: ItemRecord): string[] {
  const ids = new Set<string>([item.item_id]);
  for (const link of item.ai_provenance_links) {
    if (link.source_type === "item") ids.add(link.source_id);
  }
  return [...ids];
}

function latestRatingForParticipant(
  responses: ResponseRecord[],
  itemIds: string[],
  roundNumber: number,
  participantId: string,
): ResponseRecord | null {
  let latest: ResponseRecord | null = null;
  for (const response of responses) {
    if (response.participant_id !== participantId) continue;
    if (!isRatingPayload(response.response_json, roundNumber)) continue;
    if (!itemIds.includes(response.response_json.item_id)) continue;
    latest = response;
  }
  return latest;
}

export function buildParticipantControlledFeedback(input: {
  item: ItemRecord;
  responses: ResponseRecord[];
  roundNumber: number;
  participantId: string;
  feedbackConfig: FeedbackConfig | null;
}) {
  const sourceRound = input.roundNumber - 1;
  const itemIds = sourceItemIds(input.item);
  const latestByParticipant = new Map<string, ResponseRecord>();
  for (const response of input.responses) {
    if (!isRatingPayload(response.response_json, sourceRound)) continue;
    if (!itemIds.includes(response.response_json.item_id)) continue;
    latestByParticipant.set(response.participant_id, response);
  }

  const ratings = [...latestByParticipant.values()]
    .flatMap((response) => isRatingPayload(response.response_json, sourceRound) ? [response.response_json.rating] : [])
    .sort((a, b) => a - b);
  const q1 = percentile(ratings, 0.25);
  const q3 = percentile(ratings, 0.75);
  const prior = latestRatingForParticipant(input.responses, itemIds, sourceRound, input.participantId);
  const priorPayload = prior && isRatingPayload(prior.response_json, sourceRound) ? prior.response_json : null;
  const format = input.feedbackConfig?.format ?? "distribution_only";

  return {
    source_round_number: sourceRound,
    format,
    show_participant_prior_response: input.feedbackConfig?.show_participant_prior_response ?? true,
    item_source: participantProvenanceLabel(input.item),
    participant_prior_response:
      input.feedbackConfig?.show_participant_prior_response === false || !priorPayload
        ? null
        : { rating: priorPayload.rating, action: priorPayload.action, submitted_at: prior?.created_at ?? null },
    group_summary: {
      median: median(ratings),
      iqr: q1 !== null && q3 !== null ? q3 - q1 : null,
      q1,
      q3,
      response_count: ratings.length,
      distribution: distribution(ratings),
    },
    neutral_summary:
      format === "distribution_summary" || format === "distribution_rationales"
        ? {
            approved: true,
            text:
              ratings.length > 0
                ? "Anonymized prior-round responses are summarized as aggregate ratings. Different views remain valuable."
                : "No prior-round aggregate ratings are available for this item yet.",
          }
        : null,
    rationale_excerpts:
      format === "distribution_rationales"
        ? {
            approved: true,
            excerpts: input.item.ai_provenance_links
              .flatMap((link) => link.excerpt ? [link.excerpt] : [])
              .slice(0, 2),
          }
        : null,
  };
}
