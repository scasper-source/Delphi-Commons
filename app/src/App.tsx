/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import "./App.css";
import {
  conductorApi,
  createStudyApi,
  apiBoundary,
  type BackendSignoff,
  type BackendStudy,
  type BackendStudyVersion,
  type AISuggestionRecord,
  type ItemRecord,
  type ResponseRecord,
  type RoundItemForParticipant,
  type RoundReport,
  type RoundConfig,
  type SavedStudyRecord,
  type ParticipantInvitationContext,
  type ExportPackage,
  type ExportPackageFile,
  type BackendUser,
  type StudyAssignment,
  type StudyAIConfig,
  type AIConfigValidation,
  type AttritionSummary,
  type ParticipantEnrollment,
  type NonResponseEscalation,
  type NonResponsePolicy,
  type FinalResultSnapshot,
  type ParticipantFinalResponse,
  type SmsPolicy,
  type ParticipantContactPreference,
  type SmsNotification,
  type PhoneVerificationChallengeResponse,
  type MagicRoundEntryContext,
  type StudyContextDisclosure,
  type StudyContextValidation,
  type ParticipantIssueInput,
  type ParticipantIssue,
  type ParticipantIssueType,
  type RoundOneAnswerInput,
} from "./core/api";
import { mockStudies, mockStudy } from "./core/mockData";
import { canAccessIdentityMap, canAccessModule, canExportOutput, roleLabels } from "./core/permissions";
import type { GovernanceChecklistItem, ModuleId, StudyRecord, UserRole } from "./core/types";
import { methodRegistry } from "./methods/registry";
import { moduleRegistry } from "./modules/registry";
import { outputModelRegistry } from "./outputModels/registry";
import {
  canEditConsensusRule,
  containsForbiddenParticipantLanguage,
  evaluateLaunchGate,
  identityAccessDecision,
  reportIncludesNonConsensus,
} from "./policies/governance";
import {
  activeResearchQuestions,
  buildGovernanceSummary,
  consensusRuleSourceLabels,
  consensusSourceRequiresPreRoundInput,
  createResearchQuestionDraft,
  defaultWizardState,
  normalizeWizardResearchQuestions,
  normalizeWizardForMethod,
  preRoundConsensusStatusLabels,
  validateWizardStep,
  wizardFromBackendPacket,
  wizardSteps,
  type ResearchQuestion,
  type StudyWizardState,
  type StudyWizardStepId,
} from "./core/studyWizard";
import {
  AISuggestionCard,
  AuditTrail,
  Checklist,
  DataBar,
  LockedRule,
  ProvenanceList,
  SignoffGateList,
  StatCard,
  StatusBadge,
  WarningBanner,
} from "./components/ui/Primitives";
import {
  aiOrientationText,
  consensusReminder,
  glossaryTerms,
  inlineHelp,
  orientationContentVersion,
  platformAboutSections,
  roundReminder,
  studyOrientationFacts,
  tutorialSteps,
} from "./content/orientation";
import { participantCopy, participantIssueTypeOptions } from "./content/participantCopy";
import {
  buildBibtexCitation,
  buildPreferredCitation,
  citationFraming,
  citationMetadata,
} from "./content/citation";

const roleOrder: UserRole[] = [
  "study_owner",
  "ethics_methods_steward",
  "study_coordinator",
  "panelist",
  "data_custodian",
  "security_privacy_lead",
  "open_source_admin",
];

const DEMO_PARTICIPANT_ID = "demo-panelist-001";

const statusLabels: Record<string, string> = {
  ReadyForReview: "Ready for review",
  NotOpen: "Not open",
  ReadyForSignoff: "Ready for signoff",
};

function participantInviteTokenFromLocation() {
  const queryToken = new URLSearchParams(window.location.search).get("invite");
  if (queryToken) return queryToken;

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash).get("invite");
}

function magicTokenFromLocation() {
  const pathMatch = window.location.pathname.match(/^\/m\/([A-Za-z0-9_-]{32,256})$/);
  if (pathMatch?.[1]) return pathMatch[1];
  const queryToken = new URLSearchParams(window.location.search).get("m");
  if (queryToken) return queryToken;
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash).get("m");
}

const ratingScaleOptions = [
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

const legacyVagueRatingPrompt = "Please rate each candidate statement using the study rating scale.";

function formatStatus(value: string): string {
  return statusLabels[value] ?? value;
}

function formatRatingChoice(value: number | null | undefined): string {
  if (!value) return "No response recorded";
  return ratingScaleOptions.find((option) => option.value === value)?.label ?? `Recorded response ${value}`;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function shortId(value: string): string {
  return value.slice(0, 8);
}

function packetText(packet: unknown, key: "title" | "description"): string | null {
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) return null;
  const value = (packet as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : null;
}

type RoundOneResponseEntry = {
  researchQuestionId: string;
  researchQuestionLabel: string;
  researchQuestionText: string;
  text: string;
};

function fallbackResearchQuestion(): ResearchQuestion {
  return {
    id: "rq-1",
    displayOrder: 1,
    text: defaultWizardState.researchQuestion,
    shortLabel: "Research question 1",
    description: "",
    requiredForRound1Response: true,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function questionLabel(question: ResearchQuestion, index: number): string {
  return question.shortLabel?.trim() || `Research question ${index + 1}`;
}

function roundOneQuestions(wizard: StudyWizardState): ResearchQuestion[] {
  const questions = activeResearchQuestions(wizard);
  return questions.length > 0 ? questions : [fallbackResearchQuestion()];
}

function roundOneResponseEntries(responseJson: unknown, questions: ResearchQuestion[] = [fallbackResearchQuestion()]): RoundOneResponseEntry[] {
  const activeQuestions = questions.filter((question) => question.active);
  const fallbackQuestion = activeQuestions[0] ?? questions[0] ?? fallbackResearchQuestion();
  if (typeof responseJson === "string" && responseJson.trim()) {
    return [{
      researchQuestionId: fallbackQuestion.id,
      researchQuestionLabel: questionLabel(fallbackQuestion, 0),
      researchQuestionText: fallbackQuestion.text,
      text: responseJson.trim(),
    }];
  }
  if (!responseJson || typeof responseJson !== "object" || Array.isArray(responseJson)) return [];
  const record = responseJson as Record<string, unknown>;
  if (Array.isArray(record.responses)) {
    const questionById = new Map(activeQuestions.map((question, index) => [question.id, { question, index }]));
    const entries = record.responses.flatMap((entry): RoundOneResponseEntry[] => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
      const entryRecord = entry as Record<string, unknown>;
      const researchQuestionId = typeof entryRecord.researchQuestionId === "string" ? entryRecord.researchQuestionId : "";
      const text = typeof entryRecord.text === "string" ? entryRecord.text.trim() : "";
      if (!researchQuestionId || !text) return [];
      const match = questionById.get(researchQuestionId);
      return [{
        researchQuestionId,
        researchQuestionLabel: match ? questionLabel(match.question, match.index) : researchQuestionId,
        researchQuestionText: match?.question.text ?? "",
        text,
      }];
    });
    if (entries.length > 0) return entries;
  }

  for (const key of ["text", "response_text", "open_text", "answer", "statement", "comment", "comments"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return [{
        researchQuestionId: fallbackQuestion.id,
        researchQuestionLabel: questionLabel(fallbackQuestion, 0),
        researchQuestionText: fallbackQuestion.text,
        text: value.trim(),
      }];
    }
  }

  return [];
}

function responseOpenText(responseJson: unknown): string | null {
  return roundOneResponseEntries(responseJson).at(0)?.text ?? null;
}

function firstRoundOneAnswerText(answers: Record<string, string>, questions: ResearchQuestion[]): string {
  return questions.map((question) => answers[question.id]?.trim() ?? "").find(Boolean) ?? "";
}

function roundOneAnswerInputs(answers: Record<string, string>, questions: ResearchQuestion[]): RoundOneAnswerInput[] {
  return questions.map((question) => ({
    researchQuestionId: question.id,
    text: answers[question.id]?.trim() ?? "",
  }));
}

function roundOneAnswersFromPayload(payload: unknown, questions: ResearchQuestion[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of roundOneResponseEntries(payload, questions)) {
    out[entry.researchQuestionId] = entry.text;
  }
  return out;
}

function excerpt(value: string, max = 240): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max - 3)}...` : collapsed;
}

function roundReportRisk(status: string): "success" | "warning" | "info" | "locked" {
  if (status === "consensus") return "success";
  if (status === "non_consensus") return "warning";
  return "info";
}

function humanizeBackendMessage(message: string | null): string | null {
  if (!message) return null;

  const labels: Record<string, string> = {
    active_consent_required: "Consent must be acknowledged before this participant response can be submitted.",
    active_research_question_required: "At least one active research question is required before launch or Round 1 response collection.",
    ai_suggestion_decision_required: "Accept, edit, or reject the AI suggestion before using it.",
    ai_suggestion_release_signoff_required:
      "Participant-facing AI-assisted material needs both Study Owner and Ethics & Methods Steward release signoff.",
    another_round_open: "Close the currently open round before opening another round.",
    consensus_rule_locked: "The consensus threshold is locked after governance submission.",
    consensus_setting_process_missing: "Document how the consensus rule was set before governance signoff.",
    invalid_consensus_threshold: "Choose a consensus threshold of 60%, 70%, 80%, or 90%.",
    invalid_consensus_rule_source: "Choose a valid consensus rule source.",
    invalid_pre_round_consensus_status: "Choose a valid pre-round consensus input status.",
    locked_study_design_required_for_ai: "Submit the study design for governance before using AI-assisted drafting.",
    pre_round_consensus_input_not_reviewed: "Panel- or stakeholder-informed consensus input must be reviewed or finalized before governance signoff.",
    pre_round_consensus_prompt_missing: "Add a neutral pre-round prompt for consensus-rule input.",
    pre_round_consensus_summary_missing: "Summarize how pre-round consensus input was considered before governance signoff.",
    previous_round_must_be_closed: "Close the previous round before opening this round.",
    participant_orientation_required: "Complete the study orientation before beginning Round 1.",
    published_items_required_for_round: "Publish at least one traceable candidate item before opening this round.",
    round_config_required: "Configure this round before opening it.",
    round_not_open: "This task is not available until the study team opens the round.",
    round1_config_required: "Configure Round 1 before collecting participant responses.",
    round1_not_open: "Round 1 is not open for participant responses.",
    required_research_question_response_missing: "A required research question response is missing.",
    research_question_text_required: "Each active research question needs text before governance review.",
    source_material_required_for_synthesis: "Round 1 responses are required before drafting Round 2 candidates.",
    study_design_packet_missing: "Save the Study Builder packet before submitting for governance signoff.",
    study_version_not_active: "Activate the study version before opening rounds or collecting responses.",
    forbidden: "This role is not authorized for the selected study. Confirm the user has study membership for this role.",
    unassigned: "This signed-in user is not assigned to the selected study.",
  };

  return labels[message] ?? message.replaceAll("_", " ");
}

function bytesFromBase64(value: string): ArrayBuffer {
  const binary = window.atob(value);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return buffer;
}

function downloadPackageFile(file: ExportPackageFile) {
  const body: BlobPart =
    file.content_encoding === "base64"
      ? bytesFromBase64(file.content_text)
      : file.content_text;
  const blob = new Blob([body], { type: file.media_type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.path.split("/").at(-1) ?? "delphi-commons-export-file";
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

type NextAction = {
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

type ActionChecklistItem = {
  label: string;
  detail: string;
  complete: boolean;
};

type WorkflowStep =
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

type ConductorWorkflow = {
  study: BackendStudy | null;
  version: BackendStudyVersion | null;
  signoffs: BackendSignoff[];
  busyStep: WorkflowStep | null;
  lastMessage: string | null;
  error: string | null;
};

type RoundOneSetupState = {
  title: string;
  prompt: string;
  participantInstructions: string;
  responseWindowDays: number;
  reminderSubject: string;
  reminderBody: string;
  aiCurationEnabled: boolean;
};

type RoundTwoSetupState = {
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

type RuntimeStudyData = {
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

type RatingDraft = Record<string, number>;
type RationaleDraft = Record<string, string>;

const initialWorkflow: ConductorWorkflow = {
  study: null,
  version: null,
  signoffs: [],
  busyStep: null,
  lastMessage: null,
  error: null,
};

const defaultRoundOneSetup: RoundOneSetupState = {
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

const defaultRoundTwoSetup: RoundTwoSetupState = {
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

const emptyRuntimeStudyData: RuntimeStudyData = {
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

function App() {
  const [role, setRole] = useState<UserRole>("study_owner");
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const [workflow, setWorkflow] = useState<ConductorWorkflow>(initialWorkflow);
  const [wizard, setWizard] = useState<StudyWizardState>(defaultWizardState);
  const [activeWizardStep, setActiveWizardStep] = useState<StudyWizardStepId>("purpose");
  const [roundOneSetup, setRoundOneSetup] = useState<RoundOneSetupState>(defaultRoundOneSetup);
  const [roundTwoSetup, setRoundTwoSetup] = useState<RoundTwoSetupState>(defaultRoundTwoSetup);
  const [roundConfigs, setRoundConfigs] = useState<RoundConfig[]>([]);
  const [roundActionMessage, setRoundActionMessage] = useState<string | null>(null);
  const [roundActionError, setRoundActionError] = useState<string | null>(null);
  const [roundActionBusy, setRoundActionBusy] = useState<string | null>(null);
  const [participantResponseText, setParticipantResponseText] = useState("");
  const [participantRoundOneAnswers, setParticipantRoundOneAnswers] = useState<Record<string, string>>({});
  const [participantSubmittedRoundOneText, setParticipantSubmittedRoundOneText] = useState<string | null>(null);
  const [participantSubmittedRoundOneAnswers, setParticipantSubmittedRoundOneAnswers] = useState<Record<string, string> | null>(null);
  const [participantRoundOneEditing, setParticipantRoundOneEditing] = useState(false);
  const [participantRoundOneComplete, setParticipantRoundOneComplete] = useState(false);
  const [participantSubmittedRatings, setParticipantSubmittedRatings] = useState<Record<number, RatingDraft>>({});
  const [participantSubmittedRationales, setParticipantSubmittedRationales] = useState<Record<number, RationaleDraft>>({});
  const [participantRatingRoundEditing, setParticipantRatingRoundEditing] = useState<Record<number, boolean>>({});
  const [participantRatingRoundComplete, setParticipantRatingRoundComplete] = useState<Record<number, boolean>>({});
  const [participantDraftSavedAt, setParticipantDraftSavedAt] = useState<string | null>(null);
  const [participantRatingDraftSavedAt, setParticipantRatingDraftSavedAt] = useState<Record<number, string | null>>({});
  const [participantWithdrawn, setParticipantWithdrawn] = useState(false);
  const [participantConsentChecked, setParticipantConsentChecked] = useState(false);
  const [participantOrientationComplete, setParticipantOrientationComplete] = useState(false);
  const [participantMessage, setParticipantMessage] = useState<string | null>(null);
  const [participantError, setParticipantError] = useState<string | null>(null);
  const [participantBusy, setParticipantBusy] = useState(false);
  const [participantInviteToken, setParticipantInviteToken] = useState(participantInviteTokenFromLocation);
  const [magicToken, setMagicToken] = useState(magicTokenFromLocation);
  const [magicContext, setMagicContext] = useState<MagicRoundEntryContext | null>(null);
  const [magicItems, setMagicItems] = useState<RoundItemForParticipant[]>([]);
  const [magicResponseText, setMagicResponseText] = useState("");
  const [magicRoundOneAnswers, setMagicRoundOneAnswers] = useState<Record<string, string>>({});
  const [magicRatings, setMagicRatings] = useState<RatingDraft>({});
  const [magicRationales, setMagicRationales] = useState<RationaleDraft>({});
  const [magicMessage, setMagicMessage] = useState<string | null>(null);
  const [magicError, setMagicError] = useState<string | null>(null);
  const [magicBusy, setMagicBusy] = useState(false);
  const [participantInvite, setParticipantInvite] = useState<ParticipantInvitationContext | null>(null);
  const [runtimeData, setRuntimeData] = useState<RuntimeStudyData>(emptyRuntimeStudyData);
  const [runtimeActionBusy, setRuntimeActionBusy] = useState<string | null>(null);
  const [roundTwoRatings, setRoundTwoRatings] = useState<RatingDraft>({});
  const [roundTwoRationales, setRoundTwoRationales] = useState<RationaleDraft>({});
  const [finalResultSnapshot, setFinalResultSnapshot] = useState<FinalResultSnapshot | null>(null);
  const [finalResultBlockers, setFinalResultBlockers] = useState<string[]>(["final_result_snapshot_missing"]);
  const [participantFinalResponses, setParticipantFinalResponses] = useState<ParticipantFinalResponse[]>([]);
  const [finalResultMessage, setFinalResultMessage] = useState<string | null>(null);
  const [finalResultError, setFinalResultError] = useState<string | null>(null);
  const [finalResultBusy, setFinalResultBusy] = useState<string | null>(null);
  const [savedStudies, setSavedStudies] = useState<SavedStudyRecord[]>([]);
  const [savedStudiesLoading, setSavedStudiesLoading] = useState(false);
  const [savedStudiesError, setSavedStudiesError] = useState<string | null>(null);
  const studyApi = useMemo(() => createStudyApi(mockStudies), []);
  const accessibleModules = moduleRegistry.filter((module) => canAccessModule(role, module));
  const headerModuleIds: ModuleId[] = role === "panelist"
    ? ["about", "participant", "closeout", "glossary"]
    : ["about", "glossary"];
  const headerModules = accessibleModules.filter((module) => headerModuleIds.includes(module.id));
  const navigationModules = accessibleModules.filter((module) => !headerModuleIds.includes(module.id));
  const selectedStudy = mockStudy;
  const activeTitle = workflow.study?.title ?? selectedStudy.title;
  const activeStatus = workflow.version?.status ?? selectedStudy.status;
  const consensusLocked = Boolean(workflow.version?.consensus_rule_json ?? selectedStudy.consensusRule.locked);

  useEffect(() => {
    function syncEntryTokensFromLocation() {
      setParticipantInviteToken(participantInviteTokenFromLocation());
      setMagicToken(magicTokenFromLocation());
    }

    syncEntryTokensFromLocation();
    window.addEventListener("hashchange", syncEntryTokensFromLocation);
    window.addEventListener("popstate", syncEntryTokensFromLocation);
    return () => {
      window.removeEventListener("hashchange", syncEntryTokensFromLocation);
      window.removeEventListener("popstate", syncEntryTokensFromLocation);
    };
  }, []);

  async function loadSavedStudies() {
    if (role === "panelist") {
      setSavedStudies([]);
      return;
    }

    setSavedStudiesLoading(true);
    setSavedStudiesError(null);

    try {
      const records = await conductorApi.listSavedStudies(role);
      setSavedStudies(records);
    } catch (error) {
      setSavedStudiesError(error instanceof Error ? error.message : "Unable to load saved studies.");
    } finally {
      setSavedStudiesLoading(false);
    }
  }

  useEffect(() => {
    void loadSavedStudies();
  }, [role]);

  useEffect(() => {
    if (!magicToken) return;
    const token = magicToken;
    async function loadMagicEntry() {
      setMagicBusy(true);
      setMagicError(null);
      try {
        setRole("panelist");
        setActiveModule("participant");
        const result = await conductorApi.consumeMagicLink(token);
        setMagicContext(result.context);
        window.history.replaceState({}, document.title, "/");
        const issueResult = await conductorApi.listMagicParticipantIssues().catch(() => ({ issues: [] }));
        setRuntimeData((current) => ({ ...current, participantIssues: issueResult.issues }));
        if (result.context.round.round_number > 1 && result.context.round.status === "open") {
          const items = await conductorApi.listMagicRoundItems(result.context.round.round_number);
          setMagicItems(items.items);
        }
      } catch (error) {
        setRole("panelist");
        setActiveModule("participant");
        setMagicError(
          error instanceof Error
            ? error.message
            : "This secure link has expired or has already been used.",
        );
      } finally {
        setMagicBusy(false);
      }
    }
    void loadMagicEntry();
  }, [magicToken]);

  useEffect(() => {
    if (!participantInviteToken) return;
    const inviteToken = participantInviteToken;

    async function loadInvite() {
      try {
        setRole("panelist");
        setActiveModule("participant");
        const context = await conductorApi.getParticipantInvitation(inviteToken);
        setParticipantInvite(context);
        setParticipantConsentChecked(Boolean(context.consent_record && !context.consent_record.withdrew_at));
        setParticipantWithdrawn(Boolean(context.consent_record?.withdrew_at));
        setParticipantOrientationComplete(Boolean(context.orientation_completion));
        setRoundConfigs(context.round_configs);
        const inviteWizard = context.study_version
          ? wizardFromBackendPacket(context.study_version.study_design_packet_json, context.study ?? undefined)
          : defaultWizardState;
        setWizard(inviteWizard);
        const inviteQuestions = roundOneQuestions(inviteWizard);
        const issueResult = await conductorApi.listInvitationParticipantIssues(inviteToken).catch(() => ({ issues: [] }));
        setRuntimeData((current) => ({ ...current, participantIssues: issueResult.issues }));
        const roundOneDraft = context.drafts.find((draft) => draft.round_number === 1);
        if (roundOneDraft?.draft_json) {
          const answers = roundOneAnswersFromPayload(roundOneDraft.draft_json, inviteQuestions);
          if (Object.keys(answers).length > 0) {
            setParticipantRoundOneAnswers(answers);
            setParticipantResponseText(firstRoundOneAnswerText(answers, inviteQuestions));
            setParticipantDraftSavedAt(roundOneDraft.updated_at);
          }
        }

        if (context.study && context.study_version) {
          setWorkflow((current) => ({
            ...current,
            study: context.study,
            version: context.study_version,
            signoffs: [],
            lastMessage: "Participant invitation opened.",
            error: null,
          }));
        }

        const openRatingRound = context.round_configs.find((config) => config.round_number > 1 && config.status === "Open");
        if (openRatingRound) {
          const result = await conductorApi.listInvitationRoundItems(inviteToken, openRatingRound.round_number);
          const ratingDraft = context.drafts.find((draft) => draft.round_number === openRatingRound.round_number);
          if (ratingDraft?.draft_json && typeof ratingDraft.draft_json === "object") {
            const draftJson = ratingDraft.draft_json as { ratings?: unknown; rationales?: unknown };
            if (draftJson.ratings && typeof draftJson.ratings === "object" && !Array.isArray(draftJson.ratings)) {
              setRoundTwoRatings(draftJson.ratings as RatingDraft);
            }
            if (draftJson.rationales && typeof draftJson.rationales === "object" && !Array.isArray(draftJson.rationales)) {
              setRoundTwoRationales(draftJson.rationales as RationaleDraft);
            }
            setParticipantRatingDraftSavedAt((current) => ({ ...current, [openRatingRound.round_number]: ratingDraft.updated_at }));
          }
          setRuntimeData((current) => ({
            ...current,
            ratingRoundItems: {
              ...current.ratingRoundItems,
              [openRatingRound.round_number]: result.items,
            },
            roundTwoItems: openRatingRound.round_number === 2 ? result.items : current.roundTwoItems,
          }));
        }
        try {
          const finalResults = await conductorApi.getInvitationFinalResults(inviteToken);
          setFinalResultSnapshot(finalResults.snapshot);
          setParticipantFinalResponses(finalResults.my_final_responses);
          setFinalResultBlockers([]);
        } catch {
          setParticipantFinalResponses([]);
        }
      } catch (error) {
        setParticipantError(error instanceof Error ? error.message : "Unable to open participant invitation.");
      }
    }

    void loadInvite();
  }, [participantInviteToken]);

  useEffect(() => {
    const hasDraftText = participantResponseText.trim() || Object.values(participantRoundOneAnswers).some((value) => value.trim());
    if (!hasDraftText || participantSubmittedRoundOneText) return;

    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [participantResponseText, participantRoundOneAnswers, participantSubmittedRoundOneText]);

  useEffect(() => {
    if (participantInviteToken || magicToken) return;

    if (workflow.study && workflow.version) {
      void loadRoundConfigs(workflow.study.id, workflow.version.id);
      void loadRuntimeData(workflow.study.id, workflow.version.id);
    } else {
      setRoundConfigs([]);
      setRuntimeData(emptyRuntimeStudyData);
      setRoundTwoRatings({});
      setFinalResultSnapshot(null);
      setFinalResultBlockers(["final_result_snapshot_missing"]);
      setParticipantFinalResponses([]);
    }
  }, [role, workflow.study?.id, workflow.version?.id, participantInviteToken, magicToken]);

  function openSavedStudy(record: SavedStudyRecord) {
    setWizard(wizardFromBackendPacket(record.latestVersion?.study_design_packet_json, record.study));
    setWorkflow({
      study: record.study,
      version: record.latestVersion,
      signoffs: record.signoffs,
      busyStep: null,
      lastMessage: record.latestVersion
        ? `Opened saved study, version ${record.latestVersion.version_number}.`
        : "Opened saved study with no version yet.",
      error: null,
    });
    setActiveModule(record.latestVersion ? "study-builder" : "dashboard");
    if (record.latestVersion) {
      void loadRoundConfigs(record.study.id, record.latestVersion.id);
      void loadRuntimeData(record.study.id, record.latestVersion.id);
    }
  }

  async function loadRoundConfigs(studyId = workflow.study?.id, versionId = workflow.version?.id) {
    if (!studyId || !versionId) {
      setRoundConfigs([]);
      return;
    }

    try {
      const result = await conductorApi.listRoundConfigs(studyId, versionId, role);
      setRoundConfigs(result.round_configs);
    } catch {
      setRoundConfigs([]);
    }
  }

  async function loadRuntimeData(studyId = workflow.study?.id, versionId = workflow.version?.id) {
    if (!studyId || !versionId) {
      setRuntimeData(emptyRuntimeStudyData);
      setFinalResultSnapshot(null);
      setFinalResultBlockers(["final_result_snapshot_missing"]);
      return;
    }

    setRuntimeData((current) => ({ ...current, loading: true, error: null }));

    try {
      const canReadStaffData = role !== "panelist";
      const terminalRound = workflow.version?.terminal_round_number ?? wizard.terminalRoundNumber;
      const ratingRounds = Array.from({ length: Math.max(terminalRound - 1, 1) }, (_, index) => index + 2);
      const [responsesResult, itemsResult, suggestionsResult, ratingItemsResults, reportResults, exportPackagesResult, finalResultsResult, participantIssuesResult] =
        await Promise.all([
          canReadStaffData ? conductorApi.listResponses(studyId, versionId, role) : Promise.resolve({ responses: [] }),
          canReadStaffData ? conductorApi.listItems(studyId, versionId, role) : Promise.resolve({ items: [] }),
          canReadStaffData ? conductorApi.listAiSuggestions(studyId, versionId, role) : Promise.resolve({ suggestions: [] }),
          Promise.allSettled(
            ratingRounds.map(async (roundNumber) => ({
              roundNumber,
              result: await conductorApi.listRoundItems(studyId, versionId, roundNumber, "demo-panelist-001", role),
            })),
          ),
          Promise.allSettled(
            ratingRounds.map(async (roundNumber) => ({
              roundNumber,
              result: canReadStaffData
                ? await conductorApi.getRoundReport(studyId, versionId, roundNumber, role)
                : { report: null },
            })),
          ),
          canReadStaffData
            ? conductorApi.listExportPackages(studyId, versionId, role).catch(() => ({ export_packages: [] }))
            : Promise.resolve({ export_packages: [] }),
          canReadStaffData
            ? conductorApi.getFinalResults(studyId, versionId, role).catch(() => ({
                snapshot: null,
                release_blockers: ["final_result_snapshot_missing"],
              }))
            : Promise.resolve({ snapshot: null, release_blockers: ["participant_final_results_use_invitation"] }),
          canReadStaffData
            ? conductorApi.listParticipantIssues(studyId, versionId, role).catch(() => ({ issues: [] }))
            : Promise.resolve({ issues: [] }),
        ]);

      setFinalResultSnapshot(finalResultsResult.snapshot);
      setFinalResultBlockers(finalResultsResult.release_blockers);

      const ratingRoundItems = Object.fromEntries(
        ratingItemsResults.flatMap((entry) =>
          entry.status === "fulfilled" ? [[entry.value.roundNumber, entry.value.result.items]] : [],
        ),
      );
      const roundReports = Object.fromEntries(
        reportResults.flatMap((entry) =>
          entry.status === "fulfilled" ? [[entry.value.roundNumber, entry.value.result.report]] : [],
        ),
      );

      setRuntimeData((current) => ({
        ...current,
        responses: responsesResult.responses,
        items: itemsResult.items,
        aiSuggestions: suggestionsResult.suggestions,
        roundTwoItems: ratingRoundItems[2] ?? [],
        ratingRoundItems,
        roundReport: roundReports[2] ?? null,
        roundReports,
        exportPackages: exportPackagesResult.export_packages,
        participantIssues: participantIssuesResult.issues,
        selectedExportPackageId:
          current.selectedExportPackageId &&
          exportPackagesResult.export_packages.some((pkg) => pkg.export_package_id === current.selectedExportPackageId)
            ? current.selectedExportPackageId
            : exportPackagesResult.export_packages.at(-1)?.export_package_id ?? null,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setRuntimeData((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error.message : "Unable to load study runtime data.",
      }));
    }
  }

  function setRuntimeMessage(message: string) {
    setRuntimeData((current) => ({ ...current, message, error: null }));
  }

  function setRuntimeError(error: unknown, fallback: string) {
    setRuntimeData((current) => ({
      ...current,
      error: error instanceof Error ? error.message : fallback,
      message: null,
    }));
  }

  async function saveRoundOneConfiguration() {
    if (!workflow.study || !workflow.version) {
      setRoundActionError("Save the study design and create a draft version before configuring Round 1.");
      return;
    }

    setRoundActionBusy("save-r1");
    setRoundActionError(null);
    setRoundActionMessage(null);

    try {
      const result = await conductorApi.saveRoundConfig(workflow.study.id, workflow.version.id, 1, role, {
        task_type: "open_text",
        title: roundOneSetup.title,
        prompt: roundOneSetup.prompt,
        participant_instructions: roundOneSetup.participantInstructions,
        response_window_days: roundOneSetup.responseWindowDays,
        reminder_subject: roundOneSetup.reminderSubject,
        reminder_body: roundOneSetup.reminderBody,
        controlled_feedback_enabled: false,
        ai_curation_enabled: roundOneSetup.aiCurationEnabled,
        feedback_config: null,
        status: "Ready",
      });

      const consentText = [
        `# ${wizard.consentVersion}`,
        "",
        wizard.consentSummary,
        "",
        `Confidentiality: ${wizard.confidentialityStatement}`,
        "",
        `Withdrawal: ${wizard.withdrawalProcess}`,
      ].join("\n");
      const consent = await conductorApi.createConsentVersion(workflow.study.id, workflow.version.id, role, consentText);
      await conductorApi.activateConsentVersion(
        workflow.study.id,
        workflow.version.id,
        consent.consent_version.consent_version_id,
        role,
      );

      setRoundConfigs((current) => [
        ...current.filter((config) => config.round_number !== 1),
        result.round_config,
      ]);
      setRoundActionMessage("Round 1 setup saved and consent text activated.");
    } catch (error) {
      setRoundActionError(error instanceof Error ? error.message : "Unable to save Round 1 setup.");
    } finally {
      setRoundActionBusy(null);
    }
  }

  async function saveRoundTwoConfiguration() {
    await saveRatingRoundConfiguration(2);
  }

  async function saveRatingRoundConfiguration(roundNumber: number) {
    if (!workflow.study || !workflow.version) {
      setRoundActionError("Save and activate the study before configuring rating rounds.");
      return;
    }

    setRoundActionBusy(`save-r${roundNumber}`);
    setRoundActionError(null);
    setRoundActionMessage(null);

    try {
      const isTerminal = roundNumber === (workflow.version.terminal_round_number ?? wizard.terminalRoundNumber);
      const result = await conductorApi.saveRoundConfig(workflow.study.id, workflow.version.id, roundNumber, role, {
        task_type: "rating",
        title: roundNumber === 2 ? roundTwoSetup.title : `Round ${roundNumber}: ${isTerminal ? "Terminal rating" : "Structured rating"}`,
        prompt: roundNumber === 2
          ? roundTwoSetup.prompt
          : "For each carried-forward statement, indicate how much you agree it should remain prioritized for this study.",
        participant_instructions: roundNumber === 2
          ? roundTwoSetup.participantInstructions
          : "Review the controlled feedback neutrally and use your own judgment. You may retain or revise prior responses where available.",
        response_window_days: roundTwoSetup.responseWindowDays,
        reminder_subject: roundNumber === 2 ? roundTwoSetup.reminderSubject : `Round ${roundNumber} rating window is open`,
        reminder_body: roundNumber === 2 ? roundTwoSetup.reminderBody : `This is a neutral reminder that Round ${roundNumber} is open.`,
        controlled_feedback_enabled: roundTwoSetup.controlledFeedbackEnabled,
        ai_curation_enabled: false,
        feedback_config: {
          feedback_config_id: "",
          version_number: 1,
          format: roundTwoSetup.feedbackFormat,
          show_participant_prior_response: roundTwoSetup.showParticipantPriorResponse,
          locked_at: null,
          locked_by_user_id: null,
          created_at: "",
          updated_at: "",
        },
        status: "Ready",
      });

      setRoundConfigs((current) => [
        ...current.filter((config) => config.round_number !== roundNumber),
        result.round_config,
      ]);
      setRoundActionMessage(`Round ${roundNumber} participant task configured.`);
    } catch (error) {
      setRoundActionError(error instanceof Error ? error.message : `Unable to save Round ${roundNumber} setup.`);
    } finally {
      setRoundActionBusy(null);
    }
  }

  async function transitionRound(roundNumber: number, action: "open" | "close") {
    if (!workflow.study || !workflow.version) {
      setRoundActionError("Select an active backend study before changing round status.");
      return;
    }

    setRoundActionBusy(`${action}-${roundNumber}`);
    setRoundActionError(null);
    setRoundActionMessage(null);

    try {
      if (
        action === "close" &&
        roundNumber === 1 &&
        workflow.version.opened_round1_at &&
        !roundConfigs.some((config) => config.round_number === 1)
      ) {
        const repairedConfig = await conductorApi.saveRoundConfig(workflow.study.id, workflow.version.id, 1, role, {
          task_type: "open_text",
          title: roundOneSetup.title,
          prompt: roundOneSetup.prompt,
          participant_instructions: roundOneSetup.participantInstructions,
          response_window_days: roundOneSetup.responseWindowDays,
          reminder_subject: roundOneSetup.reminderSubject,
          reminder_body: roundOneSetup.reminderBody,
          controlled_feedback_enabled: false,
          ai_curation_enabled: roundOneSetup.aiCurationEnabled,
          feedback_config: null,
          status: "Ready",
        });
        setRoundConfigs((current) => [
          ...current.filter((config) => config.round_number !== 1),
          repairedConfig.round_config,
        ]);
        await conductorApi.openRound(workflow.study.id, workflow.version.id, 1, role);
      }

      const result =
        action === "open"
          ? await conductorApi.openRound(workflow.study.id, workflow.version.id, roundNumber, role)
          : await conductorApi.closeRound(workflow.study.id, workflow.version.id, roundNumber, role);
      const createdSnapshot: FinalResultSnapshot | null =
        action === "close" && "final_result_snapshot" in result
          ? (result as { final_result_snapshot?: FinalResultSnapshot }).final_result_snapshot ?? null
          : null;

      setRoundConfigs((current) => [
        ...current.filter((config) => config.round_number !== roundNumber),
        result.round_config,
      ]);
      if (createdSnapshot) {
        setFinalResultSnapshot(createdSnapshot);
        setFinalResultBlockers(["study_owner_closeout_signoff_missing", "ethics_methods_closeout_signoff_missing"]);
        setActiveModule("closeout");
      }
      setRoundActionMessage(
        createdSnapshot
          ? `Round ${roundNumber} closed and the Final Results & Study Closeout snapshot was created.`
          : `Round ${roundNumber} ${action === "open" ? "opened" : "closed"}.`,
      );
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRoundActionError(error instanceof Error ? error.message : `Unable to ${action} Round ${roundNumber}.`);
    } finally {
      setRoundActionBusy(null);
    }
  }

  async function runFinalResultAction(action: "create" | "signoff" | "release" | "archive") {
    if (!workflow.study || !workflow.version) {
      setFinalResultError("Open a backend study before working with final results.");
      return;
    }

    setFinalResultBusy(action);
    setFinalResultError(null);
    setFinalResultMessage(null);

    try {
      const result =
        action === "create"
          ? await conductorApi.createFinalResults(workflow.study.id, workflow.version.id, role)
          : action === "signoff"
            ? await conductorApi.signoffFinalResults(workflow.study.id, workflow.version.id, role)
            : action === "release"
              ? await conductorApi.releaseFinalResults(workflow.study.id, workflow.version.id, role)
              : await conductorApi.archiveFinalResults(workflow.study.id, workflow.version.id, role);

      setFinalResultSnapshot(result.snapshot);
      setFinalResultBlockers(result.release_blockers);
      setFinalResultMessage({
        create: "FinalResultSnapshot created from the closed terminal round.",
        signoff: "Closeout release signoff recorded.",
        release: "Participant final results are released from the canonical snapshot.",
        archive: "Final results archived with snapshot hashes preserved.",
      }[action]);
    } catch (error) {
      setFinalResultError(error instanceof Error ? error.message : "Unable to update final results.");
    } finally {
      setFinalResultBusy(null);
    }
  }

  async function submitParticipantRoundOne() {
    if (!workflow.study || !workflow.version) {
      setParticipantError("No active study version is selected.");
      return;
    }

    if (!participantConsentChecked) {
      setParticipantError("Consent acknowledgement is required before submitting.");
      return;
    }

    if (!participantOrientationComplete) {
      setParticipantError("participant_orientation_required");
      return;
    }

    const activeQuestions = roundOneQuestions(wizard);
    const answerMap = {
      ...participantRoundOneAnswers,
      ...(activeQuestions.length === 1 && !participantRoundOneAnswers[activeQuestions[0]!.id]
        ? { [activeQuestions[0]!.id]: participantResponseText }
        : {}),
    };
    const missingRequired = activeQuestions.find((question) =>
      question.requiredForRound1Response && !answerMap[question.id]?.trim()
    );
    if (missingRequired) {
      setParticipantError(`${questionLabel(missingRequired, activeQuestions.indexOf(missingRequired))} response is required.`);
      return;
    }

    setParticipantBusy(true);
    setParticipantError(null);
    setParticipantMessage(null);

    try {
      const submittedAnswers = roundOneAnswerInputs(answerMap, activeQuestions);
      const submittedText = firstRoundOneAnswerText(answerMap, activeQuestions);
      const roundOneConfig = roundConfigs.find((config) => config.round_number === 1);
      if (!roundOneConfig && workflow.version.opened_round1_at) {
        await conductorApi.saveRoundConfig(workflow.study.id, workflow.version.id, 1, "study_owner", {
          task_type: "open_text",
          title: roundOneSetup.title,
          prompt: roundOneSetup.prompt,
          participant_instructions: roundOneSetup.participantInstructions,
          response_window_days: roundOneSetup.responseWindowDays,
          reminder_subject: roundOneSetup.reminderSubject,
          reminder_body: roundOneSetup.reminderBody,
          controlled_feedback_enabled: false,
          ai_curation_enabled: roundOneSetup.aiCurationEnabled,
          feedback_config: null,
          status: "Ready",
        });

        const consentText = [
          `# ${wizard.consentVersion}`,
          "",
          wizard.consentSummary,
          "",
          `Confidentiality: ${wizard.confidentialityStatement}`,
          "",
          `Withdrawal: ${wizard.withdrawalProcess}`,
        ].join("\n");
        const consent = await conductorApi.createConsentVersion(workflow.study.id, workflow.version.id, "study_owner", consentText);
        await conductorApi.activateConsentVersion(
          workflow.study.id,
          workflow.version.id,
          consent.consent_version.consent_version_id,
          "study_owner",
        );
        const repairedConfig = await conductorApi.openRound(workflow.study.id, workflow.version.id, 1, "study_owner");
        setRoundConfigs((current) => [
          ...current.filter((config) => config.round_number !== 1),
          repairedConfig.round_config,
        ]);
      }

      if (participantInviteToken) {
        await conductorApi.recordInvitationConsent(participantInviteToken);
        await conductorApi.submitInvitationRoundOneResponse(participantInviteToken, submittedAnswers);
      } else {
        const participantId = "demo-panelist-001";
        await conductorApi.recordConsent(workflow.study.id, workflow.version.id, participantId, "panelist");
        await conductorApi.submitRoundOneResponse(
          workflow.study.id,
          workflow.version.id,
          participantId,
          "panelist",
          submittedAnswers,
        );
      }
      setParticipantSubmittedRoundOneText(submittedText);
      setParticipantSubmittedRoundOneAnswers(Object.fromEntries(submittedAnswers.map((answer) => [answer.researchQuestionId, answer.text])));
      setParticipantRoundOneEditing(false);
      setParticipantRoundOneComplete(false);
      setParticipantMessage("Round 1 response submitted. Please review what was recorded.");
      setParticipantResponseText("");
      setParticipantRoundOneAnswers({});
      void loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setParticipantError(error instanceof Error ? error.message : "Unable to submit Round 1 response.");
    } finally {
      setParticipantBusy(false);
    }
  }

  async function completeParticipantOrientation() {
    if (!workflow.study || !workflow.version) {
      setParticipantError("No active study version is selected.");
      return;
    }

    setParticipantBusy(true);
    setParticipantError(null);
    setParticipantMessage(null);

    try {
      if (participantInviteToken) {
        const result = await conductorApi.completeInvitationOrientation(participantInviteToken);
        setParticipantInvite((current) => current ? { ...current, orientation_completion: result.orientation_completion } : current);
      } else {
        const result = await conductorApi.completeParticipantOrientation(
          workflow.study.id,
          workflow.version.id,
          "demo-panelist-001",
          "study_owner",
        );
        setParticipantInvite((current) => current ? { ...current, orientation_completion: result.orientation_completion } : current);
      }
      setParticipantOrientationComplete(true);
      setParticipantMessage("Study orientation completed. You may begin Round 1.");
    } catch (error) {
      setParticipantError(error instanceof Error ? error.message : "Unable to complete study orientation.");
    } finally {
      setParticipantBusy(false);
    }
  }

  function editSubmittedRoundOneResponse() {
    if (!participantSubmittedRoundOneText) return;
    setParticipantResponseText(participantSubmittedRoundOneText);
    if (participantSubmittedRoundOneAnswers) setParticipantRoundOneAnswers(participantSubmittedRoundOneAnswers);
    setParticipantRoundOneEditing(true);
    setParticipantRoundOneComplete(false);
    setParticipantMessage("You can revise your Round 1 response below.");
    setParticipantError(null);
  }

  function finishRoundOneTask() {
    setParticipantRoundOneEditing(false);
    setParticipantRoundOneComplete(true);
    setParticipantResponseText("");
    setParticipantRoundOneAnswers({});
    setParticipantMessage("Round 1 task complete. Your submitted response is recorded.");
    setParticipantError(null);
  }

  async function createManualItemFromResponse(response: ResponseRecord, entry?: RoundOneResponseEntry) {
    if (!workflow.study || !workflow.version) return;
    const text = entry?.text ?? responseOpenText(response.response_json);
    if (!text) {
      setRuntimeData((current) => ({ ...current, error: "The selected response does not contain open text.", message: null }));
      return;
    }

    setRuntimeActionBusy(`manual-${response.response_id}-${entry?.researchQuestionId ?? "legacy"}`);
    try {
      await conductorApi.createItem(workflow.study.id, workflow.version.id, role, {
        text,
        round_number: 2,
        provenance_type: "PanelDerived",
        provenance_links: [{
          source_type: "response",
          source_id: response.response_id,
          source_round_number: 1,
          excerpt: excerpt(entry ? `${entry.researchQuestionLabel}: ${text}` : text),
        }],
        rationale: "Human curator preserved this Round 1 response as a candidate Round 2 item.",
      });
      setRuntimeMessage("Candidate item created from Round 1 response.");
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRuntimeError(error, "Unable to create candidate item.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function synthesizeRoundTwoCandidates() {
    await synthesizeRoundCandidates(2);
  }

  async function synthesizeRoundCandidates(targetRoundNumber: number) {
    if (!workflow.study || !workflow.version) return;

    setRuntimeActionBusy(`synthesize-r${targetRoundNumber}`);
    try {
      await conductorApi.synthesizeInterRound(workflow.study.id, workflow.version.id, role, targetRoundNumber);
      setRuntimeMessage(`AI Suggestion (Not Final) created for Round ${targetRoundNumber}.`);
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRuntimeError(error, `Unable to synthesize Round ${targetRoundNumber} candidates.`);
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function acceptSuggestion(suggestion: AISuggestionRecord) {
    if (!workflow.study || !workflow.version) return;

    setRuntimeActionBusy(`accept-${suggestion.suggestion_id}`);
    try {
      await conductorApi.decideAiSuggestion(workflow.study.id, workflow.version.id, suggestion.suggestion_id, role, "Accepted");
      setRuntimeMessage("AI suggestion accepted for materialization.");
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRuntimeError(error, "Unable to accept AI suggestion.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function materializeSuggestion(suggestion: AISuggestionRecord) {
    if (!workflow.study || !workflow.version) return;
    const output = suggestion.output_json && typeof suggestion.output_json === "object" ? suggestion.output_json as Record<string, unknown> : {};
    const candidates = Array.isArray(output.candidates) ? output.candidates : [];
    const candidateIds = candidates.flatMap((candidate) => {
      if (!candidate || typeof candidate !== "object") return [];
      const id = (candidate as Record<string, unknown>).candidate_id;
      return typeof id === "string" ? [id] : [];
    });
    const rationales = Object.fromEntries(
      candidates.flatMap((candidate) => {
        if (!candidate || typeof candidate !== "object") return [];
        const record = candidate as Record<string, unknown>;
        if (record.requires_human_rationale !== true || typeof record.candidate_id !== "string") return [];
        return [[record.candidate_id, "Human curator confirmed grouped Round 1 responses preserve the same meaning."]];
      }),
    );

    setRuntimeActionBusy(`materialize-${suggestion.suggestion_id}`);
    try {
      await conductorApi.materializeSuggestionItems(
        workflow.study.id,
        workflow.version.id,
        suggestion.suggestion_id,
        role,
        candidateIds,
        rationales,
      );
      setRuntimeMessage("Candidate items created with provenance links.");
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRuntimeError(error, "Unable to create items from AI suggestion.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function signoffSuggestionRelease(suggestion: AISuggestionRecord) {
    if (!workflow.study || !workflow.version) return;

    setRuntimeActionBusy(`signoff-${suggestion.suggestion_id}`);
    try {
      await conductorApi.signoffAiSuggestionRelease(workflow.study.id, workflow.version.id, suggestion.suggestion_id, role);
      setRuntimeMessage("Release signoff recorded for this AI suggestion.");
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRuntimeError(error, "Unable to record AI release signoff.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function publishItem(item: ItemRecord) {
    if (!workflow.study || !workflow.version) return;

    setRuntimeActionBusy(`publish-${item.item_id}`);
    try {
      await conductorApi.publishItem(workflow.study.id, workflow.version.id, item.item_id, role);
      setRuntimeMessage("Round 2 item published for participant rating.");
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRuntimeError(error, "Unable to publish item.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function editItemText(item: ItemRecord) {
    if (!workflow.study || !workflow.version) return;
    const revised = window.prompt("Edit candidate wording. Preserve meaning and document rationale in the audit trail.", item.text);
    if (!revised || revised.trim() === item.text.trim()) return;

    setRuntimeActionBusy(`edit-${item.item_id}`);
    try {
      await conductorApi.updateItem(workflow.study.id, workflow.version.id, item.item_id, role, {
        text: revised.trim(),
        rationale: "Human curation edit from frontend.",
      });
      setRuntimeMessage("Candidate item wording updated.");
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRuntimeError(error, "Unable to edit item.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function rejectItem(item: ItemRecord) {
    if (!workflow.study || !workflow.version) return;
    const confirmed = window.confirm("Reject this candidate item? The record and provenance remain in the audit trail.");
    if (!confirmed) return;

    setRuntimeActionBusy(`reject-${item.item_id}`);
    try {
      await conductorApi.updateItem(workflow.study.id, workflow.version.id, item.item_id, role, {
        status: "Rejected",
        rationale: "Human curator rejected this candidate item.",
      });
      setRuntimeMessage("Candidate item rejected.");
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRuntimeError(error, "Unable to reject item.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function splitItem(item: ItemRecord) {
    if (!workflow.study || !workflow.version) return;
    const raw = window.prompt("Split into two or more statements. Separate each new statement with a semicolon.", item.text);
    const newTexts = raw?.split(";").map((entry) => entry.trim()).filter(Boolean) ?? [];
    if (newTexts.length < 2) return;

    setRuntimeActionBusy(`split-${item.item_id}`);
    try {
      await conductorApi.splitItem(workflow.study.id, workflow.version.id, item.item_id, role, {
        new_texts: newTexts,
        rationale: "Human curator split a multi-concept candidate item.",
      });
      setRuntimeMessage("Candidate item split into new draft items.");
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRuntimeError(error, "Unable to split item.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function mergeItemInto(item: ItemRecord, target: ItemRecord) {
    if (!workflow.study || !workflow.version) return;

    setRuntimeActionBusy(`merge-${item.item_id}`);
    try {
      await conductorApi.mergeItems(workflow.study.id, workflow.version.id, role, {
        from_item_ids: [item.item_id],
        to_item_id: target.item_id,
        rationale: "Human curator documented that these candidate items should be interpreted together.",
      });
      await conductorApi.updateItem(workflow.study.id, workflow.version.id, item.item_id, role, {
        status: "Rejected",
        rationale: `Merged into ${target.item_id}.`,
      });
      setRuntimeMessage("Candidate items merged with rationale; source item rejected to avoid duplication.");
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRuntimeError(error, "Unable to merge items.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  function updateRoundTwoRating(itemId: string, rating: number) {
    setRoundTwoRatings((current) => ({ ...current, [itemId]: rating }));
  }

  function updateRoundTwoRationale(itemId: string, rationale: string) {
    setRoundTwoRationales((current) => ({ ...current, [itemId]: rationale }));
  }

  function updateParticipantRoundOneAnswer(questionId: string, value: string) {
    setParticipantRoundOneAnswers((current) => ({ ...current, [questionId]: value }));
    const firstQuestionId = roundOneQuestions(wizard)[0]?.id;
    if (questionId === firstQuestionId) setParticipantResponseText(value);
  }

  function updateMagicRoundOneAnswer(questionId: string, value: string) {
    setMagicRoundOneAnswers((current) => ({ ...current, [questionId]: value }));
    const firstQuestionId = (magicContext?.research_questions?.length ? magicContext.research_questions : [fallbackResearchQuestion()])[0]?.id;
    if (questionId === firstQuestionId) setMagicResponseText(value);
  }

  async function saveParticipantRoundOneDraft() {
    setParticipantBusy(true);
    setParticipantError(null);
    try {
      const questions = roundOneQuestions(wizard);
      const answers = {
        ...participantRoundOneAnswers,
        ...(questions.length === 1 && !participantRoundOneAnswers[questions[0]!.id]
          ? { [questions[0]!.id]: participantResponseText }
          : {}),
      };
      const draftJson = {
        responses: roundOneAnswerInputs(answers, questions),
        text: firstRoundOneAnswerText(answers, questions),
      };
      if (participantInviteToken) {
        const result = await conductorApi.saveInvitationDraft(participantInviteToken, 1, draftJson);
        setParticipantDraftSavedAt(result.draft.updated_at);
      } else {
        setParticipantDraftSavedAt(new Date().toISOString());
      }
      setParticipantMessage("Progress saved. Submit when you are ready for the study team to receive it.");
    } catch (error) {
      setParticipantError(error instanceof Error ? error.message : "Unable to save progress.");
    } finally {
      setParticipantBusy(false);
    }
  }

  async function saveParticipantRatingDraft(roundNumber: number) {
    setParticipantBusy(true);
    setParticipantError(null);
    try {
      if (participantInviteToken) {
        const result = await conductorApi.saveInvitationDraft(participantInviteToken, roundNumber, {
          ratings: roundTwoRatings,
          rationales: roundTwoRationales,
        });
        setParticipantRatingDraftSavedAt((current) => ({ ...current, [roundNumber]: result.draft.updated_at }));
      } else {
        setParticipantRatingDraftSavedAt((current) => ({ ...current, [roundNumber]: new Date().toISOString() }));
      }
      setParticipantMessage(`Round ${roundNumber} progress saved. Submit when you are ready for the study team to receive it.`);
    } catch (error) {
      setParticipantError(error instanceof Error ? error.message : "Unable to save progress.");
    } finally {
      setParticipantBusy(false);
    }
  }

  async function submitRoundTwoRatings() {
    if (!workflow.study || !workflow.version) {
      setParticipantError("No active study version is selected.");
      return;
    }

    const participantId = "demo-panelist-001";
    const currentRound = roundConfigs.find((config) => config.round_number > 1 && config.status === "Open")?.round_number ?? 2;
    const currentItems = runtimeData.ratingRoundItems[currentRound] ?? runtimeData.roundTwoItems;
    const missing = currentItems.some((item) => !roundTwoRatings[item.item_id]);
    if (missing) {
      setParticipantError(`A response option is required for each available Round ${currentRound} statement.`);
      return;
    }

    setParticipantBusy(true);
    setParticipantError(null);
    setParticipantMessage(null);

    try {
      if (participantInviteToken) {
        await conductorApi.recordInvitationConsent(participantInviteToken);
      } else {
        await conductorApi.recordConsent(workflow.study.id, workflow.version.id, participantId, "panelist");
      }
      for (const item of currentItems) {
        if (participantInviteToken) {
          await conductorApi.submitInvitationRating(
            participantInviteToken,
            currentRound,
            item.item_id,
            roundTwoRatings[item.item_id] ?? 0,
            "revise",
            roundTwoRationales[item.item_id] ?? "",
          );
        } else {
          await conductorApi.submitRating(
            workflow.study.id,
            workflow.version.id,
            currentRound,
            participantId,
            item.item_id,
            "panelist",
            roundTwoRatings[item.item_id] ?? 0,
            "revise",
            roundTwoRationales[item.item_id] ?? "",
          );
        }
      }
      const submittedRatings = Object.fromEntries(
        currentItems.map((item) => [item.item_id, roundTwoRatings[item.item_id] ?? 0]),
      );
      const submittedRationales = Object.fromEntries(
        currentItems.map((item) => [item.item_id, roundTwoRationales[item.item_id] ?? ""]),
      );
      setParticipantSubmittedRatings((current) => ({
        ...current,
        [currentRound]: submittedRatings,
      }));
      setParticipantSubmittedRationales((current) => ({
        ...current,
        [currentRound]: submittedRationales,
      }));
      setParticipantRatingRoundEditing((current) => ({
        ...current,
        [currentRound]: false,
      }));
      setParticipantRatingRoundComplete((current) => ({
        ...current,
        [currentRound]: false,
      }));
      setParticipantMessage(`Round ${currentRound} responses submitted. Please review what was recorded.`);
      setRoundTwoRatings({});
      setRoundTwoRationales({});
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setParticipantError(error instanceof Error ? error.message : "Unable to submit Round 2 ratings.");
    } finally {
      setParticipantBusy(false);
    }
  }

  function editSubmittedRatings(roundNumber: number) {
    const submitted = participantSubmittedRatings[roundNumber];
    if (!submitted) return;
    setRoundTwoRatings(submitted);
    setRoundTwoRationales(participantSubmittedRationales[roundNumber] ?? {});
    setParticipantRatingRoundEditing((current) => ({
      ...current,
      [roundNumber]: true,
    }));
    setParticipantRatingRoundComplete((current) => ({
      ...current,
      [roundNumber]: false,
    }));
    setParticipantMessage(`You can revise your Round ${roundNumber} responses below.`);
    setParticipantError(null);
  }

  function finishRatingRoundTask(roundNumber: number) {
    setParticipantRatingRoundEditing((current) => ({
      ...current,
      [roundNumber]: false,
    }));
    setParticipantRatingRoundComplete((current) => ({
      ...current,
      [roundNumber]: true,
    }));
    setRoundTwoRatings({});
    setRoundTwoRationales({});
    setParticipantMessage(`Round ${roundNumber} task complete. Your submitted responses are recorded.`);
    setParticipantError(null);
  }

  async function withdrawParticipantInvitation() {
    if (!participantInviteToken) {
      setParticipantError("Withdrawal is available from a participant invitation link.");
      return;
    }

    setParticipantBusy(true);
    setParticipantError(null);
    setParticipantMessage(null);

    try {
      await conductorApi.withdrawInvitationConsent(participantInviteToken);
      setParticipantConsentChecked(false);
      setParticipantWithdrawn(true);
      setParticipantMessage("Withdrawal recorded for future rounds. Prior submitted responses may remain in historical study data according to the study protocol and consent terms.");
    } catch (error) {
      setParticipantError(error instanceof Error ? error.message : "Unable to record withdrawal.");
    } finally {
      setParticipantBusy(false);
    }
  }

  async function requestParticipantDeletionReview() {
    if (!participantInviteToken) {
      setParticipantError("A retention or deletion review is available from a participant invitation link.");
      return;
    }

    setParticipantBusy(true);
    setParticipantError(null);
    setParticipantMessage(null);

    try {
      await conductorApi.requestInvitationDeletionReview(
        participantInviteToken,
        "Participant requested review of retention, deletion, or restricted-use options.",
      );
      setParticipantMessage("Retention/deletion review request recorded. The research team will review it under the study retention policy.");
    } catch (error) {
      setParticipantError(error instanceof Error ? error.message : "Unable to request retention/deletion review.");
    } finally {
      setParticipantBusy(false);
    }
  }

  async function reportParticipantIssue(input: ParticipantIssueInput) {
    if (magicContext) {
      setMagicBusy(true);
      setMagicError(null);
      setMagicMessage(null);
      try {
        const result = await conductorApi.reportMagicParticipantIssue(input);
        setRuntimeData((current) => ({ ...current, participantIssues: [result.issue, ...current.participantIssues] }));
        setMagicMessage(participantCopy.trouble.success);
      } catch (error) {
        setMagicError(error instanceof Error ? error.message : "Unable to send issue note.");
      } finally {
        setMagicBusy(false);
      }
      return;
    }

    if (!participantInviteToken) {
      if (workflow.study && workflow.version) {
        setParticipantBusy(true);
        setParticipantError(null);
        setParticipantMessage(null);
        try {
          const result = await conductorApi.reportParticipantIssue(
            workflow.study.id,
            workflow.version.id,
            DEMO_PARTICIPANT_ID,
            "panelist",
            input,
          );
          setRuntimeData((current) => ({ ...current, participantIssues: [result.issue, ...current.participantIssues] }));
          setParticipantMessage(participantCopy.trouble.success);
        } catch (error) {
          setParticipantError(error instanceof Error ? error.message : "Unable to send issue note.");
        } finally {
          setParticipantBusy(false);
        }
        return;
      }

      setParticipantError(null);
      const now = new Date().toISOString();
      const issue: ParticipantIssue = {
        issue_id: `local-${Date.now()}`,
        study_id: workflow.study?.id ?? "local-preview-study",
        version_id: workflow.version?.id ?? "local-preview-version",
        participant_id: DEMO_PARTICIPANT_ID,
        participant_alias: "participant-preview",
        round_number: input.round_number,
        page_context: input.page_context,
        issue_type: input.issue_type,
        note: input.note.trim().slice(0, 1200),
        status: "open",
        staff_response_note: null,
        reviewed_at: null,
        closed_at: null,
        responded_at: null,
        responded_by_user_id: null,
        created_at: now,
        updated_at: now,
        created_by: "staff_preview",
      };
      setRuntimeData((current) => ({ ...current, participantIssues: [issue, ...current.participantIssues] }));
      setParticipantMessage(participantCopy.trouble.success);
      return;
    }

    setParticipantBusy(true);
    setParticipantError(null);
    setParticipantMessage(null);

    try {
      const result = await conductorApi.reportInvitationParticipantIssue(participantInviteToken, input);
      setRuntimeData((current) => ({ ...current, participantIssues: [result.issue, ...current.participantIssues] }));
      setParticipantMessage(participantCopy.trouble.success);
    } catch (error) {
      setParticipantError(error instanceof Error ? error.message : "Unable to send issue note.");
    } finally {
      setParticipantBusy(false);
    }
  }

  async function respondParticipantIssue(issueId: string, status: ParticipantIssue["status"], responseNote: string) {
    if (!workflow.study || !workflow.version) {
      const now = new Date().toISOString();
      setRuntimeData((current) => ({
        ...current,
        participantIssues: current.participantIssues.map((issue) =>
          issue.issue_id === issueId
            ? {
                ...issue,
                status,
                staff_response_note: responseNote.trim() || null,
                reviewed_at: issue.reviewed_at ?? (status !== "open" || responseNote.trim() ? now : null),
                closed_at: status === "closed" ? issue.closed_at ?? now : null,
                responded_at: responseNote.trim() && responseNote.trim() !== issue.staff_response_note ? now : issue.responded_at,
                responded_by_user_id: responseNote.trim() && responseNote.trim() !== issue.staff_response_note ? role : issue.responded_by_user_id,
                updated_at: now,
              }
            : issue,
        ),
        message: "Participant issue response recorded in this local preview.",
        error: null,
      }));
      return;
    }

    setRuntimeActionBusy(`participant-issue-${issueId}`);
    try {
      const result = await conductorApi.respondParticipantIssue(
        workflow.study.id,
        workflow.version.id,
        role,
        issueId,
        { status, staff_response_note: responseNote },
      );
      setRuntimeData((current) => ({
        ...current,
        participantIssues: current.participantIssues.map((issue) =>
          issue.issue_id === issueId ? result.issue : issue,
        ),
        message: "Participant issue response recorded.",
        error: null,
      }));
    } catch (error) {
      setRuntimeError(error, "Unable to respond to participant issue note.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function submitMagicRound() {
    if (!magicContext) return;
    setMagicBusy(true);
    setMagicError(null);
    setMagicMessage(null);
    try {
      const roundNumber = magicContext.round.round_number;
      if (roundNumber === 1) {
        const questions = magicContext.research_questions?.length ? magicContext.research_questions : [fallbackResearchQuestion()];
        const answers = {
          ...magicRoundOneAnswers,
          ...(questions.length === 1 && !magicRoundOneAnswers[questions[0]!.id]
            ? { [questions[0]!.id]: magicResponseText }
            : {}),
        };
        const missingRequired = questions.find((question) => question.requiredForRound1Response && !answers[question.id]?.trim());
        if (missingRequired) throw new Error(`${questionLabel(missingRequired, questions.indexOf(missingRequired))} response is required.`);
        await conductorApi.submitMagicRoundOneResponse(roundNumber, roundOneAnswerInputs(answers, questions));
      } else {
        if (magicItems.some((item) => !magicRatings[item.item_id])) {
          throw new Error(`A response option is required for each Round ${roundNumber} statement.`);
        }
        for (const item of magicItems) {
          await conductorApi.submitMagicRating(
            roundNumber,
            item.item_id,
            Number(magicRatings[item.item_id]),
            "revise",
            magicRationales[item.item_id] ?? "",
          );
        }
      }
      setMagicContext((current) => current ? { ...current, round: { ...current.round, status: "completed" } } : current);
      setMagicMessage("Round response submitted. You can close this page or return through your normal participant route.");
    } catch (error) {
      setMagicError(error instanceof Error ? error.message : "Unable to submit from this secure link.");
    } finally {
      setMagicBusy(false);
    }
  }

  async function declineMagicRound() {
    if (!magicContext) return;
    setMagicBusy(true);
    setMagicError(null);
    setMagicMessage(null);
    try {
      await conductorApi.declineMagicRound(magicContext.round.round_number);
      setMagicContext((current) => current ? { ...current, round: { ...current.round, status: "declined" } } : current);
      setMagicMessage("Round declined. Participation remains voluntary.");
    } catch (error) {
      setMagicError(error instanceof Error ? error.message : "Unable to decline this round.");
    } finally {
      setMagicBusy(false);
    }
  }

  async function requestOutputExport(outputId: string) {
    if (!workflow.study || !workflow.version) {
      setRuntimeData((current) => ({ ...current, error: "Open a backend study before preparing an export.", message: null }));
      return;
    }

    setRuntimeActionBusy(`export-${outputId}`);
    try {
      if (outputId === "final-delphi-report") {
        const result = await conductorApi.exportReport(workflow.study.id, workflow.version.id, role);
        const packages = await conductorApi.listExportPackages(workflow.study.id, workflow.version.id, role);
        setRuntimeData((current) => ({
          ...current,
          exportReport: result.report,
          exportPackages: packages.export_packages,
          selectedExportPackageId: result.export_package?.export_package_id ?? packages.export_packages.at(-1)?.export_package_id ?? current.selectedExportPackageId,
          message: "Final Delphi report package prepared and audit logged.",
          error: null,
        }));
      } else {
        const result = await conductorApi.createExportPackage(
          workflow.study.id,
          workflow.version.id,
          role,
          outputId as ExportPackage["export_type"],
        );
        const packages = await conductorApi.listExportPackages(workflow.study.id, workflow.version.id, role);
        setRuntimeData((current) => ({
          ...current,
          exportPackages: packages.export_packages,
          selectedExportPackageId: result.export_package.export_package_id,
          message: `${outputModelRegistry.find((output) => output.id === outputId)?.label ?? "Export"} package prepared and audit logged.`,
          error: null,
        }));
      }
    } catch (error) {
      setRuntimeError(error, "Unable to prepare export.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function selectExportPackage(packageId: string) {
    if (!workflow.study || !workflow.version) return;
    setRuntimeActionBusy(`files-${packageId}`);

    try {
      const result = await conductorApi.listExportPackageFiles(workflow.study.id, workflow.version.id, packageId, role);
      setRuntimeData((current) => ({
        ...current,
        selectedExportPackageId: packageId,
        exportPackageFiles: {
          ...current.exportPackageFiles,
          [packageId]: result.files,
        },
        error: null,
      }));
    } catch (error) {
      setRuntimeError(error, "Unable to load export package files.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function reviewExportPackage(packageId: string, reviewStatus: "approved" | "rejected", note: string) {
    if (!workflow.study || !workflow.version) return;

    setRuntimeActionBusy(`review-${packageId}`);
    try {
      const result = await conductorApi.reviewExportPackage(
        workflow.study.id,
        workflow.version.id,
        packageId,
        role,
        reviewStatus,
        note,
      );
      setRuntimeData((current) => ({
        ...current,
        exportPackages: current.exportPackages.map((pkg) =>
          pkg.export_package_id === packageId ? { ...pkg, reviews: result.reviews } : pkg,
        ),
        message: `Export package ${reviewStatus}. Review event audit logged.`,
        error: null,
      }));
    } catch (error) {
      setRuntimeError(error, "Unable to review export package.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function downloadExportPackageFile(packageId: string, fileId: string) {
    if (!workflow.study || !workflow.version) return;

    setRuntimeActionBusy(`download-${fileId}`);
    try {
      const result = await conductorApi.downloadExportPackageFile(
        workflow.study.id,
        workflow.version.id,
        packageId,
        fileId,
        role,
      );
      downloadPackageFile(result.file);
      setRuntimeData((current) => ({
        ...current,
        message: `${result.file.path} downloaded and audit logged.`,
        error: null,
      }));
    } catch (error) {
      setRuntimeError(error, "Unable to download export package file.");
    } finally {
      setRuntimeActionBusy(null);
    }
  }

  async function archiveSavedStudy(record: SavedStudyRecord) {
    const confirmed = window.confirm(
      `Archive "${record.study.title}"?\n\nThis will hide it from the default Saved Studies list but keep the study records and audit trail.`,
    );
    if (!confirmed) return;

    setSavedStudiesError(null);

    try {
      await conductorApi.archiveStudy(record.study.id, role);
      if (workflow.study?.id === record.study.id) {
        setWorkflow(initialWorkflow);
        setWizard(defaultWizardState);
        setActiveWizardStep("purpose");
      }
      await loadSavedStudies();
    } catch (error) {
      setSavedStudiesError(error instanceof Error ? error.message : "Unable to archive study.");
    }
  }

  async function archiveSmokeTestStudies() {
    const candidates = savedStudies.filter((record) =>
      /smoke|test|debug|transition|round config|title sync/i.test(record.study.title),
    );

    if (candidates.length === 0) {
      setSavedStudiesError("No test or debug workspaces were found in the visible saved studies list.");
      return;
    }

    const confirmed = window.confirm(
      `Archive ${candidates.length} test or debug study workspace${candidates.length === 1 ? "" : "s"}?\n\nRecords and audit trails are retained; they are hidden from the default Saved Studies list.`,
    );
    if (!confirmed) return;

    try {
      for (const record of candidates) {
        await conductorApi.archiveStudy(record.study.id, role);
      }
      if (workflow.study && candidates.some((record) => record.study.id === workflow.study?.id)) {
        setWorkflow(initialWorkflow);
        setWizard(defaultWizardState);
        setActiveWizardStep("purpose");
      }
      await loadSavedStudies();
    } catch (error) {
      setSavedStudiesError(error instanceof Error ? error.message : "Unable to archive test or debug study workspaces.");
    }
  }

  async function runWorkflowStep(step: WorkflowStep) {
    setWorkflow((current) => ({ ...current, busyStep: step, error: null, lastMessage: null }));

    try {
      if (step === "create-study") {
        const result = await conductorApi.createStudy(role, wizard);
        setWorkflow((current) => ({
          ...current,
          study: result.study,
          version: null,
          signoffs: [],
          busyStep: null,
          lastMessage: "Study created in the backend.",
        }));
        void loadSavedStudies();
        return;
      }

      if (step === "create-version") {
        if (!workflow.study) throw new Error("Create a study first.");
        const result = await conductorApi.createVersion(workflow.study.id, role);
        setWorkflow((current) => ({
          ...current,
          version: result.studyVersion,
          signoffs: [],
          busyStep: null,
          lastMessage: "Draft StudyVersion created.",
        }));
        void loadSavedStudies();
        return;
      }

      if (step === "save-wizard-packet") {
        let study = workflow.study;
        let version = workflow.version;

        if (!study) {
          const result = await conductorApi.createStudy(role, wizard);
          study = result.study;
        }

        if (!version) {
          const result = await conductorApi.createVersion(study.id, role);
          version = result.studyVersion;
        }

        if (version.status !== "Draft") {
          throw new Error("Study Builder packet is locked after governance submission.");
        }

        const result = await conductorApi.saveWizardPacket(study.id, version.id, role, wizard);
        setWorkflow((current) => ({
          ...current,
          study: { ...study, title: wizard.title, description: wizard.description },
          version: result.studyVersion,
          signoffs: version?.id === current.version?.id ? current.signoffs : [],
          busyStep: null,
          lastMessage: "Study Builder packet saved.",
        }));
        void loadSavedStudies();
        return;
      }

      if (!workflow.study || !workflow.version) {
        throw new Error("Create a study and version first.");
      }

      if (step === "set-design") {
        const result = await conductorApi.setDesign(workflow.study.id, workflow.version.id, role, wizard);
        setWorkflow((current) => ({
          ...current,
          version: result.studyVersion,
          busyStep: null,
          lastMessage: "Modified Delphi design saved.",
        }));
        void loadSavedStudies();
        return;
      }

      if (step === "set-consensus") {
        const result = await conductorApi.setConsensusRule(workflow.study.id, workflow.version.id, role, wizard);
        setWorkflow((current) => ({
          ...current,
          version: result.studyVersion,
          busyStep: null,
          lastMessage: "Consensus threshold saved before launch.",
        }));
        void loadSavedStudies();
        return;
      }

      if (step === "submit") {
        const result = await conductorApi.submitForSignoff(workflow.study.id, workflow.version.id, role);
        setWorkflow((current) => ({
          ...current,
          version: result.studyVersion,
          busyStep: null,
          lastMessage: "StudyVersion submitted for governance signoff.",
        }));
        void loadSavedStudies();
        return;
      }

      if (step === "owner-signoff" || step === "steward-signoff") {
        const result = await conductorApi.signoff(workflow.study.id, workflow.version.id, role);
        setWorkflow((current) => ({
          ...current,
          signoffs: [
            ...current.signoffs.filter(
              (signoff) => signoff.required_role !== result.signoff.required_role,
            ),
            result.signoff,
          ],
          busyStep: null,
          lastMessage: `${result.signoff.required_role} signoff recorded.`,
        }));
        void loadSavedStudies();
        return;
      }

      if (step === "activate") {
        const result = await conductorApi.activate(workflow.study.id, workflow.version.id, role);
        setWorkflow((current) => ({
          ...current,
          version: result.studyVersion,
          busyStep: null,
          lastMessage: "StudyVersion activated.",
        }));
        void loadSavedStudies();
        return;
      }

      await conductorApi.saveRoundConfig(workflow.study.id, workflow.version.id, 1, role, {
        task_type: "open_text",
        title: roundOneSetup.title,
        prompt: roundOneSetup.prompt,
        participant_instructions: roundOneSetup.participantInstructions,
        response_window_days: roundOneSetup.responseWindowDays,
        reminder_subject: roundOneSetup.reminderSubject,
        reminder_body: roundOneSetup.reminderBody,
        controlled_feedback_enabled: false,
        ai_curation_enabled: roundOneSetup.aiCurationEnabled,
        feedback_config: null,
        status: "Ready",
      });
      const consentText = [
        `# ${wizard.consentVersion}`,
        "",
        wizard.consentSummary,
        "",
        `Confidentiality: ${wizard.confidentialityStatement}`,
        "",
        `Withdrawal: ${wizard.withdrawalProcess}`,
      ].join("\n");
      const consent = await conductorApi.createConsentVersion(workflow.study.id, workflow.version.id, role, consentText);
      await conductorApi.activateConsentVersion(
        workflow.study.id,
        workflow.version.id,
        consent.consent_version.consent_version_id,
        role,
      );
      const openedRound = await conductorApi.openRound(workflow.study.id, workflow.version.id, 1, role);
      const openedAt = new Date().toISOString();
      setRoundConfigs((current) => [
        ...current.filter((config) => config.round_number !== 1),
        openedRound.round_config,
      ]);
      setWorkflow((current) => ({
        ...current,
        version: current.version ? { ...current.version, opened_round1_at: current.version.opened_round1_at ?? openedAt } : current.version,
        busyStep: null,
        lastMessage: "Round 1 opened with participant task and consent text.",
      }));
      void loadSavedStudies();
    } catch (error) {
      setWorkflow((current) => ({
        ...current,
        busyStep: null,
        error: error instanceof Error ? error.message : "Workflow action failed.",
      }));
    }
  }

  const visibleModule = canAccessModule(
    role,
    moduleRegistry.find((module) => module.id === activeModule) ?? moduleRegistry[1],
  )
    ? activeModule
    : navigationModules[0]?.id ?? accessibleModules[0]?.id ?? "participant";
  const nextAction = buildNextAction({ workflow, wizard, roundConfigs, runtimeData });

  async function runNextActionCommand(command: NonNullable<NextAction["command"]>) {
    if (command.kind === "transition-round") {
      setActiveModule("round-manager");
      await transitionRound(command.roundNumber, command.action);
    }
  }

  function navigateToCitation() {
    setActiveModule("about");
    window.setTimeout(() => {
      document.getElementById("how-to-cite-this-tool")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);
  }

  return (
    <main className={role === "panelist" ? "app-shell participant-mode" : "app-shell"}>
      <aside className="sidebar" aria-label="Application modules">
        <div className="brand-block">
          <span className="brand-mark">eD</span>
          <div>
            <strong>Delphi Commons</strong>
            <small>Method-safe research platform</small>
          </div>
        </div>

        <label className="role-picker">
          <span>Current role</span>
          <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
            {roleOrder.map((entry) => (
              <option key={entry} value={entry}>
                {roleLabels[entry]}
              </option>
            ))}
          </select>
        </label>

        <nav className="module-nav">
          {navigationModules.map((module) => (
            <button
              className={visibleModule === module.id ? "nav-item active" : "nav-item"}
              key={module.id}
              onClick={() => setActiveModule(module.id)}
              type="button"
            >
              <span>{module.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <div className="reference-bar">
          <nav aria-label="Reference pages">
            {headerModules.map((module) => (
              <button
                className={visibleModule === module.id ? "reference-link active" : "reference-link"}
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                type="button"
              >
                {module.label}
              </button>
            ))}
          </nav>
        </div>

        <header className="topbar">
          <div>
            <span className="eyebrow">Active study</span>
            <h1>{activeTitle}</h1>
          </div>
          <div className="topbar-actions">
            <StatusBadge risk={activeStatus === "Active" ? "success" : "warning"} label={formatStatus(activeStatus)} />
            <StatusBadge risk={consensusLocked ? "locked" : "warning"} label={consensusLocked ? "Consensus threshold locked" : "Consensus threshold draft"} />
          </div>
        </header>

        <NextActionPanel nextAction={nextAction} onNavigate={setActiveModule} onRunCommand={runNextActionCommand} />

        <ModuleRenderer
          activeModule={visibleModule}
          role={role}
          study={selectedStudy}
          apiMode={apiBoundary.mode}
          apiBaseUrl={apiBoundary.baseUrl}
          knownStudies={mockStudies.length}
          listStudiesLabel={studyApi.listStudies.name}
          workflow={workflow}
          wizard={wizard}
          roundOneSetup={roundOneSetup}
          roundTwoSetup={roundTwoSetup}
          roundConfigs={roundConfigs}
          roundActionMessage={roundActionMessage}
          roundActionError={roundActionError}
          roundActionBusy={roundActionBusy}
          participantResponseText={participantResponseText}
          participantRoundOneAnswers={participantRoundOneAnswers}
          participantSubmittedRoundOneText={participantSubmittedRoundOneText}
          participantSubmittedRoundOneAnswers={participantSubmittedRoundOneAnswers}
          participantRoundOneEditing={participantRoundOneEditing}
          participantRoundOneComplete={participantRoundOneComplete}
          participantSubmittedRatings={participantSubmittedRatings}
          participantSubmittedRationales={participantSubmittedRationales}
          participantRatingRoundEditing={participantRatingRoundEditing}
          participantRatingRoundComplete={participantRatingRoundComplete}
          participantDraftSavedAt={participantDraftSavedAt}
          participantRatingDraftSavedAt={participantRatingDraftSavedAt}
          participantWithdrawn={participantWithdrawn}
          participantConsentChecked={participantConsentChecked}
          participantOrientationComplete={participantOrientationComplete}
          participantMessage={participantMessage}
          participantError={participantError}
          participantBusy={participantBusy}
          participantInvite={participantInvite}
          magicContext={magicContext}
          magicItems={magicItems}
          magicResponseText={magicResponseText}
          magicRoundOneAnswers={magicRoundOneAnswers}
          magicRatings={magicRatings}
          magicRationales={magicRationales}
          magicMessage={magicMessage}
          magicError={magicError}
          magicBusy={magicBusy}
          runtimeData={runtimeData}
          runtimeActionBusy={runtimeActionBusy}
          roundTwoRatings={roundTwoRatings}
          roundTwoRationales={roundTwoRationales}
          finalResultSnapshot={finalResultSnapshot}
          finalResultBlockers={finalResultBlockers}
          participantFinalResponses={participantFinalResponses}
          finalResultMessage={finalResultMessage}
          finalResultError={finalResultError}
          finalResultBusy={finalResultBusy}
          activeWizardStep={activeWizardStep}
          onWizardChange={setWizard}
          onWizardStepChange={setActiveWizardStep}
          onWorkflowStep={runWorkflowStep}
          onRoundOneSetupChange={setRoundOneSetup}
          onRoundTwoSetupChange={setRoundTwoSetup}
          onSaveRoundOneSetup={saveRoundOneConfiguration}
          onSaveRoundTwoSetup={saveRoundTwoConfiguration}
          onSaveRatingRoundSetup={saveRatingRoundConfiguration}
          onTransitionRound={transitionRound}
          onParticipantResponseChange={setParticipantResponseText}
          onParticipantRoundOneAnswerChange={updateParticipantRoundOneAnswer}
          onParticipantConsentChange={setParticipantConsentChecked}
          onCompleteParticipantOrientation={completeParticipantOrientation}
          onSubmitParticipantRoundOne={submitParticipantRoundOne}
          onEditSubmittedRoundOne={editSubmittedRoundOneResponse}
          onFinishRoundOneTask={finishRoundOneTask}
          onEditSubmittedRatings={editSubmittedRatings}
          onFinishRatingRoundTask={finishRatingRoundTask}
          onSaveParticipantRoundOneDraft={saveParticipantRoundOneDraft}
          onSaveParticipantRatingDraft={saveParticipantRatingDraft}
          onWithdrawParticipant={withdrawParticipantInvitation}
          onRequestDeletionReview={requestParticipantDeletionReview}
          onReportParticipantIssue={reportParticipantIssue}
          onMagicResponseTextChange={setMagicResponseText}
          onMagicRoundOneAnswerChange={updateMagicRoundOneAnswer}
          onMagicRatingChange={(itemId, rating) => setMagicRatings((current) => ({ ...current, [itemId]: rating }))}
          onMagicRationaleChange={(itemId, text) => setMagicRationales((current) => ({ ...current, [itemId]: text }))}
          onSubmitMagicRound={submitMagicRound}
          onDeclineMagicRound={declineMagicRound}
          onRefreshRuntimeData={loadRuntimeData}
          onCreateManualItemFromResponse={createManualItemFromResponse}
          onSynthesizeRoundTwoCandidates={synthesizeRoundTwoCandidates}
          onSynthesizeRoundCandidates={synthesizeRoundCandidates}
          onAcceptSuggestion={acceptSuggestion}
          onMaterializeSuggestion={materializeSuggestion}
          onSignoffSuggestionRelease={signoffSuggestionRelease}
          onPublishItem={publishItem}
          onEditItemText={editItemText}
          onRejectItem={rejectItem}
          onSplitItem={splitItem}
          onMergeItemInto={mergeItemInto}
          onRoundTwoRatingChange={updateRoundTwoRating}
          onRoundTwoRationaleChange={updateRoundTwoRationale}
          onSubmitRoundTwoRatings={submitRoundTwoRatings}
          onFinalResultAction={runFinalResultAction}
          onExportOutput={requestOutputExport}
          onSelectExportPackage={selectExportPackage}
          onReviewExportPackage={reviewExportPackage}
          onDownloadExportPackageFile={downloadExportPackageFile}
          savedStudies={savedStudies}
          savedStudiesLoading={savedStudiesLoading}
          savedStudiesError={savedStudiesError}
          onRefreshSavedStudies={loadSavedStudies}
          onOpenSavedStudy={openSavedStudy}
          onArchiveSavedStudy={archiveSavedStudy}
          onArchiveSmokeTestStudies={archiveSmokeTestStudies}
          onRespondParticipantIssue={respondParticipantIssue}
        />
        <footer className="app-footer">
          <button className="footer-link" onClick={navigateToCitation} type="button">
            Cite this tool
          </button>
        </footer>
      </section>
    </main>
  );
}

function ModuleRenderer({
  activeModule,
  role,
  study,
  apiMode,
  apiBaseUrl,
  knownStudies,
  listStudiesLabel,
  workflow,
  wizard,
  roundOneSetup,
  roundTwoSetup,
  roundConfigs,
  roundActionMessage,
  roundActionError,
  roundActionBusy,
  participantResponseText,
  participantRoundOneAnswers,
  participantSubmittedRoundOneText,
  participantSubmittedRoundOneAnswers,
  participantRoundOneEditing,
  participantRoundOneComplete,
  participantSubmittedRatings,
  participantSubmittedRationales,
  participantRatingRoundEditing,
  participantRatingRoundComplete,
  participantDraftSavedAt,
  participantRatingDraftSavedAt,
  participantWithdrawn,
  participantConsentChecked,
  participantOrientationComplete,
  participantMessage,
  participantError,
  participantBusy,
  participantInvite,
  magicContext,
  magicItems,
  magicResponseText,
  magicRoundOneAnswers,
  magicRatings,
  magicRationales,
  magicMessage,
  magicError,
  magicBusy,
  runtimeData,
  runtimeActionBusy,
  roundTwoRatings,
  roundTwoRationales,
  finalResultSnapshot,
  finalResultBlockers,
  participantFinalResponses,
  finalResultMessage,
  finalResultError,
  finalResultBusy,
  activeWizardStep,
  onWizardChange,
  onWizardStepChange,
  onWorkflowStep,
  onRoundOneSetupChange,
  onRoundTwoSetupChange,
  onSaveRoundOneSetup,
  onSaveRoundTwoSetup,
  onSaveRatingRoundSetup,
  onTransitionRound,
  onParticipantResponseChange,
  onParticipantRoundOneAnswerChange,
  onParticipantConsentChange,
  onCompleteParticipantOrientation,
  onSubmitParticipantRoundOne,
  onEditSubmittedRoundOne,
  onFinishRoundOneTask,
  onEditSubmittedRatings,
  onFinishRatingRoundTask,
  onSaveParticipantRoundOneDraft,
  onSaveParticipantRatingDraft,
  onWithdrawParticipant,
  onRequestDeletionReview,
  onReportParticipantIssue,
  onMagicResponseTextChange,
  onMagicRoundOneAnswerChange,
  onMagicRatingChange,
  onMagicRationaleChange,
  onSubmitMagicRound,
  onDeclineMagicRound,
  onRefreshRuntimeData,
  onCreateManualItemFromResponse,
  onSynthesizeRoundTwoCandidates,
  onSynthesizeRoundCandidates,
  onAcceptSuggestion,
  onMaterializeSuggestion,
  onSignoffSuggestionRelease,
  onPublishItem,
  onEditItemText,
  onRejectItem,
  onSplitItem,
  onMergeItemInto,
  onRoundTwoRatingChange,
  onRoundTwoRationaleChange,
  onSubmitRoundTwoRatings,
  onFinalResultAction,
  onExportOutput,
  onSelectExportPackage,
  onReviewExportPackage,
  onDownloadExportPackageFile,
  savedStudies,
  savedStudiesLoading,
  savedStudiesError,
  onRefreshSavedStudies,
  onOpenSavedStudy,
  onArchiveSavedStudy,
  onArchiveSmokeTestStudies,
  onRespondParticipantIssue,
}: {
  activeModule: ModuleId;
  role: UserRole;
  study: StudyRecord;
  apiMode: string;
  apiBaseUrl: string;
  knownStudies: number;
  listStudiesLabel: string;
  workflow: ConductorWorkflow;
  wizard: StudyWizardState;
  roundOneSetup: RoundOneSetupState;
  roundTwoSetup: RoundTwoSetupState;
  roundConfigs: RoundConfig[];
  roundActionMessage: string | null;
  roundActionError: string | null;
  roundActionBusy: string | null;
  participantResponseText: string;
  participantRoundOneAnswers: Record<string, string>;
  participantSubmittedRoundOneText: string | null;
  participantSubmittedRoundOneAnswers: Record<string, string> | null;
  participantRoundOneEditing: boolean;
  participantRoundOneComplete: boolean;
  participantSubmittedRatings: Record<number, RatingDraft>;
  participantSubmittedRationales: Record<number, RationaleDraft>;
  participantRatingRoundEditing: Record<number, boolean>;
  participantRatingRoundComplete: Record<number, boolean>;
  participantDraftSavedAt: string | null;
  participantRatingDraftSavedAt: Record<number, string | null>;
  participantWithdrawn: boolean;
  participantConsentChecked: boolean;
  participantOrientationComplete: boolean;
  participantMessage: string | null;
  participantError: string | null;
  participantBusy: boolean;
  participantInvite: ParticipantInvitationContext | null;
  magicContext: MagicRoundEntryContext | null;
  magicItems: RoundItemForParticipant[];
  magicResponseText: string;
  magicRoundOneAnswers: Record<string, string>;
  magicRatings: RatingDraft;
  magicRationales: RationaleDraft;
  magicMessage: string | null;
  magicError: string | null;
  magicBusy: boolean;
  runtimeData: RuntimeStudyData;
  runtimeActionBusy: string | null;
  roundTwoRatings: RatingDraft;
  roundTwoRationales: RationaleDraft;
  finalResultSnapshot: FinalResultSnapshot | null;
  finalResultBlockers: string[];
  participantFinalResponses: ParticipantFinalResponse[];
  finalResultMessage: string | null;
  finalResultError: string | null;
  finalResultBusy: string | null;
  activeWizardStep: StudyWizardStepId;
  onWizardChange: (state: StudyWizardState) => void;
  onWizardStepChange: (step: StudyWizardStepId) => void;
  onWorkflowStep: (step: WorkflowStep) => void;
  onRoundOneSetupChange: (state: RoundOneSetupState) => void;
  onRoundTwoSetupChange: (state: RoundTwoSetupState) => void;
  onSaveRoundOneSetup: () => void;
  onSaveRoundTwoSetup: () => void;
  onSaveRatingRoundSetup: (roundNumber: number) => void;
  onTransitionRound: (roundNumber: number, action: "open" | "close") => void;
  onParticipantResponseChange: (value: string) => void;
  onParticipantRoundOneAnswerChange: (questionId: string, value: string) => void;
  onParticipantConsentChange: (value: boolean) => void;
  onCompleteParticipantOrientation: () => void;
  onSubmitParticipantRoundOne: () => void;
  onEditSubmittedRoundOne: () => void;
  onFinishRoundOneTask: () => void;
  onEditSubmittedRatings: (roundNumber: number) => void;
  onFinishRatingRoundTask: (roundNumber: number) => void;
  onSaveParticipantRoundOneDraft: () => void;
  onSaveParticipantRatingDraft: (roundNumber: number) => void;
  onWithdrawParticipant: () => void;
  onRequestDeletionReview: () => void;
  onReportParticipantIssue: (input: ParticipantIssueInput) => void;
  onMagicResponseTextChange: (value: string) => void;
  onMagicRoundOneAnswerChange: (questionId: string, value: string) => void;
  onMagicRatingChange: (itemId: string, rating: number) => void;
  onMagicRationaleChange: (itemId: string, text: string) => void;
  onSubmitMagicRound: () => void;
  onDeclineMagicRound: () => void;
  onRefreshRuntimeData: () => void;
  onCreateManualItemFromResponse: (response: ResponseRecord, entry?: RoundOneResponseEntry) => void;
  onSynthesizeRoundTwoCandidates: () => void;
  onSynthesizeRoundCandidates: (targetRoundNumber: number) => void;
  onAcceptSuggestion: (suggestion: AISuggestionRecord) => void;
  onMaterializeSuggestion: (suggestion: AISuggestionRecord) => void;
  onSignoffSuggestionRelease: (suggestion: AISuggestionRecord) => void;
  onPublishItem: (item: ItemRecord) => void;
  onEditItemText: (item: ItemRecord) => void;
  onRejectItem: (item: ItemRecord) => void;
  onSplitItem: (item: ItemRecord) => void;
  onMergeItemInto: (item: ItemRecord, target: ItemRecord) => void;
  onRoundTwoRatingChange: (itemId: string, rating: number) => void;
  onRoundTwoRationaleChange: (itemId: string, rationale: string) => void;
  onSubmitRoundTwoRatings: () => void;
  onFinalResultAction: (action: "create" | "signoff" | "release" | "archive") => void;
  onExportOutput: (outputId: string) => void;
  onSelectExportPackage: (packageId: string) => void;
  onReviewExportPackage: (packageId: string, reviewStatus: "approved" | "rejected", note: string) => void;
  onDownloadExportPackageFile: (packageId: string, fileId: string) => void;
  savedStudies: SavedStudyRecord[];
  savedStudiesLoading: boolean;
  savedStudiesError: string | null;
  onRefreshSavedStudies: () => void;
  onOpenSavedStudy: (record: SavedStudyRecord) => void;
  onArchiveSavedStudy: (record: SavedStudyRecord) => void;
  onArchiveSmokeTestStudies: () => void;
  onRespondParticipantIssue: (issueId: string, status: ParticipantIssue["status"], responseNote: string) => void;
}) {
  switch (activeModule) {
    case "about":
      return <AboutScreen />;
    case "architecture":
      return (
        <ArchitectureScreen
          apiMode={apiMode}
          apiBaseUrl={apiBaseUrl}
          knownStudies={knownStudies}
          listStudiesLabel={listStudiesLabel}
        />
      );
    case "dashboard":
      return (
        <DashboardScreen
          study={study}
          role={role}
          workflow={workflow}
          roundConfigs={roundConfigs}
          runtimeData={runtimeData}
          runtimeActionBusy={runtimeActionBusy}
          savedStudies={savedStudies}
          savedStudiesLoading={savedStudiesLoading}
          savedStudiesError={savedStudiesError}
          onRefreshSavedStudies={onRefreshSavedStudies}
          onOpenSavedStudy={onOpenSavedStudy}
          onArchiveSavedStudy={onArchiveSavedStudy}
          onArchiveSmokeTestStudies={onArchiveSmokeTestStudies}
          onRespondParticipantIssue={onRespondParticipantIssue}
        />
      );
    case "study-builder":
      return (
        <StudyBuilderScreen
          role={role}
          workflow={workflow}
          wizard={wizard}
          activeWizardStep={activeWizardStep}
          onWizardChange={onWizardChange}
          onWizardStepChange={onWizardStepChange}
          onWorkflowStep={onWorkflowStep}
        />
      );
    case "governance":
      return <GovernanceScreen role={role} workflow={workflow} wizard={wizard} onWorkflowStep={onWorkflowStep} />;
    case "round-manager":
      return (
        <RoundManagerScreen
          workflow={workflow}
          wizard={wizard}
          roundOneSetup={roundOneSetup}
          roundTwoSetup={roundTwoSetup}
          roundConfigs={roundConfigs}
          runtimeData={runtimeData}
          roundActionMessage={roundActionMessage}
          roundActionError={roundActionError}
          roundActionBusy={roundActionBusy}
          onRoundOneSetupChange={onRoundOneSetupChange}
          onRoundTwoSetupChange={onRoundTwoSetupChange}
          onSaveRoundOneSetup={onSaveRoundOneSetup}
          onSaveRoundTwoSetup={onSaveRoundTwoSetup}
          onSaveRatingRoundSetup={onSaveRatingRoundSetup}
          onTransitionRound={onTransitionRound}
        />
      );
    case "curation":
      return (
        <CurationScreen
          study={study}
          workflow={workflow}
          runtimeData={runtimeData}
          runtimeActionBusy={runtimeActionBusy}
          onRefreshRuntimeData={onRefreshRuntimeData}
          onCreateManualItemFromResponse={onCreateManualItemFromResponse}
          onSynthesizeRoundTwoCandidates={onSynthesizeRoundTwoCandidates}
          onSynthesizeRoundCandidates={onSynthesizeRoundCandidates}
          onAcceptSuggestion={onAcceptSuggestion}
          onMaterializeSuggestion={onMaterializeSuggestion}
          onSignoffSuggestionRelease={onSignoffSuggestionRelease}
          onPublishItem={onPublishItem}
          onEditItemText={onEditItemText}
          onRejectItem={onRejectItem}
          onSplitItem={onSplitItem}
          onMergeItemInto={onMergeItemInto}
        />
      );
    case "feedback":
      return <FeedbackScreen />;
    case "participant":
      return (
        <ParticipantScreen
          workflow={workflow}
          wizard={wizard}
          roundConfigs={roundConfigs}
          participantResponseText={participantResponseText}
          participantRoundOneAnswers={participantRoundOneAnswers}
          participantSubmittedRoundOneText={participantSubmittedRoundOneText}
          participantSubmittedRoundOneAnswers={participantSubmittedRoundOneAnswers}
          participantRoundOneEditing={participantRoundOneEditing}
          participantRoundOneComplete={participantRoundOneComplete}
          participantSubmittedRatings={participantSubmittedRatings}
          participantSubmittedRationales={participantSubmittedRationales}
          participantRatingRoundEditing={participantRatingRoundEditing}
          participantRatingRoundComplete={participantRatingRoundComplete}
          participantDraftSavedAt={participantDraftSavedAt}
          participantRatingDraftSavedAt={participantRatingDraftSavedAt}
          participantWithdrawn={participantWithdrawn}
          participantConsentChecked={participantConsentChecked}
          participantOrientationComplete={participantOrientationComplete}
          participantMessage={participantMessage}
          participantError={participantError}
          participantBusy={participantBusy}
          participantInvite={participantInvite}
          magicContext={magicContext}
          magicItems={magicItems}
          magicResponseText={magicResponseText}
          magicRoundOneAnswers={magicRoundOneAnswers}
          magicRatings={magicRatings}
          magicRationales={magicRationales}
          magicMessage={magicMessage}
          magicError={magicError}
          magicBusy={magicBusy}
          runtimeData={runtimeData}
          roundTwoRatings={roundTwoRatings}
          roundTwoRationales={roundTwoRationales}
          onParticipantResponseChange={onParticipantResponseChange}
          onParticipantRoundOneAnswerChange={onParticipantRoundOneAnswerChange}
          onParticipantConsentChange={onParticipantConsentChange}
          onCompleteParticipantOrientation={onCompleteParticipantOrientation}
          onSubmitParticipantRoundOne={onSubmitParticipantRoundOne}
          onEditSubmittedRoundOne={onEditSubmittedRoundOne}
          onFinishRoundOneTask={onFinishRoundOneTask}
          onEditSubmittedRatings={onEditSubmittedRatings}
          onFinishRatingRoundTask={onFinishRatingRoundTask}
          onSaveParticipantRoundOneDraft={onSaveParticipantRoundOneDraft}
          onSaveParticipantRatingDraft={onSaveParticipantRatingDraft}
          onWithdrawParticipant={onWithdrawParticipant}
          onRequestDeletionReview={onRequestDeletionReview}
          onReportParticipantIssue={onReportParticipantIssue}
          onMagicResponseTextChange={onMagicResponseTextChange}
          onMagicRoundOneAnswerChange={onMagicRoundOneAnswerChange}
          onMagicRatingChange={onMagicRatingChange}
          onMagicRationaleChange={onMagicRationaleChange}
          onSubmitMagicRound={onSubmitMagicRound}
          onDeclineMagicRound={onDeclineMagicRound}
          onRoundTwoRatingChange={onRoundTwoRatingChange}
          onRoundTwoRationaleChange={onRoundTwoRationaleChange}
          onSubmitRoundTwoRatings={onSubmitRoundTwoRatings}
        />
      );
    case "closeout":
      return (
        <FinalResultsCloseoutScreen
          role={role}
          snapshot={finalResultSnapshot}
          blockers={finalResultBlockers}
          participantFinalResponses={participantFinalResponses}
          message={finalResultMessage}
          error={finalResultError}
          busy={finalResultBusy}
          onAction={onFinalResultAction}
          onExportOutput={onExportOutput}
        />
      );
    case "glossary":
      return <GlossaryScreen />;
    case "reporting":
      return (
        <ReportingScreen
          study={study}
          role={role}
          workflow={workflow}
          runtimeData={runtimeData}
          runtimeActionBusy={runtimeActionBusy}
          onExportOutput={onExportOutput}
          onSelectExportPackage={onSelectExportPackage}
          onReviewExportPackage={onReviewExportPackage}
          onDownloadExportPackageFile={onDownloadExportPackageFile}
        />
      );
    case "audit":
      return <AuditScreen study={study} />;
    case "admin-security":
      return <AdminSecurityScreen role={role} workflow={workflow} />;
  }
}

function AboutScreen() {
  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">About the platform</span>
          <h2>Delphi Commons protects method, participants, and interpretation</h2>
        </div>
        <div className="orientation-fact-grid">
          {platformAboutSections.map((section) => (
            <article className="orientation-fact" key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Consensus Is Limited</h3>
        <p>
          Delphi consensus is structured expert or stakeholder agreement under a predefined rule. It preserves uncertainty,
          dissent, non-consensus, attrition, and methodological limits.
        </p>
        <WarningBanner title="Required interpretation" risk="info">
          Consensus indicates agreement among this panel; it does not establish correctness.
        </WarningBanner>
      </section>

      <section className="panel">
        <h3>AI Is Governed</h3>
        <p>
          AI may be configured as drafting or organizing assistance only. AI suggestions are non-final, require human review,
          and must never tell participants what to answer.
        </p>
      </section>

      <section className="panel wide" id="how-to-cite-this-tool">
        <div className="section-heading">
          <span className="eyebrow">Citation guidance</span>
          <h3>How to Cite This Tool</h3>
        </div>
        <p>{citationFraming}</p>
        <div className="citation-grid">
          <article className="orientation-fact">
            <h4>Preferred citation</h4>
            <p>{buildPreferredCitation()}</p>
          </article>
          <article className="orientation-fact">
            <h4>BibTeX</h4>
            <pre className="citation-code">{buildBibtexCitation()}</pre>
          </article>
        </div>
        <p className="microcopy">
          Software version: {citationMetadata.version}. DOI: {citationMetadata.doi ?? "Not assigned for this release."}
        </p>
        <p className="microcopy">
          Citing this tool supports transparency and reproducibility; it does not validate study findings or imply platform
          endorsement of a study's conclusions.
        </p>
      </section>
    </div>
  );
}

const finalOutcomeLabels: Record<FinalResultSnapshot["itemOutcomes"][number]["outcome"], string> = {
  consensus: "Consensus",
  near_consensus: "Near consensus",
  descriptive_near_consensus: "Descriptive near consensus",
  no_consensus: "No consensus",
  consensus_out: "Not endorsed",
};

const finalOutcomeRisks: Record<FinalResultSnapshot["itemOutcomes"][number]["outcome"], "success" | "info" | "warning" | "locked"> = {
  consensus: "success",
  near_consensus: "info",
  descriptive_near_consensus: "info",
  no_consensus: "warning",
  consensus_out: "locked",
};

function FinalResultsCloseoutScreen({
  role,
  snapshot,
  blockers,
  participantFinalResponses,
  message,
  error,
  busy,
  onAction,
  onExportOutput,
}: {
  role: UserRole;
  snapshot: FinalResultSnapshot | null;
  blockers: string[];
  participantFinalResponses: ParticipantFinalResponse[];
  message: string | null;
  error: string | null;
  busy: string | null;
  onAction: (action: "create" | "signoff" | "release" | "archive") => void;
  onExportOutput: (outputId: string) => void;
}) {
  const [activeOutcome, setActiveOutcome] = useState<FinalResultSnapshot["itemOutcomes"][number]["outcome"] | "all">("all");
  const isParticipant = role === "panelist";
  const visibleItems = snapshot
    ? snapshot.itemOutcomes.filter((item) => activeOutcome === "all" || item.outcome === activeOutcome)
    : [];

  if (!snapshot) {
    return (
      <div className="screen-grid">
        <section className="panel wide">
          <div className="section-heading">
            <span className="eyebrow">Final Results & Study Closeout</span>
            <h2>Create the canonical final results snapshot</h2>
          </div>
          <WarningBanner title="Terminal round required" risk="warning">
            Final closeout opens after the terminal round is closed. The snapshot preserves one source for PI review,
            participant summaries, exports, audit, and provenance.
          </WarningBanner>
          <div className="action-row">
            <button type="button" onClick={() => onAction("create")} disabled={busy === "create"}>
              {busy === "create" ? "Creating..." : "Create FinalResultSnapshot"}
            </button>
          </div>
          {error && <WarningBanner title="Closeout action blocked" risk="danger">{error}</WarningBanner>}
        </section>
      </div>
    );
  }

  const participantSummary = (
    <div className="screen-grid">
      <section className="panel wide final-hero">
        <div className="section-heading">
          <span className="eyebrow">Final results</span>
          <h2>Thank you - this Delphi study is complete</h2>
        </div>
        <p>The planned final round has closed. There are no more rating rounds.</p>
        <WarningBanner title="How to read these results" risk="info">
          {snapshot.requiredStatement} Disagreement is part of the result.
        </WarningBanner>
      </section>

      <section className="panel wide">
        <h3>How to read this</h3>
        <div className="result-card-grid">
          <StatCard label="Reached consensus" value={String(snapshot.aggregateCounts.consensus)} supporting="Met the pre-set rule." />
          <StatCard label="Near consensus" value={String(snapshot.aggregateCounts.descriptiveNearConsensus + snapshot.aggregateCounts.nearConsensus)} supporting="Shown separately from formal consensus." />
          <StatCard label="Did not reach consensus" value={String(snapshot.aggregateCounts.noConsensus)} supporting="Still part of the result." />
          <StatCard label="Final round participation" value={`${snapshot.aggregateCounts.terminalRoundCompletedCount}/${snapshot.aggregateCounts.terminalRoundEligibleCount}`} supporting={`${snapshot.aggregateCounts.terminalRoundCompletionRate}% completed`} />
        </div>
        <p className="microcopy">
          Near consensus is descriptive unless the study protocol defined it as a separate category. No consensus means
          the panel did not reach the pre-set level of agreement; the item remains part of the study result.
        </p>
      </section>

      <section className="panel wide">
        <h3>Final item lists</h3>
        {(["consensus", "descriptive_near_consensus", "no_consensus"] as const).map((outcome) => {
          const items = snapshot.itemOutcomes.filter((item) => item.outcome === outcome);
          return (
            <details className="closeout-accordion" key={outcome} open={outcome !== "no_consensus"}>
              <summary>{finalOutcomeLabels[outcome]} ({items.length})</summary>
              <div className="item-outcome-list">
                {items.length === 0 ? (
                  <p className="microcopy">No items are in this category.</p>
                ) : items.map((item) => <FinalItemOutcomeCard item={item} participantMode key={item.itemId} />)}
              </div>
            </details>
          );
        })}
      </section>

      <section className="panel wide">
        <h3>Your final responses</h3>
        <p className="microcopy">
          These are visible only to you and the study team as described in the consent materials. They are not ranked
          against other panelists.
        </p>
        {participantFinalResponses.length === 0 ? (
          <p>No terminal-round responses are available in this browser session.</p>
        ) : (
          <div className="item-outcome-list">
            {participantFinalResponses.map((response) => (
              <article className="report-row" key={`${response.item_id}-${response.submitted_at}`}>
                <strong>{response.item_text}</strong>
                <span>Final rating: {response.rating}</span>
                {response.rationale_text && <small>Rationale: {response.rationale_text}</small>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel wide">
        <h3>Your participation and data</h3>
        <p>
          Your identifiable information remains confidential to the study team under the study protocol. Complete
          anonymity from the study team may not be possible because responses are linked across rounds. Aggregated
          results may already include your response.
        </p>
      </section>
    </div>
  );

  if (isParticipant) return participantSummary;

  return (
    <div className="screen-grid">
      <section className="panel wide final-hero">
        <div className="section-heading">
          <span className="eyebrow">Final Results & Study Closeout</span>
          <h2>Terminal round complete</h2>
        </div>
        <p>
          Round {snapshot.terminalRoundNumber} closed on {formatDateTime(snapshot.closedAt)}. This was the final
          analytic round defined in the study design.
        </p>
        <div className="badge-line">
          <StatusBadge risk="locked" label={snapshot.consensusRule.lockStatus === "locked" ? "Consensus rule locked" : "Consensus rule warning"} />
          <StatusBadge risk={snapshot.status === "released" || snapshot.status === "archived" ? "success" : "warning"} label={snapshot.status.replaceAll("_", " ")} />
        </div>
        <WarningBanner title="Required interpretation" risk="info">{snapshot.requiredStatement}</WarningBanner>
        <p className="microcopy">{snapshot.consensusRule.description}</p>
      </section>

      {message && <WarningBanner title="Closeout update" risk="success">{message}</WarningBanner>}
      {error && <WarningBanner title="Closeout action blocked" risk="danger">{error}</WarningBanner>}

      <section className="panel wide">
        <h3>Closeout Summary</h3>
        <div className="result-card-grid">
          <StatCard label="Consensus reached" value={String(snapshot.aggregateCounts.consensus)} supporting="Items meeting the locked rule." />
          <StatCard label="Near consensus" value={String(snapshot.aggregateCounts.nearConsensus + snapshot.aggregateCounts.descriptiveNearConsensus)} supporting="Descriptive unless pre-specified." />
          <StatCard label="No consensus" value={String(snapshot.aggregateCounts.noConsensus)} supporting="Retained as study findings." />
          <StatCard label="Preserved perspectives" value={String(snapshot.aggregateCounts.preservedPerspectiveCount)} supporting="Shown or privacy-suppressed with reason." />
          <StatCard label="Final-round response rate" value={`${snapshot.aggregateCounts.terminalRoundCompletionRate}%`} supporting={`${snapshot.aggregateCounts.terminalRoundCompletedCount}/${snapshot.aggregateCounts.terminalRoundEligibleCount} completed`} />
          <StatCard label="Overall attrition" value={snapshot.aggregateCounts.overallAttritionLabel} supporting="Included in exports." />
        </div>
      </section>

      <section className="panel wide">
        <h3>Item Outcome Explorer</h3>
        <div className="segmented-control outcome-tabs" role="tablist" aria-label="Final item outcome filters">
          {(["all", "consensus", "descriptive_near_consensus", "no_consensus", "consensus_out"] as const).map((outcome) => (
            <button
              className={activeOutcome === outcome ? "active" : ""}
              key={outcome}
              onClick={() => setActiveOutcome(outcome)}
              type="button"
            >
              {outcome === "all" ? "All items" : finalOutcomeLabels[outcome]}
            </button>
          ))}
        </div>
        <div className="item-outcome-list">
          {visibleItems.length === 0 ? (
            <p className="microcopy">No items are in this category.</p>
          ) : visibleItems.map((item) => <FinalItemOutcomeCard item={item} key={item.itemId} />)}
        </div>
      </section>

      <section className="panel">
        <h3>Unresolved and preserved perspectives</h3>
        {snapshot.itemOutcomes.flatMap((item) => item.preservedPerspectives.map((perspective) => ({ item, perspective }))).length === 0 ? (
          <p className="microcopy">No preserved perspective entries are attached to the snapshot.</p>
        ) : (
          <div className="item-outcome-list">
            {snapshot.itemOutcomes.flatMap((item) =>
              item.preservedPerspectives.map((perspective) => (
                <article className="report-row" key={`${item.itemId}-${perspective.summary}`}>
                  <strong>{item.finalText}</strong>
                  <span>{perspective.summary}</span>
                  {perspective.privacySuppressed && <small>Privacy detail suppressed: {perspective.privacySuppressionReason}</small>}
                </article>
              )),
            )}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Governance and integrity</h3>
        <Checklist
          items={[
            { id: "terminal", label: "Terminal round verified", detail: `Round ${snapshot.terminalRoundNumber} matches the study design.`, complete: true, risk: "success" },
            { id: "rule", label: "Consensus rule locked", detail: snapshot.consensusRule.description, complete: snapshot.consensusRule.lockStatus === "locked", risk: snapshot.consensusRule.lockStatus === "locked" ? "success" : "danger" },
            { id: "rates", label: "Response rates calculated", detail: `${snapshot.roundSummaries.length} rounds summarized.`, complete: snapshot.roundSummaries.length > 0, risk: "success" },
            { id: "non-consensus", label: "Non-consensus retained", detail: `${snapshot.aggregateCounts.noConsensus} no-consensus items are retained.`, complete: true, risk: "success" },
            { id: "limits", label: "Limitations included", detail: snapshot.requiredStatement, complete: snapshot.limitations.includes(snapshot.requiredStatement), risk: "success" },
            { id: "hashes", label: "Export hashes generated", detail: `Export hash ${snapshot.exportHash.slice(0, 12)}...`, complete: Boolean(snapshot.exportHash && snapshot.provenanceHash), risk: "locked" },
          ]}
        />
        {snapshot.methodWarnings.map((warning) => (
          <WarningBanner key={warning.code} title={warning.severity === "blocking" ? "Blocking warning" : "Method warning"} risk={warning.severity === "blocking" ? "danger" : "warning"}>
            {warning.message}
          </WarningBanner>
        ))}
        {blockers.length > 0 && (
          <WarningBanner title="Release blockers" risk="warning">
            {blockers.map((blocker) => blocker.replaceAll("_", " ")).join("; ")}
          </WarningBanner>
        )}
      </section>

      <section className="panel wide">
        <h3>Export and release actions</h3>
        <div className="action-row">
          <button type="button" onClick={() => onAction("signoff")} disabled={busy === "signoff"}>
            {busy === "signoff" ? "Signing..." : "Sign off closeout"}
          </button>
          <button type="button" onClick={() => onAction("release")} disabled={busy === "release" || blockers.length > 0}>
            Release to participants
          </button>
          <button type="button" onClick={() => onExportOutput("final-delphi-report")}>
            Export full methods report
          </button>
          <button type="button" onClick={() => onExportOutput("provenance-bundle")}>
            Export audit/provenance pack
          </button>
          <button type="button" onClick={() => onAction("archive")} disabled={busy === "archive"}>
            Archive study results
          </button>
        </div>
      </section>
    </div>
  );
}

function FinalItemOutcomeCard({
  item,
  participantMode = false,
}: {
  item: FinalResultSnapshot["itemOutcomes"][number];
  participantMode?: boolean;
}) {
  const total = Object.values(item.distribution).reduce((sum, count) => sum + count, 0);
  return (
    <article className="final-item-card">
      <div className="feedback-card-topline">
        <StatusBadge risk={finalOutcomeRisks[item.outcome]} label={finalOutcomeLabels[item.outcome]} />
        <span className="microcopy">Item source: {item.provenance.replaceAll("_", " ")}</span>
      </div>
      <h4>{item.finalText}</h4>
      <div className="feedback-metrics">
        <span>Final N: <strong>{item.finalN}</strong></span>
        <span>Median: <strong>{item.median ?? "n/a"}</strong></span>
        <span>IQR: <strong>{item.iqr ?? "n/a"}</strong></span>
        <span>Agreement: <strong>{item.agreementPercent ?? "n/a"}%</strong></span>
      </div>
      <div className="compact-distribution" aria-label={`Distribution across ${total} responses`}>
        {Object.entries(item.distribution).map(([rating, count]) => (
          <span key={rating}>
            <small>{rating}</small>
            <i style={{ "--bar-height": `${Math.max(8, total ? (count / total) * 48 : 8)}px` } as CSSProperties} />
            <small>{count}</small>
          </span>
        ))}
      </div>
      {item.neutralSummary && <p>{item.neutralSummary}</p>}
      {!participantMode && item.roundTrend.length > 0 && (
        <details>
          <summary>Round-to-round movement</summary>
          <div className="detail-list">
            {item.roundTrend.map((trend) => (
              <div key={trend.roundNumber}>
                <dt>Round {trend.roundNumber}</dt>
                <dd>Median {trend.median ?? "n/a"}; IQR {trend.iqr ?? "n/a"}; agreement {trend.agreementPercent ?? "n/a"}%</dd>
              </div>
            ))}
          </div>
        </details>
      )}
      {item.preservedPerspectives.length > 0 && (
        <details>
          <summary>{participantMode ? "Preserved perspective summary" : "Dissent and preserved perspectives"}</summary>
          {item.preservedPerspectives.map((perspective) => (
            <p className="microcopy" key={perspective.summary}>
              {perspective.summary}
              {perspective.privacySuppressed && perspective.privacySuppressionReason ? ` ${perspective.privacySuppressionReason}` : ""}
            </p>
          ))}
        </details>
      )}
    </article>
  );
}

function GlossaryScreen() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const visibleTerms = glossaryTerms.filter((entry) => {
    if (!normalized) return true;
    return [entry.term, entry.plain, entry.technical, ...(entry.aliases ?? [])]
      .some((value) => value.toLowerCase().includes(normalized));
  });

  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Glossary</span>
          <h2>Plain-language Delphi, ethics, AI, and reporting terms</h2>
        </div>
        <label className="field wide-field glossary-search">
          <span>Search terms</span>
          <input
            aria-label="Search glossary terms"
            placeholder="Search consensus, IQR, confidentiality, AI suggestion..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </section>

      <section className="glossary-grid wide" aria-live="polite">
        {visibleTerms.map((entry) => (
          <article className="panel glossary-term" key={entry.id}>
            <h3>{entry.term}</h3>
            <p>{entry.plain}</p>
            <small>{entry.technical}</small>
          </article>
        ))}
      </section>
    </div>
  );
}

function ArchitectureScreen({
  apiMode,
  apiBaseUrl,
  knownStudies,
  listStudiesLabel,
}: {
  apiMode: string;
  apiBaseUrl: string;
  knownStudies: number;
  listStudiesLabel: string;
}) {
  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Extensible foundation</span>
          <h2>Platform shell with registries and policy gates</h2>
        </div>
        <div className="architecture-grid">
          <StatCard label="Modules" value={String(moduleRegistry.length)} supporting="Routes and permissions are registry-driven." />
          <StatCard label="Study methods" value={String(methodRegistry.length)} supporting="Available now plus future method models." />
          <StatCard label="Output models" value={String(outputModelRegistry.length)} supporting="Exports define roles, redaction, and audit action." />
          <StatCard label="API mode" value={apiMode} supporting={`${knownStudies} mock study via ${listStudiesLabel || "listStudies"}.`} />
        </div>
      </section>

      <section className="panel">
        <h3>API Boundary</h3>
        <p className="muted">
          The UI can use mock data during design, while keeping a clear backend boundary for the road-tested Fastify API.
        </p>
        <dl className="detail-list">
          <div>
            <dt>Base URL</dt>
            <dd>{apiBaseUrl}</dd>
          </div>
          <div>
            <dt>Auth header model</dt>
            <dd>Role-aware headers for local development; backend still enforces permissions.</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h3>Extension Points</h3>
        <ul className="plain-list">
          <li>New application modules register label, route, permissions, and maturity.</li>
          <li>New study methods define round plan, required setup, feedback rules, and launch blockers.</li>
          <li>New output models define sections, signoffs, redaction rules, and audit action.</li>
          <li>Policy gates remain outside page components for testing and reuse.</li>
        </ul>
      </section>
    </div>
  );
}

function NextActionPanel({
  nextAction,
  onNavigate,
  onRunCommand,
}: {
  nextAction: NextAction;
  onNavigate: (module: ModuleId) => void;
  onRunCommand: (command: NonNullable<NextAction["command"]>) => void;
}) {
  function runPrimaryAction() {
    if (nextAction.command) {
      onRunCommand(nextAction.command);
      return;
    }
    onNavigate(nextAction.module);
  }

  return (
    <section className={`next-action next-action-${nextAction.risk}`} aria-label="Next required action">
      <div>
        <span className="eyebrow">Next required action</span>
        <h2>{nextAction.title}</h2>
        <p>{nextAction.detail}</p>
      </div>
      <button className="primary-button" onClick={runPrimaryAction} type="button">
        {nextAction.actionLabel}
      </button>
    </section>
  );
}

function hasSignoff(workflow: ConductorWorkflow, requiredRole: BackendSignoff["required_role"]): boolean {
  return workflow.signoffs.some((signoff) => signoff.required_role === requiredRole);
}

const studyRoleLabels: Record<StudyAssignment["role"], string> = {
  Owner: "Study Owner / PI",
  MethodsSteward: "Ethics & Methods Steward",
  PrivacyLead: "Security & Privacy Lead",
  DataCustodian: "Data Custodian",
  Maintainer: "Open Source Maintainer / Admin",
};

function concentratedAssignments(assignments: StudyAssignment[]) {
  const rolesByUser = new Map<string, Set<StudyAssignment["role"]>>();
  for (const assignment of assignments) {
    const roles = rolesByUser.get(assignment.user_id) ?? new Set<StudyAssignment["role"]>();
    roles.add(assignment.role);
    rolesByUser.set(assignment.user_id, roles);
  }

  return Array.from(rolesByUser.entries())
    .map(([userId, roles]) => ({ userId, roles: Array.from(roles).sort() }))
    .filter((entry) => entry.roles.length > 1);
}

function workflowStepDone(workflow: ConductorWorkflow, step: WorkflowStep): boolean {
  switch (step) {
    case "create-study":
      return Boolean(workflow.study);
    case "create-version":
      return Boolean(workflow.version);
    case "save-wizard-packet":
      return Boolean(workflow.version?.study_design_packet_json);
    case "set-design":
      return Boolean(workflow.version?.study_format);
    case "set-consensus":
      return Boolean(workflow.version?.consensus_rule_json);
    case "submit":
      return workflow.version?.status === "ReadyForSignoff" || workflow.version?.status === "Active";
    case "owner-signoff":
      return hasSignoff(workflow, "Owner");
    case "steward-signoff":
      return hasSignoff(workflow, "MethodsSteward");
    case "activate":
      return workflow.version?.status === "Active";
    case "open-round-1":
      return Boolean(workflow.version?.opened_round1_at);
  }
}

function buildNextAction(input: {
  workflow: ConductorWorkflow;
  wizard: StudyWizardState;
  roundConfigs: RoundConfig[];
  runtimeData: RuntimeStudyData;
}): NextAction {
  const { workflow, wizard, roundConfigs, runtimeData } = input;
  const roundOneConfig = roundConfigs.find((config) => config.round_number === 1);
  const roundTwoConfig = roundConfigs.find((config) => config.round_number === 2);
  const openResponses = runtimeData.responses.filter((response) => responseOpenText(response.response_json));
  const publishedRoundTwoItems = runtimeData.items.filter((item) => item.round_number === 2 && item.status === "Published");
  const roundTwoSubmissionCount = runtimeData.roundReport?.summary.round_submission_count ?? 0;

  if (!workflow.study) {
    return {
      title: "Create or open a study",
      detail: "Start a backend study workspace from Study Builder, or open an existing saved study from the Dashboard.",
      module: "study-builder",
      actionLabel: "Go to Study Builder",
      risk: "warning",
    };
  }

  if (!workflow.version) {
    return {
      title: "Create the governed study version",
      detail: "The study exists, but it needs a draft StudyVersion before design, governance, and round setup can be saved.",
      module: "study-builder",
      actionLabel: "Continue setup",
      risk: "warning",
    };
  }

  if (!workflow.version.study_design_packet_json || validateWizardStep("review", wizard).length > 0) {
    return {
      title: "Complete and save the study design",
      detail: "Finish the Study Builder wizard so panel criteria, consent, feedback, AI, retention, and method settings travel together.",
      module: "study-builder",
      actionLabel: "Review design",
      risk: "warning",
    };
  }

  if (!workflow.version.study_format || !workflow.version.consensus_rule_json) {
    return {
      title: "Apply method design and locked consensus rule",
      detail: "The declared method and predefined consensus threshold must be saved before governance signoff.",
      module: "governance",
      actionLabel: "Go to Governance",
      risk: "warning",
    };
  }

  if (workflow.version.status === "Draft") {
    return {
      title: "Submit for governance signoff",
      detail: "The study design is ready for Study Owner and Ethics & Methods Steward review.",
      module: "governance",
      actionLabel: "Review governance",
      risk: "warning",
    };
  }

  if (workflow.version.status === "ReadyForSignoff") {
    const missing = [
      hasSignoff(workflow, "Owner") ? null : "Study Owner",
      hasSignoff(workflow, "MethodsSteward") ? null : "Ethics & Methods Steward",
    ].filter(Boolean).join(" and ");

    return {
      title: missing ? `${missing} signoff required` : "Activate the governed version",
      detail: missing
        ? "Both required signoffs must be recorded before launch."
        : "Both governance signoffs are recorded; activate the version before round setup.",
      module: "governance",
      actionLabel: "Open signoff gate",
      risk: "warning",
    };
  }

  if (!roundOneConfig) {
    return {
      title: "Configure Round 1",
      detail: "Set the open-ended prompt, participant instructions, response window, reminder language, and consent text.",
      module: "round-manager",
      actionLabel: "Configure Round 1",
      risk: "warning",
    };
  }

  if (roundOneConfig.status !== "Open" && roundOneConfig.status !== "Closed") {
    return {
      title: "Open Round 1",
      detail: "Round 1 is configured and ready. Opening it makes the participant task available.",
      module: "round-manager",
      actionLabel: "Open round controls",
      risk: "warning",
    };
  }

  if (roundOneConfig.status === "Open" && openResponses.length === 0) {
    return {
      title: "Collect Round 1 responses",
      detail: "The participant portal is open for Round 1. Responses will feed the Curation Desk.",
      module: "participant",
      actionLabel: "View participant task",
      risk: "info",
    };
  }

  if (roundOneConfig.status === "Open") {
    return {
      title: "Close Round 1 when collection is complete",
      detail: `${openResponses.length} Round 1 response${openResponses.length === 1 ? "" : "s"} are available for curation. Close Round 1 before opening Round 2.`,
      module: "round-manager",
      actionLabel: "Close Round 1",
      risk: "info",
      command: {
        kind: "transition-round",
        roundNumber: 1,
        action: "close",
      },
    };
  }

  if (publishedRoundTwoItems.length === 0) {
    return {
      title: "Curate and publish Round 2 items",
      detail: "Create traceable candidate items from Round 1 responses, handle AI suggestions with human decisions, and publish participant-facing items.",
      module: "curation",
      actionLabel: "Open Curation",
      risk: "warning",
    };
  }

  if (!roundTwoConfig) {
    return {
      title: "Configure Round 2",
      detail: "Set the structured rating instructions, response window, reminders, and controlled feedback posture.",
      module: "round-manager",
      actionLabel: "Configure Round 2",
      risk: "warning",
    };
  }

  if (roundTwoConfig.status !== "Open" && roundTwoConfig.status !== "Closed") {
    return {
      title: "Open Round 2",
      detail: `${publishedRoundTwoItems.length} published item${publishedRoundTwoItems.length === 1 ? "" : "s"} are ready for participant rating.`,
      module: "round-manager",
      actionLabel: "Open Round 2",
      risk: "warning",
      command: {
        kind: "transition-round",
        roundNumber: 2,
        action: "open",
      },
    };
  }

  if (roundTwoConfig.status === "Open" && roundTwoSubmissionCount === 0) {
    return {
      title: "Collect Round 2 ratings",
      detail: "Round 2 is open. Participant ratings will populate the real reporting dashboard.",
      module: "participant",
      actionLabel: "View rating task",
      risk: "info",
    };
  }

  return {
    title: "Review real reporting",
    detail: "Ratings are available. Review consensus, non-consensus, limitations, and export permissions.",
    module: "reporting",
    actionLabel: "Open Reporting",
    risk: "success",
  };
}

function buildActionableChecklist(input: {
  workflow: ConductorWorkflow;
  roundConfigs: RoundConfig[];
  runtimeData: RuntimeStudyData;
}): ActionChecklistItem[] {
  const { workflow, roundConfigs, runtimeData } = input;
  const roundOneConfig = roundConfigs.find((config) => config.round_number === 1);
  const roundTwoConfig = roundConfigs.find((config) => config.round_number === 2);
  const openResponses = runtimeData.responses.filter((response) => responseOpenText(response.response_json));
  const publishedRoundTwoItems = runtimeData.items.filter((item) => item.round_number === 2 && item.status === "Published");
  const roundTwoSubmissionCount = runtimeData.roundReport?.summary.round_submission_count ?? 0;

  return [
    {
      label: "Study design saved",
      detail: "Study Builder packet is attached to the version.",
      complete: Boolean(workflow.version?.study_design_packet_json),
    },
    {
      label: "Governance complete",
      detail: "Method, consensus threshold, dual signoff, and activation are complete.",
      complete: workflow.version?.status === "Active",
    },
    {
      label: "Round 1 configured",
      detail: "Prompt, instructions, consent, window, and reminders are ready.",
      complete: Boolean(roundOneConfig),
    },
    {
      label: "Round 1 collection complete",
      detail: "Round 1 has collected responses and is closed before curation release.",
      complete: roundOneConfig?.status === "Closed" && openResponses.length > 0,
    },
    {
      label: "Round 2 items published",
      detail: "Traceable candidate statements are participant-facing.",
      complete: publishedRoundTwoItems.length > 0,
    },
    {
      label: "Round 2 configured and open",
      detail: "Structured rating task is available to participants.",
      complete: roundTwoConfig?.status === "Open" || roundTwoConfig?.status === "Closed",
    },
    {
      label: "Round 2 ratings received",
      detail: "Real ratings are available for reporting.",
      complete: roundTwoSubmissionCount > 0,
    },
    {
      label: "Reporting review ready",
      detail: "Consensus, non-consensus, limitations, and export permissions can be reviewed.",
      complete: Boolean(runtimeData.roundReport ?? runtimeData.exportReport),
    },
  ];
}

function ParticipantIssueInbox({
  issues,
  busyAction,
  onRespond,
}: {
  issues: ParticipantIssue[];
  busyAction: string | null;
  onRespond: (issueId: string, status: ParticipantIssue["status"], responseNote: string) => void;
}) {
  const openIssues = issues.filter((issue) => issue.status === "open");
  const latestIssues = issues.slice(0, 6);

  return (
    <section className={openIssues.length > 0 ? "panel wide participant-issue-inbox attention-panel" : "panel wide participant-issue-inbox"}>
      <div className="split-line">
        <div>
          <span className="eyebrow">Participant support</span>
          <h3>Participant Issue Notes</h3>
          <p className="muted">Notes from “Having trouble?” appear here for quick PI/study-team response.</p>
        </div>
        <StatusBadge risk={openIssues.length > 0 ? "warning" : "success"} label={`${openIssues.length} open`} />
      </div>
      {issues.length === 0 ? (
        <WarningBanner title="No participant issue notes" risk="success">
          No button, textbox, save, or access problems have been reported for this study.
        </WarningBanner>
      ) : (
        <div className="issue-inbox-list">
          {latestIssues.map((issue) => (
            <ParticipantIssueInboxCard
              busy={busyAction === `participant-issue-${issue.issue_id}`}
              issue={issue}
              key={issue.issue_id}
              onRespond={onRespond}
            />
          ))}
        </div>
      )}
      {issues.length > latestIssues.length ? (
        <p className="muted">Showing the latest {latestIssues.length} of {issues.length} issue notes.</p>
      ) : null}
    </section>
  );
}

function ParticipantIssueInboxCard({
  issue,
  busy,
  onRespond,
}: {
  issue: ParticipantIssue;
  busy: boolean;
  onRespond: (issueId: string, status: ParticipantIssue["status"], responseNote: string) => void;
}) {
  const [status, setStatus] = useState<ParticipantIssue["status"]>(issue.status);
  const [responseNote, setResponseNote] = useState(issue.staff_response_note ?? "");
  const issueLabel = participantIssueTypeOptions.find((option) => option.value === issue.issue_type)?.label ?? "Other issue";

  return (
    <article className={issue.status === "open" ? "issue-inbox-card open" : "issue-inbox-card"} aria-label={`Participant issue from ${issue.participant_alias}`}>
      <div className="split-line">
        <div>
          <strong>{issueLabel}</strong>
          <p className="muted">
            {issue.participant_alias} - {issue.round_number ? `Round ${issue.round_number}` : "No round listed"} - {issue.page_context}
          </p>
          <small>Sent {formatDateTime(issue.created_at)}</small>
        </div>
        <StatusBadge risk={issue.status === "open" ? "warning" : issue.status === "closed" ? "success" : "info"} label={issue.status} />
      </div>
      <blockquote>{issue.note || "No note text was provided."}</blockquote>
      {issue.staff_response_note ? (
        <WarningBanner title="Study-team response" risk="info">
          {issue.staff_response_note}
        </WarningBanner>
      ) : null}
      <div className="issue-response-grid">
        <label>
          <span>Response status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as ParticipantIssue["status"])}>
            <option value="open">Open</option>
            <option value="reviewed">Reviewed</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label>
          <span>Response note for participant</span>
          <textarea
            maxLength={1200}
            value={responseNote}
            onChange={(event) => setResponseNote(event.target.value)}
            placeholder="Example: Thank you. We are checking this control now; please use Save again in a moment."
          />
        </label>
      </div>
      <button
        className="primary-button"
        disabled={busy}
        onClick={() => onRespond(issue.issue_id, status, responseNote)}
        type="button"
      >
        {busy ? "Recording..." : "Record response"}
      </button>
    </article>
  );
}

function DashboardScreen({
  study,
  role,
  workflow,
  roundConfigs,
  runtimeData,
  runtimeActionBusy,
  savedStudies,
  savedStudiesLoading,
  savedStudiesError,
  onRefreshSavedStudies,
  onOpenSavedStudy,
  onArchiveSavedStudy,
  onArchiveSmokeTestStudies,
  onRespondParticipantIssue,
}: {
  study: StudyRecord;
  role: UserRole;
  workflow: ConductorWorkflow;
  roundConfigs: RoundConfig[];
  runtimeData: RuntimeStudyData;
  runtimeActionBusy: string | null;
  savedStudies: SavedStudyRecord[];
  savedStudiesLoading: boolean;
  savedStudiesError: string | null;
  onRefreshSavedStudies: () => void;
  onOpenSavedStudy: (record: SavedStudyRecord) => void;
  onArchiveSavedStudy: (record: SavedStudyRecord) => void;
  onArchiveSmokeTestStudies: () => void;
  onRespondParticipantIssue: (issueId: string, status: ParticipantIssue["status"], responseNote: string) => void;
}) {
  const launchBlockers = evaluateLaunchGate(study);
  const actionChecklist = buildActionableChecklist({ workflow, roundConfigs, runtimeData });
  const checklistComplete = actionChecklist.filter((item) => item.complete).length;
  const backendStepsComplete = [
    "create-study",
    "create-version",
    "save-wizard-packet",
    "set-design",
    "set-consensus",
    "submit",
    "owner-signoff",
    "steward-signoff",
    "activate",
    "open-round-1",
  ].filter((step) => workflowStepDone(workflow, step as WorkflowStep)).length;

  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Visual management</span>
          <h2>Blockers, flow, and risk are visible before handoffs</h2>
        </div>
        <div className="stat-grid">
          <StatCard label="Response rate" value={`${study.responseRate}%`} supporting="Across currently open tasks." />
          <StatCard label="Launch blockers" value={String(launchBlockers.length)} supporting="Governance and reporting safeguards." />
          <StatCard label="Current role" value={roleLabels[role]} supporting="UI visibility mirrors backend roles." />
          <StatCard label="Backend setup" value={`${backendStepsComplete}/10`} supporting={workflow.version?.opened_round1_at ? "Round 1 is open." : "Use Study Builder to launch."} />
          <StatCard label="Study flow" value={`${checklistComplete}/${actionChecklist.length}`} supporting="Live conductor checklist." />
        </div>
      </section>

      <ParticipantIssueInbox
        busyAction={runtimeActionBusy}
        issues={runtimeData.participantIssues}
        onRespond={onRespondParticipantIssue}
      />

      <section className="panel wide">
        <div className="split-line">
          <div>
            <h3>Actionable Workflow Checklist</h3>
            <p className="muted">Use this to see the study-level path from design through reporting.</p>
          </div>
          <StatusBadge risk={checklistComplete === actionChecklist.length ? "success" : "warning"} label={`${checklistComplete}/${actionChecklist.length} complete`} />
        </div>
        <div className="workflow-checklist">
          {actionChecklist.map((item, index) => (
            <article className={item.complete ? "workflow-check complete" : "workflow-check"} key={item.label}>
              <div className="workflow-index">{index + 1}</div>
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
              <StatusBadge risk={item.complete ? "success" : "locked"} label={item.complete ? "Done" : "Waiting"} />
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="split-line">
          <div>
            <h3>Saved Studies</h3>
            <p className="muted">Open an existing study workspace or refresh the backend list.</p>
          </div>
          <button className="secondary-button" onClick={onRefreshSavedStudies} type="button">
            {savedStudiesLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button className="secondary-button danger-button" onClick={onArchiveSmokeTestStudies} type="button">
            Archive test workspaces
          </button>
        </div>

        {savedStudiesError ? (
          <WarningBanner title="Unable to load saved studies" risk="danger">
            {humanizeBackendMessage(savedStudiesError)}
          </WarningBanner>
        ) : null}

        {savedStudies.length === 0 && !savedStudiesLoading ? (
          <WarningBanner title="No saved studies yet" risk="info">
            Use Study Builder to create the first backend-backed study.
          </WarningBanner>
        ) : (
          <div className="saved-study-list">
            {savedStudies.map((record) => {
              const latest = record.latestVersion;
              const status = latest ? formatStatus(latest.status) : "No version";
              const isCurrentStudy = record.study.id === workflow.study?.id;
              const hasSavedPacket = Boolean(latest?.study_design_packet_json);
              const displayTitle = packetText(latest?.study_design_packet_json, "title") ?? record.study.title;
              const displayDescription =
                packetText(latest?.study_design_packet_json, "description") ??
                record.study.description ??
                "No description provided.";
              const cta =
                latest?.status === "Draft"
                  ? "Continue setup"
                  : latest?.status === "ReadyForSignoff"
                    ? "Review signoff"
                    : latest?.status === "Active"
                      ? "Manage study"
                      : "Open";

              return (
                <article className={isCurrentStudy ? "saved-study-row current" : "saved-study-row"} key={record.study.id}>
                  <div>
                    <div className="saved-study-title">
                      <strong>{displayTitle}</strong>
                      {isCurrentStudy ? <StatusBadge risk="info" label="Current study" /> : null}
                    </div>
                    <p>{displayDescription}</p>
                    <small>
                      Saved {formatDateTime(record.study.created_at)} - ID {shortId(record.study.id)} - {latest ? `Version ${latest.version_number}` : "No versions"}
                    </small>
                  </div>
                  <div className="saved-study-actions">
                    <StatusBadge risk={latest?.status === "Active" ? "success" : "warning"} label={status} />
                    <StatusBadge risk={hasSavedPacket ? "success" : "locked"} label={hasSavedPacket ? "Design saved" : "No design packet"} />
                    <button className="secondary-button" onClick={() => onOpenSavedStudy(record)} type="button">
                      {cta}
                    </button>
                    <button className="secondary-button danger-button" onClick={() => onArchiveSavedStudy(record)} type="button">
                      Archive
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Round Flow</h3>
        {study.rounds.map((round) => (
          <DataBar key={round.roundNumber} value={round.responseRate} label={`Round ${round.roundNumber} response rate`} />
        ))}
      </section>

      <section className="panel">
        <h3>Current Blockers</h3>
        {launchBlockers.length === 0 ? (
          <WarningBanner title="Ready for governed action" risk="success">
            No launch blockers are visible in the current model.
          </WarningBanner>
        ) : (
          <ul className="plain-list">
            {launchBlockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel wide">
        <h3>Security Alerts</h3>
        <div className="notice-grid">
          {study.securityAlerts.map((alert) => (
            <WarningBanner key={alert} title="Security review">
              {alert}
            </WarningBanner>
          ))}
        </div>
      </section>
    </div>
  );
}

function StudyBuilderScreen({
  role,
  workflow,
  wizard,
  activeWizardStep,
  onWizardChange,
  onWizardStepChange,
  onWorkflowStep,
}: {
  role: UserRole;
  workflow: ConductorWorkflow;
  wizard: StudyWizardState;
  activeWizardStep: StudyWizardStepId;
  onWizardChange: (state: StudyWizardState) => void;
  onWizardStepChange: (step: StudyWizardStepId) => void;
  onWorkflowStep: (step: WorkflowStep) => void;
}) {
  const selectedMethod = methodRegistry.find((method) =>
    wizard.studyFormat === "ModifiedDelphi" ? method.id === "modified-delphi" : method.id === "classic-delphi",
  );
  const activeIndex = wizardSteps.findIndex((step) => step.id === activeWizardStep);
  const activeStep = wizardSteps[activeIndex] ?? wizardSteps[0];
  const activeBlockers = validateWizardStep(activeStep.id, wizard);
  const reviewBlockers = validateWizardStep("review", wizard);
  const wizardProgress = Math.round(((activeIndex + 1) / wizardSteps.length) * 100);
  const governanceSummary = buildGovernanceSummary(wizard);
  const saveButtonLabel = activeStep.id === "review" ? "Save study design" : "Save section";
  const saveBlocked =
    role !== "study_owner" ||
    (workflow.version !== null && workflow.version.status !== "Draft") ||
    workflow.busyStep !== null;
  const instrumentLocked = Boolean(workflow.version && workflow.version.status !== "Draft");
  const [contextOpen, setContextOpen] = useState(false);
  const [contextRecord, setContextRecord] = useState<StudyContextDisclosure | null>(null);
  const [contextValidation, setContextValidation] = useState<StudyContextValidation | null>(null);
  const [contextBusy, setContextBusy] = useState<string | null>(null);
  const [contextMessage, setContextMessage] = useState<string | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [proposalSourceName, setProposalSourceName] = useState("");
  const [proposalSourceText, setProposalSourceText] = useState("");

  useEffect(() => {
    if (!contextOpen) return;
    if (!workflow.study || !workflow.version) {
      setContextRecord((current) => current ?? createDraftStudyContext(wizard));
      setContextValidation((current) => current ?? validateDraftStudyContext(createDraftStudyContext(wizard)));
      setContextError(null);
      setContextBusy(null);
      return;
    }
    let cancelled = false;
    setContextBusy("load");
    setContextError(null);
    conductorApi
      .getStudyContextDisclosure(workflow.study.id, workflow.version.id, role)
      .then((result) => {
        if (cancelled) return;
        setContextRecord(result.context);
        setContextValidation(result.validation);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Unable to load study context.";
        if (message === "study_version_not_found" || message === "Not Found") {
          const draft = createDraftStudyContext(wizard);
          setContextRecord((current) => current ?? draft);
          setContextValidation(validateDraftStudyContext(draft));
          setContextMessage("Draft preview mode is available. Create or open the backend study before saving audited context.");
          return;
        }
        setContextError(message);
      })
      .finally(() => {
        if (!cancelled) setContextBusy(null);
      });
    return () => {
      cancelled = true;
    };
  }, [contextOpen, role, workflow.study, workflow.version, wizard]);

  async function saveContext(record = contextRecord) {
    if (!record) return;
    if (!workflow.study || !workflow.version) {
      const validation = validateDraftStudyContext(record);
      setContextRecord({ ...record, status: contextHasSuppliedDraft(record) ? "draft" : "optional" });
      setContextValidation(validation);
      setContextError(null);
      setContextMessage("Draft kept in this Study Builder session. Create or open the backend study before saving audited context.");
      return;
    }
    setContextBusy("save");
    setContextError(null);
    setContextMessage(null);
    try {
      const result = await conductorApi.updateStudyContextDisclosure(workflow.study.id, workflow.version.id, role, record);
      setContextRecord(result.context);
      setContextValidation(result.validation);
      setContextMessage("Study context saved. Blank optional fields remain non-blocking.");
    } catch (error) {
      setContextError(error instanceof Error ? error.message : "Unable to save study context.");
    } finally {
      setContextBusy(null);
    }
  }

  async function generateContextDisclosure() {
    if (!contextRecord) return;
    if (!workflow.study || !workflow.version) {
      const generated = generateDraftParticipantDisclosure(contextRecord);
      setContextRecord(generated);
      setContextValidation(validateDraftStudyContext(generated));
      setContextError(null);
      setContextMessage("Draft participant disclosure preview generated. Save a backend study to include it in audited exports.");
      return;
    }
    setContextBusy("generate");
    setContextError(null);
    setContextMessage(null);
    try {
      const result = await conductorApi.generateStudyContextParticipantDisclosure(workflow.study.id, workflow.version.id, role);
      setContextRecord(result.context);
      setContextValidation(result.validation);
      setContextMessage("Participant-facing disclosure preview generated from supplied metadata.");
    } catch (error) {
      setContextError(error instanceof Error ? error.message : "Unable to generate disclosure.");
    } finally {
      setContextBusy(null);
    }
  }

  async function runProposalImport() {
    if (!proposalSourceText.trim()) return;
    if (!workflow.study || !workflow.version) {
      setContextError(null);
      setContextMessage("Create or open the backend study before running audited proposal extraction. The proposal text is not uploaded in draft preview mode.");
      return;
    }
    setContextBusy("import");
    setContextError(null);
    setContextMessage(null);
    try {
      const result = await conductorApi.importStudyContextProposal(
        workflow.study.id,
        workflow.version.id,
        role,
        proposalSourceName || "pasted proposal text",
        proposalSourceText,
      );
      setContextRecord(result.context);
      setContextValidation(result.validation);
      setContextMessage("AI extraction suggestions created for human review. Nothing is final until accepted or edited.");
    } catch (error) {
      setContextError(error instanceof Error ? error.message : "Unable to import proposal text.");
    } finally {
      setContextBusy(null);
    }
  }

  async function decideContextSuggestion(
    suggestionId: string,
    action: "accept" | "edit" | "reject",
    editedValue?: string | boolean | null,
  ) {
    if (!workflow.study || !workflow.version) return;
    setContextBusy(suggestionId);
    setContextError(null);
    setContextMessage(null);
    try {
      const result = await conductorApi.decideStudyContextSuggestion(
        workflow.study.id,
        workflow.version.id,
        role,
        suggestionId,
        action,
        editedValue,
      );
      setContextRecord(result.context);
      setContextValidation(result.validation);
      setContextMessage(`Suggestion ${action === "reject" ? "rejected" : action === "edit" ? "edited and applied" : "accepted and applied"}.`);
    } catch (error) {
      setContextError(error instanceof Error ? error.message : "Unable to update suggestion.");
    } finally {
      setContextBusy(null);
    }
  }

  function updateContextDraft(nextContext: StudyContextDisclosure | null) {
    setContextRecord(nextContext);
    if (!workflow.study || !workflow.version) {
      setContextValidation(nextContext ? validateDraftStudyContext(nextContext) : null);
    }
  }

  const contextStatusLabel = contextRecord?.proposal_import.suggestions.some((suggestion) => suggestion.status === "pending")
    ? "AI suggestions pending review"
    : contextValidation?.status === "review_recommended"
      ? "Steward review recommended"
      : contextRecord?.status === "supplied" || contextRecord?.status === "draft"
        ? "Draft context added"
        : "Optional";

  function updateWizard(patch: Partial<StudyWizardState>) {
    onWizardChange(normalizeWizardResearchQuestions({ ...wizard, ...patch }));
  }

  function updateMethod(studyFormat: StudyWizardState["studyFormat"]) {
    onWizardChange(normalizeWizardResearchQuestions(normalizeWizardForMethod({ ...wizard, studyFormat })));
  }

  function moveWizard(delta: number) {
    const nextStep = wizardSteps[Math.min(Math.max(activeIndex + delta, 0), wizardSteps.length - 1)];
    onWizardStepChange(nextStep.id);
  }

  return (
    <div className="wizard-layout">
      <section className="panel wide">
        <div className="section-heading builder-heading">
          <div>
            <span className="eyebrow">Study Builder</span>
            <h2>Design the study once, then carry it into governance and launch</h2>
          </div>
          <button className="context-sidecar-trigger" onClick={() => setContextOpen(true)} type="button">
            <span>Study Context & Disclosures</span>
            <small>{contextStatusLabel}</small>
          </button>
        </div>
        <div className="wizard-stepper" role="tablist" aria-label="Study builder steps">
          {wizardSteps.map((step, index) => {
            const complete = validateWizardStep(step.id, wizard).length === 0;

            return (
            <button
              aria-selected={activeWizardStep === step.id}
              className={activeWizardStep === step.id ? "step-chip active" : "step-chip"}
              key={step.id}
              onClick={() => onWizardStepChange(step.id)}
              role="tab"
              type="button"
            >
              <span>{index + 1}</span>
              <strong>{step.label}</strong>
              <small>{complete ? "Complete" : "Needs input"}</small>
            </button>
            );
          })}
        </div>
      </section>

      <section className="panel wizard-main">
        <div className="split-line">
          <div>
            <span className="eyebrow">Step {activeIndex + 1} of {wizardSteps.length}</span>
            <h3>{activeStep.label}</h3>
            <p className="muted">{activeStep.description}</p>
          </div>
          <StatusBadge risk={activeBlockers.length === 0 ? "success" : "warning"} label={activeBlockers.length === 0 ? "Complete" : `${activeBlockers.length} blocker${activeBlockers.length === 1 ? "" : "s"}`} />
        </div>

        <WizardStepFields
          step={activeStep.id}
          wizard={wizard}
          selectedMethodLabel={selectedMethod?.label ?? "Delphi"}
          instrumentLocked={instrumentLocked}
          onChange={updateWizard}
          onMethodChange={updateMethod}
        />

        {activeBlockers.length > 0 ? (
          <WarningBanner title="Missing requirement" risk="warning">
            <ul className="compact-list">
              {activeBlockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </WarningBanner>
        ) : null}

        {workflow.error ? (
          <WarningBanner title="Save did not complete" risk="danger">
            {humanizeBackendMessage(workflow.error)}
          </WarningBanner>
        ) : null}

        {workflow.lastMessage === "Study Builder packet saved." ? (
          <WarningBanner title="Saved" risk="success">
            Study design saved to the backend. You can leave this page and reopen the study from the Dashboard.
          </WarningBanner>
        ) : null}

        <div className="wizard-actions">
          <button className="secondary-button" disabled={activeIndex === 0} onClick={() => moveWizard(-1)} type="button">
            Previous
          </button>
          <button
            className={activeStep.id === "review" ? "primary-button" : "secondary-button"}
            disabled={saveBlocked}
            onClick={() => onWorkflowStep("save-wizard-packet")}
            type="button"
          >
            {workflow.busyStep === "save-wizard-packet" ? "Saving..." : saveButtonLabel}
          </button>
          <button
            className="primary-button"
            disabled={activeIndex === wizardSteps.length - 1}
            onClick={() => moveWizard(1)}
            type="button"
          >
            Next
          </button>
        </div>
      </section>

      <section className="panel wizard-side">
        <h3>Readiness</h3>
        <DataBar value={wizardProgress} label="Wizard progress" />
        <dl className="detail-list">
          <div>
            <dt>Current step</dt>
            <dd>{activeIndex + 1} of {wizardSteps.length}</dd>
          </div>
          <div>
            <dt>Governance readiness</dt>
            <dd>{reviewBlockers.length === 0 ? "Ready" : "Needs input"}</dd>
          </div>
          <div>
            <dt>Backend study</dt>
            <dd>{workflow.study ? "Saved" : "Not saved"}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{workflow.version ? formatStatus(workflow.version.status) : "Not created"}</dd>
          </div>
          <div>
            <dt>Governance blockers</dt>
            <dd>{reviewBlockers.length}</dd>
          </div>
        </dl>
        <WarningBanner title="Method guardrail" risk="info">
          Round 1 should collect open-ended input unless a modified Delphi design is explicitly documented with a bias warning.
        </WarningBanner>
      </section>

      <section className="panel wide">
        <div className="split-line">
          <div>
            <h3>Governance and IRB Study Summary</h3>
            <p className="muted">This is the working summary produced by the wizard. It is ready to become the governance packet once blockers are cleared.</p>
          </div>
          <StatusBadge risk={reviewBlockers.length === 0 ? "success" : "warning"} label={reviewBlockers.length === 0 ? "Ready for backend save" : "Draft"} />
        </div>
        <div className="summary-grid">
          {governanceSummary.map((item) => (
            <article className="summary-item" key={item.label}>
              <strong>{item.label}</strong>
              <p>{item.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <ConductorWorkflowPanel role={role} workflow={workflow} wizard={wizard} onWorkflowStep={onWorkflowStep} />
      </section>

      {contextOpen ? (
        <StudyContextSidecar
          busy={contextBusy}
          context={contextRecord}
          error={contextError}
          hasBackendStudy={Boolean(workflow.study && workflow.version)}
          message={contextMessage}
          proposalSourceName={proposalSourceName}
          proposalSourceText={proposalSourceText}
          validation={contextValidation}
          onClose={() => setContextOpen(false)}
          onContextChange={updateContextDraft}
          onGenerateDisclosure={generateContextDisclosure}
          onImportProposal={runProposalImport}
          onProposalSourceNameChange={setProposalSourceName}
          onProposalSourceTextChange={setProposalSourceText}
          onSave={saveContext}
          onSuggestionDecision={decideContextSuggestion}
        />
      ) : null}
    </div>
  );
}

const ternaryOptions = [
  ["not_specified", "Not specified"],
  ["no", "No"],
  ["yes", "Yes"],
  ["not_applicable", "Not applicable"],
  ["unknown_needs_review", "Unknown / needs review"],
] as const;

function createDraftStudyContext(wizard: StudyWizardState): StudyContextDisclosure {
  const now = new Date().toISOString();
  return {
    study_id: "draft",
    version_id: "draft",
    status: "optional",
    basic_context: {
      study_title: wizard.title,
      study_short_name: "",
      pi_or_study_owner: "",
      institution_or_organization: "",
    },
    funding: {
      funding_status: "not_specified",
      funder_name: "",
      sponsor_name: "",
      grant_or_contract_number: "",
      sponsor_roles: [],
      role_details: "",
    },
    data_access: {
      sponsor_can_access_raw_responses: "not_specified",
      sponsor_can_access_identifiable_data: "not_specified",
      sponsor_can_access_aggregate_results: "not_specified",
      sponsor_has_report_review_rights: "not_specified",
      sponsor_has_report_approval_rights: "not_specified",
      sponsor_has_publication_approval_rights: "not_specified",
      dissemination_constraints: "",
      data_ownership_statement: "",
    },
    coi: {
      no_known_coi: false,
      coi_statement: "",
      required_disclosure_language: "",
      reviewer_notes: "",
    },
    participant_disclosure: {
      generated_text: "",
      last_generated_at: null,
      edited_text: "",
      requires_review: false,
      review_reasons: [],
    },
    proposal_import: {
      source_document_name: "",
      source_text_hash: "",
      source_text_excerpt: "",
      extraction_mode: "none",
      extraction_invoked_at: now,
      suggestions: [],
    },
  };
}

function contextHasSuppliedDraft(context: StudyContextDisclosure): boolean {
  return Boolean(
    context.basic_context.study_short_name.trim() ||
      context.basic_context.pi_or_study_owner.trim() ||
      context.basic_context.institution_or_organization.trim() ||
      context.funding.funding_status !== "not_specified" ||
      context.funding.funder_name.trim() ||
      context.funding.sponsor_name.trim() ||
      context.funding.grant_or_contract_number.trim() ||
      context.funding.role_details.trim() ||
      context.data_access.sponsor_can_access_raw_responses !== "not_specified" ||
      context.data_access.sponsor_can_access_identifiable_data !== "not_specified" ||
      context.data_access.sponsor_can_access_aggregate_results !== "not_specified" ||
      context.data_access.sponsor_has_report_review_rights !== "not_specified" ||
      context.data_access.sponsor_has_report_approval_rights !== "not_specified" ||
      context.data_access.sponsor_has_publication_approval_rights !== "not_specified" ||
      context.data_access.dissemination_constraints.trim() ||
      context.data_access.data_ownership_statement.trim() ||
      context.coi.no_known_coi ||
      context.coi.coi_statement.trim() ||
      context.coi.required_disclosure_language.trim() ||
      context.participant_disclosure.generated_text.trim() ||
      context.participant_disclosure.edited_text.trim(),
  );
}

function draftMaterialConditions(context: StudyContextDisclosure): string[] {
  const conditions: string[] = [];
  if (context.data_access.sponsor_can_access_raw_responses === "yes") conditions.push("sponsor_raw_response_access");
  if (context.data_access.sponsor_can_access_identifiable_data === "yes") conditions.push("sponsor_identifiable_data_access");
  if (context.data_access.sponsor_has_report_approval_rights === "yes") conditions.push("sponsor_report_approval_rights");
  if (context.data_access.sponsor_has_publication_approval_rights === "yes") conditions.push("sponsor_publication_control");
  if (!context.coi.no_known_coi && context.coi.coi_statement.trim()) conditions.push("material_coi_statement");
  return conditions;
}

function validateDraftStudyContext(context: StudyContextDisclosure): StudyContextValidation {
  const materialConditions = draftMaterialConditions(context);
  const warnings = materialConditions.length > 0 && !(
    context.participant_disclosure.edited_text.trim() ||
    context.participant_disclosure.generated_text.trim()
  )
    ? ["Supplied sponsor, data-access, publication-control, or COI conditions should be reflected in the participant-facing disclosure."]
    : [];

  return {
    status: materialConditions.length > 0 ? "review_recommended" : contextHasSuppliedDraft(context) ? "ready" : "optional",
    warnings,
    material_conditions: materialConditions,
  };
}

function generateDraftParticipantDisclosure(context: StudyContextDisclosure): StudyContextDisclosure {
  const conductor = context.basic_context.institution_or_organization.trim()
    || context.basic_context.pi_or_study_owner.trim()
    || "the study team";
  const funderOrSponsor = context.funding.sponsor_name.trim() || context.funding.funder_name.trim();
  const hasNoExternal = context.funding.funding_status === "no_external_funding_or_sponsor";
  const sentences = [`This study is conducted by ${conductor}.`];

  if (hasNoExternal || !funderOrSponsor) {
    sentences.push("No external funder or sponsor has been listed for this study.");
  } else {
    sentences.push(`It is supported by ${funderOrSponsor}.`);
    if (context.data_access.sponsor_can_access_identifiable_data === "yes") {
      sentences.push("The sponsor/funder may access identifiable data as described in this study's confidentiality and data-use terms.");
    } else if (context.data_access.sponsor_can_access_raw_responses === "yes") {
      sentences.push("The sponsor/funder may access individual responses as described in this study's confidentiality and data-use terms.");
    } else if (context.data_access.sponsor_can_access_aggregate_results === "yes") {
      sentences.push("The sponsor/funder may receive aggregate results, but individual responses will not be shared.");
    } else {
      sentences.push("No additional sponsor role has been specified.");
    }
    if (
      context.data_access.sponsor_has_report_approval_rights === "yes" ||
      context.data_access.sponsor_has_publication_approval_rights === "yes"
    ) {
      sentences.push("The sponsor/funder has a review or approval role in dissemination, as described in this study's disclosure materials.");
    }
  }

  if (!context.coi.no_known_coi && context.coi.coi_statement.trim()) {
    sentences.push(context.coi.required_disclosure_language.trim() || context.coi.coi_statement.trim());
  }

  const materialConditions = draftMaterialConditions(context);
  return {
    ...context,
    status: contextHasSuppliedDraft(context) ? "draft" : "optional",
    participant_disclosure: {
      ...context.participant_disclosure,
      generated_text: sentences.join(" "),
      last_generated_at: new Date().toISOString(),
      requires_review: materialConditions.length > 0,
      review_reasons: materialConditions,
    },
  };
}

function StudyContextSidecar({
  busy,
  context,
  error,
  hasBackendStudy,
  message,
  proposalSourceName,
  proposalSourceText,
  validation,
  onClose,
  onContextChange,
  onGenerateDisclosure,
  onImportProposal,
  onProposalSourceNameChange,
  onProposalSourceTextChange,
  onSave,
  onSuggestionDecision,
}: {
  busy: string | null;
  context: StudyContextDisclosure | null;
  error: string | null;
  hasBackendStudy: boolean;
  message: string | null;
  proposalSourceName: string;
  proposalSourceText: string;
  validation: StudyContextValidation | null;
  onClose: () => void;
  onContextChange: (context: StudyContextDisclosure | null) => void;
  onGenerateDisclosure: () => void;
  onImportProposal: () => void;
  onProposalSourceNameChange: (value: string) => void;
  onProposalSourceTextChange: (value: string) => void;
  onSave: (context?: StudyContextDisclosure | null) => void;
  onSuggestionDecision: (suggestionId: string, action: "accept" | "edit" | "reject", editedValue?: string | boolean | null) => void;
}) {
  const pendingSuggestions = context?.proposal_import.suggestions.filter((suggestion) => suggestion.status === "pending") ?? [];
  const hasSponsorContext =
    context?.funding.funding_status === "externally_funded" ||
    context?.funding.funding_status === "sponsor_corporate_partner_involved";
  const hasMaterialContext = (validation?.material_conditions.length ?? 0) > 0;

  function patchContext(patch: Partial<StudyContextDisclosure>) {
    if (!context) return;
    onContextChange({ ...context, ...patch });
  }

  function patchBasic(patch: Partial<StudyContextDisclosure["basic_context"]>) {
    if (!context) return;
    patchContext({ basic_context: { ...context.basic_context, ...patch } });
  }

  function patchFunding(patch: Partial<StudyContextDisclosure["funding"]>) {
    if (!context) return;
    patchContext({ funding: { ...context.funding, ...patch } });
  }

  function patchDataAccess(patch: Partial<StudyContextDisclosure["data_access"]>) {
    if (!context) return;
    patchContext({ data_access: { ...context.data_access, ...patch } });
  }

  function patchCoi(patch: Partial<StudyContextDisclosure["coi"]>) {
    if (!context) return;
    patchContext({ coi: { ...context.coi, ...patch } });
  }

  function patchParticipantDisclosure(patch: Partial<StudyContextDisclosure["participant_disclosure"]>) {
    if (!context) return;
    patchContext({ participant_disclosure: { ...context.participant_disclosure, ...patch } });
  }

  return (
    <div className="sidecar-backdrop" role="presentation">
      <aside aria-label="Study Context & Disclosures" className="sidecar-panel">
        <div className="sidecar-header">
          <div>
            <span className="eyebrow">Optional sidecar</span>
            <h3>Study Context & Disclosures</h3>
            <p className="muted">Add funding, sponsorship, COI, and proposal context only when useful. Blank fields do not block launch.</p>
          </div>
          <button className="secondary-button icon-text" onClick={onClose} type="button">Close</button>
        </div>

        {!hasBackendStudy ? (
          <WarningBanner title="Draft preview mode" risk="info">
            You can draft context and preview participant disclosure now. Create or open the backend study before audited saving, proposal extraction, or export inclusion.
          </WarningBanner>
        ) : null}

        {busy === "load" ? <WarningBanner title="Loading" risk="info">Loading optional context.</WarningBanner> : null}
        {message ? <WarningBanner title="Context update" risk="success">{message}</WarningBanner> : null}
        {error ? <WarningBanner title="Context action blocked" risk="danger">{humanizeBackendMessage(error)}</WarningBanner> : null}

        {context ? (
          <>
            <div className="context-status-grid">
              <StatusBadge risk={validation?.status === "review_recommended" ? "warning" : context.status === "supplied" ? "success" : "info"} label={validation?.status === "review_recommended" ? "Steward review recommended" : context.status === "supplied" ? "Draft context added" : "Optional"} />
              <StatusBadge risk={pendingSuggestions.length > 0 ? "warning" : "info"} label={pendingSuggestions.length > 0 ? "AI suggestions pending review" : "No pending AI suggestions"} />
              <StatusBadge risk={hasMaterialContext ? "warning" : "info"} label={hasMaterialContext ? "COI/sponsor detail added" : "No material sponsor/COI condition supplied"} />
            </div>

            <section className="sidecar-section">
              <h4>Basic context</h4>
              <div className="form-grid compact-form-grid">
                <label className="field">
                  <span>Study short name</span>
                  <input value={context.basic_context.study_short_name} onChange={(event) => patchBasic({ study_short_name: event.target.value })} />
                </label>
                <label className="field">
                  <span>PI / study owner</span>
                  <input value={context.basic_context.pi_or_study_owner} onChange={(event) => patchBasic({ pi_or_study_owner: event.target.value })} />
                </label>
                <label className="field wide-field">
                  <span>Institution or organization</span>
                  <input value={context.basic_context.institution_or_organization} onChange={(event) => patchBasic({ institution_or_organization: event.target.value })} />
                </label>
              </div>
            </section>

            <section className="sidecar-section">
              <h4>Funding and sponsorship</h4>
              <div className="form-grid compact-form-grid">
                <label className="field wide-field">
                  <span>Funding/sponsorship status</span>
                  <select value={context.funding.funding_status} onChange={(event) => patchFunding({ funding_status: event.target.value as StudyContextDisclosure["funding"]["funding_status"] })}>
                    <option value="not_specified">Not specified</option>
                    <option value="no_external_funding_or_sponsor">No external funding or sponsor</option>
                    <option value="internally_supported">Internally supported</option>
                    <option value="externally_funded">Externally funded</option>
                    <option value="sponsor_corporate_partner_involved">Sponsor/corporate partner involved</option>
                    <option value="other_needs_explanation">Other / needs explanation</option>
                  </select>
                </label>
                {hasSponsorContext ? (
                  <>
                    <label className="field">
                      <span>Funder name</span>
                      <input value={context.funding.funder_name} onChange={(event) => patchFunding({ funder_name: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Sponsor/corporate partner</span>
                      <input value={context.funding.sponsor_name} onChange={(event) => patchFunding({ sponsor_name: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Grant or contract number</span>
                      <input value={context.funding.grant_or_contract_number} onChange={(event) => patchFunding({ grant_or_contract_number: event.target.value })} />
                    </label>
                    <label className="field">
                      <span>Sponsor/funder role</span>
                      <select
                        value={context.funding.sponsor_roles[0] ?? "not_specified"}
                        onChange={(event) => patchFunding({ sponsor_roles: [event.target.value] })}
                      >
                        <option value="not_specified">Not specified</option>
                        <option value="no_role_after_funding">No role after funding</option>
                        <option value="study_design_input">Study design input</option>
                        <option value="recruitment_support">Recruitment support</option>
                        <option value="data_access">Data access</option>
                        <option value="report_review">Report review</option>
                        <option value="publication_approval">Publication approval</option>
                        <option value="other_needs_explanation">Other / needs explanation</option>
                      </select>
                    </label>
                    <label className="field wide-field">
                      <span>Role details</span>
                      <textarea value={context.funding.role_details} onChange={(event) => patchFunding({ role_details: event.target.value })} />
                    </label>
                  </>
                ) : (
                  <WarningBanner title="Lean default" risk="info">
                    Sponsor details stay hidden unless external funding or sponsor involvement is selected.
                  </WarningBanner>
                )}
              </div>
            </section>

            {hasSponsorContext ? (
              <section className="sidecar-section">
                <h4>Data access and dissemination</h4>
                <div className="form-grid compact-form-grid">
                  <TernarySelect label="Sponsor/funder can access raw responses" value={context.data_access.sponsor_can_access_raw_responses} onChange={(value) => patchDataAccess({ sponsor_can_access_raw_responses: value })} />
                  <TernarySelect label="Sponsor/funder can access identifiable data" value={context.data_access.sponsor_can_access_identifiable_data} onChange={(value) => patchDataAccess({ sponsor_can_access_identifiable_data: value })} />
                  <TernarySelect label="Sponsor/funder can access aggregate results" value={context.data_access.sponsor_can_access_aggregate_results} onChange={(value) => patchDataAccess({ sponsor_can_access_aggregate_results: value })} />
                  <TernarySelect label="Report review rights" value={context.data_access.sponsor_has_report_review_rights} onChange={(value) => patchDataAccess({ sponsor_has_report_review_rights: value })} />
                  <TernarySelect label="Report approval rights" value={context.data_access.sponsor_has_report_approval_rights} onChange={(value) => patchDataAccess({ sponsor_has_report_approval_rights: value })} />
                  <TernarySelect label="Publication approval/control rights" value={context.data_access.sponsor_has_publication_approval_rights} onChange={(value) => patchDataAccess({ sponsor_has_publication_approval_rights: value })} />
                  <label className="field wide-field">
                    <span>Publication / dissemination constraints</span>
                    <textarea value={context.data_access.dissemination_constraints} onChange={(event) => patchDataAccess({ dissemination_constraints: event.target.value })} />
                  </label>
                  <label className="field wide-field">
                    <span>Data ownership statement</span>
                    <textarea value={context.data_access.data_ownership_statement} onChange={(event) => patchDataAccess({ data_ownership_statement: event.target.value })} />
                  </label>
                </div>
              </section>
            ) : null}

            <section className="sidecar-section">
              <h4>COI and disclosure</h4>
              <label className="checkbox-row">
                <input checked={context.coi.no_known_coi} onChange={(event) => patchCoi({ no_known_coi: event.target.checked })} type="checkbox" />
                <span>No known conflict of interest</span>
              </label>
              {!context.coi.no_known_coi ? (
                <div className="form-grid compact-form-grid">
                  <label className="field wide-field">
                    <span>Conflict-of-interest statement</span>
                    <textarea value={context.coi.coi_statement} onChange={(event) => patchCoi({ coi_statement: event.target.value })} />
                  </label>
                  <label className="field wide-field">
                    <span>Required disclosure language</span>
                    <textarea value={context.coi.required_disclosure_language} onChange={(event) => patchCoi({ required_disclosure_language: event.target.value })} />
                  </label>
                </div>
              ) : null}
            </section>

            <section className="sidecar-section">
              <h4>Participant disclosure preview</h4>
              {validation?.warnings.length ? (
                <WarningBanner title="Disclosure consistency safeguard" risk="warning">
                  {validation.warnings.join(" ")}
                </WarningBanner>
              ) : null}
              <div className="disclosure-preview">
                {context.participant_disclosure.edited_text || context.participant_disclosure.generated_text || "No participant-facing disclosure preview generated yet."}
              </div>
              <label className="field wide-field">
                <span>Edit concise participant-facing disclosure</span>
                <textarea value={context.participant_disclosure.edited_text} onChange={(event) => patchParticipantDisclosure({ edited_text: event.target.value })} />
              </label>
              <div className="button-row">
                <button className="secondary-button" disabled={busy !== null} onClick={onGenerateDisclosure} type="button">Generate disclosure preview</button>
                <button className="primary-button" disabled={busy !== null} onClick={() => onSave(context)} type="button">{busy === "save" ? "Saving..." : hasBackendStudy ? "Save context" : "Keep draft"}</button>
              </div>
            </section>

            <section className="sidecar-section">
              <h4>Import from funded proposal</h4>
              <p className="muted">Paste proposal, award, sponsorship, or contract summary text. Extraction is optional. AI suggestions are never final until accepted or edited.</p>
              <div className="form-grid compact-form-grid">
                <label className="field wide-field">
                  <span>Source document name</span>
                  <input value={proposalSourceName} onChange={(event) => onProposalSourceNameChange(event.target.value)} placeholder="Example: Award summary or sponsor agreement" />
                </label>
                <label className="field wide-field">
                  <span>Pasted source text</span>
                  <textarea value={proposalSourceText} onChange={(event) => onProposalSourceTextChange(event.target.value)} />
                </label>
              </div>
              <button className="secondary-button" disabled={busy !== null || !proposalSourceText.trim()} onClick={onImportProposal} type="button">Run optional extraction</button>
              {!hasBackendStudy ? (
                <p className="muted">Audited extraction is available after the study exists in the backend. Pasted text is not uploaded in draft preview mode.</p>
              ) : null}
              <div className="suggestion-list">
                {context.proposal_import.suggestions.map((suggestion) => (
                  <article className="suggestion-card" key={suggestion.suggestion_id}>
                    <div className="split-line">
                      <div>
                        <strong>{suggestion.label}</strong>
                        <p className="muted">{suggestion.field_path} · Confidence {suggestion.confidence} · {formatStatus(suggestion.status)}</p>
                      </div>
                      <StatusBadge risk={suggestion.status === "pending" ? "warning" : suggestion.status === "rejected" ? "danger" : "success"} label={formatStatus(suggestion.status)} />
                    </div>
                    <p><strong>Proposed value:</strong> {String(suggestion.proposed_value ?? "Not found / needs human review")}</p>
                    {suggestion.evidence_snippet ? <p className="muted">Evidence: {suggestion.evidence_snippet}</p> : null}
                    <p className="muted">{suggestion.rationale}</p>
                    {suggestion.status === "pending" ? (
                      <div className="button-row">
                        <button className="secondary-button" disabled={busy !== null} onClick={() => onSuggestionDecision(suggestion.suggestion_id, "accept")} type="button">Accept</button>
                        <button
                          className="secondary-button"
                          disabled={busy !== null}
                          onClick={() => {
                            const edited = window.prompt("Edit suggested value before applying it.", String(suggestion.proposed_value ?? ""));
                            if (edited !== null) onSuggestionDecision(suggestion.suggestion_id, "edit", edited);
                          }}
                          type="button"
                        >
                          Edit
                        </button>
                        <button className="secondary-button danger-text" disabled={busy !== null} onClick={() => onSuggestionDecision(suggestion.suggestion_id, "reject")} type="button">Reject</button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>

            <section className="sidecar-section">
              <h4>Export impact</h4>
              <p className="muted">Supplied context can improve IRB exports, final reports, reproducibility metadata, audit/export metadata, and the study manifest. Participants receive only the concise disclosure snippet.</p>
            </section>
          </>
        ) : null}
      </aside>
    </div>
  );
}

function TernarySelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: StudyContextDisclosure["data_access"]["sponsor_can_access_raw_responses"];
  onChange: (value: StudyContextDisclosure["data_access"]["sponsor_can_access_raw_responses"]) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as typeof value)}>
        {ternaryOptions.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function WizardStepFields({
  step,
  wizard,
  selectedMethodLabel,
  instrumentLocked,
  onChange,
  onMethodChange,
}: {
  step: StudyWizardStepId;
  wizard: StudyWizardState;
  selectedMethodLabel: string;
  instrumentLocked: boolean;
  onChange: (patch: Partial<StudyWizardState>) => void;
  onMethodChange: (studyFormat: StudyWizardState["studyFormat"]) => void;
}) {
  if (step === "purpose") {
    const normalizedWizard = normalizeWizardResearchQuestions(wizard);
    const questions = normalizedWizard.researchQuestions;
    const activeQuestions = questions.filter((question) => question.active);
    const commitQuestions = (nextQuestions: ResearchQuestion[]) => {
      const normalized = normalizeWizardResearchQuestions({ ...wizard, researchQuestions: nextQuestions });
      onChange({
        researchQuestion: normalized.researchQuestion,
        researchQuestions: normalized.researchQuestions,
      });
    };
    const updateQuestion = (questionId: string, patch: Partial<ResearchQuestion>) => {
      const now = new Date().toISOString();
      commitQuestions(questions.map((question) =>
        question.id === questionId ? { ...question, ...patch, updatedAt: now } : question
      ));
    };
    const addQuestion = () => {
      const nextQuestion = createResearchQuestionDraft(activeQuestions.length + 1);
      commitQuestions([...questions, nextQuestion]);
    };
    const removeQuestion = (questionId: string) => {
      if (activeQuestions.length <= 1) return;
      updateQuestion(questionId, { active: false });
    };
    const isDefaultQuestionLabel = (value?: string) => !value?.trim() || /^Research question\s*\d+$/i.test(value.trim());
    const moveQuestion = (questionId: string, delta: -1 | 1) => {
      const fromIndex = activeQuestions.findIndex((question) => question.id === questionId);
      const toIndex = fromIndex + delta;
      if (fromIndex < 0 || toIndex < 0 || toIndex >= activeQuestions.length) return;
      const now = new Date().toISOString();
      const reorderedActiveQuestions = [...activeQuestions];
      const [movedQuestion] = reorderedActiveQuestions.splice(fromIndex, 1);
      reorderedActiveQuestions.splice(toIndex, 0, movedQuestion);
      const orderedActiveQuestions = reorderedActiveQuestions.map((question, index) => ({
        ...question,
        displayOrder: index + 1,
        shortLabel: isDefaultQuestionLabel(question.shortLabel) ? `Research question ${index + 1}` : question.shortLabel,
        updatedAt: now,
      }));
      const inactiveQuestions = questions
        .filter((question) => !question.active)
        .map((question, index) => ({ ...question, displayOrder: orderedActiveQuestions.length + index + 1 }));
      commitQuestions([...orderedActiveQuestions, ...inactiveQuestions]);
    };

    return (
      <div className="form-grid">
        <label className="field wide-field">
          <span>Study title</span>
          <input disabled={instrumentLocked} value={wizard.title} onChange={(event) => onChange({ title: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Short description</span>
          <textarea disabled={instrumentLocked} value={wizard.description} onChange={(event) => onChange({ description: event.target.value })} />
        </label>
        <fieldset className="field wide-field research-question-manager">
          <legend>Research questions</legend>
          <p className="muted">
            Most Delphi studies have one central aim. You may add multiple related research questions when they help structure Round 1 collection, item curation, and final reporting.
          </p>
          {instrumentLocked ? (
            <WarningBanner title="Research questions locked" risk="locked">
              Research questions are part of the study instrument and cannot be changed after governance launch for this version.
            </WarningBanner>
          ) : null}
          {activeQuestions.length > 5 ? (
            <WarningBanner title="Participant burden warning" risk="warning">
              Many research questions can increase participant burden, attrition risk, and analytic complexity. Consider whether these are related sub-questions of one Delphi study or should be separate studies.
            </WarningBanner>
          ) : null}
          <div className="research-question-list">
            {activeQuestions.map((question, index) => (
              <article className="research-question-card" key={question.id}>
                <div className="question-card-header">
                  <strong>Question {index + 1}</strong>
                  <div className="icon-button-row" aria-label={`Question ${index + 1} order and removal controls`}>
                    <button
                      aria-label={`Move question ${index + 1} up`}
                      className="secondary-button"
                      disabled={instrumentLocked || index === 0}
                      onClick={() => moveQuestion(question.id, -1)}
                      type="button"
                    >
                      Move question up
                    </button>
                    <button
                      aria-label={`Move question ${index + 1} down`}
                      className="secondary-button"
                      disabled={instrumentLocked || index === activeQuestions.length - 1}
                      onClick={() => moveQuestion(question.id, 1)}
                      type="button"
                    >
                      Move question down
                    </button>
                    <button
                      aria-label={`Remove question ${index + 1}`}
                      className="secondary-button danger-button"
                      disabled={instrumentLocked || activeQuestions.length <= 1}
                      onClick={() => removeQuestion(question.id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <label className="field">
                  <span>Question text</span>
                  <textarea
                    disabled={instrumentLocked}
                    value={question.text}
                    onChange={(event) => updateQuestion(question.id, { text: event.target.value })}
                  />
                </label>
                <div className="two-column-fields">
                  <label className="field">
                    <span>Short label</span>
                    <input
                      disabled={instrumentLocked}
                      value={question.shortLabel ?? ""}
                      onChange={(event) => updateQuestion(question.id, { shortLabel: event.target.value })}
                    />
                  </label>
                  <label className="check-field question-required-row">
                    <input
                      checked={question.requiredForRound1Response}
                      disabled={instrumentLocked}
                      onChange={(event) => updateQuestion(question.id, { requiredForRound1Response: event.target.checked })}
                      type="checkbox"
                    />
                    <span>Required in Round 1</span>
                  </label>
                </div>
                <label className="field">
                  <span>Optional participant-facing description</span>
                  <textarea
                    disabled={instrumentLocked}
                    value={question.description ?? ""}
                    onChange={(event) => updateQuestion(question.id, { description: event.target.value })}
                  />
                  <small>Keep this neutral. Do not imply a preferred answer or expected agreement.</small>
                </label>
              </article>
            ))}
          </div>
          <button className="secondary-button" disabled={instrumentLocked} onClick={addQuestion} type="button">
            Add research question
          </button>
        </fieldset>
        <label className="field wide-field">
          <span>Objective</span>
          <textarea disabled={instrumentLocked} value={wizard.objective} onChange={(event) => onChange({ objective: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Why Delphi is suitable</span>
          <textarea disabled={instrumentLocked} value={wizard.delphiSuitability} onChange={(event) => onChange({ delphiSuitability: event.target.value })} />
        </label>
      </div>
    );
  }

  if (step === "method") {
    return (
      <div className="form-grid">
        <fieldset className="field wide-field">
          <legend>Method model</legend>
          <div className="segmented-control">
            <button
              className={wizard.studyFormat === "ModifiedDelphi" ? "active" : ""}
              onClick={() => onMethodChange("ModifiedDelphi")}
              type="button"
            >
              Modified Delphi
            </button>
            <button
              className={wizard.studyFormat === "ClassicDelphi" ? "active" : ""}
              onClick={() => onMethodChange("ClassicDelphi")}
              type="button"
            >
              Classic Delphi
            </button>
          </div>
          <p className="muted">Selected: {selectedMethodLabel}</p>
        </fieldset>
        <fieldset className="field wide-field">
          <legend>Round 1 mode</legend>
          <div className="segmented-control">
            <button
              className={wizard.roundOneMode === "open-ended" ? "active" : ""}
              onClick={() => onChange({ roundOneMode: "open-ended", modifiedDesignAcknowledged: true })}
              type="button"
            >
              Open-ended elicitation
            </button>
            <button
              className={wizard.roundOneMode === "structured" ? "active" : ""}
              onClick={() => onChange({ roundOneMode: "structured", modifiedDesignAcknowledged: false })}
              type="button"
            >
              Structured elicitation
            </button>
          </div>
        </fieldset>
        <label className="field wide-field">
          <span>Method rationale</span>
          <textarea value={wizard.modifiedDesignRationale} onChange={(event) => onChange({ modifiedDesignRationale: event.target.value })} />
        </label>
        <label className="check-field wide-field">
          <input
            checked={wizard.modifiedDesignAcknowledged}
            onChange={(event) => onChange({ modifiedDesignAcknowledged: event.target.checked })}
            type="checkbox"
          />
          <span>Bias warning acknowledged and documented for any structured Round 1 design.</span>
        </label>
      </div>
    );
  }

  if (step === "panel") {
    return (
      <div className="form-grid">
        <label className="field wide-field">
          <span>Panel inclusion criteria</span>
          <textarea value={wizard.panelCriteria} onChange={(event) => onChange({ panelCriteria: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Recruitment plan</span>
          <textarea value={wizard.recruitmentPlan} onChange={(event) => onChange({ recruitmentPlan: event.target.value })} />
        </label>
        <label className="field">
          <span>Target panel size</span>
          <input
            min={3}
            type="number"
            value={wizard.targetPanelSize}
            onChange={(event) => onChange({ targetPanelSize: Number(event.target.value) })}
          />
        </label>
      </div>
    );
  }

  if (step === "consent") {
    return (
      <div className="form-grid">
        <label className="field">
          <span>Consent version</span>
          <input value={wizard.consentVersion} onChange={(event) => onChange({ consentVersion: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Consent summary</span>
          <textarea value={wizard.consentSummary} onChange={(event) => onChange({ consentSummary: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Confidentiality language</span>
          <textarea value={wizard.confidentialityStatement} onChange={(event) => onChange({ confidentialityStatement: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Withdrawal process</span>
          <textarea value={wizard.withdrawalProcess} onChange={(event) => onChange({ withdrawalProcess: event.target.value })} />
        </label>
      </div>
    );
  }

  if (step === "rounds") {
    const preRoundInputRequired = consensusSourceRequiresPreRoundInput(wizard.consensusRuleSource);

    return (
      <div className="form-grid">
        <label className="field">
          <span>Planned rounds</span>
          <input min={2} type="number" value={wizard.plannedRoundCount} onChange={(event) => onChange({ plannedRoundCount: Number(event.target.value) })} />
        </label>
        <label className="field">
          <span>Terminal round</span>
          <input min={2} type="number" value={wizard.terminalRoundNumber} onChange={(event) => onChange({ terminalRoundNumber: Number(event.target.value) })} />
        </label>
        <label className="field">
          <span>Consensus threshold</span>
          <select value={wizard.consensusThreshold} onChange={(event) => onChange({ consensusThreshold: Number(event.target.value) })}>
            {[60, 70, 80, 90].map((threshold) => (
              <option key={threshold} value={threshold}>{threshold}%</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Agreement minimum rating</span>
          <input min={1} max={9} type="number" value={wizard.agreementMinRating} onChange={(event) => onChange({ agreementMinRating: Number(event.target.value) })} />
        </label>
        <div className="method-helper wide-field">
          <strong>Why these settings are locked before Round 1</strong>
          <p>
            The threshold is the percentage of respondents who must agree. The minimum rating defines which ratings count as agreement. For example, 80% at rating 7+ means an item reaches consensus only when at least 80% of respondents rate it 7, 8, or 9.
          </p>
        </div>
        <label className="field">
          <span>Consensus rule source</span>
          <select
            value={wizard.consensusRuleSource}
            onChange={(event) => {
              const source = event.target.value as StudyWizardState["consensusRuleSource"];
              const requiresInput = consensusSourceRequiresPreRoundInput(source);
              onChange({
                consensusRuleSource: source,
                preRoundConsensusInputEnabled: requiresInput,
                preRoundConsensusInputStatus: requiresInput ? "planned" : "not_required",
              });
            }}
          >
            {Object.entries(consensusRuleSourceLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="field wide-field">
          <span>Consensus setting process</span>
          <textarea value={wizard.consensusRuleProcess} onChange={(event) => onChange({ consensusRuleProcess: event.target.value })} />
        </label>
        {preRoundInputRequired ? (
          <>
            <WarningBanner title="Pre-round input, not a Delphi round" risk="info">
              This optional setup activity helps document how the threshold was considered before Round 1. It does not count as Round 1 and cannot change the locked rule after launch.
            </WarningBanner>
            <label className="field">
              <span>Pre-round input status</span>
              <select
                value={wizard.preRoundConsensusInputStatus}
                onChange={(event) => onChange({ preRoundConsensusInputStatus: event.target.value as StudyWizardState["preRoundConsensusInputStatus"] })}
              >
                {Object.entries(preRoundConsensusStatusLabels)
                  .filter(([value]) => value !== "not_required")
                  .map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
              </select>
            </label>
            <label className="field wide-field">
              <span>Neutral pre-round prompt</span>
              <textarea value={wizard.preRoundConsensusPrompt} onChange={(event) => onChange({ preRoundConsensusPrompt: event.target.value })} />
            </label>
            <label className="field wide-field">
              <span>How input was considered</span>
              <textarea value={wizard.preRoundConsensusSummary} onChange={(event) => onChange({ preRoundConsensusSummary: event.target.value })} />
            </label>
          </>
        ) : null}
        <div className="wide-field">
          <WarningBanner title="Locked before launch" risk="locked">
            Consensus rules are predefined before Round 1 and locked against mid-study changes.
          </WarningBanner>
        </div>
      </div>
    );
  }

  if (step === "feedback") {
    return (
      <div className="form-grid">
        <div className="check-stack wide-field">
          {[
            ["feedbackMedian", "Median"],
            ["feedbackIqr", "IQR / dispersion"],
            ["feedbackDistribution", "Distribution"],
            ["feedbackPriorResponse", "Your prior response"],
          ].map(([key, label]) => (
            <label className="check-field" key={key}>
              <input
                checked={Boolean(wizard[key as keyof StudyWizardState])}
                onChange={(event) => onChange({ [key]: event.target.checked } as Partial<StudyWizardState>)}
                type="checkbox"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <label className="field wide-field">
          <span>Neutral participant language</span>
          <textarea value={wizard.neutralFeedbackLanguage} onChange={(event) => onChange({ neutralFeedbackLanguage: event.target.value })} />
        </label>
      </div>
    );
  }

  if (step === "ai") {
    return (
      <div className="form-grid">
        <label className="check-field wide-field">
          <input checked={wizard.aiEnabled} onChange={(event) => onChange({ aiEnabled: event.target.checked })} type="checkbox" />
          <span>Enable AI drafting and organizing assistance for research-team materials.</span>
        </label>
        <label className="field wide-field">
          <span>AI disclosure</span>
          <textarea value={wizard.aiDisclosure} onChange={(event) => onChange({ aiDisclosure: event.target.value })} />
        </label>
        <label className="check-field wide-field">
          <input
            checked={wizard.aiHumanApprovalRequired}
            onChange={(event) => onChange({ aiHumanApprovalRequired: event.target.checked })}
            type="checkbox"
          />
          <span>Require explicit human Accept/Edit/Reject before participant-facing use.</span>
        </label>
      </div>
    );
  }

  if (step === "retention") {
    return (
      <div className="form-grid">
        <label className="field wide-field">
          <span>Retention schedule</span>
          <textarea value={wizard.retentionSchedule} onChange={(event) => onChange({ retentionSchedule: event.target.value })} />
        </label>
        <label className="field">
          <span>Export review role</span>
          <select value={wizard.exportReviewRole} onChange={(event) => onChange({ exportReviewRole: event.target.value as StudyWizardState["exportReviewRole"] })}>
            <option>Data Custodian</option>
            <option>Security & Privacy Lead</option>
          </select>
        </label>
        <label className="check-field wide-field">
          <input
            checked={wizard.dataSeparationConfirmed}
            onChange={(event) => onChange({ dataSeparationConfirmed: event.target.checked })}
            type="checkbox"
          />
          <span>Identity data and response data remain separated; identity-response mapping access is privileged and purpose logged.</span>
        </label>
      </div>
    );
  }

  return (
    <div className="review-stack">
      {buildGovernanceSummary(wizard).map((item) => (
        <article className="summary-item" key={item.label}>
          <strong>{item.label}</strong>
          <p>{item.value}</p>
        </article>
      ))}
    </div>
  );
}

function ConductorWorkflowPanel({
  role,
  workflow,
  wizard,
  onWorkflowStep,
}: {
  role: UserRole;
  workflow: ConductorWorkflow;
  wizard: StudyWizardState;
  onWorkflowStep: (step: WorkflowStep) => void;
}) {
  const version = workflow.version;
  const ownerCanAct = role === "study_owner";
  const stewardCanAct = role === "ethics_methods_steward";
  const methodBlockers = validateWizardStep("method", wizard);
  const roundBlockers = validateWizardStep("rounds", wizard);
  const reviewBlockers = validateWizardStep("review", wizard);

  const steps: Array<{
    id: WorkflowStep;
    label: string;
    detail: string;
    roleNote: string;
    disabled: boolean;
  }> = [
    {
      id: "create-study",
      label: "Create study",
      detail: workflow.study ? workflow.study.id : `Creates "${wizard.title}" in the backend.`,
      roleNote: "Study Owner",
      disabled: !ownerCanAct || Boolean(workflow.study) || validateWizardStep("purpose", wizard).length > 0,
    },
    {
      id: "create-version",
      label: "Create draft version",
      detail: version ? `Version ${version.version_number}: ${formatStatus(version.status)}` : "Creates the governed StudyVersion.",
      roleNote: "Study Owner",
      disabled: !ownerCanAct || !workflow.study || Boolean(version),
    },
    {
      id: "save-wizard-packet",
      label: "Save wizard progress",
      detail: workflowStepDone(workflow, "save-wizard-packet")
        ? "Full Study Builder packet is stored with this version."
        : "Creates a draft workspace if needed, then stores panel, consent, feedback, AI, retention, and governance inputs.",
      roleNote: "Study Owner",
      disabled: !ownerCanAct || (version !== null && version.status !== "Draft"),
    },
    {
      id: "set-design",
      label: "Apply method design",
      detail: version?.study_format ?? `Stores ${wizard.studyFormat}, round count, terminal round, and rationale.`,
      roleNote: "Study Owner",
      disabled:
        !ownerCanAct ||
        !version ||
        !workflowStepDone(workflow, "save-wizard-packet") ||
        methodBlockers.length > 0 ||
        workflowStepDone(workflow, "set-design"),
    },
    {
      id: "set-consensus",
      label: "Set consensus threshold",
      detail: version?.consensus_rule_json
        ? `${wizard.consensusThreshold}% agreement at rating ${wizard.agreementMinRating}+`
        : "Locks the predefined rule before Round 1.",
      roleNote: "Study Owner",
      disabled:
        !ownerCanAct ||
        !version ||
        roundBlockers.length > 0 ||
        !workflowStepDone(workflow, "set-design") ||
        workflowStepDone(workflow, "set-consensus"),
    },
    {
      id: "submit",
      label: "Submit for signoff",
      detail: version?.config_hash ? `Config hash: ${version.config_hash.slice(0, 12)}...` : "Computes the governed configuration hash.",
      roleNote: "Study Owner",
      disabled:
        !ownerCanAct ||
        !version ||
        reviewBlockers.length > 0 ||
        !workflowStepDone(workflow, "save-wizard-packet") ||
        !workflowStepDone(workflow, "set-consensus") ||
        workflowStepDone(workflow, "submit"),
    },
    {
      id: "owner-signoff",
      label: "Owner signoff",
      detail: hasSignoff(workflow, "Owner") ? "Owner signoff recorded." : "Records Study Owner approval.",
      roleNote: "Study Owner",
      disabled: !ownerCanAct || version?.status !== "ReadyForSignoff" || hasSignoff(workflow, "Owner"),
    },
    {
      id: "steward-signoff",
      label: "Ethics & Methods signoff",
      detail: hasSignoff(workflow, "MethodsSteward") ? "Methods signoff recorded." : "Switch role to Steward and approve.",
      roleNote: "Ethics & Methods Steward",
      disabled: !stewardCanAct || version?.status !== "ReadyForSignoff" || hasSignoff(workflow, "MethodsSteward"),
    },
    {
      id: "activate",
      label: "Activate version",
      detail: version?.status === "Active" ? "StudyVersion is active." : "Requires both signoffs.",
      roleNote: "Study Owner",
      disabled: !ownerCanAct || version?.status !== "ReadyForSignoff" || !hasSignoff(workflow, "Owner") || !hasSignoff(workflow, "MethodsSteward"),
    },
    {
      id: "open-round-1",
      label: "Open Round 1",
      detail: version?.opened_round1_at ? `Opened ${new Date(version.opened_round1_at).toLocaleString()}` : "Makes the open-ended round available.",
      roleNote: "Study Owner",
      disabled: !ownerCanAct || version?.status !== "Active" || Boolean(version.opened_round1_at),
    },
  ];

  return (
    <div className="workflow-panel">
      <div className="split-line">
        <div>
          <span className="eyebrow">Backend-backed vertical slice</span>
          <h3>Study setup and launch workflow</h3>
        </div>
        <StatusBadge risk={workflow.version?.opened_round1_at ? "success" : "warning"} label={workflow.version?.opened_round1_at ? "Round 1 open" : "In progress"} />
      </div>

      {workflow.error ? (
        <WarningBanner title="Backend action blocked" risk="danger">
          {humanizeBackendMessage(workflow.error)}
        </WarningBanner>
      ) : null}

      {workflow.lastMessage ? (
        <WarningBanner title="Last backend action" risk="success">
          {workflow.lastMessage}
        </WarningBanner>
      ) : null}

      <div className="workflow-steps">
        {steps.map((step, index) => {
          const done = workflowStepDone(workflow, step.id);
          const busy = workflow.busyStep === step.id;

          return (
            <article className="workflow-step" key={step.id}>
              <div className="workflow-index">{index + 1}</div>
              <div>
                <div className="split-line">
                  <strong>{step.label}</strong>
                  <StatusBadge risk={done ? "success" : "info"} label={done ? "Done" : step.roleNote} />
                </div>
                <p>{step.detail}</p>
              </div>
              <button
                className="secondary-button"
                disabled={step.disabled || busy || workflow.busyStep !== null}
                onClick={() => onWorkflowStep(step.id)}
                type="button"
              >
                {busy ? "Working..." : step.id === "save-wizard-packet" && done ? "Save again" : done ? "Complete" : "Run"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function buildGovernanceChecklist(wizard: StudyWizardState, workflow: ConductorWorkflow): GovernanceChecklistItem[] {
  const purposeComplete = validateWizardStep("purpose", wizard).length === 0;
  const methodComplete = validateWizardStep("method", wizard).length === 0 && validateWizardStep("rounds", wizard).length === 0;
  const consentComplete = validateWizardStep("consent", wizard).length === 0;
  const feedbackComplete = validateWizardStep("feedback", wizard).length === 0;
  const aiComplete = validateWizardStep("ai", wizard).length === 0;
  const retentionComplete = validateWizardStep("retention", wizard).length === 0;
  const packetSaved = workflowStepDone(workflow, "save-wizard-packet");
  const methodApplied = workflowStepDone(workflow, "set-design");
  const thresholdLocked = workflowStepDone(workflow, "set-consensus");

  return [
    {
      id: "packet",
      label: "Study Builder packet saved",
      detail: packetSaved
        ? "The current study design packet is attached to this governed version."
        : "Save the study design packet before governance review.",
      complete: packetSaved,
      risk: "warning",
    },
    {
      id: "purpose",
      label: "Delphi suitability documented",
      detail: wizard.delphiSuitability,
      complete: purposeComplete,
      risk: "warning",
    },
    {
      id: "method-rounds",
      label: "Method and round plan ready",
      detail: `${wizard.studyFormat === "ClassicDelphi" ? "Classic Delphi" : "Modified Delphi"} with ${wizard.plannedRoundCount} planned rounds and terminal round ${wizard.terminalRoundNumber}.`,
      complete: methodComplete && methodApplied,
      risk: methodComplete ? "warning" : "danger",
    },
    {
      id: "consent",
      label: "Consent and withdrawal language ready",
      detail: `${wizard.consentVersion}: ${wizard.withdrawalProcess}`,
      complete: consentComplete,
      risk: "warning",
    },
    {
      id: "confidentiality",
      label: "Confidentiality language ready",
      detail: wizard.confidentialityStatement,
      complete: consentComplete,
      risk: "warning",
    },
    {
      id: "feedback",
      label: "Controlled feedback configured",
      detail: wizard.neutralFeedbackLanguage,
      complete: feedbackComplete,
      risk: "warning",
    },
    {
      id: "ai",
      label: "AI settings disclosed",
      detail: wizard.aiEnabled ? wizard.aiDisclosure : "AI disabled for this study.",
      complete: aiComplete,
      risk: "warning",
    },
    {
      id: "retention",
      label: "Retention and export review ready",
      detail: `${wizard.retentionSchedule} Export review: ${wizard.exportReviewRole}.`,
      complete: retentionComplete,
      risk: "warning",
    },
    {
      id: "threshold",
      label: "Consensus rule locked before launch",
      detail: `${wizard.consensusThreshold}% agreement at rating ${wizard.agreementMinRating}+; source: ${consensusRuleSourceLabels[wizard.consensusRuleSource]}.`,
      complete: thresholdLocked,
      risk: "locked",
    },
    {
      id: "consensus-source",
      label: "Consensus-setting process documented",
      detail: wizard.preRoundConsensusInputEnabled
        ? `${preRoundConsensusStatusLabels[wizard.preRoundConsensusInputStatus]} pre-round input documented.`
        : wizard.consensusRuleProcess,
      complete:
        Boolean(wizard.consensusRuleProcess.trim()) &&
        (!wizard.preRoundConsensusInputEnabled ||
          (["reviewed", "finalized"].includes(wizard.preRoundConsensusInputStatus) &&
            Boolean(wizard.preRoundConsensusSummary.trim()))),
      risk: wizard.preRoundConsensusInputEnabled ? "warning" : "info",
    },
  ];
}

function GovernanceScreen({
  role,
  workflow,
  wizard,
  onWorkflowStep,
}: {
  role: UserRole;
  workflow: ConductorWorkflow;
  wizard: StudyWizardState;
  onWorkflowStep: (step: WorkflowStep) => void;
}) {
  const governedStatus = workflow.version?.status ?? "Draft";
  const editAllowed = canEditConsensusRule(governedStatus);
  const checklist = buildGovernanceChecklist(wizard, workflow);
  const reviewBlockers = validateWizardStep("review", wizard);
  const readyForReview = checklist.every((item) => item.complete) && reviewBlockers.length === 0;
  const signoffs = [
    {
      id: "owner-live",
      label: "Owner launch approval",
      requiredRole: "study_owner" as const,
      status: hasSignoff(workflow, "Owner") ? "Signed" as const : "Pending" as const,
      signedBy: workflow.signoffs.find((signoff) => signoff.required_role === "Owner")?.signed_by_user_id,
    },
    {
      id: "steward-live",
      label: "Ethics & methods approval",
      requiredRole: "ethics_methods_steward" as const,
      status: hasSignoff(workflow, "MethodsSteward") ? "Signed" as const : "Pending" as const,
      signedBy: workflow.signoffs.find((signoff) => signoff.required_role === "MethodsSteward")?.signed_by_user_id,
    },
  ];
  const ownerSignoffUser = workflow.signoffs.find((signoff) => signoff.required_role === "Owner")?.signed_by_user_id;
  const stewardSignoffUser = workflow.signoffs.find((signoff) => signoff.required_role === "MethodsSteward")?.signed_by_user_id;
  const sameUserSignedGovernance = Boolean(ownerSignoffUser && stewardSignoffUser && ownerSignoffUser === stewardSignoffUser);

  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Governance Review</span>
          <h2>Review the saved study design packet before launch signoff</h2>
        </div>
        <WarningBanner title={readyForReview ? "Ready for governance action" : "Governance blockers remain"} risk={readyForReview ? "success" : "warning"}>
          {readyForReview
            ? "The saved packet, method rules, consensus threshold, and policy checklist are ready for signoff."
            : "Complete the open checklist items before submitting the version for governance signoff."}
        </WarningBanner>
      </section>

      <section className="panel">
        <h3>Locked Method Rules</h3>
        <LockedRule
          title="Consensus threshold"
          value={`${wizard.consensusThreshold}% agreement at rating ${wizard.agreementMinRating}+ (${consensusRuleSourceLabels[wizard.consensusRuleSource]})`}
          locked={Boolean(workflow.version?.consensus_rule_json)}
        />
        <dl className="detail-list">
          <div>
            <dt>Setting process</dt>
            <dd>{wizard.consensusRuleProcess}</dd>
          </div>
          <div>
            <dt>Pre-round input</dt>
            <dd>
              {wizard.preRoundConsensusInputEnabled
                ? `${preRoundConsensusStatusLabels[wizard.preRoundConsensusInputStatus]} before Round 1`
              : "Not required"}
            </dd>
          </div>
        </dl>
        <WarningBanner title={editAllowed ? "Draft rule" : "Locked against mid-study change"} risk={editAllowed ? "warning" : "locked"}>
          Consensus rules must be predefined before Round 1 and cannot be changed mid-study.
        </WarningBanner>
      </section>

      <section className="panel">
        <h3>Packet Snapshot</h3>
        <dl className="detail-list">
          <div>
            <dt>Study title</dt>
            <dd>{wizard.title}</dd>
          </div>
          <div>
            <dt>Consent version</dt>
            <dd>{wizard.consentVersion}</dd>
          </div>
          <div>
            <dt>Round plan</dt>
            <dd>{wizard.plannedRoundCount} rounds</dd>
          </div>
          <div>
            <dt>AI</dt>
            <dd>{wizard.aiEnabled ? "Enabled with human approval" : "Disabled"}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <h3>Governance Checklist</h3>
        <Checklist items={checklist} />
      </section>

      <section className="panel">
        <h3>Governance Packet Details</h3>
        <div className="review-stack">
          {buildGovernanceSummary(wizard).map((item) => (
            <article className="summary-item" key={item.label}>
              <strong>{item.label}</strong>
              <p>{item.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <h3>Required Signoff</h3>
        <SignoffGateList signoffs={signoffs} />
        {sameUserSignedGovernance ? (
          <WarningBanner title="Multiple governance roles held by same user" risk="info">
            Study Owner and Ethics & Methods Steward signoffs were recorded by the same account. Responsibilities remain separately logged.
          </WarningBanner>
        ) : null}
      </section>

      <section className="panel wide">
        <ConductorWorkflowPanel role={role} workflow={workflow} wizard={wizard} onWorkflowStep={onWorkflowStep} />
      </section>
    </div>
  );
}

type PlannedRound = {
  roundNumber: number;
  label: string;
  mode: "open-ended" | "rating";
  status: string;
  responseRate: number;
  attritionRate: number;
  blocker?: string;
};

function buildPlannedRounds(wizard: StudyWizardState, workflow: ConductorWorkflow): PlannedRound[] {
  const isClassic = wizard.studyFormat === "ClassicDelphi";
  const roundCount = wizard.plannedRoundCount;

  return Array.from({ length: roundCount }, (_, index) => {
    const roundNumber = index + 1;
    const isRoundOne = roundNumber === 1;
    const isTerminal = roundNumber === wizard.terminalRoundNumber;
    const roundOneOpen = Boolean(workflow.version?.opened_round1_at);

    let status = "Planned";
    if (isRoundOne && roundOneOpen) status = "Open";
    if (isRoundOne && workflow.version?.status === "Active" && !roundOneOpen) status = "Ready to open";
    if (!isRoundOne && !roundOneOpen) status = "Blocked";

    const label = isRoundOne
      ? wizard.roundOneMode === "open-ended"
        ? "Open-ended elicitation"
        : "Structured elicitation"
      : isTerminal
        ? isClassic
          ? "Terminal rating and confirmation"
          : "Terminal rating"
        : "Structured rating";

    return {
      roundNumber,
      label,
      mode: isRoundOne && wizard.roundOneMode === "open-ended" ? "open-ended" : "rating",
      status,
      responseRate: isRoundOne && roundOneOpen ? 0 : 0,
      attritionRate: 0,
      blocker: isRoundOne
        ? roundOneOpen
          ? undefined
          : "Round 1 opens after governance signoff, activation, and owner release."
        : "Future rounds open only after prior-round review, curation, controlled feedback setup, and human approvals.",
    };
  });
}

function roundStatusRisk(status: string): "success" | "warning" | "info" | "locked" {
  if (status === "Open") return "success";
  if (status === "Ready to open") return "warning";
  if (status === "Blocked") return "locked";
  return "info";
}

function RoundManagerScreen({
  workflow,
  wizard,
  roundOneSetup,
  roundTwoSetup,
  roundConfigs,
  runtimeData,
  roundActionMessage,
  roundActionError,
  roundActionBusy,
  onRoundOneSetupChange,
  onRoundTwoSetupChange,
  onSaveRoundOneSetup,
  onSaveRoundTwoSetup,
  onSaveRatingRoundSetup,
  onTransitionRound,
}: {
  workflow: ConductorWorkflow;
  wizard: StudyWizardState;
  roundOneSetup: RoundOneSetupState;
  roundTwoSetup: RoundTwoSetupState;
  roundConfigs: RoundConfig[];
  runtimeData: RuntimeStudyData;
  roundActionMessage: string | null;
  roundActionError: string | null;
  roundActionBusy: string | null;
  onRoundOneSetupChange: (state: RoundOneSetupState) => void;
  onRoundTwoSetupChange: (state: RoundTwoSetupState) => void;
  onSaveRoundOneSetup: () => void;
  onSaveRoundTwoSetup: () => void;
  onSaveRatingRoundSetup: (roundNumber: number) => void;
  onTransitionRound: (roundNumber: number, action: "open" | "close") => void;
}) {
  const plannedRounds = buildPlannedRounds(wizard, workflow);
  const savedRoundOne = roundConfigs.find((config) => config.round_number === 1);
  const savedRoundTwo = roundConfigs.find((config) => config.round_number === 2);
  const ratingRounds = plannedRounds.filter((round) => round.roundNumber > 1);
  const publishedRoundTwoCount = runtimeData.items.filter((item) => item.round_number === 2 && item.status === "Published").length;
  const roundOneClosed = savedRoundOne?.status === "Closed";

  function updateRoundOne(patch: Partial<RoundOneSetupState>) {
    onRoundOneSetupChange({ ...roundOneSetup, ...patch });
  }

  function updateRoundTwo(patch: Partial<RoundTwoSetupState>) {
    onRoundTwoSetupChange({ ...roundTwoSetup, ...patch });
  }

  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Round Manager</span>
          <h2>Waiting, attrition, and blockers are surfaced early</h2>
        </div>
        <div className="round-plan-summary">
          <StatCard label="Method" value={wizard.studyFormat === "ClassicDelphi" ? "Classic Delphi" : "Modified Delphi"} supporting="Generated from the Study Builder design packet." />
          <StatCard label="Planned rounds" value={String(wizard.plannedRoundCount)} supporting={`Terminal round: ${wizard.terminalRoundNumber}.`} />
          <StatCard label="Round 1 mode" value={wizard.roundOneMode === "open-ended" ? "Open-ended" : "Structured"} supporting="Panelists see only available tasks." />
        </div>
        <div className="round-grid">
          {plannedRounds.map((round) => {
            const config = roundConfigs.find((entry) => entry.round_number === round.roundNumber);
            const status = config?.status ?? round.status;
            const canCloseRecoveredRoundOne = round.roundNumber === 1 && Boolean(workflow.version?.opened_round1_at);
            const showRoundControls = Boolean(config) || canCloseRecoveredRoundOne;

            return (
              <article className="round-card" key={round.roundNumber}>
              <div className="split-line">
                <strong>Round {round.roundNumber}</strong>
                <StatusBadge
                  risk={roundStatusRisk(status)}
                  label={formatStatus(status)}
                />
              </div>
              <h3>{round.label}</h3>
              <DataBar value={round.responseRate} label="Response rate" />
              <DataBar value={round.attritionRate} label="Attrition" />
              <small>{round.mode === "open-ended" ? "Open-ended response collection" : "Structured rating task"}</small>
              {round.blocker ? (
                <WarningBanner title="Blocker">{round.blocker}</WarningBanner>
              ) : null}
              {showRoundControls ? (
                <div className="candidate-actions">
                  <button
                    className="secondary-button"
                    disabled={status === "Open" || status === "Closed" || roundActionBusy === `open-${round.roundNumber}`}
                    onClick={() => onTransitionRound(round.roundNumber, "open")}
                    type="button"
                  >
                    Open
                  </button>
                  <button
                    className="secondary-button"
                    disabled={status === "Closed" || roundActionBusy === `close-${round.roundNumber}`}
                    onClick={() => onTransitionRound(round.roundNumber, "close")}
                    type="button"
                  >
                    Close
                  </button>
                </div>
              ) : null}
            </article>
            );
          })}
        </div>
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Round 1 Setup</span>
          <h2>Open-ended prompt, participant instructions, window, and reminders</h2>
        </div>

        {roundActionError ? (
          <WarningBanner title="Round setup not saved" risk="danger">
            {humanizeBackendMessage(roundActionError)}
          </WarningBanner>
        ) : null}
        {roundActionMessage ? (
          <WarningBanner title="Round setup saved" risk="success">
            {roundActionMessage}
          </WarningBanner>
        ) : null}
        {roundOneClosed ? (
          <WarningBanner title="Round 1 setup locked" risk="locked">
            Round 1 is closed. Its prompt, instructions, response window, reminder text, and AI curation setting are locked for this study version.
          </WarningBanner>
        ) : null}

        <div className="form-grid">
          <label className="field">
            <span>Round title</span>
            <input disabled={roundOneClosed} value={roundOneSetup.title} onChange={(event) => updateRoundOne({ title: event.target.value })} />
          </label>
          <label className="field">
            <span>Response window days</span>
            <input
              disabled={roundOneClosed}
              min={1}
              max={60}
              type="number"
              value={roundOneSetup.responseWindowDays}
              onChange={(event) => updateRoundOne({ responseWindowDays: Number(event.target.value) })}
            />
          </label>
          <label className="field wide-field">
            <span>Open-ended prompt</span>
            <textarea disabled={roundOneClosed} value={roundOneSetup.prompt} onChange={(event) => updateRoundOne({ prompt: event.target.value })} />
          </label>
          <label className="field wide-field">
            <span>Participant instructions</span>
            <textarea
              disabled={roundOneClosed}
              value={roundOneSetup.participantInstructions}
              onChange={(event) => updateRoundOne({ participantInstructions: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Reminder subject</span>
            <input
              disabled={roundOneClosed}
              value={roundOneSetup.reminderSubject}
              onChange={(event) => updateRoundOne({ reminderSubject: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Reminder body</span>
            <textarea disabled={roundOneClosed} value={roundOneSetup.reminderBody} onChange={(event) => updateRoundOne({ reminderBody: event.target.value })} />
          </label>
          <label className="check-field wide-field">
            <input
              disabled={roundOneClosed}
              checked={roundOneSetup.aiCurationEnabled}
              onChange={(event) => updateRoundOne({ aiCurationEnabled: event.target.checked })}
              type="checkbox"
            />
            <span>Enable AI-assisted curation draft hooks after Round 1 closes. Human review remains required.</span>
          </label>
        </div>

        <div className="wizard-actions">
          <StatusBadge risk={savedRoundOne ? "success" : "warning"} label={savedRoundOne ? "Round 1 configured" : "Draft setup"} />
          <button className="primary-button" disabled={roundOneClosed || roundActionBusy === "save-r1"} onClick={onSaveRoundOneSetup} type="button">
            {roundOneClosed ? "Round 1 setup locked" : roundActionBusy === "save-r1" ? "Saving..." : "Save Round 1 setup"}
          </button>
        </div>
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Rating Round Setup</span>
          <h2>Structured rating tasks, controlled feedback, and release readiness</h2>
        </div>
        <WarningBanner title="Readiness gate" risk={publishedRoundTwoCount > 0 ? "success" : "warning"}>
          {publishedRoundTwoCount > 0
            ? `${publishedRoundTwoCount} published item(s) are available for Round 2.`
            : "Round 2 cannot open until curation publishes at least one traceable candidate item."}
        </WarningBanner>
        <div className="form-grid">
          <label className="field">
            <span>Round title</span>
            <input value={roundTwoSetup.title} onChange={(event) => updateRoundTwo({ title: event.target.value })} />
          </label>
          <label className="field">
            <span>Response window days</span>
            <input
              min={1}
              max={60}
              type="number"
              value={roundTwoSetup.responseWindowDays}
              onChange={(event) => updateRoundTwo({ responseWindowDays: Number(event.target.value) })}
            />
          </label>
          <label className="field wide-field">
            <span>Rating prompt</span>
            <textarea value={roundTwoSetup.prompt} onChange={(event) => updateRoundTwo({ prompt: event.target.value })} />
          </label>
          <label className="field wide-field">
            <span>Participant instructions</span>
            <textarea
              value={roundTwoSetup.participantInstructions}
              onChange={(event) => updateRoundTwo({ participantInstructions: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Reminder subject</span>
            <input value={roundTwoSetup.reminderSubject} onChange={(event) => updateRoundTwo({ reminderSubject: event.target.value })} />
          </label>
          <label className="field">
            <span>Reminder body</span>
            <textarea value={roundTwoSetup.reminderBody} onChange={(event) => updateRoundTwo({ reminderBody: event.target.value })} />
          </label>
          <label className="check-field wide-field">
            <input
              checked={roundTwoSetup.controlledFeedbackEnabled}
              onChange={(event) => updateRoundTwo({ controlledFeedbackEnabled: event.target.checked })}
              type="checkbox"
            />
            <span>Enable controlled feedback fields for later rounds. Feedback must remain neutral and non-coercive.</span>
          </label>
          <label className="field">
            <span>Feedback format</span>
            <select
              value={roundTwoSetup.feedbackFormat}
              onChange={(event) => updateRoundTwo({ feedbackFormat: event.target.value as RoundTwoSetupState["feedbackFormat"] })}
            >
              <option value="distribution_only">Distribution only</option>
              <option value="distribution_summary">Distribution + summary</option>
              <option value="distribution_rationales">Distribution + anonymized rationales</option>
            </select>
          </label>
          <label className="check-field">
            <input
              checked={roundTwoSetup.showParticipantPriorResponse}
              onChange={(event) => updateRoundTwo({ showParticipantPriorResponse: event.target.checked })}
              type="checkbox"
            />
            <span>Show participant prior response</span>
          </label>
          <div className="method-helper wide-field">
            <p>The selected feedback format will be versioned and locked when this round opens.</p>
          </div>
        </div>
        <div className="wizard-actions">
          <StatusBadge risk={savedRoundTwo ? "success" : "warning"} label={savedRoundTwo ? "Round 2 configured" : "Draft setup"} />
          <button className="primary-button" disabled={roundActionBusy === "save-r2"} onClick={onSaveRoundTwoSetup} type="button">
            {roundActionBusy === "save-r2" ? "Saving..." : "Save Round 2 setup"}
          </button>
        </div>
        <div className="rating-round-setup-list">
          {ratingRounds.map((round) => {
            const config = roundConfigs.find((entry) => entry.round_number === round.roundNumber);
            const publishedCount = runtimeData.items.filter((item) => item.round_number === round.roundNumber && item.status === "Published").length;
            const feedbackLocked = Boolean(config?.feedback_config?.locked_at || config?.status === "Open" || config?.status === "Closed");

            return (
              <article className="rating-round-setup" key={round.roundNumber}>
                <div>
                  <strong>Round {round.roundNumber}</strong>
                  <p>{round.label}</p>
                  <small>{publishedCount} published item{publishedCount === 1 ? "" : "s"} for this round.</small>
                  {config?.feedback_config ? (
                    <small>
                      Feedback: {config.feedback_config.format.replaceAll("_", " ")}
                      {config.feedback_config.show_participant_prior_response ? ", prior response shown" : ", prior response hidden"}
                      {config.feedback_config.locked_at ? ". Feedback format locked for this round." : ""}
                    </small>
                  ) : null}
                </div>
                <StatusBadge risk={config ? "success" : "warning"} label={config ? formatStatus(config.status) : "Not configured"} />
                <button
                  className="secondary-button"
                  disabled={feedbackLocked || roundActionBusy === `save-r${round.roundNumber}`}
                  onClick={() => onSaveRatingRoundSetup(round.roundNumber)}
                  type="button"
                >
                  {feedbackLocked ? "Feedback locked" : roundActionBusy === `save-r${round.roundNumber}` ? "Saving..." : `Save Round ${round.roundNumber}`}
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function CurationScreen({
  study,
  workflow,
  runtimeData,
  runtimeActionBusy,
  onRefreshRuntimeData,
  onCreateManualItemFromResponse,
  onSynthesizeRoundTwoCandidates,
  onSynthesizeRoundCandidates,
  onAcceptSuggestion,
  onMaterializeSuggestion,
  onSignoffSuggestionRelease,
  onPublishItem,
  onEditItemText,
  onRejectItem,
  onSplitItem,
  onMergeItemInto,
}: {
  study: StudyRecord;
  workflow: ConductorWorkflow;
  runtimeData: RuntimeStudyData;
  runtimeActionBusy: string | null;
  onRefreshRuntimeData: () => void;
  onCreateManualItemFromResponse: (response: ResponseRecord, entry?: RoundOneResponseEntry) => void;
  onSynthesizeRoundTwoCandidates: () => void;
  onSynthesizeRoundCandidates: (targetRoundNumber: number) => void;
  onAcceptSuggestion: (suggestion: AISuggestionRecord) => void;
  onMaterializeSuggestion: (suggestion: AISuggestionRecord) => void;
  onSignoffSuggestionRelease: (suggestion: AISuggestionRecord) => void;
  onPublishItem: (item: ItemRecord) => void;
  onEditItemText: (item: ItemRecord) => void;
  onRejectItem: (item: ItemRecord) => void;
  onSplitItem: (item: ItemRecord) => void;
  onMergeItemInto: (item: ItemRecord, target: ItemRecord) => void;
}) {
  const hasBackendStudy = Boolean(workflow.study && workflow.version);
  const curationWizard = wizardFromBackendPacket(workflow.version?.study_design_packet_json, workflow.study ?? undefined);
  const curationQuestions = roundOneQuestions(curationWizard);
  const openResponseEntries = runtimeData.responses.flatMap((response) =>
    roundOneResponseEntries(response.response_json, curationQuestions).map((entry) => ({ response, entry }))
  );
  const roundTwoItems = runtimeData.items.filter((item) => item.round_number >= 2);
  const interRoundSuggestions = runtimeData.aiSuggestions.filter((suggestion) => suggestion.feature === "inter_round_synthesis");
  const terminalRound = workflow.version?.terminal_round_number ?? 2;
  const carryForwardTargets = Array.from({ length: Math.max(terminalRound - 2, 0) }, (_, index) => index + 3);

  if (!hasBackendStudy) {
    return (
      <div className="curation-layout">
        <section className="panel">
          <h3>Raw Anonymized Responses</h3>
          {study.candidates.flatMap((candidate) => candidate.provenance).map((link) => (
            <article className="response-snippet" key={link.sourceId}>
              <StatusBadge risk="info" label={`Round ${link.roundNumber}`} />
              <p>{link.excerpt}</p>
            </article>
          ))}
        </section>

        <section className="panel">
          <h3>AI / Human Clusters</h3>
          {study.aiSuggestions.map((suggestion) => (
            <AISuggestionCard key={suggestion.id} suggestion={suggestion} />
          ))}
        </section>

        <section className="panel">
          <h3>Candidate Statements</h3>
          {study.candidates.map((candidate) => (
            <article className="candidate" key={candidate.id}>
              <div className="split-line">
                <StatusBadge risk={candidate.preservesMinorityView ? "info" : "warning"} label={candidate.preservesMinorityView ? "Preserves minority view" : candidate.status} />
                <StatusBadge risk={candidate.requiresHumanRationale ? "warning" : "success"} label={candidate.requiresHumanRationale ? "Rationale required" : "Traceable"} />
              </div>
              <p>{candidate.text}</p>
              <ProvenanceList item={candidate} />
            </article>
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="curation-layout">
      <section className="panel">
        <div className="split-line">
          <h3>Raw Anonymized Responses</h3>
          <button className="secondary-button" onClick={onRefreshRuntimeData} type="button">Refresh</button>
        </div>
        {runtimeData.loading ? <p className="muted">Loading study data...</p> : null}
        {runtimeData.error ? (
          <WarningBanner title="Curation data issue" risk="danger">
            {humanizeBackendMessage(runtimeData.error)}
          </WarningBanner>
        ) : null}
        {runtimeData.message ? (
          <WarningBanner title="Curation updated" risk="success">
            {runtimeData.message}
          </WarningBanner>
        ) : null}
        {openResponseEntries.length === 0 ? (
          <WarningBanner title="No Round 1 responses yet" risk="info">
            Round 1 participant responses will appear here after consent and submission.
          </WarningBanner>
        ) : null}
        {openResponseEntries.map(({ response, entry }) => {
          return (
            <article className="response-snippet" key={`${response.response_id}-${entry.researchQuestionId}`}>
              <div className="split-line">
                <StatusBadge risk="info" label={entry.researchQuestionLabel} />
                <small>{shortId(response.response_id)}</small>
              </div>
              <p>{entry.text}</p>
              <button
                className="secondary-button"
                disabled={runtimeActionBusy === `manual-${response.response_id}-${entry.researchQuestionId}`}
                onClick={() => onCreateManualItemFromResponse(response, entry)}
                type="button"
              >
                Create candidate
              </button>
            </article>
          );
        })}
      </section>

      <section className="panel">
        <div className="split-line">
          <h3>AI / Human Clusters</h3>
          <button
            className="primary-button"
            disabled={runtimeActionBusy === "synthesize-r2" || openResponseEntries.length === 0}
            onClick={onSynthesizeRoundTwoCandidates}
            type="button"
          >
            Draft Round 2
          </button>
        </div>
        {interRoundSuggestions.length === 0 ? (
          <WarningBanner title="No AI suggestions yet" risk="info">
            Create an AI Suggestion (Not Final) after Round 1 responses are available, or create candidate items manually from responses.
          </WarningBanner>
        ) : null}
        <div className="candidate-actions">
          {carryForwardTargets.map((targetRound) => (
            <button
              className="secondary-button"
              disabled={runtimeActionBusy === `synthesize-r${targetRound}`}
              key={targetRound}
              onClick={() => onSynthesizeRoundCandidates(targetRound)}
              type="button"
            >
              Draft Round {targetRound}
            </button>
          ))}
        </div>
        {interRoundSuggestions.map((suggestion) => {
          const output = suggestion.output_json && typeof suggestion.output_json === "object" ? suggestion.output_json as Record<string, unknown> : {};
          const candidates = Array.isArray(output.candidates) ? output.candidates : [];

          return (
            <article className="candidate" key={suggestion.suggestion_id}>
              <div className="split-line">
                <StatusBadge risk="warning" label="AI Suggestion (Not Final)" />
                <StatusBadge risk={suggestion.decision === "None" ? "locked" : "success"} label={suggestion.decision} />
              </div>
              <p>{candidates.length} candidate statements from Round 1 material.</p>
              <dl className="detail-list">
                <div>
                  <dt>Output hash</dt>
                  <dd>{shortId(suggestion.output_hash)}</dd>
                </div>
                <div>
                  <dt>Source responses</dt>
                  <dd>{suggestion.input_scope_ids.length}</dd>
                </div>
              </dl>
              <div className="candidate-actions">
                <button
                  className="secondary-button"
                  disabled={suggestion.decision !== "None" || runtimeActionBusy === `accept-${suggestion.suggestion_id}`}
                  onClick={() => onAcceptSuggestion(suggestion)}
                  type="button"
                >
                  Accept
                </button>
                <button
                  className="secondary-button"
                  disabled={suggestion.decision === "None" || runtimeActionBusy === `materialize-${suggestion.suggestion_id}`}
                  onClick={() => onMaterializeSuggestion(suggestion)}
                  type="button"
                >
                  Create items
                </button>
                <button
                  className="secondary-button"
                  disabled={suggestion.decision === "None" || runtimeActionBusy === `signoff-${suggestion.suggestion_id}`}
                  onClick={() => onSignoffSuggestionRelease(suggestion)}
                  type="button"
                >
                  Sign release
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel">
        <h3>Candidate Statements</h3>
        {roundTwoItems.length === 0 ? (
          <WarningBanner title="No candidate items yet" risk="info">
            Candidate items created here will keep provenance links and can be published for Round 2 rating.
          </WarningBanner>
        ) : null}
        {roundTwoItems.map((item, index) => (
          <article className="candidate" key={item.item_id}>
            <div className="split-line">
              <StatusBadge risk={item.status === "Published" ? "success" : "warning"} label={item.status} />
              <StatusBadge risk={item.ai_provenance_links.length > 0 ? "success" : "warning"} label={item.ai_provenance_links.length > 0 ? "Traceable" : "Needs provenance"} />
            </div>
            <p>{item.text}</p>
            <div className="provenance">
              {item.ai_provenance_links.map((link) => (
                <div className="provenance-row" key={`${item.item_id}-${link.source_id}`}>
                  <span>{link.source_type} - Round {link.source_round_number}</span>
                  <p>{link.excerpt}</p>
                  <small>{shortId(link.source_id)}</small>
                </div>
              ))}
            </div>
            <button
              className="primary-button"
              disabled={item.status !== "Draft" || runtimeActionBusy === `publish-${item.item_id}`}
              onClick={() => onPublishItem(item)}
              type="button"
            >
              Publish for Round {item.round_number}
            </button>
            <div className="candidate-actions">
              <button className="secondary-button" disabled={runtimeActionBusy === `edit-${item.item_id}`} onClick={() => onEditItemText(item)} type="button">
                Edit
              </button>
              <button className="secondary-button" disabled={runtimeActionBusy === `split-${item.item_id}`} onClick={() => onSplitItem(item)} type="button">
                Split
              </button>
              <button className="secondary-button danger-button" disabled={item.status === "Rejected" || runtimeActionBusy === `reject-${item.item_id}`} onClick={() => onRejectItem(item)} type="button">
                Reject
              </button>
              {index > 0 ? (
                <button className="secondary-button" disabled={runtimeActionBusy === `merge-${item.item_id}`} onClick={() => onMergeItemInto(item, roundTwoItems[index - 1])} type="button">
                  Merge into previous
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function FeedbackScreen() {
  const participantFacingCopy =
    "Review the group summary, median, IQR, distribution, and your prior response. You may retain response or revise response.";
  const hasForbiddenLanguage = containsForbiddenParticipantLanguage(participantFacingCopy);

  return (
    <div className="screen-grid">
      <section className="panel">
        <h3>Controlled Feedback Configuration</h3>
        <WarningBanner title="Neutral participant language" risk={hasForbiddenLanguage ? "danger" : "success"}>
          {participantFacingCopy}
        </WarningBanner>
        <div className="feedback-options">
          {["Median", "IQR / dispersion", "Distribution", "Your prior response", "Retain response", "Revise response"].map((option) => (
            <span className="option-pill" key={option}>{option}</span>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Example Group Summary</h3>
        <div className="distribution">
          {[1, 2, 4, 7, 9, 6, 3].map((height, index) => (
            <span key={`${height}-${index}`} style={{ height: `${height * 12}px` }} />
          ))}
        </div>
        <dl className="detail-list">
          <div>
            <dt>Median</dt>
            <dd>8</dd>
          </div>
          <div>
            <dt>IQR</dt>
            <dd>2</dd>
          </div>
          <div>
            <dt>Your prior response</dt>
            <dd>7, revise response</dd>
          </div>
        </dl>
      </section>

      <section className="panel wide">
        <h3>Method Guardrail</h3>
        <p className="callout-text">
          Controlled feedback summarizes this panel's responses. It does not define correctness and should not pressure any panelist to change a response.
        </p>
      </section>
    </div>
  );
}

function InlineHelp({ id, label, text }: { id: string; label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const helpId = `inline-help-${id}`;
  return (
    <span className="inline-help">
      <button
        aria-controls={helpId}
        aria-expanded={open}
        aria-label={`Help: ${label}`}
        className="inline-help-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        ?
      </button>
      {open ? (
        <span className="inline-help-popover" id={helpId} role="note">
          {text}
          <button aria-label={`Close help for ${label}`} onClick={() => setOpen(false)} type="button">
            Close help
          </button>
        </span>
      ) : null}
    </span>
  );
}

function ParticipantOrientationPanel({
  title,
  wizard,
  participantInvite,
  participantBusy,
  onComplete,
}: {
  title: string;
  wizard: StudyWizardState;
  participantInvite: ParticipantInvitationContext | null;
  participantBusy: boolean;
  onComplete: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const aiText = aiOrientationText({
    externalAiEnabled: wizard.aiEnabled,
    noExternalAiMode: !wizard.aiEnabled,
  });
  const facts = studyOrientationFacts({ title, wizard, aiText });
  const activeStep = tutorialSteps[stepIndex];
  const completed = participantInvite?.orientation_completion;

  return (
    <section className="orientation-panel" aria-labelledby="participant-orientation-title">
      <div className="section-heading">
        <span className="eyebrow">Required orientation</span>
        <h3 id="participant-orientation-title">Before Round 1, review how this Delphi study works</h3>
      </div>
      <WarningBanner title="Orientation supplements consent" risk="info">
        This short orientation helps explain the study process. It does not replace the consent information or your rights.
      </WarningBanner>

      <div className="orientation-fact-grid">
        {facts.map((fact) => (
          <article className="orientation-fact" key={fact.title}>
            <h4>{fact.title}</h4>
            <p>{fact.body}</p>
          </article>
        ))}
      </div>

      <div className="tutorial-card" aria-live="polite">
        <span className="eyebrow">60-90 second tutorial</span>
        <h4>{activeStep.title}</h4>
        <p>{activeStep.body}</p>
        <div className="tutorial-example">
          <strong>Fictional example only</strong>
          <p>Round 1: What matters most for a good policy?</p>
          <p>Group summary: Participants mentioned clarity, fairness, feasibility, and cost.</p>
          <p>Round 2: You may keep your view or update it after seeing the summary.</p>
        </div>
        <div className="tutorial-progress" aria-label={`Tutorial step ${stepIndex + 1} of ${tutorialSteps.length}`}>
          {tutorialSteps.map((step, index) => (
            <span className={index === stepIndex ? "active" : ""} key={step.title} />
          ))}
        </div>
        <div className="action-row">
          <button
            className="secondary-button"
            disabled={stepIndex === 0 || participantBusy}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            type="button"
          >
            Previous
          </button>
          {stepIndex < tutorialSteps.length - 1 ? (
            <button
              className="primary-button"
              disabled={participantBusy}
              onClick={() => setStepIndex((current) => Math.min(tutorialSteps.length - 1, current + 1))}
              type="button"
            >
              Next
            </button>
          ) : (
            <button className="primary-button" disabled={participantBusy || Boolean(completed)} onClick={onComplete} type="button">
              {participantBusy ? "Saving..." : completed ? "Orientation completed" : "I understand and am ready to continue"}
            </button>
          )}
        </div>
      </div>
      <small>Orientation content version: {orientationContentVersion}</small>
    </section>
  );
}

function SaveStatusIndicator({ savedAt, scope }: { savedAt: string | null | undefined; scope: string }) {
  return (
    <p className="save-status" aria-live="polite">
      {savedAt ? `${scope} saved ${formatDateTime(savedAt)}.` : `${scope} not saved yet.`}
    </p>
  );
}

function ProgressIndicator({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="progress-indicator" aria-label={`${label}: ${detail}`}>
      <div className="data-bar-row">
        <strong>{label}</strong>
        <span>{detail}</span>
      </div>
      <div className="data-bar-track" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function ParticipantIssueReporter({
  busy,
  currentPage,
  currentRoundNumber,
  onReport,
}: {
  busy: boolean;
  currentPage: string;
  currentRoundNumber: number | null;
  onReport: (input: ParticipantIssueInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<ParticipantIssueType>("button_or_textbox_not_working");
  const [note, setNote] = useState("");

  function submitIssue() {
    onReport({
      round_number: currentRoundNumber,
      page_context: currentPage,
      issue_type: issueType,
      note,
    });
    setNote("");
    setOpen(false);
  }

  return (
    <section className="panel participant-issue-panel" aria-labelledby="participant-issue-title">
      <div className="split-line">
        <div>
          <h3 id="participant-issue-title">{participantCopy.trouble.title}</h3>
          <p className="muted">{participantCopy.trouble.intro}</p>
        </div>
        <button className="secondary-button" onClick={() => setOpen((current) => !current)} type="button">
          {participantCopy.trouble.button}
        </button>
      </div>
      {open ? (
        <div className="issue-form">
          <label className="field">
            <span>{participantCopy.trouble.typeLabel}</span>
            <select value={issueType} onChange={(event) => setIssueType(event.target.value as ParticipantIssueType)}>
              {participantIssueTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{participantCopy.trouble.pageLabel}</span>
            <input readOnly value={currentRoundNumber ? `${currentPage} / Round ${currentRoundNumber}` : currentPage} />
          </label>
          <label className="field wide-field">
            <span>{participantCopy.trouble.noteLabel}</span>
            <textarea
              maxLength={1200}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Example: I tapped Save progress and did not see a saved message."
            />
          </label>
          <button className="primary-button" disabled={busy} onClick={submitIssue} type="button">
            {busy ? participantCopy.trouble.submitting : participantCopy.trouble.submit}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ParticipantIssueHistory({ issues }: { issues: ParticipantIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <section className="panel participant-issue-history" aria-labelledby="participant-issue-history-title">
      <h3 id="participant-issue-history-title">Issue note updates</h3>
      <div className="issue-history-list">
        {issues.slice(0, 4).map((issue) => {
          const label = participantIssueTypeOptions.find((option) => option.value === issue.issue_type)?.label ?? "Other issue";
          return (
            <article className="issue-history-card" key={issue.issue_id}>
              <div className="split-line">
                <div>
                  <strong>{label}</strong>
                  <p className="muted">
                    Sent {formatDateTime(issue.created_at)} - {issue.round_number ? `Round ${issue.round_number}` : "No round listed"}
                  </p>
                </div>
                <StatusBadge risk={issue.status === "open" ? "warning" : issue.status === "closed" ? "success" : "info"} label={issue.status} />
              </div>
              {issue.staff_response_note ? (
                <WarningBanner title="Study-team response" risk="info">
                  {issue.staff_response_note}
                </WarningBanner>
              ) : (
                <p className="muted">The study team has not recorded a response yet.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MagicRoundEntryScreen({
  context,
  items,
  responseText,
  roundOneAnswers,
  ratings,
  rationales,
  message,
  error,
  busy,
  participantIssues,
  onResponseTextChange,
  onRoundOneAnswerChange,
  onRatingChange,
  onRationaleChange,
  onSubmit,
  onDecline,
  onReportIssue,
}: {
  context: MagicRoundEntryContext | null;
  items: RoundItemForParticipant[];
  responseText: string;
  roundOneAnswers: Record<string, string>;
  ratings: RatingDraft;
  rationales: RationaleDraft;
  message: string | null;
  error: string | null;
  busy: boolean;
  participantIssues: ParticipantIssue[];
  onResponseTextChange: (value: string) => void;
  onRoundOneAnswerChange: (questionId: string, value: string) => void;
  onRatingChange: (itemId: string, rating: number) => void;
  onRationaleChange: (itemId: string, rationale: string) => void;
  onSubmit: () => void;
  onDecline: () => void;
  onReportIssue: (input: ParticipantIssueInput) => void;
}) {
  if (!context) {
    return (
      <div className="participant-flow magic-entry">
        <section className="panel wide">
          <span className="eyebrow">Secure round link</span>
          <h2>This secure link has expired or has already been used.</h2>
          <p>
            You can request a new link through the approved participant route or contact the study team. This page does
            not reveal whether any participant, phone number, study, or round exists.
          </p>
          {error ? <WarningBanner title="Secure link unavailable" risk="warning">{error}</WarningBanner> : null}
        </section>
      </div>
    );
  }

  const isOpen = context.round.status === "open";
  const isRoundOne = context.round.round_number === 1;
  const selectedCount = items.filter((item) => Boolean(ratings[item.item_id])).length;
  const magicResearchQuestions = context.research_questions?.length ? context.research_questions : [fallbackResearchQuestion()];

  return (
    <div className="participant-flow magic-entry">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Secure mobile round entry</span>
          <h2>{context.study.safe_display_name}</h2>
        </div>
        <div className="mobile-task-summary" aria-label="Secure round status">
          <article>
            <strong>{context.round.title}</strong>
            <p>Round {context.round.round_number} is {context.round.status}. Estimated time: {context.round.estimated_minutes} minutes.</p>
          </article>
          <article>
            <strong>Study purpose</strong>
            <p>{context.study.purpose}</p>
          </article>
        </div>
        <WarningBanner title="Participation remains voluntary" risk="info">
          {context.voluntary_reminder}
        </WarningBanner>
        {context.controlled_feedback_explanation ? (
          <WarningBanner title="Controlled feedback" risk="info">
            {context.controlled_feedback_explanation}
          </WarningBanner>
        ) : null}
        {message ? <WarningBanner title="Status" risk="success">{message}</WarningBanner> : null}
        {error ? <WarningBanner title="Action needed" risk="warning">{error}</WarningBanner> : null}
      </section>

      {isOpen && isRoundOne ? (
        <section className="panel mobile-response-card">
          <h3>Round 1 response</h3>
          <p>You are giving your independent judgment. There are no correct answers.</p>
          <div className="question-response-list">
            {magicResearchQuestions.map((question, index) => (
              <label className="field round-one-question-response" key={question.id}>
                <span>{questionLabel(question, index)}{question.requiredForRound1Response ? " (required)" : ""}</span>
                <strong>{question.text}</strong>
                {question.description ? <small>{question.description}</small> : null}
                <textarea
                  aria-label={`Round 1 response for ${questionLabel(question, index)}`}
                  rows={7}
                  value={roundOneAnswers[question.id] ?? (index === 0 ? responseText : "")}
                  onChange={(event) => {
                    onRoundOneAnswerChange(question.id, event.target.value);
                    if (index === 0) onResponseTextChange(event.target.value);
                  }}
                />
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {isOpen && !isRoundOne ? (
        <section className="panel wide">
          <h3>Round {context.round.round_number} statements</h3>
          <p>You may keep or revise your response. Different views are valuable. Consensus does not mean correctness.</p>
          <ProgressIndicator
            label="Item progress"
            value={items.length ? (selectedCount / items.length) * 100 : 0}
            detail={`${selectedCount} of ${items.length} answered`}
          />
          <div className="item-card-list">
            {items.map((item, index) => (
              <article className="mobile-response-card" key={item.item_id}>
                <span className="eyebrow">Item {index + 1} of {items.length}</span>
                <h4>{item.text}</h4>
                <ControlledFeedbackCard item={item} />
                <fieldset className="rating-options" aria-label={`Response options for item ${index + 1}`}>
                  <legend>Your new response</legend>
                  {ratingScaleOptions.map((option) => (
                    <label className="rating-option" key={option.value}>
                      <input
                        checked={ratings[item.item_id] === option.value}
                        name={`magic-rating-${item.item_id}`}
                        onChange={() => onRatingChange(item.item_id, option.value)}
                        type="radio"
                      />
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.detail}</small>
                      </span>
                    </label>
                  ))}
                </fieldset>
                <label className="field">
                  <span>Optional rationale</span>
                  <textarea
                    rows={4}
                    value={rationales[item.item_id] ?? ""}
                    onChange={(event) => onRationaleChange(item.item_id, event.target.value)}
                  />
                </label>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel sticky-action-bar" aria-label="Round actions">
        <button className="primary-button" disabled={!isOpen || busy} onClick={onSubmit} type="button">
          {busy ? "Submitting..." : "Submit round"}
        </button>
        <button className="secondary-button" disabled={!isOpen || busy} onClick={onDecline} type="button">
          Decline this round
        </button>
        <a className="footer-link" href="#participant-rights">
          Withdrawal and help information
        </a>
      </section>
      <ParticipantIssueReporter
        busy={busy}
        currentPage="secure_round_entry"
        currentRoundNumber={context.round.round_number}
        onReport={onReportIssue}
      />
      <ParticipantIssueHistory issues={participantIssues} />
    </div>
  );
}

function ParticipantScreen({
  workflow,
  wizard,
  roundConfigs,
  participantResponseText,
  participantRoundOneAnswers,
  participantSubmittedRoundOneText,
  participantSubmittedRoundOneAnswers,
  participantRoundOneEditing,
  participantRoundOneComplete,
  participantSubmittedRatings,
  participantSubmittedRationales,
  participantRatingRoundEditing,
  participantRatingRoundComplete,
  participantDraftSavedAt,
  participantRatingDraftSavedAt,
  participantWithdrawn,
  participantConsentChecked,
  participantOrientationComplete,
  participantMessage,
  participantError,
  participantBusy,
  participantInvite,
  magicContext,
  magicItems,
  magicResponseText,
  magicRoundOneAnswers,
  magicRatings,
  magicRationales,
  magicMessage,
  magicError,
  magicBusy,
  runtimeData,
  roundTwoRatings,
  roundTwoRationales,
  onParticipantResponseChange,
  onParticipantRoundOneAnswerChange,
  onParticipantConsentChange,
  onCompleteParticipantOrientation,
  onSubmitParticipantRoundOne,
  onEditSubmittedRoundOne,
  onFinishRoundOneTask,
  onEditSubmittedRatings,
  onFinishRatingRoundTask,
  onSaveParticipantRoundOneDraft,
  onSaveParticipantRatingDraft,
  onWithdrawParticipant,
  onRequestDeletionReview,
  onReportParticipantIssue,
  onMagicResponseTextChange,
  onMagicRoundOneAnswerChange,
  onMagicRatingChange,
  onMagicRationaleChange,
  onSubmitMagicRound,
  onDeclineMagicRound,
  onRoundTwoRatingChange,
  onRoundTwoRationaleChange,
  onSubmitRoundTwoRatings,
}: {
  workflow: ConductorWorkflow;
  wizard: StudyWizardState;
  roundConfigs: RoundConfig[];
  participantResponseText: string;
  participantRoundOneAnswers: Record<string, string>;
  participantSubmittedRoundOneText: string | null;
  participantSubmittedRoundOneAnswers: Record<string, string> | null;
  participantRoundOneEditing: boolean;
  participantRoundOneComplete: boolean;
  participantSubmittedRatings: Record<number, RatingDraft>;
  participantSubmittedRationales: Record<number, RationaleDraft>;
  participantRatingRoundEditing: Record<number, boolean>;
  participantRatingRoundComplete: Record<number, boolean>;
  participantDraftSavedAt: string | null;
  participantRatingDraftSavedAt: Record<number, string | null>;
  participantWithdrawn: boolean;
  participantConsentChecked: boolean;
  participantOrientationComplete: boolean;
  participantMessage: string | null;
  participantError: string | null;
  participantBusy: boolean;
  participantInvite: ParticipantInvitationContext | null;
  magicContext: MagicRoundEntryContext | null;
  magicItems: RoundItemForParticipant[];
  magicResponseText: string;
  magicRoundOneAnswers: Record<string, string>;
  magicRatings: RatingDraft;
  magicRationales: RationaleDraft;
  magicMessage: string | null;
  magicError: string | null;
  magicBusy: boolean;
  runtimeData: RuntimeStudyData;
  roundTwoRatings: RatingDraft;
  roundTwoRationales: RationaleDraft;
  onParticipantResponseChange: (value: string) => void;
  onParticipantRoundOneAnswerChange: (questionId: string, value: string) => void;
  onParticipantConsentChange: (value: boolean) => void;
  onCompleteParticipantOrientation: () => void;
  onSubmitParticipantRoundOne: () => void;
  onEditSubmittedRoundOne: () => void;
  onFinishRoundOneTask: () => void;
  onEditSubmittedRatings: (roundNumber: number) => void;
  onFinishRatingRoundTask: (roundNumber: number) => void;
  onSaveParticipantRoundOneDraft: () => void;
  onSaveParticipantRatingDraft: (roundNumber: number) => void;
  onWithdrawParticipant: () => void;
  onRequestDeletionReview: () => void;
  onReportParticipantIssue: (input: ParticipantIssueInput) => void;
  onMagicResponseTextChange: (value: string) => void;
  onMagicRoundOneAnswerChange: (questionId: string, value: string) => void;
  onMagicRatingChange: (itemId: string, rating: number) => void;
  onMagicRationaleChange: (itemId: string, rationale: string) => void;
  onSubmitMagicRound: () => void;
  onDeclineMagicRound: () => void;
  onRoundTwoRatingChange: (itemId: string, rating: number) => void;
  onRoundTwoRationaleChange: (itemId: string, rationale: string) => void;
  onSubmitRoundTwoRatings: () => void;
}) {
  if (magicContext || magicError) {
    return (
      <MagicRoundEntryScreen
        context={magicContext}
        items={magicItems}
        responseText={magicResponseText}
        roundOneAnswers={magicRoundOneAnswers}
        ratings={magicRatings}
        rationales={magicRationales}
        message={magicMessage}
        error={magicError}
        busy={magicBusy}
        participantIssues={runtimeData.participantIssues}
        onResponseTextChange={onMagicResponseTextChange}
        onRoundOneAnswerChange={onMagicRoundOneAnswerChange}
        onRatingChange={onMagicRatingChange}
        onRationaleChange={onMagicRationaleChange}
        onSubmit={onSubmitMagicRound}
        onDecline={onDeclineMagicRound}
        onReportIssue={onReportParticipantIssue}
      />
    );
  }

  const roundOneConfig = roundConfigs.find((config) => config.round_number === 1);
  const effectiveRoundOneConfig = roundOneConfig ?? (workflow.version?.opened_round1_at || participantInvite?.study_version?.opened_round1_at
    ? {
        title: "Round 1: Open-ended elicitation",
        prompt: "What care transition practices should this panel consider for later rating rounds?",
        participant_instructions:
          "Please provide one or more practices or concerns in your own words. There is no expected answer, and disagreement or uncertainty is useful to the study.",
        status: "Open",
      }
    : null);
  const roundOneOpen = !participantWithdrawn && effectiveRoundOneConfig?.status === "Open";
  const studyTitle = participantInvite?.study?.title ?? workflow.study?.title ?? "this Delphi study";
  const openRatingRound = participantWithdrawn
    ? undefined
    : roundConfigs.find((config) => config.round_number > 1 && config.status === "Open");
  const openRatingRoundItems = openRatingRound ? runtimeData.ratingRoundItems[openRatingRound.round_number] ?? [] : [];
  const hasBackendStudy = Boolean(workflow.version || participantInvite?.study_version);
  const hasRatingTask = Boolean(openRatingRound && openRatingRoundItems.length > 0);
  const currentRatingRoundNumber = openRatingRound?.round_number ?? null;
  const submittedRatingsForOpenRound = currentRatingRoundNumber ? participantSubmittedRatings[currentRatingRoundNumber] ?? null : null;
  const submittedRationalesForOpenRound = currentRatingRoundNumber ? participantSubmittedRationales[currentRatingRoundNumber] ?? null : null;
  const ratingRoundIsEditing = currentRatingRoundNumber ? Boolean(participantRatingRoundEditing[currentRatingRoundNumber]) : false;
  const ratingRoundIsComplete = currentRatingRoundNumber ? Boolean(participantRatingRoundComplete[currentRatingRoundNumber]) : false;
  const showRatingEditor = !submittedRatingsForOpenRound || ratingRoundIsEditing;
  const showRoundOneEditor = !participantSubmittedRoundOneText || participantRoundOneEditing;
  const roundOneResearchQuestions = roundOneQuestions(wizard);
  const requiredRoundOneQuestions = roundOneResearchQuestions.filter((question) => question.requiredForRound1Response);
  const answeredRequiredRoundOne = requiredRoundOneQuestions.filter((question) => Boolean(participantRoundOneAnswers[question.id]?.trim())).length;
  const selectedRatingCount = openRatingRoundItems.filter((item) => Boolean(roundTwoRatings[item.item_id])).length;
  const currentRatingDraftSavedAt = currentRatingRoundNumber ? participantRatingDraftSavedAt[currentRatingRoundNumber] ?? null : null;
  const savedRatingPrompt = openRatingRound?.prompt?.trim();
  const ratingPrompt = savedRatingPrompt && savedRatingPrompt !== legacyVagueRatingPrompt
    ? savedRatingPrompt
    : defaultRoundTwoSetup.prompt;
  const ratingInstructions = openRatingRound?.participant_instructions?.trim() || defaultRoundTwoSetup.participantInstructions;
  const currentTaskLabel = hasRatingTask
      ? `Round ${openRatingRound?.round_number}: structured judgment`
    : roundOneOpen
      ? effectiveRoundOneConfig?.title ?? "Round 1: open-ended elicitation"
    : "No round task is currently open";
  const issueRoundNumber = currentRatingRoundNumber ?? (roundOneOpen ? 1 : null);
  const activeStudyVersion = participantInvite?.study_version ?? workflow.version ?? null;
  const participantFacingPlannedRounds =
    activeStudyVersion?.planned_round_count ?? activeStudyVersion?.terminal_round_number ?? null;
  const participantFacingStudyFormat = activeStudyVersion?.study_format ?? null;
  const participantStudyTimeCopy = participantFacingPlannedRounds
    ? `This study is planned for up to ${participantFacingPlannedRounds} rounds. You will only see rounds that are open for your participation.`
    : "This study's round schedule will be provided by the study team. You will only see rounds that are open for your participation.";
  const participantStudyFormatLabel =
    participantFacingStudyFormat === "ClassicDelphi"
      ? "Classic Delphi"
      : participantFacingStudyFormat === "ModifiedDelphi"
        ? "Modified Delphi"
        : null;

  return (
    <div className="participant-flow">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Participant Portal</span>
          <h2>{participantCopy.portal.heading}</h2>
        </div>
        <WarningBanner title={participantCopy.portal.confidentialityTitle}>
          {participantCopy.portal.confidentialityBody}
        </WarningBanner>
        {participantInvite ? (
          <WarningBanner title={participantCopy.portal.invitationActiveTitle} risk="success">
            {participantCopy.portal.invitationActiveBody}
          </WarningBanner>
        ) : null}
        <WarningBanner title={participantCopy.portal.draftPrivacyTitle} risk="info">
          {participantCopy.portal.draftPrivacyBody}
        </WarningBanner>
      </section>

      <section className="panel">
        <h3>Your Current Round</h3>
        <p>{currentTaskLabel}</p>
        <div className="mobile-task-summary" aria-label="Participant task summary">
          <article>
            <strong>{participantCopy.taskSummary.whatNext}</strong>
            <p>{hasRatingTask ? participantCopy.taskSummary.ratingNext : roundOneOpen ? participantCopy.taskSummary.roundOneNext : participantCopy.taskSummary.waitNext}</p>
          </article>
          <article>
            <strong>{participantCopy.taskSummary.saveResume}</strong>
            <p>{participantCopy.taskSummary.saveResumeBody}</p>
          </article>
        </div>
        {!hasBackendStudy ? (
          <WarningBanner title={participantCopy.portal.noBackendTitle} risk="info">
            {participantCopy.portal.noBackendBody}
          </WarningBanner>
        ) : null}
        {participantError ? (
          <WarningBanner title="Submission blocked" risk="danger">
            {humanizeBackendMessage(participantError)}
          </WarningBanner>
        ) : null}
        {participantMessage ? (
          <WarningBanner title="Submitted" risk="success">
            {participantMessage}
          </WarningBanner>
        ) : null}
        {participantInvite?.active_consent_version ? (
          <details className="consent-details">
            <summary>Consent information</summary>
            <p>{participantInvite.active_consent_version.text_md.replace(/^#+\s*/gm, "")}</p>
            <small>Consent version: {shortId(participantInvite.active_consent_version.consent_version_id)}</small>
          </details>
        ) : null}
        {participantWithdrawn ? (
          <WarningBanner title="Withdrawn from future participation" risk="success">
            Your withdrawal has been recorded. No further study tasks are required through this invitation.
          </WarningBanner>
        ) : hasRatingTask ? (
          <>
            {currentRatingRoundNumber ? <RoundContextPanel roundNumber={currentRatingRoundNumber} /> : null}
            {currentRatingRoundNumber ? (
              <WarningBanner title="Round reminder" risk="info">
                {roundReminder(currentRatingRoundNumber)}
              </WarningBanner>
            ) : null}
            <WarningBanner title="Structured judgment task" risk="info">
              <div className="rating-task-copy">
                <p>
                  <strong>{ratingPrompt}</strong>
                </p>
                <p>{ratingInstructions}</p>
              </div>
            </WarningBanner>
            {submittedRatingsForOpenRound && currentRatingRoundNumber ? (
              <div className="submitted-response-review">
                <strong>What was submitted</strong>
                <div className="submitted-rating-list">
                  {openRatingRoundItems.map((item) => {
                    const rationale = submittedRationalesForOpenRound?.[item.item_id]?.trim();
                    return (
                    <article className="submitted-rating-row" key={`submitted-${item.item_id}`}>
                      <div>
                        <p>{item.text}</p>
                        {rationale ? <small>Optional rationale: {rationale}</small> : null}
                      </div>
                      <StatusBadge risk="success" label={formatRatingChoice(submittedRatingsForOpenRound[item.item_id])} />
                    </article>
                    );
                  })}
                </div>
                {ratingRoundIsComplete ? (
                  <StatusBadge risk="success" label={`Round ${currentRatingRoundNumber} task complete`} />
                ) : (
                  <div className="action-row">
                    <button className="secondary-button" disabled={participantBusy} onClick={() => onEditSubmittedRatings(currentRatingRoundNumber)} type="button">
                      Revise responses
                    </button>
                    <button className="primary-button" disabled={participantBusy} onClick={() => onFinishRatingRoundTask(currentRatingRoundNumber)} type="button">
                      Retain submitted responses
                    </button>
                  </div>
                )}
              </div>
            ) : null}
            {showRatingEditor ? (
              <>
                {currentRatingRoundNumber ? (
                  <ProgressIndicator
                    label={`Round ${currentRatingRoundNumber} progress`}
                    value={openRatingRoundItems.length ? (selectedRatingCount / openRatingRoundItems.length) * 100 : 0}
                    detail={`${selectedRatingCount} of ${openRatingRoundItems.length} statements answered`}
                  />
                ) : null}
                <SaveStatusIndicator savedAt={currentRatingDraftSavedAt} scope="Rating progress" />
                <div className="rating-task-list">
                  {openRatingRoundItems.map((item, itemIndex) => (
                    <article className="rating-task" key={item.item_id}>
                      <div className="rating-task-header">
                        <StatusBadge risk="info" label={`Item ${itemIndex + 1} of ${openRatingRoundItems.length}`} />
                      </div>
                      <div className="statement-to-evaluate">
                        <span>Statement to evaluate</span>
                        <p>{item.text}</p>
                      </div>
                      <ControlledFeedbackCard item={item} />
                      <fieldset className="rating-scale" aria-label={`Agreement response for ${item.text}`}>
                        <legend>
                          {ratingRoundIsEditing
                            ? "Revise your response"
                            : "How much do you agree this statement should be prioritized?"}
                        </legend>
                        <div className="rating-options">
                          {ratingScaleOptions.map((option) => {
                            const selected = roundTwoRatings[item.item_id] === option.value;
                            return (
                              <label className={selected ? "rating-option selected" : "rating-option"} key={option.value}>
                                <input
                                  checked={selected}
                                  name={`rating-${openRatingRound?.round_number}-${item.item_id}`}
                                  onChange={() => onRoundTwoRatingChange(item.item_id, option.value)}
                                  type="radio"
                                  value={option.value}
                                />
                                <span>
                                  <strong>{option.label}</strong>
                                  <small>{option.detail}</small>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                      <label className="field rationale-field">
                        <span>Optional rationale</span>
                        <textarea
                          aria-describedby={`rationale-help-${item.item_id}`}
                          value={roundTwoRationales[item.item_id] ?? ""}
                          onChange={(event) => onRoundTwoRationaleChange(item.item_id, event.target.value)}
                        />
                        <small id={`rationale-help-${item.item_id}`}>Add context only if it helps explain your judgment. This is optional.</small>
                      </label>
                    </article>
                  ))}
                </div>
                <div className="action-row sticky-action-bar">
                  {currentRatingRoundNumber ? (
                    <button className="secondary-button" disabled={participantBusy} onClick={() => onSaveParticipantRatingDraft(currentRatingRoundNumber)} type="button">
                      Save progress
                    </button>
                  ) : null}
                  <button className="primary-button" disabled={participantBusy} onClick={onSubmitRoundTwoRatings} type="button">
                    {participantBusy
                      ? "Submitting..."
                      : ratingRoundIsEditing
                        ? `Submit revised Round ${openRatingRound?.round_number} responses`
                        : `Submit Round ${openRatingRound?.round_number} responses`}
                  </button>
                </div>
              </>
            ) : null}
          </>
        ) : roundOneOpen && effectiveRoundOneConfig ? (
          <>
            {!participantOrientationComplete ? (
              <ParticipantOrientationPanel
                title={studyTitle}
                wizard={wizard}
                participantInvite={participantInvite}
                participantBusy={participantBusy}
                onComplete={onCompleteParticipantOrientation}
              />
            ) : null}
            {participantOrientationComplete ? (
              <>
            <WarningBanner title="Confidential to research team" risk="info">
              {wizard.confidentialityStatement} <InlineHelp id="confidentiality" label="anonymity and confidentiality" text={inlineHelp.anonymityConfidentiality} />
            </WarningBanner>
            <WarningBanner title="Round reminder" risk="info">
              {roundReminder(1)}
            </WarningBanner>
            {!roundOneConfig ? (
              <WarningBanner title="Round 1 task setup will be finalized on submit" risk="warning">
                Round 1 is open. The participant task and consent version will be saved before this response is recorded.
              </WarningBanner>
            ) : null}
            <p className="callout-text">{effectiveRoundOneConfig.participant_instructions}</p>
            {participantSubmittedRoundOneText ? (
              <div className="submitted-response-review">
                <strong>What was submitted</strong>
                <div className="submitted-response-list">
                  {roundOneResearchQuestions.map((question, index) => {
                    const text = participantSubmittedRoundOneAnswers?.[question.id] ?? (index === 0 ? participantSubmittedRoundOneText : "");
                    return text ? (
                      <article className="submitted-rating-row" key={`submitted-r1-${question.id}`}>
                        <div>
                          <small>{questionLabel(question, index)}</small>
                          <p>{text}</p>
                        </div>
                      </article>
                    ) : null;
                  })}
                </div>
                {participantRoundOneComplete ? (
                  <StatusBadge risk="success" label="Round 1 task complete" />
                ) : (
                  <div className="action-row">
                    <button className="secondary-button" disabled={participantBusy} onClick={onEditSubmittedRoundOne} type="button">
                      Edit response
                    </button>
                    <button className="primary-button" disabled={participantBusy} onClick={onFinishRoundOneTask} type="button">
                      Finish Round 1 task
                    </button>
                  </div>
                )}
              </div>
            ) : null}
            {showRoundOneEditor ? (
              <>
                <SaveStatusIndicator savedAt={participantDraftSavedAt} scope="Round 1 progress" />
                <div className="question-response-list">
                  {roundOneResearchQuestions.map((question, index) => (
                    <label className="field wide-field round-one-question-response" key={question.id}>
                      <span>{participantRoundOneEditing ? `Revise ${questionLabel(question, index)}` : questionLabel(question, index)}{question.requiredForRound1Response ? " (required)" : ""}</span>
                      <strong>{question.text}</strong>
                      {question.description ? <small>{question.description}</small> : null}
                      <textarea
                        aria-label={`Round 1 response for ${questionLabel(question, index)}`}
                        value={participantRoundOneAnswers[question.id] ?? (index === 0 ? participantResponseText : "")}
                        onChange={(event) => {
                          onParticipantRoundOneAnswerChange(question.id, event.target.value);
                          if (index === 0) onParticipantResponseChange(event.target.value);
                        }}
                      />
                    </label>
                  ))}
                </div>
                <label className="check-field wide-field">
                  <input
                    checked={participantConsentChecked}
                    onChange={(event) => onParticipantConsentChange(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    I have reviewed the consent information, confidentiality language, and withdrawal rights for this study.
                  </span>
                </label>
                <DataBar
                  value={participantSubmittedRoundOneText ? 75 : (requiredRoundOneQuestions.length ? (answeredRequiredRoundOne / requiredRoundOneQuestions.length) * 60 : 0)}
                  label="Your task progress"
                />
                <div className="action-row sticky-action-bar">
                  <button className="secondary-button" disabled={participantBusy} onClick={onSaveParticipantRoundOneDraft} type="button">
                    Save progress
                  </button>
                  <button className="primary-button" disabled={participantBusy} onClick={onSubmitParticipantRoundOne} type="button">
                    {participantBusy
                      ? "Submitting..."
                      : participantRoundOneEditing
                        ? "Submit revised response"
                        : "Submit Round 1 response"}
                  </button>
                </div>
              </>
            ) : null}
              </>
            ) : null}
          </>
        ) : (
          <WarningBanner title={participantCopy.portal.waitingTitle} risk="info">
            {participantCopy.portal.waitingBody}
          </WarningBanner>
        )}
      </section>

      <ParticipantIssueReporter
        busy={participantBusy}
        currentPage={`participant_portal: ${currentTaskLabel}`}
        currentRoundNumber={issueRoundNumber}
        onReport={onReportParticipantIssue}
      />
      <ParticipantIssueHistory issues={runtimeData.participantIssues} />

      <section className="panel">
        <h3>Study Time Commitment</h3>
        <p>{participantStudyTimeCopy}</p>
        {participantStudyFormatLabel ? <StatusBadge risk="info" label={participantStudyFormatLabel} /> : null}
      </section>

      <section className="panel">
        <h3>{participantCopy.portal.participantRightsTitle}</h3>
        <ul className="plain-list">
          {participantCopy.portal.rights.map((right) => <li key={right}>{right}</li>)}
        </ul>
        {participantInvite ? (
          <div className="participant-rights-actions">
            <button className="secondary-button danger-button" disabled={participantBusy || participantWithdrawn} onClick={onWithdrawParticipant} type="button">
              Withdraw from future participation
            </button>
            <button className="secondary-button" disabled={participantBusy} onClick={onRequestDeletionReview} type="button">
              Request retention/deletion review
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function RoundContextPanel({ roundNumber }: { roundNumber: number }) {
  if (roundNumber <= 1) return null;
  return (
    <section className="round-context-panel" aria-labelledby={`round-context-${roundNumber}`}>
      <h4 id={`round-context-${roundNumber}`}>You are now in Round {roundNumber}</h4>
      <p>
        {roundNumber === 2
          ? "This round is based on anonymized responses from Round 1"
          : "This round is based on anonymized responses and controlled feedback from earlier rounds."}
      </p>
      <ul>
        <li>You may revise or retain your view.</li>
        <li>You may keep your previous response.</li>
        <li>You may revise your response.</li>
        <li>Different views are valuable.</li>
        <li>Consensus does not mean correctness.</li>
      </ul>
      <p className="microcopy">
        {consensusReminder()} <InlineHelp id={`consensus-${roundNumber}`} label="consensus" text={inlineHelp.consensus} />
      </p>
    </section>
  );
}

function ControlledFeedbackCard({ item }: { item: RoundItemForParticipant }) {
  const feedback = item.controlled_feedback;
  if (!feedback) {
    return (
      <div className="controlled-feedback-card">
        <span className="feedback-source">Item source: {item.provenance_type === "LiteratureDerived" ? "Literature-derived" : "Panel-generated"}</span>
      </div>
    );
  }
  const distributionEntries = Object.entries(feedback.group_summary.distribution);
  const maxCount = Math.max(1, ...distributionEntries.map(([, count]) => count));
  const sourceLabelByType: Record<NonNullable<RoundItemForParticipant["controlled_feedback"]>["item_source"], string> = {
    "panel-generated": "Panel-generated",
    "literature-derived": "Literature-derived",
    "researcher-added": "Researcher-added",
    "AI-assisted draft, human approved": "AI-assisted draft, human approved",
  };
  const sourceLabel = sourceLabelByType[feedback.item_source];

  return (
    <aside className="controlled-feedback-card" aria-label={`Controlled feedback for ${item.text}`}>
      <div className="feedback-card-topline">
        <span className="feedback-source">Item source: {sourceLabel}</span>
        <span>Source round: {feedback.source_round_number}</span>
      </div>
      <div className="feedback-metrics">
        <div>
          <strong>
            Your previous response <InlineHelp id={`prior-${item.item_id}`} label="your previous response" text={inlineHelp.priorResponse} />
          </strong>
          <p>
            {feedback.show_participant_prior_response
              ? feedback.participant_prior_response
                ? formatRatingChoice(feedback.participant_prior_response.rating)
                : "No prior response recorded for this item."
              : "Prior response not shown for this round."}
          </p>
        </div>
        <div>
          <strong>
            Group median <InlineHelp id={`median-${item.item_id}`} label="median" text={inlineHelp.median} />
          </strong>
          <p>{feedback.group_summary.median === null ? "Not available yet" : formatRatingChoice(feedback.group_summary.median)}</p>
        </div>
        <div>
          <strong>
            Middle range of responses <InlineHelp id={`iqr-${item.item_id}`} label="IQR" text={inlineHelp.iqr} />
          </strong>
          <p>{feedback.group_summary.iqr === null ? "Not available yet" : `IQR ${feedback.group_summary.iqr}`}</p>
        </div>
      </div>
      <details className="feedback-detail">
        <summary>Show more detail</summary>
        <p>Response spread is shown as anonymized aggregate counts. Consensus does not mean correctness.</p>
        <div className="compact-distribution" role="img" aria-label={`Distribution across ${feedback.group_summary.response_count} anonymized prior responses`}>
          {Array.from({ length: 9 }, (_, index) => {
            const value = String(index + 1);
            const count = feedback.group_summary.distribution[value] ?? 0;
            return (
              <span key={value}>
                <i style={{ height: `${Math.max(8, (count / maxCount) * 40)}px` }} />
                <small>{value}: {count}</small>
              </span>
            );
          })}
        </div>
      </details>
      {feedback.neutral_summary ? (
        <div className="neutral-summary">
          <strong>
            Neutral summary <InlineHelp id={`summary-${item.item_id}`} label="group summary" text={inlineHelp.groupSummary} />
          </strong>
          <p>{feedback.neutral_summary.text}</p>
        </div>
      ) : null}
      {feedback.rationale_excerpts ? (
        <details className="feedback-detail">
          <summary>Show rationale excerpts</summary>
          {feedback.rationale_excerpts.excerpts.length > 0 ? (
            <ul>
              {feedback.rationale_excerpts.excerpts.map((excerpt, index) => (
                <li key={`${item.item_id}-excerpt-${index}`}>{excerpt}</li>
              ))}
            </ul>
          ) : (
            <p>No approved anonymized rationale excerpts are available for this item.</p>
          )}
        </details>
      ) : null}
    </aside>
  );
}

function ReportingScreen({
  study,
  role,
  workflow,
  runtimeData,
  runtimeActionBusy,
  onExportOutput,
  onSelectExportPackage,
  onReviewExportPackage,
  onDownloadExportPackageFile,
}: {
  study: StudyRecord;
  role: UserRole;
  workflow: ConductorWorkflow;
  runtimeData: RuntimeStudyData;
  runtimeActionBusy: string | null;
  onExportOutput: (outputId: string) => void;
  onSelectExportPackage: (packageId: string) => void;
  onReviewExportPackage: (packageId: string, reviewStatus: "approved" | "rejected", note: string) => void;
  onDownloadExportPackageFile: (packageId: string, fileId: string) => void;
}) {
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const realReport = runtimeData.roundReport ?? runtimeData.exportReport;
  const realItems = realReport?.items ?? [];
  const reportSafe = reportIncludesNonConsensus(study.report);
  const threshold = realItems.find((item) => item.consensus.threshold_percent !== null)?.consensus.threshold_percent
    ?? study.report.thresholdUsed;
  const attrition = realReport?.summary.attrition?.attrition_rate ?? study.report.attritionRate;
  const hasRealStudy = Boolean(workflow.study && workflow.version);
  const selectedPackage =
    runtimeData.exportPackages.find((pkg) => pkg.export_package_id === runtimeData.selectedExportPackageId) ??
    runtimeData.exportPackages.at(-1) ??
    null;
  const selectedFiles = selectedPackage ? runtimeData.exportPackageFiles[selectedPackage.export_package_id] ?? [] : [];
  const latestReview = selectedPackage?.reviews?.at(-1) ?? null;
  const canReviewExports =
    role === "study_owner" ||
    role === "ethics_methods_steward" ||
    role === "data_custodian" ||
    role === "security_privacy_lead";
  const selectedReviewNote = selectedPackage ? reviewNotes[selectedPackage.export_package_id] ?? "" : "";

  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Reporting Dashboard</span>
          <h2>Downstream users see limits, dissent, and method configuration</h2>
        </div>
        <WarningBanner title="Required statement" risk="info">
          Consensus indicates agreement among this panel; it does not establish correctness.
        </WarningBanner>
      </section>

      <section className="panel">
        <h3>Report Integrity</h3>
        <StatusBadge
          risk={realReport ? "success" : reportSafe ? "success" : "danger"}
          label={realReport ? "Real round data loaded" : reportSafe ? "Non-consensus included" : "Blocked"}
        />
        <DataBar value={attrition} label="Attrition" />
        {realReport?.summary.attrition?.warnings.length ? (
          <WarningBanner title="Attrition interpretation" risk="warning">
            {realReport.summary.attrition.warnings.join(" ")}
          </WarningBanner>
        ) : null}
        <LockedRule title="Threshold used" value={`${threshold}%`} locked />
        {hasRealStudy && !realReport ? (
          <WarningBanner title="No reportable rating data yet" risk="info">
            Publish Round 2 items and collect ratings to populate this report from actual participant data.
          </WarningBanner>
        ) : null}
        {realReport ? (
          <dl className="detail-list">
            <div>
              <dt>Report stage</dt>
              <dd>{realReport.report_stage}</dd>
            </div>
            <div>
              <dt>Dataset hash</dt>
              <dd>{shortId(realReport.hashes.dataset_hash)}</dd>
            </div>
            <div>
              <dt>Submissions</dt>
              <dd>{realReport.summary.round_submission_count ?? realReport.summary.final_round_submission_count ?? 0}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="panel">
        <h3>Output Models</h3>
        {runtimeData.message ? (
          <WarningBanner title="Export status" risk="success">
            {runtimeData.message}
          </WarningBanner>
        ) : null}
        {runtimeData.error ? (
          <WarningBanner title="Export blocked" risk="danger">
            {humanizeBackendMessage(runtimeData.error)}
          </WarningBanner>
        ) : null}
        {outputModelRegistry.map((output) => {
          const permitted = canExportOutput(role, output);

          return (
            <article className="output-row" key={output.id}>
              <div>
                <strong>{output.label}</strong>
                <small>{output.sections.slice(0, 2).join(" + ")}</small>
              </div>
              <div className="output-actions">
                <StatusBadge risk={permitted ? "success" : "locked"} label={permitted ? "Permitted" : "Restricted"} />
                <button
                  className="secondary-button"
                  disabled={!permitted || runtimeActionBusy === `export-${output.id}`}
                  onClick={() => onExportOutput(output.id)}
                  type="button"
                >
                  Prepare
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Export Package Center</span>
          <h2>Review, approve, and download governed outputs</h2>
        </div>
        {!hasRealStudy ? (
          <WarningBanner title="Backend study required" risk="info">
            Open a saved backend study to show persistent export packages.
          </WarningBanner>
        ) : runtimeData.exportPackages.length === 0 ? (
          <WarningBanner title="No export packages yet" risk="info">
            Prepare the Final Delphi Report package to create governed files for review.
          </WarningBanner>
        ) : (
          <div className="export-center">
            <div className="export-package-list" aria-label="Export packages">
              {runtimeData.exportPackages.map((pkg) => {
                const review = pkg.reviews?.at(-1) ?? null;
                const isSelected = selectedPackage?.export_package_id === pkg.export_package_id;
                return (
                  <button
                    className={isSelected ? "export-package-card active" : "export-package-card"}
                    key={pkg.export_package_id}
                    onClick={() => onSelectExportPackage(pkg.export_package_id)}
                    type="button"
                  >
                    <span>
                      <strong>{outputModelRegistry.find((output) => output.id === pkg.export_type)?.label ?? pkg.export_type}</strong>
                      <small>{formatDateTime(pkg.export_created_at)} by {pkg.export_created_by.role}</small>
                    </span>
                    <StatusBadge
                      risk={review?.review_status === "approved" ? "success" : review?.review_status === "rejected" ? "danger" : "warning"}
                      label={review?.review_status ?? pkg.human_review_status.replace("_", " ")}
                    />
                  </button>
                );
              })}
            </div>

            {selectedPackage ? (
              <div className="export-package-detail">
                <div className="summary-grid">
                  <article className="summary-item">
                    <strong>Anonymization</strong>
                    <p>{selectedPackage.anonymization_level.replace("_", " ")}</p>
                  </article>
                  <article className="summary-item">
                    <strong>Identifiable data</strong>
                    <p>{selectedPackage.contains_identifiable_data ? "Present: restricted handling required" : "No direct identifiers in package metadata"}</p>
                  </article>
                  <article className="summary-item">
                    <strong>Package hash</strong>
                    <p>{shortId(selectedPackage.package_hash)}...</p>
                  </article>
                  <article className="summary-item">
                    <strong>AI disclosure</strong>
                    <p>{selectedPackage.external_ai_used ? "External AI used" : "No external AI connector recorded"}</p>
                  </article>
                </div>

                {selectedPackage.contains_identifiable_data || selectedPackage.anonymization_level !== "aggregated_only" ? (
                  <WarningBanner title="Sensitive export handling" risk="warning">
                    Downloads are deliberate, permission-gated, and audit logged. Confirm the recipient and purpose before downloading.
                  </WarningBanner>
                ) : (
                  <WarningBanner title="Download audit" risk="info">
                    File downloads are still audit logged even when the package is publication-safe.
                  </WarningBanner>
                )}

                <div className="export-file-list">
                  {selectedFiles.length === 0 ? (
                    <button
                      className="secondary-button"
                      disabled={runtimeActionBusy === `files-${selectedPackage.export_package_id}`}
                      onClick={() => onSelectExportPackage(selectedPackage.export_package_id)}
                      type="button"
                    >
                      {runtimeActionBusy === `files-${selectedPackage.export_package_id}` ? "Loading files..." : "Load file list"}
                    </button>
                  ) : selectedFiles.map((file) => (
                    <article className="export-file-row" key={file.export_file_id}>
                      <div>
                        <strong>{file.path}</strong>
                        <small>{file.format} · {file.content_encoding} · sha256 {shortId(file.sha256)}...</small>
                      </div>
                      <div className="output-actions">
                        <StatusBadge risk={file.contains_identifiable_data ? "warning" : "success"} label={file.contains_identifiable_data ? "Sensitive" : "No identifiers"} />
                        <button
                          className="secondary-button"
                          disabled={runtimeActionBusy === `download-${file.export_file_id}`}
                          onClick={() => onDownloadExportPackageFile(selectedPackage.export_package_id, file.export_file_id)}
                          type="button"
                        >
                          Download
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="review-box">
                  <h3>Human Review</h3>
                  {latestReview ? (
                    <WarningBanner title={`Latest review: ${latestReview.review_status}`} risk={latestReview.review_status === "approved" ? "success" : "danger"}>
                      {latestReview.note} Reviewed by {latestReview.reviewed_by.role} at {formatDateTime(latestReview.reviewed_at)}.
                    </WarningBanner>
                  ) : (
                    <WarningBanner title="Review pending" risk="warning">
                      The package is not released by interface review until an authorized role records approve or reject with a note.
                    </WarningBanner>
                  )}
                  <label className="field wide-field">
                    <span>Review note</span>
                    <textarea
                      disabled={!canReviewExports}
                      value={selectedReviewNote}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [selectedPackage.export_package_id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="action-row">
                    <button
                      className="primary-button"
                      disabled={!canReviewExports || selectedReviewNote.trim().length === 0 || runtimeActionBusy === `review-${selectedPackage.export_package_id}`}
                      onClick={() => onReviewExportPackage(selectedPackage.export_package_id, "approved", selectedReviewNote)}
                      type="button"
                    >
                      Approve package
                    </button>
                    <button
                      className="secondary-button danger-button"
                      disabled={!canReviewExports || selectedReviewNote.trim().length === 0 || runtimeActionBusy === `review-${selectedPackage.export_package_id}`}
                      onClick={() => onReviewExportPackage(selectedPackage.export_package_id, "rejected", selectedReviewNote)}
                      type="button"
                    >
                      Reject package
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="panel wide">
        <h3>Item Classification</h3>
        <div className="report-table">
          {realItems.length > 0
            ? realItems.map((item) => (
                <article className="report-row" key={item.item_id}>
                  <StatusBadge risk={roundReportRisk(item.consensus.status)} label={item.consensus.status.replace("_", " ")} />
                  <p>{item.text}</p>
                  <span>Median {item.rating_summary.median ?? "n/a"}</span>
                  <span>IQR {item.rating_summary.dispersion.iqr ?? "n/a"}</span>
                  <span>n={item.rating_summary.response_count}</span>
                </article>
              ))
            : study.report.items.map((item) => (
                <article className="report-row" key={item.id}>
                  <StatusBadge
                    risk={item.consensusClass === "non_consensus" ? "warning" : item.consensusClass === "near_consensus" ? "info" : "success"}
                    label={item.consensusClass.replace("_", " ")}
                  />
                  <p>{item.text}</p>
                  <span>Median {item.median}</span>
                  <span>IQR {item.iqr}</span>
                  <span>n={item.responseCount}</span>
                </article>
              ))}
        </div>
      </section>

      {realReport ? (
        <section className="panel wide">
          <h3>Methodological Limitations</h3>
          <ul className="plain-list">
            {realReport.limitations.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function AuditScreen({ study }: { study: StudyRecord }) {
  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Audit Log Viewer</span>
          <h2>Human-readable events for sensitive actions</h2>
        </div>
        <div className="filter-row">
          {["AI operation", "export", "identity access", "item change", "signoff", "security event"].map((filter) => (
            <button className="filter-chip" key={filter} type="button">{filter}</button>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <AuditTrail events={study.auditEvents} />
      </section>
    </div>
  );
}

const aiFeatureLabels: Array<[keyof StudyAIConfig["featurePermissions"], string]> = [
  ["clustering", "Clustering"],
  ["item_drafting", "Item drafting"],
  ["neutrality_method_linting", "Neutrality / method linting"],
  ["reminders", "Reminders"],
  ["irb_export_drafting", "IRB export drafting"],
  ["report_drafting", "Report drafting"],
];

function aiConfigStatusRisk(validation: AIConfigValidation | null): "success" | "warning" | "info" {
  if (!validation) return "info";
  if (validation.status === "ready" && validation.errors.length === 0) return "success";
  if (validation.status === "no_external_ai_mode") return "info";
  return "warning";
}

function aiConfigStatusLabel(validation: AIConfigValidation | null): string {
  if (!validation) return "Not loaded";
  if (validation.status === "no_external_ai_mode") return "No External AI mode";
  if (validation.status === "ready" && validation.errors.length === 0) return "Ready";
  return "Incomplete";
}

function AdminSecurityScreen({ role, workflow }: { role: UserRole; workflow: ConductorWorkflow }) {
  const identityDecision = identityAccessDecision(role, "Review data subject withdrawal request");
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [assignments, setAssignments] = useState<StudyAssignment[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedStudyRole, setSelectedStudyRole] = useState<StudyAssignment["role"]>("MethodsSteward");
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessBusy, setAccessBusy] = useState(false);
  const [aiConfig, setAiConfig] = useState<StudyAIConfig | null>(null);
  const [aiValidation, setAiValidation] = useState<AIConfigValidation | null>(null);
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [attritionSummary, setAttritionSummary] = useState<AttritionSummary | null>(null);
  const [participantStatuses, setParticipantStatuses] = useState<ParticipantEnrollment[]>([]);
  const [nonResponseEscalations, setNonResponseEscalations] = useState<NonResponseEscalation[]>([]);
  const [nonResponsePolicy, setNonResponsePolicy] = useState<NonResponsePolicy | null>(null);
  const [nonResponseRound, setNonResponseRound] = useState(2);
  const [selectedAttritionParticipant, setSelectedAttritionParticipant] = useState("");
  const [attritionMessage, setAttritionMessage] = useState<string | null>(null);
  const [attritionError, setAttritionError] = useState<string | null>(null);
  const [attritionBusy, setAttritionBusy] = useState(false);
  const [smsPolicy, setSmsPolicy] = useState<SmsPolicy | null>(null);
  const [smsPreference, setSmsPreference] = useState<ParticipantContactPreference | null>(null);
  const [smsNotifications, setSmsNotifications] = useState<SmsNotification[]>([]);
  const [smsParticipantId, setSmsParticipantId] = useState("");
  const [smsPhoneDraft, setSmsPhoneDraft] = useState("");
  const [smsPreferenceDraft, setSmsPreferenceDraft] = useState<ParticipantContactPreference["notification_preference"]>("both");
  const [smsConsentDraft, setSmsConsentDraft] = useState(true);
  const [smsChallenge, setSmsChallenge] = useState<PhoneVerificationChallengeResponse | null>(null);
  const [smsOtpDraft, setSmsOtpDraft] = useState("");
  const [smsRoundNumber, setSmsRoundNumber] = useState(1);
  const [smsMessage, setSmsMessage] = useState<string | null>(null);
  const [smsError, setSmsError] = useState<string | null>(null);
  const [smsBusy, setSmsBusy] = useState(false);
  const activeStudyId = workflow.study?.id ?? null;
  const activeVersionId = workflow.version?.id ?? null;
  const canManageAccess = role === "study_owner" || role === "open_source_admin";
  const canManageAI = role === "study_owner" || role === "open_source_admin";
  const canViewAI = canManageAI || role === "ethics_methods_steward" || role === "security_privacy_lead";
  const canManageAttrition = canManageAccess || role === "ethics_methods_steward";
  const canManageSms = canManageAccess || role === "security_privacy_lead";

  async function loadAccessReview() {
    if (!canManageAccess) return;
    setAccessBusy(true);
    setAccessError(null);
    try {
      const userResult = await conductorApi.listUsers(role);
      setUsers(userResult.users);
      if (!selectedUserId && userResult.users[0]) setSelectedUserId(userResult.users[0].user_id);
      if (activeStudyId) {
        const assignmentResult = await conductorApi.listAssignments(activeStudyId, role);
        setAssignments(assignmentResult.assignments);
      } else {
        setAssignments([]);
      }
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Unable to load users and role assignments.");
    } finally {
      setAccessBusy(false);
    }
  }

  useEffect(() => {
    void loadAccessReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, activeStudyId]);

  async function loadAIConfig() {
    if (!activeStudyId || !canViewAI) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const result = await conductorApi.getAIConfig(activeStudyId, role);
      setAiConfig(result.ai_config);
      setAiValidation(result.validation);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to load AI connector configuration.");
    } finally {
      setAiBusy(false);
    }
  }

  useEffect(() => {
    void loadAIConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, activeStudyId]);

  async function loadAttritionReview() {
    if (!activeStudyId || !activeVersionId || !canManageAttrition) return;
    setAttritionBusy(true);
    setAttritionError(null);
    try {
      const result = await conductorApi.getAttritionSummary(activeStudyId, activeVersionId, role);
      setAttritionSummary(result.attrition_summary);
      setParticipantStatuses(result.participant_statuses);
      setNonResponseEscalations(result.escalations);
      setNonResponsePolicy(result.policy);
      setSelectedAttritionParticipant((current) => current || result.participant_statuses[0]?.participant_id || "");
    } catch (error) {
      setAttritionError(error instanceof Error ? error.message : "Unable to load attrition review.");
    } finally {
      setAttritionBusy(false);
    }
  }

  useEffect(() => {
    void loadAttritionReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, activeStudyId, activeVersionId]);

  async function loadSmsReview() {
    if (!activeStudyId || !activeVersionId || !canManageSms) return;
    setSmsBusy(true);
    setSmsError(null);
    try {
      const [policyResult, notificationsResult] = await Promise.all([
        conductorApi.getSmsPolicy(activeStudyId, activeVersionId, role),
        conductorApi.listSmsNotifications(activeStudyId, activeVersionId, role),
      ]);
      setSmsPolicy(policyResult.policy);
      setSmsNotifications(notificationsResult.notifications);
      const firstParticipant = participantStatuses[0]?.participant_id ?? "";
      setSmsParticipantId((current) => current || firstParticipant);
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Unable to load SMS notification settings.");
    } finally {
      setSmsBusy(false);
    }
  }

  useEffect(() => {
    void loadSmsReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, activeStudyId, activeVersionId, canManageSms, participantStatuses.length]);

  useEffect(() => {
    if (!activeStudyId || !activeVersionId || !smsParticipantId || !canManageSms) return;
    const studyId = activeStudyId;
    const versionId = activeVersionId;
    const participantId = smsParticipantId;
    async function loadPreference() {
      try {
        const result = await conductorApi.getContactPreference(studyId, versionId, participantId, role);
        setSmsPreference(result.contact_preference);
        setSmsPreferenceDraft(result.contact_preference?.notification_preference ?? "both");
        setSmsConsentDraft(Boolean(result.contact_preference?.sms_consent_at && !result.contact_preference?.sms_consent_revoked_at));
      } catch {
        setSmsPreference(null);
      }
    }
    void loadPreference();
  }, [activeStudyId, activeVersionId, smsParticipantId, role, canManageSms]);

  async function saveSmsPolicy() {
    if (!activeStudyId || !activeVersionId || !smsPolicy) return;
    setSmsBusy(true);
    setSmsError(null);
    setSmsMessage(null);
    try {
      const result = await conductorApi.updateSmsPolicy(activeStudyId, activeVersionId, role, smsPolicy);
      setSmsPolicy(result.policy);
      setSmsMessage("SMS policy saved. Round-open texts remain opt-in and neutral.");
      await loadSmsReview();
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Unable to save SMS policy.");
    } finally {
      setSmsBusy(false);
    }
  }

  async function saveSmsPreference() {
    if (!activeStudyId || !activeVersionId || !smsParticipantId) return;
    setSmsBusy(true);
    setSmsError(null);
    setSmsMessage(null);
    try {
      const result = await conductorApi.updateContactPreference(activeStudyId, activeVersionId, smsParticipantId, role, {
        notification_preference: smsPreferenceDraft,
        phone: smsPhoneDraft,
        sms_consent_granted: smsConsentDraft,
      });
      setSmsPreference(result.contact_preference);
      setSmsMessage("Participant SMS preference saved with masked phone display.");
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Unable to save participant SMS preference.");
    } finally {
      setSmsBusy(false);
    }
  }

  async function startSmsVerification() {
    if (!activeStudyId || !activeVersionId || !smsParticipantId) return;
    setSmsBusy(true);
    setSmsError(null);
    setSmsMessage(null);
    try {
      const challenge = await conductorApi.startPhoneVerification(activeStudyId, activeVersionId, smsParticipantId, role);
      setSmsChallenge(challenge);
      setSmsMessage(`Verification challenge created for ${challenge.masked_phone}.`);
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Unable to start phone verification.");
    } finally {
      setSmsBusy(false);
    }
  }

  async function verifySmsPhone() {
    if (!activeStudyId || !activeVersionId || !smsParticipantId || !smsChallenge) return;
    setSmsBusy(true);
    setSmsError(null);
    setSmsMessage(null);
    try {
      const result = await conductorApi.verifyPhoneOtp(activeStudyId, activeVersionId, smsParticipantId, role, smsChallenge.challenge_id, smsOtpDraft);
      setSmsPreference(result.contact_preference);
      setSmsChallenge(null);
      setSmsOtpDraft("");
      setSmsMessage("Phone number verified. SMS remains optional and revocable.");
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Unable to verify phone.");
    } finally {
      setSmsBusy(false);
    }
  }

  async function sendSmsForRound() {
    if (!activeStudyId || !activeVersionId) return;
    setSmsBusy(true);
    setSmsError(null);
    setSmsMessage(null);
    try {
      const result = await conductorApi.sendRoundOpenSms(activeStudyId, activeVersionId, smsRoundNumber, role);
      setSmsMessage(`${result.sms.sent} SMS notification${result.sms.sent === 1 ? "" : "s"} sent; ${result.sms.skipped} skipped with audit reasons.`);
      await loadSmsReview();
    } catch (error) {
      setSmsError(error instanceof Error ? error.message : "Unable to send round-open SMS.");
    } finally {
      setSmsBusy(false);
    }
  }

  async function runAttritionAction(action: "detect" | "reminder" | "final" | "expire" | "inactive" | "save-policy") {
    if (!activeStudyId || !activeVersionId) return;
    setAttritionBusy(true);
    setAttritionError(null);
    setAttritionMessage(null);
    try {
      if (action === "detect") {
        const result = await conductorApi.detectNonResponse(activeStudyId, activeVersionId, nonResponseRound, role);
        setAttritionMessage(`${result.flagged.length} participant status record${result.flagged.length === 1 ? "" : "s"} flagged for configured non-response review.`);
      } else if (action === "reminder" && selectedAttritionParticipant) {
        await conductorApi.queueParticipantReminder(activeStudyId, activeVersionId, nonResponseRound, selectedAttritionParticipant, role);
        setAttritionMessage("Neutral reminder queued and follow-up window started.");
      } else if (action === "final" && selectedAttritionParticipant) {
        await conductorApi.queueParticipantFinalNotice(activeStudyId, activeVersionId, nonResponseRound, selectedAttritionParticipant, role);
        setAttritionMessage("Final notice queued from the approved fixed template.");
      } else if (action === "expire" && selectedAttritionParticipant) {
        await conductorApi.expireParticipantFollowup(activeStudyId, activeVersionId, nonResponseRound, selectedAttritionParticipant, role);
        setAttritionMessage("Follow-up window marked expired for review.");
      } else if (action === "inactive" && selectedAttritionParticipant) {
        await conductorApi.markParticipantInactive(activeStudyId, activeVersionId, selectedAttritionParticipant, role, nonResponseRound + 1);
        setAttritionMessage("Participant marked inactive for future rounds only. Prior data remains preserved.");
      } else if (action === "save-policy" && nonResponsePolicy) {
        const result = await conductorApi.updateNonResponsePolicy(activeStudyId, activeVersionId, role, nonResponsePolicy);
        setNonResponsePolicy(result.policy);
        setAttritionMessage("Non-response policy saved. Launched studies lock this policy.");
      }
      await loadAttritionReview();
    } catch (error) {
      setAttritionError(error instanceof Error ? error.message : "Unable to complete attrition action.");
    } finally {
      setAttritionBusy(false);
    }
  }

  async function saveAIConfig(nextConfig = aiConfig) {
    if (!activeStudyId || !nextConfig || !canManageAI) return;
    setAiBusy(true);
    setAiError(null);
    setAiMessage(null);
    try {
      const result = await conductorApi.updateAIConfig(activeStudyId, role, {
        externalAiEnabled: nextConfig.externalAiEnabled,
        noExternalAiMode: nextConfig.noExternalAiMode,
        providerName: nextConfig.providerName,
        modelName: nextConfig.modelName,
        featurePermissions: nextConfig.featurePermissions,
        disclosure: nextConfig.disclosure,
      });
      setAiConfig(result.ai_config);
      setAiValidation(result.validation);
      setAiMessage("AI connector configuration saved and audit logged.");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to save AI connector configuration.");
    } finally {
      setAiBusy(false);
    }
  }

  async function saveApiKey() {
    if (!activeStudyId || !apiKeyDraft.trim() || !canManageAI) return;
    setAiBusy(true);
    setAiError(null);
    setAiMessage(null);
    try {
      const result = await conductorApi.setAIConfigApiKey(activeStudyId, role, apiKeyDraft);
      setAiConfig(result.ai_config);
      setAiValidation(result.validation);
      setApiKeyDraft("");
      setAiMessage("API key saved as encrypted server-side material. The plaintext key cannot be retrieved.");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to save API key.");
    } finally {
      setAiBusy(false);
    }
  }

  async function deleteApiKey() {
    if (!activeStudyId || !canManageAI) return;
    setAiBusy(true);
    setAiError(null);
    setAiMessage(null);
    try {
      const result = await conductorApi.deleteAIConfigApiKey(activeStudyId, role);
      setAiConfig(result.ai_config);
      setAiValidation(result.validation);
      setAiMessage("API key material deleted from the study AI configuration.");
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "Unable to delete API key.");
    } finally {
      setAiBusy(false);
    }
  }

  async function assignRole() {
    if (!activeStudyId || !selectedUserId) return;
    setAccessBusy(true);
    setAccessError(null);
    setAccessMessage(null);
    try {
      await conductorApi.assignStudyRole(activeStudyId, selectedUserId, selectedStudyRole, role);
      const assignmentResult = await conductorApi.listAssignments(activeStudyId, role);
      setAssignments(assignmentResult.assignments);
      setAccessMessage("Study membership updated and audit logged.");
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Unable to update study membership.");
    } finally {
      setAccessBusy(false);
    }
  }

  async function removeRole(userId: string) {
    if (!activeStudyId) return;
    setAccessBusy(true);
    setAccessError(null);
    setAccessMessage(null);
    try {
      await conductorApi.removeStudyAssignment(activeStudyId, userId, role);
      const assignmentResult = await conductorApi.listAssignments(activeStudyId, role);
      setAssignments(assignmentResult.assignments);
      setAccessMessage("Study membership removed and audit logged.");
    } catch (error) {
      setAccessError(error instanceof Error ? error.message : "Unable to remove study membership.");
    } finally {
      setAccessBusy(false);
    }
  }

  function userLabel(userId: string): string {
    const user = users.find((entry) => entry.user_id === userId);
    return user ? `${user.display_name} (${user.email})` : userId;
  }
  const roleConcentrations = concentratedAssignments(assignments);

  return (
    <div className="screen-grid">
      <section className="panel">
        <h3>Identity Separation</h3>
        <StatusBadge risk={canAccessIdentityMap(role) ? "warning" : "locked"} label={identityDecision === "allowed" ? "Purpose logged" : "Access blocked"} />
        <p>
          Identity data and response data remain separate in the interface. Access requires a privileged role and a specific purpose.
        </p>
      </section>

      <section className="panel">
        <h3>Security Console</h3>
        <ul className="plain-list">
          <li>Role management and access reviews are backend enforced and audit logged.</li>
          <li>AI connector configuration and disclosure status</li>
          <li>Retention and deletion request workflow</li>
          <li>Export permission policy</li>
          <li>Responsible disclosure pathway</li>
        </ul>
      </section>

      <section className="panel wide">
        <WarningBanner title="Zero-trust UI posture" risk="info">
          The interface hides unavailable actions, but backend authorization remains the enforcement point.
        </WarningBanner>
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">AI Connector & Compliance</span>
          <h2>Study-level AI assistance is permissioned, disclosed, and human-reviewed</h2>
        </div>
        {!canViewAI ? (
          <WarningBanner title="AI connector restricted" risk="locked">
            Panelists and ordinary participants cannot access AI provider settings or secret state.
          </WarningBanner>
        ) : !activeStudyId ? (
          <WarningBanner title="Open a backend study" risk="info">
            Open or create a saved study to configure study-level AI assistance.
          </WarningBanner>
        ) : !aiConfig ? (
          <WarningBanner title="AI connector loading" risk="info">
            {aiBusy ? "Loading AI connector configuration..." : "AI connector configuration is not loaded yet."}
          </WarningBanner>
        ) : (
          <>
            {aiMessage ? <WarningBanner title="AI connector update" risk="success">{aiMessage}</WarningBanner> : null}
            {aiError ? <WarningBanner title="AI connector blocked" risk="danger">{humanizeBackendMessage(aiError)}</WarningBanner> : null}
            <div className="summary-grid">
              <article className="summary-item">
                <strong>Status</strong>
                <div className="badge-line">
                  <StatusBadge risk={aiConfigStatusRisk(aiValidation)} label={aiConfigStatusLabel(aiValidation)} />
                  <StatusBadge risk={aiConfig.keyExists ? "success" : "locked"} label={aiConfig.maskedApiKey ?? "No API key stored"} />
                </div>
                <p>AI Suggestion (Not Final) outputs require human Accept/Edit/Reject action before study content changes.</p>
              </article>
              <article className="summary-item">
                <strong>Secret handling</strong>
                <p>Stored API keys are encrypted server-side. The plaintext key is never shown again, included in exports, or written to audit details.</p>
              </article>
            </div>

            <div className="form-grid">
              <div className="ai-mode-stack wide-field">
                <label className="check-field">
                  <input
                    checked={aiConfig.noExternalAiMode}
                    disabled={!canManageAI || aiBusy}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setAiConfig({
                        ...aiConfig,
                        noExternalAiMode: checked,
                        externalAiEnabled: checked ? false : aiConfig.externalAiEnabled,
                      });
                    }}
                    type="checkbox"
                  />
                  <span>No External AI mode</span>
                </label>
                <label className="check-field">
                  <input
                    checked={aiConfig.externalAiEnabled}
                    disabled={!canManageAI || aiBusy || aiConfig.noExternalAiMode}
                    onChange={(event) => setAiConfig({ ...aiConfig, externalAiEnabled: event.target.checked })}
                    type="checkbox"
                  />
                  <span>External AI enabled</span>
                </label>
                <p>
                  Turn off No External AI mode, then enable External AI to fill the provider, model, and API key fields.
                </p>
              </div>
              {aiConfig.noExternalAiMode ? (
                <div className="method-helper wide-field">
                  <p>When No External AI mode is active, study data will not be sent to external AI services.</p>
                </div>
              ) : null}
              <label className="field">
                <span>Provider name</span>
                <input
                  disabled={!canManageAI || aiBusy || aiConfig.noExternalAiMode || !aiConfig.externalAiEnabled}
                  onChange={(event) => setAiConfig({ ...aiConfig, providerName: event.target.value })}
                  placeholder="Example: OpenAI, Azure OpenAI, local"
                  value={aiConfig.providerName ?? ""}
                />
              </label>
              <label className="field">
                <span>Model name / version</span>
                <input
                  disabled={!canManageAI || aiBusy || aiConfig.noExternalAiMode || !aiConfig.externalAiEnabled}
                  onChange={(event) => setAiConfig({ ...aiConfig, modelName: event.target.value })}
                  placeholder="Configured model or deployment name"
                  value={aiConfig.modelName ?? ""}
                />
              </label>
              <label className="field">
                <span>API key</span>
                <input
                  autoComplete="off"
                  disabled={!canManageAI || aiBusy || aiConfig.noExternalAiMode || !aiConfig.externalAiEnabled}
                  onChange={(event) => setApiKeyDraft(event.target.value)}
                  placeholder={aiConfig.maskedApiKey ?? "Paste key to set or rotate"}
                  type="password"
                  value={apiKeyDraft}
                />
              </label>
              <div className="field">
                <span>Key lifecycle</span>
                <div className="action-row compact-actions">
                  <button className="secondary-button" disabled={!canManageAI || aiBusy || !apiKeyDraft.trim()} onClick={saveApiKey} type="button">
                    Save / rotate key
                  </button>
                  <button className="secondary-button danger-button" disabled={!canManageAI || aiBusy || !aiConfig.keyExists} onClick={deleteApiKey} type="button">
                    Delete key
                  </button>
                </div>
              </div>
            </div>

            <div className="check-stack ai-feature-grid" aria-label="AI feature permissions">
              {aiFeatureLabels.map(([feature, label]) => (
                <label className="check-field" key={feature}>
                  <input
                    checked={aiConfig.featurePermissions[feature]}
                    disabled={!canManageAI || aiBusy}
                    onChange={(event) => setAiConfig({
                      ...aiConfig,
                      featurePermissions: { ...aiConfig.featurePermissions, [feature]: event.target.checked },
                    })}
                    type="checkbox"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="form-grid">
              {[
                ["dataMayBeSentDescription", "What data may be sent"],
                ["identifiersExcludedDescription", "Identifier and mapping exclusion"],
                ["optOutDescription", "Opt-out / No External AI language"],
                ["humanInTheLoopDescription", "Human-in-the-loop controls"],
              ].map(([key, label]) => (
                <label className="field wide-field" key={key}>
                  <span>{label}</span>
                  <textarea
                    disabled={!canManageAI || aiBusy}
                    onChange={(event) => setAiConfig({
                      ...aiConfig,
                      disclosure: { ...aiConfig.disclosure, [key]: event.target.value },
                    })}
                    value={aiConfig.disclosure[key as keyof StudyAIConfig["disclosure"]]}
                  />
                </label>
              ))}
            </div>

            {aiValidation && (aiValidation.errors.length > 0 || aiValidation.warnings.length > 0) ? (
              <WarningBanner title="Compliance review" risk={aiValidation.errors.length > 0 ? "warning" : "info"}>
                {[...aiValidation.errors, ...aiValidation.warnings].map(humanizeBackendMessage).join(" | ")}
              </WarningBanner>
            ) : null}

            <div className="action-row">
              <button className="primary-button" disabled={!canManageAI || aiBusy} onClick={() => saveAIConfig()} type="button">
                {aiBusy ? "Saving..." : "Save AI connector"}
              </button>
              <button className="secondary-button" disabled={aiBusy} onClick={loadAIConfig} type="button">
                Refresh status
              </button>
            </div>
          </>
        )}
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Governed Non-response</span>
          <h2>Attrition is visible, auditable, and preserved in reporting</h2>
        </div>
        {!canManageAttrition ? (
          <WarningBanner title="Attrition management restricted" risk="locked">
            Participant status review is available only to authorized study roles. It is not a participant-removal tool.
          </WarningBanner>
        ) : !activeStudyId || !activeVersionId ? (
          <WarningBanner title="Open a study" risk="warning">
            Open a backend study before reviewing non-response and withdrawal status.
          </WarningBanner>
        ) : (
          <>
            {attritionSummary ? (
              <div className="summary-grid compact-summary">
                <article className="summary-item">
                  <strong>Current active</strong>
                  <span>{attritionSummary.current_active_count}</span>
                </article>
                <article className="summary-item">
                  <strong>Non-responsive flagged</strong>
                  <span>{attritionSummary.non_responsive_flagged_count}</span>
                </article>
                <article className="summary-item">
                  <strong>Withdrawn / inactive</strong>
                  <span>{attritionSummary.participant_withdrawal_count + attritionSummary.pi_inactive_count}</span>
                </article>
                <article className="summary-item">
                  <strong>Attrition</strong>
                  <span>{attritionSummary.attrition_rate}%</span>
                </article>
              </div>
            ) : null}

            {attritionSummary?.warnings.length ? (
              <WarningBanner title="Method integrity prompt" risk="warning">
                {attritionSummary.warnings.join(" ")}
              </WarningBanner>
            ) : null}

            {nonResponsePolicy ? (
              <div className="form-grid">
                <label className="check-field">
                  <input
                    checked={nonResponsePolicy.missed_current_round_deadline}
                    disabled={attritionBusy}
                    onChange={(event) => setNonResponsePolicy({ ...nonResponsePolicy, missed_current_round_deadline: event.target.checked })}
                    type="checkbox"
                  />
                  <span>Flag missed current round deadline</span>
                </label>
                <label className="check-field">
                  <input
                    checked={nonResponsePolicy.incomplete_submission_counts_as_non_response}
                    disabled={attritionBusy}
                    onChange={(event) => setNonResponsePolicy({ ...nonResponsePolicy, incomplete_submission_counts_as_non_response: event.target.checked })}
                    type="checkbox"
                  />
                  <span>Incomplete submission counts as non-response after deadline</span>
                </label>
                <label className="field">
                  <span>Follow-up window days</span>
                  <input
                    disabled={attritionBusy}
                    min={1}
                    max={30}
                    onChange={(event) => setNonResponsePolicy({ ...nonResponsePolicy, follow_up_window_days: Number(event.target.value) })}
                    type="number"
                    value={nonResponsePolicy.follow_up_window_days}
                  />
                </label>
                <label className="check-field">
                  <input
                    checked={nonResponsePolicy.final_notice_enabled}
                    disabled={attritionBusy}
                    onChange={(event) => setNonResponsePolicy({ ...nonResponsePolicy, final_notice_enabled: event.target.checked })}
                    type="checkbox"
                  />
                  <span>Final notice enabled</span>
                </label>
                <label className="check-field">
                  <input
                    checked={nonResponsePolicy.auto_progression_enabled}
                    disabled={attritionBusy}
                    onChange={(event) => setNonResponsePolicy({ ...nonResponsePolicy, auto_progression_enabled: event.target.checked })}
                    type="checkbox"
                  />
                  <span>Auto-progression setting recorded; scheduler remains governed separately</span>
                </label>
              </div>
            ) : null}

            <div className="method-helper">
              <p>
                Marking a participant inactive affects future study progression only. Prior submitted responses remain in
                historical round data, audit logs, exports, and attrition reporting.
              </p>
            </div>

            <div className="form-grid">
              <label className="field">
                <span>Round for review</span>
                <input
                  min={1}
                  max={4}
                  onChange={(event) => setNonResponseRound(Number(event.target.value))}
                  type="number"
                  value={nonResponseRound}
                />
              </label>
              <label className="field">
                <span>Participant status record</span>
                <select value={selectedAttritionParticipant} onChange={(event) => setSelectedAttritionParticipant(event.target.value)}>
                  {participantStatuses.map((entry) => (
                    <option key={entry.participant_id} value={entry.participant_id}>
                      {entry.participant_id.slice(0, 8)} - {entry.status.replaceAll("_", " ").toLowerCase()}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="action-row compact-actions">
              <button className="secondary-button" disabled={attritionBusy} onClick={() => runAttritionAction("save-policy")} type="button">
                Save policy
              </button>
              <button className="secondary-button" disabled={attritionBusy} onClick={() => runAttritionAction("detect")} type="button">
                Detect non-response
              </button>
              <button className="secondary-button" disabled={attritionBusy || !selectedAttritionParticipant} onClick={() => runAttritionAction("reminder")} type="button">
                Queue reminder
              </button>
              <button className="secondary-button" disabled={attritionBusy || !selectedAttritionParticipant} onClick={() => runAttritionAction("final")} type="button">
                Queue final notice
              </button>
              <button className="secondary-button" disabled={attritionBusy || !selectedAttritionParticipant} onClick={() => runAttritionAction("expire")} type="button">
                Expire follow-up
              </button>
              <button className="secondary-button danger-button" disabled={attritionBusy || !selectedAttritionParticipant} onClick={() => runAttritionAction("inactive")} type="button">
                Mark inactive for future rounds
              </button>
            </div>

            {attritionMessage ? <WarningBanner title="Attrition action recorded" risk="success">{attritionMessage}</WarningBanner> : null}
            {attritionError ? <WarningBanner title="Attrition action blocked" risk="warning">{humanizeBackendMessage(attritionError)}</WarningBanner> : null}

            <div className="review-stack">
              {participantStatuses.slice(0, 6).map((entry) => {
                const escalation = nonResponseEscalations.find((record) => record.participant_id === entry.participant_id);
                return (
                  <article className="review-row" key={entry.participant_id}>
                    <div>
                      <strong>{entry.participant_id.slice(0, 8)}</strong>
                      <p>Status timeline: {entry.timeline.map((step) => step.status.replaceAll("_", " ").toLowerCase()).join(" -> ")}</p>
                      {escalation ? <small>Follow-up state: {escalation.state.replaceAll("_", " ").toLowerCase()} {escalation.followup_window_ends_at ? `until ${new Date(escalation.followup_window_ends_at).toLocaleDateString()}` : ""}</small> : null}
                    </div>
                    <StatusBadge risk={entry.status === "ACTIVE" ? "success" : entry.status === "NON_RESPONSIVE_FLAGGED" ? "warning" : "locked"} label={entry.status.replaceAll("_", " ").toLowerCase()} />
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">SMS Round Notifications</span>
          <h2>Round-opening texts use opt-in consent, verified phones, and expiring secure links</h2>
        </div>
        {!canManageSms ? (
          <WarningBanner title="SMS settings restricted" risk="locked">
            SMS configuration is available to the Study Owner/Admin and Security/Privacy Lead.
          </WarningBanner>
        ) : !activeStudyId || !activeVersionId ? (
          <WarningBanner title="Open a backend study" risk="info">
            Open a saved study before configuring SMS notification policies.
          </WarningBanner>
        ) : (
          <>
            <WarningBanner title="Neutral SMS wording" risk="info">
              Texts say only that a round is open, provide a secure link, and remind participants that participation remains voluntary.
            </WarningBanner>
            {smsPolicy ? (
              <div className="form-grid">
                <label className="check-field">
                  <input checked={smsPolicy.sms_enabled} disabled={smsBusy} onChange={(event) => setSmsPolicy({ ...smsPolicy, sms_enabled: event.target.checked })} type="checkbox" />
                  <span>Permit SMS for this study</span>
                </label>
                <label className="field">
                  <span>Notification-safe study name</span>
                  <input disabled={smsBusy} onChange={(event) => setSmsPolicy({ ...smsPolicy, notification_safe_name: event.target.value })} placeholder="Example: Care Transitions Delphi" value={smsPolicy.notification_safe_name ?? ""} />
                </label>
                <label className="check-field">
                  <input checked={smsPolicy.safe_name_is_sensitive} disabled={smsBusy} onChange={(event) => setSmsPolicy({ ...smsPolicy, safe_name_is_sensitive: event.target.checked })} type="checkbox" />
                  <span>Use generic label because the study name is sensitive</span>
                </label>
                <label className="field">
                  <span>Magic link TTL minutes</span>
                  <input disabled={smsBusy} min={1} max={1440} onChange={(event) => setSmsPolicy({ ...smsPolicy, magic_link_ttl_minutes: Number(event.target.value) })} type="number" value={smsPolicy.magic_link_ttl_minutes} />
                </label>
              </div>
            ) : null}
            <div className="form-grid">
              <label className="field">
                <span>Participant</span>
                <select value={smsParticipantId} onChange={(event) => setSmsParticipantId(event.target.value)}>
                  {participantStatuses.map((entry) => (
                    <option key={entry.participant_id} value={entry.participant_id}>{entry.participant_id.slice(0, 8)} - {entry.status.replaceAll("_", " ").toLowerCase()}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Notification preference</span>
                <select value={smsPreferenceDraft} onChange={(event) => setSmsPreferenceDraft(event.target.value as ParticipantContactPreference["notification_preference"])}>
                  <option value="email_only">Email only</option>
                  <option value="sms_only">SMS only</option>
                  <option value="both">Email and SMS</option>
                  <option value="no_sms">No SMS / do not text</option>
                </select>
              </label>
              <label className="field">
                <span>Phone number</span>
                <input autoComplete="tel" disabled={smsBusy} onChange={(event) => setSmsPhoneDraft(event.target.value)} placeholder={smsPreference?.masked_phone ?? "+1 555 555 1234"} value={smsPhoneDraft} />
              </label>
              <label className="check-field">
                <input checked={smsConsentDraft} disabled={smsBusy} onChange={(event) => setSmsConsentDraft(event.target.checked)} type="checkbox" />
                <span>Participant has explicitly consented to receive study texts</span>
              </label>
              <label className="field">
                <span>OTP verification code</span>
                <input autoComplete="one-time-code" disabled={smsBusy || !smsChallenge} onChange={(event) => setSmsOtpDraft(event.target.value)} value={smsOtpDraft} />
              </label>
              <label className="field">
                <span>Round number for test send</span>
                <input min={1} max={4} onChange={(event) => setSmsRoundNumber(Number(event.target.value))} type="number" value={smsRoundNumber} />
              </label>
            </div>
            <div className="action-row compact-actions">
              <button className="secondary-button" disabled={smsBusy || !smsPolicy} onClick={saveSmsPolicy} type="button">Save SMS policy</button>
              <button className="secondary-button" disabled={smsBusy || !smsParticipantId} onClick={saveSmsPreference} type="button">Save preference</button>
              <button className="secondary-button" disabled={smsBusy || !smsParticipantId} onClick={startSmsVerification} type="button">Start phone verification</button>
              <button className="secondary-button" disabled={smsBusy || !smsChallenge || !smsOtpDraft.trim()} onClick={verifySmsPhone} type="button">Verify phone</button>
              <button className="primary-button" disabled={smsBusy || !smsPolicy?.sms_enabled} onClick={sendSmsForRound} type="button">Send round-open SMS</button>
            </div>
            {smsChallenge?.dev_otp ? <WarningBanner title="Development OTP" risk="info">Local development OTP: {smsChallenge.dev_otp}. Production builds do not expose OTP values.</WarningBanner> : null}
            {smsPreference ? <WarningBanner title="Masked phone display" risk={smsPreference.phone_verified_at ? "success" : "warning"}>{smsPreference.masked_phone ?? "No phone on file"}; preference {smsPreference.notification_preference.replaceAll("_", " ")}; verified {smsPreference.phone_verified_at ? "yes" : "no"}.</WarningBanner> : null}
            {smsMessage ? <WarningBanner title="SMS action recorded" risk="success">{smsMessage}</WarningBanner> : null}
            {smsError ? <WarningBanner title="SMS action blocked" risk="warning">{humanizeBackendMessage(smsError)}</WarningBanner> : null}
            <div className="review-stack">
              {smsNotifications.slice(0, 5).map((entry) => (
                <article className="review-row" key={entry.sms_notification_id}>
                  <div>
                    <strong>{entry.status.replaceAll("_", " ")}</strong>
                    <p>Participant {entry.participant_id.slice(0, 8)} for Round {entry.round_number}; provider {entry.provider}</p>
                    {entry.failure_code ? <small>Reason: {entry.failure_code}</small> : null}
                  </div>
                  <StatusBadge risk={entry.status === "sent" || entry.status === "delivered" ? "success" : entry.status === "skipped" ? "info" : "warning"} label={entry.status} />
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Role Assignment Review</span>
          <h2>Study membership is the backend source of truth</h2>
        </div>
        {!canManageAccess ? (
          <WarningBanner title="Access review restricted" risk="locked">
            Only Study Owners and Admins can manage study memberships from this console.
          </WarningBanner>
        ) : !activeStudyId ? (
          <WarningBanner title="Open a backend study" risk="info">
            Open or create a saved study to review and assign roles for that study.
          </WarningBanner>
        ) : (
          <>
            {accessMessage ? (
              <WarningBanner title="Access update" risk="success">
                {accessMessage}
              </WarningBanner>
            ) : null}
            {accessError ? (
              <WarningBanner title="Access update blocked" risk="danger">
                {humanizeBackendMessage(accessError)}
              </WarningBanner>
            ) : null}
            <div className="form-grid">
              <label className="field">
                <span>User</span>
                <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                  {users.map((user) => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.display_name} - {user.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Study role</span>
                <select
                  value={selectedStudyRole}
                  onChange={(event) => setSelectedStudyRole(event.target.value as StudyAssignment["role"])}
                >
                  <option value="Owner">Study Owner / PI</option>
                  <option value="MethodsSteward">Ethics & Methods Steward</option>
                  <option value="PrivacyLead">Security & Privacy Lead</option>
                  <option value="DataCustodian">Data Custodian</option>
                  <option value="Maintainer">Open Source Maintainer / Admin</option>
                </select>
              </label>
            </div>
            <div className="action-row">
              <button className="primary-button" disabled={accessBusy || !selectedUserId} onClick={assignRole} type="button">
                {accessBusy ? "Updating..." : "Assign or update role"}
              </button>
              <button className="secondary-button" disabled={accessBusy} onClick={loadAccessReview} type="button">
                Refresh review
              </button>
            </div>
            {roleConcentrations.length > 0 ? (
              <WarningBanner title="Multiple governance roles held by same user" risk="info">
                {roleConcentrations.map((entry) => {
                  const roles = entry.roles.map((assignmentRole) => studyRoleLabels[assignmentRole]).join(", ");
                  return `${userLabel(entry.userId)}: ${roles}`;
                }).join(" | ")}
              </WarningBanner>
            ) : null}
            <div className="assignment-list">
              {assignments.length === 0 ? (
                <WarningBanner title="No assignments yet" risk="warning">
                  Add at least a Study Owner and Ethics & Methods Steward before launch.
                </WarningBanner>
              ) : assignments.map((assignment) => (
                <article className="assignment-row" key={`${assignment.study_id}-${assignment.user_id}-${assignment.role}`}>
                  <div>
                    <strong>{userLabel(assignment.user_id)}</strong>
                    <small>{studyRoleLabels[assignment.role]} assigned {formatDateTime(assignment.created_at)}</small>
                  </div>
                  <button
                    className="secondary-button danger-button"
                    disabled={accessBusy || assignment.user_id === workflow.study?.created_by}
                    onClick={() => removeRole(assignment.user_id)}
                    type="button"
                  >
                    Remove user
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Persistence and Auth Roadmap</span>
          <h2>Next architecture move before multi-user studies</h2>
        </div>
        <div className="summary-grid">
          {[
            ["Database boundary", "Move file-store records into a relational model with migrations, backups, and tenant-aware study workspaces."],
            ["Real authentication", "Replace local role headers with sessions, participant tokens, passwordless links, and admin-managed roles."],
            ["Data separation", "Store identity, consent, responses, items, audit events, and exports in separately permissioned tables."],
            ["Export controls", "Make each export a persistent package with status, requester, approval state, hash, and download audit event."],
          ].map(([label, value]) => (
            <article className="summary-item" key={label}>
              <strong>{label}</strong>
              <p>{value}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default App;
