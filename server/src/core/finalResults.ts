/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "node:crypto";
import { getStudy, getStudyVersion } from "../studies/store.js";
import { getRoundConfig, listRoundConfigs } from "../stores/roundConfigStore.js";
import { listItems, type ItemRecord } from "../stores/itemStore.js";
import { listResponses, type ResponseRecord } from "../stores/responseStore.js";
import { redactExportText } from "../exports/exportPrivacy.js";
import { buildAttritionSummary } from "./attrition.js";
import {
  FINAL_RESULT_REQUIRED_STATEMENT,
  getFinalResultSnapshot,
  saveFinalResultSnapshot,
  type FinalItemOutcome,
  type FinalResultSnapshot,
} from "../stores/finalResultStore.js";
import {
  listNonResponseEscalations,
  listParticipantEnrollments,
} from "../stores/participantStatusStore.js";
import { summarizeRatings } from "./ratingStats.js";

type RatingPayload = {
  round_number: number;
  item_id: string;
  rating: number;
  action: "keep" | "revise";
  rationale_text?: string;
};

function sha256Json(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function getMaxAllowedRound(studyFormat: string | null): number {
  if (studyFormat === "ModifiedDelphi") return 3;
  if (studyFormat === "ClassicDelphi") return 4;
  return 2;
}

function isRatingPayload(value: unknown, roundNumber?: number): value is RatingPayload {
  if (!value || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  return (
    (roundNumber === undefined || rec.round_number === roundNumber) &&
    typeof rec.round_number === "number" &&
    typeof rec.item_id === "string" &&
    typeof rec.rating === "number" &&
    Number.isFinite(rec.rating) &&
    (rec.action === "keep" || rec.action === "revise")
  );
}

function latestRatingsForItem(responses: ResponseRecord[], itemId: string, roundNumber: number): Map<string, RatingPayload> {
  const latest = new Map<string, RatingPayload>();
  for (const response of responses) {
    if (!isRatingPayload(response.response_json, roundNumber)) continue;
    if (response.response_json.item_id !== itemId) continue;
    latest.set(response.participant_id, response.response_json);
  }
  return latest;
}

function consensusRuleParts(rule: unknown) {
  const rec = rule && typeof rule === "object" ? rule as Record<string, unknown> : {};
  const threshold = typeof rec.threshold === "number" ? rec.threshold : null;
  const agreementMinRating = typeof rec.agreement_min_rating === "number" ? rec.agreement_min_rating : 7;
  const rationale = typeof rec.setting_process === "string" ? rec.setting_process : "";
  return { threshold, agreementMinRating, rationale };
}

function classifyOutcome(input: {
  agreementPercent: number | null;
  threshold: number | null;
  hasValidRule: boolean;
}): FinalItemOutcome {
  if (!input.hasValidRule || input.agreementPercent === null || input.threshold === null) return "no_consensus";
  if (input.agreementPercent >= input.threshold) return "consensus";
  if (input.agreementPercent >= Math.max(0, input.threshold - 10)) return "descriptive_near_consensus";
  return "no_consensus";
}

function provenanceForItem(item: ItemRecord): FinalResultSnapshot["itemOutcomes"][number]["provenance"] {
  if (item.created_from === "ai") return "ai_assisted";
  if (item.provenance_type === "LiteratureDerived") return "literature_derived";
  if (item.ai_provenance_links.length === 0) return "researcher_added";
  return "panel_generated";
}

function roundStats(input: {
  roundNumber: number;
  itemId: string;
  responses: ResponseRecord[];
  agreementMinRating: number;
  threshold: number | null;
}) {
  const latest = latestRatingsForItem(input.responses, input.itemId, input.roundNumber);
  const values = Array.from(latest.values()).map((payload) => payload.rating);
  const stats = summarizeRatings(values, { includeScaleValues: true, scaleMin: 1, scaleMax: 9 });
  const agreementCount = values.filter((rating) => rating >= input.agreementMinRating).length;
  const agreementPercent = values.length ? Number(((agreementCount / values.length) * 100).toFixed(2)) : null;
  return {
    median: stats.median,
    iqr: stats.iqr,
    agreementPercent,
    distribution: stats.distribution,
    n: stats.responseCount,
  };
}

export async function createFinalResultSnapshot(input: {
  studyId: string;
  versionId: string;
  terminalRoundNumber: number;
  createdByUserId: string;
}): Promise<FinalResultSnapshot> {
  const existing = getFinalResultSnapshot(input.studyId, input.versionId);
  if (existing) return existing;

  const study = await getStudy(input.studyId);
  const studyVersion = await getStudyVersion(input.versionId);
  if (!study || !studyVersion || studyVersion.study_id !== input.studyId) {
    throw new Error("study_version_not_found");
  }
  if (studyVersion.terminal_round_number !== input.terminalRoundNumber) {
    throw new Error("terminal_round_mismatch");
  }
  if (input.terminalRoundNumber > getMaxAllowedRound(studyVersion.study_format)) {
    throw new Error("terminal_round_not_valid_for_study_design");
  }

  const terminalConfig = getRoundConfig({
    study_id: input.studyId,
    version_id: input.versionId,
    round_number: input.terminalRoundNumber,
  });
  if (!terminalConfig || terminalConfig.status !== "Closed") {
    throw new Error("terminal_round_must_be_closed");
  }

  const ruleParts = consensusRuleParts(studyVersion.consensus_rule_json);
  const hasValidRule = ruleParts.threshold !== null && Boolean(studyVersion.config_hash);
  const lockStatus = hasValidRule ? "locked" : "invalid_or_missing";
  const allRounds = listRoundConfigs({ study_id: input.studyId, version_id: input.versionId });
  const items = listItems({ study_id: input.studyId, version_id: input.versionId });
  const terminalItems = items.filter((item) => item.round_number === input.terminalRoundNumber && item.status === "Published");
  const responses = listResponses({ study_id: input.studyId, version_id: input.versionId });
  const enrollments = listParticipantEnrollments({ study_id: input.studyId, version_id: input.versionId });
  const escalations = listNonResponseEscalations({ study_id: input.studyId, version_id: input.versionId });
  const attrition = buildAttritionSummary({
    enrollments,
    escalations,
    responses,
    plannedRounds: studyVersion.planned_round_count ?? input.terminalRoundNumber,
    warningThresholdPercent: 20,
  });
  const eligibleCount = Math.max(
    enrollments.filter((enrollment) =>
      enrollment.inactive_from_round_number === null ||
      enrollment.inactive_from_round_number > input.terminalRoundNumber
    ).length,
    new Set(responses.map((response) => response.participant_id)).size,
  );

  let priorCompleted: number | null = null;
  const roundSummaries = allRounds
    .filter((round) => round.round_number <= input.terminalRoundNumber)
    .map((round) => {
      const completed = new Set(
        responses.flatMap((response) => {
          const payload = response.response_json;
          if (round.round_number === 1 && !isRatingPayload(payload)) return [response.participant_id];
          if (isRatingPayload(payload, round.round_number)) return [response.participant_id];
          return [];
        }),
      ).size;
      const completionRate = eligibleCount ? Number(((completed / eligibleCount) * 100).toFixed(2)) : 0;
      const attritionFromPriorRound =
        priorCompleted === null || priorCompleted === 0
          ? null
          : Number((((priorCompleted - completed) / priorCompleted) * 100).toFixed(2));
      priorCompleted = completed;
      return {
        roundId: round.round_config_id,
        roundNumber: round.round_number,
        openedAt: round.created_at,
        closedAt: round.status === "Closed" ? round.updated_at : "",
        invitedCount: eligibleCount,
        eligibleCount,
        completedCount: completed,
        completionRate,
        attritionFromPriorRound,
      };
    });

  const itemOutcomes = terminalItems.map((item) => {
    const finalStats = roundStats({
      roundNumber: input.terminalRoundNumber,
      itemId: item.item_id,
      responses,
      agreementMinRating: ruleParts.agreementMinRating,
      threshold: ruleParts.threshold,
    });
    const outcome = classifyOutcome({
      agreementPercent: finalStats.agreementPercent,
      threshold: ruleParts.threshold,
      hasValidRule,
    });
    const privacySuppressed = finalStats.n > 0 && finalStats.n < 5;
    const preservedPerspectives =
      outcome === "consensus"
        ? []
        : [{
            summary: privacySuppressed
              ? "A preserved perspective exists but granular detail is suppressed for privacy."
              : "Ratings did not meet the locked consensus rule; the unresolved perspective remains part of the result.",
            source: "method_note" as const,
            privacySuppressed,
            privacySuppressionReason: privacySuppressed ? "Small final-round response count." : null,
            humanReviewed: true,
          }];
    const finalText = redactExportText(item.text);
    return {
      itemId: item.item_id,
      finalText,
      wordingHistory: [{
        roundNumber: item.round_number,
        text: finalText,
        changedAt: item.created_at,
        changeReason: redactExportText(item.ai_provenance_rationale ?? "Final wording retained for terminal-round analysis."),
      }],
      provenance: provenanceForItem(item),
      finalN: finalStats.n,
      median: finalStats.median,
      iqr: finalStats.iqr,
      agreementPercent: finalStats.agreementPercent,
      distribution: finalStats.distribution,
      outcome,
      roundTrend: Array.from({ length: input.terminalRoundNumber - 1 }, (_, index) => index + 2).map((roundNumber) => {
        const stats = roundStats({
          roundNumber,
          itemId: item.item_id,
          responses,
          agreementMinRating: ruleParts.agreementMinRating,
          threshold: ruleParts.threshold,
        });
        return {
          roundNumber,
          median: stats.median,
          iqr: stats.iqr,
          agreementPercent: stats.agreementPercent,
        };
      }),
      neutralSummary: outcome === "consensus"
        ? "This item met the locked consensus rule among terminal-round respondents."
        : "This item remains part of the final result without being treated as consensus.",
      summaryReview: {
        draftedBy: "template" as const,
        aiSuggestionStatus: "not_ai" as const,
        ethicsMethodsStewardSignedOff: false,
        studyOwnerSignedOff: false,
      },
      preservedPerspectives,
      exportInclusion: {
        participantSummary: true,
        fullReport: true,
        csv: true,
        json: true,
        suppressionReason: privacySuppressed ? "Small-cell detail suppressed where needed for privacy." : null,
      },
    };
  });

  const counts = {
    consensus: itemOutcomes.filter((item) => item.outcome === "consensus").length,
    nearConsensus: itemOutcomes.filter((item) => item.outcome === "near_consensus").length,
    descriptiveNearConsensus: itemOutcomes.filter((item) => item.outcome === "descriptive_near_consensus").length,
    noConsensus: itemOutcomes.filter((item) => item.outcome === "no_consensus").length,
    consensusOut: itemOutcomes.filter((item) => item.outcome === "consensus_out").length,
  };
  const terminalSummary = roundSummaries.find((round) => round.roundNumber === input.terminalRoundNumber);
  const methodWarnings: FinalResultSnapshot["methodWarnings"] = [
    ...(lockStatus === "invalid_or_missing"
      ? [{ code: "missing_locked_consensus_rule", severity: "blocking" as const, message: "Locked consensus rule is missing or invalid." }]
      : []),
    ...(attrition.attrition_rate > 20
      ? [{ code: "high_terminal_attrition", severity: "caution" as const, message: "Final-round attrition exceeded the configured caution threshold." }]
      : []),
    ...(counts.consensus === 0
      ? [{ code: "zero_consensus_items", severity: "info" as const, message: "No items met the pre-set consensus rule." }]
      : []),
  ];

  const createdAt = new Date().toISOString();
  const base = {
    studyId: input.studyId,
    studyVersionId: input.versionId,
    terminalRoundNumber: input.terminalRoundNumber,
    roundSummaries,
    itemOutcomes,
    aggregateCounts: {
      ...counts,
      preservedPerspectiveCount: itemOutcomes.reduce((sum, item) => sum + item.preservedPerspectives.length, 0),
      terminalRoundCompletedCount: terminalSummary?.completedCount ?? 0,
      terminalRoundEligibleCount: terminalSummary?.eligibleCount ?? eligibleCount,
      terminalRoundCompletionRate: terminalSummary?.completionRate ?? 0,
      overallAttritionLabel: `Round 1 invited ${eligibleCount}; terminal round completed ${terminalSummary?.completedCount ?? 0}.`,
    },
    methodWarnings,
    limitations: [
      FINAL_RESULT_REQUIRED_STATEMENT,
      attrition.limitations_note,
      "Non-consensus items are retained as study findings and are not treated as unimportant solely because they did not meet the locked rule.",
      "Descriptive near-consensus is not formal consensus unless it was pre-specified in the protocol.",
    ],
    requiredStatement: FINAL_RESULT_REQUIRED_STATEMENT as typeof FINAL_RESULT_REQUIRED_STATEMENT,
  };
  const provenanceHash = sha256Json({ items: itemOutcomes, rounds: roundSummaries, studyVersion });
  const exportHash = sha256Json({ ...base, provenanceHash });
  const snapshot: FinalResultSnapshot = {
    snapshotId: crypto.randomUUID(),
    ...base,
    terminalRoundId: terminalConfig.round_config_id,
    closedAt: terminalConfig.updated_at,
    status: "draft",
    releaseSignoffs: [],
    participantReleasedAt: null,
    archivedAt: null,
    consensusRule: {
      ruleId: studyVersion.config_hash ?? "missing-rule-hash",
      lockedAt: studyVersion.opened_round1_at ?? studyVersion.created_at,
      lockStatus,
      description: ruleParts.threshold === null
        ? "No valid locked consensus threshold is available."
        : `At least ${ruleParts.threshold}% agreement at rating ${ruleParts.agreementMinRating}+ using the locked pre-launch rule.`,
      threshold: ruleParts.threshold ?? 0,
      scale: "1-9 verbal agreement scale",
      dispersionMetric: "IQR",
      rationale: ruleParts.rationale || "Consensus rule rationale was not recorded.",
      nearConsensusDefinition: {
        preSpecified: false,
        description: "Items within 10 percentage points of the locked threshold are labeled descriptive near-consensus only.",
        ...(ruleParts.threshold === null ? {} : { threshold: Math.max(0, ruleParts.threshold - 10) }),
      },
    },
    provenanceHash,
    exportHash,
    createdAt,
    createdByUserId: input.createdByUserId,
  };

  return saveFinalResultSnapshot(snapshot);
}
