/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  conductorApi,
  createStudyApi,
  apiBoundary,
  type AISuggestionRecord,
  type ItemRecord,
  type ResponseRecord,
  type RoundConfig,
  type RoundItemForParticipant,
  type SavedStudyRecord,
  type ParticipantInvitationContext,
  type ExportPackage,
  type FinalResultSnapshot,
  type ParticipantFinalResponse,
  type SmsSetupStatus,
  type MagicRoundEntryContext,
  type ParticipantIssueInput,
  type ParticipantIssue,
} from "./core/api";
import {
  type ConductorWorkflow,
  type RatingDraft,
  type RationaleDraft,
  type RoundOneResponseEntry,
  type RoundOneSetupState,
  type RoundTwoSetupState,
  type RuntimeStudyData,
  type NextAction,
  type WorkflowStep,
  roleOrder,
  DEMO_PARTICIPANT_ID,
  initialWorkflow,
  defaultRoundOneSetup,
  defaultRoundTwoSetup,
  emptyRuntimeStudyData,
} from "./core/appTypes";
import {
  formatStatus,
  excerpt,
  downloadPackageFile,
  participantInviteTokenFromLocation,
  magicTokenFromLocation,
  fallbackResearchQuestion,
  questionLabel,
  roundOneQuestions,
  responseOpenText,
  firstRoundOneAnswerText,
  roundOneAnswerInputs,
  roundOneAnswersFromPayload,
} from "./core/appUtils";
import { AppProvider } from "./core/AppContext";
import { SmsSetupPrompt } from "./core/SmsSetupPrompt";
import { StudyWorkspaceLauncher } from "./core/StudyWorkspaceLauncher";
import { ModuleRenderer } from "./core/ModuleRenderer";
import { buildNextAction, NextActionPanel } from "./core/workflowHelpers";
import { mockStudies, mockStudy } from "./core/mockData";
import { canAccessModule, roleLabels } from "./core/permissions";
import type { ModuleId, UserRole } from "./core/types";
import { moduleRegistry } from "./modules/registry";
import { outputModelRegistry } from "./outputModels/registry";
import {
  defaultWizardState,
  normalizeWizardResearchQuestions,
  wizardFromBackendPacket,
  type StudyWizardState,
  type StudyWizardStepId,
} from "./core/studyWizard";
import { StatusBadge } from "./components/ui/Primitives";
import { participantCopy } from "./content/participantCopy";

type SmsSetupChoice = "undecided" | "off" | "twilio";
type WorkspacePath = "main-menu" | "new-study" | "current-studies" | "past-studies";
type LauncherRoleMode = "separate_steward" | "solo_internal";

const workspacePathOptions: Array<{
  id: WorkspacePath;
  label: string;
  detail: string;
}> = [
  {
    id: "main-menu",
    label: "Main Menu",
    detail: "What Delphi Commons supports.",
  },
  {
    id: "new-study",
    label: "New Study",
    detail: "Create a saved workspace.",
  },
  {
    id: "current-studies",
    label: "Current Studies",
    detail: "Open active setup or launch work.",
  },
  {
    id: "past-studies",
    label: "Past Studies / Writing Up",
    detail: "Report, export, and review closed work.",
  },
];



