/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "node:crypto";
import { getDatabase, withDatabaseTransaction } from "../core/database.js";

export type NotificationPreference = "email_only" | "sms_only" | "both" | "no_sms";

export type ParticipantContactPreference = {
  participant_id: string;
  notification_preference: NotificationPreference;
  phone_e164: string | null;
  phone_hash: string | null;
  phone_last_four: string | null;
  sms_consent_at: string | null;
  sms_consent_version: string | null;
  sms_consent_revoked_at: string | null;
  phone_verified_at: string | null;
  phone_verification_method: string | null;
  updated_at: string;
  updated_by_user_id: string;
};

export type PublicContactPreference = Omit<ParticipantContactPreference, "phone_e164" | "phone_hash"> & {
  masked_phone: string | null;
};

export type PhoneVerificationChallenge = {
  challenge_id: string;
  participant_id: string;
  phone_hash: string;
  masked_phone: string;
  otp_hash: string;
  expires_at: string;
  attempts: number;
  consumed_at: string | null;
  created_at: string;
};

export type StudySmsPolicy = {
  study_id: string;
  version_id: string;
  sms_enabled: boolean;
  notification_safe_name: string | null;
  safe_name_is_sensitive: boolean;
  magic_link_ttl_minutes: number;
  updated_at: string;
  updated_by_user_id: string;
};

export type MagicLinkToken = {
  magic_link_id: string;
  token_hash: string;
  participant_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
  purpose: "round_entry_sms";
  created_at: string;
  expires_at: string;
  consumed_at: string | null;
  revoked_at: string | null;
  created_by_event_id: string | null;
  metadata_json: string;
};

export type MagicLinkSession = {
  session_id: string;
  session_hash: string;
  participant_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
  created_at: string;
  expires_at: string;
};

export type SmsNotification = {
  sms_notification_id: string;
  participant_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
  provider: string;
  provider_message_id: string | null;
  status: "queued" | "sent" | "failed" | "delivered" | "undelivered" | "skipped";
  status_updated_at: string | null;
  sent_at: string | null;
  failed_at: string | null;
  failure_code: string | null;
  preference_snapshot_json: string;
  magic_link_id: string | null;
  created_at: string;
};

type ContactPreferenceRow = Omit<ParticipantContactPreference, "notification_preference"> & {
  notification_preference: string;
};

type StudySmsPolicyRow = Omit<StudySmsPolicy, "sms_enabled" | "safe_name_is_sensitive"> & {
  sms_enabled: number;
  safe_name_is_sensitive: number;
};

function nowIso(): string {
  return new Date().toISOString();
}

function toContactPreference(row: ContactPreferenceRow): ParticipantContactPreference {
  return {
    ...row,
    notification_preference: isNotificationPreference(row.notification_preference)
      ? row.notification_preference
      : "no_sms",
  };
}

function toStudySmsPolicy(row: StudySmsPolicyRow): StudySmsPolicy {
  return {
    ...row,
    sms_enabled: row.sms_enabled === 1,
    safe_name_is_sensitive: row.safe_name_is_sensitive === 1,
  };
}

export function isNotificationPreference(value: unknown): value is NotificationPreference {
  return value === "email_only" || value === "sms_only" || value === "both" || value === "no_sms";
}

export function publicContactPreference(record: ParticipantContactPreference | null): PublicContactPreference | null {
  if (!record) return null;
  const { phone_e164: _phone, phone_hash: _hash, ...rest } = record;
  return {
    ...rest,
    masked_phone: record.phone_last_four ? `***-***-${record.phone_last_four}` : null,
  };
}

export function getContactPreference(participantId: string): ParticipantContactPreference | null {
  const row = getDatabase()
    .prepare("SELECT * FROM participant_contact_preferences WHERE participant_id = ?")
    .get(participantId) as ContactPreferenceRow | undefined;
  return row ? toContactPreference(row) : null;
}

export function findContactPreferenceByPhoneHash(phoneHash: string): ParticipantContactPreference | null {
  const row = getDatabase()
    .prepare("SELECT * FROM participant_contact_preferences WHERE phone_hash = ?")
    .get(phoneHash) as ContactPreferenceRow | undefined;
  return row ? toContactPreference(row) : null;
}

