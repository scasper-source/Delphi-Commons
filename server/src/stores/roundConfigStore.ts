/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "node:crypto";
import { JsonCollection } from "../core/jsonCollection.js";

export type RoundTaskType = "open_text" | "rating" | "ranking" | "confirmation";
export type FeedbackFormat = "distribution_only" | "distribution_summary" | "distribution_rationales";

export type FeedbackConfig = {
  feedback_config_id: string;
  version_number: number;
  format: FeedbackFormat;
  show_participant_prior_response: boolean;
  locked_at: string | null;
  locked_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type RoundConfig = {
  round_config_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
  task_type: RoundTaskType;
  title: string;
  prompt: string;
  participant_instructions: string;
  response_window_days: number;
  reminder_subject: string;
  reminder_body: string;
  controlled_feedback_enabled: boolean;
  ai_curation_enabled: boolean;
  feedback_config: FeedbackConfig | null;
  status: "Draft" | "Ready" | "Open" | "Closed";
  created_at: string;
  updated_at: string;
};

const roundConfigs = new JsonCollection<RoundConfig>("round_configs");

function roundConfigKey(input: Pick<RoundConfig, "study_id" | "version_id" | "round_number">): string {
  return `${input.study_id}:${input.version_id}:${input.round_number}`;
}

export function defaultFeedbackConfig(roundNumber: number): FeedbackConfig | null {
  if (roundNumber <= 1) return null;
  const now = new Date().toISOString();
  return {
    feedback_config_id: crypto.randomUUID(),
    version_number: 1,
    format: "distribution_only",
    show_participant_prior_response: true,
    locked_at: null,
    locked_by_user_id: null,
    created_at: now,
    updated_at: now,
  };
}

export function normalizeFeedbackConfig(input: unknown, existing: FeedbackConfig | null, roundNumber: number): FeedbackConfig | null {
  if (roundNumber <= 1) return null;
  const record = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const base = existing ?? defaultFeedbackConfig(roundNumber)!;
  const format = record.format === "distribution_summary" || record.format === "distribution_rationales" || record.format === "distribution_only"
    ? record.format
    : base.format;
  return {
    ...base,
    version_number: existing ? existing.version_number + 1 : base.version_number,
    format,
    show_participant_prior_response:
      typeof record.show_participant_prior_response === "boolean"
        ? record.show_participant_prior_response
        : base.show_participant_prior_response,
    updated_at: new Date().toISOString(),
  };
}

export function upsertRoundConfig(input: Omit<RoundConfig, "round_config_id" | "created_at" | "updated_at">): RoundConfig {
  const key = roundConfigKey(input);
  const existing = roundConfigs.get(key);
  const now = new Date().toISOString();

  if (existing) {
    return roundConfigs.set(key, {
      ...existing,
      ...input,
      round_config_id: existing.round_config_id,
      created_at: existing.created_at,
      feedback_config: input.feedback_config ?? existing.feedback_config ?? defaultFeedbackConfig(input.round_number),
      updated_at: now,
    });
  }

  return roundConfigs.insert(key, {
    ...input,
    round_config_id: crypto.randomUUID(),
    feedback_config: input.feedback_config ?? defaultFeedbackConfig(input.round_number),
    created_at: now,
    updated_at: now,
  });
}

export function getRoundConfig(filter: {
  study_id: string;
  version_id: string;
  round_number: number;
}): RoundConfig | null {
  return roundConfigs.get(roundConfigKey(filter));
}

export function listRoundConfigs(filter: { study_id: string; version_id: string }): RoundConfig[] {
  return roundConfigs
    .all()
    .filter((config) => config.study_id === filter.study_id && config.version_id === filter.version_id)
    .sort((a, b) => a.round_number - b.round_number);
}

export function updateRoundConfigStatus(filter: {
  study_id: string;
  version_id: string;
  round_number: number;
  status: RoundConfig["status"];
  locked_by_user_id?: string;
}): RoundConfig | null {
  return roundConfigs.update(roundConfigKey(filter), (existing) => ({
    ...existing,
    status: filter.status,
    feedback_config:
      filter.status === "Open" && existing.round_number > 1 && existing.feedback_config
        ? {
            ...existing.feedback_config,
            locked_at: existing.feedback_config.locked_at ?? new Date().toISOString(),
            locked_by_user_id: existing.feedback_config.locked_by_user_id ?? filter.locked_by_user_id ?? null,
            updated_at: new Date().toISOString(),
          }
        : existing.feedback_config,
    updated_at: new Date().toISOString(),
  }));
}
