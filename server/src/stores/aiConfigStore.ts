/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDatabase, withDatabaseTransaction } from "../core/database.js";
import { apiKeyLastFour, encryptApiKey, fingerprintApiKey } from "../core/aiKeyCrypto.js";

export type StudyAIFeature =
  | "clustering"
  | "item_drafting"
  | "neutrality_method_linting"
  | "reminders"
  | "irb_export_drafting"
  | "report_drafting";

export type AIFeaturePermissions = Record<StudyAIFeature, boolean>;

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
  apiKeyEncrypted: string | null;
  apiKeyLastFour: string | null;
  apiKeyFingerprintHash: string | null;
  apiKeyCreatedAt: string | null;
  apiKeyRotatedAt: string | null;
  apiKeyDeletedAt: string | null;
  featurePermissions: AIFeaturePermissions;
  disclosure: AIConfigDisclosure;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicStudyAIConfig = Omit<
  StudyAIConfig,
  "apiKeyEncrypted" | "apiKeyFingerprintHash" | "apiKeyLastFour"
> & {
  keyExists: boolean;
  maskedApiKey: string | null;
};

export type AIConfigValidation = {
  status: "ready" | "incomplete" | "no_external_ai_mode";
  errors: string[];
  warnings: string[];
};

const defaultPermissions: AIFeaturePermissions = {
  clustering: false,
  item_drafting: false,
  neutrality_method_linting: false,
  reminders: false,
  irb_export_drafting: false,
  report_drafting: false,
};

const defaultDisclosure: AIConfigDisclosure = {
  dataMayBeSentDescription: "",
  identifiersExcludedDescription: "Direct identifiers and identity-response mappings are excluded from AI payloads.",
  optOutDescription: "No External AI mode can be used when external AI processing is not permitted.",
  humanInTheLoopDescription:
    "AI Suggestion (Not Final) outputs require explicit human Accept/Edit/Reject action before they affect study content.",
};

type AIRow = {
  study_id: string;
  external_ai_enabled: number;
  no_external_ai_mode: number;
  provider_name: string | null;
  model_name: string | null;
  api_key_encrypted: string | null;
  api_key_last_four: string | null;
  api_key_fingerprint_hash: string | null;
  api_key_created_at: string | null;
  api_key_rotated_at: string | null;
  api_key_deleted_at: string | null;
  feature_permissions_json: string;
  disclosure_json: string;
  created_by_user_id: string;
  updated_by_user_id: string;
  created_at: string;
  updated_at: string;
};

function normalizePermissions(input: unknown): AIFeaturePermissions {
  const record = (input && typeof input === "object" ? input : {}) as Partial<Record<StudyAIFeature, unknown>>;
  return {
    clustering: record.clustering === true,
    item_drafting: record.item_drafting === true,
    neutrality_method_linting: record.neutrality_method_linting === true,
    reminders: record.reminders === true,
    irb_export_drafting: record.irb_export_drafting === true,
    report_drafting: record.report_drafting === true,
  };
}

function normalizeDisclosure(input: unknown): AIConfigDisclosure {
  const record = (input && typeof input === "object" ? input : {}) as Partial<Record<keyof AIConfigDisclosure, unknown>>;
  return {
    dataMayBeSentDescription:
      typeof record.dataMayBeSentDescription === "string" ? record.dataMayBeSentDescription : defaultDisclosure.dataMayBeSentDescription,
    identifiersExcludedDescription:
      typeof record.identifiersExcludedDescription === "string"
        ? record.identifiersExcludedDescription
        : defaultDisclosure.identifiersExcludedDescription,
    optOutDescription:
      typeof record.optOutDescription === "string" ? record.optOutDescription : defaultDisclosure.optOutDescription,
    humanInTheLoopDescription:
      typeof record.humanInTheLoopDescription === "string"
        ? record.humanInTheLoopDescription
        : defaultDisclosure.humanInTheLoopDescription,
  };
}

