/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "node:crypto";
import { JsonCollection } from "../core/jsonCollection.js";

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

const merges = new JsonCollection<MergeActionRecord>("item_merges");
const splits = new JsonCollection<SplitActionRecord>("item_splits");

export function createMergeAction(input: {
  study_id: string;
  version_id: string;
  from_item_ids: string[];
  to_item_id: string;
  rationale: string;
  actor_user_id: string;
}): MergeActionRecord {
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

  return merges.insert(rec.merge_id, rec);
}

export function listMergeActions(filter: {
  study_id: string;
  version_id: string;
}): MergeActionRecord[] {
  return merges
    .all()
    .filter((merge) => merge.study_id === filter.study_id && merge.version_id === filter.version_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function createSplitAction(input: {
  study_id: string;
  version_id: string;
  source_item_id: string;
  new_item_ids: string[];
  rationale: string;
  actor_user_id: string;
}): SplitActionRecord {
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

  return splits.insert(rec.split_id, rec);
}

export function listSplitActions(filter: {
  study_id: string;
  version_id: string;
}): SplitActionRecord[] {
  return splits
    .all()
    .filter((split) => split.study_id === filter.study_id && split.version_id === filter.version_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

