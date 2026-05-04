/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FastifyInstance } from "fastify";
import { createResponse, listResponses, type ResponseRecord } from "../stores/responseStore.js";
import { hasActiveConsent } from "../stores/consentStore.js";
import { getStudyVersion, updateStudyVersion } from "../studies/store.js";
import { getItem, listItems } from "../stores/itemStore.js";
import {
  getRoundConfig,
  listRoundConfigs,
  updateRoundConfigStatus,
  upsertRoundConfig,
  normalizeFeedbackConfig,
  type RoundTaskType,
} from "../stores/roundConfigStore.js";

import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";
import { getPublishedTraceableItemsForRound } from "../core/roundLifecycle.js";
import { buildParticipantControlledFeedback } from "../core/participantFeedback.js";
import { participantCanSubmit } from "../stores/participantStatusStore.js";
import { hasOrientationCompletion } from "../stores/orientationStore.js";
import { createFinalResultSnapshot } from "../core/finalResults.js";
import { sendRoundOpenSmsNotifications } from "../core/smsNotifications.js";

type RatingRoundPayload = {
  round_number: number;
  item_id: string;
  rating: number;
  action: "keep" | "revise";
  rationale_text?: string;
};

function getStudyAndVersion(params: unknown): { studyId: string; versionId: string } {
  const p = (params ?? {}) as Record<string, unknown>;

  const studyId = String(
    p.studyId ?? p.study_id ?? p.studyid ?? p.STUDYID ?? p.study ?? ""
  );

  const versionId = String(
    p.versionId ??
      p.version_id ??
      p.versionid ??
      p.VERSIONID ??
      p.version ??
      p.id ??
      ""
  );

  return { studyId, versionId };
}

function getRoundNumber(params: unknown): number | null {
  const p = (params ?? {}) as Record<string, unknown>;
  const raw = p.roundNumber ?? p.round_number ?? null;
  if (typeof raw === "number" && Number.isInteger(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const parsed = Number(raw);
    return Number.isInteger(parsed) ? parsed : null;
  }
  return null;
}

function getFrontendOrigin(req: any): string {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "http://127.0.0.1:5173";
  return origin.replace(/\/$/, "");
}

function isRatingRoundPayload(value: unknown, roundNumber: number): value is RatingRoundPayload {
  if (!value || typeof value !== "object") return false;

  const rec = value as Record<string, unknown>;

  return (
    rec.round_number === roundNumber &&
    typeof rec.item_id === "string" &&
    typeof rec.rating === "number" &&
    Number.isFinite(rec.rating) &&
    (rec.action === "keep" || rec.action === "revise")
  );
}

function getLatestRatingsForItem(
  responses: ResponseRecord[],
  itemId: string,
  roundNumber: number
): Map<string, ResponseRecord> {
  const latest = new Map<string, ResponseRecord>();

  for (const response of responses) {
    if (!isRatingRoundPayload(response.response_json, roundNumber)) continue;
    if (response.response_json.item_id !== itemId) continue;
    latest.set(response.participant_id, response);
  }

  return latest;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    const value = sorted[mid];
    return value ?? null;
  }

  const left = sorted[mid - 1];
  const right = sorted[mid];

  if (left === undefined || right === undefined) return null;
  return (left + right) / 2;
}

function percentileFromSorted(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0] ?? null;

  const idx = (sorted.length - 1) * p;
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);

  const lowerValue = sorted[lower];
  const upperValue = sorted[upper];

  if (lowerValue === undefined || upperValue === undefined) return null;
  if (lower === upper) return lowerValue;

  const fraction = idx - lower;
  return lowerValue + (upperValue - lowerValue) * fraction;
}

function buildDistribution(values: number[]): Record<string, number> {
  const distribution: Record<string, number> = {};

  for (const value of values) {
    const key = String(value);
    distribution[key] = (distribution[key] ?? 0) + 1;
  }

  return distribution;
}

