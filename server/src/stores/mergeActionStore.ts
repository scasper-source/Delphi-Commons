import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type MergeActionRecord = {
  merge_id: string;
  study_id: string;
  version_id: string;
  from_item_ids: string[];
  to_item_id: string;
  rationale: string;
  actor_user_id: string;
  created_at: string;
};

export type SplitActionRecord = {
  split_id: string;
  study_id: string;
  version_id: string;
  source_item_id: string;
  new_item_ids: string[];
  rationale: string;
  actor_user_id: string;
  created_at: string;
};

type StoreShape = {
  merges: MergeActionRecord[];
  splits: SplitActionRecord[];
};

const STORE_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "data",
  "items",
  "merge_actions.json"
);

function ensureStore(): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const init: StoreShape = { merges: [], splits: [] };
    fs.writeFileSync(STORE_PATH, JSON.stringify(init, null, 2), "utf-8");
  }
}

function loadStore(): StoreShape {
  ensureStore();
  const raw = fs.readFileSync(STORE_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Partial<StoreShape>;
  return {
    merges: parsed.merges ?? [],
    splits: parsed.splits ?? [],
  };
}

function saveStore(store: StoreShape): void {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export function createMergeAction(input: {
  study_id: string;
  version_id: string;
  from_item_ids: string[];
  to_item_id: string;
  rationale: string;
  actor_user_id: string;
}): MergeActionRecord {
  const store = loadStore();

  const rec: MergeActionRecord = {
    merge_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    from_item_ids: input.from_item_ids,
    to_item_id: input.to_item_id,
    rationale: input.rationale,
    actor_user_id: input.actor_user_id,
    created_at: new Date().toISOString(),
  };

  store.merges.push(rec);
  saveStore(store);
  return rec;
}

export function listMergeActions(filter: {
  study_id: string;
  version_id: string;
}): MergeActionRecord[] {
  const store = loadStore();
  return store.merges.filter(
    (m) => m.study_id === filter.study_id && m.version_id === filter.version_id
  );
}

export function createSplitAction(input: {
  study_id: string;
  version_id: string;
  source_item_id: string;
  new_item_ids: string[];
  rationale: string;
  actor_user_id: string;
}): SplitActionRecord {
  const store = loadStore();

  const rec: SplitActionRecord = {
    split_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    source_item_id: input.source_item_id,
    new_item_ids: input.new_item_ids,
    rationale: input.rationale,
    actor_user_id: input.actor_user_id,
    created_at: new Date().toISOString(),
  };

  store.splits.push(rec);
  saveStore(store);
  return rec;
}

export function listSplitActions(filter: {
  study_id: string;
  version_id: string;
}): SplitActionRecord[] {
  const store = loadStore();
  return store.splits.filter(
    (s) => s.study_id === filter.study_id && s.version_id === filter.version_id
  );
}
