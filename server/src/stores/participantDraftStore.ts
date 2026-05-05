/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsonCollection } from "../core/jsonCollection.js";

export type ParticipantDraft = {
  study_id: string;
  version_id: string;
  participant_id: string;
  round_number: number;
  draft_json: unknown;
  updated_at: string;
};

const drafts = new JsonCollection<ParticipantDraft>("participant_drafts");

function draftKey(input: Pick<ParticipantDraft, "study_id" | "version_id" | "participant_id" | "round_number">): string {
  return `${input.study_id}:${input.version_id}:${input.participant_id}:${input.round_number}`;
}

export function getParticipantDraft(filter: Pick<ParticipantDraft, "study_id" | "version_id" | "participant_id" | "round_number">): ParticipantDraft | null {
  return drafts.get(draftKey(filter));
}

export function listParticipantDrafts(filter: Pick<ParticipantDraft, "study_id" | "version_id" | "participant_id">): ParticipantDraft[] {
  return drafts
    .all()
    .filter((draft) =>
      draft.study_id === filter.study_id &&
      draft.version_id === filter.version_id &&
      draft.participant_id === filter.participant_id
    )
    .sort((a, b) => a.round_number - b.round_number);
}

export function upsertParticipantDraft(input: Omit<ParticipantDraft, "updated_at">): ParticipantDraft {
  const draft: ParticipantDraft = {
    ...input,
    updated_at: new Date().toISOString(),
  };
  return drafts.set(draftKey(draft), draft);
}

export function deleteParticipantDraft(filter: Pick<ParticipantDraft, "study_id" | "version_id" | "participant_id" | "round_number">): boolean {
  return drafts.delete(draftKey(filter));
}
