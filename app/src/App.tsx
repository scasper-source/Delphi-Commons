import { useEffect, useMemo, useState } from "react";
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
  buildGovernanceSummary,
  defaultWizardState,
  normalizeWizardForMethod,
  validateWizardStep,
  wizardFromBackendPacket,
  wizardSteps,
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

const roleOrder: UserRole[] = [
  "study_owner",
  "ethics_methods_steward",
  "study_coordinator",
  "panelist",
  "data_custodian",
  "security_privacy_lead",
  "open_source_admin",
];

const statusLabels: Record<string, string> = {
  ReadyForReview: "Ready for review",
  NotOpen: "Not open",
  ReadyForSignoff: "Ready for signoff",
};

function formatStatus(value: string): string {
  return statusLabels[value] ?? value;
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

function responseOpenText(responseJson: unknown): string | null {
  if (typeof responseJson === "string" && responseJson.trim()) return responseJson.trim();
  if (!responseJson || typeof responseJson !== "object" || Array.isArray(responseJson)) return null;
  const record = responseJson as Record<string, unknown>;

  for (const key of ["text", "response_text", "open_text", "answer", "statement", "comment", "comments"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return null;
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
};

type RuntimeStudyData = {
  responses: ResponseRecord[];
  items: ItemRecord[];
  aiSuggestions: AISuggestionRecord[];
  roundTwoItems: RoundItemForParticipant[];
  roundReport: RoundReport | null;
  exportReport: RoundReport | null;
  loading: boolean;
  error: string | null;
  message: string | null;
};

type RatingDraft = Record<string, number>;

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
  prompt: "Please rate each candidate statement using the study rating scale.",
  participantInstructions:
    "Review each statement independently. Ratings should reflect your judgment for this study; no answer is treated as correct.",
  responseWindowDays: 7,
  reminderSubject: "Round 2 rating window is open",
  reminderBody:
    "This is a neutral reminder that Round 2 is open. Participation is voluntary, and you may respond within the study window.",
  controlledFeedbackEnabled: true,
};

const emptyRuntimeStudyData: RuntimeStudyData = {
  responses: [],
  items: [],
  aiSuggestions: [],
  roundTwoItems: [],
  roundReport: null,
  exportReport: null,
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
  const [participantConsentChecked, setParticipantConsentChecked] = useState(false);
  const [participantMessage, setParticipantMessage] = useState<string | null>(null);
  const [participantError, setParticipantError] = useState<string | null>(null);
  const [participantBusy, setParticipantBusy] = useState(false);
  const [runtimeData, setRuntimeData] = useState<RuntimeStudyData>(emptyRuntimeStudyData);
  const [runtimeActionBusy, setRuntimeActionBusy] = useState<string | null>(null);
  const [roundTwoRatings, setRoundTwoRatings] = useState<RatingDraft>({});
  const [savedStudies, setSavedStudies] = useState<SavedStudyRecord[]>([]);
  const [savedStudiesLoading, setSavedStudiesLoading] = useState(false);
  const [savedStudiesError, setSavedStudiesError] = useState<string | null>(null);
  const studyApi = useMemo(() => createStudyApi(mockStudies), []);
  const accessibleModules = moduleRegistry.filter((module) => canAccessModule(role, module));
  const selectedStudy = mockStudy;
  const activeTitle = workflow.study?.title ?? selectedStudy.title;
  const activeStatus = workflow.version?.status ?? selectedStudy.status;
  const consensusLocked = Boolean(workflow.version?.consensus_rule_json ?? selectedStudy.consensusRule.locked);

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
    if (workflow.study && workflow.version) {
      void loadRoundConfigs(workflow.study.id, workflow.version.id);
      void loadRuntimeData(workflow.study.id, workflow.version.id);
    } else {
      setRoundConfigs([]);
      setRuntimeData(emptyRuntimeStudyData);
      setRoundTwoRatings({});
    }
  }, [role, workflow.study?.id, workflow.version?.id]);

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
      return;
    }

    setRuntimeData((current) => ({ ...current, loading: true, error: null }));

    try {
      const canReadStaffData = role !== "panelist";
      const [responsesResult, itemsResult, suggestionsResult, roundTwoResult, reportResult, exportResult] =
        await Promise.allSettled([
          canReadStaffData ? conductorApi.listResponses(studyId, versionId, role) : Promise.resolve({ responses: [] }),
          canReadStaffData ? conductorApi.listItems(studyId, versionId, role) : Promise.resolve({ items: [] }),
          canReadStaffData ? conductorApi.listAiSuggestions(studyId, versionId, role) : Promise.resolve({ suggestions: [] }),
          conductorApi.listRoundItems(studyId, versionId, 2, "demo-panelist-001", role),
          canReadStaffData ? conductorApi.getRoundReport(studyId, versionId, 2, role) : Promise.resolve({ report: null }),
          canReadStaffData ? conductorApi.exportReport(studyId, versionId, role) : Promise.resolve({ report: null }),
        ]);

      setRuntimeData((current) => ({
        ...current,
        responses: responsesResult.status === "fulfilled" ? responsesResult.value.responses : [],
        items: itemsResult.status === "fulfilled" ? itemsResult.value.items : [],
        aiSuggestions: suggestionsResult.status === "fulfilled" ? suggestionsResult.value.suggestions : [],
        roundTwoItems: roundTwoResult.status === "fulfilled" ? roundTwoResult.value.items : [],
        roundReport: reportResult.status === "fulfilled" ? reportResult.value.report : null,
        exportReport: exportResult.status === "fulfilled" ? exportResult.value.report : null,
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
        status: workflow.version.opened_round1_at ? "Open" : "Ready",
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
    if (!workflow.study || !workflow.version) {
      setRoundActionError("Save and activate the study before configuring Round 2.");
      return;
    }

    setRoundActionBusy("save-r2");
    setRoundActionError(null);
    setRoundActionMessage(null);

    try {
      const result = await conductorApi.saveRoundConfig(workflow.study.id, workflow.version.id, 2, role, {
        task_type: "rating",
        title: roundTwoSetup.title,
        prompt: roundTwoSetup.prompt,
        participant_instructions: roundTwoSetup.participantInstructions,
        response_window_days: roundTwoSetup.responseWindowDays,
        reminder_subject: roundTwoSetup.reminderSubject,
        reminder_body: roundTwoSetup.reminderBody,
        controlled_feedback_enabled: roundTwoSetup.controlledFeedbackEnabled,
        ai_curation_enabled: false,
        status: "Ready",
      });

      setRoundConfigs((current) => [
        ...current.filter((config) => config.round_number !== 2),
        result.round_config,
      ]);
      setRoundActionMessage("Round 2 participant task configured.");
    } catch (error) {
      setRoundActionError(error instanceof Error ? error.message : "Unable to save Round 2 setup.");
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
      const result = action === "open"
        ? await conductorApi.openRound(workflow.study.id, workflow.version.id, roundNumber, role)
        : await conductorApi.closeRound(workflow.study.id, workflow.version.id, roundNumber, role);

      setRoundConfigs((current) => [
        ...current.filter((config) => config.round_number !== roundNumber),
        result.round_config,
      ]);
      setRoundActionMessage(`Round ${roundNumber} ${action === "open" ? "opened" : "closed"}.`);
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRoundActionError(error instanceof Error ? error.message : `Unable to ${action} Round ${roundNumber}.`);
    } finally {
      setRoundActionBusy(null);
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

    if (!participantResponseText.trim()) {
      setParticipantError("Round 1 response text is required.");
      return;
    }

    setParticipantBusy(true);
    setParticipantError(null);
    setParticipantMessage(null);

    try {
      const participantId = "demo-panelist-001";
      await conductorApi.recordConsent(workflow.study.id, workflow.version.id, participantId, "panelist");
      await conductorApi.submitRoundOneResponse(
        workflow.study.id,
        workflow.version.id,
        participantId,
        "panelist",
        participantResponseText.trim(),
      );
      setParticipantMessage("Round 1 response submitted.");
      setParticipantResponseText("");
      void loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setParticipantError(error instanceof Error ? error.message : "Unable to submit Round 1 response.");
    } finally {
      setParticipantBusy(false);
    }
  }

  async function createManualItemFromResponse(response: ResponseRecord) {
    if (!workflow.study || !workflow.version) return;
    const text = responseOpenText(response.response_json);
    if (!text) {
      setRuntimeData((current) => ({ ...current, error: "The selected response does not contain open text.", message: null }));
      return;
    }

    setRuntimeActionBusy(`manual-${response.response_id}`);
    try {
      await conductorApi.createItem(workflow.study.id, workflow.version.id, role, {
        text,
        round_number: 2,
        provenance_type: "PanelDerived",
        provenance_links: [{
          source_type: "response",
          source_id: response.response_id,
          source_round_number: 1,
          excerpt: excerpt(text),
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
    if (!workflow.study || !workflow.version) return;

    setRuntimeActionBusy("synthesize-r2");
    try {
      await conductorApi.synthesizeInterRound(workflow.study.id, workflow.version.id, role, 2);
      setRuntimeMessage("AI Suggestion (Not Final) created from Round 1 responses.");
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setRuntimeError(error, "Unable to synthesize Round 2 candidates.");
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

  function updateRoundTwoRating(itemId: string, rating: number) {
    setRoundTwoRatings((current) => ({ ...current, [itemId]: rating }));
  }

  async function submitRoundTwoRatings() {
    if (!workflow.study || !workflow.version) {
      setParticipantError("No active study version is selected.");
      return;
    }

    const participantId = "demo-panelist-001";
    const missing = runtimeData.roundTwoItems.some((item) => !roundTwoRatings[item.item_id]);
    if (missing) {
      setParticipantError("A rating is required for each available Round 2 item.");
      return;
    }

    setParticipantBusy(true);
    setParticipantError(null);
    setParticipantMessage(null);

    try {
      await conductorApi.recordConsent(workflow.study.id, workflow.version.id, participantId, "panelist");
      for (const item of runtimeData.roundTwoItems) {
        await conductorApi.submitRating(
          workflow.study.id,
          workflow.version.id,
          2,
          participantId,
          item.item_id,
          "panelist",
          roundTwoRatings[item.item_id] ?? 0,
        );
      }
      setParticipantMessage("Round 2 ratings submitted.");
      setRoundTwoRatings({});
      await loadRuntimeData(workflow.study.id, workflow.version.id);
    } catch (error) {
      setParticipantError(error instanceof Error ? error.message : "Unable to submit Round 2 ratings.");
    } finally {
      setParticipantBusy(false);
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

      const result = await conductorApi.openRoundOne(workflow.study.id, workflow.version.id, role);
      setWorkflow((current) => ({
        ...current,
        version: result.studyVersion,
        busyStep: null,
        lastMessage: "Round 1 opened.",
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
    : accessibleModules[0]?.id ?? "participant";

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Application modules">
        <div className="brand-block">
          <span className="brand-mark">eD</span>
          <div>
            <strong>eDelphi</strong>
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
          {accessibleModules.map((module) => (
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
          participantConsentChecked={participantConsentChecked}
          participantMessage={participantMessage}
          participantError={participantError}
          participantBusy={participantBusy}
          runtimeData={runtimeData}
          runtimeActionBusy={runtimeActionBusy}
          roundTwoRatings={roundTwoRatings}
          activeWizardStep={activeWizardStep}
          onWizardChange={setWizard}
          onWizardStepChange={setActiveWizardStep}
          onWorkflowStep={runWorkflowStep}
          onRoundOneSetupChange={setRoundOneSetup}
          onRoundTwoSetupChange={setRoundTwoSetup}
          onSaveRoundOneSetup={saveRoundOneConfiguration}
          onSaveRoundTwoSetup={saveRoundTwoConfiguration}
          onTransitionRound={transitionRound}
          onParticipantResponseChange={setParticipantResponseText}
          onParticipantConsentChange={setParticipantConsentChecked}
          onSubmitParticipantRoundOne={submitParticipantRoundOne}
          onRefreshRuntimeData={loadRuntimeData}
          onCreateManualItemFromResponse={createManualItemFromResponse}
          onSynthesizeRoundTwoCandidates={synthesizeRoundTwoCandidates}
          onAcceptSuggestion={acceptSuggestion}
          onMaterializeSuggestion={materializeSuggestion}
          onSignoffSuggestionRelease={signoffSuggestionRelease}
          onPublishItem={publishItem}
          onRoundTwoRatingChange={updateRoundTwoRating}
          onSubmitRoundTwoRatings={submitRoundTwoRatings}
          savedStudies={savedStudies}
          savedStudiesLoading={savedStudiesLoading}
          savedStudiesError={savedStudiesError}
          onRefreshSavedStudies={loadSavedStudies}
          onOpenSavedStudy={openSavedStudy}
          onArchiveSavedStudy={archiveSavedStudy}
        />
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
  participantConsentChecked,
  participantMessage,
  participantError,
  participantBusy,
  runtimeData,
  runtimeActionBusy,
  roundTwoRatings,
  activeWizardStep,
  onWizardChange,
  onWizardStepChange,
  onWorkflowStep,
  onRoundOneSetupChange,
  onRoundTwoSetupChange,
  onSaveRoundOneSetup,
  onSaveRoundTwoSetup,
  onTransitionRound,
  onParticipantResponseChange,
  onParticipantConsentChange,
  onSubmitParticipantRoundOne,
  onRefreshRuntimeData,
  onCreateManualItemFromResponse,
  onSynthesizeRoundTwoCandidates,
  onAcceptSuggestion,
  onMaterializeSuggestion,
  onSignoffSuggestionRelease,
  onPublishItem,
  onRoundTwoRatingChange,
  onSubmitRoundTwoRatings,
  savedStudies,
  savedStudiesLoading,
  savedStudiesError,
  onRefreshSavedStudies,
  onOpenSavedStudy,
  onArchiveSavedStudy,
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
  participantConsentChecked: boolean;
  participantMessage: string | null;
  participantError: string | null;
  participantBusy: boolean;
  runtimeData: RuntimeStudyData;
  runtimeActionBusy: string | null;
  roundTwoRatings: RatingDraft;
  activeWizardStep: StudyWizardStepId;
  onWizardChange: (state: StudyWizardState) => void;
  onWizardStepChange: (step: StudyWizardStepId) => void;
  onWorkflowStep: (step: WorkflowStep) => void;
  onRoundOneSetupChange: (state: RoundOneSetupState) => void;
  onRoundTwoSetupChange: (state: RoundTwoSetupState) => void;
  onSaveRoundOneSetup: () => void;
  onSaveRoundTwoSetup: () => void;
  onTransitionRound: (roundNumber: number, action: "open" | "close") => void;
  onParticipantResponseChange: (value: string) => void;
  onParticipantConsentChange: (value: boolean) => void;
  onSubmitParticipantRoundOne: () => void;
  onRefreshRuntimeData: () => void;
  onCreateManualItemFromResponse: (response: ResponseRecord) => void;
  onSynthesizeRoundTwoCandidates: () => void;
  onAcceptSuggestion: (suggestion: AISuggestionRecord) => void;
  onMaterializeSuggestion: (suggestion: AISuggestionRecord) => void;
  onSignoffSuggestionRelease: (suggestion: AISuggestionRecord) => void;
  onPublishItem: (item: ItemRecord) => void;
  onRoundTwoRatingChange: (itemId: string, rating: number) => void;
  onSubmitRoundTwoRatings: () => void;
  savedStudies: SavedStudyRecord[];
  savedStudiesLoading: boolean;
  savedStudiesError: string | null;
  onRefreshSavedStudies: () => void;
  onOpenSavedStudy: (record: SavedStudyRecord) => void;
  onArchiveSavedStudy: (record: SavedStudyRecord) => void;
}) {
  switch (activeModule) {
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
          savedStudies={savedStudies}
          savedStudiesLoading={savedStudiesLoading}
          savedStudiesError={savedStudiesError}
          onRefreshSavedStudies={onRefreshSavedStudies}
          onOpenSavedStudy={onOpenSavedStudy}
          onArchiveSavedStudy={onArchiveSavedStudy}
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
          onAcceptSuggestion={onAcceptSuggestion}
          onMaterializeSuggestion={onMaterializeSuggestion}
          onSignoffSuggestionRelease={onSignoffSuggestionRelease}
          onPublishItem={onPublishItem}
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
          participantConsentChecked={participantConsentChecked}
          participantMessage={participantMessage}
          participantError={participantError}
          participantBusy={participantBusy}
          runtimeData={runtimeData}
          roundTwoRatings={roundTwoRatings}
          onParticipantResponseChange={onParticipantResponseChange}
          onParticipantConsentChange={onParticipantConsentChange}
          onSubmitParticipantRoundOne={onSubmitParticipantRoundOne}
          onRoundTwoRatingChange={onRoundTwoRatingChange}
          onSubmitRoundTwoRatings={onSubmitRoundTwoRatings}
        />
      );
    case "reporting":
      return <ReportingScreen study={study} role={role} workflow={workflow} runtimeData={runtimeData} />;
    case "audit":
      return <AuditScreen study={study} />;
    case "admin-security":
      return <AdminSecurityScreen role={role} />;
  }
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

function hasSignoff(workflow: ConductorWorkflow, requiredRole: BackendSignoff["required_role"]): boolean {
  return workflow.signoffs.some((signoff) => signoff.required_role === requiredRole);
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

function DashboardScreen({
  study,
  role,
  workflow,
  savedStudies,
  savedStudiesLoading,
  savedStudiesError,
  onRefreshSavedStudies,
  onOpenSavedStudy,
  onArchiveSavedStudy,
}: {
  study: StudyRecord;
  role: UserRole;
  workflow: ConductorWorkflow;
  savedStudies: SavedStudyRecord[];
  savedStudiesLoading: boolean;
  savedStudiesError: string | null;
  onRefreshSavedStudies: () => void;
  onOpenSavedStudy: (record: SavedStudyRecord) => void;
  onArchiveSavedStudy: (record: SavedStudyRecord) => void;
}) {
  const launchBlockers = evaluateLaunchGate(study);
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
        </div>

        {savedStudiesError ? (
          <WarningBanner title="Unable to load saved studies" risk="danger">
            {savedStudiesError}
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

  function updateWizard(patch: Partial<StudyWizardState>) {
    onWizardChange({ ...wizard, ...patch });
  }

  function updateMethod(studyFormat: StudyWizardState["studyFormat"]) {
    onWizardChange(normalizeWizardForMethod({ ...wizard, studyFormat }));
  }

  function moveWizard(delta: number) {
    const nextStep = wizardSteps[Math.min(Math.max(activeIndex + delta, 0), wizardSteps.length - 1)];
    onWizardStepChange(nextStep.id);
  }

  return (
    <div className="wizard-layout">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Study Builder</span>
          <h2>Design the study once, then carry it into governance and launch</h2>
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
            {workflow.error}
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
    </div>
  );
}

function WizardStepFields({
  step,
  wizard,
  selectedMethodLabel,
  onChange,
  onMethodChange,
}: {
  step: StudyWizardStepId;
  wizard: StudyWizardState;
  selectedMethodLabel: string;
  onChange: (patch: Partial<StudyWizardState>) => void;
  onMethodChange: (studyFormat: StudyWizardState["studyFormat"]) => void;
}) {
  if (step === "purpose") {
    return (
      <div className="form-grid">
        <label className="field wide-field">
          <span>Study title</span>
          <input value={wizard.title} onChange={(event) => onChange({ title: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Short description</span>
          <textarea value={wizard.description} onChange={(event) => onChange({ description: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Research question</span>
          <textarea value={wizard.researchQuestion} onChange={(event) => onChange({ researchQuestion: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Objective</span>
          <textarea value={wizard.objective} onChange={(event) => onChange({ objective: event.target.value })} />
        </label>
        <label className="field wide-field">
          <span>Why Delphi is suitable</span>
          <textarea value={wizard.delphiSuitability} onChange={(event) => onChange({ delphiSuitability: event.target.value })} />
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
          <input min={50} max={100} type="number" value={wizard.consensusThreshold} onChange={(event) => onChange({ consensusThreshold: Number(event.target.value) })} />
        </label>
        <label className="field">
          <span>Agreement minimum rating</span>
          <input min={1} max={9} type="number" value={wizard.agreementMinRating} onChange={(event) => onChange({ agreementMinRating: Number(event.target.value) })} />
        </label>
        <WarningBanner title="Locked before launch" risk="locked">
          Consensus rules are predefined before Round 1 and locked against mid-study changes.
        </WarningBanner>
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
          {workflow.error}
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
      label: "Consensus threshold locked before launch",
      detail: `${wizard.consensusThreshold}% agreement at rating ${wizard.agreementMinRating}+.`,
      complete: thresholdLocked,
      risk: "locked",
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
          value={`${wizard.consensusThreshold}% agreement at rating ${wizard.agreementMinRating}+`}
          locked={Boolean(workflow.version?.consensus_rule_json)}
        />
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
  onTransitionRound: (roundNumber: number, action: "open" | "close") => void;
}) {
  const plannedRounds = buildPlannedRounds(wizard, workflow);
  const savedRoundOne = roundConfigs.find((config) => config.round_number === 1);
  const savedRoundTwo = roundConfigs.find((config) => config.round_number === 2);
  const publishedRoundTwoCount = runtimeData.items.filter((item) => item.round_number === 2 && item.status === "Published").length;

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
          {plannedRounds.map((round) => (
            <article className="round-card" key={round.roundNumber}>
              <div className="split-line">
                <strong>Round {round.roundNumber}</strong>
                <StatusBadge
                  risk={roundStatusRisk(roundConfigs.find((config) => config.round_number === round.roundNumber)?.status ?? round.status)}
                  label={formatStatus(roundConfigs.find((config) => config.round_number === round.roundNumber)?.status ?? round.status)}
                />
              </div>
              <h3>{round.label}</h3>
              <DataBar value={round.responseRate} label="Response rate" />
              <DataBar value={round.attritionRate} label="Attrition" />
              <small>{round.mode === "open-ended" ? "Open-ended response collection" : "Structured rating task"}</small>
              {round.blocker ? (
                <WarningBanner title="Blocker">{round.blocker}</WarningBanner>
              ) : null}
              {roundConfigs.find((config) => config.round_number === round.roundNumber) ? (
                <div className="candidate-actions">
                  <button
                    className="secondary-button"
                    disabled={roundActionBusy === `open-${round.roundNumber}`}
                    onClick={() => onTransitionRound(round.roundNumber, "open")}
                    type="button"
                  >
                    Open
                  </button>
                  <button
                    className="secondary-button"
                    disabled={roundActionBusy === `close-${round.roundNumber}`}
                    onClick={() => onTransitionRound(round.roundNumber, "close")}
                    type="button"
                  >
                    Close
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Round 1 Setup</span>
          <h2>Open-ended prompt, participant instructions, window, and reminders</h2>
        </div>

        {roundActionError ? (
          <WarningBanner title="Round setup not saved" risk="danger">
            {roundActionError}
          </WarningBanner>
        ) : null}
        {roundActionMessage ? (
          <WarningBanner title="Round setup saved" risk="success">
            {roundActionMessage}
          </WarningBanner>
        ) : null}

        <div className="form-grid">
          <label className="field">
            <span>Round title</span>
            <input value={roundOneSetup.title} onChange={(event) => updateRoundOne({ title: event.target.value })} />
          </label>
          <label className="field">
            <span>Response window days</span>
            <input
              min={1}
              max={60}
              type="number"
              value={roundOneSetup.responseWindowDays}
              onChange={(event) => updateRoundOne({ responseWindowDays: Number(event.target.value) })}
            />
          </label>
          <label className="field wide-field">
            <span>Open-ended prompt</span>
            <textarea value={roundOneSetup.prompt} onChange={(event) => updateRoundOne({ prompt: event.target.value })} />
          </label>
          <label className="field wide-field">
            <span>Participant instructions</span>
            <textarea
              value={roundOneSetup.participantInstructions}
              onChange={(event) => updateRoundOne({ participantInstructions: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Reminder subject</span>
            <input
              value={roundOneSetup.reminderSubject}
              onChange={(event) => updateRoundOne({ reminderSubject: event.target.value })}
            />
          </label>
          <label className="field">
            <span>Reminder body</span>
            <textarea value={roundOneSetup.reminderBody} onChange={(event) => updateRoundOne({ reminderBody: event.target.value })} />
          </label>
          <label className="check-field wide-field">
            <input
              checked={roundOneSetup.aiCurationEnabled}
              onChange={(event) => updateRoundOne({ aiCurationEnabled: event.target.checked })}
              type="checkbox"
            />
            <span>Enable AI-assisted curation draft hooks after Round 1 closes. Human review remains required.</span>
          </label>
        </div>

        <div className="wizard-actions">
          <StatusBadge risk={savedRoundOne ? "success" : "warning"} label={savedRoundOne ? "Round 1 configured" : "Draft setup"} />
          <button className="primary-button" disabled={roundActionBusy === "save-r1"} onClick={onSaveRoundOneSetup} type="button">
            {roundActionBusy === "save-r1" ? "Saving..." : "Save Round 1 setup"}
          </button>
        </div>
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Round 2 Setup</span>
          <h2>Structured rating task, controlled feedback, and release readiness</h2>
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
        </div>
        <div className="wizard-actions">
          <StatusBadge risk={savedRoundTwo ? "success" : "warning"} label={savedRoundTwo ? "Round 2 configured" : "Draft setup"} />
          <button className="primary-button" disabled={roundActionBusy === "save-r2"} onClick={onSaveRoundTwoSetup} type="button">
            {roundActionBusy === "save-r2" ? "Saving..." : "Save Round 2 setup"}
          </button>
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
  onAcceptSuggestion,
  onMaterializeSuggestion,
  onSignoffSuggestionRelease,
  onPublishItem,
}: {
  study: StudyRecord;
  workflow: ConductorWorkflow;
  runtimeData: RuntimeStudyData;
  runtimeActionBusy: string | null;
  onRefreshRuntimeData: () => void;
  onCreateManualItemFromResponse: (response: ResponseRecord) => void;
  onSynthesizeRoundTwoCandidates: () => void;
  onAcceptSuggestion: (suggestion: AISuggestionRecord) => void;
  onMaterializeSuggestion: (suggestion: AISuggestionRecord) => void;
  onSignoffSuggestionRelease: (suggestion: AISuggestionRecord) => void;
  onPublishItem: (item: ItemRecord) => void;
}) {
  const hasBackendStudy = Boolean(workflow.study && workflow.version);
  const openResponses = runtimeData.responses.filter((response) => responseOpenText(response.response_json));
  const roundTwoItems = runtimeData.items.filter((item) => item.round_number === 2);
  const interRoundSuggestions = runtimeData.aiSuggestions.filter((suggestion) => suggestion.feature === "inter_round_synthesis");

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
            {runtimeData.error}
          </WarningBanner>
        ) : null}
        {runtimeData.message ? (
          <WarningBanner title="Curation updated" risk="success">
            {runtimeData.message}
          </WarningBanner>
        ) : null}
        {openResponses.length === 0 ? (
          <WarningBanner title="No Round 1 responses yet" risk="info">
            Round 1 participant responses will appear here after consent and submission.
          </WarningBanner>
        ) : null}
        {openResponses.map((response) => {
          const text = responseOpenText(response.response_json) ?? "";

          return (
            <article className="response-snippet" key={response.response_id}>
              <div className="split-line">
                <StatusBadge risk="info" label="Round 1" />
                <small>{shortId(response.response_id)}</small>
              </div>
              <p>{text}</p>
              <button
                className="secondary-button"
                disabled={runtimeActionBusy === `manual-${response.response_id}`}
                onClick={() => onCreateManualItemFromResponse(response)}
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
            disabled={runtimeActionBusy === "synthesize-r2" || openResponses.length === 0}
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
        {roundTwoItems.map((item) => (
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
              disabled={item.status === "Published" || runtimeActionBusy === `publish-${item.item_id}`}
              onClick={() => onPublishItem(item)}
              type="button"
            >
              Publish for Round 2
            </button>
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

function ParticipantScreen({
  workflow,
  wizard,
  roundConfigs,
  participantResponseText,
  participantConsentChecked,
  participantMessage,
  participantError,
  participantBusy,
  runtimeData,
  roundTwoRatings,
  onParticipantResponseChange,
  onParticipantConsentChange,
  onSubmitParticipantRoundOne,
  onRoundTwoRatingChange,
  onSubmitRoundTwoRatings,
}: {
  workflow: ConductorWorkflow;
  wizard: StudyWizardState;
  roundConfigs: RoundConfig[];
  participantResponseText: string;
  participantConsentChecked: boolean;
  participantMessage: string | null;
  participantError: string | null;
  participantBusy: boolean;
  runtimeData: RuntimeStudyData;
  roundTwoRatings: RatingDraft;
  onParticipantResponseChange: (value: string) => void;
  onParticipantConsentChange: (value: boolean) => void;
  onSubmitParticipantRoundOne: () => void;
  onRoundTwoRatingChange: (itemId: string, rating: number) => void;
  onSubmitRoundTwoRatings: () => void;
}) {
  const roundOneConfig = roundConfigs.find((config) => config.round_number === 1);
  const roundOneOpen = roundOneConfig?.status === "Open";
  const roundTwoOpen = roundConfigs.find((config) => config.round_number === 2)?.status === "Open";
  const hasBackendStudy = Boolean(workflow.version);
  const hasRoundTwoTask = roundTwoOpen && runtimeData.roundTwoItems.length > 0;
  const currentTaskLabel = hasRoundTwoTask
      ? "Round 2: structured rating"
    : roundOneOpen
      ? roundOneConfig?.title ?? "Round 1: open-ended elicitation"
    : "No round task is currently open";

  return (
    <div className="participant-flow">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Participant Portal</span>
          <h2>Consent, confidentiality, rights, and current task</h2>
        </div>
        <WarningBanner title="Confidentiality">
          Responses are confidential to research team members with approved access and are linked across rounds through participant IDs.
        </WarningBanner>
      </section>

      <section className="panel">
        <h3>Your Current Round</h3>
        <p>{currentTaskLabel}</p>
        {!hasBackendStudy ? (
          <WarningBanner title="No active study selected" risk="info">
            Open a backend study workspace to show participant tasks.
          </WarningBanner>
        ) : null}
        {participantError ? (
          <WarningBanner title="Submission blocked" risk="danger">
            {participantError}
          </WarningBanner>
        ) : null}
        {participantMessage ? (
          <WarningBanner title="Submitted" risk="success">
            {participantMessage}
          </WarningBanner>
        ) : null}
        {hasRoundTwoTask ? (
          <>
            <WarningBanner title="Controlled feedback" risk="info">
              Review each candidate statement independently. You may retain or revise your response in later rounds if controlled feedback is available.
            </WarningBanner>
            <div className="rating-task-list">
              {runtimeData.roundTwoItems.map((item) => (
                <article className="rating-task" key={item.item_id}>
                  <p>{item.text}</p>
                  {item.your_prior_response ? (
                    <small>Your prior response: {item.your_prior_response.rating}, {item.your_prior_response.action}</small>
                  ) : null}
                  <label className="field">
                    <span>Rating 1-9</span>
                    <input
                      min={1}
                      max={9}
                      type="number"
                      value={roundTwoRatings[item.item_id] ?? ""}
                      onChange={(event) => onRoundTwoRatingChange(item.item_id, Number(event.target.value))}
                    />
                  </label>
                </article>
              ))}
            </div>
            <div className="action-row">
              <button className="primary-button" disabled={participantBusy} onClick={onSubmitRoundTwoRatings} type="button">
                {participantBusy ? "Submitting..." : "Submit Round 2 ratings"}
              </button>
            </div>
          </>
        ) : roundOneOpen && roundOneConfig ? (
          <>
            <WarningBanner title="Confidential to research team" risk="info">
              {wizard.confidentialityStatement}
            </WarningBanner>
            <p className="callout-text">{roundOneConfig.participant_instructions}</p>
            <label className="field wide-field">
              <span>{roundOneConfig.prompt}</span>
              <textarea
                value={participantResponseText}
                onChange={(event) => onParticipantResponseChange(event.target.value)}
              />
            </label>
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
            <DataBar value={0} label="Your task progress" />
            <div className="action-row">
              <button className="primary-button" disabled={participantBusy} onClick={onSubmitParticipantRoundOne} type="button">
                {participantBusy ? "Submitting..." : "Submit Round 1 response"}
              </button>
            </div>
          </>
        ) : (
          <WarningBanner title="Waiting for study team" risk="info">
            The next task will appear here when the research team opens the round and configures the participant task.
          </WarningBanner>
        )}
      </section>

      <section className="panel">
        <h3>Study Time Commitment</h3>
        <p>
          This study is planned for up to {wizard.plannedRoundCount} rounds. You will only see rounds that are open for your participation.
        </p>
        <StatusBadge risk="info" label={wizard.studyFormat === "ClassicDelphi" ? "Classic Delphi" : "Modified Delphi"} />
      </section>

      <section className="panel">
        <h3>Participant Rights</h3>
        <ul className="plain-list">
          <li>Participation is voluntary.</li>
          <li>You may withdraw from future participation.</li>
          <li>You may skip items where permitted by the study protocol.</li>
          <li>AI assistance, if offered, is optional and non-directive.</li>
        </ul>
      </section>
    </div>
  );
}

function ReportingScreen({
  study,
  role,
  workflow,
  runtimeData,
}: {
  study: StudyRecord;
  role: UserRole;
  workflow: ConductorWorkflow;
  runtimeData: RuntimeStudyData;
}) {
  const realReport = runtimeData.roundReport ?? runtimeData.exportReport;
  const realItems = realReport?.items ?? [];
  const reportSafe = reportIncludesNonConsensus(study.report);
  const threshold = realItems.find((item) => item.consensus.threshold_percent !== null)?.consensus.threshold_percent
    ?? study.report.thresholdUsed;
  const attrition = realReport
    ? 0
    : study.report.attritionRate;
  const hasRealStudy = Boolean(workflow.study && workflow.version);

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
        {outputModelRegistry.map((output) => {
          const permitted = canExportOutput(role, output);

          return (
            <article className="output-row" key={output.id}>
              <div>
                <strong>{output.label}</strong>
                <small>{output.sections.slice(0, 2).join(" + ")}</small>
              </div>
              <StatusBadge risk={permitted ? "success" : "locked"} label={permitted ? "Permitted" : "Restricted"} />
            </article>
          );
        })}
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

function AdminSecurityScreen({ role }: { role: UserRole }) {
  const identityDecision = identityAccessDecision(role, "Review data subject withdrawal request");

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
        <h3>Security Console Placeholders</h3>
        <ul className="plain-list">
          <li>Role management and access reviews</li>
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
    </div>
  );
}

export default App;
