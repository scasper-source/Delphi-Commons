import type { FastifyInstance } from "fastify";
import { listItems, type ItemRecord } from "../stores/itemStore.js";
import { listResponses, type ResponseRecord } from "../stores/responseStore.js";
import { getStudy, getStudyVersion, listSignoffs } from "../studies/store.js";
import { sha256Json } from "../studies/hash.js";
import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";
import {
  createExportPackage,
  listExportPackageFiles,
  listExportPackageReviews,
  listExportPackages,
  recordExportManifest,
  recordExportPackageReview,
} from "../stores/exportManifestStore.js";
import {
  renderFinalDelphiReportDocx,
  renderFinalItemResultsXlsx,
  type FinalItemResultRow,
} from "../exports/finalReportRenderers.js";

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

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? value : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0] ?? {});
  return [
    headers.map(csvCell).join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(",")),
  ].join("\n");
}

function requiredLimitationsMarkdown(): string {
  return [
    "# Required Limitations and Disclosures",
    "",
    "## Delphi Method Limitation",
    "Consensus indicates agreement among this panel; it does not establish correctness.",
    "",
    "## Panel Limitation",
    "This Delphi study used a purposively selected expert/stakeholder panel and does not represent a random sample.",
    "",
    "## Feedback Limitation",
    "Participant responses may have been influenced by structured feedback across rounds.",
    "",
    "## Consensus Threshold Disclosure",
    "The consensus threshold was defined before the study began and was not changed mid-study.",
    "",
    "## Non-Consensus Disclosure",
    "Items not reaching consensus are preserved as meaningful study findings and should not be interpreted as unimportant solely because they did not reach consensus.",
    "",
    "## AI Assistance Disclosure",
    "Where AI assistance was used, AI-generated outputs were treated as draft suggestions only. Human reviewers made all final decisions about item wording, inclusion, exclusion, merging, splitting, reporting, and export.",
    "",
  ].join("\n");
}

function finalItemResultsRows(input: {
  studyId: string;
  versionId: string;
  finalRoundNumber: number;
  itemReports: ReturnType<typeof buildRoundItemReports>;
  publishedItems: ItemRecord[];
  nInvited: number;
  consensusThreshold: number | null;
}): FinalItemResultRow[] {
  const itemById = new Map(input.publishedItems.map((item) => [item.item_id, item]));
  return input.itemReports.map((itemReport) => {
    const item = itemById.get(itemReport.item_id);
    const nResponded = itemReport.rating_summary.response_count;
    const consensusStatus = itemReport.consensus.status === "undetermined"
      ? "insufficient_response"
      : itemReport.consensus.status;

    return {
      study_id: input.studyId,
      study_version_id: input.versionId,
      round_number: input.finalRoundNumber,
      round_id: `${input.versionId}:round:${input.finalRoundNumber}`,
      item_id: itemReport.item_id,
      item_version_id: itemReport.item_id,
      item_text: itemReport.text,
      item_origin: item?.created_from === "ai" ? "ai_suggested" : itemReport.provenance_type === "LiteratureDerived" ? "literature_derived" : "panel_derived",
      source_response_count: item?.ai_provenance_links.filter((link) => link.source_type === "response").length ?? 0,
      n_invited: input.nInvited,
      n_responded: nResponded,
      response_rate: input.nInvited > 0 ? nResponded / input.nInvited : 0,
      scale_min: 1,
      scale_max: 9,
      median: itemReport.rating_summary.median,
      iqr: itemReport.rating_summary.dispersion.iqr,
      mean: "",
      std_dev: "",
      percent_agree: itemReport.consensus.agreement_percent,
      consensus_threshold: input.consensusThreshold,
      consensus_status: consensusStatus,
      majority_view_summary: "Neutral aggregate rating summary is available in the distribution fields.",
      minority_view_summary: consensusStatus === "non_consensus"
        ? "Non-consensus ratings are retained as meaningful study findings."
        : "Distinct lower-frequency views should be reviewed in the provenance bundle where available.",
      minority_view_retained: consensusStatus === "non_consensus",
      near_consensus_flag: false,
      non_consensus_flag: consensusStatus === "non_consensus",
      included_in_final_report: true,
      exclusion_reason: "",
      exclusion_rationale: "",
    };
  });
}

