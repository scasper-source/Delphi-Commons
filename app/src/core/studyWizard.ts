/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

export type StudyFormat = "ModifiedDelphi" | "ClassicDelphi";

export type ConsensusRuleSource =
  | "pi_defined"
  | "governance_team_defined"
  | "panel_informed_pre_round"
  | "stakeholder_informed_pre_round"
  | "protocol_irb_defined";

export type PreRoundConsensusInputStatus =
  | "not_required"
  | "planned"
  | "collected"
  | "reviewed"
  | "finalized";

export type StudyWizardStepId =
  | "purpose"
  | "method"
  | "panel"
  | "consent"
  | "rounds"
  | "feedback"
  | "ai"
  | "retention"
  | "review";

export type StudyWizardState = {
  title: string;
  description: string;
  researchQuestion: string;
  objective: string;
  delphiSuitability: string;
  studyFormat: StudyFormat;
  modifiedDesignRationale: string;
  roundOneMode: "open-ended" | "structured";
  modifiedDesignAcknowledged: boolean;
  panelCriteria: string;
  recruitmentPlan: string;
  targetPanelSize: number;
  consentVersion: string;
  consentSummary: string;
  confidentialityStatement: string;
  withdrawalProcess: string;
  plannedRoundCount: number;
  terminalRoundNumber: number;
  consensusThreshold: number;
  agreementMinRating: number;
  consensusRuleSource: ConsensusRuleSource;
  consensusRuleProcess: string;
  preRoundConsensusInputEnabled: boolean;
  preRoundConsensusInputStatus: PreRoundConsensusInputStatus;
  preRoundConsensusPrompt: string;
  preRoundConsensusSummary: string;
  feedbackMedian: boolean;
  feedbackIqr: boolean;
  feedbackDistribution: boolean;
  feedbackPriorResponse: boolean;
  neutralFeedbackLanguage: string;
  aiEnabled: boolean;
  aiDisclosure: string;
  aiHumanApprovalRequired: boolean;
  retentionSchedule: string;
  exportReviewRole: "Data Custodian" | "Security & Privacy Lead";
  dataSeparationConfirmed: boolean;
};

export type WizardStepDefinition = {
  id: StudyWizardStepId;
  label: string;
  description: string;
};

export const wizardSteps: WizardStepDefinition[] = [
  {
    id: "purpose",
    label: "Purpose",
    description: "Study title, research question, and Delphi fit.",
  },
  {
    id: "method",
    label: "Method",
    description: "Classic or modified Delphi design and bias warning.",
  },
  {
    id: "panel",
    label: "Panel",
    description: "Panel criteria, recruitment, and expected size.",
  },
  {
    id: "consent",
    label: "Consent",
    description: "Consent, confidentiality, and withdrawal rights.",
  },
  {
    id: "rounds",
    label: "Rounds",
    description: "Round plan and predefined consensus threshold.",
  },
  {
    id: "feedback",
    label: "Feedback",
    description: "Controlled feedback content and neutral language.",
  },
  {
    id: "ai",
    label: "AI",
    description: "Optional AI assistance, disclosure, and human approval.",
  },
  {
    id: "retention",
    label: "Retention",
    description: "Retention schedule, exports, and identity separation.",
  },
  {
    id: "review",
    label: "Review",
    description: "Governance-ready summary and backend save path.",
  },
];

export const defaultWizardState: StudyWizardState = {
  title: "Care Transitions Expert Delphi",
  description: "A Delphi study of expert views on safe care transitions.",
  researchQuestion: "Which care transition practices should be prioritized by this expert panel?",
  objective: "Identify areas of panel agreement, near agreement, and non-consensus while preserving uncertainty and dissent.",
  delphiSuitability:
    "The question requires structured expert judgment where evidence is incomplete and uncertainty should be made visible.",
  studyFormat: "ModifiedDelphi",
  modifiedDesignRationale:
    "The study starts with open-ended elicitation and uses structured rating in later rounds to reduce participant burden.",
  roundOneMode: "open-ended",
  modifiedDesignAcknowledged: true,
  panelCriteria: "Clinicians, coordinators, and method experts with direct experience in care transitions.",
  recruitmentPlan: "Purposeful recruitment through professional networks with eligibility confirmation before invitation.",
  targetPanelSize: 18,
  consentVersion: "Consent v1.0",
  consentSummary:
    "Participants will receive the study purpose, time commitment, voluntary participation language, and withdrawal rights before Round 1.",
  confidentialityStatement:
    "Responses are confidential to the research team and linked across rounds through participant IDs.",
  withdrawalProcess:
    "Participants may withdraw from future participation, and withdrawal/deletion requests are reviewed by the research team under the retention policy.",
  plannedRoundCount: 3,
  terminalRoundNumber: 3,
  consensusThreshold: 80,
  agreementMinRating: 7,
  consensusRuleSource: "pi_defined",
  consensusRuleProcess:
    "The Study Owner defines the consensus threshold before Round 1, documents the rationale, and submits it for governance signoff.",
  preRoundConsensusInputEnabled: false,
  preRoundConsensusInputStatus: "not_required",
  preRoundConsensusPrompt:
    "Before Round 1, please review the proposed consensus threshold and share any concerns about whether it is appropriate for this study.",
  preRoundConsensusSummary: "",
  feedbackMedian: true,
  feedbackIqr: true,
  feedbackDistribution: true,
  feedbackPriorResponse: true,
  neutralFeedbackLanguage:
    "Review the group summary, median, IQR, distribution, and your prior response. You may retain response or revise response.",
  aiEnabled: true,
  aiDisclosure:
    "AI may draft or organize research-team materials only. AI Suggestion (Not Final) outputs require explicit human Accept/Edit/Reject action.",
  aiHumanApprovalRequired: true,
  retentionSchedule: "Retain study records for 6 years after publication or final report, then review for deletion or archival preservation.",
  exportReviewRole: "Data Custodian",
  dataSeparationConfirmed: true,
};

