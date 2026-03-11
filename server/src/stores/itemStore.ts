import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ItemStatus = "Draft" | "Published";
export type ProvenanceType = "PanelDerived" | "LiteratureDerived";
export type CreatedFrom = "manual" | "ai";

export type ItemRecord = {
  item_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
  text: string;
  provenance_type: ProvenanceType;
  created_from: CreatedFrom;
  status: ItemStatus;
  created_at: string;
  created_by_user_id: string;
};

type StoreShape = {
  items: ItemRecord[];
};

const STORE_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "data",
  "items",
  "items.json"
);

function ensureStore(): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const init: StoreShape = { items: [] };
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

export function createItem(input: {
  study_id: string;
  version_id: string;
  round_number: number;
  text: string;
  provenance_type: ProvenanceType;
  created_from: CreatedFrom;
  created_by_user_id: string;
}): ItemRecord {
  const store = loadStore();

  const rec: ItemRecord = {
    item_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    round_number: input.round_number,
    text: input.text,
    provenance_type: input.provenance_type,
    created_from: input.created_from,
    status: "Draft",
    created_at: new Date().toISOString(),
    created_by_user_id: input.created_by_user_id,
  };

  store.items.push(rec);
  saveStore(store);
  return rec;
}

export function listItems(filter: {
  study_id: string;
  version_id: string;
}): ItemRecord[] {
  const store = loadStore();
  return store.items.filter(
    (item) =>
      item.study_id === filter.study_id &&
      item.version_id === filter.version_id
  );
}

export function getItem(item_id: string): ItemRecord | null {
  const store = loadStore();
  return store.items.find((item) => item.item_id === item_id) ?? null;
}

export function updateItem(
  item_id: string,
  patch: Partial<Pick<ItemRecord, "text" | "status" | "provenance_type">>
): ItemRecord | null {
  const store = loadStore();
  const idx = store.items.findIndex((item) => item.item_id === item_id);
  if (idx < 0) return null;

  const existing = store.items[idx];
  if (!existing) return null;

  const updated: ItemRecord = {
    item_id: existing.item_id,
    study_id: existing.study_id,
    version_id: existing.version_id,
    round_number: existing.round_number,
    text: patch.text ?? existing.text,
    provenance_type: patch.provenance_type ?? existing.provenance_type,
    created_from: existing.created_from,
    status: patch.status ?? existing.status,
    created_at: existing.created_at,
    created_by_user_id: existing.created_by_user_id,
  };

  store.items[idx] = updated;
  saveStore(store);
  return updated;
}
