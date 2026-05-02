import type { FastifyInstance } from "fastify";
import {
  applyAIWordingRevision,
  createItem,
  getItem,
  listItems,
  type ItemProvenanceLink,
  type ItemRecord,
  type ProvenanceType,
} from "../stores/itemStore.js";
import { listResponses, type ResponseRecord } from "../stores/responseStore.js";
import {
  appendAISuggestionResultingObjectIds,
  createAISuggestion,
  decideAISuggestion,
  getAISuggestion,
  getAISuggestionPublicationGate,
  listAISuggestionReleaseSignoffs,
  listAISuggestions,
  upsertAISuggestionReleaseSignoff,
  type AISuggestionDecision,
  type AISuggestionFeature,
  type StudyDesignSnapshot,
} from "../stores/aiSuggestionStore.js";
import { getStudy, getStudyVersion } from "../studies/store.js";
import { requireRole, getActor } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";
import type { Study, StudyVersion } from "../studies/types.js";
import { recordExportManifest } from "../stores/exportManifestStore.js";

type ItemInput = {
  text: string;
  round_number: number;
  provenance_type: ProvenanceType;
  ai_provenance_links: ItemProvenanceLink[];
  ai_provenance_rationale: string | null;
};

type RatingRoundPayload = {
  round_number: number;
  item_id: string;
  rating: number;
  action: "keep" | "revise";
};

type SynthesisCandidate = {
  candidate_id: string;
  synthesis_kind: "cluster" | "singleton" | "carry_forward";
  text: string;
  round_number: number;
  provenance_type: ProvenanceType;
  provenance_links: ItemProvenanceLink[];
  rationale: string;
  requires_human_rationale: boolean;
};

type LintTarget = {
  target_id: string;
  target_type: "item" | "ad_hoc_text";
  text: string;
  item_id: string | null;
};

type LintFinding = {
  finding_id: string;
  target_id: string;
  target_type: "item" | "ad_hoc_text";
  item_id: string | null;
  original_text: string;
  severity: "info" | "warning";
  categories: Array<
    | "leading_or_coercive_language"
    | "double_barreled"
    | "ambiguity"
    | "embedded_scale_language"
  >;
  messages: string[];
  suggested_text: string | null;
  rationale: string;
};

type WordingChangeInput = {
  item_id: string;
  text: string;
  rationale: string;
};

type IRBPackSupplement = {
  panel_description: string;
  inclusion_criteria: string;
  recruitment_strategy: string;
  expected_time_commitment: string;
  response_window: string;
  contact_information: string;
  retention_summary: string;
  external_ai_disclosure: string;
};

const AI_FEATURES: AISuggestionFeature[] = [
  "cluster_r1",
  "draft_items",
  "inter_round_synthesis",
  "lint_wording",
  "irb_pack",
  "controlled_feedback",
  "operational_assistance",
];

function getStudyAndVersion(params: unknown): { studyId: string; versionId: string } {
  const p = (params ?? {}) as Record<string, unknown>;

  const studyId = String(
    p.studyId ?? p.study_id ?? p.studyid ?? p.STUDYID ?? p.study ?? ""
  );

  const versionId = String(
    p.versionId ??
      p.version_id ??
      p.versionid ??
      p.VERSIONID ??
      p.version ??
      p.id ??
      ""
  );

  return { studyId, versionId };
}

function getSuggestionId(params: unknown): string {
  const p = (params ?? {}) as Record<string, unknown>;
  return String(p.suggestionId ?? p.suggestion_id ?? "");
}

function isAISuggestionFeature(value: unknown): value is AISuggestionFeature {
  return typeof value === "string" && AI_FEATURES.includes(value as AISuggestionFeature);
}

function isDecision(value: unknown): value is Exclude<AISuggestionDecision, "None"> {
  return value === "Accepted" || value === "Edited" || value === "Rejected";
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).filter((entry) => entry.trim().length > 0);
}

function hasNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRatingRoundPayload(value: unknown): value is RatingRoundPayload {
  if (!value || typeof value !== "object") return false;

  const rec = value as Record<string, unknown>;

  return (
    typeof rec.round_number === "number" &&
    Number.isInteger(rec.round_number) &&
    typeof rec.item_id === "string" &&
    typeof rec.rating === "number" &&
    Number.isFinite(rec.rating) &&
    (rec.action === "keep" || rec.action === "revise")
  );
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function excerptText(value: string): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > 280 ? `${collapsed.slice(0, 277)}...` : collapsed;
}

function extractOpenResponseText(responseJson: unknown): string | null {
  if (hasNonEmptyText(responseJson)) return responseJson.trim();
  if (!responseJson || typeof responseJson !== "object") return null;

  const rec = responseJson as Record<string, unknown>;
  const keys = [
    "text",
    "response_text",
    "open_text",
    "answer",
    "statement",
    "comment",
    "comments",
    "rationale",
  ];

  for (const key of keys) {
    const value = rec[key];
    if (hasNonEmptyText(value)) return value.trim();
  }

  return null;
}

function getLockedStudyDesignSnapshot(
  studyVersion: StudyVersion
): StudyDesignSnapshot | null {
  if (studyVersion.status === "Draft") return null;
  if (!studyVersion.study_format) return null;
  if (studyVersion.planned_round_count === null) return null;
  if (studyVersion.terminal_round_number === null) return null;
  if (!hasNonEmptyText(studyVersion.method_rationale)) return null;
  if (studyVersion.consensus_rule_json === null) return null;
  if (!studyVersion.config_hash) return null;

  return {
    study_format: studyVersion.study_format,
    planned_round_count: studyVersion.planned_round_count,
    terminal_round_number: studyVersion.terminal_round_number,
    method_rationale: studyVersion.method_rationale.trim(),
    consensus_rule_json: studyVersion.consensus_rule_json,
    config_hash: studyVersion.config_hash,
    status_at_creation: studyVersion.status,
  };
}

function getRequiredReleaseRole(role: string): "Owner" | "MethodsSteward" | null {
  if (role === "owner") return "Owner";
  if (role === "methods_steward") return "MethodsSteward";
  return null;
}

function getTargetRoundNumber(value: unknown, designSnapshot: StudyDesignSnapshot): number | null {
  const rec = (value ?? {}) as Record<string, unknown>;
  const raw = rec.target_round_number ?? rec.round_number ?? 2;

  const targetRound =
    typeof raw === "number" && Number.isInteger(raw)
      ? raw
      : typeof raw === "string" && raw.trim() !== ""
        ? Number(raw)
        : null;

  if (
    targetRound === null ||
    !Number.isInteger(targetRound) ||
    targetRound < 2 ||
    targetRound > designSnapshot.terminal_round_number
  ) {
    return null;
  }

  return targetRound;
}

function sortResponses(responses: ResponseRecord[]): ResponseRecord[] {
  return [...responses].sort((a, b) => {
    const byCreated = a.created_at.localeCompare(b.created_at);
    if (byCreated !== 0) return byCreated;
    return a.response_id.localeCompare(b.response_id);
  });
}

