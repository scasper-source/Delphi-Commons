/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ResearchQuestion, StudyWizardState } from "./studyWizard";
import type { OutputModelId, StudyRecord, UserRole } from "./types";

export type ApiBoundary = {
  baseUrl: string;
  authHeaderRole: UserRole;
  mode: "mock-first" | "backend-wired";
};

export type BackendStudy = {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  archived_at?: string;
  archived_by?: string;
};

export type BackendStudyVersion = {
  id: string;
  study_id: string;
  version_number: number;
  status: "Draft" | "ReadyForSignoff" | "Active" | "Closed" | "Archived";
  study_format: "ModifiedDelphi" | "ClassicDelphi" | null;
  planned_round_count: number | null;
  terminal_round_number: number | null;
  method_rationale: string | null;
  consensus_rule_json: unknown | null;
  feedback_config_json: unknown | null;
  retention_policy_json: unknown | null;
  study_design_packet_json: unknown | null;
  config_hash: string | null;
  opened_round1_at: string | null;
  created_by: string;
  created_at: string;
};

export type BackendSignoff = {
  study_version_id: string;
  required_role: "Owner" | "MethodsSteward";
  signed_by_user_id: string;
  signed_at: string;
  note?: string;
};

export type BackendSystemRole =
  | "owner"
  | "methods_steward"
  | "privacy_lead"
  | "data_custodian"
  | "maintainer"
  | "admin"
  | "participant";

export type BackendUser = {
  user_id: string;
  email: string;
  display_name: string;
  system_roles: BackendSystemRole[];
  created_at: string;
  disabled_at: string | null;
};

export type StudyAssignment = {
  user_id: string;
  study_id: string;
  role: "Owner" | "MethodsSteward" | "PrivacyLead" | "DataCustodian" | "Maintainer";
  created_at: string;
};

export type DeletionRequest = {
  deletion_request_id: string;
  study_id: string;
  version_id: string;
  participant_id: string;
  requested_at: string;
  requested_by: "participant" | "staff";
  request_text: string;
  status: "Requested" | "UnderReview" | "Approved" | "Rejected" | "Completed";
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  review_note: string | null;
};

