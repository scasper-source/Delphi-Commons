/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { createCipheriv, createHash, randomBytes } from "node:crypto";

function encryptionKey(): Buffer {
  const secret = process.env.EDELPHI_AI_KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("ai_key_encryption_secret_missing");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

export function encryptApiKey(plainText: string): string {
  const value = plainText.trim();
  if (!value) throw new Error("api_key_required");

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function fingerprintApiKey(plainText: string): string {
  const value = plainText.trim();
  if (!value) throw new Error("api_key_required");
  const secret = process.env.EDELPHI_AI_KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length < 24) throw new Error("ai_key_encryption_secret_missing");
  return createHash("sha256").update(`${secret}:fingerprint:${value}`, "utf8").digest("hex");
}

export function apiKeyLastFour(plainText: string): string {
  const value = plainText.trim();
  return value.slice(-4);
}
