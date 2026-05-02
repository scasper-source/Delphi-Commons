import crypto from "node:crypto";
import { JsonCollection } from "../core/jsonCollection.js";
import { sha256Json } from "../studies/hash.js";

export type ItemStatus = "Draft" | "Published" | "Rejected";
export type ProvenanceType = "PanelDerived" | "LiteratureDerived";
export type CreatedFrom = "manual" | "ai";
export type ItemProvenanceSourceType = "response" | "item";

export type ItemProvenanceLink = {
  source_type: ItemProvenanceSourceType;
  source_id: string;
  source_round_number: number;
  excerpt: string | null;
};

export type ItemAIRevision = {
  suggestion_id: string;
  applied_at: string;
  applied_by_user_id: string;
  previous_text: string;
  revised_text: string;
  rationale: string;
};

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
  source_ai_suggestion_id: string | null;
  ai_provenance_links: ItemProvenanceLink[];
  ai_provenance_rationale: string | null;
  provenance_hash: string;
  ai_assisted_revisions: ItemAIRevision[];
};

type StoreShape = {
  items: ItemRecord[];
};

const itemDocuments = new JsonCollection<ItemRecord>("items");

function normalizeProvenanceLink(raw: Partial<ItemProvenanceLink>): ItemProvenanceLink | null {
  if (
    raw.source_type !== "response" &&
    raw.source_type !== "item"
  ) {
    return null;
  }

  if (typeof raw.source_id !== "string" || raw.source_id.trim() === "") {
    return null;
  }

  if (typeof raw.source_round_number !== "number" || !Number.isInteger(raw.source_round_number)) {
    return null;
  }

  return {
    source_type: raw.source_type,
    source_id: raw.source_id,
    source_round_number: raw.source_round_number,
    excerpt: typeof raw.excerpt === "string" ? raw.excerpt : null,
  };
}

function normalizeAIRevision(raw: Partial<ItemAIRevision>): ItemAIRevision | null {
  if (
    typeof raw.suggestion_id !== "string" ||
    raw.suggestion_id.trim() === "" ||
    typeof raw.applied_at !== "string" ||
    typeof raw.applied_by_user_id !== "string" ||
    typeof raw.previous_text !== "string" ||
    typeof raw.revised_text !== "string" ||
    typeof raw.rationale !== "string"
  ) {
    return null;
  }

  return {
    suggestion_id: raw.suggestion_id,
    applied_at: raw.applied_at,
    applied_by_user_id: raw.applied_by_user_id,
    previous_text: raw.previous_text,
    revised_text: raw.revised_text,
    rationale: raw.rationale,
  };
}

function normalizeItem(raw: Partial<ItemRecord>): ItemRecord | null {
  if (
    typeof raw.item_id !== "string" ||
    typeof raw.study_id !== "string" ||
    typeof raw.version_id !== "string" ||
    typeof raw.round_number !== "number" ||
    typeof raw.text !== "string" ||
    typeof raw.provenance_type !== "string" ||
    typeof raw.created_from !== "string" ||
    typeof raw.status !== "string" ||
    typeof raw.created_at !== "string" ||
    typeof raw.created_by_user_id !== "string"
  ) {
    return null;
  }

  return {
    item_id: raw.item_id,
    study_id: raw.study_id,
    version_id: raw.version_id,
    round_number: raw.round_number,
    text: raw.text,
    provenance_type: raw.provenance_type as ProvenanceType,
    created_from: raw.created_from as CreatedFrom,
    status: raw.status as ItemStatus,
    created_at: raw.created_at,
    created_by_user_id: raw.created_by_user_id,
    source_ai_suggestion_id:
      typeof raw.source_ai_suggestion_id === "string"
        ? raw.source_ai_suggestion_id
        : null,
    ai_provenance_links: Array.isArray(raw.ai_provenance_links)
      ? raw.ai_provenance_links.flatMap((link) => {
          const normalized = normalizeProvenanceLink(link);
          return normalized ? [normalized] : [];
        })
      : [],
    ai_provenance_rationale:
      typeof raw.ai_provenance_rationale === "string"
        ? raw.ai_provenance_rationale
        : null,
    provenance_hash:
      typeof raw.provenance_hash === "string"
        ? raw.provenance_hash
        : hashItemProvenance({
            provenance_type: raw.provenance_type as ProvenanceType,
            ai_provenance_links: Array.isArray(raw.ai_provenance_links)
              ? raw.ai_provenance_links.flatMap((link) => {
                  const normalized = normalizeProvenanceLink(link);
                  return normalized ? [normalized] : [];
                })
              : [],
            ai_provenance_rationale:
              typeof raw.ai_provenance_rationale === "string"
                ? raw.ai_provenance_rationale
                : null,
          }),
    ai_assisted_revisions: Array.isArray(raw.ai_assisted_revisions)
      ? raw.ai_assisted_revisions.flatMap((revision) => {
          const normalized = normalizeAIRevision(revision);
          return normalized ? [normalized] : [];
        })
      : [],
  };
}

