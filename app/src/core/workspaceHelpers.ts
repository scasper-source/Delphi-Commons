/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import type { SavedStudyRecord } from "./api";

export function isCurrentStudyRecord(record: SavedStudyRecord): boolean {
  if (record.study.archived_at) return false;
  const status = record.latestVersion?.status;
  return !status || status === "Draft" || status === "ReadyForSignoff" || status === "Active";
}

export function isPastStudyRecord(record: SavedStudyRecord): boolean {
  if (record.study.archived_at) return false;
  const status = record.latestVersion?.status;
  return status === "Closed";
}
