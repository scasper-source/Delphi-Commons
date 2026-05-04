import crypto from "node:crypto";
import { JsonCollection } from "../core/jsonCollection.js";

export type ParticipantStatus =
  | "ACTIVE"
  | "NON_RESPONSIVE_FLAGGED"
  | "WITHDRAWN_PARTICIPANT"
  | "WITHDRAWN_PI"
  | "COMPLETED";

export type ParticipantStatusTimelineEntry = {
  status: ParticipantStatus;
  at: string;
  actor_user_id: string;
  reason: string;
  round_number: number | null;
};

export type ParticipantEnrollment = {
  enrollment_id: string;
  study_id: string;
  version_id: string;
  participant_id: string;
  status: ParticipantStatus;
  inactive_from_round_number: number | null;
  withdrawal_type: "participant" | "pi" | null;
  withdrawal_reason_code: string | null;
  withdrawal_note: string | null;
  withdrawn_at: string | null;
  status_updated_at: string;
  created_at: string;
  created_by_user_id: string;
  timeline: ParticipantStatusTimelineEntry[];
};

export type NonResponsePolicy = {
  policy_id: string;
  study_id: string;
  version_id: string;
  version_number: number;
  missed_current_round_deadline: boolean;
  no_activity_days_threshold: number | null;
  incomplete_submission_counts_as_non_response: boolean;
  follow_up_window_days: number;
  final_notice_enabled: boolean;
  auto_progression_enabled: boolean;
  attrition_warning_threshold_percent: number;
  created_at: string;
  updated_at: string;
  changed_by_user_id: string;
};

export type NonResponseEscalationState =
  | "FLAGGED"
  | "REMINDER_QUEUED"
  | "FOLLOWUP_STARTED"
  | "FINAL_NOTICE_QUEUED"
  | "FOLLOWUP_EXPIRED"
  | "MARKED_INACTIVE";

export type NonResponseEscalation = {
  escalation_id: string;
  study_id: string;
  version_id: string;
  participant_id: string;
  round_number: number;
  state: NonResponseEscalationState;
  trigger_rule: string;
  policy_snapshot: NonResponsePolicy;
  detected_at: string;
  reminder_queued_at: string | null;
  followup_window_started_at: string | null;
  followup_window_ends_at: string | null;
  final_notice_queued_at: string | null;
  followup_expired_at: string | null;
  inactive_marked_at: string | null;
  message_texts: Array<{
    kind: "reminder" | "final_notice";
    text: string;
    queued_at: string;
  }>;
};

const enrollments = new JsonCollection<ParticipantEnrollment>("participant_enrollments");
const policies = new JsonCollection<NonResponsePolicy>("non_response_policies");
const escalations = new JsonCollection<NonResponseEscalation>("non_response_escalations");

function enrollmentKey(input: Pick<ParticipantEnrollment, "study_id" | "version_id" | "participant_id">): string {
  return `${input.study_id}:${input.version_id}:${input.participant_id}`;
}

function policyKey(input: Pick<NonResponsePolicy, "study_id" | "version_id">): string {
  return `${input.study_id}:${input.version_id}`;
}

function escalationKey(input: Pick<NonResponseEscalation, "study_id" | "version_id" | "participant_id" | "round_number">): string {
  return `${input.study_id}:${input.version_id}:${input.round_number}:${input.participant_id}`;
}

export function defaultNonResponsePolicy(input: {
  study_id: string;
  version_id: string;
  changed_by_user_id: string;
}): NonResponsePolicy {
  const now = new Date().toISOString();
  return {
    policy_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    version_number: 1,
    missed_current_round_deadline: true,
    no_activity_days_threshold: null,
    incomplete_submission_counts_as_non_response: true,
    follow_up_window_days: 5,
    final_notice_enabled: true,
    auto_progression_enabled: false,
    attrition_warning_threshold_percent: 20,
    created_at: now,
    updated_at: now,
    changed_by_user_id: input.changed_by_user_id,
  };
}

export function getNonResponsePolicy(filter: {
  study_id: string;
  version_id: string;
}, changedByUserId = "system"): NonResponsePolicy {
  return policies.get(policyKey(filter)) ?? defaultNonResponsePolicy({ ...filter, changed_by_user_id: changedByUserId });
}

export function upsertNonResponsePolicy(input: {
  study_id: string;
  version_id: string;
  changed_by_user_id: string;
  missed_current_round_deadline?: boolean;
  no_activity_days_threshold?: number | null;
  incomplete_submission_counts_as_non_response?: boolean;
  follow_up_window_days?: number;
  final_notice_enabled?: boolean;
  auto_progression_enabled?: boolean;
  attrition_warning_threshold_percent?: number;
}): NonResponsePolicy {
  const now = new Date().toISOString();
  const existing = policies.get(policyKey(input));
  const base = existing ?? defaultNonResponsePolicy(input);
  const updated: NonResponsePolicy = {
    ...base,
    version_number: existing ? existing.version_number + 1 : base.version_number,
    missed_current_round_deadline: input.missed_current_round_deadline ?? base.missed_current_round_deadline,
    no_activity_days_threshold: input.no_activity_days_threshold ?? base.no_activity_days_threshold,
    incomplete_submission_counts_as_non_response:
      input.incomplete_submission_counts_as_non_response ?? base.incomplete_submission_counts_as_non_response,
    follow_up_window_days: input.follow_up_window_days ?? base.follow_up_window_days,
    final_notice_enabled: input.final_notice_enabled ?? base.final_notice_enabled,
    auto_progression_enabled: input.auto_progression_enabled ?? base.auto_progression_enabled,
    attrition_warning_threshold_percent: input.attrition_warning_threshold_percent ?? base.attrition_warning_threshold_percent,
    updated_at: now,
    changed_by_user_id: input.changed_by_user_id,
  };
  return policies.set(policyKey(input), updated);
}

