/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { OutputModelDefinition } from "../core/types";

export const outputModelRegistry: OutputModelDefinition[] = [
  {
    id: "final-delphi-report",
    label: "Final Delphi Report",
    requiredRoles: ["study_owner", "ethics_methods_steward", "data_custodian"],
    requiredSignoffs: ["study_owner", "ethics_methods_steward"],
    sections: [
      "Locked method configuration",
      "Response rates and attrition",
      "Consensus items",
      "Near-consensus items",
      "Non-consensus items",
      "Methodological limitations",
    ],
    redactionRules: ["No direct identifiers", "No identity-response mapping", "Aggregate feedback only"],
    auditAction: "report.export",
  },
  {
    id: "irb-pack",
    label: "IRB Pack",
    requiredRoles: ["study_owner", "ethics_methods_steward"],
    requiredSignoffs: ["study_owner", "ethics_methods_steward"],
    sections: ["Protocol draft", "Consent draft", "Recruitment language", "AI disclosure"],
    redactionRules: ["Draft label until released", "Human signoff required for official use"],
    auditAction: "ai.suggestion.export_irb_pack",
  },
  {
    id: "anonymized-response-dataset",
    label: "Anonymized Response Dataset",
    requiredRoles: ["data_custodian", "security_privacy_lead"],
    requiredSignoffs: ["security_privacy_lead", "data_custodian"],
    sections: ["Response records", "Round metadata", "Redaction manifest"],
    redactionRules: ["No names", "No emails", "No browser identifiers", "Participant IDs pseudonymized"],
    auditAction: "dataset.export",
  },
  {
    id: "audit-package",
    label: "Audit Package",
    requiredRoles: ["security_privacy_lead", "data_custodian"],
    requiredSignoffs: ["security_privacy_lead"],
    sections: ["Sensitive actions", "Signoffs", "AI operations", "Exports", "Identity access"],
    redactionRules: ["Minimize user identifiers in shared packages"],
    auditAction: "audit_package.export",
  },
  {
    id: "provenance-bundle",
    label: "Provenance Bundle",
    requiredRoles: ["study_owner", "ethics_methods_steward", "data_custodian"],
    requiredSignoffs: ["study_owner", "ethics_methods_steward"],
    sections: ["Source response links", "Cluster history", "AI suggestion hashes", "Human edits"],
    redactionRules: ["Anonymized excerpts only", "No identity-response mapping"],
    auditAction: "provenance_bundle.export",
  },
  {
    id: "complete-archive",
    label: "Complete Locked Archive",
    requiredRoles: ["data_custodian", "security_privacy_lead"],
    requiredSignoffs: ["security_privacy_lead", "data_custodian"],
    sections: ["Study version", "Anonymized dataset", "Items and provenance", "Audit summary", "Limitations"],
    redactionRules: ["No identity-response mapping", "Participant identity excluded unless separately authorized"],
    auditAction: "complete_archive.export",
  },
];