export function hashItemProvenance(input: {
  provenance_type: ProvenanceType;
  ai_provenance_links: ItemProvenanceLink[];
  ai_provenance_rationale: string | null;
}): string {
  return sha256Json({
    provenance_type: input.provenance_type,
    provenance_links: [...input.ai_provenance_links].sort((a, b) =>
      `${a.source_type}:${a.source_round_number}:${a.source_id}`.localeCompare(
        `${b.source_type}:${b.source_round_number}:${b.source_id}`,
      ),
    ),
    rationale: input.ai_provenance_rationale ?? null,
  });
}

function loadStore(): StoreShape {
  return {
    items: itemDocuments
      .all()
      .flatMap((item) => {
          const normalized = normalizeItem(item);
          return normalized ? [normalized] : [];
        }),
  };
}

function saveStore(store: StoreShape): void {
  for (const item of store.items) {
    itemDocuments.set(item.item_id, item);
  }
}

export function createItem(input: {
  study_id: string;
  version_id: string;
  round_number: number;
  text: string;
  provenance_type: ProvenanceType;
  created_from: CreatedFrom;
  created_by_user_id: string;
  source_ai_suggestion_id?: string | null;
  ai_provenance_links?: ItemProvenanceLink[];
  ai_provenance_rationale?: string | null;
}): ItemRecord {
  const store = loadStore();

  const provenanceLinks = input.ai_provenance_links ?? [];
  const provenanceRationale = input.ai_provenance_rationale ?? null;

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
    source_ai_suggestion_id: input.source_ai_suggestion_id ?? null,
    ai_provenance_links: provenanceLinks,
    ai_provenance_rationale: provenanceRationale,
    provenance_hash: hashItemProvenance({
      provenance_type: input.provenance_type,
      ai_provenance_links: provenanceLinks,
      ai_provenance_rationale: provenanceRationale,
    }),
    ai_assisted_revisions: [],
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
    source_ai_suggestion_id: existing.source_ai_suggestion_id,
    ai_provenance_links: existing.ai_provenance_links,
    ai_provenance_rationale: existing.ai_provenance_rationale,
    provenance_hash: hashItemProvenance({
      provenance_type: patch.provenance_type ?? existing.provenance_type,
      ai_provenance_links: existing.ai_provenance_links,
      ai_provenance_rationale: existing.ai_provenance_rationale,
    }),
    ai_assisted_revisions: existing.ai_assisted_revisions,
  };

  store.items[idx] = updated;
  saveStore(store);
  return updated;
}

export function applyAIWordingRevision(input: {
  item_id: string;
  suggestion_id: string;
  revised_text: string;
  rationale: string;
  applied_by_user_id: string;
}): ItemRecord | null {
  const store = loadStore();
  const idx = store.items.findIndex((item) => item.item_id === input.item_id);
  if (idx < 0) return null;

  const existing = store.items[idx];
  if (!existing) return null;

  const revision: ItemAIRevision = {
    suggestion_id: input.suggestion_id,
    applied_at: new Date().toISOString(),
    applied_by_user_id: input.applied_by_user_id,
    previous_text: existing.text,
    revised_text: input.revised_text,
    rationale: input.rationale,
  };

  const updated: ItemRecord = {
    ...existing,
    text: input.revised_text,
    ai_assisted_revisions: [...existing.ai_assisted_revisions, revision],
  };

  store.items[idx] = updated;
  saveStore(store);
  return updated;
}
