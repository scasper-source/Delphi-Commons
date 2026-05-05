/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

export type ResearchQuestionConfig = {
  id: string;
  displayOrder: number;
  text: string;
  shortLabel?: string;
  description?: string;
  requiredForRound1Response: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RoundOneAnswer = {
  researchQuestionId: string;
  text: string;
};

export type RoundOneResponseEntry = {
  researchQuestionId: string;
  researchQuestionLabel: string;
  researchQuestionText: string;
  text: string;
};

export type NormalizedRoundOneResponse =
  | { ok: true; payload: { round_number: 1; responses: RoundOneAnswer[]; text?: string } }
  | { ok: false; error: string };

type ResearchQuestionAuditChange = {
  action: "add" | "edit" | "remove" | "reorder";
  researchQuestionId: string;
  previousValue?: ResearchQuestionConfig | null;
  newValue?: ResearchQuestionConfig | null;
};

const DEFAULT_CREATED_AT = "2026-01-01T00:00:00.000Z";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeQuestionEntry(
  value: unknown,
  index: number,
  fallbackText = "",
): ResearchQuestionConfig | null {
  const rec = isRecord(value) ? value : {};
  const active = typeof rec.active === "boolean" ? rec.active : true;
  const text = typeof rec.text === "string" ? rec.text.trim() : fallbackText.trim();
  if (!text && !active) return null;

  return {
    id: nonEmpty(rec.id) ? rec.id.trim() : `rq-${index + 1}`,
    displayOrder:
      typeof rec.displayOrder === "number" && Number.isFinite(rec.displayOrder)
        ? rec.displayOrder
        : index + 1,
    text,
    ...(typeof rec.shortLabel === "string" ? { shortLabel: rec.shortLabel.trim() } : {}),
    ...(typeof rec.description === "string" ? { description: rec.description } : {}),
    requiredForRound1Response:
      typeof rec.requiredForRound1Response === "boolean"
        ? rec.requiredForRound1Response
        : true,
    active,
    createdAt: nonEmpty(rec.createdAt) ? rec.createdAt.trim() : DEFAULT_CREATED_AT,
    updatedAt: nonEmpty(rec.updatedAt) ? rec.updatedAt.trim() : DEFAULT_CREATED_AT,
  };
}

export function normalizeResearchQuestionsFromPacket(packet: unknown): ResearchQuestionConfig[] {
  const rec = isRecord(packet) ? packet : {};
  const legacyText = nonEmpty(rec.researchQuestion) ? rec.researchQuestion.trim() : "";
  const rawQuestions = Array.isArray(rec.researchQuestions) ? rec.researchQuestions : [];
  const normalized = rawQuestions
    .map((entry, index) => normalizeQuestionEntry(entry, index))
    .filter((entry): entry is ResearchQuestionConfig => Boolean(entry))
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const questions = normalized.length > 0
    ? normalized
    : legacyText
      ? [normalizeQuestionEntry({ id: "rq-1", text: legacyText }, 0, legacyText)].filter((entry): entry is ResearchQuestionConfig => Boolean(entry))
      : [];

  return questions.map((question, index) => ({
    ...question,
    displayOrder: index + 1,
    shortLabel: question.shortLabel?.trim() || `Research question ${index + 1}`,
  }));
}

export function activeResearchQuestionsFromPacket(packet: unknown): ResearchQuestionConfig[] {
  return normalizeResearchQuestionsFromPacket(packet)
    .filter((question) => question.active)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function normalizeResearchQuestionsInPacket(packet: Record<string, unknown>):
  | { packet: Record<string, unknown>; questions: ResearchQuestionConfig[] }
  | { error: string } {
  const questions = normalizeResearchQuestionsFromPacket(packet);
  const active = questions.filter((question) => question.active);
  if (active.length === 0) return { error: "active_research_question_required" };
  if (active.some((question) => !question.text.trim())) return { error: "research_question_text_required" };

  const firstActive = active[0];
  return {
    packet: {
      ...packet,
      researchQuestion: firstActive?.text ?? "",
      researchQuestions: questions,
    },
    questions,
  };
}

export function researchQuestionAuditChanges(
  beforePacket: unknown,
  afterPacket: unknown,
): ResearchQuestionAuditChange[] {
  const before = normalizeResearchQuestionsFromPacket(beforePacket);
  const after = normalizeResearchQuestionsFromPacket(afterPacket);
  const beforeById = new Map(before.map((question) => [question.id, question]));
  const afterById = new Map(after.map((question) => [question.id, question]));
  const changes: ResearchQuestionAuditChange[] = [];

  for (const question of after) {
    const previous = beforeById.get(question.id);
    if (!previous) {
      changes.push({ action: "add", researchQuestionId: question.id, previousValue: null, newValue: question });
      continue;
    }
    if (previous.active && !question.active) {
      changes.push({ action: "remove", researchQuestionId: question.id, previousValue: previous, newValue: question });
    }
    if (
      previous.text !== question.text ||
      (previous.shortLabel ?? "") !== (question.shortLabel ?? "") ||
      (previous.description ?? "") !== (question.description ?? "") ||
      previous.requiredForRound1Response !== question.requiredForRound1Response
    ) {
      changes.push({ action: "edit", researchQuestionId: question.id, previousValue: previous, newValue: question });
    }
    if (previous.displayOrder !== question.displayOrder) {
      changes.push({ action: "reorder", researchQuestionId: question.id, previousValue: previous, newValue: question });
    }
  }

  for (const question of before) {
    if (!afterById.has(question.id)) {
      changes.push({ action: "remove", researchQuestionId: question.id, previousValue: question, newValue: null });
    }
  }

  return changes;
}

function questionLabel(question: ResearchQuestionConfig, index: number): string {
  return question.shortLabel?.trim() || `Research question ${index + 1}`;
}

function entriesFromResponsesArray(
  responseJson: Record<string, unknown>,
  questions: ResearchQuestionConfig[],
): RoundOneResponseEntry[] {
  if (!Array.isArray(responseJson.responses)) return [];
  const questionById = new Map(questions.map((question, index) => [question.id, { question, index }]));

  return responseJson.responses.flatMap((entry): RoundOneResponseEntry[] => {
    if (!isRecord(entry) || !nonEmpty(entry.researchQuestionId) || typeof entry.text !== "string") return [];
    const matched = questionById.get(entry.researchQuestionId.trim());
    return [{
      researchQuestionId: entry.researchQuestionId.trim(),
      researchQuestionLabel: matched ? questionLabel(matched.question, matched.index) : entry.researchQuestionId.trim(),
      researchQuestionText: matched?.question.text ?? "",
      text: entry.text.trim(),
    }];
  });
}

export function roundOneResponseEntries(
  responseJson: unknown,
  questions: ResearchQuestionConfig[] = [],
): RoundOneResponseEntry[] {
  const active = questions.filter((question) => question.active);
  const fallbackQuestion = active[0] ?? questions[0] ?? {
    id: "rq-1",
    displayOrder: 1,
    text: "",
    shortLabel: "Research question 1",
    requiredForRound1Response: true,
    active: true,
    createdAt: DEFAULT_CREATED_AT,
    updatedAt: DEFAULT_CREATED_AT,
  };

  if (typeof responseJson === "string" && responseJson.trim()) {
    return [{
      researchQuestionId: fallbackQuestion.id,
      researchQuestionLabel: questionLabel(fallbackQuestion, 0),
      researchQuestionText: fallbackQuestion.text,
      text: responseJson.trim(),
    }];
  }
  if (!isRecord(responseJson)) return [];

  const structured = entriesFromResponsesArray(responseJson, active.length ? active : [fallbackQuestion]);
  if (structured.length > 0) return structured;

  for (const key of ["text", "response_text", "open_text", "answer", "statement", "comment", "comments", "rationale"]) {
    const value = responseJson[key];
    if (typeof value === "string" && value.trim()) {
      return [{
        researchQuestionId: fallbackQuestion.id,
        researchQuestionLabel: questionLabel(fallbackQuestion, 0),
        researchQuestionText: fallbackQuestion.text,
        text: value.trim(),
      }];
    }
  }

  return [];
}

export function normalizeRoundOneResponsePayload(
  body: Record<string, unknown>,
  studyDesignPacket: unknown,
): NormalizedRoundOneResponse {
  const activeQuestions = activeResearchQuestionsFromPacket(studyDesignPacket);
  if (activeQuestions.length === 0) return { ok: false, error: "active_research_question_required" };

  const submitted = Array.isArray(body.responses)
    ? body.responses
    : isRecord(body.response_json) && Array.isArray(body.response_json.responses)
      ? body.response_json.responses
      : null;

  const answerByQuestionId = new Map<string, string>();

  if (submitted) {
    const activeIds = new Set(activeQuestions.map((question) => question.id));
    for (const entry of submitted) {
      if (!isRecord(entry) || !nonEmpty(entry.researchQuestionId)) {
        return { ok: false, error: "valid_research_question_response_required" };
      }
      const researchQuestionId = entry.researchQuestionId.trim();
      if (!activeIds.has(researchQuestionId)) return { ok: false, error: "unknown_research_question" };
      const text = typeof entry.text === "string" ? entry.text.trim() : "";
      if (text.length > 10000) return { ok: false, error: "response_text_too_long" };
      answerByQuestionId.set(researchQuestionId, text);
    }
  } else {
    const textValue =
      typeof body.text === "string"
        ? body.text
        : isRecord(body.response_json) && typeof body.response_json.text === "string"
          ? body.response_json.text
          : "";
    const text = textValue.trim();
    if (text.length > 10000) return { ok: false, error: "response_text_too_long" };
    answerByQuestionId.set(activeQuestions[0]!.id, text);
  }

  for (const question of activeQuestions) {
    if (question.requiredForRound1Response && !answerByQuestionId.get(question.id)?.trim()) {
      return { ok: false, error: "required_research_question_response_missing" };
    }
  }

  const responses = activeQuestions.flatMap((question) => {
    const text = answerByQuestionId.get(question.id);
    return text !== undefined ? [{ researchQuestionId: question.id, text }] : [];
  });
  const firstText = responses.find((answer) => answer.text.trim())?.text;

  return {
    ok: true,
    payload: {
      round_number: 1,
      responses,
      ...(firstText ? { text: firstText } : {}),
    },
  };
}
