import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ResponseRecord = {
  response_id: string;

  study_id: string;
  version_id: string;

  // Linkage only — no identity fields allowed here.
  participant_id: string;

  // Flexible payload (Round 1 open text now; more later)
  response_json: unknown;

  created_at: string;
};

type StoreShape = {
  responses: ResponseRecord[];
};

const STORE_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "data",
  "responses",
  "responses.json"
);

function ensureStore(): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const init: StoreShape = { responses: [] };
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

export function createResponse(input: {
  study_id: string;
  version_id: string;
  participant_id: string;
  response_json: unknown;
}): ResponseRecord {
  const store = loadStore();

  const rec: ResponseRecord = {
    response_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    participant_id: input.participant_id,
    response_json: input.response_json,
    created_at: new Date().toISOString(),
  };

  store.responses.push(rec);
  saveStore(store);
  return rec;
}

export function listResponses(filter: { study_id: string; version_id: string }): ResponseRecord[] {
  const store = loadStore();
  return store.responses.filter(
    (r) => r.study_id === filter.study_id && r.version_id === filter.version_id
  );
}
