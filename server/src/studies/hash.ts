/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

// server/src/studies/hash.ts
import { createHash } from "node:crypto";

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function sha256Json(obj: unknown): string {
  // MVP: stable-enough stringify for our config objects
  // (We can improve canonicalization later if needed.)
  const s = JSON.stringify(obj, null, 2);
  return sha256(s);
}