/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type { ParticipantIssue, RoundConfig, SavedStudyRecord } from "../core/api";
import type { ConductorWorkflow, RuntimeStudyData, WorkflowStep } from "../core/appTypes";
import { formatDateTime, formatStatus, humanizeBackendMessage, packetText, shortId } from "../core/appUtils";
import { roleLabels } from "../core/permissions";
import type { StudyRecord, UserRole } from "../core/types";
import { evaluateLaunchGate } from "../policies/governance";
import { buildActionableChecklist, workflowStepDone } from "../core/workflowHelpers";
import { DataBar, StatCard, StatusBadge, WarningBanner } from "../components/ui/Primitives";

import { ParticipantIssueInbox } from "./ParticipantIssueInbox";

export function DashboardScreen({
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
  onStartNewStudyDraft,
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
  onStartNewStudyDraft: () => void;
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
          <div className="compact-actions">
            {role === "study_owner" ? (
              <button className="primary-button" onClick={onStartNewStudyDraft} type="button">
                Start new study
              </button>
            ) : null}
            <button className="secondary-button" onClick={onRefreshSavedStudies} type="button">
              {savedStudiesLoading ? "Refreshing..." : "Refresh"}
            </button>
            <button className="secondary-button danger-button" onClick={onArchiveSmokeTestStudies} type="button">
              Archive test workspaces
            </button>
          </div>
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