function buildRound1SynthesisOutput(input: {
  responses: ResponseRecord[];
  target_round_number: number;
}) {
  const openResponses = sortResponses(input.responses)
    .filter((response) => !isRatingRoundPayload(response.response_json))
    .flatMap((response) => {
      const text = extractOpenResponseText(response.response_json);
      if (!text) return [];

      return [{
        response,
        text,
      }];
    });

  const groups = new Map<string, { text: string; responses: ResponseRecord[] }>();

  for (const entry of openResponses) {
    const key = normalizeText(entry.text);
    const existing = groups.get(key);

    if (existing) {
      existing.responses.push(entry.response);
    } else {
      groups.set(key, { text: entry.text, responses: [entry.response] });
    }
  }

  const candidates: SynthesisCandidate[] = Array.from(groups.values()).map((group, idx) => {
    const provenanceLinks: ItemProvenanceLink[] = group.responses.map((response) => ({
      source_type: "response",
      source_id: response.response_id,
      source_round_number: 1,
      excerpt: excerptText(group.text),
    }));

    const isCluster = provenanceLinks.length > 1;

    return {
      candidate_id: `r${input.target_round_number}-candidate-${idx + 1}`,
      synthesis_kind: isCluster ? "cluster" : "singleton",
      text: group.text,
      round_number: input.target_round_number,
      provenance_type: "PanelDerived",
      provenance_links: provenanceLinks,
      rationale: isCluster
        ? "Exact matching anonymized Round 1 responses were grouped; human review must confirm that the grouping preserves meaning."
        : "A distinct Round 1 response was preserved as its own candidate statement.",
      requires_human_rationale: isCluster,
    };
  });

  return {
    output: {
      schema_version: "inter_round_synthesis_v1",
      generated_by: "deterministic_mvp_synthesizer",
      source_round_number: 1,
      target_round_number: input.target_round_number,
      candidates,
      safeguards: {
        identity_fields_excluded: true,
        minority_statements_preserved: true,
        publication_requires_human_decision: true,
        participant_facing_release_requires_dual_signoff: true,
      },
    },
    inputScopeIds: openResponses.map((entry) => entry.response.response_id),
  };
}

function buildCarryForwardSynthesisOutput(input: {
  items: ItemRecord[];
  responses: ResponseRecord[];
  source_round_number: number;
  target_round_number: number;
}) {
  const sourceItems = [...input.items]
    .filter(
      (item) =>
        item.round_number === input.source_round_number &&
        item.status === "Published"
    )
    .sort((a, b) => {
      const byCreated = a.created_at.localeCompare(b.created_at);
      if (byCreated !== 0) return byCreated;
      return a.item_id.localeCompare(b.item_id);
    });

  const sortedResponses = sortResponses(input.responses);
  const inputScopeIds = new Set<string>();

  const candidates: SynthesisCandidate[] = sourceItems.map((item, idx) => {
    inputScopeIds.add(item.item_id);

    const ratingLinks: ItemProvenanceLink[] = sortedResponses.flatMap((response) => {
      if (!isRatingRoundPayload(response.response_json)) return [];
      if (response.response_json.round_number !== input.source_round_number) return [];
      if (response.response_json.item_id !== item.item_id) return [];

      inputScopeIds.add(response.response_id);

      return [{
        source_type: "response",
        source_id: response.response_id,
        source_round_number: input.source_round_number,
        excerpt: `rating=${response.response_json.rating}; action=${response.response_json.action}`,
      }];
    });

    const provenanceLinks: ItemProvenanceLink[] = [
      {
        source_type: "item",
        source_id: item.item_id,
        source_round_number: input.source_round_number,
        excerpt: excerptText(item.text),
      },
      ...ratingLinks,
    ];

    return {
      candidate_id: `r${input.target_round_number}-carry-forward-${idx + 1}`,
      synthesis_kind: "carry_forward",
      text: item.text,
      round_number: input.target_round_number,
      provenance_type: item.provenance_type,
      provenance_links: provenanceLinks,
      rationale: "Prior-round published item carried forward with anonymized rating-response provenance for human review.",
      requires_human_rationale: false,
    };
  });

  return {
    output: {
      schema_version: "inter_round_synthesis_v1",
      generated_by: "deterministic_mvp_synthesizer",
      source_round_number: input.source_round_number,
      target_round_number: input.target_round_number,
      candidates,
      safeguards: {
        identity_fields_excluded: true,
        minority_statements_preserved: true,
        publication_requires_human_decision: true,
        participant_facing_release_requires_dual_signoff: true,
      },
    },
    inputScopeIds: Array.from(inputScopeIds),
  };
}

function parseProvenanceLink(value: unknown): ItemProvenanceLink | null {
  if (!value || typeof value !== "object") return null;

  const rec = value as Record<string, unknown>;
  if (rec.source_type !== "response" && rec.source_type !== "item") return null;

  const sourceId = String(rec.source_id ?? "").trim();
  if (!sourceId) return null;

  const sourceRoundNumber =
    typeof rec.source_round_number === "number" && Number.isInteger(rec.source_round_number)
      ? rec.source_round_number
      : typeof rec.source_round_number === "string" && rec.source_round_number.trim() !== ""
        ? Number(rec.source_round_number)
        : null;

  if (
    sourceRoundNumber === null ||
    !Number.isInteger(sourceRoundNumber) ||
    sourceRoundNumber < 1
  ) {
    return null;
  }

  return {
    source_type: rec.source_type,
    source_id: sourceId,
    source_round_number: sourceRoundNumber,
    excerpt: hasNonEmptyText(rec.excerpt) ? excerptText(rec.excerpt) : null,
  };
}

function parseProvenanceLinks(value: unknown): ItemProvenanceLink[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;

  const links = value.flatMap((entry) => {
    const link = parseProvenanceLink(entry);
    return link ? [link] : [];
  });

  return links.length === value.length ? links : null;
}

function needsHumanRationale(links: ItemProvenanceLink[], explicit: unknown): boolean {
  if (explicit === true) return true;
  if (explicit === false) return false;

  const hasItemSource = links.some((link) => link.source_type === "item");
  const responseLinkCount = links.filter((link) => link.source_type === "response").length;
  return !hasItemSource && responseLinkCount > 1;
}

function linksAreInScope(links: ItemProvenanceLink[], scopeIds: Set<string>): boolean {
  return links.every((link) => scopeIds.has(link.source_id));
}

