/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { nanoid } from "nanoid";
import { JsonCollection } from "../core/jsonCollection.js";

export type FundingStatus =
  | "not_specified"
  | "no_external_funding_or_sponsor"
  | "internally_supported"
  | "externally_funded"
  | "sponsor_corporate_partner_involved"
  | "other_needs_explanation";

export type SponsorRole =
  | "not_specified"
  | "no_role_after_funding"
  | "study_design_input"
  | "recruitment_support"
  | "data_access"
  | "report_review"
  | "publication_approval"
  | "other_needs_explanation";

export type TernaryDisclosure = "not_specified" | "no" | "yes" | "not_applicable" | "unknown_needs_review";

export type StudyContextAiSuggestionStatus = "pending" | "accepted" | "edited" | "rejected";

export type StudyContextAiSuggestion = {
  suggestion_id: string;
  field_path: string;
  label: "AI Suggestion — Not Final";
  proposed_value: string | boolean | null;
  confidence: "high" | "medium" | "low";
  evidence_snippet: string;
  source_location: string;
  rationale: string;
  status: StudyContextAiSuggestionStatus;
  created_at: string;
  decided_at: string | null;
  decided_by_user_id: string | null;
};

export type StudyContextDisclosureRecord = {
  study_id: string;
  version_id: string;
  status: "optional" | "draft" | "supplied";
  basic_context: {
    study_title: string;
    study_short_name: string;
    pi_or_study_owner: string;
    institution_or_organization: string;
  };
  funding: {
    funding_status: FundingStatus;
    funder_name: string;
    sponsor_name: string;
    grant_or_contract_number: string;
    sponsor_roles: SponsorRole[];
    role_details: string;
  };
  data_access: {
    sponsor_can_access_raw_responses: TernaryDisclosure;
    sponsor_can_access_identifiable_data: TernaryDisclosure;
    sponsor_can_access_aggregate_results: TernaryDisclosure;
    sponsor_has_report_review_rights: TernaryDisclosure;
    sponsor_has_report_approval_rights: TernaryDisclosure;
    sponsor_has_publication_approval_rights: TernaryDisclosure;
    dissemination_constraints: string;
    data_ownership_statement: string;
  };
  coi: {
    no_known_coi: boolean;
    coi_statement: string;
    required_disclosure_language: string;
    reviewer_notes: string;
  };
  participant_disclosure: {
    generated_text: string;
    last_generated_at: string | null;
    edited_text: string;
    requires_review: boolean;
    review_reasons: string[];
  };
  proposal_import: {
    source_document_name: string;
    source_text_hash: string;
    source_text_excerpt: string;
    extraction_mode: "none" | "local_stub" | "external_ai";
    extraction_invoked_at: string | null;
    suggestions: StudyContextAiSuggestion[];
  };
  created_by_user_id: string;
  updated_by_user_id: string;
  created_at: string;
  updated_at: string;
};

const collection = new JsonCollection<StudyContextDisclosureRecord>("study_context_disclosures");

const fundingStatuses: FundingStatus[] = [
  "not_specified",
  "no_external_funding_or_sponsor",
  "internally_supported",
  "externally_funded",
  "sponsor_corporate_partner_involved",
  "other_needs_explanation",
];

const sponsorRoles: SponsorRole[] = [
  "not_specified",
  "no_role_after_funding",
  "study_design_input",
  "recruitment_support",
  "data_access",
  "report_review",
  "publication_approval",
  "other_needs_explanation",
];

const ternaryValues: TernaryDisclosure[] = ["not_specified", "no", "yes", "not_applicable", "unknown_needs_review"];

function key(studyId: string, versionId: string) {
  return `${studyId}:${versionId}`;
}

function nowIso() {
  return new Date().toISOString();
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : fallback;
}

