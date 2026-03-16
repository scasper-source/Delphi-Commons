import type { FastifyInstance } from "fastify";
import { listItems, type ItemRecord } from "../stores/itemStore.js";
import { listResponses, type ResponseRecord } from "../stores/responseStore.js";
import { getStudy, getStudyVersion, listSignoffs } from "../studies/store.js";
import { sha256Json } from "../studies/hash.js";
import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";

type RatingRoundPayload = {
  round_number: number;
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

function getRoundNumber(params: unknown): number | null {
  const p = (params ?? {}) as Record<string, unknown>;
  const raw = p.roundNumber ?? p.round_number ?? null;

  if (typeof raw === "number" && Number.isInteger(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    return Number.isInteger(parsed) ? parsed : null;
  }

  return null;
}

function isRatingRoundPayload(value: unknown, roundNumber: number): value is RatingRoundPayload {
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

function getLatestRatingsForItem(
  responses: ResponseRecord[],
  itemId: string,
  roundNumber: number
): Map<string, ResponseRecord> {
  const latest = new Map<string, ResponseRecord>();

  for (const response of responses) {
    if (!isRatingRoundPayload(response.response_json, roundNumber)) continue;
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

function sortItems(items: ItemRecord[]): ItemRecord[] {
  return [...items].sort((a, b) => {
    const byCreated = a.created_at.localeCompare(b.created_at);
    if (byCreated !== 0) return byCreated;
    return a.item_id.localeCompare(b.item_id);
  });
}

function sortResponses(responses: ResponseRecord[]): ResponseRecord[] {
  return [...responses].sort((a, b) => {
    const byCreated = a.created_at.localeCompare(b.created_at);
    if (byCreated !== 0) return byCreated;
    return a.response_id.localeCompare(b.response_id);
  });
}

function getAgreementMinRating(rule: unknown): number {
  if (!rule || typeof rule !== "object") return 7;

  const rec = rule as Record<string, unknown>;
  const explicit = rec.agreement_min_rating;

  if (typeof explicit === "number" && Number.isFinite(explicit)) {
    return explicit;
  }

  return 7;
}

function evaluateConsensus(rule: unknown, ratings: number[]) {
  if (!rule || typeof rule !== "object") {
    return {
      status: "undetermined",
      method: null,
      threshold_percent: null,
      agreement_min_rating: null,
      agreement_count: null,
      agreement_percent: null,
      reason: "consensus_rule_missing",
    };
  }

  const rec = rule as Record<string, unknown>;
  const type = rec.type;

  if (type === "percent_agreement") {
    const threshold = rec.threshold;

    if (typeof threshold !== "number" || !Number.isFinite(threshold)) {
      return {
        status: "undetermined",
        method: "percent_agreement",
        threshold_percent: null,
        agreement_min_rating: null,
        agreement_count: null,
        agreement_percent: null,
        reason: "invalid_percent_agreement_threshold",
      };
    }

    const agreementMinRating = getAgreementMinRating(rule);
    const agreementCount = ratings.filter((rating) => rating >= agreementMinRating).length;
    const agreementPercent =
      ratings.length > 0 ? Number(((agreementCount / ratings.length) * 100).toFixed(2)) : null;

    return {
      status:
        agreementPercent !== null && agreementPercent >= threshold
          ? "consensus"
          : "non_consensus",
      method: "percent_agreement",
      threshold_percent: threshold,
      agreement_min_rating: agreementMinRating,
      agreement_count: agreementCount,
      agreement_percent: agreementPercent,
      reason: null,
    };
  }

  return {
    status: "undetermined",
    method: typeof type === "string" ? type : "unknown",
    threshold_percent: null,
    agreement_min_rating: null,
    agreement_count: null,
    agreement_percent: null,
    reason: "unsupported_consensus_rule_type_for_mvp_export",
  };
}

function getMaxAllowedRound(studyFormat: string | null): number {
  if (studyFormat === "ModifiedDelphi") return 3;
  if (studyFormat === "ClassicDelphi") return 4;
  return 2;
}

function getAllowedRatingRounds(studyFormat: string | null): number[] {
  const maxRound = getMaxAllowedRound(studyFormat);
  const rounds: number[] = [];
  for (let round = 2; round <= maxRound; round += 1) {
    rounds.push(round);
  }
  return rounds;
}

function isAllowedRatingRound(studyFormat: string | null, roundNumber: number): boolean {
  return getAllowedRatingRounds(studyFormat).includes(roundNumber);
}

function buildRoundItemReports(
  publishedItems: ItemRecord[],
  allResponses: ResponseRecord[],
  roundNumber: number,
  consensusRule: unknown
) {
  return publishedItems.map((item) => {
    const latestByParticipant = getLatestRatingsForItem(allResponses, item.item_id, roundNumber);

    const latestRatings = Array.from(latestByParticipant.values())
      .flatMap((response) => {
        if (!isRatingRoundPayload(response.response_json, roundNumber)) return [];
        return [response.response_json.rating];
      })
      .sort((a, b) => a - b);

    const distribution = buildDistribution(latestRatings);
    const medianValue = median(latestRatings);
    const q1 = percentileFromSorted(latestRatings, 0.25);
    const q3 = percentileFromSorted(latestRatings, 0.75);
    const minValue = latestRatings.length > 0 ? latestRatings[0] ?? null : null;
    const maxValue =
      latestRatings.length > 0 ? latestRatings[latestRatings.length - 1] ?? null : null;

    const consensus = evaluateConsensus(consensusRule, latestRatings);

    return {
      item_id: item.item_id,
      text: item.text,
      round_number: item.round_number,
      provenance_type: item.provenance_type,
      created_from: item.created_from,
      created_at: item.created_at,
      rating_summary: {
        response_count: latestRatings.length,
        median: medianValue,
        dispersion: {
          min: minValue,
          max: maxValue,
          iqr: q1 !== null && q3 !== null ? q3 - q1 : null,
          q1,
          q3,
        },
        distribution,
      },
      consensus,
    };
  });
}

export async function reportsRoutes(app: FastifyInstance) {
  const allowStaffRead = requireRole(["owner", "methods_steward"]);

  app.get(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/summary",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const roundNumber = getRoundNumber(req.params);
      const actor = getActor(req);

      if (roundNumber === null) {
        return reply.code(400).send({ error: "round_number_required" });
      }

      if (roundNumber < 2) {
        return reply.code(400).send({ error: "rating_round_must_be_gte_2" });
      }

      const study = await getStudy(studyId);
      if (!study) {
        return reply.code(404).send({ error: "study_not_found" });
      }

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      if (!isAllowedRatingRound(studyVersion.study_format, roundNumber)) {
        return reply.code(409).send({
          error: "round_not_allowed_for_study_design",
          allowed_rounds: getAllowedRatingRounds(studyVersion.study_format),
        });
      }

      const allItems = sortItems(
        listItems({
          study_id: studyId,
          version_id: versionId,
        })
      );

      const publishedRoundItems = allItems.filter(
        (item) => item.round_number === roundNumber && item.status === "Published"
      );

      const allResponses = sortResponses(
        listResponses({
          study_id: studyId,
          version_id: versionId,
        })
      );

      const roundResponses = allResponses.filter((response) =>
        isRatingRoundPayload(response.response_json, roundNumber)
      );

      const itemReports = buildRoundItemReports(
        publishedRoundItems,
        allResponses,
        roundNumber,
        studyVersion.consensus_rule_json
      );

      const consensusCount = itemReports.filter((item) => item.consensus.status === "consensus").length;
      const nonConsensusCount = itemReports.filter(
        (item) => item.consensus.status === "non_consensus"
      ).length;
      const undeterminedCount = itemReports.filter(
        (item) => item.consensus.status === "undetermined"
      ).length;

      await writeAuditEvent({
        actor,
        action: "round.summary_get",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          round_number: roundNumber,
          published_item_count: publishedRoundItems.length,
        },
      });

      return reply.send({
        study,
        study_version: studyVersion,
        round_number: roundNumber,
        summary: {
          published_item_count: publishedRoundItems.length,
          consensus_item_count: consensusCount,
          non_consensus_item_count: nonConsensusCount,
          undetermined_item_count: undeterminedCount,
          round_submission_count: roundResponses.length,
          unique_rated_item_count: new Set(
            roundResponses.flatMap((response) =>
              isRatingRoundPayload(response.response_json, roundNumber)
                ? [response.response_json.item_id]
                : []
            )
          ).size,
        },
        items: itemReports,
      });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/export-report",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);

      const study = await getStudy(studyId);
      if (!study) {
        return reply.code(404).send({ error: "study_not_found" });
      }

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      const signoffs = (await listSignoffs(versionId)).sort((a, b) =>
        a.required_role.localeCompare(b.required_role)
      );

      const allItems = sortItems(
        listItems({
          study_id: studyId,
          version_id: versionId,
        })
      );

      const publishedRound2Items = allItems.filter(
        (item) => item.round_number === 2 && item.status === "Published"
      );

      const allResponses = sortResponses(
        listResponses({
          study_id: studyId,
          version_id: versionId,
        })
      );

      const round1Responses = allResponses.filter(
        (response) => !isRatingRoundPayload(response.response_json, 2)
      );

      const round2Responses = allResponses.filter((response) =>
        isRatingRoundPayload(response.response_json, 2)
      );

      const itemReports = buildRoundItemReports(
        publishedRound2Items,
        allResponses,
        2,
        studyVersion.consensus_rule_json
      );

      const consensusCount = itemReports.filter((item) => item.consensus.status === "consensus").length;
      const nonConsensusCount = itemReports.filter(
        (item) => item.consensus.status === "non_consensus"
      ).length;
      const undeterminedCount = itemReports.filter(
        (item) => item.consensus.status === "undetermined"
      ).length;

      const datasetHash = sha256Json({
        study,
        studyVersion,
        signoffs,
        items: publishedRound2Items,
        responses: allResponses,
      });

      const agreementMinRating = getAgreementMinRating(studyVersion.consensus_rule_json);

      const report = {
        generated_at: new Date().toISOString(),
        generated_by: actor,
        study,
        study_version: studyVersion,
        hashes: {
          config_hash: studyVersion.config_hash,
          dataset_hash: datasetHash,
        },
        signoffs,
        methods: {
          study_format: studyVersion.study_format,
          planned_round_count: studyVersion.planned_round_count,
          terminal_round_number: studyVersion.terminal_round_number,
          method_rationale: studyVersion.method_rationale,
          round_scope:
            "Current MVP export summarizes the active StudyVersion and published Round 2 items. Ticket 12 adds per-round summary endpoints for later rating rounds; final round-aware export remains a later ticket.",
          rating_aggregation:
            "Per item, only the latest rating from each participant in the summarized rating round is used for summary statistics and consensus classification.",
          consensus_definition: studyVersion.consensus_rule_json,
          consensus_operationalization:
            "For percent_agreement, consensus is computed as the percent of latest participant ratings greater than or equal to agreement_min_rating.",
          default_agreement_min_rating_used_when_missing: agreementMinRating,
          rounds_note:
            "The consensus rule and declared study design are StudyVersion-level configuration chosen before Round 1 and intended to hold across later rounds in that StudyVersion.",
        },
        limitations: [
          "Consensus does not imply correctness.",
          "This MVP export defaults agreement_min_rating to 7 when the consensus rule omits an explicit cutpoint.",
          "Round 1 responses are stored as flexible JSON payloads, so this export treats any non-rating payload in the version as Round 1 material for summary purposes.",
          "This export endpoint remains Round 2-centered until the later final round-aware reporting ticket.",
          "Use the per-round summary endpoint to inspect later rating rounds before final-report support is added.",
        ],
        summary: {
          study_format: studyVersion.study_format,
          planned_round_count: studyVersion.planned_round_count,
          terminal_round_number: studyVersion.terminal_round_number,
          published_round2_item_count: publishedRound2Items.length,
          consensus_item_count: consensusCount,
          non_consensus_item_count: nonConsensusCount,
          undetermined_item_count: undeterminedCount,
          round1_response_count: round1Responses.length,
          round2_submission_count: round2Responses.length,
          round2_unique_rated_item_count: new Set(
            round2Responses.flatMap((response) =>
              isRatingRoundPayload(response.response_json, 2)
                ? [response.response_json.item_id]
                : []
            )
          ).size,
        },
        items: itemReports,
      };

      await writeAuditEvent({
        actor,
        action: "report.export",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          config_hash: studyVersion.config_hash,
          dataset_hash: datasetHash,
          published_round2_item_count: publishedRound2Items.length,
          study_format: studyVersion.study_format,
          terminal_round_number: studyVersion.terminal_round_number,
        },
      });

      return reply.send({ report });
    }
  );
}