function parseItemInputs(
  value: unknown,
  terminalRoundNumber: number,
  allowedScopeIds: Set<string>
): ItemInput[] | null {
  const body = (value ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(body.items)
    ? body.items
    : hasNonEmptyText(body.text)
      ? [body]
      : [];

  if (rawItems.length === 0) return null;

  const items: ItemInput[] = [];

  for (const rawItem of rawItems) {
    const rec = (rawItem ?? {}) as Record<string, unknown>;

    if (!hasNonEmptyText(rec.text)) return null;

    const roundNumber =
      typeof rec.round_number === "number" && Number.isInteger(rec.round_number)
        ? rec.round_number
        : typeof rec.round_number === "string" && rec.round_number.trim() !== ""
          ? Number(rec.round_number)
          : 2;

    if (!Number.isInteger(roundNumber) || roundNumber < 2 || roundNumber > terminalRoundNumber) {
      return null;
    }

    const provenanceLinks = parseProvenanceLinks(
      rec.ai_provenance_links ?? rec.provenance_links
    );
    if (!provenanceLinks || !linksAreInScope(provenanceLinks, allowedScopeIds)) return null;

    const rationale = hasNonEmptyText(rec.ai_provenance_rationale)
      ? rec.ai_provenance_rationale.trim()
      : hasNonEmptyText(rec.rationale)
        ? rec.rationale.trim()
        : null;

    if (needsHumanRationale(provenanceLinks, rec.requires_human_rationale) && !rationale) {
      return null;
    }

    items.push({
      text: rec.text.trim(),
      round_number: roundNumber,
      provenance_type:
        rec.provenance_type === "LiteratureDerived" ? "LiteratureDerived" : "PanelDerived",
      ai_provenance_links: provenanceLinks,
      ai_provenance_rationale: rationale,
    });
  }

  return items;
}

function parseCandidate(value: unknown): SynthesisCandidate | null {
  if (!value || typeof value !== "object") return null;

  const rec = value as Record<string, unknown>;
  if (!hasNonEmptyText(rec.candidate_id)) return null;
  if (!hasNonEmptyText(rec.text)) return null;

  const roundNumber =
    typeof rec.round_number === "number" && Number.isInteger(rec.round_number)
      ? rec.round_number
      : typeof rec.round_number === "string" && rec.round_number.trim() !== ""
        ? Number(rec.round_number)
        : null;

  if (roundNumber === null || !Number.isInteger(roundNumber)) return null;

  const provenanceLinks = parseProvenanceLinks(rec.provenance_links);
  if (!provenanceLinks) return null;

  return {
    candidate_id: rec.candidate_id.trim(),
    synthesis_kind:
      rec.synthesis_kind === "cluster" ||
      rec.synthesis_kind === "singleton" ||
      rec.synthesis_kind === "carry_forward"
        ? rec.synthesis_kind
        : "singleton",
    text: rec.text.trim(),
    round_number: roundNumber,
    provenance_type:
      rec.provenance_type === "LiteratureDerived" ? "LiteratureDerived" : "PanelDerived",
    provenance_links: provenanceLinks,
    rationale: hasNonEmptyText(rec.rationale) ? rec.rationale.trim() : "",
    requires_human_rationale: rec.requires_human_rationale === true,
  };
}

function getEffectiveSuggestionOutput(suggestion: {
  decision: AISuggestionDecision;
  output_json: unknown;
  human_edited_output_json: unknown | null;
}): unknown {
  if (suggestion.decision === "Edited" && suggestion.human_edited_output_json !== null) {
    return suggestion.human_edited_output_json;
  }

  return suggestion.output_json;
}

function getCandidateInputsFromSuggestionOutput(input: {
  output_json: unknown;
  candidate_ids: string[];
  terminal_round_number: number;
  allowed_scope_ids: Set<string>;
  human_rationales: Record<string, string>;
}): ItemInput[] | null {
  if (!input.output_json || typeof input.output_json !== "object") return null;

  const output = input.output_json as Record<string, unknown>;
  if (!Array.isArray(output.candidates) || output.candidates.length === 0) return null;

  const candidates = output.candidates.flatMap((rawCandidate) => {
    const candidate = parseCandidate(rawCandidate);
    return candidate ? [candidate] : [];
  });

  if (candidates.length !== output.candidates.length) return null;

  const selectedIds = new Set(input.candidate_ids);
  const selected = candidates.filter((candidate) => selectedIds.has(candidate.candidate_id));

  if (selected.length !== selectedIds.size) return null;

  const items: ItemInput[] = [];

  for (const candidate of selected) {
    if (
      candidate.round_number < 2 ||
      candidate.round_number > input.terminal_round_number ||
      !linksAreInScope(candidate.provenance_links, input.allowed_scope_ids)
    ) {
      return null;
    }

    const humanRationale = input.human_rationales[candidate.candidate_id] ?? null;
    const storedRationale = humanRationale ?? candidate.rationale;

    if (candidate.requires_human_rationale && !humanRationale) {
      return null;
    }

    items.push({
      text: candidate.text,
      round_number: candidate.round_number,
      provenance_type: candidate.provenance_type,
      ai_provenance_links: candidate.provenance_links,
      ai_provenance_rationale: storedRationale || null,
    });
  }

  return items;
}

function getHumanRationales(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};

  const rec = value as Record<string, unknown>;
  const rawRationales = rec.rationales;
  if (!rawRationales || typeof rawRationales !== "object") return {};

  const out: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(rawRationales as Record<string, unknown>)) {
    if (hasNonEmptyText(rawValue)) out[key] = rawValue.trim();
  }

  return out;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceWord(text: string, word: string, replacement: string): string {
  return text.replace(new RegExp(`\\b${escapeRegex(word)}\\b`, "gi"), replacement);
}

function buildLintSuggestionText(text: string): string | null {
  let revised = text;
  const replacements: Array<[string, string]> = [
    ["obviously", ""],
    ["clearly", ""],
    ["must", "may need to"],
    ["should", "may benefit from"],
    ["always", "in some circumstances"],
    ["never", "may not"],
    ["required", "needed"],
    ["best", "appropriate"],
  ];

  for (const [word, replacement] of replacements) {
    revised = replaceWord(revised, word, replacement);
  }

  revised = revised.replace(/\s+/g, " ").replace(/\s+([,.!?;:])/g, "$1").trim();
  return revised !== text ? revised : null;
}

function findWords(text: string, words: string[]): string[] {
  const found: string[] = [];

  for (const word of words) {
    const pattern = new RegExp(`\\b${escapeRegex(word)}\\b`, "i");
    if (pattern.test(text)) found.push(word);
  }

  return found;
}