function App() {
  const [role, setRole] = useState<UserRole>("study_owner");
  const [activeModule, setActiveModule] = useState<ModuleId>("dashboard");
  const [workspaceLauncherOpen, setWorkspaceLauncherOpen] = useState(true);
  const [workspacePath, setWorkspacePath] = useState<WorkspacePath>("main-menu");
  const [workflow, setWorkflow] = useState<ConductorWorkflow>(initialWorkflow);
  const [wizard, setWizard] = useState<StudyWizardState>(defaultWizardState);
  const [launcherDraftTitle, setLauncherDraftTitle] = useState(defaultWizardState.title);
  const [launcherDraftDescription, setLauncherDraftDescription] = useState(defaultWizardState.description);
  const [launcherRoleMode, setLauncherRoleMode] = useState<LauncherRoleMode>("separate_steward");
  const [launcherCreateBusy, setLauncherCreateBusy] = useState(false);
  const [launcherCreateError, setLauncherCreateError] = useState<string | null>(null);
  const [launcherCreateMessage, setLauncherCreateMessage] = useState<string | null>(null);
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
  const [smsSetupChoice, setSmsSetupChoice] = useState<SmsSetupChoice>("undecided");
  const [smsSetupStatus, setSmsSetupStatus] = useState<SmsSetupStatus | null>(null);
  const [smsSetupError, setSmsSetupError] = useState<string | null>(null);
  const [smsSetupBusy, setSmsSetupBusy] = useState(false);
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
  const canSeeSmsSetup = role === "study_owner" || role === "security_privacy_lead" || role === "open_source_admin";
  const showSmsSetupPrompt = canSeeSmsSetup && smsSetupChoice === "undecided" && !participantInviteToken && !magicToken;

  async function loadSmsSetupStatus() {
    if (!canSeeSmsSetup) return;
    setSmsSetupBusy(true);
    setSmsSetupError(null);
    try {
      const result = await conductorApi.getSmsSetupStatus(role);
      setSmsSetupStatus(result.setup);
    } catch (error) {
      setSmsSetupError(error instanceof Error ? error.message : "Unable to load SMS setup status.");
    } finally {
      setSmsSetupBusy(false);
    }
  }

  function chooseSmsSetup(choice: SmsSetupChoice) {
    setSmsSetupChoice(choice);
    if (choice === "twilio") {
      setActiveModule("admin-security");
      void loadSmsSetupStatus();
    }
  }

  useEffect(() => {
    if (canSeeSmsSetup && smsSetupChoice === "twilio") {
      void loadSmsSetupStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, smsSetupChoice]);

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
    // Loading is keyed by role; loadSavedStudies is kept as a local helper for callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Runtime refresh is keyed by the active study/version identity and entry-token mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, workflow.study?.id, workflow.version?.id, participantInviteToken, magicToken]);

  function openSavedStudy(record: SavedStudyRecord, targetModule?: ModuleId) {
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
    setWorkspaceLauncherOpen(false);
    setActiveModule(targetModule ?? (record.latestVersion ? "study-builder" : "dashboard"));
    if (record.latestVersion) {
      void loadRoundConfigs(record.study.id, record.latestVersion.id);
      void loadRuntimeData(record.study.id, record.latestVersion.id);
    }
  }

  function startNewStudyDraft() {
    const confirmed = window.confirm(
      "Start a new study draft?\n\nSaved studies remain available from Current Studies; unsaved changes in the current draft will be cleared.",
    );
    if (!confirmed) return;

    setWorkflow({
      ...initialWorkflow,
      lastMessage: "Started a new unsaved study draft.",
    });
    setWizard(defaultWizardState);
    setActiveWizardStep("purpose");
    setRoundConfigs([]);
    setRuntimeData(emptyRuntimeStudyData);
    setRoundTwoRatings({});
    setRoundTwoRationales({});
    setFinalResultSnapshot(null);
    setFinalResultBlockers(["final_result_snapshot_missing"]);
    setFinalResultMessage(null);
    setFinalResultError(null);
    setLauncherDraftTitle(defaultWizardState.title);
    setLauncherDraftDescription(defaultWizardState.description);
    setLauncherRoleMode("separate_steward");
    setLauncherCreateError(null);
    setLauncherCreateMessage(null);
    setWorkspacePath("new-study");
    setWorkspaceLauncherOpen(true);
    setActiveModule("dashboard");
  }

  function resetLauncherNewStudyDraft() {
    setLauncherDraftTitle(defaultWizardState.title);
    setLauncherDraftDescription(defaultWizardState.description);
    setLauncherRoleMode("separate_steward");
    setLauncherCreateError(null);
    setLauncherCreateMessage(null);
  }

  function openWorkspaceLauncherPath(nextPath: WorkspacePath) {
    if (nextPath === "new-study" && (workspacePath !== "new-study" || !workspaceLauncherOpen || launcherCreateMessage)) {
      resetLauncherNewStudyDraft();
    }
    setWorkspacePath(nextPath);
    setWorkspaceLauncherOpen(true);
    setActiveModule("dashboard");
  }

  async function createSavedStudyWorkspaceFromLauncher() {
    const title = launcherDraftTitle.trim();
    const description = launcherDraftDescription.trim();
    if (!title) {
      setLauncherCreateError("study_title_required");
      return;
    }
    if (role !== "study_owner") {
      setLauncherCreateError("forbidden");
      return;
    }

    const nextWizard = normalizeWizardResearchQuestions({
      ...defaultWizardState,
      title,
      description,
    });
    setLauncherCreateBusy(true);
    setLauncherCreateError(null);
    setLauncherCreateMessage(null);

    try {
      const created = await conductorApi.createStudy(role, nextWizard);
      const version = await conductorApi.createVersion(created.study.id, role);
      const savedPacket = await conductorApi.saveWizardPacket(created.study.id, version.studyVersion.id, role, nextWizard);
      setWizard(nextWizard);
      setWorkflow({
        study: { ...created.study, title, description },
        version: savedPacket.studyVersion,
        signoffs: [],
        busyStep: null,
        lastMessage: launcherRoleMode === "solo_internal"
          ? "Saved workspace created for internal synthetic setup. Assign a separate Ethics & Methods Steward before any human-use readiness claim."
          : "Saved workspace created. Assign the Ethics & Methods Steward before governance signoff.",
        error: null,
      });
      setActiveWizardStep("purpose");
      setRoundConfigs([]);
      setRuntimeData(emptyRuntimeStudyData);
      setRoundTwoRatings({});
      setRoundTwoRationales({});
      setFinalResultSnapshot(null);
      setFinalResultBlockers(["final_result_snapshot_missing"]);
      setFinalResultMessage(null);
      setFinalResultError(null);
      setWorkspaceLauncherOpen(false);
      setActiveModule("study-builder");
      setLauncherCreateMessage("Saved workspace created and listed under Current Studies.");
      await loadSavedStudies();
    } catch (error) {
      setLauncherCreateError(error instanceof Error ? error.message : "Unable to create saved study workspace.");
    } finally {
      setLauncherCreateBusy(false);
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
  const participantEntryActive = role === "panelist" || Boolean(participantInviteToken || magicToken);
  const referenceModuleSelected = visibleModule === "about" || visibleModule === "glossary";
  const suppressStudyOperatingChrome = !participantEntryActive && workspaceLauncherOpen;
  const showStudyWorkspaceLauncher = suppressStudyOperatingChrome && !referenceModuleSelected;

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

  const appContextValue = useMemo(
    () => ({
      role,
      setRole,
      activeModule,
      setActiveModule,
      study: selectedStudy,
      workflow,
      wizard,
      runtimeData,
      roundConfigs,
      consensusLocked,
    }),
    [role, activeModule, selectedStudy, workflow, wizard, runtimeData, roundConfigs, consensusLocked],
  );

  return (
    <AppProvider value={appContextValue}>
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

        {!participantEntryActive ? (
          <nav className="workspace-path-nav" aria-label="Study workspace paths">
            <span className="sidebar-section-label">Study workspace</span>
            {workspacePathOptions.map((entry) => (
              <button
                className={`workspace-path-button path-${entry.id} ${workspacePath === entry.id && workspaceLauncherOpen ? "active" : ""}`}
                key={entry.id}
                onClick={() => openWorkspaceLauncherPath(entry.id)}
                type="button"
              >
                <strong>{entry.label}</strong>
                <small>{entry.detail}</small>
              </button>
            ))}
          </nav>
        ) : null}

        {!workspaceLauncherOpen || participantEntryActive ? (
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
        ) : null}
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

        {!suppressStudyOperatingChrome ? (
          <>
            <header className="topbar">
              <div>
                <span className="eyebrow">Active study</span>
                <h1>{activeTitle}</h1>
              </div>
              <div className="topbar-actions">
                <StatusBadge risk={activeStatus === "Active" ? "success" : "warning"} label={formatStatus(activeStatus)} />
                <StatusBadge risk={consensusLocked ? "locked" : "warning"} label={consensusLocked ? "Consensus threshold locked" : "Consensus threshold draft"} />
                {!participantEntryActive ? (
                  <button
                    className="secondary-button"
                    onClick={() => openWorkspaceLauncherPath("main-menu")}
                    type="button"
                  >
                    Main Menu
                  </button>
                ) : null}
              </div>
            </header>

            <NextActionPanel nextAction={nextAction} onNavigate={setActiveModule} onRunCommand={runNextActionCommand} />
          </>
        ) : null}

        {showSmsSetupPrompt && !suppressStudyOperatingChrome ? (
          <SmsSetupPrompt
            setup={smsSetupStatus}
            busy={smsSetupBusy}
            error={smsSetupError}
            onKeepOff={() => chooseSmsSetup("off")}
            onUseSms={() => chooseSmsSetup("twilio")}
            onRefresh={loadSmsSetupStatus}
          />
        ) : null}

        {showStudyWorkspaceLauncher ? (
          <StudyWorkspaceLauncher
            path={workspacePath}
            role={role}
            workflow={workflow}
            draftTitle={launcherDraftTitle}
            draftDescription={launcherDraftDescription}
            roleMode={launcherRoleMode}
            createBusy={launcherCreateBusy}
            createError={launcherCreateError}
            createMessage={launcherCreateMessage}
            savedStudies={savedStudies}
            savedStudiesLoading={savedStudiesLoading}
            savedStudiesError={savedStudiesError}
            onPathChange={openWorkspaceLauncherPath}
            onDraftTitleChange={setLauncherDraftTitle}
            onDraftDescriptionChange={setLauncherDraftDescription}
            onRoleModeChange={setLauncherRoleMode}
            onCreateSavedWorkspace={createSavedStudyWorkspaceFromLauncher}
            onRefreshSavedStudies={loadSavedStudies}
            onOpenCurrentStudy={(record) => openSavedStudy(record, "dashboard")}
            onOpenPastStudy={(record, target) => openSavedStudy(record, target)}
          />
        ) : (
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
          onStartNewStudyDraft={startNewStudyDraft}
          onArchiveSavedStudy={archiveSavedStudy}
          onArchiveSmokeTestStudies={archiveSmokeTestStudies}
          onRespondParticipantIssue={respondParticipantIssue}
        />
        )}
        <footer className="app-footer">
          <button className="footer-link" onClick={navigateToCitation} type="button">
            Cite this tool
          </button>
        </footer>
      </section>
    </main>
    </AppProvider>
  );
}


export default App;