export function upsertContactPreference(input: {
  participant_id: string;
  notification_preference: NotificationPreference;
  phone_e164?: string | null;
  phone_hash?: string | null;
  phone_last_four?: string | null;
  sms_consent_granted?: boolean;
  sms_consent_version?: string | null;
  updated_by_user_id: string;
}): ParticipantContactPreference {
  const existing = getContactPreference(input.participant_id);
  const now = nowIso();
  const smsConsentAt =
    input.sms_consent_granted === true
      ? existing?.sms_consent_at ?? now
      : input.sms_consent_granted === false
        ? null
        : existing?.sms_consent_at ?? null;
  const smsConsentRevokedAt =
    input.sms_consent_granted === false
      ? now
      : input.sms_consent_granted === true
        ? null
        : existing?.sms_consent_revoked_at ?? null;

  const record: ParticipantContactPreference = {
    participant_id: input.participant_id,
    notification_preference: input.notification_preference,
    phone_e164: input.phone_e164 ?? existing?.phone_e164 ?? null,
    phone_hash: input.phone_hash ?? existing?.phone_hash ?? null,
    phone_last_four: input.phone_last_four ?? existing?.phone_last_four ?? null,
    sms_consent_at: smsConsentAt,
    sms_consent_version: input.sms_consent_version ?? existing?.sms_consent_version ?? null,
    sms_consent_revoked_at: smsConsentRevokedAt,
    phone_verified_at: existing?.phone_verified_at ?? null,
    phone_verification_method: existing?.phone_verification_method ?? null,
    updated_at: now,
    updated_by_user_id: input.updated_by_user_id,
  };

  getDatabase()
    .prepare(
      `INSERT INTO participant_contact_preferences (
        participant_id, notification_preference, phone_e164, phone_hash, phone_last_four,
        sms_consent_at, sms_consent_version, sms_consent_revoked_at, phone_verified_at,
        phone_verification_method, updated_at, updated_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(participant_id) DO UPDATE SET
        notification_preference = excluded.notification_preference,
        phone_e164 = excluded.phone_e164,
        phone_hash = excluded.phone_hash,
        phone_last_four = excluded.phone_last_four,
        sms_consent_at = excluded.sms_consent_at,
        sms_consent_version = excluded.sms_consent_version,
        sms_consent_revoked_at = excluded.sms_consent_revoked_at,
        phone_verified_at = excluded.phone_verified_at,
        phone_verification_method = excluded.phone_verification_method,
        updated_at = excluded.updated_at,
        updated_by_user_id = excluded.updated_by_user_id`,
    )
    .run(
      record.participant_id,
      record.notification_preference,
      record.phone_e164,
      record.phone_hash,
      record.phone_last_four,
      record.sms_consent_at,
      record.sms_consent_version,
      record.sms_consent_revoked_at,
      record.phone_verified_at,
      record.phone_verification_method,
      record.updated_at,
      record.updated_by_user_id,
    );

  return record;
}

export function markPhoneVerified(input: {
  participant_id: string;
  method: string;
  updated_by_user_id: string;
}): ParticipantContactPreference | null {
  const existing = getContactPreference(input.participant_id);
  if (!existing) return null;
  const record = {
    ...existing,
    phone_verified_at: nowIso(),
    phone_verification_method: input.method,
    updated_at: nowIso(),
    updated_by_user_id: input.updated_by_user_id,
  };
  getDatabase()
    .prepare(
      `UPDATE participant_contact_preferences
       SET phone_verified_at = ?, phone_verification_method = ?, updated_at = ?, updated_by_user_id = ?
       WHERE participant_id = ?`,
    )
    .run(record.phone_verified_at, record.phone_verification_method, record.updated_at, record.updated_by_user_id, input.participant_id);
  return record;
}

