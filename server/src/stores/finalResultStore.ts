/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsonCollection } from "../core/jsonCollection.js";

export const FINAL_RESULT_REQUIRED_STATEMENT =
  "Consensus indicates agreement among this panel; it does not establish correctness.";

export type FinalResultSnapshotStatus = "draft" | "signed_off" | "released" | "archived";
export type FinalItemOutcome =
  | "consensus"
  | "near_consensus"
  | "descriptive_near_consensus"
  | "no_consensus"
  | "consensus_out";

export type FinalResultSnapshot = {
  snapshotId: string;
  studyId: string;
  studyVersionId: string;
  terminalRoundId: string;
  terminalRoundNumber: number;
  closedAt: string;
  status: FinalResultSnapshotStatus;
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
    dispersionMetric: "IQR" | "SD" | "MAD" | string;
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
    wordingHistory: Array<{
      roundNumber: number;
      text: string;
      changedAt?: string;
      changeReason?: string;
    }>;
    provenance: "panel_generated" | "literature_derived" | "researcher_added" | "ai_assisted";
    finalN: number;
    median: number | null;
    iqr: number | null;
    agreementPercent: number | null;
    distribution: Record<string, number>;
    outcome: FinalItemOutcome;
    roundTrend: Array<{
      roundNumber: number;
      median: number | null;
      iqr: number | null;
      agreementPercent: number | null;
    }>;
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
  methodWarnings: Array<{
    code: string;
    severity: "info" | "caution" | "blocking";
    message: string;
  }>;
  limitations: string[];
  requiredStatement: typeof FINAL_RESULT_REQUIRED_STATEMENT;
  provenanceHash: string;
  exportHash: string;
  createdAt: string;
  createdByUserId: string;
};

const snapshots = new JsonCollection<FinalResultSnapshot>("final_result_snapshots");

function snapshotKey(input: Pick<FinalResultSnapshot, "studyId" | "studyVersionId">): string {
  return `${input.studyId}:${input.studyVersionId}`;
}

export function getFinalResultSnapshot(studyId: string, studyVersionId: string): FinalResultSnapshot | null {
  return snapshots.get(`${studyId}:${studyVersionId}`);
}

export function saveFinalResultSnapshot(snapshot: FinalResultSnapshot): FinalResultSnapshot {
  return snapshots.set(snapshotKey(snapshot), snapshot);
}

export function updateFinalResultSnapshot(
  studyId: string,
  studyVersionId: string,
  update: (current: FinalResultSnapshot) => FinalResultSnapshot,
): FinalResultSnapshot | null {
  return snapshots.update(`${studyId}:${studyVersionId}`, update);
}
