/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ModuleDefinition } from "../core/types";

const staffRoles = [
  "study_owner",
  "ethics_methods_steward",
  "security_privacy_lead",
  "data_custodian",
  "open_source_admin",
  "study_coordinator",
] as const;

export const moduleRegistry: ModuleDefinition[] = [
  {
    id: "about",
    label: "About",
    purpose: "Plain-language platform orientation, ethical commitments, AI boundaries, and participant protections.",
    allowedRoles: [...staffRoles, "panelist"],
    maturity: "wired",
  },
  {
    id: "architecture",
    label: "Architecture",
    purpose: "Extension points for modules, study methods, output models, policies, and API boundaries.",
    allowedRoles: [...staffRoles],
    maturity: "wired",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    purpose: "Study status, blockers, response rates, deadlines, governance warnings, and security alerts.",
    allowedRoles: [...staffRoles],
    maturity: "wired",
  },
  {
    id: "study-builder",
    label: "Study Builder",
    purpose: "Purpose, Delphi suitability, panel criteria, consent, rounds, timelines, AI settings, and retention.",
    allowedRoles: ["study_owner", "ethics_methods_steward", "study_coordinator"],
    maturity: "scaffold",
  },
  {
    id: "governance",
    label: "Governance",
    purpose: "Launch checklist, locked rules, consent language, AI settings, and dual signoff.",
    allowedRoles: ["study_owner", "ethics_methods_steward", "security_privacy_lead"],
    maturity: "wired",
  },
  {
    id: "round-manager",
    label: "Rounds",
    purpose: "Round state, deadlines, response rates, attrition, neutral reminders, and workload.",
    allowedRoles: ["study_owner", "ethics_methods_steward", "study_coordinator"],
    maturity: "wired",
  },
  {
    id: "curation",
    label: "Curation",
    purpose: "Raw anonymized responses, clusters, candidate items, provenance, merge/split, and audit trail.",
    allowedRoles: ["study_owner", "ethics_methods_steward", "study_coordinator"],
    maturity: "wired",
  },
  {
    id: "feedback",
    label: "Feedback",
    purpose: "Median, IQR, distributions, prior response, neutral explanatory text, and anti-coercion checks.",
    allowedRoles: ["study_owner", "ethics_methods_steward", "study_coordinator", "panelist"],
    maturity: "wired",
  },
  {
    id: "participant",
    label: "Participant Portal",
    purpose: "Consent, study explanation, confidentiality, withdrawal rights, tasks, retain, and revise.",
    allowedRoles: ["panelist", "study_owner", "ethics_methods_steward"],
    maturity: "wired",
  },
  {
    id: "closeout",
    label: "Closeout",
    purpose: "Canonical final results, preserved perspectives, release signoff, participant summary, and archive.",
    allowedRoles: ["study_owner", "ethics_methods_steward", "data_custodian", "panelist"],
    maturity: "wired",
  },
  {
    id: "glossary",
    label: "Glossary",
    purpose: "Plain-language Delphi, governance, AI, consent, reporting, and statistics terms.",
    allowedRoles: [...staffRoles, "panelist"],
    maturity: "wired",
  },
  {
    id: "reporting",
    label: "Reporting",
    purpose: "Consensus, near-consensus, non-consensus, attrition, limitations, exports, and downstream review.",
    allowedRoles: ["study_owner", "ethics_methods_steward", "data_custodian"],
    maturity: "wired",
  },
  {
    id: "audit",
    label: "Audit Log",
    purpose: "Event-style immutable display for signoff, exports, identity access, AI operations, and item changes.",
    allowedRoles: ["study_owner", "ethics_methods_steward", "security_privacy_lead", "data_custodian"],
    maturity: "scaffold",
  },
  {
    id: "admin-security",
    label: "Admin / Security",
    purpose: "Role management, AI connectors, retention, export permissions, and security policy status.",
    allowedRoles: ["study_owner", "ethics_methods_steward", "security_privacy_lead", "open_source_admin", "data_custodian"],
    maturity: "future",
  },
];