function lintTarget(target: LintTarget, idx: number): LintFinding | null {
  const categories: LintFinding["categories"] = [];
  const messages: string[] = [];

  const coerciveWords = findWords(target.text, [
    "should",
    "must",
    "obviously",
    "clearly",
    "always",
    "never",
    "required",
    "best",
  ]);

  if (coerciveWords.length > 0) {
    categories.push("leading_or_coercive_language");
    messages.push(
      `Potentially leading or coercive wording detected: ${coerciveWords.join(", ")}.`
    );
  }

  if (/\b(and|or)\b/i.test(target.text) && /[,;]/.test(target.text)) {
    categories.push("double_barreled");
    messages.push("The item may combine multiple concepts; consider splitting or narrowing it.");
  } else if (/\b(safe and effective|quality and safety|access and affordability|cost and quality)\b/i.test(target.text)) {
    categories.push("double_barreled");
    messages.push("The item may combine multiple concepts; consider splitting or narrowing it.");
  }

  const ambiguousWords = findWords(target.text, [
    "appropriate",
    "adequate",
    "timely",
    "regular",
    "sufficient",
    "stakeholders",
    "as needed",
    "often",
  ]);

  if (ambiguousWords.length > 0) {
    categories.push("ambiguity");
    messages.push(
      `Potentially ambiguous wording detected: ${ambiguousWords.join(", ")}.`
    );
  }

  if (/\b(1\s*-\s*10|strongly agree|agree\/disagree|satisfaction|frequency scale|rate from)\b/i.test(target.text)) {
    categories.push("embedded_scale_language");
    messages.push(
      "The item appears to embed scale language; keep scale instructions separate from the item statement."
    );
  }

  if (categories.length === 0) return null;

  const uniqueCategories = Array.from(new Set(categories));

  return {
    finding_id: `lint-${idx + 1}`,
    target_id: target.target_id,
    target_type: target.target_type,
    item_id: target.item_id,
    original_text: target.text,
    severity: uniqueCategories.includes("leading_or_coercive_language")
      ? "warning"
      : "info",
    categories: uniqueCategories,
    messages,
    suggested_text: buildLintSuggestionText(target.text),
    rationale:
      "This deterministic linter flags wording for human review only; it does not decide whether the item is valid or publishable.",
  };
}

function parseLintTargets(input: {
  body: Record<string, unknown>;
  study_id: string;
  version_id: string;
}): LintTarget[] | null {
  const itemIds = getStringArray(input.body.item_ids);
  const targets: LintTarget[] = [];

  for (const itemId of itemIds) {
    const item = getItem(itemId);
    if (!item || item.study_id !== input.study_id || item.version_id !== input.version_id) {
      return null;
    }

    targets.push({
      target_id: item.item_id,
      target_type: "item",
      text: item.text,
      item_id: item.item_id,
    });
  }

  const rawTexts = Array.isArray(input.body.texts)
    ? input.body.texts
    : hasNonEmptyText(input.body.text)
      ? [input.body.text]
      : [];

  rawTexts.forEach((rawText, idx) => {
    if (hasNonEmptyText(rawText)) {
      targets.push({
        target_id: `ad_hoc_text_${idx + 1}`,
        target_type: "ad_hoc_text",
        text: rawText.trim(),
        item_id: null,
      });
    } else if (rawText && typeof rawText === "object") {
      const rec = rawText as Record<string, unknown>;
      if (hasNonEmptyText(rec.text)) {
        targets.push({
          target_id: hasNonEmptyText(rec.target_id)
            ? rec.target_id.trim()
            : `ad_hoc_text_${idx + 1}`,
          target_type: "ad_hoc_text",
          text: rec.text.trim(),
          item_id: null,
        });
      }
    }
  });

  return targets.length > 0 ? targets : null;
}

function buildNeutralityLintOutput(targets: LintTarget[]) {
  const findings = targets.flatMap((target, idx) => {
    const finding = lintTarget(target, idx);
    return finding ? [finding] : [];
  });

  return {
    schema_version: "neutrality_lint_v1",
    generated_by: "deterministic_mvp_neutrality_linter",
    checks: [
      "leading_or_coercive_language",
      "double_barreled",
      "ambiguity",
      "embedded_scale_language",
    ],
    findings,
    summary: {
      target_count: targets.length,
      flagged_count: findings.length,
      clean_count: targets.length - findings.length,
    },
    safeguards: {
      suggestions_are_optional: true,
      linter_is_not_methodological_authority: true,
      publication_requires_human_decision: true,
      participant_facing_release_requires_dual_signoff: true,
    },
  };
}

function parseWordingChanges(value: unknown): WordingChangeInput[] | null {
  const body = (value ?? {}) as Record<string, unknown>;
  const rawChanges = Array.isArray(body.changes)
    ? body.changes
    : hasNonEmptyText(body.item_id) && hasNonEmptyText(body.text)
      ? [body]
      : [];

  if (rawChanges.length === 0) return null;

  const changes: WordingChangeInput[] = [];

  for (const rawChange of rawChanges) {
    if (!rawChange || typeof rawChange !== "object") return null;

    const rec = rawChange as Record<string, unknown>;
    if (!hasNonEmptyText(rec.item_id)) return null;
    if (!hasNonEmptyText(rec.text)) return null;
    if (!hasNonEmptyText(rec.rationale)) return null;

    changes.push({
      item_id: rec.item_id.trim(),
      text: rec.text.trim(),
      rationale: rec.rationale.trim(),
    });
  }

  return changes;
}

function getSupplementText(
  body: Record<string, unknown>,
  key: keyof IRBPackSupplement,
  fallback: string
): string {
  const value = body[key];
  return hasNonEmptyText(value) ? value.trim() : fallback;
}

function getIRBPackSupplement(body: Record<string, unknown>): IRBPackSupplement {
  return {
    panel_description: getSupplementText(
      body,
      "panel_description",
      "[Draft placeholder: describe the expert panel and relevant expertise criteria.]"
    ),
    inclusion_criteria: getSupplementText(
      body,
      "inclusion_criteria",
      "[Draft placeholder: list inclusion and exclusion criteria for panelists.]"
    ),
    recruitment_strategy: getSupplementText(
      body,
      "recruitment_strategy",
      "[Draft placeholder: describe recruitment channels, sampling approach, and any diversity or balance considerations.]"
    ),
    expected_time_commitment: getSupplementText(
      body,
      "expected_time_commitment",
      "[Draft placeholder: estimate time per round and total expected participation time.]"
    ),
    response_window: getSupplementText(
      body,
      "response_window",
      "[Draft placeholder: state response windows, deadline expectations, and reminder approach.]"
    ),
    contact_information: getSupplementText(
      body,
      "contact_information",
      "[Draft placeholder: provide study team contact details for questions, withdrawal, and concerns.]"
    ),
    retention_summary: getSupplementText(
      body,
      "retention_summary",
      "[Draft placeholder: summarize retention period, deletion limits, and access governance.]"
    ),
    external_ai_disclosure: getSupplementText(
      body,
      "external_ai_disclosure",
      "No external AI connector is described in this draft. If external processing is enabled later, the study materials must disclose what data is sent, to whom, and under what controls."
    ),
  };
}

function renderJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildIRBPackOutput(input: {
  study: Study;
  studyVersion: StudyVersion;
  designSnapshot: StudyDesignSnapshot;
  supplement: IRBPackSupplement;
}) {
  const studyTitle = input.study.title || "Untitled Study";
  const studyDescription = input.study.description || "[Draft placeholder: add study purpose and background.]";

  const roundDescription =
    input.designSnapshot.study_format === "ModifiedDelphi"
      ? "This modified Delphi design uses Round 1 open-ended collection followed by later rating rounds through Round 3."
      : "This classic Delphi design uses Round 1 open-ended collection followed by later rating rounds through Round 4.";

  const consensusRuleText = renderJson(input.designSnapshot.consensus_rule_json);
  const retentionPolicyText =
    input.studyVersion.retention_policy_json === null
      ? input.supplement.retention_summary
      : renderJson(input.studyVersion.retention_policy_json);

  return {
    schema_version: "irb_pack_v1",
    generated_by: "deterministic_mvp_irb_pack_generator",
    document_label: "AI Suggestion (Not Final) - IRB Pack Draft",
    draft_status: "draft_requires_human_review",
    official_use_gate: {
      requires_human_decision: true,
      accepted_or_edited_required: true,
      owner_and_methods_steward_release_signoff_required: true,
      official_export_route_required: true,
    },
    study: {
      study_id: input.study.id,
      title: studyTitle,
      description: studyDescription,
      created_by: input.study.created_by,
      created_at: input.study.created_at,
    },
    study_version: {
      version_id: input.studyVersion.id,
      version_number: input.studyVersion.version_number,
      status: input.studyVersion.status,
      config_hash: input.designSnapshot.config_hash,
    },
    methods_snapshot: {
      study_format: input.designSnapshot.study_format,
      planned_round_count: input.designSnapshot.planned_round_count,
      terminal_round_number: input.designSnapshot.terminal_round_number,
      method_rationale: input.designSnapshot.method_rationale,
      consensus_rule_json: input.designSnapshot.consensus_rule_json,
      feedback_config_json: input.studyVersion.feedback_config_json,
      retention_policy_json: input.studyVersion.retention_policy_json,
    },
    protocol_draft: {
      title: studyTitle,
      purpose: studyDescription,
      design:
        `${roundDescription} The study designer declared this method before Round 1 opened. The software records and enforces that human choice rather than selecting the method automatically.`,
      procedures:
        `Participants will be invited with unique participant IDs. Round 1 collects open-ended responses. Later rounds present curated statements for rating and neutral feedback according to the locked study design. The planned number of rounds is ${input.designSnapshot.planned_round_count}, with terminal round ${input.designSnapshot.terminal_round_number}.`,
      consensus_plan:
        `Consensus will be evaluated using the locked StudyVersion rule: ${consensusRuleText}. Reports must preserve both consensus and non-consensus items, and consensus does not imply correctness.`,
      panel_description: input.supplement.panel_description,
      inclusion_criteria: input.supplement.inclusion_criteria,
      recruitment_strategy: input.supplement.recruitment_strategy,
      participant_burden:
        `Expected time commitment: ${input.supplement.expected_time_commitment} Response windows/reminders: ${input.supplement.response_window}`,
      risks:
        "Primary risks include possible discomfort from professional judgment tasks, loss of confidentiality, and re-identification risk in small or specialized expert panels. The platform separates participant identity data from response records, but separation reduces rather than eliminates re-identification risk.",
      benefits:
        "Participants may not receive direct benefit. The study may produce structured expert input for the research question described above.",
      confidentiality:
        "Participant identity information is stored separately from response records. Staff access should be role-limited and audited. Reports and feedback should avoid unnecessary direct identifiers and should use aggregate or anonymized material where feasible.",
      withdrawal:
        "Participants may withdraw from future participation. Withdrawal blocks future submissions. Prior submitted materials may remain in the study record unless the approved protocol and retention policy specify additional deletion handling.",
      data_retention: retentionPolicyText,
      ai_assistance:
        `AI assistance, when used, is limited to draft generation, organization, wording review, and administrative support. AI suggestions are non-binding and require human accept/edit/reject decisions before use. ${input.supplement.external_ai_disclosure}`,
    },
    consent_materials_draft: {
      heading: "Participant Information and Consent - Draft",
      study_overview: studyDescription,
      procedures:
        `You are being invited to participate in a ${input.designSnapshot.study_format} Delphi study with ${input.designSnapshot.planned_round_count} planned rounds. The final planned round is Round ${input.designSnapshot.terminal_round_number}.`,
      time_commitment: input.supplement.expected_time_commitment,
      feedback_between_rounds:
        "Later rounds may show neutral feedback such as medians, dispersion, distributions, and your prior response. Feedback is not intended to pressure you to change your view.",
      confidentiality_and_anonymity:
        "Your identity is stored separately from response records where feasible. However, because Delphi panels may be small or specialized, responses may still be inferable. The study team will take steps to reduce re-identification risk, but full anonymity cannot be guaranteed.",
      voluntary_participation:
        "Participation is voluntary. You may decline to answer any item and may withdraw from future participation.",
      ai_notice:
        "AI tools may assist study staff in drafting or organizing materials, but humans decide what is used. AI will not decide your responses or determine consensus.",
      contact_information: input.supplement.contact_information,
    },
    recruitment_materials_draft: {
      invitation_summary:
        `You are invited to participate in "${studyTitle}", a ${input.designSnapshot.study_format} Delphi study.`,
      expertise_basis: input.supplement.panel_description,
      what_participation_involves:
        `Participation involves ${input.designSnapshot.planned_round_count} planned rounds, including an open-ended first round and later rating rounds.`,
      time_and_deadlines:
        `Estimated time: ${input.supplement.expected_time_commitment} Response windows: ${input.supplement.response_window}`,
      voluntary_language:
        "Participation is voluntary, and choosing not to participate will not affect your relationship with the study team.",
    },
    reviewer_checklist: [
      "Confirm Delphi is suitable for the research question.",
      "Confirm ModifiedDelphi or ClassicDelphi choice and rationale are accurate.",
      "Confirm planned rounds, terminal round, and consensus rule match the approved protocol.",
      "Add panel inclusion/exclusion criteria and recruitment details.",
      "Confirm time commitment, response windows, reminders, and attrition disclosure.",
      "Confirm anonymity-risk language is truthful for the actual panel size and setting.",
      "Confirm retention policy and withdrawal handling.",
      "Confirm whether external AI processing is disabled or explicitly disclosed.",
      "Confirm Owner and MethodsSteward signoff before official use.",
    ],
    safeguards: {
      draft_not_final: true,
      human_review_required: true,
      consensus_does_not_imply_correctness: true,
      no_ai_method_selection: true,
      participant_facing_release_requires_dual_signoff: true,
    },
  };
}

