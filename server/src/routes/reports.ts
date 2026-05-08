/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FastifyInstance } from "fastify";
import { listItems, type ItemRecord } from "../stores/itemStore.js";
import { listResponses, type ResponseRecord } from "../stores/responseStore.js";
import { listDeletionRequestsByStatus } from "../stores/deletionRequestStore.js";
import { getStudy, getStudyVersion, listSignoffs } from "../studies/store.js";
import { listConsentVersions } from "../stores/consentStore.js";
import { listRoundConfigs } from "../stores/roundConfigStore.js";
import { listAISuggestions } from "../stores/aiSuggestionStore.js";
import { listMergeActions, listSplitActions } from "../stores/mergeActionStore.js";
import { sha256Json } from "../studies/hash.js";
import { requireRole, getActor } from "../middleware/auth.js";
import { listAuditEvents, verifyAuditIntegrity, writeAuditEvent } from "../core/audit.js";
import {
  createExportPackage,
  type ExportPackageType,
  listExportManifests,
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
import { aiConfigDisclosureForExport } from "../stores/aiConfigStore.js";
import {
  listNonResponseEscalations,
  listParticipantEnrollments,
} from "../stores/participantStatusStore.js";
import { buildAttritionSummary } from "../core/attrition.js";
import {
  buildBibtexCitation,
  buildPreferredCitation,
  citationMetadata,
} from "../core/citation.js";
import {
  FINAL_RESULT_REQUIRED_STATEMENT,
  getFinalResultSnapshot,
} from "../stores/finalResultStore.js";
import {
  generateParticipantDisclosure,
  getStudyContextDisclosure,
  validateStudyContextDisclosure,
} from "../stores/studyContextStore.js";
import {
  privacyMetadataForExportType,
  redactExportFileContent,
  redactExportText,
  redactExportValue,
  neutralizeSpreadsheetFormulaText,
} from "../exports/exportPrivacy.js";
import {
  activeResearchQuestionsFromPacket,
  roundOneResponseEntries,
  type ResearchQuestionConfig,
} from "../studies/researchQuestions.js";
import { summarizeRatings } from "../core/ratingStats.js";

type RatingRoundPayload = {
  round_number: number;
  item_id: string;
  rating: number;
  action: "keep" | "revise";
  rationale_text?: string;
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

function excludeDeletionCompletedResponses(input: {
  studyId: string;
  versionId: string;
  responses: ResponseRecord[];
}): ResponseRecord[] {
  const blocked = new Set(
    listDeletionRequestsByStatus({
      study_id: input.studyId,
      version_id: input.versionId,
      statuses: ["Completed"],
    }).map((request) => request.participant_id),
  );
  if (blocked.size === 0) return input.responses;
  return input.responses.filter((response) => !blocked.has(response.participant_id));
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

function consensusRuleMetadata(rule: unknown) {
  const rec = rule && typeof rule === "object" && !Array.isArray(rule)
    ? rule as Record<string, unknown>
    : {};
  const source = typeof rec.source === "string" ? rec.source : "pi_defined";
  const input = rec.pre_round_consensus_input && typeof rec.pre_round_consensus_input === "object" && !Array.isArray(rec.pre_round_consensus_input)
    ? rec.pre_round_consensus_input as Record<string, unknown>
    : {};

  return {
    source,
    source_label: {
      pi_defined: "PI-defined",
      governance_team_defined: "Governance team-defined",
      panel_informed_pre_round: "Panel-informed pre-round",
      stakeholder_informed_pre_round: "Stakeholder-informed pre-round",
      protocol_irb_defined: "Protocol / IRB-defined",
    }[source] ?? source,
    setting_process:
      typeof rec.setting_process === "string" && rec.setting_process.trim()
        ? rec.setting_process.trim()
        : "Consensus rule source and process were not available in older study configuration metadata.",
    pre_round_consensus_input: {
      enabled: input.enabled === true,
      status: typeof input.status === "string" ? input.status : "not_required",
      summary: typeof input.summary === "string" ? input.summary : "",
      counts_as_delphi_round: false,
    },
  };
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
    const nearConsensusFloor = Math.max(0, threshold - 15);

    return {
      status:
        agreementPercent !== null && agreementPercent >= threshold
          ? "consensus"
          : agreementPercent !== null && agreementPercent >= nearConsensusFloor
            ? "near_consensus"
          : "non_consensus",
      method: "percent_agreement",
      threshold_percent: threshold,
      agreement_min_rating: agreementMinRating,
      agreement_count: agreementCount,
      agreement_percent: agreementPercent,
      reason:
        agreementPercent !== null && agreementPercent < threshold && agreementPercent >= nearConsensusFloor
          ? "near_predefined_consensus_threshold"
          : null,
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
    const stats = summarizeRatings(latestRatings);

    const consensus = evaluateConsensus(consensusRule, latestRatings);

    return {
      item_id: item.item_id,
      text: redactExportText(item.text),
      round_number: item.round_number,
      provenance_type: item.provenance_type,
      created_from: item.created_from,
      created_at: item.created_at,
      rating_summary: {
        response_count: stats.responseCount,
        median: stats.median,
        dispersion: {
          min: stats.min,
          max: stats.max,
          iqr: stats.iqr,
          q1: stats.q1,
          q3: stats.q3,
        },
        distribution: stats.distribution,
      },
      consensus,
    };
  });
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? neutralizeSpreadsheetFormulaText(value) : String(value);
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
    "## Attrition Disclosure",
    "Attrition may affect interpretation of consensus. Participants marked inactive or withdrawn from future rounds remain represented in prior submitted data according to the study protocol. Consensus indicates agreement among this panel; it does not establish correctness.",
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
      near_consensus_flag: consensusStatus === "near_consensus",
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

function exportManifestFile(input: {
  export_type: ExportPackageType;
  studyId: string;
  versionId: string;
  actorRole: string;
  dataCutoffAt: string;
  containsIdentifiableData: boolean;
  anonymizationLevel: string;
  redactionStatus: string;
  recordCounts: Record<string, number>;
  consensusRule?: ReturnType<typeof consensusRuleMetadata>;
  aiDisclosure?: ReturnType<typeof aiConfigDisclosureForExport>;
  privacyMetadata?: ReturnType<typeof privacyMetadataForExportType>;
}) {
  return JSON.stringify({
    schema_name: "edelphi_export_manifest",
    schema_version: "1.0.0",
    export_type: input.export_type,
    study_id: input.studyId,
    study_version_id: input.versionId,
    created_by_role: input.actorRole,
    data_cutoff_at: input.dataCutoffAt,
    contains_identifiable_data: input.containsIdentifiableData,
    anonymization_level: input.anonymizationLevel,
    redaction_status: input.redactionStatus,
    review_status: "pending_review",
    limitations_text_version_id: "charter-required-limitations-v1",
    privacy_metadata: input.privacyMetadata ?? null,
    consensus_rule: input.consensusRule ?? null,
    required_disclosures: {
      consensus_not_correctness_statement_included: true,
      required_limitation_language: "Consensus indicates agreement among this panel; it does not establish correctness.",
      non_consensus_items_included: true,
      panel_not_random_sample_disclosure_included: true,
      ai_disclosure_included: true,
    },
    ai_connector_disclosure: input.aiDisclosure ?? null,
    record_counts: input.recordCounts,
  }, null, 2);
}

function extractOpenResponseText(responseJson: unknown, researchQuestions: ResearchQuestionConfig[] = []): string {
  const entries = roundOneResponseEntries(responseJson, researchQuestions);
  if (entries.length > 0) return entries.map((entry) => entry.text).join("\n\n");
  if (typeof responseJson === "string") return responseJson;
  if (!responseJson || typeof responseJson !== "object") return JSON.stringify(responseJson ?? {});
  return JSON.stringify(responseJson);
}

function pseudonymMap(responses: ResponseRecord[]): Map<string, string> {
  const ids = Array.from(new Set(responses.map((response) => response.participant_id))).sort();
  return new Map(ids.map((id, index) => [id, `P${String(index + 1).padStart(3, "0")}`]));
}

function buildExportDataset(input: {
  studyId: string;
  versionId: string;
  items: ItemRecord[];
  responses: ResponseRecord[];
  finalRoundNumber: number | null;
  participantStatuses?: ReturnType<typeof listParticipantEnrollments>;
  researchQuestions?: ResearchQuestionConfig[];
}) {
  const researchQuestions = input.researchQuestions ?? [];
  const participantIds = [
    ...input.responses.map((response) => response.participant_id),
    ...(input.participantStatuses ?? []).map((status) => status.participant_id),
  ];
  const participantCodes = new Map(Array.from(new Set(participantIds)).sort().map((id, index) => [id, `P${String(index + 1).padStart(3, "0")}`]));
  const ratingRounds = [2, 3, 4];
  const responseRows = input.responses.flatMap((response) => {
    if (ratingRounds.some((round) => isRatingRoundPayload(response.response_json, round))) return [];
    const entries = roundOneResponseEntries(response.response_json, researchQuestions);
    return entries.map((entry) => {
      const redactedResponseText = redactExportText(entry.text);
      return {
      response_id: response.response_id,
      study_id: response.study_id,
      round_number: 1,
      research_question_id: entry.researchQuestionId,
      research_question_label: redactExportText(entry.researchQuestionLabel),
      research_question_text: redactExportText(entry.researchQuestionText),
      participant_pseudonym: participantCodes.get(response.participant_id) ?? "P000",
      item_id: "",
      response_text_redacted: redactedResponseText,
      submitted_at_shifted: "",
      word_count: entry.text.split(/\s+/).filter(Boolean).length,
      redaction_applied: redactedResponseText !== entry.text,
      redaction_level: redactedResponseText !== entry.text ? "obvious_direct_identifier_tokens" : "none",
      withdrawal_status: input.participantStatuses?.find((status) => status.participant_id === response.participant_id)?.status.toLowerCase() ?? "active",
      included_in_analysis: true,
    };
    });
  });

  const researchQuestionRows = researchQuestions.map((question) => ({
    research_question_id: question.id,
    display_order: question.displayOrder,
    short_label: redactExportText(question.shortLabel ?? `Research question ${question.displayOrder}`),
    question_text: redactExportText(question.text),
    description: redactExportText(question.description ?? ""),
    required_for_round1_response: question.requiredForRound1Response,
    active: question.active,
  }));

  const round1ResponseCountRows = researchQuestionRows.map((question) => ({
    research_question_id: question.research_question_id,
    short_label: question.short_label,
    round_number: 1,
    response_count: responseRows.filter((row) => row.research_question_id === question.research_question_id && String(row.response_text_redacted).trim()).length,
  }));

  const ratingRows = input.responses.flatMap((response) => {
    const ratingPayload = ratingRounds.flatMap((round) =>
      isRatingRoundPayload(response.response_json, round) ? [response.response_json] : []
    )[0];
    if (!ratingPayload) return [];
    const rationaleText = typeof ratingPayload.rationale_text === "string" ? ratingPayload.rationale_text : "";
    const redactedRationaleText = redactExportText(rationaleText);
    return [{
      rating_id: response.response_id,
      study_id: response.study_id,
      round_number: ratingPayload.round_number,
      participant_pseudonym: participantCodes.get(response.participant_id) ?? "P000",
      item_id: ratingPayload.item_id,
      item_version_id: ratingPayload.item_id,
      scale_id: "default-1-9-verbal",
      rating_value: ratingPayload.rating,
      rating_label: ratingLabel(ratingPayload.rating),
      prior_rating_value: "",
      changed_from_prior: "",
      rationale_text_redacted: redactedRationaleText,
      submitted_at_shifted: "",
      redaction_applied: redactedRationaleText !== rationaleText,
      included_in_analysis: true,
    }];
  });

  const itemRows = input.items.map((item) => {
    const sourceResponseCount = item.ai_provenance_links.filter((link) => link.source_type === "response").length;
    return {
      item_id: item.item_id,
      item_version_id: item.item_id,
      item_text: redactExportText(item.text),
      item_origin: item.created_from === "ai" ? "ai_suggested" : item.provenance_type === "LiteratureDerived" ? "literature_derived" : "panel_derived",
      source_type: item.ai_provenance_links.at(0)?.source_type ?? "other",
      created_round_number: item.round_number,
      first_shown_round_number: item.status === "Published" ? item.round_number : "",
      current_status: item.status,
      majority_supported: false,
      minority_or_unique: sourceResponseCount <= 1,
      near_consensus: false,
      non_consensus: false,
      human_finalized: item.status === "Published",
      human_finalized_by_role: item.status === "Published" ? "study_owner_or_methods_steward" : "",
      ai_assisted: item.created_from === "ai" || item.ai_assisted_revisions.length > 0,
      provenance_available: item.ai_provenance_links.length > 0,
    };
  });

  const redactionRows = [{
    redaction_id: "redaction-profile-default",
    source_record_type: "package",
    source_record_id: input.versionId,
    redaction_type: "name_email_identity_response_mapping",
    redaction_method: "system",
    replacement_token: "participant_pseudonym",
    reviewed_by_human: false,
    reviewed_by_role: "",
    redacted_at: new Date().toISOString(),
    notes: "Direct participant identity fields and identity-response mapping are excluded from this package.",
  }];

  const participantRows = (input.participantStatuses ?? []).map((status) => {
    const participantResponses = input.responses.filter((response) => response.participant_id === status.participant_id);
    return {
      participant_pseudonym: participantCodes.get(status.participant_id) ?? "P000",
      current_status: status.status,
      inactive_or_withdrawal_round: status.inactive_from_round_number ?? "",
      withdrawal_type: status.withdrawal_type ?? "none",
      prior_round_response_presence: [1, 2, 3, 4]
        .map((round) => `round_${round}:${participantResponses.some((response) => {
          if (round === 1) return ![2, 3, 4].some((ratingRound) => isRatingRoundPayload(response.response_json, ratingRound));
          return isRatingRoundPayload(response.response_json, round);
        }) ? "yes" : "no"}`)
        .join(";"),
    };
  });

  return { responseRows, ratingRows, itemRows, redactionRows, participantRows, researchQuestionRows, round1ResponseCountRows };
}

function ratingLabel(value: number): string {
  if (value >= 8) return "Strong agreement";
  if (value >= 6) return "Moderate agreement";
  if (value >= 4) return "Uncertain or mixed judgment";
  if (value >= 2) return "Moderate disagreement";
  return "Strong disagreement";
}

function provenanceEdges(input: {
  studyId: string;
  items: ItemRecord[];
}) {
  const linkEdges = input.items.flatMap((item) =>
    item.ai_provenance_links.map((link, index) => ({
      edge_id: `${item.item_id}:source:${index + 1}`,
      study_id: input.studyId,
      source_node_id: link.source_id,
      source_node_type: link.source_type,
      target_node_id: item.item_id,
      target_node_type: item.status === "Published" ? "final_item" : "candidate_item",
      relationship_type: link.source_type === "response" ? "contributed_to" : "carried_forward_to",
      confidence_or_weight: "",
      created_by_type: item.created_from === "ai" ? "ai" : "human",
      created_by_user_role: "",
      ai_operation_id: item.source_ai_suggestion_id ?? "",
      human_review_status: item.status === "Rejected" ? "rejected" : item.status === "Published" ? "accepted" : "pending",
      rationale: redactExportText(item.ai_provenance_rationale ?? "Source link retained for traceability."),
      created_at: item.created_at,
    }))
  );

  const revisionEdges = input.items.flatMap((item) =>
    item.ai_assisted_revisions.map((revision, index) => ({
      edge_id: `${item.item_id}:revision:${index + 1}`,
      study_id: input.studyId,
      source_node_id: revision.suggestion_id,
      source_node_type: "ai_suggestion",
      target_node_id: item.item_id,
      target_node_type: "item_version",
      relationship_type: "edited_into",
      confidence_or_weight: "",
      created_by_type: "human",
      created_by_user_role: "",
      ai_operation_id: revision.suggestion_id,
      human_review_status: "edited",
      rationale: redactExportText(revision.rationale),
      created_at: revision.applied_at,
    }))
  );

  return [...linkEdges, ...revisionEdges];
}

function transformationRows(input: {
  items: ItemRecord[];
  merges: ReturnType<typeof listMergeActions>;
  splits: ReturnType<typeof listSplitActions>;
}) {
  const itemRows = input.items.map((item) => ({
    transformation_id: `${item.item_id}:current`,
    item_id: item.item_id,
    from_record_id: item.ai_provenance_links.map((link) => link.source_id).join(";"),
    from_text: redactExportText(item.ai_provenance_links.map((link) => link.excerpt ?? "").filter(Boolean).join(" | ")),
    to_record_id: item.item_id,
    to_text: redactExportText(item.text),
    transformation_type: item.status === "Rejected" ? "reject" : item.status === "Published" ? "finalize" : "draft",
    reason_code: item.ai_provenance_rationale ? "human_judgment" : "other",
    rationale_text: redactExportText(item.ai_provenance_rationale ?? "Candidate item retained with source links."),
    ai_assisted: item.created_from === "ai" || item.ai_assisted_revisions.length > 0,
    human_approved: item.status === "Published",
    approved_by_role: item.status === "Published" ? "study_owner_or_methods_steward" : "",
    approved_at: item.status === "Published" ? item.created_at : "",
  }));

  const revisionRows = input.items.flatMap((item) =>
    item.ai_assisted_revisions.map((revision, index) => ({
      transformation_id: `${item.item_id}:ai_revision:${index + 1}`,
      item_id: item.item_id,
      from_record_id: revision.suggestion_id,
      from_text: redactExportText(revision.previous_text),
      to_record_id: item.item_id,
      to_text: redactExportText(revision.revised_text),
      transformation_type: "edit",
      reason_code: "human_judgment",
      rationale_text: redactExportText(revision.rationale),
      ai_assisted: true,
      human_approved: true,
      approved_by_role: "study_owner_or_methods_steward",
      approved_at: revision.applied_at,
    }))
  );

  const mergeRows = input.merges.map((merge) => ({
    transformation_id: merge.merge_id,
    item_id: merge.to_item_id,
    from_record_id: merge.from_item_ids.join(";"),
    from_text: "",
    to_record_id: merge.to_item_id,
    to_text: "",
    transformation_type: "merge",
    reason_code: "human_judgment",
    rationale_text: redactExportText(merge.rationale),
    ai_assisted: false,
    human_approved: true,
    approved_by_role: "study_owner_or_methods_steward",
    approved_at: merge.created_at,
  }));

  const splitRows = input.splits.map((split) => ({
    transformation_id: split.split_id,
    item_id: split.source_item_id,
    from_record_id: split.source_item_id,
    from_text: "",
    to_record_id: split.new_item_ids.join(";"),
    to_text: "",
    transformation_type: "split",
    reason_code: "human_judgment",
    rationale_text: redactExportText(split.rationale),
    ai_assisted: false,
    human_approved: true,
    approved_by_role: "study_owner_or_methods_steward",
    approved_at: split.created_at,
  }));

  return [...itemRows, ...revisionRows, ...mergeRows, ...splitRows];
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
      const summaryAttrition = buildAttritionSummary({
        enrollments: listParticipantEnrollments({ study_id: studyId, version_id: versionId }),
        escalations: listNonResponseEscalations({ study_id: studyId, version_id: versionId }),
        responses: allResponses,
        plannedRounds: studyVersion.planned_round_count ?? 3,
        warningThresholdPercent: 20,
      });

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
      const nearConsensusCount = itemReports.filter((item) => item.consensus.status === "near_consensus").length;
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
          near_consensus_item_count: nearConsensusCount,
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
          attrition: summaryAttrition,
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
      const attritionSummary = buildAttritionSummary({
        enrollments: listParticipantEnrollments({ study_id: studyId, version_id: versionId }),
        escalations: listNonResponseEscalations({ study_id: studyId, version_id: versionId }),
        responses: allResponses,
        plannedRounds: studyVersion.planned_round_count ?? 3,
        warningThresholdPercent: 20,
      });

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
      const nearConsensusCount = itemReports.filter((item) => item.consensus.status === "near_consensus").length;
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
      const consensusMetadata = consensusRuleMetadata(studyVersion.consensus_rule_json);
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
          consensus_rule_source: consensusMetadata.source,
          consensus_rule_source_label: consensusMetadata.source_label,
          consensus_setting_process: consensusMetadata.setting_process,
          pre_round_consensus_input: consensusMetadata.pre_round_consensus_input,
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
          attritionSummary.limitations_note,
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
          near_consensus_item_count: nearConsensusCount,
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
          attrition: attritionSummary,
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
      const finalAttritionSummary = buildAttritionSummary({
        enrollments: listParticipantEnrollments({ study_id: studyId, version_id: versionId }),
        escalations: listNonResponseEscalations({ study_id: studyId, version_id: versionId }),
        responses: allResponses,
        plannedRounds: studyVersion.planned_round_count ?? 3,
        warningThresholdPercent: 20,
      });

      const round1Responses = allResponses.filter(
        (response) => !getAllowedRatingRounds(studyVersion.study_format).some((round) =>
          isRatingRoundPayload(response.response_json, round)
        )
      );
      const researchQuestions = activeResearchQuestionsFromPacket(studyVersion.study_design_packet_json);
      const round1ResponseCountsByQuestion = researchQuestions.map((question) => ({
        research_question_id: question.id,
        short_label: question.shortLabel ?? `Research question ${question.displayOrder}`,
        response_count: round1Responses
          .flatMap((response) => roundOneResponseEntries(response.response_json, researchQuestions))
          .filter((entry) => entry.researchQuestionId === question.id && entry.text.trim()).length,
      }));

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
      const nearConsensusCount = itemReports.filter((item) => item.consensus.status === "near_consensus").length;
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
      const consensusMetadata = consensusRuleMetadata(studyVersion.consensus_rule_json);
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
      const softwareCitation = {
        metadata: citationMetadata(),
        preferred: buildPreferredCitation(),
        bibtex: buildBibtexCitation(),
        note:
          "Citing this software supports transparency and reproducibility; it does not validate study findings or imply platform endorsement.",
      };

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
          consensus_rule_source: consensusMetadata.source,
          consensus_rule_source_label: consensusMetadata.source_label,
          consensus_setting_process: consensusMetadata.setting_process,
          pre_round_consensus_input: consensusMetadata.pre_round_consensus_input,
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
          finalAttritionSummary.limitations_note,
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
          near_consensus_item_count: nearConsensusCount,
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
          attrition: finalAttritionSummary,
        },
        research_questions: researchQuestions.map((question) => ({
          id: question.id,
          display_order: question.displayOrder,
          short_label: question.shortLabel,
          text: question.text,
          description: question.description ?? "",
          required_for_round1_response: question.requiredForRound1Response,
        })),
        round1_response_counts_by_question: round1ResponseCountsByQuestion,
        non_consensus_items: nonConsensusItems,
        items: itemReports,
        appendices: {
          software_citation: softwareCitation,
        },
      };
      const privacyMetadata = privacyMetadataForExportType("final-delphi-report");
      const deidentifiedReport = redactExportValue(report);
      const deidentifiedItemResultsRows = redactExportValue(itemResultsRows);
      const deidentifiedItemResultsCsv = toCsv(deidentifiedItemResultsRows);

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
        content: deidentifiedReport,
        data_scope: {
          final_round_number: finalRoundNumber,
          response_scope: "terminal_rating_round_and_round1_summary",
          item_scope: "published_terminal_round_items",
        },
        redaction_profile: {
          direct_identifiers: "excluded",
          identity_response_mapping: "excluded",
          participant_ids: "excluded_from_export_content",
        },
        privacy_metadata: privacyMetadata,
      });

      const finalReportDocx = renderFinalDelphiReportDocx({
        report: deidentifiedReport,
        itemResults: deidentifiedItemResultsRows,
        limitationsMarkdown,
        softwareCitation: {
          preferred: softwareCitation.preferred,
          bibtex: softwareCitation.bibtex,
        },
      });
      const finalItemResultsXlsx = renderFinalItemResultsXlsx({
        report: deidentifiedReport,
        itemResults: deidentifiedItemResultsRows,
        limitationsMarkdown,
      });
      const aiConnectorDisclosure = aiConfigDisclosureForExport(studyId);
      const finalResultSnapshot = getFinalResultSnapshot(studyId, versionId);
      const finalReportSnapshotFiles = finalResultSnapshot
        ? [
            {
              path: "final_report/final_result_snapshot.json",
              content: JSON.stringify(redactExportValue(finalResultSnapshot), null, 2),
              format: ".json" as const,
              record_count: finalResultSnapshot.itemOutcomes.length,
              contains_identifiable_data: false,
              redaction_profile: {
                direct_identifiers: "excluded",
                identity_response_mapping: "excluded",
                canonical_source: "FinalResultSnapshot",
              },
            },
            {
              path: "final_report/final_item_outcomes_from_snapshot.csv",
              content: toCsv(finalResultSnapshot.itemOutcomes.map((item) => ({
                item_id: item.itemId,
                item_text: redactExportText(item.finalText),
                outcome: item.outcome,
                final_n: item.finalN,
                median: item.median ?? "",
                iqr: item.iqr ?? "",
                agreement_percent: item.agreementPercent ?? "",
                provenance: item.provenance,
                privacy_suppression: item.exportInclusion.suppressionReason ?? "",
                required_statement: FINAL_RESULT_REQUIRED_STATEMENT,
              }))),
              format: ".csv" as const,
              record_count: finalResultSnapshot.itemOutcomes.length,
              contains_identifiable_data: false,
              redaction_profile: {
                direct_identifiers: "excluded",
                identity_response_mapping: "excluded",
                non_consensus_included: true,
              },
            },
          ]
        : [];

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
        external_ai_used: aiConnectorDisclosure.external_ai_enabled,
        human_review_required: true,
        human_review_status: "pending_review",
        limitations_text_version_id: "charter-required-limitations-v1",
        privacy_metadata: privacyMetadata,
        files: [
          {
            path: "final_report/privacy_classification.json",
            content: JSON.stringify(privacyMetadata, null, 2),
            format: ".json",
            record_count: null,
            contains_identifiable_data: false,
            redaction_profile: {
              privacy_metadata: "package classification",
            },
          },
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
            content: JSON.stringify(deidentifiedReport, null, 2),
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
            content: deidentifiedItemResultsCsv,
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
          ...finalReportSnapshotFiles,
        ],
      });

      return reply.send({ report: deidentifiedReport, export_manifest: manifest, export_package: exportPackage });
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

  app.post(
    "/studies/:studyId/versions/:versionId/export-packages",
    { preHandler: allowExportGovernance },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const exportType = body.export_type as ExportPackageType;

      if (
        exportType !== "final-delphi-report" &&
        exportType !== "irb-pack" &&
        exportType !== "anonymized-response-dataset" &&
        exportType !== "audit-package" &&
        exportType !== "provenance-bundle" &&
        exportType !== "complete-archive"
      ) {
        return reply.code(400).send({ error: "valid_export_type_required" });
      }

      const study = await getStudy(studyId);
      if (!study) return reply.code(404).send({ error: "study_not_found" });

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      const signoffs = (await listSignoffs(versionId)).sort((a, b) =>
        a.required_role.localeCompare(b.required_role)
      );
      const rounds = listRoundConfigs({ study_id: studyId, version_id: versionId });
      const items = sortItems(listItems({ study_id: studyId, version_id: versionId }));
      const responses = sortResponses(excludeDeletionCompletedResponses({
        studyId,
        versionId,
        responses: listResponses({ study_id: studyId, version_id: versionId }),
      }));
      const participantStatuses = listParticipantEnrollments({ study_id: studyId, version_id: versionId });
      const attritionSummary = buildAttritionSummary({
        enrollments: participantStatuses,
        escalations: listNonResponseEscalations({ study_id: studyId, version_id: versionId }),
        responses,
        plannedRounds: studyVersion.planned_round_count ?? 3,
        warningThresholdPercent: 20,
      });
      const suggestions = listAISuggestions({ study_id: studyId, version_id: versionId });
      const merges = listMergeActions({ study_id: studyId, version_id: versionId });
      const splits = listSplitActions({ study_id: studyId, version_id: versionId });
      const consentVersions = listConsentVersions({ study_id: studyId, version_id: versionId });
      const exportManifests = listExportManifests({ study_id: studyId, version_id: versionId });
      const finalRoundNumber = studyVersion.terminal_round_number;
      const researchQuestions = activeResearchQuestionsFromPacket(studyVersion.study_design_packet_json);
      const finalRoundItems = finalRoundNumber === null
        ? []
        : items.filter((item) => item.round_number === finalRoundNumber && item.status === "Published");
      const itemReports = finalRoundNumber === null
        ? []
        : buildRoundItemReports(finalRoundItems, responses, finalRoundNumber, studyVersion.consensus_rule_json);
      const consensusMetadata = consensusRuleMetadata(studyVersion.consensus_rule_json);
      const consensusCount = itemReports.filter((item) => item.consensus.status === "consensus").length;
      const nearConsensusCount = itemReports.filter((item) => item.consensus.status === "near_consensus").length;
      const nonConsensusCount = itemReports.filter((item) => item.consensus.status === "non_consensus").length;
      const limitationsMarkdown = requiredLimitationsMarkdown();
      const aiConnectorDisclosure = aiConfigDisclosureForExport(studyId);
      const studyContext = generateParticipantDisclosure(
        getStudyContextDisclosure({
          study_id: studyId,
          version_id: versionId,
          actor_user_id: actor.userId,
          study_title: study.title,
        }),
      );
      const studyContextValidation = validateStudyContextDisclosure(studyContext);
      const participantContextDisclosure =
        studyContext.participant_disclosure.edited_text || studyContext.participant_disclosure.generated_text;
      const datasetHash = sha256Json({ study, studyVersion, signoffs, rounds, items, responses });
      const dataCutoffAt = [
        ...responses.map((response) => response.created_at),
        ...items.map((item) => item.created_at),
        ...rounds.map((round) => round.updated_at),
        ...suggestions.map((suggestion) => suggestion.created_at),
      ].sort().at(-1) ?? new Date().toISOString();
      const dataset = buildExportDataset({ studyId, versionId, items, responses, finalRoundNumber, participantStatuses, researchQuestions });
      const edgeRows = provenanceEdges({ studyId, items });
      const transformRows = transformationRows({ items, merges, splits });
      const aiRows = suggestions.map((suggestion) => ({
        ai_operation_id: suggestion.suggestion_id,
        study_id: suggestion.study_id,
        feature_invoked: suggestion.feature,
        operation_timestamp: suggestion.created_at,
        invoked_by_user_id: "[REDACTED_ID]",
        invoked_by_role: suggestion.created_by_role,
        model_identifier: suggestion.model_id,
        prompt_template_version_id: suggestion.prompt_template_version,
        input_scope_ids: suggestion.input_scope_ids.map((_, index) => `input_scope_${index + 1}`).join(";"),
        direct_identifiers_included: false,
        external_ai_connector_used: aiConnectorDisclosure.external_ai_enabled,
        ai_output_hash: suggestion.output_hash,
        human_action: suggestion.decision,
        final_content_version_id: suggestion.resulting_object_ids.join(";"),
        reviewed_by_user_id: suggestion.decided_by_user_id ? "[REDACTED_ID]" : "",
        reviewed_by_role: suggestion.decided_by_role ?? "",
        reviewed_at: suggestion.decided_at ?? "",
      }));
      const relevantAuditEvents = listAuditEvents().filter((event) => {
        const details = event.details ?? {};
        return (
          details.studyId === studyId ||
          details.study_id === studyId ||
          details.versionId === versionId ||
          details.version_id === versionId ||
          event.object?.id === studyId ||
          event.object?.id === versionId ||
          event.object?.id === `${studyId}:${versionId}`
        );
      });
      const auditRows = relevantAuditEvents.map((event) => ({
        audit_event_id: event.id,
        study_id: studyId,
        event_timestamp: event.ts,
        actor_user_id: event.actor.userId,
        actor_role: event.actor.role,
        event_category: event.action.split(".")[0],
        event_type: event.action,
        target_record_type: event.object?.type ?? "",
        target_record_id: event.object?.id ?? "",
        action_summary: event.action,
        integrity_hash: event.eventHash ?? "",
        previous_event_hash: event.previousHash ?? "",
        export_included: true,
      }));

      const itemResultRows = finalRoundNumber === null
        ? []
        : finalItemResultsRows({
            studyId,
            versionId,
            finalRoundNumber,
            itemReports,
            publishedItems: finalRoundItems,
            nInvited: new Set(responses.map((response) => response.participant_id)).size,
            consensusThreshold:
              itemReports.find((item) => item.consensus.threshold_percent !== null)?.consensus.threshold_percent ?? null,
          });

      const recordCounts = {
        items: items.length,
        responses: responses.length,
        research_questions: dataset.researchQuestionRows.length,
        round1_response_question_answers: dataset.responseRows.length,
        participants: participantStatuses.length,
        ratings: dataset.ratingRows.length,
        audit_events: auditRows.length,
        provenance_edges: edgeRows.length,
        ai_operations: aiRows.length,
      };
      const privacyMetadata = privacyMetadataForExportType(exportType);
      const containsIdentifiableData =
        privacyMetadata.direct_identifiers_included || privacyMetadata.participant_response_mapping_included;
      const anonymizationLevel = privacyMetadata.data_classification === "deidentified_research_report"
        ? exportType === "final-delphi-report" ? "aggregated_only" : "anonymized"
        : "none";

      const manifestContent = exportManifestFile({
        export_type: exportType,
        studyId,
        versionId,
        actorRole: actor.role,
        dataCutoffAt,
        containsIdentifiableData,
        anonymizationLevel,
        redactionStatus: privacyMetadata.data_classification === "deidentified_research_report"
          ? "direct identifiers and identity-response mapping excluded"
          : "restricted internal package; participant-linkable identifiers may be included and are not safe for de-identified sharing",
        recordCounts,
        consensusRule: consensusMetadata,
        aiDisclosure: aiConnectorDisclosure,
        privacyMetadata,
      });
      const softwareCitation = {
        metadata: citationMetadata(),
        preferred: buildPreferredCitation(),
        bibtex: buildBibtexCitation(),
        note:
          "Citing this software supports transparency and reproducibility; it does not validate study findings or imply platform endorsement.",
      };
      const finalResultSnapshot = getFinalResultSnapshot(studyId, versionId);
      const finalSnapshotFiles = finalResultSnapshot
        ? [
            {
              path: `${exportType}/final_result_snapshot.json`,
              content: JSON.stringify(redactExportValue(finalResultSnapshot), null, 2),
              format: ".json" as const,
              record_count: finalResultSnapshot.itemOutcomes.length,
              contains_identifiable_data: false,
              redaction_profile: {
                direct_identifiers: "excluded",
                identity_response_mapping: "excluded",
                canonical_source: "FinalResultSnapshot",
              },
            },
            {
              path: `${exportType}/final_item_outcomes_from_snapshot.csv`,
              content: toCsv(finalResultSnapshot.itemOutcomes.map((item) => ({
                item_id: item.itemId,
                item_text: redactExportText(item.finalText),
                outcome: item.outcome,
                final_n: item.finalN,
                median: item.median ?? "",
                iqr: item.iqr ?? "",
                agreement_percent: item.agreementPercent ?? "",
                provenance: item.provenance,
                privacy_suppression: item.exportInclusion.suppressionReason ?? "",
                required_statement: FINAL_RESULT_REQUIRED_STATEMENT,
              }))),
              format: ".csv" as const,
              record_count: finalResultSnapshot.itemOutcomes.length,
              contains_identifiable_data: false,
              redaction_profile: {
                direct_identifiers: "excluded",
                identity_response_mapping: "excluded",
                non_consensus_included: true,
              },
            },
            {
              path: `${exportType}/participant_plain_language_summary.md`,
              content: [
                "# Final Results Summary",
                "",
                FINAL_RESULT_REQUIRED_STATEMENT,
                "",
                `Reached consensus: ${finalResultSnapshot.aggregateCounts.consensus}`,
                `Descriptive near consensus: ${finalResultSnapshot.aggregateCounts.descriptiveNearConsensus}`,
                `No consensus: ${finalResultSnapshot.aggregateCounts.noConsensus}`,
                `Final round participation: ${finalResultSnapshot.aggregateCounts.terminalRoundCompletedCount} of ${finalResultSnapshot.aggregateCounts.terminalRoundEligibleCount}`,
                "",
                "Non-consensus items and preserved perspectives remain part of the study result.",
              ].join("\n"),
              format: ".md" as const,
              record_count: null,
              contains_identifiable_data: false,
              redaction_profile: {
                direct_identifiers: "not_applicable",
                canonical_source: "FinalResultSnapshot",
              },
            },
          ]
        : [];

      const baseFiles = [
        {
          path: `${exportType}/export_manifest.json`,
          content: manifestContent,
          format: ".json" as const,
          record_count: null,
          contains_identifiable_data: false,
          redaction_profile: { manifest: "package-level metadata" },
        },
        {
          path: `${exportType}/privacy_classification.json`,
          content: JSON.stringify(privacyMetadata, null, 2),
          format: ".json" as const,
          record_count: null,
          contains_identifiable_data: privacyMetadata.direct_identifiers_included,
          redaction_profile: { privacy_metadata: "package classification" },
        },
        ...finalSnapshotFiles,
      ];

      const filesByType: Record<ExportPackageType, Parameters<typeof createExportPackage>[0]["files"]> = {
        "final-delphi-report": [
          ...baseFiles,
          {
            path: "final-delphi-report/final_delphi_report.json",
            content: JSON.stringify(redactExportValue({
              study,
              study_version: studyVersion,
              consensus_rule: consensusMetadata,
              summary: {
                consensus_item_count: consensusCount,
                near_consensus_item_count: nearConsensusCount,
                non_consensus_item_count: nonConsensusCount,
                attrition: attritionSummary,
              },
              research_questions: dataset.researchQuestionRows,
              round1_response_counts_by_question: dataset.round1ResponseCountRows,
              required_statement: "Consensus indicates agreement among this panel; it does not establish correctness.",
              ai_connector_disclosure: aiConnectorDisclosure,
              study_context_disclosure: {
                participant_facing_disclosure: participantContextDisclosure,
                funding_status: studyContext.funding.funding_status,
                funder_name: studyContext.funding.funder_name,
                sponsor_name: studyContext.funding.sponsor_name,
                coi_statement: studyContext.coi.coi_statement,
                material_conditions: studyContextValidation.material_conditions,
              },
              appendices: {
                software_citation: softwareCitation,
              },
              items: itemReports,
              limitations: limitationsMarkdown,
            }), null, 2),
            format: ".json",
            record_count: itemReports.length,
            contains_identifiable_data: false,
            redaction_profile: { direct_identifiers: "excluded", identity_response_mapping: "excluded" },
          },
          {
            path: "final-delphi-report/final_item_results.csv",
            content: toCsv(itemResultRows),
            format: ".csv",
            record_count: itemResultRows.length,
            contains_identifiable_data: false,
            redaction_profile: { direct_identifiers: "excluded", identity_response_mapping: "excluded" },
          },
          {
            path: "final-delphi-report/required_limitations_and_disclosures.md",
            content: limitationsMarkdown,
            format: ".md",
            record_count: null,
            contains_identifiable_data: false,
            redaction_profile: { direct_identifiers: "not_applicable" },
          },
        ],
        "irb-pack": [
          ...baseFiles,
          {
            path: "irb-pack/irb_protocol_summary.md",
            content: [
              `# ${study.title}`,
              "",
              "## Delphi Suitability",
              studyVersion.method_rationale ?? "",
              "",
              "## Consent, Confidentiality, Withdrawal",
              consentVersions.map((version) => version.text_md).join("\n\n---\n\n"),
              "",
              "## AI Disclosure",
              aiConnectorDisclosure.no_external_ai_mode
                ? "This study is configured for No External AI mode. Study data is not sent to external AI services by this platform configuration."
                : [
                    `External AI enabled: ${aiConnectorDisclosure.external_ai_enabled}`,
                    `Provider: ${aiConnectorDisclosure.provider_name ?? "not configured"}`,
                    `Model/version: ${aiConnectorDisclosure.model_name ?? "not configured"}`,
                    `Enabled features: ${aiConnectorDisclosure.enabled_features.join(", ") || "none"}`,
                    `Data that may be sent: ${aiConnectorDisclosure.data_may_be_sent || "not documented"}`,
                    `Identifier exclusion: ${aiConnectorDisclosure.identifiers_excluded || "not documented"}`,
                    `Opt-out / no-external-AI language: ${aiConnectorDisclosure.opt_out_or_no_external_ai_language || "not documented"}`,
                    `Human-in-the-loop controls: ${aiConnectorDisclosure.human_in_the_loop_controls || "AI Suggestion (Not Final) outputs require human review."}`,
                  ].join("\n"),
              "",
              "AI Suggestion (Not Final) outputs require explicit human Accept/Edit/Reject action before use.",
              "",
              "## Study Context, Funding, Sponsorship, and COI",
              participantContextDisclosure || "No optional study context disclosure has been supplied.",
              "",
              "### Research/Admin Context Record",
              JSON.stringify({
                status: studyContext.status,
                basic_context: studyContext.basic_context,
                funding: studyContext.funding,
                data_access: studyContext.data_access,
                coi: studyContext.coi,
                participant_disclosure: studyContext.participant_disclosure,
                validation: studyContextValidation,
              }, null, 2),
              "",
              "## Signoff History",
              ...signoffs.map((signoff) => `- ${signoff.required_role}: ${signoff.signed_at}`),
            ].join("\n"),
            format: ".md",
            record_count: signoffs.length,
            contains_identifiable_data: false,
            redaction_profile: { participant_response_data: "excluded" },
          },
          {
            path: "irb-pack/irb_governance_checklist.csv",
            content: toCsv([
              { control: "Study Owner signoff", status: signoffs.some((signoff) => signoff.required_role === "Owner") ? "complete" : "open" },
              { control: "Ethics & Methods signoff", status: signoffs.some((signoff) => signoff.required_role === "MethodsSteward") ? "complete" : "open" },
              { control: "Consensus rule locked", status: studyVersion.config_hash ? "complete" : "open" },
              { control: "Consent versions", status: consentVersions.length > 0 ? "complete" : "open" },
            ]),
            format: ".csv",
            record_count: 4,
            contains_identifiable_data: false,
            redaction_profile: { participant_response_data: "excluded" },
          },
        ],
        "anonymized-response-dataset": [
          ...baseFiles,
          { path: "anonymized-response-dataset/research_questions.csv", content: toCsv(dataset.researchQuestionRows), format: ".csv", record_count: dataset.researchQuestionRows.length, contains_identifiable_data: false, redaction_profile: { direct_identifiers: "excluded" } },
          { path: "anonymized-response-dataset/round1_response_counts_by_question.csv", content: toCsv(dataset.round1ResponseCountRows), format: ".csv", record_count: dataset.round1ResponseCountRows.length, contains_identifiable_data: false, redaction_profile: { direct_identifiers: "excluded", aggregate_counts_only: true } },
          { path: "anonymized-response-dataset/responses.csv", content: toCsv(dataset.responseRows), format: ".csv", record_count: dataset.responseRows.length, contains_identifiable_data: false, redaction_profile: { participant_ids: "pseudonymized", names_emails: "excluded" } },
          { path: "anonymized-response-dataset/ratings.csv", content: toCsv(dataset.ratingRows), format: ".csv", record_count: dataset.ratingRows.length, contains_identifiable_data: false, redaction_profile: { participant_ids: "pseudonymized", names_emails: "excluded" } },
          { path: "anonymized-response-dataset/participants_anonymized.csv", content: toCsv(dataset.participantRows), format: ".csv", record_count: dataset.participantRows.length, contains_identifiable_data: false, redaction_profile: { participant_ids: "pseudonymized", names_emails: "excluded", identity_response_mapping: "excluded" } },
          { path: "anonymized-response-dataset/items.csv", content: toCsv(dataset.itemRows), format: ".csv", record_count: dataset.itemRows.length, contains_identifiable_data: false, redaction_profile: { direct_identifiers: "excluded" } },
          { path: "anonymized-response-dataset/redaction_manifest.csv", content: toCsv(dataset.redactionRows), format: ".csv", record_count: dataset.redactionRows.length, contains_identifiable_data: false, redaction_profile: { identity_response_mapping: "excluded" } },
          { path: "anonymized-response-dataset/data_dictionary.txt", content: "research_questions.csv lists the ordered study instrument questions. round1_response_counts_by_question.csv groups Round 1 completion counts by question. responses.csv, ratings.csv, and items.csv use participant_pseudonym values only. No name, email, or identity-response mapping is included.", format: ".txt", record_count: null, contains_identifiable_data: false, redaction_profile: { direct_identifiers: "excluded" } },
        ],
        "audit-package": [
          ...baseFiles,
          { path: "audit-package/audit_events.csv", content: toCsv(auditRows), format: ".csv", record_count: auditRows.length, contains_identifiable_data: false, redaction_profile: { participant_direct_identifiers: "excluded" } },
          { path: "audit-package/audit_events.json", content: JSON.stringify(relevantAuditEvents, null, 2), format: ".json", record_count: relevantAuditEvents.length, contains_identifiable_data: false, redaction_profile: { participant_direct_identifiers: "excluded" } },
          { path: "audit-package/integrity_hashes.json", content: JSON.stringify({ audit_integrity: verifyAuditIntegrity(), export_manifest_count: exportManifests.length, dataset_hash: datasetHash }, null, 2), format: ".json", record_count: null, contains_identifiable_data: false, redaction_profile: { direct_identifiers: "not_applicable" } },
          { path: "audit-package/audit_chain_summary.txt", content: `Audit events included: ${auditRows.length}\nIntegrity verified: ${verifyAuditIntegrity().ok}\n`, format: ".txt", record_count: null, contains_identifiable_data: false, redaction_profile: { direct_identifiers: "not_applicable" } },
        ],
        "provenance-bundle": [
          ...baseFiles,
          { path: "provenance-bundle/provenance_edges.csv", content: toCsv(edgeRows), format: ".csv", record_count: edgeRows.length, contains_identifiable_data: false, redaction_profile: { response_excerpts: "anonymized" } },
          { path: "provenance-bundle/item_transformation_history.csv", content: toCsv(transformRows), format: ".csv", record_count: transformRows.length, contains_identifiable_data: false, redaction_profile: { response_excerpts: "anonymized" } },
          { path: "provenance-bundle/ai_suggestion_hashes.csv", content: toCsv(aiRows), format: ".csv", record_count: aiRows.length, contains_identifiable_data: false, redaction_profile: { input_scope_ids: "record_ids_only" } },
          { path: "provenance-bundle/provenance_narrative.md", content: "Rejected items, minority or unique statements, AI suggestions, human edits, merge/split rationales, and final wording are retained for traceability.", format: ".md", record_count: null, contains_identifiable_data: false, redaction_profile: { response_excerpts: "anonymized" } },
        ],
        "complete-archive": [
          ...baseFiles,
          { path: "complete-archive/study_version.json", content: JSON.stringify({ study, studyVersion, rounds, signoffs, consentVersions, ai_connector_disclosure: aiConnectorDisclosure, attrition: attritionSummary }, null, 2), format: ".json", record_count: 1, contains_identifiable_data: false, redaction_profile: { participant_identity: "excluded", api_keys: "excluded" } },
          { path: "complete-archive/study_context_disclosure.json", content: JSON.stringify(studyContext, null, 2), format: ".json", record_count: 1, contains_identifiable_data: false, redaction_profile: { proposal_documents: "admin_only_excerpt_and_hash", participant_identity: "excluded" } },
          { path: "complete-archive/anonymized_dataset.json", content: JSON.stringify(dataset, null, 2), format: ".json", record_count: responses.length, contains_identifiable_data: false, redaction_profile: { participant_identity: "excluded" } },
          { path: "complete-archive/items_and_provenance.json", content: JSON.stringify({ items, edges: edgeRows, transformations: transformRows, ai_operations: aiRows }, null, 2), format: ".json", record_count: items.length, contains_identifiable_data: false, redaction_profile: { participant_identity: "excluded" } },
          { path: "complete-archive/audit_summary.json", content: JSON.stringify({ auditRows, audit_integrity: verifyAuditIntegrity() }, null, 2), format: ".json", record_count: auditRows.length, contains_identifiable_data: false, redaction_profile: { participant_identity: "excluded" } },
          { path: "complete-archive/limitations_and_disclosures.md", content: limitationsMarkdown, format: ".md", record_count: null, contains_identifiable_data: false, redaction_profile: { direct_identifiers: "not_applicable" } },
        ],
      };

      const auditEvent = await writeAuditEvent({
        actor,
        action: `export.${exportType}.create`,
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          export_type: exportType,
          data_cutoff_at: dataCutoffAt,
          dataset_hash: datasetHash,
          study_context_included: studyContext.status !== "optional",
          study_context_material_conditions: studyContextValidation.material_conditions,
        },
      });

      const manifest = recordExportManifest({
        study_id: studyId,
        version_id: versionId,
        package_type: exportType,
        generated_by: actor,
        audit_event_id: auditEvent.id,
        config_hash: studyVersion.config_hash,
        dataset_hash: datasetHash,
        content: { exportType, recordCounts },
        data_scope: { export_type: exportType, package_builder: "governed_package_v1" },
        redaction_profile: {
          direct_identifiers: privacyMetadata.direct_identifiers_included ? "restricted_internal_only" : "excluded",
          identity_response_mapping: privacyMetadata.participant_response_mapping_included ? "restricted_internal_only" : "excluded",
          redaction_status: privacyMetadata.data_classification === "deidentified_research_report"
            ? "direct identifiers and identity-response mapping excluded"
            : "restricted identifiers may be included and package is not safe for de-identified sharing",
          participant_facing_context: "concise_disclosure_only",
          admin_context_record: privacyMetadata.restricted_internal_only ? "included_restricted" : "limited_summary",
        },
        privacy_metadata: privacyMetadata,
      });

      const packageFiles = filesByType[exportType].map((file) => redactExportFileContent(file, privacyMetadata));

      const exportPackage = createExportPackage({
        study_id: studyId,
        study_version_id: versionId,
        export_type: exportType,
        generated_by: actor,
        audit_event_id: auditEvent.id,
        data_cutoff_at: dataCutoffAt,
        consensus_rule_version_id: studyVersion.config_hash,
        feedback_config_version_id: studyVersion.config_hash,
        instrument_version_ids: [versionId],
        contains_identifiable_data: containsIdentifiableData,
        anonymization_level: anonymizationLevel,
        external_ai_used: false,
        human_review_required: true,
        human_review_status: "pending_review",
        limitations_text_version_id: "charter-required-limitations-v1",
        privacy_metadata: privacyMetadata,
        files: packageFiles,
      });

      return reply.code(201).send({ export_manifest: manifest, export_package: exportPackage });
    },
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
