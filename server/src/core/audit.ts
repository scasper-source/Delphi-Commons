import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";

export type AuditEvent = {
  id: string;
  ts: string; // ISO time
  actor: { userId: string; role: string };
  action: string;
  object?: { type: string; id?: string };
  details?: Record<string, unknown>;
};

const AUDIT_DIR = path.resolve(process.cwd(), "audit");
const AUDIT_FILE = path.join(AUDIT_DIR, "audit.log");

export async function writeAuditEvent(evt: Omit<AuditEvent, "id" | "ts">) {
  const full: AuditEvent = {
    id: nanoid(),
    ts: new Date().toISOString(),
    ...evt,
  };

  await fs.mkdir(AUDIT_DIR, { recursive: true });
  await fs.appendFile(AUDIT_FILE, JSON.stringify(full) + "\n", "utf8");
  return full;
}