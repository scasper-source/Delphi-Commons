import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type ConsentVersion = {
  consent_version_id: string;
  study_id: string;
  version_id: string;
  text_md: string;
  created_at: string;
  is_active: boolean;
};

export type ConsentRecord = {
  participant_id: string;
  study_id: string;
  version_id: string;
  consent_version_id: string;
  consented_at: string;
  withdrew_at: string | null;
};

type StoreShape = {
  consent_versions: ConsentVersion[];
  consent_records: ConsentRecord[];
};

const STORE_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "data",
  "consent",
  "consent.json"
);

function ensureStore(): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const init: StoreShape = { consent_versions: [], consent_records: [] };
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

export function createConsentVersion(input: {
  study_id: string;
  version_id: string;
  text_md: string;
}): ConsentVersion {
  const store = loadStore();

  const rec: ConsentVersion = {
    consent_version_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    text_md: input.text_md,
    created_at: new Date().toISOString(),
    is_active: false,
  };

  store.consent_versions.push(rec);
  saveStore(store);
  return rec;
}

export function listConsentVersions(filter: {
  study_id: string;
  version_id: string;
}): ConsentVersion[] {
  const store = loadStore();
  return store.consent_versions.filter(
    (v) => v.study_id === filter.study_id && v.version_id === filter.version_id
  );
}

export function activateConsentVersion(input: {
  study_id: string;
  version_id: string;
  consent_version_id: string;
}): ConsentVersion | null {
  const store = loadStore();

  const versions = store.consent_versions.filter(
    (v) => v.study_id === input.study_id && v.version_id === input.version_id
  );

  const target = versions.find((v) => v.consent_version_id === input.consent_version_id);
  if (!target) return null;

  for (const version of versions) {
    version.is_active = version.consent_version_id === input.consent_version_id;
  }

  saveStore(store);
  return target;
}

export function getActiveConsentVersion(filter: {
  study_id: string;
  version_id: string;
}): ConsentVersion | null {
  const store = loadStore();
  return (
    store.consent_versions.find(
      (v) =>
        v.study_id === filter.study_id &&
        v.version_id === filter.version_id &&
        v.is_active === true
    ) ?? null
  );
}

export function recordConsent(input: {
  participant_id: string;
  study_id: string;
  version_id: string;
  consent_version_id: string;
}): ConsentRecord {
  const store = loadStore();

  const existingIndex = store.consent_records.findIndex(
    (r) =>
      r.participant_id === input.participant_id &&
      r.study_id === input.study_id &&
      r.version_id === input.version_id
  );

  const rec: ConsentRecord = {
    participant_id: input.participant_id,
    study_id: input.study_id,
    version_id: input.version_id,
    consent_version_id: input.consent_version_id,
    consented_at: new Date().toISOString(),
    withdrew_at: null,
  };

  if (existingIndex >= 0) {
    store.consent_records[existingIndex] = rec;
  } else {
    store.consent_records.push(rec);
  }

  saveStore(store);
  return rec;
}

export function getConsentRecord(filter: {
  participant_id: string;
  study_id: string;
  version_id: string;
}): ConsentRecord | null {
  const store = loadStore();
  return (
    store.consent_records.find(
      (r) =>
        r.participant_id === filter.participant_id &&
        r.study_id === filter.study_id &&
        r.version_id === filter.version_id
    ) ?? null
  );
}

export function withdrawConsent(input: {
  participant_id: string;
  study_id: string;
  version_id: string;
}): ConsentRecord | null {
  const store = loadStore();

  const rec = store.consent_records.find(
    (r) =>
      r.participant_id === input.participant_id &&
      r.study_id === input.study_id &&
      r.version_id === input.version_id
  );

  if (!rec) return null;

  rec.withdrew_at = new Date().toISOString();
  saveStore(store);
  return rec;
}

export function hasActiveConsent(input: {
  participant_id: string;
  study_id: string;
  version_id: string;
}): boolean {
  const activeVersion = getActiveConsentVersion({
    study_id: input.study_id,
    version_id: input.version_id,
  });

  if (!activeVersion) return false;

  const record = getConsentRecord({
    participant_id: input.participant_id,
    study_id: input.study_id,
    version_id: input.version_id,
  });

  if (!record) return false;
  if (record.withdrew_at) return false;

  return record.consent_version_id === activeVersion.consent_version_id;
}
