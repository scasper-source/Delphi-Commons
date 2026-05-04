/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole =
  | "study_owner"
  | "ethics_methods_steward"
  | "security_privacy_lead"
  | "data_custodian"
  | "open_source_admin"
  | "study_coordinator"
  | "panelist";

export type ModuleId =
  | "about"
  | "architecture"
  | "dashboard"
  | "study-builder"
  | "governance"
  | "round-manager"
  | "curation"
  | "feedback"
  | "participant"
  | "closeout"
  | "glossary"
  | "reporting"
  | "audit"
  | "admin-security";

export type StudyMethodId =
  | "modified-delphi"
  | "classic-delphi"
  | "policy-delphi"
  | "real-time-delphi";

export type OutputModelId =
  | "final-delphi-report"
  | "irb-pack"
  | "anonymized-response-dataset"
  | "audit-package"
  | "provenance-bundle"
  | "complete-archive";

export type StudyStatus =
  | "Draft"
  | "ReadyForSignoff"
  | "Active"
  | "Closed"
  | "Archived";

export type SignoffStatus = "NotStarted" | "Pending" | "Signed" | "Blocked";
export type AISuggestionStatus = "None" | "Accepted" | "Edited" | "Rejected";
export type RiskLevel = "info" | "warning" | "danger" | "locked" | "success";

export type Actor = {
  id: string;
  name: string;
  role: UserRole;
};

export type SignoffGate = {
  id: string;
  label: string;
  requiredRole: UserRole;
  status: SignoffStatus;
  signedBy?: string;
  signedAt?: string;
};

export type ConsensusRule = {
  type: "percent_agreement";
  threshold: number;
  agreementMinRating: number;
  source?: "pi_defined" | "governance_team_defined" | "panel_informed_pre_round" | "stakeholder_informed_pre_round" | "protocol_irb_defined";
  settingProcess?: string;
  locked: boolean;
  lockedAt?: string;
};

export type GovernanceChecklistItem = {
  id: string;
  label: string;
  detail: string;
  complete: boolean;
  risk: RiskLevel;
};

export type RoundState = {
  roundNumber: number;
  label: string;
  mode: "open-ended" | "rating" | "reporting";
  status: "NotOpen" | "Open" | "ReadyForReview" | "Closed";
  responseRate: number;
  attritionRate: number;
  deadline: string;
  blocker?: string;
};

export type ProvenanceLink = {
  sourceType: "response" | "item" | "ai_suggestion" | "human_edit";
  sourceId: string;
  excerpt: string;
  roundNumber: number;
};

export type CandidateItem = {
  id: string;
  text: string;
  status: "Draft" | "Accepted" | "Edited" | "Rejected" | "Published";
  aiSuggestionId?: string;
  requiresHumanRationale: boolean;
  provenance: ProvenanceLink[];
  preservesMinorityView: boolean;
};

export type AISuggestion = {
  id: string;
  label: "AI Suggestion (Not Final)";
  feature:
    | "inter_round_synthesis"
    | "lint_wording"
    | "irb_pack"
    | "controlled_feedback"
    | "operational_assistance";
  status: AISuggestionStatus;
  humanDecisionRequired: boolean;
  ownerSigned: boolean;
  stewardSigned: boolean;
  outputHash: string;
};

export type ReportItem = {
  id: string;
  text: string;
  consensusClass: "consensus" | "near_consensus" | "non_consensus";
  median: number;
  iqr: number;
  responseCount: number;
};

export type ReportModel = {
  id: string;
  title: string;
  thresholdUsed: number;
  limitations: string[];
  attritionRate: number;
  includesNonConsensus: boolean;
  items: ReportItem[];
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  actorRole: UserRole;
  action: string;
  object: string;
  risk: RiskLevel;
};

export type StudyRecord = {
  id: string;
  title: string;
  status: StudyStatus;
  methodId: StudyMethodId;
  owner: string;
  coordinator: string;
  consensusRule: ConsensusRule;
  checklist: GovernanceChecklistItem[];
  signoffs: SignoffGate[];
  rounds: RoundState[];
  candidates: CandidateItem[];
  aiSuggestions: AISuggestion[];
  report: ReportModel;
  auditEvents: AuditEvent[];
  responseRate: number;
  securityAlerts: string[];
};

export type ModuleDefinition = {
  id: ModuleId;
  label: string;
  purpose: string;
  allowedRoles: UserRole[];
  maturity: "scaffold" | "wired" | "future";
};

export type MethodDefinition = {
  id: StudyMethodId;
  label: string;
  status: "available" | "planned";
  roundPlan: string;
  requiredSetupFields: string[];
  feedbackRules: string[];
  reportingRequirements: string[];
  launchBlockers: string[];
};

export type OutputModelDefinition = {
  id: OutputModelId;
  label: string;
  requiredRoles: UserRole[];
  requiredSignoffs: UserRole[];
  sections: string[];
  redactionRules: string[];
  auditAction: string;
};
