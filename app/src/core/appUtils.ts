/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ExportPackageFile, RoundOneAnswerInput } from "./api";
import type { RoundOneResponseEntry } from "./appTypes";
import { ratingScaleOptions } from "./appTypes";
import {
  activeResearchQuestions,
  defaultWizardState,
  type ResearchQuestion,
  type StudyWizardState,
} from "./studyWizard";

const statusLabels: Record<string, string> = {
  ReadyForReview: "Ready for review",
  NotOpen: "Not open",
  ReadyForSignoff: "Ready for signoff",
};

export function formatStatus(value: string): string {
  return statusLabels[value] ?? value;
}

export function formatRatingChoice(value: number | null | undefined): string {
  if (!value) return "No response recorded";
  return ratingScaleOptions.find((option) => option.value === value)?.label ?? `Recorded response ${value}`;
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function shortId(value: string): string {
  return value.slice(0, 8);
}

export function packetText(packet: unknown, key: "title" | "description"): string | null {
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) return null;
  const value = (packet as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function excerpt(value: string, max = 240): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max - 3)}...` : collapsed;
}

export function roundReportRisk(status: string): "success" | "warning" | "info" | "locked" {
  if (status === "consensus") return "success";
  if (status === "non_consensus") return "warning";
  return "info";
}

export function humanizeBackendMessage(message: string | null): string | null {
  if (!message) return null;

  const labels: Record<string, string> = {
    active_consent_required: "Consent must be acknowledged before this participant response can be submitted.",
    active_research_question_required: "At least one active research question is required before launch or Round 1 response collection.",
    ai_suggestion_decision_required: "Accept, edit, or reject the AI suggestion before using it.",
    ai_suggestion_release_signoff_required:
      "Participant-facing AI-assisted material needs both Study Owner and Ethics & Methods Steward release signoff.",
    another_round_open: "Close the currently open round before opening another round.",
    consensus_rule_locked: "The consensus threshold is locked after governance submission.",
    consensus_setting_process_missing: "Document how the consensus rule was set before governance signoff.",
    invalid_consensus_threshold: "Choose a consensus threshold of 60%, 70%, 80%, or 90%.",
    invalid_consensus_rule_source: "Choose a valid consensus rule source.",
    invalid_pre_round_consensus_status: "Choose a valid pre-round consensus input status.",
    locked_study_design_required_for_ai: "Submit the study design for governance before using AI-assisted drafting.",
    pre_round_consensus_input_not_reviewed: "Panel- or stakeholder-informed consensus input must be reviewed or finalized before governance signoff.",
    pre_round_consensus_prompt_missing: "Add a neutral pre-round prompt for consensus-rule input.",
    pre_round_consensus_summary_missing: "Summarize how pre-round consensus input was considered before governance signoff.",
    previous_round_must_be_closed: "Close the previous round before opening this round.",
    participant_orientation_required: "Complete the study orientation before beginning Round 1.",
    published_items_required_for_round: "Publish at least one traceable candidate item before opening this round.",
    round_config_required: "Configure this round before opening it.",
    round_not_open: "This task is not available until the study team opens the round.",
    round1_config_required: "Configure Round 1 before collecting participant responses.",
    round1_not_open: "Round 1 is not open for participant responses.",
    required_research_question_response_missing: "A required research question response is missing.",
    research_question_text_required: "Each active research question needs text before governance review.",
    source_material_required_for_synthesis: "Round 1 responses are required before drafting Round 2 candidates.",
    study_design_packet_missing: "Save the Study Builder packet before submitting for governance signoff.",
    study_version_not_active: "Activate the study version before opening rounds or collecting responses.",
    forbidden: "This role is not authorized for the selected study. Confirm the user has study membership for this role.",
    unassigned: "This signed-in user is not assigned to the selected study.",
  };

  return labels[message] ?? message.replaceAll("_", " ");
}

export function bytesFromBase64(value: string): ArrayBuffer {
  const binary = window.atob(value);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return buffer;
}

export function downloadPackageFile(file: ExportPackageFile) {
  const body: BlobPart =
    file.content_encoding === "base64"
      ? bytesFromBase64(file.content_text)
      : file.content_text;
  const blob = new Blob([body], { type: file.media_type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.path.split("/").at(-1) ?? "delphi-commons-export-file";
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export function participantInviteTokenFromLocation() {
  const queryToken = new URLSearchParams(window.location.search).get("invite");
  if (queryToken) return queryToken;

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash).get("invite");
}

export function magicTokenFromLocation() {
  const pathMatch = window.location.pathname.match(/^\/m\/([A-Za-z0-9_-]{32,256})$/);
  if (pathMatch?.[1]) return pathMatch[1];
  const queryToken = new URLSearchParams(window.location.search).get("m");
  if (queryToken) return queryToken;
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash).get("m");
}

export function fallbackResearchQuestion(): ResearchQuestion {
  return {
    id: "rq-1",
    displayOrder: 1,
    text: defaultWizardState.researchQuestion,
    shortLabel: "Research question 1",
    description: "",
    requiredForRound1Response: true,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

export function questionLabel(question: ResearchQuestion, index: number): string {
  return question.shortLabel?.trim() || `Research question ${index + 1}`;
}

export function roundOneQuestions(wizard: StudyWizardState): ResearchQuestion[] {
  const questions = activeResearchQuestions(wizard);
  return questions.length > 0 ? questions : [fallbackResearchQuestion()];
}

export function roundOneResponseEntries(responseJson: unknown, questions: ResearchQuestion[] = [fallbackResearchQuestion()]): RoundOneResponseEntry[] {
  const activeQuestionsList = questions.filter((question) => question.active);
  const fallbackQuestion = activeQuestionsList[0] ?? questions[0] ?? fallbackResearchQuestion();
  if (typeof responseJson === "string" && responseJson.trim()) {
    return [{
      researchQuestionId: fallbackQuestion.id,
      researchQuestionLabel: questionLabel(fallbackQuestion, 0),
      researchQuestionText: fallbackQuestion.text,
      text: responseJson.trim(),
    }];
  }
  if (!responseJson || typeof responseJson !== "object" || Array.isArray(responseJson)) return [];
  const record = responseJson as Record<string, unknown>;
  if (Array.isArray(record.responses)) {
    const questionById = new Map(activeQuestionsList.map((question, index) => [question.id, { question, index }]));
    const entries = record.responses.flatMap((entry): RoundOneResponseEntry[] => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
      const entryRecord = entry as Record<string, unknown>;
      const researchQuestionId = typeof entryRecord.researchQuestionId === "string" ? entryRecord.researchQuestionId : "";
      const text = typeof entryRecord.text === "string" ? entryRecord.text.trim() : "";
      if (!researchQuestionId || !text) return [];
      const match = questionById.get(researchQuestionId);
      return [{
        researchQuestionId,
        researchQuestionLabel: match ? questionLabel(match.question, match.index) : researchQuestionId,
        researchQuestionText: match?.question.text ?? "",
        text,
      }];
    });
    if (entries.length > 0) return entries;
  }

  for (const key of ["text", "response_text", "open_text", "answer", "statement", "comment", "comments"]) {
    const value = record[key];
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

export function responseOpenText(responseJson: unknown): string | null {
  return roundOneResponseEntries(responseJson).at(0)?.text ?? null;
}

export function firstRoundOneAnswerText(answers: Record<string, string>, questions: ResearchQuestion[]): string {
  return questions.map((question) => answers[question.id]?.trim() ?? "").find(Boolean) ?? "";
}

export function roundOneAnswerInputs(answers: Record<string, string>, questions: ResearchQuestion[]): RoundOneAnswerInput[] {
  return questions.map((question) => ({
    researchQuestionId: question.id,
    text: answers[question.id]?.trim() ?? "",
  }));
}

export function roundOneAnswersFromPayload(payload: unknown, questions: ResearchQuestion[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of roundOneResponseEntries(payload, questions)) {
    out[entry.researchQuestionId] = entry.text;
  }
  return out;
}