const forbiddenParticipantTerms = [
  "truth",
  "correct answer",
  "outlier",
  "deviant",
  "noncompliant participant",
  "move toward the group",
  "optimize consensus",
  "persuade",
  "fix disagreement",
];

export function expectedRoundPlan(studyFormat: StudyFormat): {
  plannedRoundCount: number;
  terminalRoundNumber: number;
} {
  if (studyFormat === "ModifiedDelphi") {
    return { plannedRoundCount: 3, terminalRoundNumber: 3 };
  }

  return { plannedRoundCount: 4, terminalRoundNumber: 4 };
}

export function normalizeWizardForMethod(state: StudyWizardState): StudyWizardState {
  const plan = expectedRoundPlan(state.studyFormat);
  const preRoundConsensusInputEnabled = consensusSourceRequiresPreRoundInput(state.consensusRuleSource);

  return {
    ...state,
    plannedRoundCount: plan.plannedRoundCount,
    terminalRoundNumber: plan.terminalRoundNumber,
    preRoundConsensusInputEnabled,
    preRoundConsensusInputStatus: preRoundConsensusInputEnabled
      ? state.preRoundConsensusInputStatus === "not_required"
        ? "planned"
        : state.preRoundConsensusInputStatus
      : "not_required",
  };
}

export const consensusRuleSourceLabels: Record<ConsensusRuleSource, string> = {
  pi_defined: "PI-defined",
  governance_team_defined: "Governance team-defined",
  panel_informed_pre_round: "Panel-informed pre-round",
  stakeholder_informed_pre_round: "Stakeholder-informed pre-round",
  protocol_irb_defined: "Protocol / IRB-defined",
};

export const preRoundConsensusStatusLabels: Record<PreRoundConsensusInputStatus, string> = {
  not_required: "Not required",
  planned: "Planned",
  collected: "Collected",
  reviewed: "Reviewed",
  finalized: "Finalized",
};

export function consensusSourceRequiresPreRoundInput(source: ConsensusRuleSource): boolean {
  return source === "panel_informed_pre_round" || source === "stakeholder_informed_pre_round";
}

export function isAllowedConsensusThreshold(value: number): boolean {
  return [60, 70, 80, 90].includes(value);
}

export function containsForbiddenWizardLanguage(text: string): boolean {
  const normalized = text.toLowerCase();
  return forbiddenParticipantTerms.some((term) => normalized.includes(term));
}

