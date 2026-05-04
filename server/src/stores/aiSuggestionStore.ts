/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "node:crypto";
import type { StudyFormat, StudyVersionStatus } from "../studies/types.js";
import { sha256Json } from "../studies/hash.js";
import { JsonCollection } from "../core/jsonCollection.js";

export const AI_SUGGESTION_LABEL = "AI Suggestion (Not Final)";

export type AISuggestionFeature =
  | "cluster_r1"
  | "draft_items"
  | "inter_round_synthesis"
  | "lint_wording"
  | "irb_pack"
  | "controlled_feedback"
  | "operational_assistance";

export type AISuggestionDecision = "None" | "Accepted" | "Edited" | "Rejected";

export type StudyDesignSnapshot = {
  study_format: StudyFormat;
  planned_round_count: number;
  terminal_round_number: number;
  method_rationale: string;
  consensus_rule_json: unknown;
  config_hash: string;
  status_at_creation: StudyVersionStatus;
};

export type AISuggestionRecord = {
  suggestion_id: string;
  study_id: string;
  version_id: string;
  label: typeof AI_SUGGESTION_LABEL;
  feature: AISuggestionFeature;
  model_id: string;
  prompt_template_version: string;
  input_scope_ids: string[];
  output_json: unknown;
  output_hash: string;
  study_design_snapshot: StudyDesignSnapshot;
  created_by_user_id: string;
  created_by_role: string;
  created_at: string;
  decision: AISuggestionDecision;
  decided_by_user_id: string | null;
  decided_by_role: string | null;
  decided_at: string | null;
  decision_note: string | null;
  human_edited_output_json: unknown | null;
  human_edited_output_hash: string | null;
  resulting_object_ids: string[];
};

export type AISuggestionReleaseSignoff = {
  suggestion_id: string;
  required_role: "Owner" | "MethodsSteward";
  signed_by_user_id: string;
  signed_at: string;
  note?: string;
};

type StoreShape = {
  suggestions: AISuggestionRecord[];
  release_signoffs: AISuggestionReleaseSignoff[];
};

export type AISuggestionPublicationGate =
  | { ok: true }
  | {
      ok: false;
      error:
        | "ai_suggestion_not_found"
        | "ai_suggestion_decision_required"
        | "ai_suggestion_release_signoff_required";
      hasOwner?: boolean;
      hasMethodsSteward?: boolean;
    };

const suggestions = new JsonCollection<AISuggestionRecord>("ai_suggestions");
const releaseSignoffs = new JsonCollection<AISuggestionReleaseSignoff>("ai_release_signoffs");

function releaseSignoffKey(signoff: Pick<AISuggestionReleaseSignoff, "suggestion_id" | "required_role">): string {
  return `${signoff.suggestion_id}:${signoff.required_role}`;
}

function normalizeSuggestion(raw: Partial<AISuggestionRecord>): AISuggestionRecord | null {
  if (
    typeof raw.suggestion_id !== "string" ||
    typeof raw.study_id !== "string" ||
    typeof raw.version_id !== "string" ||
    typeof raw.feature !== "string" ||
    typeof raw.model_id !== "string" ||
    typeof raw.prompt_template_version !== "string" ||
    typeof raw.output_hash !== "string" ||
    typeof raw.created_by_user_id !== "string" ||
    typeof raw.created_by_role !== "string" ||
    typeof raw.created_at !== "string" ||
    !raw.study_design_snapshot
  ) {
    return null;
  }

  return {
    suggestion_id: raw.suggestion_id,
    study_id: raw.study_id,
    version_id: raw.version_id,
    label: AI_SUGGESTION_LABEL,
    feature: raw.feature as AISuggestionFeature,
    model_id: raw.model_id,
    prompt_template_version: raw.prompt_template_version,
    input_scope_ids: Array.isArray(raw.input_scope_ids)
      ? raw.input_scope_ids.map(String)
      : [],
    output_json: raw.output_json ?? null,
    output_hash: raw.output_hash,
    study_design_snapshot: raw.study_design_snapshot,
    created_by_user_id: raw.created_by_user_id,
    created_by_role: raw.created_by_role,
    created_at: raw.created_at,
    decision: raw.decision ?? "None",
    decided_by_user_id: raw.decided_by_user_id ?? null,
    decided_by_role: raw.decided_by_role ?? null,
    decided_at: raw.decided_at ?? null,
    decision_note: raw.decision_note ?? null,
    human_edited_output_json: raw.human_edited_output_json ?? null,
    human_edited_output_hash: raw.human_edited_output_hash ?? null,
    resulting_object_ids: Array.isArray(raw.resulting_object_ids)
      ? raw.resulting_object_ids.map(String)
      : [],
  };
}

function loadStore(): StoreShape {
  return {
    suggestions: suggestions
      .all()
      .flatMap((suggestion) => {
          const normalized = normalizeSuggestion(suggestion);
          return normalized ? [normalized] : [];
        }),
    release_signoffs: releaseSignoffs.all(),
  };
}

function saveStore(store: StoreShape): void {
  for (const suggestion of store.suggestions) {
    suggestions.set(suggestion.suggestion_id, suggestion);
  }
  for (const signoff of store.release_signoffs) {
    releaseSignoffs.set(releaseSignoffKey(signoff), signoff);
  }
}