export function ensureParticipantEnrollment(input: {
  study_id: string;
  version_id: string;
  participant_id: string;
  created_by_user_id: string;
}): ParticipantEnrollment {
  const key = enrollmentKey(input);
  const existing = enrollments.get(key);
  if (existing) return existing;
  const now = new Date().toISOString();
  const enrollment: ParticipantEnrollment = {
    enrollment_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    participant_id: input.participant_id,
    status: "ACTIVE",
    inactive_from_round_number: null,
    withdrawal_type: null,
    withdrawal_reason_code: null,
    withdrawal_note: null,
    withdrawn_at: null,
    status_updated_at: now,
    created_at: now,
    created_by_user_id: input.created_by_user_id,
    timeline: [{
      status: "ACTIVE",
      at: now,
      actor_user_id: input.created_by_user_id,
      reason: "study enrollment created",
      round_number: null,
    }],
  };
  return enrollments.insert(key, enrollment);
}

export function getParticipantEnrollment(filter: {
  study_id: string;
  version_id: string;
  participant_id: string;
}): ParticipantEnrollment | null {
  return enrollments.get(enrollmentKey(filter));
}

export function listParticipantEnrollments(filter: {
  study_id: string;
  version_id: string;
}): ParticipantEnrollment[] {
  return enrollments
    .all()
    .filter((enrollment) => enrollment.study_id === filter.study_id && enrollment.version_id === filter.version_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function updateParticipantStatus(input: {
  study_id: string;
  version_id: string;
  participant_id: string;
  status: ParticipantStatus;
  actor_user_id: string;
  reason: string;
  round_number?: number | null;
  inactive_from_round_number?: number | null;
  withdrawal_type?: "participant" | "pi" | null;
  withdrawal_reason_code?: string | null;
  withdrawal_note?: string | null;
  withdrawn_at?: string | null;
}): ParticipantEnrollment | null {
  const now = new Date().toISOString();
  return enrollments.update(enrollmentKey(input), (existing) => ({
    ...existing,
    status: input.status,
    inactive_from_round_number: input.inactive_from_round_number ?? existing.inactive_from_round_number,
    withdrawal_type: input.withdrawal_type ?? existing.withdrawal_type,
    withdrawal_reason_code: input.withdrawal_reason_code ?? existing.withdrawal_reason_code,
    withdrawal_note: input.withdrawal_note ?? existing.withdrawal_note,
    withdrawn_at: input.withdrawn_at ?? existing.withdrawn_at,
    status_updated_at: now,
    timeline: [
      ...existing.timeline,
      {
        status: input.status,
        at: now,
        actor_user_id: input.actor_user_id,
        reason: input.reason,
        round_number: input.round_number ?? null,
      },
    ],
  }));
}

export function participantCanSubmit(input: {
  study_id: string;
  version_id: string;
  participant_id: string;
  round_number: number;
}): boolean {
  const enrollment = getParticipantEnrollment(input);
  if (!enrollment) return true;
  if (enrollment.status === "WITHDRAWN_PARTICIPANT") return false;
  if (enrollment.status === "WITHDRAWN_PI") {
    return enrollment.inactive_from_round_number === null || input.round_number < enrollment.inactive_from_round_number;
  }
  return true;
}

export function createOrGetNonResponseEscalation(input: {
  study_id: string;
  version_id: string;
  participant_id: string;
  round_number: number;
  trigger_rule: string;
  policy_snapshot: NonResponsePolicy;
  detected_at: string;
}): NonResponseEscalation {
  const key = escalationKey(input);
  const existing = escalations.get(key);
  if (existing) return existing;
  return escalations.insert(key, {
    escalation_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    participant_id: input.participant_id,
    round_number: input.round_number,
    state: "FLAGGED",
    trigger_rule: input.trigger_rule,
    policy_snapshot: input.policy_snapshot,
    detected_at: input.detected_at,
    reminder_queued_at: null,
    followup_window_started_at: null,
    followup_window_ends_at: null,
    final_notice_queued_at: null,
    followup_expired_at: null,
    inactive_marked_at: null,
    message_texts: [],
  });
}

export function getNonResponseEscalation(filter: {
  study_id: string;
  version_id: string;
  participant_id: string;
  round_number: number;
}): NonResponseEscalation | null {
  return escalations.get(escalationKey(filter));
}

export function listNonResponseEscalations(filter: {
  study_id: string;
  version_id: string;
  round_number?: number;
  participant_id?: string;
}): NonResponseEscalation[] {
  return escalations
    .all()
    .filter((record) =>
      record.study_id === filter.study_id &&
      record.version_id === filter.version_id &&
      (filter.round_number === undefined || record.round_number === filter.round_number) &&
      (!filter.participant_id || record.participant_id === filter.participant_id)
    )
    .sort((a, b) => a.detected_at.localeCompare(b.detected_at));
}

export function updateNonResponseEscalation(input: {
  study_id: string;
  version_id: string;
  participant_id: string;
  round_number: number;
  update: (record: NonResponseEscalation) => NonResponseEscalation;
}): NonResponseEscalation | null {
  return escalations.update(escalationKey(input), input.update);
}