export async function aiRoutes(app: FastifyInstance) {
  const allowStaff = requireRole(["owner", "methods_steward"]);

  app.post(
    "/studies/:studyId/versions/:versionId/ai/suggestions",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const actor = getActor(req);

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      const designSnapshot = getLockedStudyDesignSnapshot(studyVersion);
      if (!designSnapshot) {
        await writeAuditEvent({
          actor,
          action: "ai.suggestion_create_blocked_design_not_locked",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: { studyId, versionId, status: studyVersion.status },
        });

        return reply.code(409).send({ error: "locked_study_design_required_for_ai" });
      }

      if (!isAISuggestionFeature(body.feature)) {
        return reply.code(400).send({
          error: "invalid_ai_feature",
          allowed_features: AI_FEATURES,
        });
      }

      if (!hasNonEmptyText(body.model_id)) {
        return reply.code(400).send({ error: "model_id_required" });
      }

      if (!hasNonEmptyText(body.prompt_template_version)) {
        return reply.code(400).send({ error: "prompt_template_version_required" });
      }

      if (!Object.hasOwn(body, "output_json")) {
        return reply.code(400).send({ error: "output_json_required" });
      }

      const suggestion = createAISuggestion({
        study_id: studyId,
        version_id: versionId,
        feature: body.feature,
        model_id: body.model_id.trim(),
        prompt_template_version: body.prompt_template_version.trim(),
        input_scope_ids: getStringArray(body.input_scope_ids),
        output_json: body.output_json,
        study_design_snapshot: designSnapshot,
        created_by_user_id: actor.userId,
        created_by_role: actor.role,
      });

      await writeAuditEvent({
        actor,
        action: "ai.suggestion.create",
        object: { type: "ai_suggestion", id: suggestion.suggestion_id },
        details: {
          studyId,
          versionId,
          feature: suggestion.feature,
          model_id: suggestion.model_id,
          prompt_template_version: suggestion.prompt_template_version,
          input_scope_ids: suggestion.input_scope_ids,
          output_hash: suggestion.output_hash,
          config_hash: suggestion.study_design_snapshot.config_hash,
        },
      });

      return reply.code(201).send({
        suggestion,
        release_signoffs: [],
      });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/ai/synthesize-inter-round",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const actor = getActor(req);

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      const designSnapshot = getLockedStudyDesignSnapshot(studyVersion);
      if (!designSnapshot) {
        await writeAuditEvent({
          actor,
          action: "ai.synthesis_blocked_design_not_locked",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: { studyId, versionId, status: studyVersion.status },
        });

        return reply.code(409).send({ error: "locked_study_design_required_for_ai" });
      }

      const targetRoundNumber = getTargetRoundNumber(body, designSnapshot);
      if (targetRoundNumber === null) {
        return reply.code(400).send({
          error: "invalid_target_round_number",
          allowed_min: 2,
          allowed_max: designSnapshot.terminal_round_number,
        });
      }

      const responses = listResponses({ study_id: studyId, version_id: versionId });
      const synthesis =
        targetRoundNumber === 2
          ? buildRound1SynthesisOutput({
              responses,
              target_round_number: targetRoundNumber,
            })
          : buildCarryForwardSynthesisOutput({
              items: listItems({ study_id: studyId, version_id: versionId }),
              responses,
              source_round_number: targetRoundNumber - 1,
              target_round_number: targetRoundNumber,
            });

      if (synthesis.output.candidates.length === 0) {
        await writeAuditEvent({
          actor,
          action: "ai.synthesis_blocked_no_source_material",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: {
            studyId,
            versionId,
            target_round_number: targetRoundNumber,
          },
        });

        return reply.code(409).send({ error: "source_material_required_for_synthesis" });
      }

      const suggestion = createAISuggestion({
        study_id: studyId,
        version_id: versionId,
        feature: "inter_round_synthesis",
        model_id: hasNonEmptyText(body.model_id)
          ? body.model_id.trim()
          : "deterministic-mvp-synthesizer",
        prompt_template_version: hasNonEmptyText(body.prompt_template_version)
          ? body.prompt_template_version.trim()
          : "inter_round_synthesis_v1",
        input_scope_ids: synthesis.inputScopeIds,
        output_json: synthesis.output,
        study_design_snapshot: designSnapshot,
        created_by_user_id: actor.userId,
        created_by_role: actor.role,
      });

      await writeAuditEvent({
        actor,
        action: "ai.suggestion.synthesize_inter_round",
        object: { type: "ai_suggestion", id: suggestion.suggestion_id },
        details: {
          studyId,
          versionId,
          source_round_number: synthesis.output.source_round_number,
          target_round_number: synthesis.output.target_round_number,
          candidate_count: synthesis.output.candidates.length,
          input_scope_ids: synthesis.inputScopeIds,
          output_hash: suggestion.output_hash,
          config_hash: suggestion.study_design_snapshot.config_hash,
        },
      });

      return reply.code(201).send({
        suggestion,
        release_signoffs: [],
      });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/ai/lint-wording",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const actor = getActor(req);

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      const designSnapshot = getLockedStudyDesignSnapshot(studyVersion);
      if (!designSnapshot) {
        await writeAuditEvent({
          actor,
          action: "ai.lint_blocked_design_not_locked",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: { studyId, versionId, status: studyVersion.status },
        });

        return reply.code(409).send({ error: "locked_study_design_required_for_ai" });
      }

      const targets = parseLintTargets({
        body,
        study_id: studyId,
        version_id: versionId,
      });

      if (!targets) {
        return reply.code(400).send({
          error: "lint_targets_required",
          note: "Provide item_ids[] for existing items, or text/texts for ad hoc wording review.",
        });
      }

      const output = buildNeutralityLintOutput(targets);
      const suggestion = createAISuggestion({
        study_id: studyId,
        version_id: versionId,
        feature: "lint_wording",
        model_id: hasNonEmptyText(body.model_id)
          ? body.model_id.trim()
          : "deterministic-mvp-neutrality-linter",
        prompt_template_version: hasNonEmptyText(body.prompt_template_version)
          ? body.prompt_template_version.trim()
          : "neutrality_lint_v1",
        input_scope_ids: targets.map((target) => target.target_id),
        output_json: output,
        study_design_snapshot: designSnapshot,
        created_by_user_id: actor.userId,
        created_by_role: actor.role,
      });

      await writeAuditEvent({
        actor,
        action: "ai.suggestion.lint_wording",
        object: { type: "ai_suggestion", id: suggestion.suggestion_id },
        details: {
          studyId,
          versionId,
          target_count: output.summary.target_count,
          flagged_count: output.summary.flagged_count,
          input_scope_ids: suggestion.input_scope_ids,
          output_hash: suggestion.output_hash,
          config_hash: suggestion.study_design_snapshot.config_hash,
        },
      });

      return reply.code(201).send({
        suggestion,
        release_signoffs: [],
      });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/ai/generate-irb-pack",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const actor = getActor(req);

      const study = await getStudy(studyId);
      if (!study) {
        return reply.code(404).send({ error: "study_not_found" });
      }

      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }

      const designSnapshot = getLockedStudyDesignSnapshot(studyVersion);
      if (!designSnapshot) {
        await writeAuditEvent({
          actor,
          action: "ai.irb_pack_blocked_design_not_locked",
          object: { type: "study_version", id: `${studyId}:${versionId}` },
          details: { studyId, versionId, status: studyVersion.status },
        });

        return reply.code(409).send({ error: "locked_study_design_required_for_ai" });
      }

      const supplement = getIRBPackSupplement(body);
      const output = buildIRBPackOutput({
        study,
        studyVersion,
        designSnapshot,
        supplement,
      });

      const suggestion = createAISuggestion({
        study_id: studyId,
        version_id: versionId,
        feature: "irb_pack",
        model_id: hasNonEmptyText(body.model_id)
          ? body.model_id.trim()
          : "deterministic-mvp-irb-pack-generator",
        prompt_template_version: hasNonEmptyText(body.prompt_template_version)
          ? body.prompt_template_version.trim()
          : "irb_pack_v1",
        input_scope_ids: [
          `study:${studyId}`,
          `study_version:${versionId}`,
          `config_hash:${designSnapshot.config_hash}`,
          ...getStringArray(body.input_scope_ids),
        ],
        output_json: output,
        study_design_snapshot: designSnapshot,
        created_by_user_id: actor.userId,
        created_by_role: actor.role,
      });

      await writeAuditEvent({
        actor,
        action: "ai.suggestion.generate_irb_pack",
        object: { type: "ai_suggestion", id: suggestion.suggestion_id },
        details: {
          studyId,
          versionId,
          study_format: designSnapshot.study_format,
          planned_round_count: designSnapshot.planned_round_count,
          terminal_round_number: designSnapshot.terminal_round_number,
          input_scope_ids: suggestion.input_scope_ids,
          output_hash: suggestion.output_hash,
          config_hash: suggestion.study_design_snapshot.config_hash,
        },
      });

      return reply.code(201).send({
        suggestion,
        release_signoffs: [],
      });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/ai/suggestions",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);

      const suggestions = listAISuggestions({
        study_id: studyId,
        version_id: versionId,
      });

      await writeAuditEvent({
        actor,
        action: "ai.suggestion.list",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, count: suggestions.length },
      });

      return reply.send({ suggestions });
    }
  );

  app.get(
    "/studies/:studyId/versions/:versionId/ai/suggestions/:suggestionId",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const suggestionId = getSuggestionId(req.params);
      const actor = getActor(req);

      const suggestion = getAISuggestion(suggestionId);
      if (!suggestion || suggestion.study_id !== studyId || suggestion.version_id !== versionId) {
        return reply.code(404).send({ error: "ai_suggestion_not_found" });
      }

      const releaseSignoffs = listAISuggestionReleaseSignoffs(suggestionId);

      await writeAuditEvent({
        actor,
        action: "ai.suggestion.get",
        object: { type: "ai_suggestion", id: suggestionId },
        details: { studyId, versionId },
      });

      return reply.send({
        suggestion,
        release_signoffs: releaseSignoffs,
      });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/ai/suggestions/:suggestionId/export-irb-pack",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const suggestionId = getSuggestionId(req.params);
      const actor = getActor(req);

      const suggestion = getAISuggestion(suggestionId);
      if (!suggestion || suggestion.study_id !== studyId || suggestion.version_id !== versionId) {
        return reply.code(404).send({ error: "ai_suggestion_not_found" });
      }

      if (suggestion.feature !== "irb_pack") {
        return reply.code(409).send({ error: "ai_suggestion_feature_must_be_irb_pack" });
      }

      const gate = getAISuggestionPublicationGate({
        suggestion_id: suggestionId,
        study_id: studyId,
        version_id: versionId,
      });

      if (!gate.ok) {
        await writeAuditEvent({
          actor,
          action: "ai.irb_pack_export_blocked_gate",
          object: { type: "ai_suggestion", id: suggestionId },
          details: {
            studyId,
            versionId,
            error: gate.error,
            hasOwner: gate.hasOwner ?? false,
            hasMethodsSteward: gate.hasMethodsSteward ?? false,
          },
        });

        return reply.code(409).send({
          error: gate.error,
          hasOwner: gate.hasOwner ?? false,
          hasMethodsSteward: gate.hasMethodsSteward ?? false,
        });
      }

      const releaseSignoffs = listAISuggestionReleaseSignoffs(suggestionId);
      const pack = {
        official_status: "released_for_official_use",
        released_at: new Date().toISOString(),
        released_by: actor,
        source_ai_suggestion_id: suggestionId,
        source_output_hash: suggestion.output_hash,
        human_edited_output_hash: suggestion.human_edited_output_hash,
        decision: suggestion.decision,
        release_signoffs: releaseSignoffs,
        irb_pack: getEffectiveSuggestionOutput(suggestion),
      };

      const auditEvent = await writeAuditEvent({
        actor,
        action: "ai.suggestion.export_irb_pack",
        object: { type: "ai_suggestion", id: suggestionId },
        details: {
          studyId,
          versionId,
          decision: suggestion.decision,
          output_hash: suggestion.output_hash,
          human_edited_output_hash: suggestion.human_edited_output_hash,
          release_signoff_count: releaseSignoffs.length,
        },
      });

      const manifest = recordExportManifest({
        study_id: studyId,
        version_id: versionId,
        package_type: "irb-pack",
        generated_by: actor,
        audit_event_id: auditEvent.id,
        config_hash: suggestion.study_design_snapshot.config_hash,
        dataset_hash: null,
        content: pack,
        data_scope: {
          source_ai_suggestion_id: suggestionId,
          feature: suggestion.feature,
          output_hash: suggestion.output_hash,
          human_edited_output_hash: suggestion.human_edited_output_hash,
        },
        redaction_profile: {
          official_status: "released_after_human_signoff",
          direct_identifiers: "limited_to_study_team_metadata",
          participant_response_material: "not_included_unless_present_in_approved_irb_draft",
        },
      });

      return reply.send({ irb_pack_export: pack, export_manifest: manifest });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/ai/suggestions/:suggestionId/decision",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const suggestionId = getSuggestionId(req.params);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const actor = getActor(req);

      const suggestion = getAISuggestion(suggestionId);
      if (!suggestion || suggestion.study_id !== studyId || suggestion.version_id !== versionId) {
        return reply.code(404).send({ error: "ai_suggestion_not_found" });
      }

      if (suggestion.decision !== "None") {
        return reply.code(409).send({ error: "ai_suggestion_already_decided" });
      }

      if (!isDecision(body.decision)) {
        return reply.code(400).send({
          error: "invalid_ai_decision",
          allowed_decisions: ["Accepted", "Edited", "Rejected"],
        });
      }

      if (body.decision === "Edited" && !Object.hasOwn(body, "human_edited_output_json")) {
        return reply.code(400).send({ error: "human_edited_output_json_required" });
      }

      const updated = decideAISuggestion({
        suggestion_id: suggestionId,
        decision: body.decision,
        decided_by_user_id: actor.userId,
        decided_by_role: actor.role,
        decision_note: hasNonEmptyText(body.note) ? body.note.trim() : null,
        human_edited_output_json:
          body.decision === "Edited" ? body.human_edited_output_json : null,
        resulting_object_ids: getStringArray(body.resulting_object_ids),
      });

      if (!updated) {
        return reply.code(404).send({ error: "ai_suggestion_not_found" });
      }

      await writeAuditEvent({
        actor,
        action: "ai.suggestion.decide",
        object: { type: "ai_suggestion", id: suggestionId },
        details: {
          studyId,
          versionId,
          feature: updated.feature,
          decision: updated.decision,
          output_hash: updated.output_hash,
          human_edited_output_hash: updated.human_edited_output_hash,
          resulting_object_ids: updated.resulting_object_ids,
        },
      });

      return reply.send({ suggestion: updated });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/ai/suggestions/:suggestionId/items",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const suggestionId = getSuggestionId(req.params);
      const actor = getActor(req);

      const suggestion = getAISuggestion(suggestionId);
      if (!suggestion || suggestion.study_id !== studyId || suggestion.version_id !== versionId) {
        return reply.code(404).send({ error: "ai_suggestion_not_found" });
      }

      if (suggestion.decision !== "Accepted" && suggestion.decision !== "Edited") {
        return reply.code(409).send({ error: "ai_suggestion_decision_required" });
      }

      const body = (req.body ?? {}) as Record<string, unknown>;
      const allowedScopeIds = new Set(suggestion.input_scope_ids);
      const candidateIds = getStringArray(body.candidate_ids);
      const itemInputs =
        candidateIds.length > 0
          ? getCandidateInputsFromSuggestionOutput({
              output_json: getEffectiveSuggestionOutput(suggestion),
              candidate_ids: candidateIds,
              terminal_round_number: suggestion.study_design_snapshot.terminal_round_number,
              allowed_scope_ids: allowedScopeIds,
              human_rationales: getHumanRationales(body),
            })
          : parseItemInputs(
              body,
              suggestion.study_design_snapshot.terminal_round_number,
              allowedScopeIds
            );

      if (!itemInputs) {
        return reply.code(400).send({
          error: "valid_ai_item_inputs_required",
          note: "Provide candidate_ids[] from the suggestion output, or items[] with provenance_links inside the suggestion input scope. Clustered Round 1 material also requires a human rationale.",
        });
      }

      const items: ItemRecord[] = itemInputs.map((item) =>
        createItem({
          study_id: studyId,
          version_id: versionId,
          round_number: item.round_number,
          text: item.text,
          provenance_type: item.provenance_type,
          created_from: "ai",
          created_by_user_id: actor.userId,
          source_ai_suggestion_id: suggestionId,
          ai_provenance_links: item.ai_provenance_links,
          ai_provenance_rationale: item.ai_provenance_rationale,
        })
      );

      const updatedSuggestion = appendAISuggestionResultingObjectIds(
        suggestionId,
        items.map((item) => item.item_id)
      );

      await writeAuditEvent({
        actor,
        action: "ai.suggestion.materialize_items",
        object: { type: "ai_suggestion", id: suggestionId },
        details: {
          studyId,
          versionId,
          item_ids: items.map((item) => item.item_id),
          round_numbers: items.map((item) => item.round_number),
          provenance_source_ids: items.flatMap((item) =>
            item.ai_provenance_links.map((link) => link.source_id)
          ),
        },
      });

      return reply.code(201).send({ items, suggestion: updatedSuggestion });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/ai/suggestions/:suggestionId/apply-wording",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const suggestionId = getSuggestionId(req.params);
      const actor = getActor(req);

      const suggestion = getAISuggestion(suggestionId);
      if (!suggestion || suggestion.study_id !== studyId || suggestion.version_id !== versionId) {
        return reply.code(404).send({ error: "ai_suggestion_not_found" });
      }

      if (suggestion.feature !== "lint_wording") {
        return reply.code(409).send({ error: "ai_suggestion_feature_must_be_lint_wording" });
      }

      const gate = getAISuggestionPublicationGate({
        suggestion_id: suggestionId,
        study_id: studyId,
        version_id: versionId,
      });

      if (!gate.ok) {
        await writeAuditEvent({
          actor,
          action: "ai.wording_apply_blocked_gate",
          object: { type: "ai_suggestion", id: suggestionId },
          details: {
            studyId,
            versionId,
            error: gate.error,
            hasOwner: gate.hasOwner ?? false,
            hasMethodsSteward: gate.hasMethodsSteward ?? false,
          },
        });

        return reply.code(409).send({
          error: gate.error,
          hasOwner: gate.hasOwner ?? false,
          hasMethodsSteward: gate.hasMethodsSteward ?? false,
        });
      }

      const changes = parseWordingChanges(req.body);
      if (!changes) {
        return reply.code(400).send({
          error: "valid_wording_changes_required",
          note: "Provide changes[] with item_id, text, and human rationale.",
        });
      }

      const scopedItemIds = new Set(suggestion.input_scope_ids);
      const updatedItems: ItemRecord[] = [];

      for (const change of changes) {
        if (!scopedItemIds.has(change.item_id)) {
          return reply.code(400).send({
            error: "item_not_in_lint_suggestion_scope",
            item_id: change.item_id,
          });
        }

        const item = getItem(change.item_id);
        if (!item || item.study_id !== studyId || item.version_id !== versionId) {
          return reply.code(404).send({ error: "item_not_found", item_id: change.item_id });
        }

        const updated = applyAIWordingRevision({
          item_id: change.item_id,
          suggestion_id: suggestionId,
          revised_text: change.text,
          rationale: change.rationale,
          applied_by_user_id: actor.userId,
        });

        if (!updated) {
          return reply.code(404).send({ error: "item_not_found", item_id: change.item_id });
        }

        updatedItems.push(updated);
      }

      const updatedSuggestion = appendAISuggestionResultingObjectIds(
        suggestionId,
        updatedItems.map((item) => item.item_id)
      );

      await writeAuditEvent({
        actor,
        action: "ai.suggestion.apply_wording",
        object: { type: "ai_suggestion", id: suggestionId },
        details: {
          studyId,
          versionId,
          item_ids: updatedItems.map((item) => item.item_id),
          decision: suggestion.decision,
          output_hash: suggestion.output_hash,
          human_edited_output_hash: suggestion.human_edited_output_hash,
        },
      });

      return reply.send({ items: updatedItems, suggestion: updatedSuggestion });
    }
  );

  app.post(
    "/studies/:studyId/versions/:versionId/ai/suggestions/:suggestionId/release-signoff",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const suggestionId = getSuggestionId(req.params);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const actor = getActor(req);

      const suggestion = getAISuggestion(suggestionId);
      if (!suggestion || suggestion.study_id !== studyId || suggestion.version_id !== versionId) {
        return reply.code(404).send({ error: "ai_suggestion_not_found" });
      }

      if (suggestion.decision !== "Accepted" && suggestion.decision !== "Edited") {
        return reply.code(409).send({ error: "ai_suggestion_decision_required" });
      }

      const requiredRole = getRequiredReleaseRole(actor.role);
      if (!requiredRole) {
        return reply.code(403).send({ error: "forbidden" });
      }

      const signoff = upsertAISuggestionReleaseSignoff({
        suggestion_id: suggestionId,
        required_role: requiredRole,
        signed_by_user_id: actor.userId,
        ...(hasNonEmptyText(body.note) ? { note: body.note.trim() } : {}),
      });

      const releaseSignoffs = listAISuggestionReleaseSignoffs(suggestionId);

      await writeAuditEvent({
        actor,
        action: "ai.suggestion.release_signoff",
        object: { type: "ai_suggestion", id: suggestionId },
        details: {
          studyId,
          versionId,
          required_role: requiredRole,
          hasOwner: releaseSignoffs.some((s) => s.required_role === "Owner"),
          hasMethodsSteward: releaseSignoffs.some(
            (s) => s.required_role === "MethodsSteward"
          ),
        },
      });

      return reply.send({ signoff, release_signoffs: releaseSignoffs });
    }
  );
}