export type RoundConfig = {
  round_config_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
  task_type: "open_text" | "rating" | "ranking" | "confirmation";
  title: string;
  prompt: string;
  participant_instructions: string;
  response_window_days: number;
  reminder_subject: string;
  reminder_body: string;
  controlled_feedback_enabled: boolean;
  ai_curation_enabled: boolean;
  feedback_config: {
    feedback_config_id: string;
    version_number: number;
    format: "distribution_only" | "distribution_summary" | "distribution_rationales";
    show_participant_prior_response: boolean;
    locked_at: string | null;
    locked_by_user_id: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  status: "Draft" | "Ready" | "Open" | "Closed";
  created_at: string;
  updated_at: string;
};

export type ConsentVersion = {
  consent_version_id: string;
  study_id: string;
  version_id: string;
  text_md: string;
  is_active: boolean;
  created_at: string;
};

export type ResponseRecord = {
  response_id: string;
  study_id: string;
  version_id: string;
  participant_id: string;
  response_json: unknown;
  created_at: string;
};

export type RoundOneAnswerInput = {
  researchQuestionId: string;
  text: string;
};

export type ItemProvenanceLink = {
  source_type: "response" | "item";
  source_id: string;
  source_round_number: number;
  excerpt: string | null;
};

export type ItemRecord = {
  item_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
  text: string;
  provenance_type: "PanelDerived" | "LiteratureDerived";
  created_from: "manual" | "ai";
  status: "Draft" | "Published" | "Rejected";
  created_at: string;
  created_by_user_id: string;
  source_ai_suggestion_id: string | null;
  ai_provenance_links: ItemProvenanceLink[];
  ai_provenance_rationale: string | null;
  ai_assisted_revisions: unknown[];
};

export type AISuggestionRecord = {
  suggestion_id: string;
  study_id: string;
  version_id: string;
  label: "AI Suggestion (Not Final)";
  feature:
    | "cluster_r1"
    | "draft_items"
    | "inter_round_synthesis"
    | "lint_wording"
    | "irb_pack"
    | "controlled_feedback"
    | "operational_assistance";
  input_scope_ids: string[];
  output_json: unknown;
  output_hash: string;
  created_at: string;
  decision: "None" | "Accepted" | "Edited" | "Rejected";
  resulting_object_ids: string[];
};

export type AISuggestionReleaseSignoff = {
  suggestion_id: string;
  required_role: "Owner" | "MethodsSteward";
  signed_by_user_id: string;
  signed_at: string;
  note?: string;
};

export type AIFeaturePermissions = {
  clustering: boolean;
  item_drafting: boolean;
  neutrality_method_linting: boolean;
  reminders: boolean;
  irb_export_drafting: boolean;
  report_drafting: boolean;
};

export type AIConfigDisclosure = {
  dataMayBeSentDescription: string;
  identifiersExcludedDescription: string;
  optOutDescription: string;
  humanInTheLoopDescription: string;
};

export type StudyAIConfig = {
  studyId: string;
  externalAiEnabled: boolean;
  noExternalAiMode: boolean;
  providerName: string | null;
  modelName: string | null;
  apiKeyCreatedAt: string | null;
  apiKeyRotatedAt: string | null;
  apiKeyDeletedAt: string | null;
  featurePermissions: AIFeaturePermissions;
  disclosure: AIConfigDisclosure;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  keyExists: boolean;
  maskedApiKey: string | null;
};

export type AIConfigValidation = {
  status: "ready" | "incomplete" | "no_external_ai_mode";
  errors: string[];
  warnings: string[];
};

export type RoundItemForParticipant = {
  item_id: string;
  text: string;
  round_number: number;
  provenance_type: "PanelDerived" | "LiteratureDerived";
  your_prior_response: {
    rating: number;
    action: "keep" | "revise";
    submitted_at: string;
  } | null;
  controlled_feedback?: {
    source_round_number: number;
    format: "distribution_only" | "distribution_summary" | "distribution_rationales";
    show_participant_prior_response: boolean;
    item_source: "panel-generated" | "literature-derived" | "researcher-added" | "AI-assisted draft, human approved";
    participant_prior_response: {
      rating: number;
      action: "keep" | "revise";
      submitted_at: string | null;
    } | null;
    group_summary: {
      median: number | null;
      iqr: number | null;
      q1: number | null;
      q3: number | null;
      response_count: number;
      distribution: Record<string, number>;
    };
    neutral_summary: { approved: boolean; text: string } | null;
    rationale_excerpts: { approved: boolean; excerpts: string[] } | null;
  };
};

export type RoundReport = {
  generated_at: string;
  report_kind: "round_report" | "final_export_report";
  report_stage: "interim" | "final";
  is_final_for_declared_design?: boolean;
  round_number?: number;
  final_round_number?: number;
  hashes: {
    config_hash: string | null;
    dataset_hash: string;
  };
  limitations: string[];
  summary: {
    published_item_count?: number;
    published_final_round_item_count?: number;
    consensus_item_count: number;
    non_consensus_item_count: number;
    undetermined_item_count: number;
    round_submission_count?: number;
    final_round_submission_count?: number;
    round1_response_count?: number;
    unique_rated_item_count?: number;
    final_round_unique_rated_item_count?: number;
    attrition?: AttritionSummary;
  };
  items: Array<{
    item_id: string;
    text: string;
    round_number: number;
    rating_summary: {
      response_count: number;
      median: number | null;
      dispersion: {
        min: number | null;
        max: number | null;
        iqr: number | null;
        q1: number | null;
        q3: number | null;
      };
      distribution: Record<string, number>;
    };
    consensus: {
      status: "consensus" | "non_consensus" | "undetermined";
      threshold_percent: number | null;
      agreement_min_rating: number | null;
      agreement_count: number | null;
      agreement_percent: number | null;
      reason: string | null;
    };
  }>;
};

export type FinalResultSnapshot = {
  snapshotId: string;
  studyId: string;
  studyVersionId: string;
  terminalRoundId: string;
  terminalRoundNumber: number;
  closedAt: string;
  status: "draft" | "signed_off" | "released" | "archived";
  releaseSignoffs: Array<{
    requiredRole: "Owner" | "MethodsSteward";
    signedByUserId: string;
    signedAt: string;
  }>;
  participantReleasedAt: string | null;
  archivedAt: string | null;
  consensusRule: {
    ruleId: string;
    lockedAt: string;
    lockStatus: "locked" | "amended" | "invalid_or_missing";
    description: string;
    threshold: number;
    scale: string;
    dispersionMetric: string;
    rationale: string;
    nearConsensusDefinition: {
      preSpecified: boolean;
      description: string;
      threshold?: number;
      dispersionMargin?: number;
    } | null;
  };
  roundSummaries: Array<{
    roundId: string;
    roundNumber: number;
    openedAt: string;
    closedAt: string;
    invitedCount: number;
    eligibleCount: number;
    completedCount: number;
    completionRate: number;
    attritionFromPriorRound: number | null;
  }>;
  itemOutcomes: Array<{
    itemId: string;
    finalText: string;
    wordingHistory: Array<{ roundNumber: number; text: string; changedAt?: string; changeReason?: string }>;
    provenance: "panel_generated" | "literature_derived" | "researcher_added" | "ai_assisted";
    finalN: number;
    median: number | null;
    iqr: number | null;
    agreementPercent: number | null;
    distribution: Record<string, number>;
    outcome: "consensus" | "near_consensus" | "descriptive_near_consensus" | "no_consensus" | "consensus_out";
    roundTrend: Array<{ roundNumber: number; median: number | null; iqr: number | null; agreementPercent: number | null }>;
    neutralSummary: string | null;
    summaryReview: {
      draftedBy: "human" | "ai" | "template" | null;
      aiSuggestionStatus?: "not_ai" | "pending_review" | "accepted" | "edited" | "rejected";
      reviewedByUserId?: string;
      reviewedAt?: string;
      ethicsMethodsStewardSignedOff?: boolean;
      studyOwnerSignedOff?: boolean;
    };
    preservedPerspectives: Array<{
      summary: string;
      source: "anonymized_comment" | "round1_unique_statement" | "method_note";
      privacySuppressed: boolean;
      privacySuppressionReason?: string | null;
      humanReviewed: boolean;
    }>;
    exportInclusion: {
      participantSummary: boolean;
      fullReport: boolean;
      csv: boolean;
      json: boolean;
      suppressionReason?: string | null;
    };
  }>;
  aggregateCounts: {
    consensus: number;
    nearConsensus: number;
    descriptiveNearConsensus: number;
    noConsensus: number;
    consensusOut: number;
    preservedPerspectiveCount: number;
    terminalRoundCompletedCount: number;
    terminalRoundEligibleCount: number;
    terminalRoundCompletionRate: number;
    overallAttritionLabel: string;
  };
  methodWarnings: Array<{ code: string; severity: "info" | "caution" | "blocking"; message: string }>;
  limitations: string[];
  requiredStatement: "Consensus indicates agreement among this panel; it does not establish correctness.";
  provenanceHash: string;
  exportHash: string;
  createdAt: string;
  createdByUserId: string;
};

export type ParticipantFinalResponse = {
  item_id: string;
  item_text: string;
  rating: number;
  rationale_text: string;
  submitted_at: string;
};

export type ParticipantIssueType =
  | "button_or_textbox_not_working"
  | "cannot_start_or_continue"
  | "save_or_resume_problem"
  | "confusing_text"
  | "accessibility_problem"
  | "other";

export type ParticipantIssue = {
  issue_id: string;
  study_id: string;
  version_id: string;
  participant_id: string;
  participant_alias: string;
  round_number: number | null;
  page_context: string;
  issue_type: ParticipantIssueType;
  note: string;
  status: "open" | "reviewed" | "closed";
  staff_response_note: string | null;
  reviewed_at: string | null;
  closed_at: string | null;
  responded_at: string | null;
  responded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: "participant_invitation" | "magic_link" | "staff_preview";
};

export type ParticipantIssueInput = {
  round_number: number | null;
  page_context: string;
  issue_type: ParticipantIssueType;
  note: string;
};

export type SmsPolicy = {
  study_id: string;
  version_id: string;
  sms_enabled: boolean;
  notification_safe_name: string | null;
  safe_name_is_sensitive: boolean;
  magic_link_ttl_minutes: number;
  updated_at: string;
  updated_by_user_id: string;
};

export type ParticipantContactPreference = {
  participant_id: string;
  notification_preference: "email_only" | "sms_only" | "both" | "no_sms";
  phone_last_four: string | null;
  masked_phone: string | null;
  sms_consent_at: string | null;
  sms_consent_version: string | null;
  sms_consent_revoked_at: string | null;
  phone_verified_at: string | null;
  phone_verification_method: string | null;
  updated_at: string;
  updated_by_user_id: string;
};

export type SmsNotification = {
  sms_notification_id: string;
  participant_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
  provider: string;
  provider_message_id: string | null;
  status: "queued" | "sent" | "failed" | "delivered" | "undelivered" | "skipped";
  status_updated_at: string | null;
  sent_at: string | null;
  failed_at: string | null;
  failure_code: string | null;
  preference_snapshot_json: string;
  magic_link_id: string | null;
  created_at: string;
};

export type PhoneVerificationChallengeResponse = {
  challenge_id: string;
  masked_phone: string;
  expires_at: string;
  dev_otp?: string;
};

export type MagicRoundEntryContext = {
  study: {
    study_id: string;
    version_id: string;
    safe_display_name: string;
    purpose: string;
  };
  participant_id: string;
  round: {
    round_number: number;
    title: string;
    status: "open" | "closed" | "completed" | "withdrawn" | "unavailable" | "declined";
    estimated_minutes: number;
    task_type: string;
    controlled_feedback: boolean;
  };
  voluntary_reminder: string;
  controlled_feedback_explanation: string | null;
  research_questions: ResearchQuestion[];
};

export type StudyContextDisclosure = {
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
    funding_status:
      | "not_specified"
      | "no_external_funding_or_sponsor"
      | "internally_supported"
      | "externally_funded"
      | "sponsor_corporate_partner_involved"
      | "other_needs_explanation";
    funder_name: string;
    sponsor_name: string;
    grant_or_contract_number: string;
    sponsor_roles: string[];
    role_details: string;
  };
  data_access: {
    sponsor_can_access_raw_responses: "not_specified" | "no" | "yes" | "not_applicable" | "unknown_needs_review";
    sponsor_can_access_identifiable_data: "not_specified" | "no" | "yes" | "not_applicable" | "unknown_needs_review";
    sponsor_can_access_aggregate_results: "not_specified" | "no" | "yes" | "not_applicable" | "unknown_needs_review";
    sponsor_has_report_review_rights: "not_specified" | "no" | "yes" | "not_applicable" | "unknown_needs_review";
    sponsor_has_report_approval_rights: "not_specified" | "no" | "yes" | "not_applicable" | "unknown_needs_review";
    sponsor_has_publication_approval_rights: "not_specified" | "no" | "yes" | "not_applicable" | "unknown_needs_review";
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
    suggestions: Array<{
      suggestion_id: string;
      field_path: string;
      label: "AI Suggestion — Not Final";
      proposed_value: string | boolean | null;
      confidence: "high" | "medium" | "low";
      evidence_snippet: string;
      source_location: string;
      rationale: string;
      status: "pending" | "accepted" | "edited" | "rejected";
    }>;
  };
};

