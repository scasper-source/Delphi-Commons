import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getDataDir } from "../core/paths.js";

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

type StoreShape = {
  roundConfigs: RoundConfig[];
};

const STORE_PATH = path.resolve(getDataDir(), "rounds", "round-configs.json");

function ensureStore(): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const init: StoreShape = { roundConfigs: [] };
    fs.writeFileSync(STORE_PATH, JSON.stringify(init, null, 2), "utf-8");
  }
}

function loadStore(): StoreShape {
  ensureStore();
  const raw = fs.readFileSync(STORE_PATH, "utf-8");
  return JSON.parse(raw) as StoreShape;
}

function saveStore(store: StoreShape): void {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export function upsertRoundConfig(input: Omit<RoundConfig, "round_config_id" | "created_at" | "updated_at">): RoundConfig {
  const store = loadStore();
  const now = new Date().toISOString();
  const idx = store.roundConfigs.findIndex(
    (config) =>
      config.study_id === input.study_id &&
      config.version_id === input.version_id &&
      config.round_number === input.round_number,
  );

  if (idx >= 0) {
    const existing = store.roundConfigs[idx];
    if (!existing) throw new Error("round_config_not_found");
    const updated: RoundConfig = {
      ...existing,
      ...input,
      round_config_id: existing.round_config_id,
      created_at: existing.created_at,
      updated_at: now,
    };
    store.roundConfigs[idx] = updated;
    saveStore(store);
    return updated;
  }

  const created: RoundConfig = {
    ...input,
    round_config_id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
  };
  store.roundConfigs.push(created);
  saveStore(store);
  return created;
}

export function getRoundConfig(filter: {
  study_id: string;
  version_id: string;
  round_number: number;
}): RoundConfig | null {
  const store = loadStore();
  return (
    store.roundConfigs.find(
      (config) =>
        config.study_id === filter.study_id &&
        config.version_id === filter.version_id &&
        config.round_number === filter.round_number,
    ) ?? null
  );
}

export function listRoundConfigs(filter: { study_id: string; version_id: string }): RoundConfig[] {
  const store = loadStore();
  return store.roundConfigs
    .filter((config) => config.study_id === filter.study_id && config.version_id === filter.version_id)
    .sort((a, b) => a.round_number - b.round_number);
}

export function updateRoundConfigStatus(filter: {
  study_id: string;
  version_id: string;
  round_number: number;
  status: RoundConfig["status"];
}): RoundConfig | null {
  const store = loadStore();
  const idx = store.roundConfigs.findIndex(
    (config) =>
      config.study_id === filter.study_id &&
      config.version_id === filter.version_id &&
      config.round_number === filter.round_number,
  );

  if (idx < 0) return null;

  const existing = store.roundConfigs[idx];
  if (!existing) return null;

  const updated: RoundConfig = {
    ...existing,
    status: filter.status,
    updated_at: new Date().toISOString(),
  };

  store.roundConfigs[idx] = updated;
  saveStore(store);
  return updated;
}
