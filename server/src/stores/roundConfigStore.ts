import crypto from "node:crypto";
import { JsonCollection } from "../core/jsonCollection.js";

export type RoundTaskType = "open_text" | "rating" | "ranking" | "confirmation";

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
  status: "Draft" | "Ready" | "Open" | "Closed";
  created_at: string;
  updated_at: string;
};

const roundConfigs = new JsonCollection<RoundConfig>("round_configs");

function roundConfigKey(input: Pick<RoundConfig, "study_id" | "version_id" | "round_number">): string {
  return `${input.study_id}:${input.version_id}:${input.round_number}`;
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
      updated_at: now,
    });
  }

  return roundConfigs.insert(key, {
    ...input,
    round_config_id: crypto.randomUUID(),
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
}): RoundConfig | null {
  return roundConfigs.update(roundConfigKey(filter), (existing) => ({
    ...existing,
    status: filter.status,
    updated_at: new Date().toISOString(),
  }));
}