function getMaxAllowedRound(studyFormat: string | null): number {
  if (studyFormat === "ModifiedDelphi") return 3;
  if (studyFormat === "ClassicDelphi") return 4;
  return 2;
}

function getAllowedRatingRounds(studyFormat: string | null): number[] {
  const maxRound = getMaxAllowedRound(studyFormat);
  const rounds: number[] = [];
  for (let round = 2; round <= maxRound; round += 1) {
    rounds.push(round);
  }
  return rounds;
}

function isAllowedRatingRound(studyFormat: string | null, roundNumber: number): boolean {
  return getAllowedRatingRounds(studyFormat).includes(roundNumber);
}

function isAllowedConfiguredRound(studyFormat: string | null, roundNumber: number): boolean {
  if (roundNumber === 1) return true;
  return isAllowedRatingRound(studyFormat, roundNumber);
}

function isRoundTaskType(value: unknown): value is RoundTaskType {
  return value === "open_text" || value === "rating" || value === "ranking" || value === "confirmation";
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function responsesRoutes(app: FastifyInstance) {
  const allowSubmit = requireRole(["participant", "owner", "methods_steward"]);
  const allowStaffRead = requireRole(["owner", "methods_steward"]);
  const allowParticipantOrStaff = requireRole(["participant", "owner", "methods_steward"]);

  app.get(
    "/studies/:studyId/versions/:versionId/round-configs",
    { preHandler: allowParticipantOrStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);
      const configs = listRoundConfigs({ study_id: studyId, version_id: versionId });

      await writeAuditEvent({
        actor,
        action: "round.config.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: configs.length },
      });

      return reply.send({ round_configs: configs });
    },
  );

  app.get(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/config",
    { preHandler: allowParticipantOrStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const roundNumber = getRoundNumber(req.params);
      const actor = getActor(req);

      if (roundNumber === null) return reply.code(400).send({ error: "round_number_required" });

      const config = getRoundConfig({ study_id: studyId, version_id: versionId, round_number: roundNumber });

      await writeAuditEvent({
        actor,
        action: "round.config.get",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, round_number: roundNumber, found: Boolean(config) },
      });

      if (!config) return reply.code(404).send({ error: "round_config_not_found" });
      return reply.send({ round_config: config });
    },
  );

  app.patch(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/config",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const roundNumber = getRoundNumber(req.params);
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;

      if (roundNumber === null) return reply.code(400).send({ error: "round_number_required" });

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      if (!isRoundTaskType(body.task_type)) return reply.code(400).send({ error: "invalid_task_type" });
      if (!hasText(body.title)) return reply.code(400).send({ error: "title_required" });
      if (!hasText(body.prompt)) return reply.code(400).send({ error: "prompt_required" });
      if (!hasText(body.participant_instructions)) {
        return reply.code(400).send({ error: "participant_instructions_required" });
      }
      if (!hasText(body.reminder_subject)) return reply.code(400).send({ error: "reminder_subject_required" });
      if (!hasText(body.reminder_body)) return reply.code(400).send({ error: "reminder_body_required" });

      const responseWindowDays = Number(body.response_window_days ?? 7);
      if (!Number.isInteger(responseWindowDays) || responseWindowDays < 1 || responseWindowDays > 60) {
        return reply.code(400).send({ error: "invalid_response_window_days" });
      }

      if (roundNumber === 1 && body.task_type !== "open_text") {
        return reply.code(400).send({ error: "round1_must_be_open_text_for_current_setup" });
      }

      const existingConfig = getRoundConfig({ study_id: studyId, version_id: versionId, round_number: roundNumber });
      if (existingConfig?.status === "Open" || existingConfig?.status === "Closed") {
        await writeAuditEvent({
          actor,
          action: "round.feedback_config.update_blocked_locked",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: { studyId, versionId, round_number: roundNumber },
        });
        return reply.code(409).send({ error: "round_config_locked_after_open" });
      }

      if (body.status === "Open" || body.status === "Closed") {
        return reply.code(400).send({ error: "use_round_transition_endpoint" });
      }

      const config = upsertRoundConfig({
        study_id: studyId,
        version_id: versionId,
        round_number: roundNumber,
        task_type: body.task_type,
        title: body.title.trim(),
        prompt: body.prompt.trim(),
        participant_instructions: body.participant_instructions.trim(),
        response_window_days: responseWindowDays,
        reminder_subject: body.reminder_subject.trim(),
        reminder_body: body.reminder_body.trim(),
        controlled_feedback_enabled: Boolean(body.controlled_feedback_enabled),
        ai_curation_enabled: Boolean(body.ai_curation_enabled),
        feedback_config: normalizeFeedbackConfig(body.feedback_config, existingConfig?.feedback_config ?? null, roundNumber),
        status: body.status === "Ready" ? body.status : "Draft",
      });

      await writeAuditEvent({
        actor,
        action: "round.config.upsert",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, round_number: roundNumber, task_type: config.task_type },
      });

      if (roundNumber > 1) {
        await writeAuditEvent({
          actor,
          action: existingConfig?.feedback_config ? "round.feedback_config.update" : "round.feedback_config.create",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: {
            studyId,
            versionId,
            round_number: roundNumber,
            format: config.feedback_config?.format,
            show_participant_prior_response: config.feedback_config?.show_participant_prior_response,
            version_number: config.feedback_config?.version_number,
          },
        });
      }

      return reply.send({ round_config: config });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/open",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const roundNumber = getRoundNumber(req.params);
      const actor = getActor(req);

      if (roundNumber === null) return reply.code(400).send({ error: "round_number_required" });

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      if (studyVersion.status !== "Active") {
        return reply.code(409).send({ error: "study_version_not_active" });
      }

      if (!isAllowedConfiguredRound(studyVersion.study_format, roundNumber)) {
        return reply.code(409).send({
          error: "round_not_allowed_for_study_design",
          allowed_rounds: [1, ...getAllowedRatingRounds(studyVersion.study_format)],
        });
      }

      const config = getRoundConfig({ study_id: studyId, version_id: versionId, round_number: roundNumber });
      if (!config) return reply.code(409).send({ error: "round_config_required" });
      if (config.status === "Closed") {
        await writeAuditEvent({
          actor,
          action: "round.open_blocked_already_closed",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: { studyId, versionId, round_number: roundNumber },
        });

        return reply.code(409).send({ error: "round_already_closed" });
      }

      const openRound = listRoundConfigs({ study_id: studyId, version_id: versionId }).find(
        (entry) => entry.status === "Open" && entry.round_number !== roundNumber,
      );
      if (openRound) {
        return reply.code(409).send({
          error: "another_round_open",
          open_round_number: openRound.round_number,
        });
      }

      if (roundNumber > 1) {
        const previous = getRoundConfig({ study_id: studyId, version_id: versionId, round_number: roundNumber - 1 });
        if (!previous || previous.status !== "Closed") {
          await writeAuditEvent({
            actor,
            action: "round.open_blocked_previous_not_closed",
            object: { type: "study_version", id: `${studyId}:${versionId}` },
            details: {
              studyId,
              versionId,
              round_number: roundNumber,
              previous_round_number: roundNumber - 1,
              previous_round_status: previous?.status ?? null,
            },
          });

          return reply.code(409).send({ error: "previous_round_must_be_closed" });
        }

        const publishedTraceableItems = getPublishedTraceableItemsForRound({
          study_id: studyId,
          version_id: versionId,
          round_number: roundNumber,
        });
        if (publishedTraceableItems.length === 0) {
          await writeAuditEvent({
            actor,
            action: "round.open_blocked_published_traceable_items_required",
            object: { type: "study_version", id: `${studyId}:${versionId}` },
            details: { studyId, versionId, round_number: roundNumber },
          });

          return reply.code(409).send({ error: "published_traceable_items_required_for_round" });
        }
      }

      if (roundNumber === 1 && studyVersion.opened_round1_at === null) {
        await updateStudyVersion(versionId, { opened_round1_at: new Date().toISOString() });
      }

      const updated = updateRoundConfigStatus({
        study_id: studyId,
        version_id: versionId,
        round_number: roundNumber,
        status: "Open",
        locked_by_user_id: actor.userId,
      });

      await writeAuditEvent({
        actor,
        action: "round.open",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, round_number: roundNumber },
      });

      if (roundNumber > 1) {
        await writeAuditEvent({
          actor,
          action: "round.feedback_config.lock",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: {
            studyId,
            versionId,
            round_number: roundNumber,
            feedback_config_id: updated?.feedback_config?.feedback_config_id,
            locked_at: updated?.feedback_config?.locked_at,
          },
        });
      }

      const sms = await sendRoundOpenSmsNotifications({
        study_id: studyId,
        version_id: versionId,
        round_number: roundNumber,
        actor_user_id: actor.userId,
        frontend_origin: getFrontendOrigin(req),
      });

      return reply.send({ round_config: updated, sms });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/close",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const roundNumber = getRoundNumber(req.params);
      const actor = getActor(req);

      if (roundNumber === null) return reply.code(400).send({ error: "round_number_required" });

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      const config = getRoundConfig({ study_id: studyId, version_id: versionId, round_number: roundNumber });
      if (!config) return reply.code(409).send({ error: "round_config_required" });
      if (config.status === "Closed") return reply.code(409).send({ error: "round_already_closed" });
      if (config.status !== "Open") return reply.code(409).send({ error: "round_must_be_open_to_close" });

      const updated = updateRoundConfigStatus({
        study_id: studyId,
        version_id: versionId,
        round_number: roundNumber,
        status: "Closed",
      });

      await writeAuditEvent({
        actor,
        action: "round.close",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, round_number: roundNumber },
      });

      const finalResultSnapshot =
        roundNumber === studyVersion.terminal_round_number
          ? await createFinalResultSnapshot({
              studyId,
              versionId,
              terminalRoundNumber: roundNumber,
              createdByUserId: actor.userId,
            })
          : null;

      return reply.send({
        round_config: updated,
        ...(finalResultSnapshot ? { final_result_snapshot: finalResultSnapshot } : {}),
      });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/responses",
    { preHandler: allowSubmit },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const body = (req.body ?? {}) as Record<string, unknown>;

      const actor = getActor(req);

      if (!body.participant_id) {
        return reply.code(400).send({ error: "participant_id_required" });
      }

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      if (studyVersion.opened_round1_at === null) {
        await writeAuditEvent({
          actor,
          action: "response.submit_blocked_round1_not_open",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: {
            studyId,
            versionId,
            participant_id: String(body.participant_id),
          },
        });

        return reply.code(409).send({ error: "round1_not_open" });
      }

      const roundOneConfig = getRoundConfig({ study_id: studyId, version_id: versionId, round_number: 1 });
      if (!roundOneConfig) {
        return reply.code(409).send({ error: "round1_config_required" });
      }
      if (roundOneConfig.status !== "Open") {
        return reply.code(409).send({ error: "round1_not_open" });
      }

      const consentOk = hasActiveConsent({
        participant_id: String(body.participant_id),
        study_id: studyId,
        version_id: versionId,
      });

      if (!consentOk) {
        await writeAuditEvent({
          actor,
          action: "response.submit_blocked_no_active_consent",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: {
            studyId,
            versionId,
            participant_id: String(body.participant_id),
          },
        });

        return reply.code(403).send({ error: "active_consent_required" });
      }
      if (!participantCanSubmit({ study_id: studyId, version_id: versionId, participant_id: String(body.participant_id), round_number: 1 })) {
        return reply.code(403).send({ error: "participant_inactive_or_withdrawn_for_round" });
      }
      if (!hasOrientationCompletion({ study_id: studyId, version_id: versionId, participant_id: String(body.participant_id) })) {
        return reply.code(403).send({ error: "participant_orientation_required" });
      }

      const rec = createResponse({
        study_id: studyId,
        version_id: versionId,
        participant_id: String(body.participant_id),
        response_json: body.response_json ?? {},
      });

      await writeAuditEvent({
        actor,
        action: "response.submit",
        object: { type: "response", id: rec.response_id },
        details: { studyId, versionId, participant_id: rec.participant_id },
      });

      return reply.code(201).send({ response_id: rec.response_id });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/responses",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);

      const list = listResponses({ study_id: studyId, version_id: versionId });

      await writeAuditEvent({
        actor,
        action: "response.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: list.length },
      });

      return reply.send({ responses: list });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/response-summary",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);

      const list = listResponses({ study_id: studyId, version_id: versionId });
      const uniqueParticipantCount = new Set(list.map((r) => r.participant_id)).size;

      await writeAuditEvent({
        actor,
        action: "response.summary",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          response_count: list.length,
          unique_participant_count: uniqueParticipantCount,
        },
      });

      return reply.send({
        study_id: studyId,
        version_id: versionId,
        response_count: list.length,
        unique_participant_count: uniqueParticipantCount,
      });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/reminders/log",
    { preHandler: allowStaffRead },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;

      await writeAuditEvent({
        actor,
        action: "response.reminder_logged",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          channel: String(body.channel ?? "manual"),
          note: String(body.note ?? ""),
        },
      });

      return reply.code(201).send({
        ok: true,
        logged: true,
        study_id: studyId,
        version_id: versionId,
        channel: String(body.channel ?? "manual"),
      });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/items",
    { preHandler: allowParticipantOrStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const roundNumber = getRoundNumber(req.params);
      const actor = getActor(req);
      const query = (req.query ?? {}) as Record<string, unknown>;
      const participantId = query.participant_id ? String(query.participant_id) : "";

      if (roundNumber === null) {
        return reply.code(400).send({ error: "round_number_required" });
      }

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      if (roundNumber < 2) {
        return reply.code(400).send({ error: "rating_round_must_be_gte_2" });
      }

      if (!isAllowedRatingRound(studyVersion.study_format, roundNumber)) {
        return reply.code(409).send({
          error: "round_not_allowed_for_study_design",
          allowed_rounds: getAllowedRatingRounds(studyVersion.study_format),
        });
      }

      const roundConfig = getRoundConfig({ study_id: studyId, version_id: versionId, round_number: roundNumber });
      if (!roundConfig || roundConfig.status !== "Open") {
        return reply.code(409).send({ error: "round_not_open" });
      }

      const publishedItems = listItems({
        study_id: studyId,
        version_id: versionId,
      }).filter((item) => item.round_number === roundNumber && item.status === "Published");

      const responses = listResponses({ study_id: studyId, version_id: versionId });

      const items = publishedItems.map((item) => {
        const latestForItem = getLatestRatingsForItem(responses, item.item_id, roundNumber);
        const prior = participantId ? latestForItem.get(participantId) ?? null : null;

        let yourPriorResponse: { rating: number; action: "keep" | "revise"; submitted_at: string } | null = null;

        if (prior && isRatingRoundPayload(prior.response_json, roundNumber)) {
          yourPriorResponse = {
            rating: prior.response_json.rating,
            action: prior.response_json.action,
            submitted_at: prior.created_at,
          };
        }

        return {
          item_id: item.item_id,
          text: item.text,
          round_number: item.round_number,
          provenance_type: item.provenance_type,
          your_prior_response: yourPriorResponse,
          controlled_feedback: buildParticipantControlledFeedback({
            item,
            responses,
            roundNumber,
            participantId,
            feedbackConfig: roundConfig.feedback_config,
          }),
        };
      });

      await writeAuditEvent({
        actor,
        action: "round.items.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          round_number: roundNumber,
          count: items.length,
          participant_id: participantId,
        },
      });

      return reply.send({ items });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/ratings",
    { preHandler: allowSubmit },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const roundNumber = getRoundNumber(req.params);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const actor = getActor(req);

      if (roundNumber === null) {
        return reply.code(400).send({ error: "round_number_required" });
      }

      const participantId = String(body.participant_id ?? "");
      const itemId = String(body.item_id ?? "");
      const action = body.action === "keep" ? "keep" : "revise";
      const rationaleText =
        typeof body.rationale_text === "string"
          ? body.rationale_text.trim().slice(0, 4000)
          : "";

      if (!participantId) {
        return reply.code(400).send({ error: "participant_id_required" });
      }

      if (!itemId) {
        return reply.code(400).send({ error: "item_id_required" });
      }

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      if (roundNumber < 2) {
        return reply.code(400).send({ error: "rating_round_must_be_gte_2" });
      }

      if (!isAllowedRatingRound(studyVersion.study_format, roundNumber)) {
        return reply.code(409).send({
          error: "round_not_allowed_for_study_design",
          allowed_rounds: getAllowedRatingRounds(studyVersion.study_format),
        });
      }

      if (studyVersion.status !== "Active") {
        return reply.code(409).send({ error: "study_version_not_active" });
      }

      const roundConfig = getRoundConfig({ study_id: studyId, version_id: versionId, round_number: roundNumber });
      if (!roundConfig || roundConfig.status !== "Open") {
        return reply.code(409).send({ error: "round_not_open" });
      }

      const consentOk = hasActiveConsent({
        participant_id: participantId,
        study_id: studyId,
        version_id: versionId,
      });

      if (!consentOk) {
        await writeAuditEvent({
          actor,
          action: "round.rating_blocked_no_active_consent",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: {
            studyId,
            versionId,
            round_number: roundNumber,
            participant_id: participantId,
            item_id: itemId,
          },
        });

        return reply.code(403).send({ error: "active_consent_required" });
      }
      if (!participantCanSubmit({ study_id: studyId, version_id: versionId, participant_id: participantId, round_number: roundNumber })) {
        return reply.code(403).send({ error: "participant_inactive_or_withdrawn_for_round" });
      }

      const item = getItem(itemId);
      if (!item || item.study_id !== studyId || item.version_id !== versionId) {
        return reply.code(404).send({ error: "item_not_found" });
      }

      if (item.round_number !== roundNumber || item.status !== "Published") {
        return reply.code(409).send({ error: "item_not_available_for_round_rating" });
      }

      const allResponses = listResponses({ study_id: studyId, version_id: versionId });
      const prior = getLatestRatingsForItem(allResponses, itemId, roundNumber).get(participantId) ?? null;

      let rating: number;

      if (action === "keep") {
        if (!prior || !isRatingRoundPayload(prior.response_json, roundNumber)) {
          return reply.code(400).send({ error: "prior_rating_required_for_keep" });
        }

        rating = prior.response_json.rating;
      } else {
        const bodyRating = body.rating;

        if (typeof bodyRating !== "number" || !Number.isFinite(bodyRating)) {
          return reply.code(400).send({ error: "numeric_rating_required" });
        }

        rating = bodyRating;
      }

      const rec = createResponse({
        study_id: studyId,
        version_id: versionId,
        participant_id: participantId,
        response_json: {
          round_number: roundNumber,
          item_id: itemId,
          rating,
          action,
          ...(rationaleText ? { rationale_text: rationaleText } : {}),
        } satisfies RatingRoundPayload,
      });

      await writeAuditEvent({
        actor,
        action: action === "keep" ? "round.rating_keep" : "round.rating_revise",
        object: { type: "item", id: itemId },
        details: {
          studyId,
          versionId,
          round_number: roundNumber,
          participant_id: participantId,
          response_id: rec.response_id,
          rating,
        },
      });

      return reply.code(201).send({
        response_id: rec.response_id,
        participant_id: participantId,
        item_id: itemId,
        round_number: roundNumber,
        rating,
        action,
      });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/rounds/:roundNumber/items/:itemId/feedback",
    { preHandler: allowParticipantOrStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const roundNumber = getRoundNumber(req.params);
      const { itemId } = (req.params ?? {}) as { itemId?: string };
      const actor = getActor(req);
      const query = (req.query ?? {}) as Record<string, unknown>;
      const participantId = String(query.participant_id ?? "");

      if (roundNumber === null) {
        return reply.code(400).send({ error: "round_number_required" });
      }

      if (!itemId) {
        return reply.code(400).send({ error: "item_id_required" });
      }

      if (!participantId) {
        return reply.code(400).send({ error: "participant_id_required" });
      }

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      if (roundNumber < 2) {
        return reply.code(400).send({ error: "rating_round_must_be_gte_2" });
      }

      if (!isAllowedRatingRound(studyVersion.study_format, roundNumber)) {
        return reply.code(409).send({
          error: "round_not_allowed_for_study_design",
          allowed_rounds: getAllowedRatingRounds(studyVersion.study_format),
        });
      }

      const item = getItem(String(itemId));
      if (!item || item.study_id !== studyId || item.version_id !== versionId) {
        return reply.code(404).send({ error: "item_not_found" });
      }

      if (item.round_number !== roundNumber || item.status !== "Published") {
        return reply.code(409).send({ error: "item_not_available_for_round_feedback" });
      }

      const allResponses = listResponses({ study_id: studyId, version_id: versionId });
      const latestByParticipant = getLatestRatingsForItem(allResponses, String(itemId), roundNumber);

      const latestRatings = Array.from(latestByParticipant.values())
        .flatMap((response) => {
          if (!isRatingRoundPayload(response.response_json, roundNumber)) return [];
          return [response.response_json.rating];
        });

      const sorted = [...latestRatings].sort((a, b) => a - b);
      const medianValue = median(sorted);
      const q1 = percentileFromSorted(sorted, 0.25);
      const q3 = percentileFromSorted(sorted, 0.75);
      const minValue = sorted.length > 0 ? sorted[0] ?? null : null;
      const maxValue = sorted.length > 0 ? sorted[sorted.length - 1] ?? null : null;

      const prior = latestByParticipant.get(participantId) ?? null;

      let yourPriorResponse: { rating: number; action: "keep" | "revise"; submitted_at: string } | null = null;

      if (prior && isRatingRoundPayload(prior.response_json, roundNumber)) {
        yourPriorResponse = {
          rating: prior.response_json.rating,
          action: prior.response_json.action,
          submitted_at: prior.created_at,
        };
      }

      const distribution = buildDistribution(sorted);

      await writeAuditEvent({
        actor,
        action: "round.feedback_get",
        object: { type: "item", id: String(itemId) },
        details: {
          studyId,
          versionId,
          round_number: roundNumber,
          participant_id: participantId,
          response_count: sorted.length,
        },
      });

      return reply.send({
        item: {
          item_id: item.item_id,
          text: item.text,
          round_number: item.round_number,
        },
        feedback: {
          median: medianValue,
          dispersion: {
            min: minValue,
            max: maxValue,
            iqr: q1 !== null && q3 !== null ? q3 - q1 : null,
            q1,
            q3,
          },
          distribution,
          response_count: sorted.length,
        },
        your_prior_response: yourPriorResponse,
        actions: {
          primary: ["keep", "revise"],
        },
      });
    }
  );
}
