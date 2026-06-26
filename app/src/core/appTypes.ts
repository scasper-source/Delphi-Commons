/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  BackendSignoff,
  BackendStudy,
  BackendStudyVersion,
  AISuggestionRecord,
  ItemRecord,
  ResponseRecord,
  RoundItemForParticipant,
  RoundReport,
  ExportPackage,
  ExportPackageFile,
  ParticipantIssue,
} from "./api";
import type { ModuleId, UserRole } from "./types";

export type WorkflowStep =
  | "create-study"
  | "create-version"
  | "save-wizard-packet"
  | "set-design"
  | "set-consensus"
  | "submit"
  | "owner-signoff"
  | "steward-signoff"
  | "activate"
  | "open-round-1";

export type ConductorWorkflow = {
  study: BackendStudy | null;
  version: BackendStudyVersion | null;
  signoffs: BackendSignoff[];
  busyStep: WorkflowStep | null;
  lastMessage: string | null;
  error: string | null;
};

export type RoundOneSetupState = {
  title: string;
  prompt: string;
  participantInstructions: string;
  responseWindowDays: number;
  reminderSubject: string;
  reminderBody: string;
  aiCurationEnabled: boolean;
};

export type RoundTwoSetupState = {
  title: string;
  prompt: string;
  participantInstructions: string;
  responseWindowDays: number;
  reminderSubject: string;
  reminderBody: string;
  controlledFeedbackEnabled: boolean;
  feedbackFormat: "distribution_only" | "distribution_summary" | "distribution_rationales";
  showParticipantPriorResponse: boolean;
};

export type RuntimeStudyData = {
  responses: ResponseRecord[];
  items: ItemRecord[];
  aiSuggestions: AISuggestionRecord[];
  roundTwoItems: RoundItemForParticipant[];
  ratingRoundItems: Record<number, RoundItemForParticipant[]>;
  roundReport: RoundReport | null;
  roundReports: Record<number, RoundReport | null>;
  exportReport: RoundReport | null;
  exportPackages: ExportPackage[];
  exportPackageFiles: Record<string, ExportPackageFile[]>;
  participantIssues: ParticipantIssue[];
  selectedExportPackageId: string | null;
  loading: boolean;
  error: string | null;
  message: string | null;
};

export type RatingDraft = Record<string, number>;
export type RationaleDraft = Record<string, string>;

export type RoundOneResponseEntry = {
  researchQuestionId: string;
  researchQuestionLabel: string;
  researchQuestionText: string;
  text: string;
};

export type NextAction = {
  title: string;
  detail: string;
  module: ModuleId;
  actionLabel: string;
  risk: "success" | "warning" | "info" | "locked";
  command?: {
    kind: "transition-round";
    roundNumber: number;
    action: "open" | "close";
  };
};

export type ActionChecklistItem = {
  label: string;
  detail: string;
  complete: boolean;
};

export const roleOrder: UserRole[] = [
  "study_owner",
  "ethics_methods_steward",
  "study_coordinator",
  "panelist",
  "data_custodian",
  "security_privacy_lead",
  "open_source_admin",
];

export const DEMO_PARTICIPANT_ID = "demo-panelist-001";

export const ratingScaleOptions = [
  { value: 1, label: "Strongly disagree", detail: "I do not support prioritizing this statement." },
  { value: 2, label: "Disagree", detail: "I mostly do not support prioritizing this statement." },
  { value: 3, label: "Somewhat disagree", detail: "I lean against prioritizing this statement." },
  { value: 4, label: "Slightly disagree", detail: "I have mild reservations about prioritizing this statement." },
  { value: 5, label: "Uncertain / mixed judgment", detail: "I see reasons both for and against prioritizing this statement." },
  { value: 6, label: "Slightly agree", detail: "I mildly support prioritizing this statement." },
  { value: 7, label: "Somewhat agree", detail: "I lean toward prioritizing this statement." },
  { value: 8, label: "Agree", detail: "I support prioritizing this statement." },
  { value: 9, label: "Strongly agree", detail: "I strongly support prioritizing this statement." },
] as const;

export const legacyVagueRatingPrompt = "Please rate each candidate statement using the study rating scale.";

export const initialWorkflow: ConductorWorkflow = {
  study: null,
  version: null,
  signoffs: [],
  busyStep: null,
  lastMessage: null,
  error: null,
};

export const defaultRoundOneSetup: RoundOneSetupState = {
  title: "Round 1: Open-ended elicitation",
  prompt: "What care transition practices should this panel consider for later rating rounds?",
  participantInstructions:
    "Please provide one or more practices or concerns in your own words. There is no expected answer, and disagreement or uncertainty is useful to the study.",
  responseWindowDays: 7,
  reminderSubject: "Round 1 response window is open",
  reminderBody:
    "This is a neutral reminder that Round 1 is open. Participation is voluntary, and you may respond within the study window.",
  aiCurationEnabled: true,
};

export const defaultRoundTwoSetup: RoundTwoSetupState = {
  title: "Round 2: Structured rating",
  prompt: "For each candidate statement, indicate how much you agree it should be prioritized for this study.",
  participantInstructions:
    "Review each statement independently. Use your own judgment; no response is treated as correct, and retaining or revising a response are both acceptable choices.",
  responseWindowDays: 7,
  reminderSubject: "Round 2 rating window is open",
  reminderBody:
    "This is a neutral reminder that Round 2 is open. Participation is voluntary, and you may respond within the study window.",
  controlledFeedbackEnabled: true,
  feedbackFormat: "distribution_summary",
  showParticipantPriorResponse: true,
};

export const emptyRuntimeStudyData: RuntimeStudyData = {
  responses: [],
  items: [],
  aiSuggestions: [],
  roundTwoItems: [],
  ratingRoundItems: {},
  roundReport: null,
  roundReports: {},
  exportReport: null,
  exportPackages: [],
  exportPackageFiles: {},
  participantIssues: [],
  selectedExportPackageId: null,
  loading: false,
  error: null,
  message: null,
};