function rowToConfig(row: AIRow): StudyAIConfig {
  return {
    studyId: row.study_id,
    externalAiEnabled: row.external_ai_enabled === 1,
    noExternalAiMode: row.no_external_ai_mode === 1,
    providerName: row.provider_name,
    modelName: row.model_name,
    apiKeyEncrypted: row.api_key_encrypted,
    apiKeyLastFour: row.api_key_last_four,
    apiKeyFingerprintHash: row.api_key_fingerprint_hash,
    apiKeyCreatedAt: row.api_key_created_at,
    apiKeyRotatedAt: row.api_key_rotated_at,
    apiKeyDeletedAt: row.api_key_deleted_at,
    featurePermissions: normalizePermissions(JSON.parse(row.feature_permissions_json)),
    disclosure: normalizeDisclosure(JSON.parse(row.disclosure_json)),
    createdBy: row.created_by_user_id,
    updatedBy: row.updated_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function defaultStudyAIConfig(studyId: string, actorUserId = "system"): StudyAIConfig {
  const now = new Date().toISOString();
  return {
    studyId,
    externalAiEnabled: false,
    noExternalAiMode: true,
    providerName: null,
    modelName: null,
    apiKeyEncrypted: null,
    apiKeyLastFour: null,
    apiKeyFingerprintHash: null,
    apiKeyCreatedAt: null,
    apiKeyRotatedAt: null,
    apiKeyDeletedAt: null,
    featurePermissions: { ...defaultPermissions },
    disclosure: { ...defaultDisclosure },
    createdBy: actorUserId,
    updatedBy: actorUserId,
    createdAt: now,
    updatedAt: now,
  };
}

function persistConfig(config: StudyAIConfig): StudyAIConfig {
  getDatabase()
    .prepare(
      `INSERT INTO study_ai_configs (
        study_id, external_ai_enabled, no_external_ai_mode, provider_name, model_name,
        api_key_encrypted, api_key_last_four, api_key_fingerprint_hash, api_key_created_at,
        api_key_rotated_at, api_key_deleted_at, feature_permissions_json, disclosure_json,
        created_by_user_id, updated_by_user_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(study_id) DO UPDATE SET
        external_ai_enabled = excluded.external_ai_enabled,
        no_external_ai_mode = excluded.no_external_ai_mode,
        provider_name = excluded.provider_name,
        model_name = excluded.model_name,
        api_key_encrypted = excluded.api_key_encrypted,
        api_key_last_four = excluded.api_key_last_four,
        api_key_fingerprint_hash = excluded.api_key_fingerprint_hash,
        api_key_created_at = excluded.api_key_created_at,
        api_key_rotated_at = excluded.api_key_rotated_at,
        api_key_deleted_at = excluded.api_key_deleted_at,
        feature_permissions_json = excluded.feature_permissions_json,
        disclosure_json = excluded.disclosure_json,
        updated_by_user_id = excluded.updated_by_user_id,
        updated_at = excluded.updated_at`,
    )
    .run(
      config.studyId,
      config.externalAiEnabled ? 1 : 0,
      config.noExternalAiMode ? 1 : 0,
      config.providerName,
      config.modelName,
      config.apiKeyEncrypted,
      config.apiKeyLastFour,
      config.apiKeyFingerprintHash,
      config.apiKeyCreatedAt,
      config.apiKeyRotatedAt,
      config.apiKeyDeletedAt,
      JSON.stringify(config.featurePermissions),
      JSON.stringify(config.disclosure),
      config.createdBy,
      config.updatedBy,
      config.createdAt,
      config.updatedAt,
    );
  return config;
}

export function getStudyAIConfig(studyId: string): StudyAIConfig {
  const row = getDatabase()
    .prepare("SELECT * FROM study_ai_configs WHERE study_id = ?")
    .get(studyId) as AIRow | undefined;
  return row ? rowToConfig(row) : defaultStudyAIConfig(studyId);
}

export function toPublicAIConfig(config: StudyAIConfig): PublicStudyAIConfig {
  const { apiKeyEncrypted: _encrypted, apiKeyFingerprintHash: _fingerprint, apiKeyLastFour: lastFour, ...safe } = config;
  const keyExists = Boolean(config.apiKeyEncrypted && lastFour);
  return {
    ...safe,
    keyExists,
    maskedApiKey: keyExists ? `••••••${lastFour}` : null,
  };
}

export function updateStudyAIConfig(
  studyId: string,
  actorUserId: string,
  input: {
    externalAiEnabled?: boolean;
    noExternalAiMode?: boolean;
    providerName?: string | null;
    modelName?: string | null;
    featurePermissions?: Partial<AIFeaturePermissions>;
    disclosure?: Partial<AIConfigDisclosure>;
  },
): StudyAIConfig {
  return withDatabaseTransaction(() => {
    const current = getStudyAIConfig(studyId);
    const now = new Date().toISOString();
    const noExternalAiMode = input.noExternalAiMode ?? current.noExternalAiMode;
    const externalAiEnabled = noExternalAiMode ? false : input.externalAiEnabled ?? current.externalAiEnabled;
    return persistConfig({
      ...current,
      externalAiEnabled,
      noExternalAiMode,
      providerName:
        input.providerName === undefined ? current.providerName : input.providerName?.trim() || null,
      modelName: input.modelName === undefined ? current.modelName : input.modelName?.trim() || null,
      featurePermissions: normalizePermissions({
        ...current.featurePermissions,
        ...(input.featurePermissions ?? {}),
      }),
      disclosure: normalizeDisclosure({
        ...current.disclosure,
        ...(input.disclosure ?? {}),
      }),
      updatedBy: actorUserId,
      updatedAt: now,
    });
  });
}

export function setStudyAIConfigApiKey(studyId: string, actorUserId: string, plainTextKey: string): StudyAIConfig {
  return withDatabaseTransaction(() => {
    const current = getStudyAIConfig(studyId);
    const now = new Date().toISOString();
    return persistConfig({
      ...current,
      apiKeyEncrypted: encryptApiKey(plainTextKey),
      apiKeyLastFour: apiKeyLastFour(plainTextKey),
      apiKeyFingerprintHash: fingerprintApiKey(plainTextKey),
      apiKeyCreatedAt: current.apiKeyCreatedAt ?? now,
      apiKeyRotatedAt: current.apiKeyCreatedAt ? now : null,
      apiKeyDeletedAt: null,
      updatedBy: actorUserId,
      updatedAt: now,
    });
  });
}

export function deleteStudyAIConfigApiKey(studyId: string, actorUserId: string): StudyAIConfig {
  return withDatabaseTransaction(() => {
    const current = getStudyAIConfig(studyId);
    const now = new Date().toISOString();
    return persistConfig({
      ...current,
      apiKeyEncrypted: null,
      apiKeyLastFour: null,
      apiKeyFingerprintHash: null,
      apiKeyDeletedAt: now,
      updatedBy: actorUserId,
      updatedAt: now,
    });
  });
}

export function providerRequiresApiKey(providerName: string | null): boolean {
  if (!providerName) return true;
  return !["local", "none", "internal"].includes(providerName.trim().toLowerCase());
}

export function validateStudyAIConfig(config: StudyAIConfig): AIConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const enabledFeatures = Object.entries(config.featurePermissions)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);

  if (config.noExternalAiMode) {
    if (config.externalAiEnabled) errors.push("no_external_ai_mode_requires_external_ai_disabled");
    if (enabledFeatures.length > 0) {
      warnings.push("feature_permissions_apply_to_local_ai_only_until_external_ai_is_enabled");
    }
    return { status: "no_external_ai_mode", errors, warnings };
  }

  if (!config.externalAiEnabled) {
    if (enabledFeatures.length > 0) warnings.push("features_enabled_but_external_ai_disabled");
    return { status: errors.length ? "incomplete" : "ready", errors, warnings };
  }

  if (!config.providerName) errors.push("external_ai_enabled_but_provider_missing");
  if (!config.modelName) errors.push("external_ai_enabled_but_model_missing");
  if (providerRequiresApiKey(config.providerName) && !config.apiKeyEncrypted) {
    errors.push("external_ai_enabled_but_api_key_missing");
  }
  if (!config.disclosure.dataMayBeSentDescription.trim()) errors.push("data_may_be_sent_disclosure_missing");
  if (!config.disclosure.identifiersExcludedDescription.trim()) errors.push("identifier_exclusion_disclosure_missing");
  if (!config.disclosure.optOutDescription.trim()) errors.push("opt_out_or_no_external_ai_disclosure_missing");
  if (!config.disclosure.humanInTheLoopDescription.trim()) errors.push("human_in_the_loop_disclosure_missing");
  if (enabledFeatures.length === 0) warnings.push("no_ai_features_enabled");

  return { status: errors.length ? "incomplete" : "ready", errors, warnings };
}

export function aiConfigDisclosureForExport(studyId: string) {
  const config = getStudyAIConfig(studyId);
  return {
    external_ai_enabled: config.externalAiEnabled,
    no_external_ai_mode: config.noExternalAiMode,
    provider_name: config.providerName,
    model_name: config.modelName,
    enabled_features: Object.entries(config.featurePermissions)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature),
    data_may_be_sent: config.disclosure.dataMayBeSentDescription,
    identifiers_excluded: config.disclosure.identifiersExcludedDescription,
    opt_out_or_no_external_ai_language: config.disclosure.optOutDescription,
    human_in_the_loop_controls: config.disclosure.humanInTheLoopDescription,
    api_key_included: false,
    secret_fingerprint_included: false,
  };
}
