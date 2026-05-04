/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { nanoid } from "nanoid";
import { JsonCollection } from "../core/jsonCollection.js";

export type ParticipantIssueType =
  | "button_or_textbox_not_working"
  | "cannot_start_or_continue"
  | "save_or_resume_problem"
  | "confusing_text"
  | "accessibility_problem"
  | "other";

export type ParticipantIssueStatus = "open" | "reviewed" | "closed";

export type ParticipantIssue = {
  issue_id: string;
  study_id: string;
  version_id: string;
  participant_id: string;
  participant_alias: string;
  round_number: number | null;
  page_context: string;
  issue_type: ParticipantIssueType;
  note: string;
  status: ParticipantIssueStatus;
  staff_response_note: string | null;
  reviewed_at: string | null;
  closed_at: string | null;
  responded_at: string | null;
  responded_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: "participant_invitation" | "magic_link" | "staff_preview";
};

const issues = new JsonCollection<ParticipantIssue>("participant_issues");

function aliasForParticipant(participantId: string): string {
  const compact = participantId.replace(/[^A-Za-z0-9]/g, "");
  return `participant-${compact.slice(-6) || "report"}`;
}

function issueType(value: unknown): ParticipantIssueType {
  return value === "button_or_textbox_not_working" ||
    value === "cannot_start_or_continue" ||
    value === "save_or_resume_problem" ||
    value === "confusing_text" ||
    value === "accessibility_problem" ||
    value === "other"
    ? value
    : "other";
}

function issueNote(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 1200) : "";
}

function pageContext(value: unknown): string {
  const text = typeof value === "string" ? value.trim() : "";
  return text ? text.slice(0, 200) : "participant_portal";
}

function roundNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function issueStatus(value: unknown): ParticipantIssueStatus {
  return value === "open" || value === "reviewed" || value === "closed" ? value : "reviewed";
}

function staffResponseNote(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim().slice(0, 1200) : "";
  return text || null;
}

export function createParticipantIssue(input: {
  study_id: string;
  version_id: string;
  participant_id: string;
  round_number?: unknown;
  page_context?: unknown;
  issue_type?: unknown;
  note?: unknown;
  created_by: ParticipantIssue["created_by"];
}): ParticipantIssue {
  const now = new Date().toISOString();
  const issue: ParticipantIssue = {
    issue_id: nanoid(),
    study_id: input.study_id,
    version_id: input.version_id,
    participant_id: input.participant_id,
    participant_alias: aliasForParticipant(input.participant_id),
    round_number: roundNumber(input.round_number),
    page_context: pageContext(input.page_context),
    issue_type: issueType(input.issue_type),
    note: issueNote(input.note),
    status: "open",
    staff_response_note: null,
    reviewed_at: null,
    closed_at: null,
    responded_at: null,
    responded_by_user_id: null,
    created_at: now,
    updated_at: now,
    created_by: input.created_by,
  };

  return issues.insert(issue.issue_id, issue);
}

export function listParticipantIssues(filter: { study_id: string; version_id: string }): ParticipantIssue[] {
  return issues
    .all()
    .filter((issue) => issue.study_id === filter.study_id && issue.version_id === filter.version_id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function listParticipantIssuesForParticipant(filter: {
  study_id: string;
  version_id: string;
  participant_id: string;
}): ParticipantIssue[] {
  return listParticipantIssues(filter)
    .filter((issue) => issue.participant_id === filter.participant_id);
}

export function updateParticipantIssue(input: {
  study_id: string;
  version_id: string;
  issue_id: string;
  status?: unknown;
  staff_response_note?: unknown;
  actor_user_id: string;
}): ParticipantIssue | null {
  const current = issues.get(input.issue_id);
  if (!current || current.study_id !== input.study_id || current.version_id !== input.version_id) return null;

  const now = new Date().toISOString();
  const nextStatus = input.status === undefined ? current.status : issueStatus(input.status);
  const nextResponse =
    input.staff_response_note === undefined
      ? current.staff_response_note
      : staffResponseNote(input.staff_response_note);

  return issues.set(input.issue_id, {
    ...current,
    status: nextStatus,
    staff_response_note: nextResponse,
    reviewed_at: current.reviewed_at ?? (nextStatus === "reviewed" || nextStatus === "closed" || nextResponse ? now : null),
    closed_at: nextStatus === "closed" ? current.closed_at ?? now : null,
    responded_at: nextResponse && nextResponse !== current.staff_response_note ? now : current.responded_at,
    responded_by_user_id: nextResponse && nextResponse !== current.staff_response_note ? input.actor_user_id : current.responded_by_user_id,
    updated_at: now,
  });
}