export type StudyContextValidation = {
  status: "optional" | "ready" | "review_recommended";
  warnings: string[];
  material_conditions: string[];
};

export type ExportFormat = ".docx" | ".xlsx" | ".csv" | ".json" | ".md" | ".txt";
export type ExportContentEncoding = "utf8" | "base64";

export type ExportPackageFile = {
  export_file_id: string;
  export_package_id: string;
  path: string;
  format: ExportFormat;
  media_type: string;
  sha256: string;
  record_count: number | null;
  contains_identifiable_data: boolean;
  redaction_profile: Record<string, unknown>;
  content_text: string;
  content_encoding: ExportContentEncoding;
  created_at: string;
};

export type ExportPackageReview = {
  review_id: string;
  export_package_id: string;
  study_id: string;
  study_version_id: string;
  reviewed_at: string;
  reviewed_by: {
    user_id: string;
    role: string;
  };
  review_status: "approved" | "rejected";
  note: string;
  audit_event_id: string;
};

export type ExportPackage = {
  export_package_id: string;
  study_id: string;
  study_version_id: string;
  export_type:
    | "final-delphi-report"
    | "irb-pack"
    | "anonymized-response-dataset"
    | "audit-package"
    | "provenance-bundle"
    | "complete-archive";
  export_created_at: string;
  export_created_by: {
    user_id: string;
    role: string;
  };
  export_format_set: ExportFormat[];
  data_cutoff_at: string;
  consensus_rule_version_id: string | null;
  feedback_config_version_id: string | null;
  instrument_version_ids: string[];
  contains_identifiable_data: boolean;
  anonymization_level: "none" | "pseudonymized" | "anonymized" | "aggregated_only";
  external_ai_used: boolean;
  human_review_required: boolean;
  human_review_status: "draft" | "pending_review" | "approved" | "rejected" | "superseded";
  release_status: "not_released" | "released" | "superseded";
  released_at: string | null;
  released_by_user_id: string | null;
  release_signoff_ids: string[];
  supersedes_export_package_id: string | null;
  limitations_text_version_id: string;
  manifest_hash: string;
  package_hash: string;
  audit_event_id: string;
  files: Omit<ExportPackageFile, "content_text">[];
  reviews?: ExportPackageReview[];
};

export type SavedStudyRecord = {
  study: BackendStudy;
  versions: BackendStudyVersion[];
  latestVersion: BackendStudyVersion | null;
  signoffs: BackendSignoff[];
};

export type ParticipantInvitationContext = {
  invitation: {
    invitation_id: string;
    study_id: string;
    version_id: string;
    participant_id: string;
    expires_at: string;
  };
  study: BackendStudy | null;
  study_version: BackendStudyVersion | null;
  active_consent_version: ConsentVersion | null;
  consent_record: {
    participant_id: string;
    consent_version_id: string;
    consented_at: string;
    withdrew_at: string | null;
  } | null;
  participant_status: ParticipantEnrollment | null;
  orientation_completion: {
    participant_id: string;
    study_id: string;
    version_id: string;
    orientation_version: string;
    completed_at: string;
  } | null;
  orientation_version: string;
  round_configs: RoundConfig[];
  drafts: ParticipantDraft[];
};

export type ParticipantDraft = {
  study_id: string;
  version_id: string;
  participant_id: string;
  round_number: number;
  draft_json: unknown;
  updated_at: string;
};

export type ParticipantStatus =
  | "ACTIVE"
  | "NON_RESPONSIVE_FLAGGED"
  | "WITHDRAWN_PARTICIPANT"
  | "WITHDRAWN_PI"
  | "COMPLETED";

export type ParticipantEnrollment = {
  enrollment_id: string;
  study_id: string;
  version_id: string;
  participant_id: string;
  status: ParticipantStatus;
  inactive_from_round_number: number | null;
  withdrawal_type: "participant" | "pi" | null;
  withdrawal_reason_code: string | null;
  withdrawal_note: string | null;
  withdrawn_at: string | null;
  status_updated_at: string;
  created_at: string;
  created_by_user_id: string;
  timeline: Array<{ status: ParticipantStatus; at: string; actor_user_id: string; reason: string; round_number: number | null }>;
};

export type NonResponsePolicy = {
  policy_id: string;
  study_id: string;
  version_id: string;
  version_number: number;
  missed_current_round_deadline: boolean;
  no_activity_days_threshold: number | null;
  incomplete_submission_counts_as_non_response: boolean;
  follow_up_window_days: number;
  final_notice_enabled: boolean;
  auto_progression_enabled: boolean;
  attrition_warning_threshold_percent: number;
  created_at: string;
  updated_at: string;
  changed_by_user_id: string;
};

export type NonResponseEscalation = {
  escalation_id: string;
  study_id: string;
  version_id: string;
  participant_id: string;
  round_number: number;
  state: string;
  trigger_rule: string;
  followup_window_ends_at: string | null;
  message_texts: Array<{ kind: "reminder" | "final_notice"; text: string; queued_at: string }>;
};

export type AttritionSummary = {
  total_participants_invited_or_enrolled: number;
  current_active_count: number;
  non_responsive_flagged_count: number;
  participant_withdrawal_count: number;
  pi_inactive_count: number;
  completed_count: number;
  attrition_rate: number;
  rounds: Array<{
    round_number: number;
    invited_or_enrolled_count: number;
    active_count: number;
    submitted_count: number;
    response_rate: number;
    non_responsive_flagged_count: number;
    participant_withdrawal_count: number;
    pi_inactive_count: number;
  }>;
  warnings: string[];
  limitations_note: string;
};

