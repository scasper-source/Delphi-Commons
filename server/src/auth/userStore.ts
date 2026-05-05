/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "node:crypto";
import { JsonCollection } from "../core/jsonCollection.js";
import type { AuthRole, SessionRecord, UserRecord } from "./types.js";

const users = new JsonCollection<UserRecord>("auth_users");
const sessions = new JsonCollection<SessionRecord>("auth_sessions");

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const PASSWORD_KEYLEN = 64;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, PASSWORD_KEYLEN).toString("base64");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("base64url");
}

export function createUser(input: {
  email: string;
  display_name: string;
  password: string;
  system_roles: AuthRole[];
}): UserRecord {
  const email = normalizeEmail(input.email);
  const existing = getUserByEmail(email);
  if (existing) throw new Error("user_email_already_exists");

  const salt = crypto.randomBytes(24).toString("base64");
  const user: UserRecord = {
    user_id: crypto.randomUUID(),
    email,
    display_name: input.display_name.trim() || email,
    password_hash: hashPassword(input.password, salt),
    password_salt: salt,
    password_kdf: "scrypt",
    system_roles: Array.from(new Set(input.system_roles)),
    created_at: new Date().toISOString(),
    disabled_at: null,
  };

  return users.insert(user.user_id, user);
}

export function upsertUser(input: {
  email: string;
  display_name: string;
  password: string;
  system_roles: AuthRole[];
}): UserRecord {
  const existing = getUserByEmail(input.email);
  if (!existing) return createUser(input);

  const salt = crypto.randomBytes(24).toString("base64");
  return users.set(existing.user_id, {
    ...existing,
    display_name: input.display_name.trim() || existing.display_name,
    password_hash: hashPassword(input.password, salt),
    password_salt: salt,
    password_kdf: "scrypt",
    system_roles: Array.from(new Set(input.system_roles)),
  });
}

export function getUser(userId: string): UserRecord | null {
  return users.get(userId);
}

export function getUserByEmail(email: string): UserRecord | null {
  const normalized = normalizeEmail(email);
  return users.all().find((user) => user.email === normalized) ?? null;
}

export function listUsers(): UserRecord[] {
  return users.all().sort((a, b) => a.email.localeCompare(b.email));
}

export function updateUser(
  userId: string,
  patch: {
    display_name?: string;
    system_roles?: AuthRole[];
    disabled_at?: string | null;
  },
): UserRecord | null {
  return users.update(userId, (user) => ({
    ...user,
    ...(patch.display_name !== undefined ? { display_name: patch.display_name.trim() || user.display_name } : {}),
    ...(patch.system_roles !== undefined ? { system_roles: Array.from(new Set(patch.system_roles)) } : {}),
    ...(patch.disabled_at !== undefined ? { disabled_at: patch.disabled_at } : {}),
  }));
}

export function revokeUserSessions(userId: string): number {
  let count = 0;
  for (const session of sessions.all()) {
    if (session.user_id === userId && !session.revoked_at) {
      revokeSession(session.session_id);
      count += 1;
    }
  }
  return count;
}

export function verifyPassword(user: UserRecord, password: string): boolean {
  const candidate = hashPassword(password, user.password_salt);
  const a = Buffer.from(candidate);
  const b = Buffer.from(user.password_hash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createSession(userId: string): { session: SessionRecord; token: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  const session: SessionRecord = {
    session_id: crypto.randomUUID(),
    user_id: userId,
    token_hash: hashToken(token),
    created_at: new Date(now).toISOString(),
    expires_at: new Date(now + SESSION_TTL_MS).toISOString(),
    revoked_at: null,
  };

  sessions.insert(session.session_id, session);
  return { session, token };
}

export function getSessionByToken(token: string): SessionRecord | null {
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();
  return (
    sessions
      .all()
      .find((session) => session.token_hash === tokenHash && !session.revoked_at && session.expires_at > now) ?? null
  );
}

export function revokeSession(sessionId: string): SessionRecord | null {
  return sessions.update(sessionId, (session) => ({
    ...session,
    revoked_at: new Date().toISOString(),
  }));
}

export function sanitizeUser(user: UserRecord) {
  return {
    user_id: user.user_id,
    email: user.email,
    display_name: user.display_name,
    system_roles: user.system_roles,
    created_at: user.created_at,
    disabled_at: user.disabled_at,
  };
}
