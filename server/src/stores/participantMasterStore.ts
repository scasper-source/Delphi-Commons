import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ParticipantMaster = {
  participant_id: string;

  // Identity fields live ONLY here (never in responses):
  name?: string;
  email?: string;

  created_at: string;
  created_by_user_id: string;
};

type StoreShape = {
  participants: Record<string, ParticipantMaster>;
};

const STORE_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "data",
  "identity",
  "participant_master.json"
);

function ensureStore(): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const init: StoreShape = { participants: {} };
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

export function createParticipantMaster(input: {
  name?: string;
  email?: string;
  created_by_user_id: string;
}): ParticipantMaster {
  const store = loadStore();

  const base: ParticipantMaster = {
    participant_id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    created_by_user_id: input.created_by_user_id,
  };

  const participant: ParticipantMaster = {
    ...base,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
  };

  store.participants[participant.participant_id] = participant;
  saveStore(store);
  return participant;
}

export function listParticipantMasters(): ParticipantMaster[] {
  const store = loadStore();
  return Object.values(store.participants);
}

export function getParticipantMaster(participant_id: string): ParticipantMaster | null {
  const store = loadStore();
  return store.participants[participant_id] ?? null;
}

export function updateParticipantMaster(
  participant_id: string,
  patch: { name?: string; email?: string }
): ParticipantMaster | null {
  const store = loadStore();
  const existing = store.participants[participant_id];
  if (!existing) return null;

  const updated: ParticipantMaster = {
    ...existing,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.email !== undefined ? { email: patch.email } : {}),
  };

  store.participants[participant_id] = updated;
  saveStore(store);
  return updated;
}