export type BackendRole =
  | "owner"
  | "methods_steward"
  | "privacy_lead"
  | "data_custodian"
  | "maintainer"
  | "admin"
  | "participant";

export const apiBoundary: ApiBoundary = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:3001",
  authHeaderRole: "study_owner",
  mode: "backend-wired",
};

const backendRoles: Record<UserRole, BackendRole> = {
  study_owner: "owner",
  ethics_methods_steward: "methods_steward",
  security_privacy_lead: "privacy_lead",
  data_custodian: "data_custodian",
  open_source_admin: "admin",
  study_coordinator: "owner",
  panelist: "participant",
};

const demoCredentials: Record<UserRole, { email: string; password: string }> = {
  study_owner: { email: "owner@example.test", password: "demo-owner" },
  ethics_methods_steward: { email: "steward@example.test", password: "demo-steward" },
  security_privacy_lead: { email: "privacy@example.test", password: "demo-privacy" },
  data_custodian: { email: "custodian@example.test", password: "demo-custodian" },
  open_source_admin: { email: "admin@example.test", password: "demo-admin" },
  study_coordinator: { email: "owner@example.test", password: "demo-owner" },
  panelist: { email: "participant@example.test", password: "demo-participant" },
};

const sessionTokens = new Map<UserRole, string>();

