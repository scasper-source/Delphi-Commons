/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AISuggestion, ReportModel, StudyRecord, StudyStatus, UserRole } from "../core/types";
import { canAccessIdentityMap } from "../core/permissions";

export const forbiddenParticipantTerms = [
  "truth",
  "correct answer",
  "outlier",
  "deviant",
  "noncompliant participant",
  "move toward the group",
  "optimize consensus",
  "persuade",
  "fix disagreement",
] as const;

export function containsForbiddenParticipantLanguage(text: string): boolean {
  const normalized = text.toLowerCase();
  return forbiddenParticipantTerms.some((term) => normalized.includes(term));
}

export function canEditConsensusRule(status: StudyStatus): boolean {
  return status === "Draft";
}

export function canPublishAISuggestion(suggestion: AISuggestion): boolean {
  const humanDecisionMade = suggestion.status === "Accepted" || suggestion.status === "Edited";
  return humanDecisionMade && suggestion.ownerSigned && suggestion.stewardSigned;
}

export function reportIncludesNonConsensus(report: ReportModel): boolean {
  return report.includesNonConsensus && report.items.some((item) => item.consensusClass === "non_consensus");
}

export function evaluateLaunchGate(study: StudyRecord): string[] {
  const blockers = study.checklist
    .filter((item) => !item.complete)
    .map((item) => item.label);

  const ownerSigned = study.signoffs.some(
    (signoff) => signoff.requiredRole === "study_owner" && signoff.status === "Signed"
  );
  const stewardSigned = study.signoffs.some(
    (signoff) => signoff.requiredRole === "ethics_methods_steward" && signoff.status === "Signed"
  );

  if (!ownerSigned) blockers.push("Study Owner signoff");
  if (!stewardSigned) blockers.push("Ethics & Methods Steward signoff");
  if (!study.consensusRule.locked) blockers.push("Consensus threshold locked before launch");
  if (!reportIncludesNonConsensus(study.report)) blockers.push("Reporting model includes non-consensus items");

  return blockers;
}

export function identityAccessDecision(role: UserRole, purpose: string): "allowed" | "blocked" {
  if (!canAccessIdentityMap(role)) return "blocked";
  return purpose.trim().length > 12 ? "allowed" : "blocked";
}
