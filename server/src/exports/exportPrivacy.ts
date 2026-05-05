/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ExportDataClassification,
  ExportFormat,
  ExportPackage,
  ExportPackageFile,
  ExportPackageType,
  ExportPrivacyMetadata,
} from "../stores/exportManifestStore.js";

type PrivacyFileInput = {
  path: string;
  content: string | Buffer;
  format?: ExportFormat;
  record_count?: number | null;
  contains_identifiable_data?: boolean;
  redaction_profile?: Record<string, unknown>;
};

export type PrivacyScanFinding = {
  severity: "failure" | "warning";
  package_type: ExportPackageType;
  file_path: string;
  pattern_class: string;
  context: string;
};

export type PrivacyScanResult = {
  ok: boolean;
  package_type: ExportPackageType;
  data_classification: ExportDataClassification;
  checked_file_count: number;
  failures: PrivacyScanFinding[];
  warnings: PrivacyScanFinding[];
};

const TEST_PARTICIPANT_LABEL_RE = /\bSYN-P00[1-8]\b/g;
const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g;
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

const DIRECT_ID_FIELD_RE =
  /(^|[\s,{"])("?)(participant_id|user_id|account_id|invitation_id|identity_table_id|identity_response_mapping|participant_name|email|phone)\2\s*:/im;
const DIRECT_ID_CSV_HEADER_RE =
  /(^|,)(participant_id|user_id|account_id|invitation_id|identity_table_id|identity_response_mapping|participant_name|email|phone)(,|$)/im;

export function privacyMetadataForExportType(
  exportType: ExportPackageType,
  generatedTimestamp = new Date().toISOString(),
): ExportPrivacyMetadata {
  if (exportType === "audit-package") {
    return {
      export_name: "Audit Package",
      export_audience: "Authorized internal audit, compliance, governance, and security/privacy reviewers only.",
      data_classification: "restricted_internal_admin_audit",
      direct_identifiers_included: true,
      participant_response_mapping_included: true,
      restricted_internal_only: true,
      safe_for_deidentified_research_report_sharing: false,
      ai_prompts_included: false,
      ai_inputs_included: false,
      ai_outputs_included: false,
      ai_provenance_records_included: false,
      support_issue_note_content_included: false,
      audit_log_content_included: true,
      generated_timestamp: generatedTimestamp,
      study_export_identifier: null,
      applicable_privacy_notes: [
        "RESTRICTED INTERNAL / ADMIN ONLY.",
        "Audit trails may include raw internal IDs needed for governance traceability.",
        "Do not treat this package as a de-identified research/report export.",
      ],
    };
  }

  if (exportType === "complete-archive") {
    return {
      export_name: "Complete Restricted Archive",
      export_audience: "Controlled internal preservation, backup/restore rehearsal, formal governance review, or incident investigation only.",
      data_classification: "complete_restricted_archive",
      direct_identifiers_included: true,
      participant_response_mapping_included: true,
      restricted_internal_only: true,
      safe_for_deidentified_research_report_sharing: false,
      ai_prompts_included: false,
      ai_inputs_included: false,
      ai_outputs_included: false,
      ai_provenance_records_included: true,
      support_issue_note_content_included: false,
      audit_log_content_included: true,
      generated_timestamp: generatedTimestamp,
      study_export_identifier: null,
      applicable_privacy_notes: [
        "COMPLETE RESTRICTED ARCHIVE.",
        "May include restricted linkage material needed for internal preservation or audit reconstruction.",
        "Do not treat this package as a de-identified research/report export.",
      ],
    };
  }

  const names: Record<ExportPackageType, string> = {
    "final-delphi-report": "Final Delphi Report",
    "irb-pack": "IRB / Ethics Pack",
    "anonymized-response-dataset": "Anonymized Response Dataset",
    "audit-package": "Audit Package",
    "provenance-bundle": "Provenance Bundle",
    "complete-archive": "Complete Restricted Archive",
  };

  return {
    export_name: names[exportType],
    export_audience: "De-identified research/report, mock-trial review, methodological review, and general study reporting.",
    data_classification: "deidentified_research_report",
    direct_identifiers_included: false,
    participant_response_mapping_included: false,
    restricted_internal_only: false,
    safe_for_deidentified_research_report_sharing: true,
    ai_prompts_included: false,
    ai_inputs_included: false,
    ai_outputs_included: false,
    ai_provenance_records_included: exportType === "provenance-bundle",
    support_issue_note_content_included: false,
    audit_log_content_included: false,
    generated_timestamp: generatedTimestamp,
    study_export_identifier: null,
    applicable_privacy_notes: [
      "Direct identifiers and identity-response mappings are excluded.",
      "Participant-authored free text is scanned and redacted for obvious direct identifiers.",
      "Consensus indicates agreement among this panel; it does not establish correctness.",
    ],
  };
}

export function redactExportText(input: string): string {
  return input
    .replace(TEST_PARTICIPANT_LABEL_RE, "[REDACTED_PARTICIPANT_LABEL]")
    .replace(EMAIL_RE, "[REDACTED_EMAIL]")
    .replace(PHONE_RE, "[REDACTED_PHONE]")
    .replace(UUID_RE, "[REDACTED_ID]");
}

export function redactExportValue<T>(value: T): T {
  if (typeof value === "string") return redactExportText(value) as T;
  if (Array.isArray(value)) return value.map((entry) => redactExportValue(entry)) as T;
  if (!value || typeof value !== "object") return value;

  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (/^(participant_id|user_id|account_id|invitation_id|identity_table_id|created_by|created_by_user_id|updated_by_user_id|reviewed_by_user_id|responded_by_user_id)$/i.test(key)) {
      out[key] = typeof entry === "string" && entry.trim() ? "[REDACTED_ID]" : redactExportValue(entry);
    } else if (/^(participant_name|email|phone|contact)$/i.test(key)) {
      out[key] = typeof entry === "string" && entry.trim() ? "[REDACTED_DIRECT_IDENTIFIER]" : redactExportValue(entry);
    } else {
      out[key] = redactExportValue(entry);
    }
  }
  return out as T;
}

export function redactExportFileContent(
  file: PrivacyFileInput,
  metadata: ExportPrivacyMetadata,
): PrivacyFileInput {
  if (metadata.data_classification !== "deidentified_research_report") {
    return file;
  }

  if (Buffer.isBuffer(file.content)) {
    return file;
  }

  return {
    ...file,
    content: redactExportText(file.content),
    contains_identifiable_data: false,
    redaction_profile: {
      ...(file.redaction_profile ?? {}),
      free_text_direct_identifier_redaction: "obvious direct identifiers redacted in export output",
    },
  };
}

export function textForPrivacyScan(file: ExportPackageFile): string {
  if (file.content_encoding === "base64") {
    return Buffer.from(file.content_text, "base64").toString("utf8");
  }
  return file.content_text;
}

function packageClassification(pkg: ExportPackage): ExportDataClassification {
  return pkg.privacy_metadata?.data_classification ?? privacyMetadataForExportType(pkg.export_type).data_classification;
}

function restrictedPackageIsClearlyLabeled(pkg: ExportPackage): boolean {
  const metadata = pkg.privacy_metadata;
  if (!metadata) return false;
  return (
    metadata.restricted_internal_only === true &&
    metadata.safe_for_deidentified_research_report_sharing === false &&
    metadata.applicable_privacy_notes.some((note) => /RESTRICTED|ARCHIVE|ADMIN/i.test(note))
  );
}

function pushFindings(
  findings: PrivacyScanFinding[],
  severity: "failure" | "warning",
  pkg: ExportPackage,
  filePath: string,
  patternClass: string,
  context: string,
) {
  findings.push({
    severity,
    package_type: pkg.export_type,
    file_path: filePath,
    pattern_class: patternClass,
    context,
  });
}

export function scanExportPrivacy(input: {
  exportPackage: ExportPackage;
  files: ExportPackageFile[];
  knownParticipantIds?: string[];
  knownSyntheticLabels?: string[];
  knownEmailIdentifiers?: string[];
}): PrivacyScanResult {
  const classification = packageClassification(input.exportPackage);
  const deidentified = classification === "deidentified_research_report";
  const restrictedClearlyLabeled = restrictedPackageIsClearlyLabeled(input.exportPackage);
  const failures: PrivacyScanFinding[] = [];
  const warnings: PrivacyScanFinding[] = [];

  const knownParticipantIds = input.knownParticipantIds ?? [];
  const knownSyntheticLabels = input.knownSyntheticLabels ?? [];
  const knownEmailIdentifiers = input.knownEmailIdentifiers ?? [];

  for (const file of input.files) {
    const text = textForPrivacyScan(file);
    const found: Array<{ patternClass: string; context: string }> = [];

    for (const label of knownSyntheticLabels) {
      if (label && text.includes(label)) found.push({ patternClass: "synthetic_participant_label", context: label });
    }
    if (TEST_PARTICIPANT_LABEL_RE.test(text)) {
      found.push({ patternClass: "synthetic_participant_label", context: "SYN-P00X" });
    }
    TEST_PARTICIPANT_LABEL_RE.lastIndex = 0;

    for (const participantId of knownParticipantIds) {
      if (participantId && text.includes(participantId)) found.push({ patternClass: "raw_participant_id", context: "[known participant id]" });
    }

    for (const email of knownEmailIdentifiers) {
      if (email && text.includes(email)) found.push({ patternClass: "email_identifier", context: "[known email]" });
    }
    if (EMAIL_RE.test(text)) found.push({ patternClass: "email_like_string", context: "[email-like string]" });
    EMAIL_RE.lastIndex = 0;

    if (PHONE_RE.test(text)) found.push({ patternClass: "phone_like_string", context: "[phone-like string]" });
    PHONE_RE.lastIndex = 0;

    if (deidentified && DIRECT_ID_FIELD_RE.test(text)) {
      found.push({ patternClass: "direct_identity_field", context: "[direct identity field key]" });
    }
    if (deidentified && DIRECT_ID_CSV_HEADER_RE.test(text)) {
      found.push({ patternClass: "direct_identity_field", context: "[direct identity field header]" });
    }

    for (const finding of found) {
      if (deidentified || !restrictedClearlyLabeled) {
        pushFindings(failures, "failure", input.exportPackage, file.path, finding.patternClass, finding.context);
      } else {
        pushFindings(warnings, "warning", input.exportPackage, file.path, finding.patternClass, finding.context);
      }
    }
  }

  return {
    ok: failures.length === 0,
    package_type: input.exportPackage.export_type,
    data_classification: classification,
    checked_file_count: input.files.length,
    failures,
    warnings,
  };
}
