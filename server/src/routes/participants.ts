/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FastifyInstance } from "fastify";
import {
  createParticipantMaster,
  listParticipantMasters,
  getParticipantMaster,
  updateParticipantMaster,
} from "../stores/participantMasterStore.js";
import {
  createParticipantInvitation,
  getInvitationByToken,
  listParticipantInvitations,
  markInvitationUsed,
  revokeInvitation,
} from "../stores/participantInvitationStore.js";

import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";
import { getStudy, getStudyVersion } from "../studies/store.js";
import {
  getActiveConsentVersion,
  getConsentRecord,
  hasActiveConsent,
  recordConsent,
  withdrawConsent,
} from "../stores/consentStore.js";
import { createResponse, listResponses } from "../stores/responseStore.js";
import { getRoundConfig } from "../stores/roundConfigStore.js";
import { getItem, listItems } from "../stores/itemStore.js";
import { buildParticipantControlledFeedback } from "../core/participantFeedback.js";
import { buildAttritionSummary, participantSubmittedInRound } from "../core/attrition.js";
import {
  participantInvitationToken,
} from "../core/security.js";
import {
  createDeletionRequest,
  listDeletionRequests,
  updateDeletionRequest,
  type DeletionRequestStatus,
} from "../stores/deletionRequestStore.js";
import {
  createOrGetNonResponseEscalation,
  ensureParticipantEnrollment,
  getNonResponseEscalation,
  getNonResponsePolicy,
  getParticipantEnrollment,
  listNonResponseEscalations,
  listParticipantEnrollments,
  participantCanSubmit,
  updateNonResponseEscalation,
  updateParticipantStatus,
  upsertNonResponsePolicy,
  type NonResponsePolicy,
} from "../stores/participantStatusStore.js";
import {
  getOrientationCompletion,
  recordOrientationCompletion,
  PARTICIPANT_ORIENTATION_VERSION,
} from "../stores/orientationStore.js";
import {
  deleteParticipantDraft,
  listParticipantDrafts,
  upsertParticipantDraft,
} from "../stores/participantDraftStore.js";
import { getFinalResultSnapshot } from "../stores/finalResultStore.js";
import {
  createParticipantIssue,
  listParticipantIssues,
  listParticipantIssuesForParticipant,
  updateParticipantIssue,
} from "../stores/participantIssueStore.js";
import { normalizeRoundOneResponsePayload } from "../studies/researchQuestions.js";

function isDeletionRequestStatus(value: unknown): value is DeletionRequestStatus {
  return (
    value === "Requested" ||
    value === "UnderReview" ||
    value === "Approved" ||
    value === "Rejected" ||
    value === "Completed"
  );
}

const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
const DEMO_PARTICIPANT_ID = "demo-panelist-001";
const REMINDER_TEXT =
  "Our records show that your current round response has not yet been completed. You may continue participating, skip future participation where allowed by the study protocol, or withdraw at any time. There is no penalty for withdrawal. Please contact the study team if you have questions.";

