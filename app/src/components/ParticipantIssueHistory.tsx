/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type { ParticipantIssue } from "../core/api";
import { formatDateTime } from "../core/appUtils";
import { participantIssueTypeOptions } from "../content/participantCopy";
import { StatusBadge, WarningBanner } from "../components/ui/Primitives";

export function ParticipantIssueHistory({ issues }: { issues: ParticipantIssue[] }) {
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
