/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type {
  MagicRoundEntryContext,
  ParticipantIssue,
  ParticipantIssueInput,
  RoundItemForParticipant,
} from "../core/api";
import type { RatingDraft, RationaleDraft } from "../core/appTypes";
import { ratingScaleOptions } from "../core/appTypes";
import { fallbackResearchQuestion, questionLabel } from "../core/appUtils";
import { WarningBanner } from "../components/ui/Primitives";
import { ProgressIndicator } from "../components/ProgressIndicator";
import { ParticipantIssueReporter } from "./ParticipantIssueReporter";
import { ParticipantIssueHistory } from "../components/ParticipantIssueHistory";
import { ControlledFeedbackCard } from "./ParticipantScreen";

export function MagicRoundEntryScreen({
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