export function validateWizardStep(step: StudyWizardStepId, state: StudyWizardState): string[] {
  const blockers: string[] = [];

  if (step === "purpose") {
    if (!state.title.trim()) blockers.push("Study title is required.");
    if (!state.researchQuestion.trim()) blockers.push("Research question is required.");
    if (!state.objective.trim()) blockers.push("Study objective is required.");
    if (!state.delphiSuitability.trim()) blockers.push("Document why Delphi is suitable for this question.");
  }

  if (step === "method") {
    if (!state.modifiedDesignRationale.trim()) blockers.push("Method rationale is required before governance review.");
    if (state.roundOneMode !== "open-ended" && !state.modifiedDesignAcknowledged) {
      blockers.push("Structured Round 1 requires an explicit modified Delphi bias warning acknowledgement.");
    }
  }

  if (step === "panel") {
    if (!state.panelCriteria.trim()) blockers.push("Panel inclusion criteria are required.");
    if (!state.recruitmentPlan.trim()) blockers.push("Recruitment plan is required.");
    if (state.targetPanelSize < 3) blockers.push("Target panel size should be at least 3.");
  }

  if (step === "consent") {
    if (!state.consentVersion.trim()) blockers.push("Consent version is required.");
    if (!state.consentSummary.trim()) blockers.push("Consent summary is required.");
    if (!state.confidentialityStatement.toLowerCase().includes("confidential")) {
      blockers.push("Confidentiality language must explain confidentiality to the research team.");
    }
    if (!state.confidentialityStatement.toLowerCase().includes("participant id")) {
      blockers.push("Confidentiality language must explain participant ID linkage across rounds.");
    }
    if (!state.withdrawalProcess.trim()) blockers.push("Withdrawal process is required.");
  }

  if (step === "rounds") {
    if (state.plannedRoundCount < 2) blockers.push("At least two rounds are required for this setup.");
    if (state.terminalRoundNumber !== state.plannedRoundCount) {
      blockers.push("Terminal round should match the planned round count.");
    }
    if (!isAllowedConsensusThreshold(state.consensusThreshold)) {
      blockers.push("Consensus threshold must be 60%, 70%, 80%, or 90%.");
    }
    if (state.agreementMinRating < 1 || state.agreementMinRating > 9) {
      blockers.push("Agreement minimum rating must be between 1 and 9.");
    }
    if (!state.consensusRuleProcess.trim()) {
      blockers.push("Document how the consensus rule will be set before Round 1.");
    }
    if (consensusSourceRequiresPreRoundInput(state.consensusRuleSource)) {
      if (!state.preRoundConsensusPrompt.trim()) {
        blockers.push("Pre-round consensus input needs a neutral prompt.");
      }
      if (!["reviewed", "finalized"].includes(state.preRoundConsensusInputStatus)) {
        blockers.push("Panel- or stakeholder-informed consensus input must be reviewed or finalized before governance signoff.");
      }
      if (!state.preRoundConsensusSummary.trim()) {
        blockers.push("Summarize how pre-round input was considered before governance signoff.");
      }
    }
  }

  if (step === "feedback") {
    if (!state.feedbackMedian || !state.feedbackIqr || !state.feedbackDistribution) {
      blockers.push("Median, IQR/dispersion, and distribution should be available for controlled feedback.");
    }
    if (!state.feedbackPriorResponse) blockers.push("Your prior response should be available where appropriate.");
    if (!state.neutralFeedbackLanguage.trim()) blockers.push("Neutral participant feedback language is required.");
    if (containsForbiddenWizardLanguage(state.neutralFeedbackLanguage)) {
      blockers.push("Participant feedback contains coercive or forbidden language.");
    }
  }

  if (step === "ai") {
    if (state.aiEnabled && !state.aiDisclosure.trim()) blockers.push("AI disclosure is required when AI is enabled.");
    if (state.aiEnabled && !state.aiHumanApprovalRequired) {
      blockers.push("AI outputs must require human Accept/Edit/Reject before participant-facing use.");
    }
  }

  if (step === "retention") {
    if (!state.retentionSchedule.trim()) blockers.push("Retention schedule is required.");
    if (!state.dataSeparationConfirmed) blockers.push("Identity-response separation must be confirmed.");
  }

  if (step === "review") {
    return wizardSteps
      .filter((candidate) => candidate.id !== "review")
      .flatMap((candidate) => validateWizardStep(candidate.id, state));
  }

  return blockers;
}

export function completedWizardStepCount(state: StudyWizardState): number {
  return wizardSteps.filter((step) => validateWizardStep(step.id, state).length === 0).length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function wizardFromBackendPacket(
  packet: unknown,
  fallbackStudy?: { title?: string; description?: string },
): StudyWizardState {
  const merged = {
    ...defaultWizardState,
    ...(isRecord(packet) ? packet : {}),
  } as StudyWizardState;

  return normalizeWizardForMethod({
    ...merged,
    title: typeof merged.title === "string" && merged.title.trim() ? merged.title : fallbackStudy?.title ?? defaultWizardState.title,
    description:
      typeof merged.description === "string" && merged.description.trim()
        ? merged.description
        : fallbackStudy?.description ?? defaultWizardState.description,
  });
}

export function buildGovernanceSummary(state: StudyWizardState): Array<{ label: string; value: string }> {
  return [
    { label: "Research question", value: state.researchQuestion },
    { label: "Method", value: state.studyFormat === "ModifiedDelphi" ? "Modified Delphi" : "Classic Delphi" },
    { label: "Round 1 mode", value: state.roundOneMode === "open-ended" ? "Open-ended elicitation" : "Structured elicitation" },
    { label: "Panel criteria", value: state.panelCriteria },
    { label: "Consent version", value: state.consentVersion },
    { label: "Confidentiality", value: state.confidentialityStatement },
    {
      label: "Consensus threshold",
      value: `${state.consensusThreshold}% agreement at rating ${state.agreementMinRating}+ (${consensusRuleSourceLabels[state.consensusRuleSource]}).`,
    },
    {
      label: "Consensus setting process",
      value: state.consensusRuleProcess,
    },
    {
      label: "Pre-round consensus input",
      value: state.preRoundConsensusInputEnabled
        ? `${preRoundConsensusStatusLabels[state.preRoundConsensusInputStatus]}: ${state.preRoundConsensusSummary || state.preRoundConsensusPrompt}`
        : "Not required; PI/governance-defined rule is still locked before Round 1.",
    },
    {
      label: "Controlled feedback",
      value: [
        state.feedbackMedian ? "median" : null,
        state.feedbackIqr ? "IQR/dispersion" : null,
        state.feedbackDistribution ? "distribution" : null,
        state.feedbackPriorResponse ? "your prior response" : null,
      ].filter(Boolean).join(", "),
    },
    { label: "AI setting", value: state.aiEnabled ? state.aiDisclosure : "AI disabled for this study." },
    { label: "Retention", value: state.retentionSchedule },
  ];
}
