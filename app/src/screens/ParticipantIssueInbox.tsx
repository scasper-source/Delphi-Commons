/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { useState } from "react";
import type { ParticipantIssue } from "../core/api";
import { formatDateTime } from "../core/appUtils";
import { participantIssueTypeOptions } from "../content/participantCopy";
import { StatusBadge, WarningBanner } from "../components/ui/Primitives";

export function ParticipantIssueInbox({
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
          <p className="muted">Notes from "Having trouble?" appear here for quick PI/study-team response.</p>
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

export function ParticipantIssueInboxCard({
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