function finalNoticeText(dateText: string): string {
  return `This is a final reminder for the current study round. If no response is received by ${dateText}, you may be marked inactive for future study progression. This does not penalize you, and it does not erase any prior contributions already submitted under the study protocol. You may continue or withdraw at any time.`;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function safePolicyBody(body: Record<string, unknown>) {
  const policy: Partial<NonResponsePolicy> = {};
  if (typeof body.missedCurrentRoundDeadline === "boolean") policy.missed_current_round_deadline = body.missedCurrentRoundDeadline;
  if (typeof body.missed_current_round_deadline === "boolean") policy.missed_current_round_deadline = body.missed_current_round_deadline;
  if (body.noActivityDaysThreshold === null || typeof body.noActivityDaysThreshold === "number") policy.no_activity_days_threshold = body.noActivityDaysThreshold;
  if (body.no_activity_days_threshold === null || typeof body.no_activity_days_threshold === "number") policy.no_activity_days_threshold = body.no_activity_days_threshold;
  if (typeof body.incompleteSubmissionCountsAsNonResponse === "boolean") {
    policy.incomplete_submission_counts_as_non_response = body.incompleteSubmissionCountsAsNonResponse;
  }
  if (typeof body.incomplete_submission_counts_as_non_response === "boolean") {
    policy.incomplete_submission_counts_as_non_response = body.incomplete_submission_counts_as_non_response;
  }
  if (typeof body.followUpWindowDays === "number") policy.follow_up_window_days = body.followUpWindowDays;
  if (typeof body.follow_up_window_days === "number") policy.follow_up_window_days = body.follow_up_window_days;
  if (typeof body.finalNoticeEnabled === "boolean") policy.final_notice_enabled = body.finalNoticeEnabled;
  if (typeof body.final_notice_enabled === "boolean") policy.final_notice_enabled = body.final_notice_enabled;
  if (typeof body.autoProgressionEnabled === "boolean") policy.auto_progression_enabled = body.autoProgressionEnabled;
  if (typeof body.auto_progression_enabled === "boolean") policy.auto_progression_enabled = body.auto_progression_enabled;
  if (typeof body.attritionWarningThresholdPercent === "number") policy.attrition_warning_threshold_percent = body.attritionWarningThresholdPercent;
  if (typeof body.attrition_warning_threshold_percent === "number") policy.attrition_warning_threshold_percent = body.attrition_warning_threshold_percent;
  return policy;
}

function participantHasCompleteRoundResponse(input: {
  participantId: string;
  roundNumber: number;
  responses: ReturnType<typeof listResponses>;
  publishedItemCount: number;
  countIncomplete: boolean;
}): boolean {
  if (input.roundNumber === 1) return participantSubmittedInRound(input.responses, input.participantId, 1);
  const itemIds = new Set<string>();
  for (const response of input.responses) {
    const payload = response.response_json as any;
    if (
      response.participant_id === input.participantId &&
      payload &&
      payload.round_number === input.roundNumber &&
      typeof payload.item_id === "string" &&
      typeof payload.rating === "number"
    ) {
      itemIds.add(payload.item_id);
    }
  }
  if (!input.countIncomplete) return itemIds.size > 0;
  return input.publishedItemCount > 0 && itemIds.size >= input.publishedItemCount;
}

function invitationFromRequest(req: Parameters<typeof participantInvitationToken>[0]):
  | { ok: true; invitation: NonNullable<ReturnType<typeof getInvitationByToken>> }
  | { ok: false; statusCode: number; error: string } {
  const token = participantInvitationToken(req);
  if (!token || !INVITATION_TOKEN_PATTERN.test(token)) {
    return { ok: false, statusCode: 400, error: "valid_participant_invitation_token_required" };
  }

  const invitation = getInvitationByToken(token);
  if (!invitation) return { ok: false, statusCode: 404, error: "participant_invitation_not_found" };
  return { ok: true, invitation };
}

function deprecatedTokenUrl(reply: any) {
  return reply.code(410).send({ error: "participant_invitation_token_url_deprecated" });
}

export async function participantsRoutes(app: FastifyInstance) {
  const allowMasterList = requireRole(["owner", "methods_steward"]);
  const allowOrientationComplete = requireRole(["owner", "methods_steward", "participant"]);
  const allowParticipantIssueCreate = requireRole(["owner", "methods_steward", "participant"]);

  function getFrontendOrigin(req: any): string {
    const origin = typeof req.headers.origin === "string" ? req.headers.origin : "http://127.0.0.1:5173";
    return origin.replace(/\/$/, "");
  }

  function invitationPublicPayload(invitation: NonNullable<ReturnType<typeof getInvitationByToken>>) {
    return {
      invitation_id: invitation.invitation_id,
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
      expires_at: invitation.expires_at,
    };
  }

  function getLatestRatingsForItem(itemId: string, roundNumber: number, responses: ReturnType<typeof listResponses>) {
    const latest = new Map<string, any>();
    for (const response of responses) {
      const payload = response.response_json as any;
      if (
        payload &&
        payload.round_number === roundNumber &&
        payload.item_id === itemId &&
        typeof payload.rating === "number"
      ) {
        latest.set(response.participant_id, response);
      }
    }
    return latest;
  }

  app.post(
    "/studies/:studyId/versions/:versionId/participants",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const body = (req.body ?? {}) as any;

      const actor = getActor(req);

      const participant = createParticipantMaster({
        name: body.name,
        email: body.email,
        created_by_user_id: actor.userId,
      });
      const enrollment = ensureParticipantEnrollment({
        study_id: studyId,
        version_id: versionId,
        participant_id: participant.participant_id,
        created_by_user_id: actor.userId,
      });

      await writeAuditEvent({
        actor,
        action: "participant_master.create",
        object: { type: "participant_master", id: participant.participant_id },
        details: { studyId, versionId, participant_id: participant.participant_id },
      });

      return reply.code(201).send({ participant_id: participant.participant_id, enrollment });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/participants",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const actor = getActor(req);

      const enrollments = listParticipantEnrollments({ study_id: studyId, version_id: versionId });
      const enrollmentByParticipant = new Map(enrollments.map((entry) => [entry.participant_id, entry]));
      const list = listParticipantMasters().map((participant) => ({
        ...participant,
        enrollment: enrollmentByParticipant.get(participant.participant_id) ?? null,
      }));

      await writeAuditEvent({
        actor,
        action: "participant_master.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: list.length },
      });

      return reply.send({ participants: list });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/participant-issues",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const actor = getActor(req);
      const issues = listParticipantIssues({ study_id: studyId, version_id: versionId });

      await writeAuditEvent({
        actor,
        action: "participant_issue.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: issues.length },
      });

      return reply.send({ issues });
    },
  );

  app.patch(
    "/studies/:studyId/versions/:versionId/participant-issues/:issueId",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, issueId } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as any;
      const issue = updateParticipantIssue({
        study_id: studyId,
        version_id: versionId,
        issue_id: issueId,
        status: body.status,
        staff_response_note: body.staff_response_note,
        actor_user_id: actor.userId,
      });

      if (!issue) return reply.code(404).send({ error: "participant_issue_not_found" });

      await writeAuditEvent({
        actor,
        action: "participant_issue.respond",
        object: { type: "participant_issue", id: issue.issue_id },
        details: {
          studyId,
          versionId,
          issue_type: issue.issue_type,
          participant_alias: issue.participant_alias,
          status: issue.status,
          response_present: Boolean(issue.staff_response_note),
        },
      });

      return reply.send({ issue });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/participants/:participantId/issues",
    { preHandler: allowParticipantIssueCreate },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;

      const version = await getStudyVersion(versionId);
      if (!version || version.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }
      if (actor.role === "participant" && actor.userId !== participantId && participantId !== DEMO_PARTICIPANT_ID) {
        return reply.code(403).send({ error: "forbidden" });
      }

      const issue = createParticipantIssue({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
        round_number: body.round_number,
        page_context: body.page_context,
        issue_type: body.issue_type,
        note: body.note,
        created_by: actor.role === "participant" ? "participant_portal" : "staff_preview",
      });

      await writeAuditEvent({
        actor,
        action: "participant_issue.create",
        object: { type: "participant_issue", id: issue.issue_id },
        details: {
          studyId,
          versionId,
          participant_alias: issue.participant_alias,
          round_number: issue.round_number,
          page_context: issue.page_context,
          issue_type: issue.issue_type,
        },
      });

      return reply.code(201).send({ issue });
    },
  );

  app.get(
    "/studies/:studyId/versions/:versionId/participants/:participantId",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);

      const rec = getParticipantMaster(participantId);
      if (!rec) return reply.code(404).send({ error: "participant_not_found" });

      await writeAuditEvent({
        actor,
        action: "participant_master.get",
        object: { type: "participant_master", id: participantId },
        details: { studyId, versionId },
      });

      return reply.send({ participant: rec });
    }
  );

  app.patch(
    "/studies/:studyId/versions/:versionId/participants/:participantId",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as any;

      const updated = updateParticipantMaster(participantId, {
        name: body.name,
        email: body.email,
      });

      if (!updated) return reply.code(404).send({ error: "participant_not_found" });

      await writeAuditEvent({
        actor,
        action: "participant_master.update",
        object: { type: "participant_master", id: participantId },
        details: { studyId, versionId },
      });

      return reply.send({ participant: updated });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/participants/:participantId/invitations",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as { expires_at?: string };

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      const participant = getParticipantMaster(participantId);
      if (!participant) return reply.code(404).send({ error: "participant_not_found" });

      const { invitation, token } = createParticipantInvitation({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
        created_by_user_id: actor.userId,
        ...(body.expires_at ? { expires_at: body.expires_at } : {}),
      });
      const invitationUrl = `${getFrontendOrigin(req)}/#invite=${encodeURIComponent(token)}`;

      await writeAuditEvent({
        actor,
        action: "participant.invitation.create",
        object: { type: "participant_invitation", id: invitation.invitation_id },
        details: {
          studyId,
          versionId,
          participant_id: participantId,
          expires_at: invitation.expires_at,
        },
      });

      return reply.code(201).send({
        invitation: {
          invitation_id: invitation.invitation_id,
          participant_id: invitation.participant_id,
          expires_at: invitation.expires_at,
          revoked_at: invitation.revoked_at,
          last_used_at: invitation.last_used_at,
        },
        invitation_url: invitationUrl,
      });
    },
  );

  app.get(
    "/studies/:studyId/versions/:versionId/participants/:participantId/invitations",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);
      const invitations = listParticipantInvitations({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
      });

      await writeAuditEvent({
        actor,
        action: "participant.invitation.list",
        object: { type: "participant", id: participantId },
        details: { studyId, versionId, count: invitations.length },
      });

      return reply.send({
        invitations: invitations.map((invitation) => ({
          invitation_id: invitation.invitation_id,
          participant_id: invitation.participant_id,
          expires_at: invitation.expires_at,
          revoked_at: invitation.revoked_at,
          last_used_at: invitation.last_used_at,
        })),
      });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/participants/:participantId/orientation/complete",
    { preHandler: allowOrientationComplete },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);
      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      const completion = recordOrientationCompletion({
        participant_id: participantId,
        study_id: studyId,
        version_id: versionId,
        orientation_version: PARTICIPANT_ORIENTATION_VERSION,
      });

      await writeAuditEvent({
        actor,
        action: "participant.orientation.complete",
        object: { type: "participant", id: participantId },
        details: {
          studyId,
          versionId,
          orientation_version: completion.orientation_version,
          completed_at: completion.completed_at,
        },
      });

      return reply.code(201).send({ orientation_completion: completion });
    },
  );

  app.get(
    "/studies/:studyId/versions/:versionId/deletion-requests",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const actor = getActor(req);
      const requests = listDeletionRequests({ study_id: studyId, version_id: versionId });

      await writeAuditEvent({
        actor,
        action: "participant.deletion_request.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: requests.length },
      });

      return reply.send({ deletion_requests: requests });
    },
  );

  app.patch(
    "/studies/:studyId/versions/:versionId/deletion-requests/:requestId",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, requestId } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as { status?: unknown; review_note?: string };
      if (!isDeletionRequestStatus(body.status)) {
        return reply.code(400).send({ error: "valid_deletion_request_status_required" });
      }
      if (body.status !== "UnderReview" && !String(body.review_note ?? "").trim()) {
        return reply.code(400).send({ error: "review_note_required" });
      }

      const updated = updateDeletionRequest({
        deletion_request_id: requestId,
        reviewed_by_user_id: actor.userId,
        status: body.status,
        review_note: body.review_note ?? "",
      });
      if (!updated || updated.study_id !== studyId || updated.version_id !== versionId) {
        return reply.code(404).send({ error: "deletion_request_not_found" });
      }

      await writeAuditEvent({
        actor,
        action: "participant.deletion_request.review",
        object: { type: "deletion_request", id: requestId },
        details: { studyId, versionId, status: updated.status },
      });

      return reply.send({ deletion_request: updated });
    },
  );

  app.get(
    "/studies/:studyId/versions/:versionId/non-response-policy",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const actor = getActor(req);
      const policy = getNonResponsePolicy({ study_id: studyId, version_id: versionId }, actor.userId);
      return reply.send({ policy });
    },
  );

  app.put(
    "/studies/:studyId/versions/:versionId/non-response-policy",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) return reply.code(404).send({ error: "study_version_not_found" });
      if (studyVersion.opened_round1_at || studyVersion.status === "Active" || studyVersion.status === "Closed") {
        await writeAuditEvent({
          actor,
          action: "NON_RESPONSE_POLICY_UPDATE_BLOCKED_LOCKED_STUDY",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: { studyId, versionId },
        });
        return reply.code(409).send({ error: "non_response_policy_locked_after_launch" });
      }
      const normalized = safePolicyBody(body);
      const followUp = normalized.follow_up_window_days;
      if (followUp !== undefined && (!Number.isInteger(followUp) || followUp < 1 || followUp > 30)) {
        return reply.code(400).send({ error: "follow_up_window_days_1_to_30_required" });
      }
      const policy = upsertNonResponsePolicy({
        study_id: studyId,
        version_id: versionId,
        changed_by_user_id: actor.userId,
        ...normalized,
      });
      await writeAuditEvent({
        actor,
        action: policy.version_number === 1 ? "NON_RESPONSE_POLICY_CREATED" : "NON_RESPONSE_POLICY_UPDATED",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, policy_version: policy.version_number, auto_progression_enabled: policy.auto_progression_enabled },
      });
      return reply.send({ policy });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/non-response/detect",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, roundNumber: rawRoundNumber } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const roundNumber = Number(rawRoundNumber);
      if (!Number.isInteger(roundNumber) || roundNumber < 1) return reply.code(400).send({ error: "round_number_required" });
      const roundConfig = getRoundConfig({ study_id: studyId, version_id: versionId, round_number: roundNumber });
      if (!roundConfig) return reply.code(404).send({ error: "round_config_not_found" });
      const policy = getNonResponsePolicy({ study_id: studyId, version_id: versionId }, actor.userId);
      const detectedAt = typeof body.as_of === "string" ? new Date(body.as_of) : new Date();
      const deadline = addDays(new Date(roundConfig.updated_at), roundConfig.response_window_days);
      const responses = listResponses({ study_id: studyId, version_id: versionId });
      const publishedItemCount = roundNumber === 1 ? 1 : listItems({ study_id: studyId, version_id: versionId })
        .filter((item) => item.round_number === roundNumber && item.status === "Published").length;
      const flagged = [];
      for (const enrollment of listParticipantEnrollments({ study_id: studyId, version_id: versionId })) {
        if (enrollment.status === "WITHDRAWN_PARTICIPANT" || enrollment.status === "WITHDRAWN_PI" || enrollment.status === "COMPLETED") continue;
        const complete = participantHasCompleteRoundResponse({
          participantId: enrollment.participant_id,
          roundNumber,
          responses,
          publishedItemCount,
          countIncomplete: policy.incomplete_submission_counts_as_non_response,
        });
        let triggerRule: string | null = null;
        if (policy.missed_current_round_deadline && detectedAt > deadline && !complete) {
          triggerRule = policy.incomplete_submission_counts_as_non_response ? "missed_current_round_deadline_or_incomplete_submission" : "missed_current_round_deadline";
        }
        if (!triggerRule && policy.no_activity_days_threshold !== null) {
          const latestActivity = responses
            .filter((response) => response.participant_id === enrollment.participant_id)
            .map((response) => response.created_at)
            .sort()
            .at(-1) ?? enrollment.created_at;
          if (detectedAt > addDays(new Date(latestActivity), policy.no_activity_days_threshold)) triggerRule = "no_activity_days_threshold";
        }
        if (!triggerRule) continue;
        const updated = updateParticipantStatus({
          study_id: studyId,
          version_id: versionId,
          participant_id: enrollment.participant_id,
          status: "NON_RESPONSIVE_FLAGGED",
          actor_user_id: "system",
          reason: triggerRule,
          round_number: roundNumber,
        });
        const escalation = createOrGetNonResponseEscalation({
          study_id: studyId,
          version_id: versionId,
          participant_id: enrollment.participant_id,
          round_number: roundNumber,
          trigger_rule: triggerRule,
          policy_snapshot: policy,
          detected_at: detectedAt.toISOString(),
        });
        await writeAuditEvent({
          actor: { userId: "system", role: "system", systemRoles: ["system"], authSource: "system" },
          action: "PARTICIPANT_NON_RESPONSE_FLAGGED",
          object: { type: "participant", id: enrollment.participant_id },
          details: { studyId, versionId, participantId: enrollment.participant_id, roundId: `${versionId}:round:${roundNumber}`, triggerRule, configVersionOrSnapshot: policy, detectedAt: detectedAt.toISOString(), previousStatus: enrollment.status, newStatus: updated?.status },
        });
        flagged.push({ participant_id: enrollment.participant_id, escalation });
      }
      return reply.send({ flagged, policy });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/participants/:participantId/reminder",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, roundNumber: rawRoundNumber, participantId } = req.params as any;
      const actor = getActor(req);
      const roundNumber = Number(rawRoundNumber);
      const policy = getNonResponsePolicy({ study_id: studyId, version_id: versionId }, actor.userId);
      const existing = getNonResponseEscalation({ study_id: studyId, version_id: versionId, participant_id: participantId, round_number: roundNumber });
      if (!existing) return reply.code(409).send({ error: "non_response_flag_required_before_reminder" });
      const now = new Date();
      const followupEnd = addDays(now, policy.follow_up_window_days).toISOString();
      const updated = updateNonResponseEscalation({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
        round_number: roundNumber,
        update: (record) => ({
          ...record,
          state: "FOLLOWUP_STARTED",
          reminder_queued_at: record.reminder_queued_at ?? now.toISOString(),
          followup_window_started_at: record.followup_window_started_at ?? now.toISOString(),
          followup_window_ends_at: record.followup_window_ends_at ?? followupEnd,
          message_texts: record.message_texts.some((message) => message.kind === "reminder")
            ? record.message_texts
            : [...record.message_texts, { kind: "reminder", text: REMINDER_TEXT, queued_at: now.toISOString() }],
        }),
      });
      await writeAuditEvent({ actor, action: "PARTICIPANT_REMINDER_SENT", object: { type: "participant", id: participantId }, details: { studyId, versionId, roundId: `${versionId}:round:${roundNumber}`, participantId, message_template: "fixed_neutral_non_response_reminder_v1" } });
      await writeAuditEvent({ actor, action: "PARTICIPANT_FOLLOWUP_WINDOW_STARTED", object: { type: "participant", id: participantId }, details: { studyId, versionId, roundId: `${versionId}:round:${roundNumber}`, participantId, followup_window_ends_at: followupEnd } });
      return reply.send({ escalation: updated });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/participants/:participantId/final-notice",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, roundNumber: rawRoundNumber, participantId } = req.params as any;
      const actor = getActor(req);
      const roundNumber = Number(rawRoundNumber);
      const policy = getNonResponsePolicy({ study_id: studyId, version_id: versionId }, actor.userId);
      if (!policy.final_notice_enabled) return reply.code(409).send({ error: "final_notice_disabled_by_policy" });
      const existing = getNonResponseEscalation({ study_id: studyId, version_id: versionId, participant_id: participantId, round_number: roundNumber });
      if (!existing?.followup_window_ends_at) return reply.code(409).send({ error: "followup_window_required_before_final_notice" });
      const now = new Date().toISOString();
      const message = finalNoticeText(existing.followup_window_ends_at.slice(0, 10));
      const updated = updateNonResponseEscalation({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
        round_number: roundNumber,
        update: (record) => ({
          ...record,
          state: "FINAL_NOTICE_QUEUED",
          final_notice_queued_at: record.final_notice_queued_at ?? now,
          message_texts: record.message_texts.some((entry) => entry.kind === "final_notice")
            ? record.message_texts
            : [...record.message_texts, { kind: "final_notice", text: message, queued_at: now }],
        }),
      });
      await writeAuditEvent({ actor, action: "PARTICIPANT_FINAL_NOTICE_SENT", object: { type: "participant", id: participantId }, details: { studyId, versionId, roundId: `${versionId}:round:${roundNumber}`, participantId, message_template: "fixed_neutral_final_notice_v1" } });
      return reply.send({ escalation: updated });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/participants/:participantId/followup-expire",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, roundNumber: rawRoundNumber, participantId } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const roundNumber = Number(rawRoundNumber);
      const asOf = typeof body.as_of === "string" ? new Date(body.as_of) : new Date();
      const existing = getNonResponseEscalation({ study_id: studyId, version_id: versionId, participant_id: participantId, round_number: roundNumber });
      if (!existing?.followup_window_ends_at) return reply.code(409).send({ error: "followup_window_not_started" });
      if (asOf < new Date(existing.followup_window_ends_at)) return reply.code(409).send({ error: "followup_window_still_open" });
      const updated = updateNonResponseEscalation({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
        round_number: roundNumber,
        update: (record) => ({ ...record, state: "FOLLOWUP_EXPIRED", followup_expired_at: record.followup_expired_at ?? asOf.toISOString() }),
      });
      await writeAuditEvent({ actor, action: "PARTICIPANT_FOLLOWUP_WINDOW_EXPIRED", object: { type: "participant", id: participantId }, details: { studyId, versionId, roundId: `${versionId}:round:${roundNumber}`, participantId, expired_at: asOf.toISOString() } });
      return reply.send({ escalation: updated });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/participants/:participantId/mark-inactive",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId } = req.params as any;
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const inactiveFromRoundNumber = Number(body.inactive_from_round_number ?? body.inactiveFromRoundNumber);
      const reasonCode = String(body.reason_code ?? body.reasonCode ?? "");
      const note = String(body.note ?? "").trim();
      const acknowledged = body.safeguard_acknowledged === true || body.safeguardAcknowledged === true;
      const validReasons = new Set(["no_response_after_followup", "participant_unreachable_after_reminders", "administrative_withdrawal_under_protocol", "other"]);
      if (!Number.isInteger(inactiveFromRoundNumber) || inactiveFromRoundNumber < 1) return reply.code(400).send({ error: "inactive_from_round_number_required" });
      if (!validReasons.has(reasonCode)) return reply.code(400).send({ error: "valid_inactive_reason_required" });
      if (reasonCode === "other" && !note) return reply.code(400).send({ error: "note_required_for_other_reason" });
      if (!acknowledged) return reply.code(400).send({ error: "safeguard_acknowledgement_required" });
      const escalation = listNonResponseEscalations({ study_id: studyId, version_id: versionId, participant_id: participantId })
        .filter((record) => record.state === "FOLLOWUP_EXPIRED")
        .sort((a, b) => b.round_number - a.round_number)[0];
      if (!escalation) return reply.code(409).send({ error: "followup_window_must_expire_before_inactive_status" });
      const previous = getParticipantEnrollment({ study_id: studyId, version_id: versionId, participant_id: participantId });
      const updated = updateParticipantStatus({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
        status: "WITHDRAWN_PI",
        actor_user_id: actor.userId,
        reason: reasonCode,
        round_number: inactiveFromRoundNumber,
        inactive_from_round_number: inactiveFromRoundNumber,
        withdrawal_type: "pi",
        withdrawal_reason_code: reasonCode,
        withdrawal_note: note,
        withdrawn_at: new Date().toISOString(),
      });
      const marked = updateNonResponseEscalation({
        study_id: escalation.study_id,
        version_id: escalation.version_id,
        participant_id: escalation.participant_id,
        round_number: escalation.round_number,
        update: (record) => ({ ...record, state: "MARKED_INACTIVE", inactive_marked_at: new Date().toISOString() }),
      });
      await writeAuditEvent({
        actor,
        action: "PARTICIPANT_MARKED_INACTIVE_BY_PI",
        object: { type: "participant", id: participantId },
        details: { studyId, versionId, participantId, inactiveFromRoundId: `${versionId}:round:${inactiveFromRoundNumber}`, reasonCode, note, actorUserId: actor.userId, previousStatus: previous?.status, newStatus: updated?.status, actedAt: updated?.withdrawn_at, escalationHistoryIds: [escalation.escalation_id] },
      });
      await writeAuditEvent({ actor, action: "PARTICIPANT_STATUS_CHANGED", object: { type: "participant", id: participantId }, details: { studyId, versionId, participantId, previousStatus: previous?.status, newStatus: updated?.status, reason: reasonCode } });
      return reply.send({ participant_status: updated, escalation: marked });
    },
  );

  app.get(
    "/studies/:studyId/versions/:versionId/attrition-summary",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId } = req.params as any;
      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) return reply.code(404).send({ error: "study_version_not_found" });
      const policy = getNonResponsePolicy({ study_id: studyId, version_id: versionId });
      const summary = buildAttritionSummary({
        enrollments: listParticipantEnrollments({ study_id: studyId, version_id: versionId }),
        escalations: listNonResponseEscalations({ study_id: studyId, version_id: versionId }),
        responses: listResponses({ study_id: studyId, version_id: versionId }),
        plannedRounds: studyVersion.planned_round_count ?? 3,
        warningThresholdPercent: policy.attrition_warning_threshold_percent,
      });
      return reply.send({ policy, attrition_summary: summary, participant_statuses: listParticipantEnrollments({ study_id: studyId, version_id: versionId }), escalations: listNonResponseEscalations({ study_id: studyId, version_id: versionId }) });
    },
  );

  app.delete(
    "/studies/:studyId/versions/:versionId/participants/:participantId/invitations/:invitationId",
    { preHandler: allowMasterList },
    async (req, reply) => {
      const { studyId, versionId, participantId, invitationId } = req.params as any;
      const actor = getActor(req);
      const invitations = listParticipantInvitations({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
      });
      const invitation = invitations.find((entry) => entry.invitation_id === invitationId);
      if (!invitation) return reply.code(404).send({ error: "participant_invitation_not_found" });

      const revoked = revokeInvitation(invitationId);
      if (!revoked) return reply.code(404).send({ error: "participant_invitation_not_found" });

      await writeAuditEvent({
        actor,
        action: "participant.invitation.revoke",
        object: { type: "participant_invitation", id: invitationId },
        details: { studyId, versionId, participant_id: participantId },
      });

      return reply.send({
        invitation: {
          invitation_id: revoked.invitation_id,
          participant_id: revoked.participant_id,
          expires_at: revoked.expires_at,
          revoked_at: revoked.revoked_at,
          last_used_at: revoked.last_used_at,
        },
      });
    },
  );

  app.get("/participant/invitation", async (req, reply) => {
    const resolved = invitationFromRequest(req);
    if (!resolved.ok) return reply.code(resolved.statusCode).send({ error: resolved.error });
    const { invitation } = resolved;

    markInvitationUsed(invitation.invitation_id);
    const study = await getStudy(invitation.study_id);
    const studyVersion = await getStudyVersion(invitation.version_id);
    const activeConsent = getActiveConsentVersion({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
    });
    const consentRecord = getConsentRecord({
      participant_id: invitation.participant_id,
      study_id: invitation.study_id,
      version_id: invitation.version_id,
    });
    const participantStatus = getParticipantEnrollment({
      participant_id: invitation.participant_id,
      study_id: invitation.study_id,
      version_id: invitation.version_id,
    });
    const orientationCompletion = getOrientationCompletion({
      participant_id: invitation.participant_id,
      study_id: invitation.study_id,
      version_id: invitation.version_id,
    });
    const roundConfigs = [1, 2, 3, 4]
      .map((roundNumber) => getRoundConfig({ study_id: invitation.study_id, version_id: invitation.version_id, round_number: roundNumber }))
      .filter(Boolean);
    const drafts = listParticipantDrafts({
      participant_id: invitation.participant_id,
      study_id: invitation.study_id,
      version_id: invitation.version_id,
    });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "participant.invitation.open",
      object: { type: "participant_invitation", id: invitation.invitation_id },
      details: { studyId: invitation.study_id, versionId: invitation.version_id },
    });

    return reply.send({
      invitation: invitationPublicPayload(invitation),
      study,
      study_version: studyVersion,
      active_consent_version: activeConsent,
      consent_record: consentRecord,
      participant_status: participantStatus,
      orientation_completion: orientationCompletion,
      orientation_version: PARTICIPANT_ORIENTATION_VERSION,
      round_configs: roundConfigs,
      drafts,
    });
  });

  app.get("/participant/invitation/final-results", async (req, reply) => {
    const resolved = invitationFromRequest(req);
    if (!resolved.ok) return reply.code(resolved.statusCode).send({ error: resolved.error });
    const { invitation } = resolved;
    const snapshot = getFinalResultSnapshot(invitation.study_id, invitation.version_id);
    if (!snapshot || (snapshot.status !== "released" && snapshot.status !== "archived")) {
      return reply.code(409).send({ error: "final_results_not_released" });
    }

    const responses = listResponses({ study_id: invitation.study_id, version_id: invitation.version_id });
    const myFinalResponses = responses.flatMap((response) => {
      const payload = response.response_json as any;
      if (
        response.participant_id === invitation.participant_id &&
        payload &&
        payload.round_number === snapshot.terminalRoundNumber &&
        typeof payload.item_id === "string" &&
        typeof payload.rating === "number"
      ) {
        const item = getItem(payload.item_id);
        return [{
          item_id: payload.item_id,
          item_text: item?.text ?? "",
          rating: payload.rating,
          rationale_text: typeof payload.rationale_text === "string" ? payload.rationale_text : "",
          submitted_at: response.created_at,
        }];
      }
      return [];
    });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "final_results.participant_view",
      object: { type: "final_result_snapshot", id: snapshot.snapshotId },
      details: { studyId: invitation.study_id, versionId: invitation.version_id },
    });

    return reply.send({ snapshot, my_final_responses: myFinalResponses });
  });

  app.put("/participant/invitation/rounds/:roundNumber/draft", async (req, reply) => {
    const { roundNumber: rawRoundNumber } = req.params as any;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const resolved = invitationFromRequest(req);
    if (!resolved.ok) return reply.code(resolved.statusCode).send({ error: resolved.error });
    const { invitation } = resolved;
    const roundNumber = Number(rawRoundNumber);
    if (!Number.isInteger(roundNumber) || roundNumber < 1) return reply.code(400).send({ error: "round_number_required" });

    const roundConfig = getRoundConfig({ study_id: invitation.study_id, version_id: invitation.version_id, round_number: roundNumber });
    if (!roundConfig || roundConfig.status !== "Open") return reply.code(409).send({ error: "round_not_open" });
    if (!participantCanSubmit({ study_id: invitation.study_id, version_id: invitation.version_id, participant_id: invitation.participant_id, round_number: roundNumber })) {
      return reply.code(403).send({ error: "participant_inactive_or_withdrawn_for_round" });
    }

    const draft = upsertParticipantDraft({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
      round_number: roundNumber,
      draft_json: body.draft_json ?? {},
    });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "participant.draft.save",
      object: { type: "participant_draft", id: `${invitation.participant_id}:${roundNumber}` },
      details: { studyId: invitation.study_id, versionId: invitation.version_id, round_number: roundNumber },
    });

    return reply.send({ draft });
  });

  app.post("/participant/invitation/orientation/complete", async (req, reply) => {
    const resolved = invitationFromRequest(req);
    if (!resolved.ok) return reply.code(resolved.statusCode).send({ error: resolved.error });
    const { invitation } = resolved;
    const completion = recordOrientationCompletion({
      participant_id: invitation.participant_id,
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      orientation_version: PARTICIPANT_ORIENTATION_VERSION,
    });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "participant.orientation.complete",
      object: { type: "participant", id: invitation.participant_id },
      details: {
        studyId: invitation.study_id,
        versionId: invitation.version_id,
        orientation_version: completion.orientation_version,
        completed_at: completion.completed_at,
      },
    });

    return reply.code(201).send({ orientation_completion: completion });
  });

  app.post("/participant/invitation/consent", async (req, reply) => {
    const resolved = invitationFromRequest(req);
    if (!resolved.ok) return reply.code(resolved.statusCode).send({ error: resolved.error });
    const { invitation } = resolved;

    const active = getActiveConsentVersion({ study_id: invitation.study_id, version_id: invitation.version_id });
    if (!active) return reply.code(400).send({ error: "active_consent_version_not_found" });

    const rec = recordConsent({
      participant_id: invitation.participant_id,
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      consent_version_id: active.consent_version_id,
    });
    ensureParticipantEnrollment({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
      created_by_user_id: invitation.participant_id,
    });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "consent.record",
      object: { type: "participant", id: rec.participant_id },
      details: { studyId: invitation.study_id, versionId: invitation.version_id, consent_version_id: rec.consent_version_id },
    });

    return reply.code(201).send({ consent_record: rec });
  });

  app.post("/participant/invitation/withdraw", async (req, reply) => {
    const resolved = invitationFromRequest(req);
    if (!resolved.ok) return reply.code(resolved.statusCode).send({ error: resolved.error });
    const { invitation } = resolved;

    const rec = withdrawConsent({
      participant_id: invitation.participant_id,
      study_id: invitation.study_id,
      version_id: invitation.version_id,
    });
    if (!rec) return reply.code(404).send({ error: "consent_record_not_found" });
    const previous = getParticipantEnrollment({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
    });
    const updatedStatus = updateParticipantStatus({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
      status: "WITHDRAWN_PARTICIPANT",
      actor_user_id: invitation.participant_id,
      reason: "participant initiated withdrawal from future rounds",
      round_number: null,
      inactive_from_round_number: 1,
      withdrawal_type: "participant",
      withdrawal_reason_code: "participant_withdrawal",
      withdrawal_note: "Participant withdrew from future rounds through invitation portal.",
      withdrawn_at: rec.withdrew_at,
    });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "consent.withdraw",
      object: { type: "participant", id: rec.participant_id },
      details: { studyId: invitation.study_id, versionId: invitation.version_id, withdrew_at: rec.withdrew_at },
    });
    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "PARTICIPANT_WITHDRAWN_BY_PARTICIPANT",
      object: { type: "participant", id: rec.participant_id },
      details: { studyId: invitation.study_id, versionId: invitation.version_id, participantId: rec.participant_id, previousStatus: previous?.status, newStatus: updatedStatus?.status, withdrew_at: rec.withdrew_at },
    });

    return reply.send({ consent_record: rec, participant_status: updatedStatus });
  });

  app.post("/participant/invitation/deletion-request", async (req, reply) => {
    const body = (req.body ?? {}) as { request_text?: string };
    const resolved = invitationFromRequest(req);
    if (!resolved.ok) return reply.code(resolved.statusCode).send({ error: resolved.error });
    const { invitation } = resolved;

    const request = createDeletionRequest({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
      requested_by: "participant",
      request_text:
        body.request_text?.trim() ||
        "Participant requested review of retention, withdrawal, deletion, or restricted-use options.",
    });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "participant.deletion_request.create",
      object: { type: "deletion_request", id: request.deletion_request_id },
      details: { studyId: invitation.study_id, versionId: invitation.version_id },
    });

    return reply.code(201).send({ deletion_request: request });
  });

  app.post("/participant/invitation/issues", async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const resolved = invitationFromRequest(req);
    if (!resolved.ok) return reply.code(resolved.statusCode).send({ error: resolved.error });
    const { invitation } = resolved;
    const issue = createParticipantIssue({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
      round_number: body.round_number,
      page_context: body.page_context,
      issue_type: body.issue_type,
      note: body.note,
      created_by: "participant_invitation",
    });

    await writeAuditEvent({
      actor: {
        userId: invitation.participant_id,
        role: "participant",
        systemRoles: ["participant" as any],
        authSource: "invitation",
      },
      action: "participant_issue.create",
      object: { type: "participant_issue", id: issue.issue_id },
      details: {
        studyId: invitation.study_id,
        versionId: invitation.version_id,
        participant_alias: issue.participant_alias,
        round_number: issue.round_number,
        page_context: issue.page_context,
        issue_type: issue.issue_type,
      },
    });

    return reply.code(201).send({ issue });
  });

  app.get("/participant/invitation/issues", async (req, reply) => {
    const resolved = invitationFromRequest(req);
    if (!resolved.ok) return reply.code(resolved.statusCode).send({ error: resolved.error });
    const { invitation } = resolved;
    const issues = listParticipantIssuesForParticipant({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
    });

    return reply.send({ issues });
  });

  app.post("/participant/invitation/responses", async (req, reply) => {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const resolved = invitationFromRequest(req);
    if (!resolved.ok) return reply.code(resolved.statusCode).send({ error: resolved.error });
    const { invitation } = resolved;
    const studyVersion = await getStudyVersion(invitation.version_id);
    if (!studyVersion || studyVersion.study_id !== invitation.study_id) {
      return reply.code(404).send({ error: "study_version_not_found" });
    }

    const roundOneConfig = getRoundConfig({ study_id: invitation.study_id, version_id: invitation.version_id, round_number: 1 });
    if (!roundOneConfig || roundOneConfig.status !== "Open") return reply.code(409).send({ error: "round1_not_open" });
    if (!hasActiveConsent({ participant_id: invitation.participant_id, study_id: invitation.study_id, version_id: invitation.version_id })) {
      return reply.code(403).send({ error: "active_consent_required" });
    }
    if (!getOrientationCompletion({ participant_id: invitation.participant_id, study_id: invitation.study_id, version_id: invitation.version_id })) {
      return reply.code(403).send({ error: "participant_orientation_required" });
    }
    if (!participantCanSubmit({ study_id: invitation.study_id, version_id: invitation.version_id, participant_id: invitation.participant_id, round_number: 1 })) {
      return reply.code(403).send({ error: "participant_inactive_or_withdrawn_for_round" });
    }

    const normalizedRoundOne = normalizeRoundOneResponsePayload(body, studyVersion.study_design_packet_json);
    if (!normalizedRoundOne.ok) return reply.code(400).send({ error: normalizedRoundOne.error });

    const rec = createResponse({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
      response_json: normalizedRoundOne.payload,
    });
    deleteParticipantDraft({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
      round_number: 1,
    });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "response.submit",
      object: { type: "response", id: rec.response_id },
      details: { studyId: invitation.study_id, versionId: invitation.version_id, participant_id: invitation.participant_id },
    });

    return reply.code(201).send({ response_id: rec.response_id });
  });

  app.get("/participant/invitation/rounds/:roundNumber/items", async (req, reply) => {
    const { roundNumber: rawRoundNumber } = req.params as any;
    const resolved = invitationFromRequest(req);
    if (!resolved.ok) return reply.code(resolved.statusCode).send({ error: resolved.error });
    const { invitation } = resolved;
    const roundNumber = Number(rawRoundNumber);
    if (!Number.isInteger(roundNumber) || roundNumber < 2) return reply.code(400).send({ error: "rating_round_must_be_gte_2" });

    const roundConfig = getRoundConfig({ study_id: invitation.study_id, version_id: invitation.version_id, round_number: roundNumber });
    if (!roundConfig || roundConfig.status !== "Open") return reply.code(409).send({ error: "round_not_open" });

    const responses = listResponses({ study_id: invitation.study_id, version_id: invitation.version_id });
    const publishedItems = listItems({ study_id: invitation.study_id, version_id: invitation.version_id })
      .filter((item) => item.round_number === roundNumber && item.status === "Published");

    const items = publishedItems.map((item) => {
      const prior = getLatestRatingsForItem(item.item_id, roundNumber, responses).get(invitation.participant_id);
      const payload = prior?.response_json as any;
        return {
          item_id: item.item_id,
          text: item.text,
          round_number: item.round_number,
          provenance_type: item.provenance_type,
          your_prior_response: payload
            ? { rating: payload.rating, action: payload.action, submitted_at: prior.created_at }
            : null,
          controlled_feedback: buildParticipantControlledFeedback({
            item,
            responses,
            roundNumber,
            participantId: invitation.participant_id,
            feedbackConfig: roundConfig.feedback_config,
          }),
        };
      });

    return reply.send({ items });
  });

  app.post("/participant/invitation/rounds/:roundNumber/ratings", async (req, reply) => {
    const { roundNumber: rawRoundNumber } = req.params as any;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const resolved = invitationFromRequest(req);
    if (!resolved.ok) return reply.code(resolved.statusCode).send({ error: resolved.error });
    const { invitation } = resolved;
    const roundNumber = Number(rawRoundNumber);
    if (!Number.isInteger(roundNumber) || roundNumber < 2) return reply.code(400).send({ error: "rating_round_must_be_gte_2" });

    const roundConfig = getRoundConfig({ study_id: invitation.study_id, version_id: invitation.version_id, round_number: roundNumber });
    if (!roundConfig || roundConfig.status !== "Open") return reply.code(409).send({ error: "round_not_open" });
    if (!hasActiveConsent({ participant_id: invitation.participant_id, study_id: invitation.study_id, version_id: invitation.version_id })) {
      return reply.code(403).send({ error: "active_consent_required" });
    }
    if (!participantCanSubmit({ study_id: invitation.study_id, version_id: invitation.version_id, participant_id: invitation.participant_id, round_number: roundNumber })) {
      return reply.code(403).send({ error: "participant_inactive_or_withdrawn_for_round" });
    }

    const itemId = String(body.item_id ?? "");
    const rating = Number(body.rating);
    const action = body.action === "keep" ? "keep" : "revise";
    const rationaleText =
      typeof body.rationale_text === "string"
        ? body.rationale_text.trim().slice(0, 4000)
        : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 9) return reply.code(400).send({ error: "rating_1_to_9_required" });

    const item = getItem(itemId);
    if (!item || item.study_id !== invitation.study_id || item.version_id !== invitation.version_id || item.round_number !== roundNumber || item.status !== "Published") {
      return reply.code(409).send({ error: "item_not_available_for_round_rating" });
    }

    const rec = createResponse({
      study_id: invitation.study_id,
      version_id: invitation.version_id,
      participant_id: invitation.participant_id,
      response_json: { round_number: roundNumber, item_id: itemId, rating, action, ...(rationaleText ? { rationale_text: rationaleText } : {}) },
    });

    await writeAuditEvent({
      actor: { userId: invitation.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
      action: "round.rating.submit",
      object: { type: "response", id: rec.response_id },
      details: { studyId: invitation.study_id, versionId: invitation.version_id, round_number: roundNumber, item_id: itemId },
    });

    return reply.code(201).send({ response_id: rec.response_id });
  });

  app.get("/participant/invitations/:token", async (_req, reply) => deprecatedTokenUrl(reply));
  app.post("/participant/invitations/:token/consent", async (_req, reply) => deprecatedTokenUrl(reply));
  app.post("/participant/invitations/:token/withdraw", async (_req, reply) => deprecatedTokenUrl(reply));
  app.post("/participant/invitations/:token/deletion-request", async (_req, reply) => deprecatedTokenUrl(reply));
  app.post("/participant/invitations/:token/responses", async (_req, reply) => deprecatedTokenUrl(reply));
  app.get("/participant/invitations/:token/rounds/:roundNumber/items", async (_req, reply) => deprecatedTokenUrl(reply));
  app.post("/participant/invitations/:token/rounds/:roundNumber/ratings", async (_req, reply) => deprecatedTokenUrl(reply));
}
