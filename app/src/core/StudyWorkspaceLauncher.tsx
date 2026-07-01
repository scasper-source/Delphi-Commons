/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type { SavedStudyRecord } from "./api";
import type { ConductorWorkflow } from "./appTypes";
import { formatStatus, formatDateTime, shortId, packetText } from "./appUtils";
import type { ModuleId, UserRole } from "./types";
import { StatusBadge, WarningBanner } from "../components/ui/Primitives";

type WorkspacePath = "main-menu" | "new-study" | "current-studies" | "past-studies";
type LauncherRoleMode = "separate_steward" | "solo_internal";

const studyWorkspacePathOptions: Array<{
  id: WorkspacePath;
  label: string;
  detail: string;
}> = [
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

function isCurrentStudyRecord(record: SavedStudyRecord): boolean {
  if (record.study.archived_at) return false;
  const status = record.latestVersion?.status;
  return !status || status === "Draft" || status === "ReadyForSignoff" || status === "Active";
}

function isPastStudyRecord(record: SavedStudyRecord): boolean {
  if (record.study.archived_at) return false;
  const status = record.latestVersion?.status;
  return status === "Closed";
}

export function StudyWorkspaceLauncher({
  path,
  role,
  workflow,
  draftTitle,
  draftDescription,
  roleMode,
  createBusy,
  savedStudies,
  savedStudiesLoading,
  onPathChange,
  onDraftTitleChange,
  onDraftDescriptionChange,
  onRoleModeChange,
  onCreateSavedWorkspace,
  onRefreshSavedStudies,
  onOpenCurrentStudy,
  onOpenPastStudy,
}: {
  path: WorkspacePath;
  role: UserRole;
  workflow: ConductorWorkflow;
  draftTitle: string;
  draftDescription: string;
  roleMode: LauncherRoleMode;
  createBusy: boolean;
  savedStudies: SavedStudyRecord[];
  savedStudiesLoading: boolean;
  onPathChange: (path: WorkspacePath) => void;
  onDraftTitleChange: (value: string) => void;
  onDraftDescriptionChange: (value: string) => void;
  onRoleModeChange: (mode: LauncherRoleMode) => void;
  onCreateSavedWorkspace: () => void;
  onRefreshSavedStudies: () => void;
  onOpenCurrentStudy: (record: SavedStudyRecord) => void;
  onOpenPastStudy: (record: SavedStudyRecord, target: ModuleId) => void;
}) {
  const currentStudies = savedStudies.filter(isCurrentStudyRecord);
  const pastStudies = savedStudies.filter(isPastStudyRecord);
  const titleMissing = draftTitle.trim().length === 0;
  const saveBlocked = role !== "study_owner" || titleMissing || createBusy;
  const saveState = role !== "study_owner" ? "Save blocked" : "Unsaved draft";
  const saveRisk: "success" | "warning" | "locked" = saveState === "Save blocked" ? "locked" : "warning";

  function savedStudyTitle(record: SavedStudyRecord) {
    return packetText(record.latestVersion?.study_design_packet_json, "title") ?? record.study.title;
  }

  function savedStudyDescription(record: SavedStudyRecord) {
    return packetText(record.latestVersion?.study_design_packet_json, "description") ??
      record.study.description ??
      "No description provided.";
  }

  function renderStudyList(records: SavedStudyRecord[], mode: "current" | "past") {
    if (records.length === 0 && !savedStudiesLoading) {
      return (
        <WarningBanner title={mode === "current" ? "No current studies" : "No past studies for writing up"} risk="info">
          {mode === "current"
            ? "Create a saved workspace from New Study, then return here to reopen it."
            : "Closed or writing-up studies remain visible here until they are deliberately archived."}
        </WarningBanner>
      );
    }

    return (
      <div className="saved-study-list">
        {records.map((record) => {
          const latest = record.latestVersion;
          const status = latest ? formatStatus(latest.status) : "No version";
          const isCurrentStudy = record.study.id === workflow.study?.id;
          const hasSavedPacket = Boolean(latest?.study_design_packet_json);
          const savedTimestamp = latest?.updated_at ?? latest?.created_at ?? record.study.updated_at ?? record.study.created_at;

          return (
            <article className={isCurrentStudy ? "saved-study-row current" : "saved-study-row"} key={record.study.id}>
              <div>
                <div className="saved-study-title">
                  <strong>{savedStudyTitle(record)}</strong>
                  {isCurrentStudy ? <StatusBadge risk="info" label="Selected study" /> : null}
                </div>
                <p>{savedStudyDescription(record)}</p>
                <small>
                  {latest ? "Version saved" : "Study created"} {formatDateTime(savedTimestamp)} - ID {shortId(record.study.id)} - {latest ? `Version ${latest.version_number}` : "No versions"}
                </small>
              </div>
              <div className="saved-study-actions">
                <StatusBadge risk={latest?.status === "Active" ? "success" : latest?.status === "Closed" ? "info" : "warning"} label={status} />
                <StatusBadge risk={hasSavedPacket ? "success" : "locked"} label={hasSavedPacket ? "Design saved" : "No design packet"} />
                {mode === "current" ? (
                  <button className="primary-button" onClick={() => onOpenCurrentStudy(record)} type="button">
                    Open dashboard
                  </button>
                ) : (
                  <>
                    <button className="primary-button" onClick={() => onOpenPastStudy(record, "reporting")} type="button">
                      Open reporting
                    </button>
                    <button className="secondary-button" onClick={() => onOpenPastStudy(record, "closeout")} type="button">
                      Review closeout
                    </button>
                    <button className="secondary-button" onClick={() => onOpenPastStudy(record, "dashboard")} type="button">
                      Open dashboard context
                    </button>
                  </>
                )}
              </div>
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div className="launcher-shell">
      <section className="launcher-hero">
        <div>
          <span className="eyebrow">{path === "main-menu" ? "Main Menu" : "Study Workspace Launcher"}</span>
          <h1>{path === "main-menu" ? "Delphi Commons" : "Choose the study work before opening the dashboard"}</h1>
          {path === "main-menu" ? (
            <p>
              Delphi Commons is a governed eDelphi research workspace for designing studies, managing accountable study roles, collecting
              panel input, and preserving the evidence needed for review, reporting, and closeout.
            </p>
          ) : (
            <p>
              Start a saved study workspace, reopen current work, or return to closed studies for writing, reporting, and evidence review.
            </p>
          )}
        </div>
        <StatusBadge
          risk={path === "new-study" ? saveRisk : "info"}
          label={path === "new-study" ? saveState : path === "main-menu" ? "Main menu" : "Select a study"}
        />
      </section>

      {path === "main-menu" ? (
        <section className="panel wide launcher-panel" aria-label="Getting started guide">
          <h2>Get started in three steps</h2>
          <div className="workflow-steps">
            <article className="workflow-step">
              <span className="workflow-index">1</span>
              <div>
                <strong>Create a study</strong>
                <p>Give your Delphi study a title and description, then design it with the guided 9-step Study Builder.</p>
              </div>
              <button className="primary-button" onClick={() => onPathChange("new-study")} type="button">
                New Study
              </button>
            </article>
            <article className="workflow-step">
              <span className="workflow-index">2</span>
              <div>
                <strong>Invite your panel</strong>
                <p>Add participants by email or share a magic link. Panelists join from any phone or laptop browser.</p>
              </div>
              <StatusBadge risk="info" label="After study creation" />
            </article>
            <article className="workflow-step">
              <span className="workflow-index">3</span>
              <div>
                <strong>Launch Round 1</strong>
                <p>Open the first round for responses, then curate, rate, and iterate toward consensus.</p>
              </div>
              <StatusBadge risk="info" label="After panel setup" />
            </article>
          </div>
        </section>
      ) : null}

      {path !== "main-menu" ? (
        <section className="launcher-path-tabs" aria-label="Study workspace path selector">
          {studyWorkspacePathOptions.map((entry) => (
            <button
              className={`launcher-path-tab path-${entry.id} ${path === entry.id ? "active" : ""}`}
              key={entry.id}
              onClick={() => onPathChange(entry.id)}
              type="button"
            >
              <strong>{entry.label}</strong>
              <small>{entry.detail}</small>
            </button>
          ))}
        </section>
      ) : null}

      {path === "new-study" ? (
        <section className="panel wide launcher-panel">
          <div className="split-line">
            <div>
              <h2>New Study</h2>
              <p className="muted">This begins as an unsaved draft. Create a saved backend workspace before you build the study.</p>
            </div>
            <StatusBadge risk={saveRisk} label={saveState} />
          </div>

          <div className="form-grid">
            <label className="field wide-field">
              <span>Study title</span>
              <input value={draftTitle} onChange={(event) => onDraftTitleChange(event.target.value)} />
            </label>
            <label className="field wide-field">
              <span>Purpose / description</span>
              <textarea value={draftDescription} onChange={(event) => onDraftDescriptionChange(event.target.value)} />
            </label>
          </div>

          <section className="launcher-role-box" aria-label="New study role setup">
            <div>
              <h3>Role setup</h3>
              <p>
                Study Owner / PI and Ethics & Methods Steward remain distinct charter roles. Backend membership and signoff gates still enforce launch authority.
              </p>
            </div>
            <label className="check-field">
              <input
                checked={roleMode === "separate_steward"}
                onChange={() => onRoleModeChange("separate_steward")}
                type="radio"
              />
              <span>I will assign a separate Ethics & Methods Steward after creating the workspace.</span>
            </label>
            <label className="check-field">
              <input
                checked={roleMode === "solo_internal"}
                onChange={() => onRoleModeChange("solo_internal")}
                type="radio"
              />
              <span>Solo internal/synthetic setup for now; one person may hold roles only for demo or local testing.</span>
            </label>
          </section>

          <WarningBanner title={roleMode === "solo_internal" ? "Solo internal setup only" : "Independent stewardship required"} risk={roleMode === "solo_internal" ? "warning" : "info"}>
            {roleMode === "solo_internal"
              ? "A separate Ethics & Methods Steward is recommended and required before human-use readiness. Solo setup must remain internal synthetic/demo work."
              : "Assign the Ethics & Methods Steward in Admin / Security before governance signoff. UI selection does not replace backend authorization."}
          </WarningBanner>

          {titleMissing ? (
            <WarningBanner title="Study title required" risk="warning">
              Add a study title before creating the saved workspace.
            </WarningBanner>
          ) : null}
          <div className="action-row">
            <button className="primary-button" disabled={saveBlocked} onClick={onCreateSavedWorkspace} type="button">
              {createBusy ? "Creating..." : "Create saved study workspace"}
            </button>
            <button className="secondary-button" onClick={() => onPathChange("current-studies")} type="button">
              View Current Studies
            </button>
          </div>
        </section>
      ) : null}

      {path === "current-studies" ? (
        <section className="panel wide launcher-panel">
          <div className="split-line">
            <div>
              <h2>Current Studies</h2>
              <p className="muted">Draft, active, and ready-for-signoff studies open into the selected-study dashboard.</p>
            </div>
            <button className="secondary-button" onClick={onRefreshSavedStudies} type="button">
              {savedStudiesLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {renderStudyList(currentStudies, "current")}
        </section>
      ) : null}

      {path === "past-studies" ? (
        <section className="panel wide launcher-panel">
          <div className="split-line">
            <div>
              <h2>Past Studies / Writing Up</h2>
              <p className="muted">Closed and writing-up studies stay available for reporting, exports, closeout, and audit review until archived.</p>
            </div>
            <button className="secondary-button" onClick={onRefreshSavedStudies} type="button">
              {savedStudiesLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <WarningBanner title="Writing up is not archive" risk="info">
            Archive hides a study from ordinary lists while preserving records. Writing-up studies should remain visible here until the team deliberately archives them.
          </WarningBanner>
          {renderStudyList(pastStudies, "past")}
        </section>
      ) : null}
    </div>
  );
}
