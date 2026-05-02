import type { StudyWizardState } from "./studyWizard";
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
  round_configs: RoundConfig[];
};

export type BackendRole = "owner" | "methods_steward" | "privacy_lead" | "admin" | "participant";

export const apiBoundary: ApiBoundary = {
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:3001",
  authHeaderRole: "study_owner",
  mode: "backend-wired",
};

const backendRoles: Record<UserRole, BackendRole> = {
  study_owner: "owner",
  ethics_methods_steward: "methods_steward",
  security_privacy_lead: "privacy_lead",
  data_custodian: "privacy_lead",
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

async function requestPublicJson<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${apiBoundary.baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: { "Content-Type": "application/json" },
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
    input?: Pick<StudyWizardState, "consensusThreshold" | "agreementMinRating">,
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
    return requestJson<{ round_config: RoundConfig }>(
      `/studies/${studyId}/versions/${versionId}/rounds/${roundNumber}/close`,
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

  async getParticipantInvitation(token: string) {
    return requestPublicJson<ParticipantInvitationContext>(
      `/participant/invitations/${encodeURIComponent(token)}`,
    );
  },

  async recordInvitationConsent(token: string) {
    return requestPublicJson<{ consent_record: unknown }>(
      `/participant/invitations/${encodeURIComponent(token)}/consent`,
      { method: "POST", body: {} },
    );
  },

  async withdrawInvitationConsent(token: string) {
    return requestPublicJson<{ consent_record: unknown }>(
      `/participant/invitations/${encodeURIComponent(token)}/withdraw`,
      { method: "POST", body: {} },
    );
  },

  async submitInvitationRoundOneResponse(token: string, text: string) {
    return requestPublicJson<{ response_id: string }>(
      `/participant/invitations/${encodeURIComponent(token)}/responses`,
      { method: "POST", body: { text } },
    );
  },

  async listInvitationRoundItems(token: string, roundNumber: number) {
    return requestPublicJson<{ items: RoundItemForParticipant[] }>(
      `/participant/invitations/${encodeURIComponent(token)}/rounds/${roundNumber}/items`,
    );
  },

  async submitInvitationRating(
    token: string,
    roundNumber: number,
    itemId: string,
    rating: number,
    action: "keep" | "revise" = "revise",
  ) {
    return requestPublicJson<{ response_id: string }>(
      `/participant/invitations/${encodeURIComponent(token)}/rounds/${roundNumber}/ratings`,
      { method: "POST", body: { item_id: itemId, rating, action } },
    );
  },

  async submitRoundOneResponse(
    studyId: string,
    versionId: string,
    participantId: string,
    role: UserRole,
    text: string,
  ) {
    return requestJson<{ response_id: string }>(
      `/studies/${studyId}/versions/${versionId}/responses`,
      role,
      {
        method: "POST",
        body: {
          participant_id: participantId,
          response_json: { round_number: 1, text },
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