function ternary(value: unknown): TernaryDisclosure {
  return oneOf(value, ternaryValues, "not_specified");
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function roles(value: unknown): SponsorRole[] {
  if (!Array.isArray(value)) return ["not_specified"];
  const result = value
    .map((entry) => oneOf(entry, sponsorRoles, "not_specified"))
    .filter((entry, index, array) => array.indexOf(entry) === index);
  return result.length > 0 ? result : ["not_specified"];
}

export function blankStudyContextDisclosure(input: {
  study_id: string;
  version_id: string;
  actor_user_id: string;
  study_title?: string;
}): StudyContextDisclosureRecord {
  const now = nowIso();
  return {
    study_id: input.study_id,
    version_id: input.version_id,
    status: "optional",
    basic_context: {
      study_title: input.study_title ?? "",
      study_short_name: "",
      pi_or_study_owner: "",
      institution_or_organization: "",
    },
    funding: {
      funding_status: "not_specified",
      funder_name: "",
      sponsor_name: "",
      grant_or_contract_number: "",
      sponsor_roles: ["not_specified"],
      role_details: "",
    },
    data_access: {
      sponsor_can_access_raw_responses: "not_specified",
      sponsor_can_access_identifiable_data: "not_specified",
      sponsor_can_access_aggregate_results: "not_specified",
      sponsor_has_report_review_rights: "not_specified",
      sponsor_has_report_approval_rights: "not_specified",
      sponsor_has_publication_approval_rights: "not_specified",
      dissemination_constraints: "",
      data_ownership_statement: "",
    },
    coi: {
      no_known_coi: false,
      coi_statement: "",
      required_disclosure_language: "",
      reviewer_notes: "",
    },
    participant_disclosure: {
      generated_text: "",
      last_generated_at: null,
      edited_text: "",
      requires_review: false,
      review_reasons: [],
    },
    proposal_import: {
      source_document_name: "",
      source_text_hash: "",
      source_text_excerpt: "",
      extraction_mode: "none",
      extraction_invoked_at: null,
      suggestions: [],
    },
    created_by_user_id: input.actor_user_id,
    updated_by_user_id: input.actor_user_id,
    created_at: now,
    updated_at: now,
  };
}

export function getStudyContextDisclosure(input: {
  study_id: string;
  version_id: string;
  actor_user_id?: string;
  study_title?: string;
}): StudyContextDisclosureRecord {
  return collection.get(key(input.study_id, input.version_id)) ??
    blankStudyContextDisclosure({
      study_id: input.study_id,
      version_id: input.version_id,
      actor_user_id: input.actor_user_id ?? "system",
      ...(input.study_title ? { study_title: input.study_title } : {}),
    });
}

export function normalizeStudyContextDisclosure(
  current: StudyContextDisclosureRecord,
  patch: Record<string, unknown>,
  actorUserId: string,
): StudyContextDisclosureRecord {
  const basic = (patch.basic_context && typeof patch.basic_context === "object" ? patch.basic_context : {}) as Record<string, unknown>;
  const funding = (patch.funding && typeof patch.funding === "object" ? patch.funding : {}) as Record<string, unknown>;
  const dataAccess = (patch.data_access && typeof patch.data_access === "object" ? patch.data_access : {}) as Record<string, unknown>;
  const coi = (patch.coi && typeof patch.coi === "object" ? patch.coi : {}) as Record<string, unknown>;
  const participantDisclosure = (patch.participant_disclosure && typeof patch.participant_disclosure === "object" ? patch.participant_disclosure : {}) as Record<string, unknown>;

  const next: StudyContextDisclosureRecord = {
    ...current,
    basic_context: {
      ...current.basic_context,
      ...(Object.hasOwn(basic, "study_title") ? { study_title: text(basic.study_title) } : {}),
      ...(Object.hasOwn(basic, "study_short_name") ? { study_short_name: text(basic.study_short_name) } : {}),
      ...(Object.hasOwn(basic, "pi_or_study_owner") ? { pi_or_study_owner: text(basic.pi_or_study_owner) } : {}),
      ...(Object.hasOwn(basic, "institution_or_organization") ? { institution_or_organization: text(basic.institution_or_organization) } : {}),
    },
    funding: {
      ...current.funding,
      ...(Object.hasOwn(funding, "funding_status")
        ? { funding_status: oneOf(funding.funding_status, fundingStatuses, "not_specified") }
        : {}),
      ...(Object.hasOwn(funding, "funder_name") ? { funder_name: text(funding.funder_name) } : {}),
      ...(Object.hasOwn(funding, "sponsor_name") ? { sponsor_name: text(funding.sponsor_name) } : {}),
      ...(Object.hasOwn(funding, "grant_or_contract_number") ? { grant_or_contract_number: text(funding.grant_or_contract_number) } : {}),
      ...(Object.hasOwn(funding, "sponsor_roles") ? { sponsor_roles: roles(funding.sponsor_roles) } : {}),
      ...(Object.hasOwn(funding, "role_details") ? { role_details: text(funding.role_details) } : {}),
    },
    data_access: {
      ...current.data_access,
      ...(Object.hasOwn(dataAccess, "sponsor_can_access_raw_responses") ? { sponsor_can_access_raw_responses: ternary(dataAccess.sponsor_can_access_raw_responses) } : {}),
      ...(Object.hasOwn(dataAccess, "sponsor_can_access_identifiable_data") ? { sponsor_can_access_identifiable_data: ternary(dataAccess.sponsor_can_access_identifiable_data) } : {}),
      ...(Object.hasOwn(dataAccess, "sponsor_can_access_aggregate_results") ? { sponsor_can_access_aggregate_results: ternary(dataAccess.sponsor_can_access_aggregate_results) } : {}),
      ...(Object.hasOwn(dataAccess, "sponsor_has_report_review_rights") ? { sponsor_has_report_review_rights: ternary(dataAccess.sponsor_has_report_review_rights) } : {}),
      ...(Object.hasOwn(dataAccess, "sponsor_has_report_approval_rights") ? { sponsor_has_report_approval_rights: ternary(dataAccess.sponsor_has_report_approval_rights) } : {}),
      ...(Object.hasOwn(dataAccess, "sponsor_has_publication_approval_rights") ? { sponsor_has_publication_approval_rights: ternary(dataAccess.sponsor_has_publication_approval_rights) } : {}),
      ...(Object.hasOwn(dataAccess, "dissemination_constraints") ? { dissemination_constraints: text(dataAccess.dissemination_constraints) } : {}),
      ...(Object.hasOwn(dataAccess, "data_ownership_statement") ? { data_ownership_statement: text(dataAccess.data_ownership_statement) } : {}),
    },
    coi: {
      ...current.coi,
      ...(Object.hasOwn(coi, "no_known_coi") ? { no_known_coi: bool(coi.no_known_coi) } : {}),
      ...(Object.hasOwn(coi, "coi_statement") ? { coi_statement: text(coi.coi_statement) } : {}),
      ...(Object.hasOwn(coi, "required_disclosure_language") ? { required_disclosure_language: text(coi.required_disclosure_language) } : {}),
      ...(Object.hasOwn(coi, "reviewer_notes") ? { reviewer_notes: text(coi.reviewer_notes) } : {}),
    },
    participant_disclosure: {
      ...current.participant_disclosure,
      ...(Object.hasOwn(participantDisclosure, "edited_text") ? { edited_text: text(participantDisclosure.edited_text) } : {}),
    },
    updated_by_user_id: actorUserId,
    updated_at: nowIso(),
  };

  const supplied = [
    next.basic_context.study_short_name,
    next.basic_context.pi_or_study_owner,
    next.basic_context.institution_or_organization,
    next.funding.funder_name,
    next.funding.sponsor_name,
    next.funding.grant_or_contract_number,
    next.funding.role_details,
    next.coi.coi_statement,
    next.coi.required_disclosure_language,
  ].some(Boolean) ||
    next.funding.funding_status !== "not_specified" ||
    next.data_access.sponsor_can_access_raw_responses !== "not_specified" ||
    next.data_access.sponsor_can_access_identifiable_data !== "not_specified";

  return {
    ...next,
    status: supplied ? "supplied" : "optional",
  };
}

export function saveStudyContextDisclosure(record: StudyContextDisclosureRecord): StudyContextDisclosureRecord {
  return collection.set(key(record.study_id, record.version_id), record);
}

function actorLabel(record: StudyContextDisclosureRecord): string {
  return record.basic_context.pi_or_study_owner ||
    record.basic_context.institution_or_organization ||
    "the study team";
}

function sponsorLabel(record: StudyContextDisclosureRecord): string {
  return record.funding.sponsor_name || record.funding.funder_name || "the funder or sponsor";
}

export function materialContextReasons(record: StudyContextDisclosureRecord): string[] {
  const reasons: string[] = [];
  if (record.data_access.sponsor_can_access_raw_responses === "yes") reasons.push("Sponsor/funder raw response access supplied");
  if (record.data_access.sponsor_can_access_identifiable_data === "yes") reasons.push("Sponsor/funder identifiable data access supplied");
  if (record.data_access.sponsor_has_report_approval_rights === "yes") reasons.push("Sponsor/funder report approval rights supplied");
  if (record.data_access.sponsor_has_publication_approval_rights === "yes") reasons.push("Sponsor/funder publication approval/control rights supplied");
  if (!record.coi.no_known_coi && (record.coi.coi_statement || record.coi.required_disclosure_language)) reasons.push("Material conflict-of-interest disclosure supplied");
  return reasons;
}

export function generateParticipantDisclosure(record: StudyContextDisclosureRecord): StudyContextDisclosureRecord {
  const who = actorLabel(record);
  const sponsor = sponsorLabel(record);
  const parts: string[] = [];
  const reasons = materialContextReasons(record);

  if (record.funding.funding_status === "no_external_funding_or_sponsor") {
    parts.push(`This study is conducted by ${who}. No external funder or sponsor has been listed for this study.`);
  } else if (!record.funding.funder_name && !record.funding.sponsor_name) {
    parts.push(`This study is conducted by ${who}. No external funder or sponsor has been listed for this study.`);
  } else {
    parts.push(`This study is conducted by ${who}. It is supported by ${sponsor}.`);
    if (record.funding.role_details) {
      parts.push(`The sponsor's role is: ${record.funding.role_details}.`);
    } else if (record.funding.sponsor_roles.includes("not_specified")) {
      parts.push("No additional sponsor role has been specified.");
    }
  }

  if (record.data_access.sponsor_can_access_identifiable_data === "yes" || record.data_access.sponsor_can_access_raw_responses === "yes") {
    parts.push("The sponsor/funder may access individual responses as described in this study's confidentiality and data-use terms.");
  } else if (record.data_access.sponsor_can_access_aggregate_results === "yes" || record.funding.funder_name || record.funding.sponsor_name) {
    parts.push("The sponsor may receive aggregate results, but individual responses will not be shared unless separately described in this study's confidentiality and data-use terms.");
  }

  if (record.data_access.sponsor_has_report_approval_rights === "yes" || record.data_access.sponsor_has_publication_approval_rights === "yes") {
    parts.push("The sponsor/funder has a review or approval role in dissemination, as described in this study's disclosure materials.");
  } else if (record.data_access.sponsor_has_report_review_rights === "yes") {
    parts.push("The sponsor/funder may review study reports before dissemination, as described in this study's disclosure materials.");
  }

  if (!record.coi.no_known_coi && record.coi.required_disclosure_language) {
    parts.push(record.coi.required_disclosure_language);
  } else if (!record.coi.no_known_coi && record.coi.coi_statement) {
    parts.push(`Conflict-of-interest disclosure: ${record.coi.coi_statement}`);
  }

  return {
    ...record,
    participant_disclosure: {
      ...record.participant_disclosure,
      generated_text: parts.join(" "),
      last_generated_at: nowIso(),
      requires_review: reasons.length > 0,
      review_reasons: reasons,
    },
    updated_at: nowIso(),
  };
}

export function validateStudyContextDisclosure(record: StudyContextDisclosureRecord): {
  status: "optional" | "ready" | "review_recommended";
  warnings: string[];
  material_conditions: string[];
} {
  const material = materialContextReasons(record);
  const disclosure = record.participant_disclosure.edited_text || record.participant_disclosure.generated_text;
  const warnings: string[] = [];
  if (material.length > 0 && !disclosure) {
    warnings.push("Supplied sponsor, data-access, publication-control, or COI conditions need participant-facing disclosure language.");
  }
  return {
    status: material.length > 0 ? "review_recommended" : record.status === "optional" ? "optional" : "ready",
    warnings,
    material_conditions: material,
  };
}

function suggest(fieldPath: string, proposedValue: string | boolean | null, confidence: "high" | "medium" | "low", snippet: string, rationale: string): StudyContextAiSuggestion {
  return {
    suggestion_id: nanoid(),
    field_path: fieldPath,
    label: "AI Suggestion — Not Final",
    proposed_value: proposedValue,
    confidence,
    evidence_snippet: snippet,
    source_location: "pasted text",
    rationale,
    status: "pending",
    created_at: nowIso(),
    decided_at: null,
    decided_by_user_id: null,
  };
}

export function createLocalProposalImportSuggestions(input: {
  record: StudyContextDisclosureRecord;
  source_name: string;
  source_text: string;
  source_text_hash: string;
}): StudyContextDisclosureRecord {
  const textValue = input.source_text;
  const lower = textValue.toLowerCase();
  const snippet = (needle: string) => {
    const index = lower.indexOf(needle);
    if (index < 0) return textValue.slice(0, 240).trim();
    return textValue.slice(Math.max(0, index - 80), Math.min(textValue.length, index + 180)).trim();
  };
  const suggestions: StudyContextAiSuggestion[] = [];

  const funderMatch = textValue.match(/(?:funder|funded by|support(?:ed)? by|sponsor(?:ed)? by)[:\s]+([A-Z][^\n.;]{2,120})/i);
  if (funderMatch?.[1]) {
    suggestions.push(suggest("funding.funder_name", funderMatch[1].trim(), "medium", snippet(funderMatch[0].toLowerCase()), "Potential funder/sponsor phrase found. Human review required."));
    suggestions.push(suggest("funding.funding_status", "externally_funded", "low", snippet(funderMatch[0].toLowerCase()), "External support may be present, but funding status requires confirmation."));
  } else {
    suggestions.push(suggest("funding.funder_name", null, "low", "", "Not found. Do not infer funder from absent text."));
  }

  if (/publication approval|approval of publication|publication control/i.test(textValue)) {
    suggestions.push(suggest("data_access.sponsor_has_publication_approval_rights", "yes", "medium", snippet("publication"), "Publication approval/control language appears to be present. Human review required."));
  }
  if (/raw responses|individual responses|raw data/i.test(textValue)) {
    suggestions.push(suggest("data_access.sponsor_can_access_raw_responses", "yes", "low", snippet("responses"), "Response-level data access language may be present. Human review required."));
  }
  if (/conflict of interest|COI/i.test(textValue)) {
    suggestions.push(suggest("coi.coi_statement", "Needs human review", "low", snippet("conflict"), "COI language appears to be present but must not be inferred automatically."));
  }

  return {
    ...input.record,
    proposal_import: {
      ...input.record.proposal_import,
      source_document_name: input.source_name,
      source_text_hash: input.source_text_hash,
      source_text_excerpt: textValue.slice(0, 500),
      extraction_mode: "local_stub",
      extraction_invoked_at: nowIso(),
      suggestions,
    },
    updated_at: nowIso(),
  };
}

function setByFieldPath(record: StudyContextDisclosureRecord, fieldPath: string, value: string | boolean | null): StudyContextDisclosureRecord {
  const patch: Record<string, unknown> = {};
  const [section, field] = fieldPath.split(".");
  if (!section || !field) return record;
  patch[section] = { [field]: value };
  return normalizeStudyContextDisclosure(record, patch, record.updated_by_user_id);
}

export function decideStudyContextSuggestion(input: {
  record: StudyContextDisclosureRecord;
  suggestion_id: string;
  action: "accept" | "edit" | "reject";
  edited_value?: string | boolean | null;
  actor_user_id: string;
}): StudyContextDisclosureRecord {
  let acceptedField: { fieldPath: string; fieldValue: string | boolean | null } | null = null;
  const suggestions: StudyContextAiSuggestion[] = [];
  for (const suggestion of input.record.proposal_import.suggestions) {
    if (suggestion.suggestion_id !== input.suggestion_id) {
      suggestions.push(suggestion);
      continue;
    }
    const status: StudyContextAiSuggestionStatus = input.action === "reject" ? "rejected" : input.action === "edit" ? "edited" : "accepted";
    const value = input.action === "edit" ? input.edited_value ?? null : suggestion.proposed_value;
    if (status !== "rejected") acceptedField = { fieldPath: suggestion.field_path, fieldValue: value };
    suggestions.push({
      ...suggestion,
      proposed_value: value,
      status,
      decided_at: nowIso(),
      decided_by_user_id: input.actor_user_id,
    });
  }

  const withSuggestions = {
    ...input.record,
    proposal_import: {
      ...input.record.proposal_import,
      suggestions,
    },
    updated_by_user_id: input.actor_user_id,
    updated_at: nowIso(),
  };

  if (acceptedField !== null) {
    return setByFieldPath(withSuggestions, acceptedField.fieldPath, acceptedField.fieldValue);
  }

  return withSuggestions;
}
