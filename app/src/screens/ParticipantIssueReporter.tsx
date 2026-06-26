/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { useState } from "react";
import type { ParticipantIssueInput, ParticipantIssueType } from "../core/api";
import { participantCopy, participantIssueTypeOptions } from "../content/participantCopy";

export function ParticipantIssueReporter({
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
