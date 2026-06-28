/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type {
  MagicRoundEntryContext,
  ParticipantInvitationContext,
  ParticipantIssueInput,
  RoundItemForParticipant,
} from "../core/api";
import type {
  RatingDraft,
  RationaleDraft,
} from "../core/appTypes";
import {
  defaultRoundTwoSetup,
  legacyVagueRatingPrompt,
  ratingScaleOptions,
} from "../core/appTypes";
import {
  formatRatingChoice,
  questionLabel,
  roundOneQuestions,
  shortId,
} from "../core/appUtils";
import { useAppContext } from "../core/AppContext";
import {
  DataBar,
  StatusBadge,
  WarningBanner,
} from "../components/ui/Primitives";
import { InlineHelp } from "../components/InlineHelp";
import { SaveStatusIndicator } from "../components/SaveStatusIndicator";
import { ProgressIndicator } from "../components/ProgressIndicator";
import { ParticipantOrientationPanel } from "./ParticipantOrientationPanel";
import { ParticipantIssueReporter } from "./ParticipantIssueReporter";
import { ParticipantIssueHistory } from "../components/ParticipantIssueHistory";
import { MagicRoundEntryScreen } from "./MagicRoundEntryScreen";
import {
  consensusReminder,
  inlineHelp,
  roundReminder,
} from "../content/orientation";
import { participantCopy } from "../content/participantCopy";

export function ParticipantScreen({
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
  participantBusy,
  participantInvite,
  magicContext,
  magicItems,
  magicResponseText,
  magicRoundOneAnswers,
  magicRatings,
  magicRationales,
  magicLoadFailed,
  magicBusy,
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
  participantBusy: boolean;
  participantInvite: ParticipantInvitationContext | null;
  magicContext: MagicRoundEntryContext | null;
  magicItems: RoundItemForParticipant[];
  magicResponseText: string;
  magicRoundOneAnswers: Record<string, string>;
  magicRatings: RatingDraft;
  magicRationales: RationaleDraft;
  magicLoadFailed: boolean;
  magicBusy: boolean;
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
  const { workflow, wizard, roundConfigs, runtimeData } = useAppContext();

  if (magicContext || magicLoadFailed) {
    return (
      <MagicRoundEntryScreen
        context={magicContext}
        items={magicItems}
        responseText={magicResponseText}
        roundOneAnswers={magicRoundOneAnswers}
        ratings={magicRatings}
        rationales={magicRationales}
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

export function RoundContextPanel({ roundNumber }: { roundNumber: number }) {
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

export function ControlledFeedbackCard({ item }: { item: RoundItemForParticipant }) {
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