export function createPhoneChallenge(input: {
  participant_id: string;
  phone_hash: string;
  masked_phone: string;
  otp_hash: string;
  expires_at: string;
}): PhoneVerificationChallenge {
  const challenge: PhoneVerificationChallenge = {
    challenge_id: crypto.randomUUID(),
    participant_id: input.participant_id,
    phone_hash: input.phone_hash,
    masked_phone: input.masked_phone,
    otp_hash: input.otp_hash,
    expires_at: input.expires_at,
    attempts: 0,
    consumed_at: null,
    created_at: nowIso(),
  };

  getDatabase()
    .prepare(
      `INSERT INTO phone_verification_challenges (
        challenge_id, participant_id, phone_hash, masked_phone, otp_hash, expires_at, attempts, consumed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      challenge.challenge_id,
      challenge.participant_id,
      challenge.phone_hash,
      challenge.masked_phone,
      challenge.otp_hash,
      challenge.expires_at,
      challenge.attempts,
      challenge.consumed_at,
      challenge.created_at,
    );

  return challenge;
}

export function getPhoneChallenge(challengeId: string): PhoneVerificationChallenge | null {
  const row = getDatabase()
    .prepare("SELECT * FROM phone_verification_challenges WHERE challenge_id = ?")
    .get(challengeId) as PhoneVerificationChallenge | undefined;
  return row ?? null;
}

export function recordPhoneChallengeAttempt(input: {
  challenge_id: string;
  consumed: boolean;
}): PhoneVerificationChallenge | null {
  return withDatabaseTransaction(() => {
    const existing = getPhoneChallenge(input.challenge_id);
    if (!existing) return null;
    const consumedAt = input.consumed ? nowIso() : existing.consumed_at;
    const attempts = existing.attempts + 1;
    getDatabase()
      .prepare(
        `UPDATE phone_verification_challenges
         SET attempts = ?, consumed_at = ?
         WHERE challenge_id = ?`,
      )
      .run(attempts, consumedAt, input.challenge_id);
    return { ...existing, attempts, consumed_at: consumedAt };
  });
}

export function defaultStudySmsPolicy(input: {
  study_id: string;
  version_id: string;
  user_id: string;
  ttl_minutes: number;
}): StudySmsPolicy {
  const now = nowIso();
  return {
    study_id: input.study_id,
    version_id: input.version_id,
    sms_enabled: false,
    notification_safe_name: null,
    safe_name_is_sensitive: false,
    magic_link_ttl_minutes: input.ttl_minutes,
    updated_at: now,
    updated_by_user_id: input.user_id,
  };
}

export function getStudySmsPolicy(filter: {
  study_id: string;
  version_id: string;
}, fallbackUserId = "system", fallbackTtlMinutes = 60): StudySmsPolicy {
  const row = getDatabase()
    .prepare("SELECT * FROM study_sms_policies WHERE study_id = ? AND version_id = ?")
    .get(filter.study_id, filter.version_id) as StudySmsPolicyRow | undefined;
  return row ? toStudySmsPolicy(row) : defaultStudySmsPolicy({ ...filter, user_id: fallbackUserId, ttl_minutes: fallbackTtlMinutes });
}

export function upsertStudySmsPolicy(input: {
  study_id: string;
  version_id: string;
  sms_enabled: boolean;
  notification_safe_name?: string | null;
  safe_name_is_sensitive?: boolean;
  magic_link_ttl_minutes: number;
  updated_by_user_id: string;
}): StudySmsPolicy {
  const record: StudySmsPolicy = {
    study_id: input.study_id,
    version_id: input.version_id,
    sms_enabled: input.sms_enabled,
    notification_safe_name: input.notification_safe_name ?? null,
    safe_name_is_sensitive: Boolean(input.safe_name_is_sensitive),
    magic_link_ttl_minutes: input.magic_link_ttl_minutes,
    updated_at: nowIso(),
    updated_by_user_id: input.updated_by_user_id,
  };

  getDatabase()
    .prepare(
      `INSERT INTO study_sms_policies (
        study_id, version_id, sms_enabled, notification_safe_name, safe_name_is_sensitive,
        magic_link_ttl_minutes, updated_at, updated_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(study_id, version_id) DO UPDATE SET
        sms_enabled = excluded.sms_enabled,
        notification_safe_name = excluded.notification_safe_name,
        safe_name_is_sensitive = excluded.safe_name_is_sensitive,
        magic_link_ttl_minutes = excluded.magic_link_ttl_minutes,
        updated_at = excluded.updated_at,
        updated_by_user_id = excluded.updated_by_user_id`,
    )
    .run(
      record.study_id,
      record.version_id,
      record.sms_enabled ? 1 : 0,
      record.notification_safe_name,
      record.safe_name_is_sensitive ? 1 : 0,
      record.magic_link_ttl_minutes,
      record.updated_at,
      record.updated_by_user_id,
    );

  return record;
}

export function revokeActiveMagicLinksForParticipantRound(input: {
  participant_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
  revoked_at?: string;
}): number {
  const revokedAt = input.revoked_at ?? nowIso();
  const result = getDatabase()
    .prepare(
      `UPDATE magic_link_tokens
       SET revoked_at = ?
       WHERE participant_id = ? AND study_id = ? AND version_id = ? AND round_number = ?
         AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at > ?`,
    )
    .run(revokedAt, input.participant_id, input.study_id, input.version_id, input.round_number, revokedAt);
  return Number(result.changes ?? 0);
}

export function createMagicLinkToken(input: {
  token_hash: string;
  participant_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
  expires_at: string;
  metadata: Record<string, unknown>;
}): MagicLinkToken {
  const record: MagicLinkToken = {
    magic_link_id: crypto.randomUUID(),
    token_hash: input.token_hash,
    participant_id: input.participant_id,
    study_id: input.study_id,
    version_id: input.version_id,
    round_number: input.round_number,
    purpose: "round_entry_sms",
    created_at: nowIso(),
    expires_at: input.expires_at,
    consumed_at: null,
    revoked_at: null,
    created_by_event_id: null,
    metadata_json: JSON.stringify(input.metadata),
  };

  getDatabase()
    .prepare(
      `INSERT INTO magic_link_tokens (
        magic_link_id, token_hash, participant_id, study_id, version_id, round_number,
        purpose, created_at, expires_at, consumed_at, revoked_at, created_by_event_id, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      record.magic_link_id,
      record.token_hash,
      record.participant_id,
      record.study_id,
      record.version_id,
      record.round_number,
      record.purpose,
      record.created_at,
      record.expires_at,
      record.consumed_at,
      record.revoked_at,
      record.created_by_event_id,
      record.metadata_json,
    );

  return record;
}

export function consumeMagicLinkByHash(tokenHash: string, asOf = nowIso()): MagicLinkToken | null {
  return withDatabaseTransaction(() => {
    const row = getDatabase()
      .prepare(
        `SELECT * FROM magic_link_tokens
         WHERE token_hash = ? AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at > ?`,
      )
      .get(tokenHash, asOf) as MagicLinkToken | undefined;

    if (!row) return null;
    const consumedAt = nowIso();
    getDatabase()
      .prepare("UPDATE magic_link_tokens SET consumed_at = ? WHERE magic_link_id = ? AND consumed_at IS NULL")
      .run(consumedAt, row.magic_link_id);
    return { ...row, consumed_at: consumedAt };
  });
}

export function createMagicLinkSession(input: {
  session_hash: string;
  participant_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
  expires_at: string;
}): MagicLinkSession {
  const record: MagicLinkSession = {
    session_id: crypto.randomUUID(),
    session_hash: input.session_hash,
    participant_id: input.participant_id,
    study_id: input.study_id,
    version_id: input.version_id,
    round_number: input.round_number,
    created_at: nowIso(),
    expires_at: input.expires_at,
  };

  getDatabase()
    .prepare(
      `INSERT INTO magic_link_sessions (
        session_id, session_hash, participant_id, study_id, version_id, round_number, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      record.session_id,
      record.session_hash,
      record.participant_id,
      record.study_id,
      record.version_id,
      record.round_number,
      record.created_at,
      record.expires_at,
    );

  return record;
}

export function getMagicLinkSession(sessionHash: string, asOf = nowIso()): MagicLinkSession | null {
  const row = getDatabase()
    .prepare("SELECT * FROM magic_link_sessions WHERE session_hash = ? AND expires_at > ?")
    .get(sessionHash, asOf) as MagicLinkSession | undefined;
  return row ?? null;
}

export function createSmsNotification(input: {
  participant_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
  provider: string;
  status: SmsNotification["status"];
  preference_snapshot: Record<string, unknown>;
  magic_link_id?: string | null;
  failure_code?: string | null;
}): SmsNotification {
  const now = nowIso();
  const record: SmsNotification = {
    sms_notification_id: crypto.randomUUID(),
    participant_id: input.participant_id,
    study_id: input.study_id,
    version_id: input.version_id,
    round_number: input.round_number,
    provider: input.provider,
    provider_message_id: null,
    status: input.status,
    status_updated_at: input.status === "skipped" || input.status === "failed" ? now : null,
    sent_at: null,
    failed_at: input.status === "failed" ? now : null,
    failure_code: input.failure_code ?? null,
    preference_snapshot_json: JSON.stringify(input.preference_snapshot),
    magic_link_id: input.magic_link_id ?? null,
    created_at: now,
  };

  getDatabase()
    .prepare(
      `INSERT INTO sms_notifications (
        sms_notification_id, participant_id, study_id, version_id, round_number, provider,
        provider_message_id, status, status_updated_at, sent_at, failed_at, failure_code,
        preference_snapshot_json, magic_link_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      record.sms_notification_id,
      record.participant_id,
      record.study_id,
      record.version_id,
      record.round_number,
      record.provider,
      record.provider_message_id,
      record.status,
      record.status_updated_at,
      record.sent_at,
      record.failed_at,
      record.failure_code,
      record.preference_snapshot_json,
      record.magic_link_id,
      record.created_at,
    );

  return record;
}

export function updateSmsNotificationDelivery(input: {
  sms_notification_id: string;
  provider_message_id?: string | null;
  status: SmsNotification["status"];
  failure_code?: string | null;
}): SmsNotification | null {
  const existing = getDatabase()
    .prepare("SELECT * FROM sms_notifications WHERE sms_notification_id = ?")
    .get(input.sms_notification_id) as SmsNotification | undefined;
  if (!existing) return null;
  const now = nowIso();
  getDatabase()
    .prepare(
      `UPDATE sms_notifications
       SET provider_message_id = ?, status = ?, status_updated_at = ?, sent_at = ?, failed_at = ?, failure_code = ?
       WHERE sms_notification_id = ?`,
    )
    .run(
      input.provider_message_id ?? existing.provider_message_id,
      input.status,
      now,
      input.status === "sent" ? now : existing.sent_at,
      input.status === "failed" ? now : existing.failed_at,
      input.failure_code ?? existing.failure_code,
      input.sms_notification_id,
    );
  return {
    ...existing,
    provider_message_id: input.provider_message_id ?? existing.provider_message_id,
    status: input.status,
    status_updated_at: now,
    sent_at: input.status === "sent" ? now : existing.sent_at,
    failed_at: input.status === "failed" ? now : existing.failed_at,
    failure_code: input.failure_code ?? existing.failure_code,
  };
}

export function listSmsNotifications(filter: {
  study_id: string;
  version_id: string;
  round_number?: number;
}): SmsNotification[] {
  const rows = getDatabase()
    .prepare(
      `SELECT * FROM sms_notifications
       WHERE study_id = ? AND version_id = ?
       ORDER BY created_at DESC`,
    )
    .all(filter.study_id, filter.version_id) as SmsNotification[];
  return rows.filter((row) => filter.round_number === undefined || row.round_number === filter.round_number);
}

export function countSmsNotificationsByParticipant(filter: {
  participant_id: string;
  study_id: string;
  version_id: string;
  statuses?: Array<SmsNotification["status"]>;
  since?: string;
}): number {
  const statuses = filter.statuses?.length ? filter.statuses : ["queued", "sent", "delivered"];
  const placeholders = statuses.map(() => "?").join(", ");
  const params: any[] = [filter.participant_id, filter.study_id, filter.version_id, ...statuses];
  let sql = `SELECT COUNT(*) AS count FROM sms_notifications
    WHERE participant_id = ? AND study_id = ? AND version_id = ? AND status IN (${placeholders})`;
  if (filter.since) {
    sql += " AND created_at >= ?";
    params.push(filter.since);
  }
  const row = getDatabase().prepare(sql).get(...params) as { count: number } | undefined;
  return Number(row?.count ?? 0);
}

export function recordSmsDeliveryEvent(input: {
  provider_message_id: string;
  event_id: string;
  status: string;
}): boolean {
  try {
    getDatabase()
      .prepare(
        `INSERT INTO sms_delivery_events (delivery_event_id, provider_message_id, event_id, status, received_at)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(crypto.randomUUID(), input.provider_message_id, input.event_id, input.status, nowIso());
    return true;
  } catch {
    return false;
  }
}