export function createAISuggestion(input: {
  study_id: string;
  version_id: string;
  feature: AISuggestionFeature;
  model_id: string;
  prompt_template_version: string;
  input_scope_ids: string[];
  output_json: unknown;
  study_design_snapshot: StudyDesignSnapshot;
  created_by_user_id: string;
  created_by_role: string;
}): AISuggestionRecord {
  const store = loadStore();
  const outputHash = sha256Json(input.output_json);

  const rec: AISuggestionRecord = {
    suggestion_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    label: AI_SUGGESTION_LABEL,
    feature: input.feature,
    model_id: input.model_id,
    prompt_template_version: input.prompt_template_version,
    input_scope_ids: input.input_scope_ids,
    output_json: input.output_json,
    output_hash: outputHash,
    study_design_snapshot: input.study_design_snapshot,
    created_by_user_id: input.created_by_user_id,
    created_by_role: input.created_by_role,
    created_at: new Date().toISOString(),
    decision: "None",
    decided_by_user_id: null,
    decided_by_role: null,
    decided_at: null,
    decision_note: null,
    human_edited_output_json: null,
    human_edited_output_hash: null,
    resulting_object_ids: [],
  };

  store.suggestions.push(rec);
  saveStore(store);
  return rec;
}

export function listAISuggestions(filter: {
  study_id: string;
  version_id: string;
}): AISuggestionRecord[] {
  const store = loadStore();
  return store.suggestions.filter(
    (suggestion) =>
      suggestion.study_id === filter.study_id &&
      suggestion.version_id === filter.version_id
  );
}

export function getAISuggestion(suggestion_id: string): AISuggestionRecord | null {
  const store = loadStore();
  return store.suggestions.find((suggestion) => suggestion.suggestion_id === suggestion_id) ?? null;
}

export function decideAISuggestion(input: {
  suggestion_id: string;
  decision: Exclude<AISuggestionDecision, "None">;
  decided_by_user_id: string;
  decided_by_role: string;
  decision_note: string | null;
  human_edited_output_json: unknown | null;
  resulting_object_ids: string[];
}): AISuggestionRecord | null {
  const store = loadStore();
  const idx = store.suggestions.findIndex(
    (suggestion) => suggestion.suggestion_id === input.suggestion_id
  );
  if (idx < 0) return null;

  const existing = store.suggestions[idx];
  if (!existing) return null;

  const updated: AISuggestionRecord = {
    ...existing,
    decision: input.decision,
    decided_by_user_id: input.decided_by_user_id,
    decided_by_role: input.decided_by_role,
    decided_at: new Date().toISOString(),
    decision_note: input.decision_note,
    human_edited_output_json: input.human_edited_output_json,
    human_edited_output_hash:
      input.human_edited_output_json === null
        ? null
        : sha256Json(input.human_edited_output_json),
    resulting_object_ids: input.resulting_object_ids,
  };

  store.suggestions[idx] = updated;
  saveStore(store);
  return updated;
}

export function appendAISuggestionResultingObjectIds(
  suggestion_id: string,
  objectIds: string[]
): AISuggestionRecord | null {
  const store = loadStore();
  const idx = store.suggestions.findIndex(
    (suggestion) => suggestion.suggestion_id === suggestion_id
  );
  if (idx < 0) return null;

  const existing = store.suggestions[idx];
  if (!existing) return null;

  const seen = new Set(existing.resulting_object_ids);
  for (const id of objectIds) seen.add(id);

  const updated: AISuggestionRecord = {
    ...existing,
    resulting_object_ids: Array.from(seen),
  };

  store.suggestions[idx] = updated;
  saveStore(store);
  return updated;
}

export function upsertAISuggestionReleaseSignoff(input: {
  suggestion_id: string;
  required_role: "Owner" | "MethodsSteward";
  signed_by_user_id: string;
  note?: string;
}): AISuggestionReleaseSignoff {
  const store = loadStore();
  const idx = store.release_signoffs.findIndex(
    (signoff) =>
      signoff.suggestion_id === input.suggestion_id &&
      signoff.required_role === input.required_role
  );

  const base = {
    suggestion_id: input.suggestion_id,
    required_role: input.required_role,
    signed_by_user_id: input.signed_by_user_id,
    signed_at: new Date().toISOString(),
  };

  const signoff: AISuggestionReleaseSignoff =
    input.note === undefined || input.note.trim() === ""
      ? base
      : { ...base, note: input.note };

  if (idx >= 0) {
    store.release_signoffs[idx] = signoff;
  } else {
    store.release_signoffs.push(signoff);
  }

  saveStore(store);
  return signoff;
}

export function listAISuggestionReleaseSignoffs(
  suggestion_id: string
): AISuggestionReleaseSignoff[] {
  const store = loadStore();
  return store.release_signoffs.filter((signoff) => signoff.suggestion_id === suggestion_id);
}

export function getAISuggestionPublicationGate(input: {
  suggestion_id: string;
  study_id: string;
  version_id: string;
}): AISuggestionPublicationGate {
  const suggestion = getAISuggestion(input.suggestion_id);

  if (
    !suggestion ||
    suggestion.study_id !== input.study_id ||
    suggestion.version_id !== input.version_id
  ) {
    return { ok: false, error: "ai_suggestion_not_found" };
  }

  if (suggestion.decision !== "Accepted" && suggestion.decision !== "Edited") {
    return { ok: false, error: "ai_suggestion_decision_required" };
  }

  const signoffs = listAISuggestionReleaseSignoffs(input.suggestion_id);
  const hasOwner = signoffs.some((signoff) => signoff.required_role === "Owner");
  const hasMethodsSteward = signoffs.some(
    (signoff) => signoff.required_role === "MethodsSteward"
  );

  if (!hasOwner || !hasMethodsSteward) {
    return {
      ok: false,
      error: "ai_suggestion_release_signoff_required",
      hasOwner,
      hasMethodsSteward,
    };
  }

  return { ok: true };
}
