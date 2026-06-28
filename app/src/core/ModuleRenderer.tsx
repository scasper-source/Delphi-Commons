/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type {
  AISuggestionRecord,
  FinalResultSnapshot,
  ItemRecord,
  MagicRoundEntryContext,
  ParticipantFinalResponse,
  ParticipantInvitationContext,
  ParticipantIssue,
  ParticipantIssueInput,
  ResponseRecord,
  RoundConfig,
  RoundItemForParticipant,
  SavedStudyRecord,
} from "./api";
import type {
  ConductorWorkflow,
  RatingDraft,
  RationaleDraft,
  RoundOneResponseEntry,
  RoundOneSetupState,
  RoundTwoSetupState,
  RuntimeStudyData,
  WorkflowStep,
} from "./appTypes";
import type { ModuleId, StudyRecord, UserRole } from "./types";
import type { StudyWizardState, StudyWizardStepId } from "./studyWizard";
import { AboutScreen } from "../screens/AboutScreen";
import { ArchitectureScreen } from "../screens/ArchitectureScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import { StudyBuilderScreen } from "../screens/StudyBuilderScreen";
import { GovernanceScreen } from "../screens/GovernanceScreen";
import { RoundManagerScreen } from "../screens/RoundManagerScreen";
import { CurationScreen } from "../screens/CurationScreen";
import { FeedbackScreen } from "../screens/FeedbackScreen";
import { ParticipantScreen } from "../screens/ParticipantScreen";
import { FinalResultsCloseoutScreen } from "../screens/FinalResultsCloseoutScreen";
import { GlossaryScreen } from "../screens/GlossaryScreen";
import { ReportingScreen } from "../screens/ReportingScreen";
import { AuditScreen } from "../screens/AuditScreen";
import { AdminSecurityScreen } from "../screens/AdminSecurityScreen";

export function ModuleRenderer({
  activeModule,
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
  onStartNewStudyDraft,
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
  onStartNewStudyDraft: () => void;
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
          runtimeActionBusy={runtimeActionBusy}
          savedStudies={savedStudies}
          savedStudiesLoading={savedStudiesLoading}
          savedStudiesError={savedStudiesError}
          onRefreshSavedStudies={onRefreshSavedStudies}
          onOpenSavedStudy={onOpenSavedStudy}
          onStartNewStudyDraft={onStartNewStudyDraft}
          onArchiveSavedStudy={onArchiveSavedStudy}
          onArchiveSmokeTestStudies={onArchiveSmokeTestStudies}
          onRespondParticipantIssue={onRespondParticipantIssue}
        />
      );
    case "study-builder":
      return (
        <StudyBuilderScreen
          activeWizardStep={activeWizardStep}
          onWizardChange={onWizardChange}
          onWizardStepChange={onWizardStepChange}
          onWorkflowStep={onWorkflowStep}
          onStartNewStudyDraft={onStartNewStudyDraft}
        />
      );
    case "governance":
      return <GovernanceScreen onWorkflowStep={onWorkflowStep} />;
    case "round-manager":
      return (
        <RoundManagerScreen
          roundOneSetup={roundOneSetup}
          roundTwoSetup={roundTwoSetup}
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
          runtimeActionBusy={runtimeActionBusy}
          onExportOutput={onExportOutput}
          onSelectExportPackage={onSelectExportPackage}
          onReviewExportPackage={onReviewExportPackage}
          onDownloadExportPackageFile={onDownloadExportPackageFile}
        />
      );
    case "audit":
      return <AuditScreen />;
    case "admin-security":
      return <AdminSecurityScreen />;
  }
}
