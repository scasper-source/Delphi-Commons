// server/src/studies/store.ts
// Ticket 3: minimal file-based storage (JSON) for Study + StudyVersion + Signoffs.

import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  Study,
  StudyAssignment,
  StudyVersion,
  StudyVersionSignoff,
} from "./types.ts";

type DbShape = {
  studies: Study[];
  studyVersions: StudyVersion[];
  assignments: StudyAssignment[];
  signoffs: StudyVersionSignoff[];
};

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "studies.db.json");

async function ensureDb(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DB_FILE);
  } catch {
    const initial: DbShape = {
      studies: [],
      studyVersions: [],
      assignments: [],
      signoffs: [],
    };
    await fs.writeFile(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readDb(): Promise<DbShape> {
  await ensureDb();
  const raw = await fs.readFile(DB_FILE, "utf8");
  return JSON.parse(raw) as DbShape;
}

async function writeDb(db: DbShape): Promise<void> {
  await ensureDb();
  const tmp = DB_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

export async function createStudy(study: Study, ownerAssignment: StudyAssignment): Promise<void> {
  const db = await readDb();
  db.studies.push(study);
  db.assignments.push(ownerAssignment);
  await writeDb(db);
}

export async function getStudy(studyId: string): Promise<Study | null> {
  const db = await readDb();
  return db.studies.find(s => s.id === studyId) ?? null;
}

export async function addAssignment(assignment: StudyAssignment): Promise<void> {
  const db = await readDb();
  db.assignments.push(assignment);
  await writeDb(db);
}

export async function listAssignments(studyId: string): Promise<StudyAssignment[]> {
  const db = await readDb();
  return db.assignments.filter(a => a.study_id === studyId);
}

export async function createStudyVersion(version: StudyVersion): Promise<void> {
  const db = await readDb();
  db.studyVersions.push(version);
  await writeDb(db);
}

export async function getStudyVersion(studyVersionId: string): Promise<StudyVersion | null> {
  const db = await readDb();
  return db.studyVersions.find(v => v.id === studyVersionId) ?? null;
}

export async function listStudyVersions(studyId: string): Promise<StudyVersion[]> {
  const db = await readDb();
  return db.studyVersions
    .filter(v => v.study_id === studyId)
    .sort((a, b) => a.version_number - b.version_number);
}

export async function updateStudyVersion(
  studyVersionId: string,
  patch: Partial<StudyVersion>
): Promise<StudyVersion> {
  const db = await readDb();
  const idx = db.studyVersions.findIndex(v => v.id === studyVersionId);
  if (idx === -1) throw new Error("study_version_not_found");

  const updated: StudyVersion = { ...db.studyVersions[idx], ...patch } as StudyVersion;
  db.studyVersions[idx] = updated;

  await writeDb(db);
  return updated;
}

export async function upsertSignoff(signoff: StudyVersionSignoff): Promise<void> {
  const db = await readDb();
  const idx = db.signoffs.findIndex(s =>
    s.study_version_id === signoff.study_version_id &&
    s.required_role === signoff.required_role
  );
  if (idx >= 0) db.signoffs[idx] = signoff;
  else db.signoffs.push(signoff);
  await writeDb(db);
}

export async function listSignoffs(studyVersionId: string): Promise<StudyVersionSignoff[]> {
  const db = await readDb();
  return db.signoffs.filter(s => s.study_version_id === studyVersionId);
}