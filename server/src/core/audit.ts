/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { nanoid } from "nanoid";
import { getAuditDir } from "./paths.js";
import { getDatabase, withDatabaseTransaction } from "./database.js";
import { redactSensitive } from "./redaction.js";

export type AuditEvent = {
  id: string;
  ts: string; // ISO time
  actor: {
    userId: string;
    role: string;
    systemRoles?: string[];
    email?: string;
    displayName?: string;
    sessionId?: string;
    authSource?: string;
  };
  action: string;
  object?: { type: string; id?: string };
  details?: Record<string, unknown>;
  sequence?: number;
  previousHash?: string;
  eventHash?: string;
};

const AUDIT_DIR = getAuditDir();
const AUDIT_FILE = path.join(AUDIT_DIR, "audit.log");

type AuditRow = {
  id: string;
  event_json: string;
  sequence: number | null;
  previous_hash: string | null;
  event_hash: string | null;
};

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));

  return `{${entries
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableStringify(entryValue)}`)
    .join(",")}}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hashAuditPayload(event: Omit<AuditEvent, "eventHash">): string {
  return sha256(stableStringify(event));
}

function legacyAnchorHash(): string {
  const rows = getDatabase()
    .prepare(
      `SELECT id, event_json
       FROM audit_events
       WHERE sequence IS NULL
       ORDER BY ts ASC, id ASC`,
    )
    .all() as Array<Pick<AuditRow, "id" | "event_json">>;

  if (rows.length === 0) return "GENESIS";
  return sha256(stableStringify({ legacy_event_count: rows.length, rows }));
}

function auditChainTip(): { sequence: number; eventHash: string } {
  const row = getDatabase()
    .prepare(
      `SELECT sequence, event_hash
       FROM audit_events
       WHERE sequence IS NOT NULL
       ORDER BY sequence DESC
       LIMIT 1`,
    )
    .get() as Pick<AuditRow, "sequence" | "event_hash"> | undefined;

  if (row && row.sequence !== null && row.event_hash) {
    return { sequence: row.sequence, eventHash: row.event_hash };
  }

  return { sequence: 0, eventHash: legacyAnchorHash() };
}

export async function writeAuditEvent(
  evt: Omit<AuditEvent, "id" | "ts" | "sequence" | "previousHash" | "eventHash">,
) {
  const full = withDatabaseTransaction(() => {
    const tip = auditChainTip();
    const sequence = tip.sequence + 1;
    const redacted = redactSensitive(evt);
    const base: Omit<AuditEvent, "eventHash"> = {
      id: nanoid(),
      ts: new Date().toISOString(),
      ...redacted,
      sequence,
      previousHash: tip.eventHash,
    };
    const eventHash = hashAuditPayload(base);
    const chained: AuditEvent = { ...base, eventHash };

    getDatabase()
      .prepare(
        `INSERT INTO audit_events (
          id,
          event_json,
          ts,
          actor_user_id,
          actor_role,
          action,
          object_type,
          object_id,
          sequence,
          previous_hash,
          event_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        chained.id,
        JSON.stringify(chained),
        chained.ts,
        chained.actor.userId,
        chained.actor.role,
        chained.action,
        chained.object?.type ?? null,
        chained.object?.id ?? null,
        sequence,
        tip.eventHash,
        eventHash,
      );

    return chained;
  });

  await fs.mkdir(AUDIT_DIR, { recursive: true });
  await fs.appendFile(AUDIT_FILE, JSON.stringify(full) + "\n", "utf8");
  return full;
}

export function listAuditEvents(): AuditEvent[] {
  const rows = getDatabase()
    .prepare(
      `SELECT event_json
       FROM audit_events
       ORDER BY ts ASC, id ASC`,
    )
    .all() as Array<{ event_json: string }>;

  return rows.map((row) => JSON.parse(row.event_json) as AuditEvent);
}

export function verifyAuditIntegrity():
  | { ok: true; chained_event_count: number; legacy_event_count: number; chain_tip: string }
  | {
      ok: false;
      chained_event_count: number;
      legacy_event_count: number;
      error: string;
      event_id?: string;
      sequence?: number;
    } {
  const rows = getDatabase()
    .prepare(
      `SELECT id, event_json, sequence, previous_hash, event_hash
       FROM audit_events
       ORDER BY COALESCE(sequence, 0) ASC, ts ASC, id ASC`,
    )
    .all() as AuditRow[];

  const legacyRows = rows.filter((row) => row.sequence === null);
  const chainedRows = rows
    .filter((row) => row.sequence !== null)
    .sort((a, b) => Number(a.sequence) - Number(b.sequence));

  let expectedPreviousHash = legacyAnchorHash();
  let expectedSequence = 1;

  for (const row of chainedRows) {
    if (row.sequence !== expectedSequence) {
      return {
        ok: false,
        chained_event_count: chainedRows.length,
        legacy_event_count: legacyRows.length,
        error: "audit_sequence_gap",
        event_id: row.id,
        ...(typeof row.sequence === "number" ? { sequence: row.sequence } : {}),
      };
    }

    if (row.previous_hash !== expectedPreviousHash) {
      return {
        ok: false,
        chained_event_count: chainedRows.length,
        legacy_event_count: legacyRows.length,
        error: "audit_previous_hash_mismatch",
        event_id: row.id,
        sequence: row.sequence,
      };
    }

    const parsed = JSON.parse(row.event_json) as AuditEvent;
    const { eventHash: _ignored, ...withoutHash } = parsed;
    const expectedHash = hashAuditPayload(withoutHash);

    if (row.event_hash !== expectedHash || parsed.eventHash !== expectedHash) {
      return {
        ok: false,
        chained_event_count: chainedRows.length,
        legacy_event_count: legacyRows.length,
        error: "audit_event_hash_mismatch",
        event_id: row.id,
        sequence: row.sequence,
      };
    }

    expectedPreviousHash = expectedHash;
    expectedSequence += 1;
  }

  return {
    ok: true,
    chained_event_count: chainedRows.length,
    legacy_event_count: legacyRows.length,
    chain_tip: expectedPreviousHash,
  };
}