function finalItemResultsCsv(input: Parameters<typeof finalItemResultsRows>[0]) {
  return toCsv(finalItemResultsRows(input));
}

export async function reportsRoutes(app: FastifyInstance) {
  const allowStaffRead = requireRole(["owner", "methods_steward"]);
  const allowExportGovernance = requireRole([
    "owner",
    "methods_steward",
    "privacy_lead",
    "data_custodian",
    "admin",
    "maintainer",
  ]);

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
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/report",
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

      const signoffs = (await listSignoffs(versionId)).sort((a, b) =>
        a.required_role.localeCompare(b.required_role)
      );

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

      const datasetHash = sha256Json({
        study,
        studyVersion,
        signoffs,
        round_number: roundNumber,
        items: publishedRoundItems,
        responses: roundResponses,
      });

      const agreementMinRating = getAgreementMinRating(studyVersion.consensus_rule_json);
      const isFinalForDeclaredDesign = roundNumber === studyVersion.terminal_round_number;
      const reportStage = isFinalForDeclaredDesign ? "final" : "interim";

      const report = {
        generated_at: new Date().toISOString(),
        generated_by: actor,
        report_kind: "round_report",
        report_stage: reportStage,
        is_final_for_declared_design: isFinalForDeclaredDesign,
        study,
        study_version: studyVersion,
        round_number: roundNumber,
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
            "This report summarizes the specified published rating round within the active StudyVersion using the declared study design.",
          rating_aggregation:
            "Per item, only the latest rating from each participant in the summarized rating round is used for summary statistics and consensus classification.",
          consensus_definition: studyVersion.consensus_rule_json,
          consensus_operationalization:
            "For percent_agreement, consensus is computed as the percent of latest participant ratings greater than or equal to agreement_min_rating.",
          default_agreement_min_rating_used_when_missing: agreementMinRating,
          rounds_note:
            "The consensus rule and declared study design are StudyVersion-level configuration chosen before Round 1 and intended to hold across later rounds in that StudyVersion.",
        },
        statements: {
          report_status:
            isFinalForDeclaredDesign
              ? `This report is final for the declared StudyVersion design because Round ${roundNumber} is the terminal round.`
              : `This report is not final for the declared StudyVersion design because Round ${roundNumber} is earlier than the terminal round ${studyVersion.terminal_round_number}.`,
          consensus_caution: "Consensus does not imply correctness.",
        },
        limitations: [
          "Consensus does not imply correctness.",
          "This MVP report defaults agreement_min_rating to 7 when the consensus rule omits an explicit cutpoint.",
          "Only the latest rating from each participant in the summarized round is counted for each item.",
          isFinalForDeclaredDesign
            ? "This report is final for the declared StudyVersion design, but later governance or export enhancements may present the same underlying results in a different final-report format."
            : "This report is interim relative to the declared StudyVersion design and should not be treated as the last word of the process.",
        ],
        summary: {
          study_format: studyVersion.study_format,
          planned_round_count: studyVersion.planned_round_count,
          terminal_round_number: studyVersion.terminal_round_number,
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
      };

      await writeAuditEvent({
        actor,
        action: "round.report_get",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          round_number: roundNumber,
          report_stage: reportStage,
          config_hash: studyVersion.config_hash,
          dataset_hash: datasetHash,
          published_item_count: publishedRoundItems.length,
        },
      });

      return reply.send({ report });
    }
  );
  app.get(
    "/studies/:studyId/versions/:versionId/export-report",
    { preHandler: allowExportGovernance },
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

      const finalRoundNumber = studyVersion.terminal_round_number;
      if (finalRoundNumber === null || !isAllowedRatingRound(studyVersion.study_format, finalRoundNumber)) {
        return reply.code(409).send({ error: "terminal_round_not_valid_for_study_design" });
      }

      const allItems = sortItems(
        listItems({
          study_id: studyId,
          version_id: versionId,
        })
      );

      const publishedFinalRoundItems = allItems.filter(
        (item) => item.round_number === finalRoundNumber && item.status === "Published"
      );

      const allResponses = sortResponses(
        listResponses({
          study_id: studyId,
          version_id: versionId,
        })
      );

      const round1Responses = allResponses.filter(
        (response) => !getAllowedRatingRounds(studyVersion.study_format).some((round) =>
          isRatingRoundPayload(response.response_json, round)
        )
      );

      const finalRoundResponses = allResponses.filter((response) =>
        isRatingRoundPayload(response.response_json, finalRoundNumber)
      );

      const itemReports = buildRoundItemReports(
        publishedFinalRoundItems,
        allResponses,
        finalRoundNumber,
        studyVersion.consensus_rule_json
      );

      const consensusCount = itemReports.filter((item) => item.consensus.status === "consensus").length;
      const nonConsensusCount = itemReports.filter(
        (item) => item.consensus.status === "non_consensus"
      ).length;
      const undeterminedCount = itemReports.filter(
        (item) => item.consensus.status === "undetermined"
      ).length;

      const nonConsensusItems = itemReports.filter(
        (item) => item.consensus.status === "non_consensus"
      );

      const datasetHash = sha256Json({
        study,
        studyVersion,
        signoffs,
        round_number: finalRoundNumber,
        items: publishedFinalRoundItems,
        responses: finalRoundResponses,
      });

      const agreementMinRating = getAgreementMinRating(studyVersion.consensus_rule_json);
      const consensusThreshold =
        itemReports.find((item) => item.consensus.threshold_percent !== null)?.consensus.threshold_percent ?? null;
      const dataCutoffAt =
        allResponses.map((response) => response.created_at).sort().at(-1) ??
        publishedFinalRoundItems.map((item) => item.created_at).sort().at(-1) ??
        new Date().toISOString();
      const nInvited = new Set(allResponses.map((response) => response.participant_id)).size;
      const limitationsMarkdown = requiredLimitationsMarkdown();
      const itemResultsInput = {
        studyId,
        versionId,
        finalRoundNumber,
        itemReports,
        publishedItems: publishedFinalRoundItems,
        nInvited,
        consensusThreshold,
      };
      const itemResultsRows = finalItemResultsRows(itemResultsInput);
      const itemResultsCsv = toCsv(itemResultsRows);

      const report = {
        generated_at: new Date().toISOString(),
        generated_by: actor,
        report_kind: "final_export_report",
        report_stage: "final",
        study,
        study_version: studyVersion,
        final_round_number: finalRoundNumber,
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
            "This final export summarizes the terminal rating round defined by the declared StudyVersion design.",
          rating_aggregation:
            "Per item, only the latest rating from each participant in the final summarized rating round is used for summary statistics and consensus classification.",
          consensus_definition: studyVersion.consensus_rule_json,
          consensus_operationalization:
            "For percent_agreement, consensus is computed as the percent of latest participant ratings greater than or equal to agreement_min_rating.",
          default_agreement_min_rating_used_when_missing: agreementMinRating,
          rounds_note:
            "The consensus rule and declared study design are StudyVersion-level configuration chosen before Round 1 and intended to hold across later rounds in that StudyVersion.",
        },
        auditability: {
          config_hash: studyVersion.config_hash,
          dataset_hash: datasetHash,
          generated_at: new Date().toISOString(),
          generated_by: actor,
          signoff_count: signoffs.length,
        },
        limitations: [
          "Consensus indicates agreement among this panel; it does not establish correctness.",
          "This MVP export defaults agreement_min_rating to 7 when the consensus rule omits an explicit cutpoint.",
          "Round 1 responses are stored as flexible JSON payloads, so this export treats any non-rating payload in the version as Round 1 material for summary purposes.",
          "Only the latest rating from each participant in the final summarized round is counted for each item.",
        ],
        summary: {
          study_format: studyVersion.study_format,
          planned_round_count: studyVersion.planned_round_count,
          terminal_round_number: studyVersion.terminal_round_number,
          final_round_number: finalRoundNumber,
          published_final_round_item_count: publishedFinalRoundItems.length,
          consensus_item_count: consensusCount,
          non_consensus_item_count: nonConsensusCount,
          undetermined_item_count: undeterminedCount,
          round1_response_count: round1Responses.length,
          final_round_submission_count: finalRoundResponses.length,
          final_round_unique_rated_item_count: new Set(
            finalRoundResponses.flatMap((response) =>
              isRatingRoundPayload(response.response_json, finalRoundNumber)
                ? [response.response_json.item_id]
                : []
            )
          ).size,
        },
        non_consensus_items: nonConsensusItems,
        items: itemReports,
      };

      const auditEvent = await writeAuditEvent({
        actor,
        action: "report.export",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          final_round_number: finalRoundNumber,
          config_hash: studyVersion.config_hash,
          dataset_hash: datasetHash,
          published_final_round_item_count: publishedFinalRoundItems.length,
          study_format: studyVersion.study_format,
          terminal_round_number: studyVersion.terminal_round_number,
        },
      });

      const manifest = recordExportManifest({
        study_id: studyId,
        version_id: versionId,
        package_type: "final-delphi-report",
        generated_by: actor,
        audit_event_id: auditEvent.id,
        config_hash: studyVersion.config_hash,
        dataset_hash: datasetHash,
        content: report,
        data_scope: {
          final_round_number: finalRoundNumber,
          response_scope: "terminal_rating_round_and_round1_summary",
          item_scope: "published_terminal_round_items",
        },
        redaction_profile: {
          direct_identifiers: "excluded",
          identity_response_mapping: "excluded",
          participant_ids: "retained_for_internal_traceability_only",
        },
      });

      const finalReportDocx = renderFinalDelphiReportDocx({
        report,
        itemResults: itemResultsRows,
        limitationsMarkdown,
      });
      const finalItemResultsXlsx = renderFinalItemResultsXlsx({
        report,
        itemResults: itemResultsRows,
        limitationsMarkdown,
      });

      const exportPackage = createExportPackage({
        study_id: studyId,
        study_version_id: versionId,
        export_type: "final-delphi-report",
        generated_by: actor,
        audit_event_id: auditEvent.id,
        data_cutoff_at: dataCutoffAt,
        consensus_rule_version_id: studyVersion.config_hash,
        feedback_config_version_id: studyVersion.config_hash,
        instrument_version_ids: [versionId],
        contains_identifiable_data: false,
        anonymization_level: "aggregated_only",
        external_ai_used: false,
        human_review_required: true,
        human_review_status: "pending_review",
        limitations_text_version_id: "charter-required-limitations-v1",
        files: [
          {
            path: "final_report/final_delphi_report.docx",
            content: finalReportDocx,
            format: ".docx",
            record_count: itemReports.length,
            contains_identifiable_data: false,
            redaction_profile: {
              direct_identifiers: "excluded",
              identity_response_mapping: "excluded",
              participant_ids: "excluded_from_public_report",
            },
          },
          {
            path: "final_report/final_item_results.xlsx",
            content: finalItemResultsXlsx,
            format: ".xlsx",
            record_count: itemReports.length,
            contains_identifiable_data: false,
            redaction_profile: {
              direct_identifiers: "excluded",
              identity_response_mapping: "excluded",
              participant_ids: "excluded",
            },
          },
          {
            path: "final_report/final_delphi_report.json",
            content: JSON.stringify(report, null, 2),
            format: ".json",
            record_count: itemReports.length,
            contains_identifiable_data: false,
            redaction_profile: {
              direct_identifiers: "excluded",
              identity_response_mapping: "excluded",
              participant_ids: "excluded_from_public_report",
            },
          },
          {
            path: "final_report/final_item_results.csv",
            content: itemResultsCsv,
            format: ".csv",
            record_count: itemReports.length,
            contains_identifiable_data: false,
            redaction_profile: {
              direct_identifiers: "excluded",
              identity_response_mapping: "excluded",
              participant_ids: "excluded",
            },
          },
          {
            path: "final_report/required_limitations_and_disclosures.md",
            content: limitationsMarkdown,
            format: ".md",
            record_count: null,
            contains_identifiable_data: false,
            redaction_profile: {
              direct_identifiers: "not_applicable",
              identity_response_mapping: "not_applicable",
            },
          },
        ],
      });

      return reply.send({ report, export_manifest: manifest, export_package: exportPackage });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/export-packages",
    { preHandler: allowExportGovernance },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const exportPackages = listExportPackages({ study_id: studyId, study_version_id: versionId });
      const reviews = listExportPackageReviews({ study_id: studyId, study_version_id: versionId });
      return reply.send({
        export_packages: exportPackages.map((pkg) => ({
          ...pkg,
          reviews: reviews.filter((review) => review.export_package_id === pkg.export_package_id),
        })),
      });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/export-packages/:packageId/files",
    { preHandler: allowExportGovernance },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const { packageId } = req.params as any;
      const pkg = listExportPackages({ study_id: studyId, study_version_id: versionId })
        .find((entry) => entry.export_package_id === String(packageId));
      if (!pkg) return reply.code(404).send({ error: "export_package_not_found" });

      return reply.send({
        export_package: pkg,
        files: listExportPackageFiles(pkg.export_package_id),
      });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/export-packages/:packageId/files/:fileId/download",
    { preHandler: allowExportGovernance },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const { packageId, fileId } = req.params as any;
      const actor = getActor(req);
      const pkg = listExportPackages({ study_id: studyId, study_version_id: versionId })
        .find((entry) => entry.export_package_id === String(packageId));
      if (!pkg) return reply.code(404).send({ error: "export_package_not_found" });

      const file = listExportPackageFiles(pkg.export_package_id)
        .find((entry) => entry.export_file_id === String(fileId));
      if (!file) return reply.code(404).send({ error: "export_file_not_found" });

      await writeAuditEvent({
        actor,
        action: "export.file_download",
        object: { type: "export_file", id: file.export_file_id },
        details: {
          studyId,
          versionId,
          export_package_id: pkg.export_package_id,
          path: file.path,
          format: file.format,
          sha256: file.sha256,
          contains_identifiable_data: file.contains_identifiable_data,
        },
      });

      return reply.send({ export_package: pkg, file });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/export-packages/:packageId/review",
    { preHandler: allowExportGovernance },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const { packageId } = req.params as any;
      const body = (req.body ?? {}) as Record<string, unknown>;
      const actor = getActor(req);
      const reviewStatus = body.review_status;
      const note = typeof body.note === "string" ? body.note.trim() : "";

      if (reviewStatus !== "approved" && reviewStatus !== "rejected") {
        return reply.code(400).send({ error: "review_status_required" });
      }
      if (!note) {
        return reply.code(400).send({ error: "review_note_required" });
      }

      const pkg = listExportPackages({ study_id: studyId, study_version_id: versionId })
        .find((entry) => entry.export_package_id === String(packageId));
      if (!pkg) return reply.code(404).send({ error: "export_package_not_found" });

      const auditEvent = await writeAuditEvent({
        actor,
        action: "export.package_review",
        object: { type: "export_package", id: pkg.export_package_id },
        details: {
          studyId,
          versionId,
          export_package_id: pkg.export_package_id,
          review_status: reviewStatus,
          note,
        },
      });

      const review = recordExportPackageReview({
        export_package_id: pkg.export_package_id,
        study_id: studyId,
        study_version_id: versionId,
        reviewed_by: actor,
        review_status: reviewStatus,
        note,
        audit_event_id: auditEvent.id,
      });

      return reply.code(201).send({
        export_package: pkg,
        review,
        reviews: listExportPackageReviews({ export_package_id: pkg.export_package_id }),
      });
    }
  );
}


