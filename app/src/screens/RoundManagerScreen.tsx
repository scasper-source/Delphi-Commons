/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type { RoundConfig } from "../core/api";
import type {
  ConductorWorkflow,
  RoundOneSetupState,
  RoundTwoSetupState,
  RuntimeStudyData,
} from "../core/appTypes";
import { formatStatus, humanizeBackendMessage } from "../core/appUtils";
import type { StudyWizardState } from "../core/studyWizard";
import { DataBar, StatCard, StatusBadge, WarningBanner } from "../components/ui/Primitives";

export type PlannedRound = {
  roundNumber: number;
  label: string;
  mode: "open-ended" | "rating";
  status: string;
  responseRate: number;
  attritionRate: number;
  blocker?: string;
};

// eslint-disable-next-line react-refresh/only-export-components
export function buildPlannedRounds(wizard: StudyWizardState, workflow: ConductorWorkflow): PlannedRound[] {
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

// eslint-disable-next-line react-refresh/only-export-components
export function roundStatusRisk(status: string): "success" | "warning" | "info" | "locked" {
  if (status === "Open") return "success";
  if (status === "Ready to open") return "warning";
  if (status === "Blocked") return "locked";
  return "info";
}

export function RoundManagerScreen({
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
