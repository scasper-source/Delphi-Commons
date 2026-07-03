/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { JsonCollection } from "../core/jsonCollection.js";
import { withDatabaseTransaction } from "../core/database.js";
import type {
  Study,
  StudyAssignment,
  StudyVersion,
  StudyVersionSignoff,
} from "./types.js";

const studies = new JsonCollection<Study>("studies");
const studyVersions = new JsonCollection<StudyVersion>("study_versions");
const assignments = new JsonCollection<StudyAssignment>("study_assignments");
const signoffs = new JsonCollection<StudyVersionSignoff>("study_version_signoffs");

function assignmentKey(assignment: StudyAssignment): string {
  return `${assignment.study_id}:${assignment.user_id}:${assignment.role}`;
}

function signoffKey(signoff: Pick<StudyVersionSignoff, "study_version_id" | "required_role">): string {
  return `${signoff.study_version_id}:${signoff.required_role}`;
}

export async function createStudy(study: Study, ownerAssignment: StudyAssignment): Promise<void> {
  withDatabaseTransaction(() => {
    studies.insert(study.id, study);
    assignments.set(assignmentKey(ownerAssignment), ownerAssignment);
  });
}

export async function listStudies(options: { includeArchived?: boolean } = {}): Promise<Study[]> {
  return studies
    .all()
    .filter((study) => options.includeArchived || !study.archived_at)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getStudy(studyId: string): Promise<Study | null> {
  return studies.get(studyId);
}

export async function updateStudy(studyId: string, patch: Partial<Study>): Promise<Study> {
  const updated = studies.update(studyId, (existing) => ({ ...existing, ...patch, id: studyId, updated_at: new Date().toISOString() }));
  if (!updated) throw new Error("study_not_found");
  return updated;
}

export async function addAssignment(assignment: StudyAssignment): Promise<void> {
  assignments.set(assignmentKey(assignment), assignment);
}

export async function listAssignments(studyId: string): Promise<StudyAssignment[]> {
  return assignments
    .all()
    .filter((assignment) => assignment.study_id === studyId)
    .sort((a, b) => a.user_id.localeCompare(b.user_id) || a.role.localeCompare(b.role));
}

export async function getAssignmentForUser(studyId: string, userId: string): Promise<StudyAssignment | null> {
  return (
    (await listAssignments(studyId)).find((assignment) => assignment.user_id === userId) ??
    null
  );
}

export async function removeAssignment(studyId: string, userId: string): Promise<boolean> {
  const currentKeys = assignments
    .all()
    .filter((assignment) => assignment.study_id === studyId && assignment.user_id === userId)
    .map(assignmentKey);

  let removedCurrentKey = false;
  for (const key of currentKeys) {
    removedCurrentKey = assignments.delete(key) || removedCurrentKey;
  }

  // Clean up any pre-production records keyed by study:user:role so a role downgrade
  // takes effect immediately even when older local data exists.
  const legacyKeys = [`${studyId}:${userId}`];
  let removedLegacy = false;
  for (const key of legacyKeys) {
    removedLegacy = assignments.delete(key) || removedLegacy;
  }

  return removedCurrentKey || removedLegacy;
}

export async function createStudyVersion(version: StudyVersion): Promise<void> {
  studyVersions.insert(version.id, version);
}

export async function getStudyVersion(studyVersionId: string): Promise<StudyVersion | null> {
  return studyVersions.get(studyVersionId);
}

export async function listStudyVersions(studyId: string): Promise<StudyVersion[]> {
  return studyVersions
    .all()
    .filter((version) => version.study_id === studyId)
    .sort((a, b) => a.version_number - b.version_number);
}

export async function updateStudyVersion(
  studyVersionId: string,
  patch: Partial<StudyVersion>,
): Promise<StudyVersion> {
  const updated = studyVersions.update(studyVersionId, (existing) => ({
    ...existing,
    ...patch,
    updated_at: new Date().toISOString(),
  }));
  if (!updated) throw new Error("study_version_not_found");
  return updated;
}

export async function upsertSignoff(signoff: StudyVersionSignoff): Promise<void> {
  signoffs.set(signoffKey(signoff), signoff);
}

export async function listSignoffs(studyVersionId: string): Promise<StudyVersionSignoff[]> {
  return signoffs
    .all()
    .filter((signoff) => signoff.study_version_id === studyVersionId)
    .sort((a, b) => a.required_role.localeCompare(b.required_role));
}