async function getSessionToken(role: UserRole): Promise<string | null> {
  const cached = sessionTokens.get(role);
  if (cached) return cached;

  const credentials = demoCredentials[role];
  try {
    const response = await fetch(`${apiBoundary.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { token?: string };
    if (!payload.token) return null;
    sessionTokens.set(role, payload.token);
    return payload.token;
  } catch {
    return null;
  }
}

async function authHeaders(role: UserRole): Promise<HeadersInit> {
  const backendRole = backendRoles[role];
  const token = await getSessionToken(role);

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "X-User-ID": `${role}-dev-user`,
    "X-User-Role": backendRole,
  };
}

async function requestJson<T>(
  path: string,
  role: UserRole,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${apiBoundary.baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: await authHeaders(role),
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => null) as unknown;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

async function requestInvitationJson<T>(
  path: string,
  token: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${apiBoundary.baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Participant-Invitation": token,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

async function requestMagicJson<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${apiBoundary.baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = await response.json().catch(() => null) as unknown;
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export type StudyApi = {
  listStudies: () => Promise<StudyRecord[]>;
  exportOutput: (studyId: string, outputModelId: OutputModelId) => Promise<{ auditAction: string }>;
};

export function createStudyApi(studies: StudyRecord[]): StudyApi {
  return {
    async listStudies() {
      return studies;
    },
    async exportOutput(_studyId, outputModelId) {
      return { auditAction: `ui.export.requested.${outputModelId}` };
    },
  };
}

export const conductorApi = {
  async listSavedStudies(role: UserRole): Promise<SavedStudyRecord[]> {
    const { studies } = await requestJson<{ studies: BackendStudy[] }>("/studies", role);

    return Promise.all(
      studies.map(async (study) => {
        const { studyVersions } = await requestJson<{ studyVersions: BackendStudyVersion[] }>(
          `/studies/${study.id}/versions`,
          role,
        );

        const latestVersion = studyVersions.at(-1) ?? null;
        const signoffs = latestVersion
          ? (await requestJson<{ signoffs: BackendSignoff[] }>(
              `/studies/${study.id}/versions/${latestVersion.id}/signoffs`,
              role,
            )).signoffs
          : [];

        return {
          study,
          versions: studyVersions,
          latestVersion,
          signoffs,
        };
      }),
    );
  },

  async createStudy(role: UserRole, input?: Pick<StudyWizardState, "title" | "description">) {
    return requestJson<{ study: BackendStudy }>("/studies", role, {
      method: "POST",
      body: {
        title: input?.title ?? "Care Transitions Expert Delphi",
        description: input?.description ?? "Backend-backed conductor workflow created from the frontend.",
      },
    });
  },

  async createVersion(studyId: string, role: UserRole) {
    return requestJson<{ studyVersion: BackendStudyVersion }>(`/studies/${studyId}/versions`, role, {
      method: "POST",
      body: {},
    });
  },

  async archiveStudy(studyId: string, role: UserRole) {
    return requestJson<{ study: BackendStudy }>(`/studies/${studyId}/archive`, role, {
      method: "PATCH",
      body: {},
    });
  },

  async listUsers(role: UserRole) {
    return requestJson<{ users: BackendUser[] }>("/admin/users", role);
  },

  async listAssignments(studyId: string, role: UserRole) {
    return requestJson<{ assignments: StudyAssignment[] }>(`/studies/${studyId}/assignments`, role);
  },

  async assignStudyRole(studyId: string, userId: string, studyRole: StudyAssignment["role"], role: UserRole) {
    return requestJson<{ assignment: StudyAssignment }>(`/studies/${studyId}/assignments`, role, {
      method: "POST",
      body: { user_id: userId, role: studyRole },
    });
  },

  async removeStudyAssignment(studyId: string, userId: string, role: UserRole) {
    return requestJson<{ ok: true }>(`/studies/${studyId}/assignments/${userId}`, role, {
      method: "DELETE",
      body: undefined,
    });
  },

  async getAIConfig(studyId: string, role: UserRole) {
    return requestJson<{ ai_config: StudyAIConfig; validation: AIConfigValidation }>(
      `/studies/${studyId}/ai-config`,
      role,
    );
  },

  async updateAIConfig(
    studyId: string,
    role: UserRole,
    input: Partial<Pick<StudyAIConfig, "externalAiEnabled" | "noExternalAiMode" | "providerName" | "modelName">> & {
      featurePermissions?: Partial<AIFeaturePermissions>;
      disclosure?: Partial<AIConfigDisclosure>;
    },
  ) {
    return requestJson<{ ai_config: StudyAIConfig; validation: AIConfigValidation }>(
      `/studies/${studyId}/ai-config`,
      role,
      {
        method: "PUT",
        body: input,
      },
    );
  },

  async setAIConfigApiKey(studyId: string, role: UserRole, apiKey: string) {
    return requestJson<{ ai_config: StudyAIConfig; validation: AIConfigValidation }>(
      `/studies/${studyId}/ai-config/api-key`,
      role,
      {
        method: "POST",
        body: { apiKey },
      },
    );
  },

  async deleteAIConfigApiKey(studyId: string, role: UserRole) {
    return requestJson<{ ai_config: StudyAIConfig; validation: AIConfigValidation }>(
      `/studies/${studyId}/ai-config/api-key`,
      role,
      {
        method: "DELETE",
      },
    );
  },

  async validateAIConfig(studyId: string, role: UserRole) {
    return requestJson<{ ai_config: StudyAIConfig; validation: AIConfigValidation }>(
      `/studies/${studyId}/ai-config/validate`,
      role,
      {
        method: "POST",
        body: {},
      },
    );
  },

  async getStudyContextDisclosure(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ context: StudyContextDisclosure; validation: StudyContextValidation }>(
      `/studies/${studyId}/versions/${versionId}/context-disclosure`,
      role,
    );
  },

  async updateStudyContextDisclosure(
    studyId: string,
    versionId: string,
    role: UserRole,
    body: Partial<StudyContextDisclosure>,
  ) {
    return requestJson<{ context: StudyContextDisclosure; validation: StudyContextValidation }>(
      `/studies/${studyId}/versions/${versionId}/context-disclosure`,
      role,
      { method: "PUT", body },
    );
  },

  async generateStudyContextParticipantDisclosure(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ context: StudyContextDisclosure; validation: StudyContextValidation }>(
      `/studies/${studyId}/versions/${versionId}/context-disclosure/generate-participant-disclosure`,
      role,
      { method: "POST", body: {} },
    );
  },

  async importStudyContextProposal(
    studyId: string,
    versionId: string,
    role: UserRole,
    sourceName: string,
    sourceText: string,
  ) {
    return requestJson<{ context: StudyContextDisclosure; validation: StudyContextValidation }>(
      `/studies/${studyId}/versions/${versionId}/context-disclosure/proposal-import`,
      role,
      { method: "POST", body: { source_document_name: sourceName, source_text: sourceText } },
    );
  },

  async decideStudyContextSuggestion(
    studyId: string,
    versionId: string,
    role: UserRole,
    suggestionId: string,
    action: "accept" | "edit" | "reject",
    editedValue?: string | boolean | null,
  ) {
    return requestJson<{ context: StudyContextDisclosure; validation: StudyContextValidation }>(
      `/studies/${studyId}/versions/${versionId}/context-disclosure/proposal-suggestions/${suggestionId}/decision`,
      role,
      { method: "POST", body: { action, edited_value: editedValue } },
    );
  },

  async setDesign(
    studyId: string,
    versionId: string,
    role: UserRole,
    input?: Pick<
      StudyWizardState,
      "studyFormat" | "plannedRoundCount" | "terminalRoundNumber" | "modifiedDesignRationale"
    >,
  ) {
    return requestJson<{ studyVersion: BackendStudyVersion }>(
      `/studies/${studyId}/versions/${versionId}/design`,
      role,
      {
        method: "PATCH",
        body: {
          study_format: input?.studyFormat ?? "ModifiedDelphi",
          planned_round_count: input?.plannedRoundCount ?? 3,
          terminal_round_number: input?.terminalRoundNumber ?? 3,
          method_rationale:
            input?.modifiedDesignRationale ??
            "A modified Delphi design is appropriate because Round 1 gathers open-ended expert input before structured rating rounds.",
        },
      },
    );
  },

  async setConsensusRule(
    studyId: string,
    versionId: string,
    role: UserRole,
    input?: Pick<
      StudyWizardState,
      | "consensusThreshold"
      | "agreementMinRating"
      | "consensusRuleSource"
      | "consensusRuleProcess"
      | "preRoundConsensusInputEnabled"
      | "preRoundConsensusInputStatus"
      | "preRoundConsensusPrompt"
      | "preRoundConsensusSummary"
    >,
  ) {
    return requestJson<{ studyVersion: BackendStudyVersion }>(
      `/studies/${studyId}/versions/${versionId}/consensus-rule`,
      role,
      {
        method: "PATCH",
        body: {
          consensus_rule_json: {
            type: "percent_agreement",
            threshold: input?.consensusThreshold ?? 80,
            agreement_min_rating: input?.agreementMinRating ?? 7,
            source: input?.consensusRuleSource ?? "pi_defined",
            setting_process:
              input?.consensusRuleProcess ??
              "The Study Owner defines the consensus threshold before Round 1 and submits it for governance signoff.",
            pre_round_consensus_input: {
              enabled: input?.preRoundConsensusInputEnabled ?? false,
              status: input?.preRoundConsensusInputStatus ?? "not_required",
              prompt: input?.preRoundConsensusPrompt ?? "",
              summary: input?.preRoundConsensusSummary ?? "",
              counts_as_delphi_round: false,
            },
            finalized_before_round_1: true,
          },
        },
      },
    );
  },

  async saveWizardPacket(studyId: string, versionId: string, role: UserRole, wizard: StudyWizardState) {
    return requestJson<{ studyVersion: BackendStudyVersion }>(
      `/studies/${studyId}/versions/${versionId}/wizard-packet`,
      role,
      {
        method: "PATCH",
        body: {
          study_design_packet_json: wizard,
        },
      },
    );
  },

  async submitForSignoff(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ studyVersion: BackendStudyVersion }>(
      `/studies/${studyId}/versions/${versionId}/submit-for-signoff`,
      role,
      { method: "POST", body: {} },
    );
  },

  async signoff(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ signoff: BackendSignoff }>(
      `/studies/${studyId}/versions/${versionId}/signoff`,
      role,
      { method: "POST", body: { note: "Frontend conductor workflow signoff." } },
    );
  },

  async activate(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ studyVersion: BackendStudyVersion }>(
      `/studies/${studyId}/versions/${versionId}/activate`,
      role,
      { method: "POST", body: {} },
    );
  },

  async openRoundOne(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ studyVersion: BackendStudyVersion }>(
      `/studies/${studyId}/versions/${versionId}/open-round-1`,
      role,
      { method: "POST", body: {} },
    );
  },

  async listRoundConfigs(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ round_configs: RoundConfig[] }>(
      `/studies/${studyId}/versions/${versionId}/round-configs`,
      role,
    );
  },

  async saveRoundConfig(
    studyId: string,
    versionId: string,
    roundNumber: number,
    role: UserRole,
    input: Omit<RoundConfig, "round_config_id" | "study_id" | "version_id" | "round_number" | "created_at" | "updated_at">,
  ) {
    return requestJson<{ round_config: RoundConfig }>(
      `/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/config`,
      role,
      { method: "PATCH", body: input },
    );
  },

  async openRound(studyId: string, versionId: string, roundNumber: number, role: UserRole) {
    return requestJson<{ round_config: RoundConfig }>(
      `/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/open`,
      role,
      { method: "POST", body: {} },
    );
  },

  async closeRound(studyId: string, versionId: string, roundNumber: number, role: UserRole) {
    return requestJson<{ round_config: RoundConfig; final_result_snapshot?: FinalResultSnapshot }>(
      `/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/close`,
      role,
      { method: "POST", body: {} },
    );
  },

  async getFinalResults(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ snapshot: FinalResultSnapshot | null; release_blockers: string[] }>(
      `/studies/${studyId}/versions/${versionId}/final-results`,
      role,
    );
  },

  async createFinalResults(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ snapshot: FinalResultSnapshot; release_blockers: string[] }>(
      `/studies/${studyId}/versions/${versionId}/final-results`,
      role,
      { method: "POST", body: {} },
    );
  },

  async signoffFinalResults(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ snapshot: FinalResultSnapshot; release_blockers: string[] }>(
      `/studies/${studyId}/versions/${versionId}/final-results/signoff`,
      role,
      { method: "POST", body: {} },
    );
  },

  async releaseFinalResults(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ snapshot: FinalResultSnapshot; release_blockers: string[] }>(
      `/studies/${studyId}/versions/${versionId}/final-results/release`,
      role,
      { method: "POST", body: {} },
    );
  },

  async archiveFinalResults(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ snapshot: FinalResultSnapshot; release_blockers: string[] }>(
      `/studies/${studyId}/versions/${versionId}/final-results/archive`,
      role,
      { method: "POST", body: {} },
    );
  },

  async createConsentVersion(studyId: string, versionId: string, role: UserRole, textMd: string) {
    return requestJson<{ consent_version: ConsentVersion }>(
      `/studies/${studyId}/versions/${versionId}/consent-versions`,
      role,
      { method: "POST", body: { text_md: textMd } },
    );
  },

  async activateConsentVersion(studyId: string, versionId: string, consentVersionId: string, role: UserRole) {
    return requestJson<{ consent_version: ConsentVersion }>(
      `/studies/${studyId}/versions/${versionId}/consent-versions/${consentVersionId}/activate`,
      role,
      { method: "POST", body: {} },
    );
  },

  async recordConsent(studyId: string, versionId: string, participantId: string, role: UserRole) {
    return requestJson<{ consent_record: unknown }>(
      `/studies/${studyId}/versions/${versionId}/consent`,
      role,
      { method: "POST", body: { participant_id: participantId } },
    );
  },

  async createParticipantInvitation(studyId: string, versionId: string, participantId: string, role: UserRole) {
    return requestJson<{ invitation: unknown; invitation_url: string }>(
      `/studies/${studyId}/versions/${versionId}/participants/${participantId}/invitations`,
      role,
      { method: "POST", body: {} },
    );
  },

  async getNonResponsePolicy(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ policy: NonResponsePolicy }>(
      `/studies/${studyId}/versions/${versionId}/non-response-policy`,
      role,
    );
  },

  async updateNonResponsePolicy(studyId: string, versionId: string, role: UserRole, policy: Partial<NonResponsePolicy>) {
    return requestJson<{ policy: NonResponsePolicy }>(
      `/studies/${studyId}/versions/${versionId}/non-response-policy`,
      role,
      { method: "PUT", body: policy },
    );
  },

  async detectNonResponse(studyId: string, versionId: string, roundNumber: number, role: UserRole) {
    return requestJson<{ flagged: Array<{ participant_id: string; escalation: NonResponseEscalation }>; policy: NonResponsePolicy }>(
      `/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/non-response/detect`,
      role,
      { method: "POST", body: { as_of: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString() } },
    );
  },

  async queueParticipantReminder(studyId: string, versionId: string, roundNumber: number, participantId: string, role: UserRole) {
    return requestJson<{ escalation: NonResponseEscalation }>(
      `/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/participants/${participantId}/reminder`,
      role,
      { method: "POST", body: {} },
    );
  },

  async queueParticipantFinalNotice(studyId: string, versionId: string, roundNumber: number, participantId: string, role: UserRole) {
    return requestJson<{ escalation: NonResponseEscalation }>(
      `/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/participants/${participantId}/final-notice`,
      role,
      { method: "POST", body: {} },
    );
  },

  async expireParticipantFollowup(studyId: string, versionId: string, roundNumber: number, participantId: string, role: UserRole) {
    return requestJson<{ escalation: NonResponseEscalation }>(
      `/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/participants/${participantId}/followup-expire`,
      role,
      { method: "POST", body: { as_of: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString() } },
    );
  },

  async markParticipantInactive(studyId: string, versionId: string, participantId: string, role: UserRole, inactiveFromRoundNumber: number) {
    return requestJson<{ participant_status: ParticipantEnrollment; escalation: NonResponseEscalation }>(
      `/studies/${studyId}/versions/${versionId}/participants/${participantId}/mark-inactive`,
      role,
      {
        method: "POST",
        body: {
          inactive_from_round_number: inactiveFromRoundNumber,
          reason_code: "no_response_after_followup",
          note: "Marked inactive after configured follow-up window for future study progression only.",
          safeguard_acknowledged: true,
        },
      },
    );
  },

  async getAttritionSummary(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{
      policy: NonResponsePolicy;
      attrition_summary: AttritionSummary;
      participant_statuses: ParticipantEnrollment[];
      escalations: NonResponseEscalation[];
    }>(`/studies/${studyId}/versions/${versionId}/attrition-summary`, role);
  },

  async getSmsPolicy(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ policy: SmsPolicy }>(`/studies/${studyId}/versions/${versionId}/sms-policy`, role);
  },

  async updateSmsPolicy(studyId: string, versionId: string, role: UserRole, policy: Partial<SmsPolicy>) {
    return requestJson<{ policy: SmsPolicy }>(
      `/studies/${studyId}/versions/${versionId}/sms-policy`,
      role,
      { method: "PUT", body: policy },
    );
  },

  async getContactPreference(studyId: string, versionId: string, participantId: string, role: UserRole) {
    return requestJson<{ contact_preference: ParticipantContactPreference | null }>(
      `/studies/${studyId}/versions/${versionId}/participants/${encodeURIComponent(participantId)}/contact-preferences`,
      role,
    );
  },

  async updateContactPreference(
    studyId: string,
    versionId: string,
    participantId: string,
    role: UserRole,
    input: { notification_preference: ParticipantContactPreference["notification_preference"]; phone?: string; sms_consent_granted?: boolean },
  ) {
    return requestJson<{ contact_preference: ParticipantContactPreference }>(
      `/studies/${studyId}/versions/${versionId}/participants/${encodeURIComponent(participantId)}/contact-preferences`,
      role,
      { method: "PATCH", body: input },
    );
  },

  async startPhoneVerification(studyId: string, versionId: string, participantId: string, role: UserRole) {
    return requestJson<PhoneVerificationChallengeResponse>(
      `/studies/${studyId}/versions/${versionId}/participants/${encodeURIComponent(participantId)}/phone-verification/start`,
      role,
      { method: "POST", body: {} },
    );
  },

  async verifyPhoneOtp(studyId: string, versionId: string, participantId: string, role: UserRole, challengeId: string, otp: string) {
    return requestJson<{ contact_preference: ParticipantContactPreference }>(
      `/studies/${studyId}/versions/${versionId}/participants/${encodeURIComponent(participantId)}/phone-verification/verify`,
      role,
      { method: "POST", body: { challenge_id: challengeId, otp } },
    );
  },

  async sendRoundOpenSms(studyId: string, versionId: string, roundNumber: number, role: UserRole) {
    return requestJson<{ sms: { eligible_checked: number; sent: number; skipped: number; notifications: SmsNotification[] } }>(
      `/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/sms/send`,
      role,
      { method: "POST", body: {} },
    );
  },

  async listSmsNotifications(studyId: string, versionId: string, role: UserRole, roundNumber?: number) {
    return requestJson<{ notifications: SmsNotification[] }>(
      `/studies/${studyId}/versions/${versionId}/sms-notifications${roundNumber ? `?round_number=${roundNumber}` : ""}`,
      role,
    );
  },

  async consumeMagicLink(token: string) {
    return requestMagicJson<{ context: MagicRoundEntryContext }>("/magic-links/consume", {
      method: "POST",
      body: { token },
    });
  },

  async getMagicSession() {
    return requestMagicJson<{ context: MagicRoundEntryContext }>("/magic-links/session");
  },

  async listMagicRoundItems(roundNumber: number) {
    return requestMagicJson<{ items: RoundItemForParticipant[] }>(`/magic-links/rounds/${roundNumber}/items`);
  },

  async submitMagicRoundOneResponse(roundNumber: number, responses: string | RoundOneAnswerInput[]) {
    return requestMagicJson<{ response_id: string }>(`/magic-links/rounds/${roundNumber}/responses`, {
      method: "POST",
      body: typeof responses === "string" ? { text: responses } : { responses },
    });
  },

  async submitMagicRating(roundNumber: number, itemId: string, rating: number, action: "keep" | "revise", rationaleText: string) {
    return requestMagicJson<{ response_id: string }>(`/magic-links/rounds/${roundNumber}/ratings`, {
      method: "POST",
      body: { item_id: itemId, rating, action, rationale_text: rationaleText },
    });
  },

  async declineMagicRound(roundNumber: number) {
    return requestMagicJson<{ declined: boolean }>(`/magic-links/rounds/${roundNumber}/decline`, {
      method: "POST",
      body: {},
    });
  },

  async reportMagicParticipantIssue(input: ParticipantIssueInput) {
    return requestMagicJson<{ issue: ParticipantIssue }>("/magic-links/issues", {
      method: "POST",
      body: input,
    });
  },

  async listMagicParticipantIssues() {
    return requestMagicJson<{ issues: ParticipantIssue[] }>("/magic-links/issues");
  },

  async getParticipantInvitation(token: string) {
    return requestInvitationJson<ParticipantInvitationContext>("/participant/invitation", token);
  },

  async getInvitationFinalResults(token: string) {
    return requestInvitationJson<{ snapshot: FinalResultSnapshot; my_final_responses: ParticipantFinalResponse[] }>(
      "/participant/invitation/final-results",
      token,
    );
  },

  async recordInvitationConsent(token: string) {
    return requestInvitationJson<{ consent_record: unknown }>(
      "/participant/invitation/consent",
      token,
      { method: "POST", body: {} },
    );
  },

  async completeInvitationOrientation(token: string) {
    return requestInvitationJson<{ orientation_completion: NonNullable<ParticipantInvitationContext["orientation_completion"]> }>(
      "/participant/invitation/orientation/complete",
      token,
      { method: "POST", body: {} },
    );
  },

  async completeParticipantOrientation(
    studyId: string,
    versionId: string,
    participantId: string,
    role: UserRole,
  ) {
    return requestJson<{ orientation_completion: NonNullable<ParticipantInvitationContext["orientation_completion"]> }>(
      `/studies/${studyId}/versions/${versionId}/participants/${encodeURIComponent(participantId)}/orientation/complete`,
      role,
      { method: "POST", body: {} },
    );
  },

  async withdrawInvitationConsent(token: string) {
    return requestInvitationJson<{ consent_record: unknown }>(
      "/participant/invitation/withdraw",
      token,
      { method: "POST", body: {} },
    );
  },

  async requestInvitationDeletionReview(token: string, requestText: string) {
    return requestInvitationJson<{ deletion_request: DeletionRequest }>(
      "/participant/invitation/deletion-request",
      token,
      { method: "POST", body: { request_text: requestText } },
    );
  },

  async reportInvitationParticipantIssue(token: string, input: ParticipantIssueInput) {
    return requestInvitationJson<{ issue: ParticipantIssue }>(
      "/participant/invitation/issues",
      token,
      { method: "POST", body: input },
    );
  },

  async listInvitationParticipantIssues(token: string) {
    return requestInvitationJson<{ issues: ParticipantIssue[] }>("/participant/invitation/issues", token);
  },

  async listParticipantIssues(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ issues: ParticipantIssue[] }>(
      `/studies/${studyId}/versions/${versionId}/participant-issues`,
      role,
    );
  },

  async reportParticipantIssue(
    studyId: string,
    versionId: string,
    participantId: string,
    role: UserRole,
    input: ParticipantIssueInput,
  ) {
    return requestJson<{ issue: ParticipantIssue }>(
      `/studies/${studyId}/versions/${versionId}/participants/${encodeURIComponent(participantId)}/issues`,
      role,
      { method: "POST", body: input },
    );
  },

  async respondParticipantIssue(
    studyId: string,
    versionId: string,
    role: UserRole,
    issueId: string,
    body: { status: ParticipantIssue["status"]; staff_response_note: string },
  ) {
    return requestJson<{ issue: ParticipantIssue }>(
      `/studies/${studyId}/versions/${versionId}/participant-issues/${issueId}`,
      role,
      { method: "PATCH", body },
    );
  },

  async submitInvitationRoundOneResponse(token: string, responses: string | RoundOneAnswerInput[]) {
    return requestInvitationJson<{ response_id: string }>(
      "/participant/invitation/responses",
      token,
      { method: "POST", body: typeof responses === "string" ? { text: responses } : { responses } },
    );
  },

  async saveInvitationDraft(token: string, roundNumber: number, draftJson: unknown) {
    return requestInvitationJson<{ draft: ParticipantDraft }>(
      `/participant/invitation/rounds/${roundNumber}/draft`,
      token,
      { method: "PUT", body: { draft_json: draftJson } },
    );
  },

  async listInvitationRoundItems(token: string, roundNumber: number) {
    return requestInvitationJson<{ items: RoundItemForParticipant[] }>(
      `/participant/invitation/rounds/${roundNumber}/items`,
      token,
    );
  },

  async submitInvitationRating(
    token: string,
    roundNumber: number,
    itemId: string,
    rating: number,
    action: "keep" | "revise" = "revise",
    rationaleText = "",
  ) {
    return requestInvitationJson<{ response_id: string }>(
      `/participant/invitation/rounds/${roundNumber}/ratings`,
      token,
      { method: "POST", body: { item_id: itemId, rating, action, rationale_text: rationaleText } },
    );
  },

  async submitRoundOneResponse(
    studyId: string,
    versionId: string,
    participantId: string,
    role: UserRole,
    responses: string | RoundOneAnswerInput[],
  ) {
    return requestJson<{ response_id: string }>(
      `/studies/${studyId}/versions/${versionId}/responses`,
      role,
      {
        method: "POST",
        body: {
          participant_id: participantId,
          response_json:
            typeof responses === "string"
              ? { round_number: 1, text: responses }
              : { round_number: 1, responses },
        },
      },
    );
  },

  async listResponses(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ responses: ResponseRecord[] }>(
      `/studies/${studyId}/versions/${versionId}/responses`,
      role,
    );
  },

  async listItems(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ items: ItemRecord[] }>(
      `/studies/${studyId}/versions/${versionId}/items`,
      role,
    );
  },

  async createItem(
    studyId: string,
    versionId: string,
    role: UserRole,
    input: {
      text: string;
      round_number: number;
      provenance_type: "PanelDerived" | "LiteratureDerived";
      provenance_links?: ItemProvenanceLink[];
      rationale?: string;
    },
  ) {
    return requestJson<{ item: ItemRecord }>(
      `/studies/${studyId}/versions/${versionId}/items`,
      role,
      { method: "POST", body: input },
    );
  },

  async publishItem(studyId: string, versionId: string, itemId: string, role: UserRole) {
    return requestJson<{ item: ItemRecord }>(
      `/studies/${studyId}/versions/${versionId}/items/${itemId}/publish`,
      role,
      { method: "POST", body: {} },
    );
  },

  async updateItem(
    studyId: string,
    versionId: string,
    itemId: string,
    role: UserRole,
    input: { text?: string; status?: "Draft" | "Published" | "Rejected"; rationale?: string },
  ) {
    return requestJson<{ item: ItemRecord }>(
      `/studies/${studyId}/versions/${versionId}/items/${itemId}`,
      role,
      { method: "PATCH", body: input },
    );
  },

  async mergeItems(
    studyId: string,
    versionId: string,
    role: UserRole,
    input: { from_item_ids: string[]; to_item_id: string; rationale: string },
  ) {
    return requestJson<{ merge: unknown }>(
      `/studies/${studyId}/versions/${versionId}/items/merge`,
      role,
      { method: "POST", body: input },
    );
  },

  async splitItem(
    studyId: string,
    versionId: string,
    itemId: string,
    role: UserRole,
    input: { new_texts: string[]; rationale: string },
  ) {
    return requestJson<{ split: unknown; items: ItemRecord[] }>(
      `/studies/${studyId}/versions/${versionId}/items/${itemId}/split`,
      role,
      { method: "POST", body: input },
    );
  },

  async listAiSuggestions(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ suggestions: AISuggestionRecord[] }>(
      `/studies/${studyId}/versions/${versionId}/ai/suggestions`,
      role,
    );
  },

  async synthesizeInterRound(studyId: string, versionId: string, role: UserRole, targetRoundNumber = 2) {
    return requestJson<{ suggestion: AISuggestionRecord; release_signoffs: AISuggestionReleaseSignoff[] }>(
      `/studies/${studyId}/versions/${versionId}/ai/synthesize-inter-round`,
      role,
      { method: "POST", body: { target_round_number: targetRoundNumber } },
    );
  },

  async decideAiSuggestion(
    studyId: string,
    versionId: string,
    suggestionId: string,
    role: UserRole,
    decision: "Accepted" | "Edited" | "Rejected",
  ) {
    return requestJson<{ suggestion: AISuggestionRecord }>(
      `/studies/${studyId}/versions/${versionId}/ai/suggestions/${suggestionId}/decision`,
      role,
      { method: "POST", body: { decision, note: "Frontend curation decision." } },
    );
  },

  async materializeSuggestionItems(
    studyId: string,
    versionId: string,
    suggestionId: string,
    role: UserRole,
    candidateIds: string[],
    rationales: Record<string, string> = {},
  ) {
    return requestJson<{ items: ItemRecord[]; suggestion: AISuggestionRecord }>(
      `/studies/${studyId}/versions/${versionId}/ai/suggestions/${suggestionId}/items`,
      role,
      { method: "POST", body: { candidate_ids: candidateIds, rationales } },
    );
  },

  async signoffAiSuggestionRelease(
    studyId: string,
    versionId: string,
    suggestionId: string,
    role: UserRole,
  ) {
    return requestJson<{ signoff: AISuggestionReleaseSignoff; release_signoffs: AISuggestionReleaseSignoff[] }>(
      `/studies/${studyId}/versions/${versionId}/ai/suggestions/${suggestionId}/release-signoff`,
      role,
      { method: "POST", body: { note: "Frontend release signoff." } },
    );
  },

  async listRoundItems(
    studyId: string,
    versionId: string,
    roundNumber: number,
    participantId: string,
    role: UserRole,
  ) {
    return requestJson<{ items: RoundItemForParticipant[] }>(
      `/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/items?participant_id=${encodeURIComponent(participantId)}`,
      role,
    );
  },

  async submitRating(
    studyId: string,
    versionId: string,
    roundNumber: number,
    participantId: string,
    itemId: string,
    role: UserRole,
    rating: number,
    action: "keep" | "revise" = "revise",
    rationaleText = "",
  ) {
    return requestJson<{ response_id: string }>(
      `/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/ratings`,
      role,
      {
        method: "POST",
        body: {
          participant_id: participantId,
          item_id: itemId,
          rating,
          action,
          rationale_text: rationaleText,
        },
      },
    );
  },

  async getRoundReport(studyId: string, versionId: string, roundNumber: number, role: UserRole) {
    return requestJson<{ report: RoundReport }>(
      `/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/report`,
      role,
    );
  },

  async exportReport(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ report: RoundReport; export_package?: ExportPackage }>(
      `/studies/${studyId}/versions/${versionId}/export-report`,
      role,
    );
  },

  async listExportPackages(studyId: string, versionId: string, role: UserRole) {
    return requestJson<{ export_packages: ExportPackage[] }>(
      `/studies/${studyId}/versions/${versionId}/export-packages`,
      role,
    );
  },

  async createExportPackage(
    studyId: string,
    versionId: string,
    role: UserRole,
    exportType: ExportPackage["export_type"],
  ) {
    return requestJson<{ export_manifest: unknown; export_package: ExportPackage }>(
      `/studies/${studyId}/versions/${versionId}/export-packages`,
      role,
      { method: "POST", body: { export_type: exportType } },
    );
  },

  async listExportPackageFiles(studyId: string, versionId: string, packageId: string, role: UserRole) {
    return requestJson<{ export_package: ExportPackage; files: ExportPackageFile[] }>(
      `/studies/${studyId}/versions/${versionId}/export-packages/${packageId}/files`,
      role,
    );
  },

  async downloadExportPackageFile(
    studyId: string,
    versionId: string,
    packageId: string,
    fileId: string,
    role: UserRole,
  ) {
    return requestJson<{ export_package: ExportPackage; file: ExportPackageFile }>(
      `/studies/${studyId}/versions/${versionId}/export-packages/${packageId}/files/${fileId}/download`,
      role,
    );
  },

  async reviewExportPackage(
    studyId: string,
    versionId: string,
    packageId: string,
    role: UserRole,
    reviewStatus: "approved" | "rejected",
    note: string,
  ) {
    return requestJson<{ export_package: ExportPackage; review: ExportPackageReview; reviews: ExportPackageReview[] }>(
      `/studies/${studyId}/versions/${versionId}/export-packages/${packageId}/review`,
      role,
      {
        method: "POST",
        body: {
          review_status: reviewStatus,
          note,
        },
      },
    );
  },
};
