/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "node:crypto";
import type { FastifyReply } from "fastify";
import { writeAuditEvent } from "./audit.js";
import { getServerConfig } from "./config.js";
import { parseCookies } from "./security.js";
import { getSmsProvider } from "./smsProvider.js";
import { hasActiveConsent } from "../stores/consentStore.js";
import { listParticipantEnrollments, participantCanSubmit } from "../stores/participantStatusStore.js";
import { getRoundConfig } from "../stores/roundConfigStore.js";
import { getStudy, getStudyVersion } from "../studies/store.js";
import { activeResearchQuestionsFromPacket } from "../studies/researchQuestions.js";
import {
  consumeMagicLinkByHash,
  createMagicLinkSession,
  createMagicLinkToken,
  revokeActiveMagicLinksForParticipantRound,
  createPhoneChallenge,
  createSmsNotification,
  getContactPreference,
  getMagicLinkSession,
  getPhoneChallenge,
  getStudySmsPolicy,
  isNotificationPreference,
  markPhoneVerified,
  publicContactPreference,
  recordPhoneChallengeAttempt,
  recordSmsDeliveryEvent,
  updateSmsNotificationDelivery,
  upsertContactPreference,
  type ParticipantContactPreference,
  type PublicContactPreference,
  type SmsNotification,
  type StudySmsPolicy,
} from "../stores/smsStore.js";

export const MAGIC_LINK_SESSION_COOKIE = "edelphi_magic_session";
const SMS_CONSENT_VERSION = "sms-study-texts-v1";
const MAGIC_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,256}$/;
const OTP_MAX_ATTEMPTS = 5;

const FORBIDDEN_SMS_PHRASES = [
  "you must respond",
  "the group needs you",
  "please align with the group",
  "consensus depends on you",
  "align with the group",
  "outlier",
  "deviant",
];

export type MagicRoundEntryContext = {
  study: {
    study_id: string;
    version_id: string;
    safe_display_name: string;
    purpose: string;
  };
  participant_id: string;
  round: {
    round_number: number;
    title: string;
    status: "open" | "closed" | "completed" | "withdrawn" | "unavailable" | "declined";
    estimated_minutes: number;
    task_type: string;
    controlled_feedback: boolean;
  };
  voluntary_reminder: string;
  controlled_feedback_explanation: string | null;
  research_questions: Array<{
    id: string;
    displayOrder: number;
    text: string;
    shortLabel?: string;
    description?: string;
    requiredForRound1Response: boolean;
    active: boolean;
  }>;
};

export type SmsFanoutResult = {
  eligible_checked: number;
  sent: number;
  skipped: number;
  notifications: SmsNotification[];
};

export function hashSecret(value: string): string {
  return crypto.createHash("sha256").update(value).digest("base64url");
}

export function normalizePhoneE164(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    const normalized = `+${digits.slice(1).replace(/\D/g, "")}`;
    return normalized.length >= 9 && normalized.length <= 16 ? normalized : null;
  }
  const onlyDigits = digits.replace(/\D/g, "");
  if (onlyDigits.length === 10) return `+1${onlyDigits}`;
  if (onlyDigits.length >= 11 && onlyDigits.length <= 15) return `+${onlyDigits}`;
  return null;
}

export function maskPhone(phoneE164: string | null): string | null {
  if (!phoneE164) return null;
  const digits = phoneE164.replace(/\D/g, "");
  const lastFour = digits.slice(-4);
  return lastFour ? `***-***-${lastFour}` : null;
}

export function lastFour(phoneE164: string | null): string | null {
  if (!phoneE164) return null;
  return phoneE164.replace(/\D/g, "").slice(-4) || null;
}

export function buildNeutralSmsBody(input: { safeName: string; magicLinkUrl: string }): string {
  const body = `A new Delphi study round is open: ${input.safeName}. You may complete it here: ${input.magicLinkUrl}. Participation remains voluntary.`;
  const lowered = body.toLowerCase();
  if (FORBIDDEN_SMS_PHRASES.some((phrase) => lowered.includes(phrase))) {
    throw new Error("coercive_sms_language_blocked");
  }
  return body;
}

export function smsTextHasForbiddenLanguage(value: string): boolean {
  const lowered = value.toLowerCase();
  return FORBIDDEN_SMS_PHRASES.some((phrase) => lowered.includes(phrase));
}

export function createMagicToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export async function updateParticipantSmsPreference(input: {
  participant_id: string;
  notification_preference: unknown;
  phone?: string | null;
  sms_consent_granted?: boolean;
  actor_user_id: string;
}): Promise<PublicContactPreference> {
  if (!isNotificationPreference(input.notification_preference)) {
    throw new Error("valid_notification_preference_required");
  }
  const phoneE164 = typeof input.phone === "string" ? normalizePhoneE164(input.phone) : undefined;
  if (input.phone !== undefined && input.phone !== null && !phoneE164) {
    throw new Error("valid_phone_e164_required");
  }
  const updateInput: Parameters<typeof upsertContactPreference>[0] = {
    participant_id: input.participant_id,
    notification_preference: input.notification_preference,
    ...(phoneE164 !== undefined
      ? {
          phone_e164: phoneE164,
          phone_hash: phoneE164 ? hashSecret(phoneE164) : null,
          phone_last_four: lastFour(phoneE164),
        }
      : {}),
    updated_by_user_id: input.actor_user_id,
  };
  if (input.sms_consent_granted !== undefined) {
    updateInput.sms_consent_granted = input.sms_consent_granted;
    if (input.sms_consent_granted) updateInput.sms_consent_version = SMS_CONSENT_VERSION;
  }
  const record = upsertContactPreference(updateInput);

  await writeAuditEvent({
    actor: { userId: input.actor_user_id, role: "owner", systemRoles: ["owner"], authSource: "legacy-dev-header" },
    action: input.sms_consent_granted === false ? "sms_consent_revoked" : "sms_preference_changed",
    object: { type: "participant", id: input.participant_id },
    details: {
      notification_preference: record.notification_preference,
      masked_phone: maskPhone(record.phone_e164),
      sms_consent_granted: Boolean(record.sms_consent_at && !record.sms_consent_revoked_at),
    },
  });
  if (input.sms_consent_granted === true) {
    await writeAuditEvent({
      actor: { userId: input.actor_user_id, role: "owner", systemRoles: ["owner"], authSource: "legacy-dev-header" },
      action: "sms_consent_granted",
      object: { type: "participant", id: input.participant_id },
      details: { sms_consent_version: SMS_CONSENT_VERSION },
    });
  }

  const publicRecord = publicContactPreference(record);
  if (!publicRecord) throw new Error("contact_preference_save_failed");
  return publicRecord;
}

export async function startPhoneVerification(input: {
  participant_id: string;
  actor_user_id: string;
}): Promise<{ challenge_id: string; masked_phone: string; expires_at: string; dev_otp?: string }> {
  const preference = getContactPreference(input.participant_id);
  if (!preference?.phone_e164 || !preference.phone_hash) throw new Error("phone_required_before_verification");
  const config = getServerConfig();
  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + config.phoneOtpTtlMinutes * 60_000).toISOString();
  const challenge = createPhoneChallenge({
    participant_id: input.participant_id,
    phone_hash: preference.phone_hash,
    masked_phone: maskPhone(preference.phone_e164) ?? "***-***-0000",
    otp_hash: hashSecret(otp),
    expires_at: expiresAt,
  });

  await writeAuditEvent({
    actor: { userId: input.actor_user_id, role: "owner", systemRoles: ["owner"], authSource: "legacy-dev-header" },
    action: "phone_verification_started",
    object: { type: "participant", id: input.participant_id },
    details: { masked_phone: challenge.masked_phone, expires_at: challenge.expires_at },
  });

  return {
    challenge_id: challenge.challenge_id,
    masked_phone: challenge.masked_phone,
    expires_at: challenge.expires_at,
    ...(config.environment !== "production" ? { dev_otp: otp } : {}),
  };
}

export async function verifyPhoneOtp(input: {
  challenge_id: string;
  otp: string;
  actor_user_id: string;
}): Promise<PublicContactPreference> {
  const challenge = getPhoneChallenge(input.challenge_id);
  if (!challenge || challenge.consumed_at || challenge.expires_at <= new Date().toISOString()) {
    throw new Error("phone_verification_challenge_unavailable");
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    throw new Error("phone_verification_attempts_exceeded");
  }
  const ok = hashSecret(input.otp.trim()) === challenge.otp_hash;
  recordPhoneChallengeAttempt({ challenge_id: input.challenge_id, consumed: ok });

  await writeAuditEvent({
    actor: { userId: input.actor_user_id, role: "owner", systemRoles: ["owner"], authSource: "legacy-dev-header" },
    action: ok ? "phone_verified" : "phone_verification_failed",
    object: { type: "participant", id: challenge.participant_id },
    details: { challenge_id: challenge.challenge_id, masked_phone: challenge.masked_phone },
  });

  if (!ok) throw new Error("invalid_phone_verification_code");
  const updated = markPhoneVerified({
    participant_id: challenge.participant_id,
    method: "otp",
    updated_by_user_id: input.actor_user_id,
  });
  const publicRecord = publicContactPreference(updated);
  if (!publicRecord) throw new Error("contact_preference_not_found");
  return publicRecord;
}

export async function auditSmsPolicyChange(input: { policy: StudySmsPolicy; actor_user_id: string }) {
  await writeAuditEvent({
    actor: { userId: input.actor_user_id, role: "owner", systemRoles: ["owner"], authSource: "legacy-dev-header" },
    action: "study_sms_policy.updated",
    object: { type: "study_version", id: `${input.policy.study_id}:${input.policy.version_id}` },
    details: {
      studyId: input.policy.study_id,
      versionId: input.policy.version_id,
      sms_enabled: input.policy.sms_enabled,
      notification_safe_name_present: Boolean(input.policy.notification_safe_name),
      safe_name_is_sensitive: input.policy.safe_name_is_sensitive,
      magic_link_ttl_minutes: input.policy.magic_link_ttl_minutes,
    },
  });
}

function eligibilityReason(input: {
  preference: ParticipantContactPreference | null;
  policy: StudySmsPolicy;
  participantStatusOk: boolean;
  activeConsent: boolean;
  roundOpen: boolean;
}): string | null {
  if (!input.policy.sms_enabled) return "study_sms_disabled";
  if (!input.roundOpen) return "round_not_open";
  if (!input.participantStatusOk) return "withdrawn";
  if (!input.preference || (input.preference.notification_preference !== "sms_only" && input.preference.notification_preference !== "both")) {
    return "no_sms_preference";
  }
  if (!input.preference.sms_consent_at || input.preference.sms_consent_revoked_at) return "no_sms_consent";
  if (!input.preference.phone_e164 || !input.preference.phone_verified_at) return "phone_not_verified";
  if (!input.activeConsent) return "no_active_study_consent";
  return null;
}

export async function sendRoundOpenSmsNotifications(input: {
  study_id: string;
  version_id: string;
  round_number: number;
  actor_user_id: string;
  frontend_origin: string;
}): Promise<SmsFanoutResult> {
  const config = getServerConfig();
  const provider = getSmsProvider();
  const policy = getStudySmsPolicy(input, input.actor_user_id, config.magicLinkTtlMinutes);
  const round = getRoundConfig(input);
  const study = await getStudy(input.study_id);
  const enrollments = listParticipantEnrollments(input);
  const notifications: SmsNotification[] = [];
  let sent = 0;
  let skipped = 0;

  await writeAuditEvent({
    actor: { userId: input.actor_user_id, role: "owner", systemRoles: ["owner"], authSource: "legacy-dev-header" },
    action: "round_open_sms_eligible_checked",
    object: { type: "study_version", id: `${input.study_id}:${input.version_id}` },
    details: { studyId: input.study_id, versionId: input.version_id, round_number: input.round_number, participant_count: enrollments.length },
  });

  for (const enrollment of enrollments) {
    const preference = getContactPreference(enrollment.participant_id);
    const preferenceSnapshot = {
      notification_preference: preference?.notification_preference ?? "no_sms",
      sms_consent: Boolean(preference?.sms_consent_at && !preference.sms_consent_revoked_at),
      phone_verified: Boolean(preference?.phone_verified_at),
      masked_phone: preference?.phone_last_four ? `***-***-${preference.phone_last_four}` : null,
    };
    const reason = eligibilityReason({
      preference,
      policy,
      roundOpen: round?.status === "Open",
      participantStatusOk: participantCanSubmit({
        study_id: input.study_id,
        version_id: input.version_id,
        participant_id: enrollment.participant_id,
        round_number: input.round_number,
      }),
      activeConsent: hasActiveConsent({
        participant_id: enrollment.participant_id,
        study_id: input.study_id,
        version_id: input.version_id,
      }),
    });

    if (reason || !preference?.phone_e164) {
      const notification = createSmsNotification({
        participant_id: enrollment.participant_id,
        study_id: input.study_id,
        version_id: input.version_id,
        round_number: input.round_number,
        provider: provider.name,
        status: "skipped",
        failure_code: reason ?? "phone_not_verified",
        preference_snapshot: preferenceSnapshot,
      });
      skipped += 1;
      notifications.push(notification);
      await writeAuditEvent({
        actor: { userId: input.actor_user_id, role: "owner", systemRoles: ["owner"], authSource: "legacy-dev-header" },
        action: "round_open_sms_skipped",
        object: { type: "participant", id: enrollment.participant_id },
        details: { studyId: input.study_id, versionId: input.version_id, round_number: input.round_number, reason: reason ?? "phone_not_verified", preference_snapshot: preferenceSnapshot },
      });
      continue;
    }

    const token = createMagicToken();
    const ttlMinutes = Math.min(Math.max(1, policy.magic_link_ttl_minutes), 24 * 60);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString();
    const revoked_prior_active_links = revokeActiveMagicLinksForParticipantRound({
      participant_id: enrollment.participant_id,
      study_id: input.study_id,
      version_id: input.version_id,
      round_number: input.round_number,
    });
    const magicLink = createMagicLinkToken({
      token_hash: hashSecret(token),
      participant_id: enrollment.participant_id,
      study_id: input.study_id,
      version_id: input.version_id,
      round_number: input.round_number,
      expires_at: expiresAt,
      metadata: { source: "round_open_sms", ttl_minutes: ttlMinutes },
    });
    const notification = createSmsNotification({
      participant_id: enrollment.participant_id,
      study_id: input.study_id,
      version_id: input.version_id,
      round_number: input.round_number,
      provider: provider.name,
      status: "queued",
      preference_snapshot: preferenceSnapshot,
      magic_link_id: magicLink.magic_link_id,
    });
    const safeName =
      policy.notification_safe_name && !policy.safe_name_is_sensitive
        ? policy.notification_safe_name
        : study?.title && study.title.length <= 50 && !policy.safe_name_is_sensitive
          ? study.title
          : "your Delphi study";
    const link = `${input.frontend_origin.replace(/\/$/, "")}/m/${encodeURIComponent(token)}`;
    const body = buildNeutralSmsBody({ safeName, magicLinkUrl: link });

    await writeAuditEvent({
      actor: { userId: input.actor_user_id, role: "owner", systemRoles: ["owner"], authSource: "legacy-dev-header" },
      action: "magic_link_created",
      object: { type: "magic_link", id: magicLink.magic_link_id },
      details: { studyId: input.study_id, versionId: input.version_id, round_number: input.round_number, expires_at: expiresAt, revoked_prior_active_links },
    });

    try {
      const result = await provider.sendSms({
        to: preference.phone_e164,
        body,
        metadata: {
          sms_notification_id: notification.sms_notification_id,
          study_id: input.study_id,
          version_id: input.version_id,
          round_number: input.round_number,
        },
      });
      const updated = updateSmsNotificationDelivery({
        sms_notification_id: notification.sms_notification_id,
        provider_message_id: result.providerMessageId,
        status: "sent",
      });
      sent += 1;
      notifications.push(updated ?? notification);
      await writeAuditEvent({
        actor: { userId: input.actor_user_id, role: "owner", systemRoles: ["owner"], authSource: "legacy-dev-header" },
        action: "round_open_sms_sent",
        object: { type: "sms_notification", id: notification.sms_notification_id },
        details: {
          studyId: input.study_id,
          versionId: input.version_id,
          round_number: input.round_number,
          provider: provider.name,
          provider_message_id: result.providerMessageId,
          masked_phone: preferenceSnapshot.masked_phone,
        },
      });
    } catch (error) {
      const updated = updateSmsNotificationDelivery({
        sms_notification_id: notification.sms_notification_id,
        status: "failed",
        failure_code: error instanceof Error ? error.message : "sms_send_failed",
      });
      skipped += 1;
      notifications.push(updated ?? notification);
      await writeAuditEvent({
        actor: { userId: input.actor_user_id, role: "owner", systemRoles: ["owner"], authSource: "legacy-dev-header" },
        action: "round_open_sms_failed",
        object: { type: "sms_notification", id: notification.sms_notification_id },
        details: { studyId: input.study_id, versionId: input.version_id, round_number: input.round_number, provider: provider.name },
      });
    }
  }

  return { eligible_checked: enrollments.length, sent, skipped, notifications };
}

export function setMagicSessionCookie(reply: FastifyReply, sessionToken: string, expiresAt: string) {
  const config = getServerConfig();
  const secure = config.secureCookies ? "; Secure" : "";
  reply.header(
    "Set-Cookie",
    `${MAGIC_LINK_SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; HttpOnly; Path=/; SameSite=Lax; Expires=${new Date(expiresAt).toUTCString()}${secure}`,
  );
}

export async function consumeMagicLinkToken(input: { token: string }): Promise<{
  session_token: string;
  expires_at: string;
  context: MagicRoundEntryContext;
} | null> {
  if (!MAGIC_TOKEN_PATTERN.test(input.token)) return null;
  const tokenHash = hashSecret(input.token);
  const consumed = consumeMagicLinkByHash(tokenHash);
  if (!consumed) {
    await writeAuditEvent({
      actor: { userId: "anonymous", role: "anonymous", systemRoles: ["anonymous" as any], authSource: "anonymous" },
      action: "magic_link_rejected",
      object: { type: "magic_link", id: "unknown" },
      details: { reason: "expired_used_revoked_or_malformed" },
    });
    return null;
  }
  const sessionToken = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 2 * 60 * 60_000).toISOString();
  createMagicLinkSession({
    session_hash: hashSecret(sessionToken),
    participant_id: consumed.participant_id,
    study_id: consumed.study_id,
    version_id: consumed.version_id,
    round_number: consumed.round_number,
    expires_at: expiresAt,
  });

  await writeAuditEvent({
    actor: { userId: consumed.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
    action: "magic_link_used",
    object: { type: "magic_link", id: consumed.magic_link_id },
    details: { studyId: consumed.study_id, versionId: consumed.version_id, round_number: consumed.round_number },
  });
  await writeAuditEvent({
    actor: { userId: consumed.participant_id, role: "participant", systemRoles: ["participant"], authSource: "invitation" },
    action: "round_started_from_magic_link",
    object: { type: "study_version", id: `${consumed.study_id}:${consumed.version_id}` },
    details: { studyId: consumed.study_id, versionId: consumed.version_id, round_number: consumed.round_number },
  });

  const context = await buildMagicRoundContext({
    participant_id: consumed.participant_id,
    study_id: consumed.study_id,
    version_id: consumed.version_id,
    round_number: consumed.round_number,
  });
  return { session_token: sessionToken, expires_at: expiresAt, context };
}

export function magicSessionFromCookie(cookieHeader: unknown) {
  const token = parseCookies(cookieHeader)[MAGIC_LINK_SESSION_COOKIE];
  if (!token) return null;
  return getMagicLinkSession(hashSecret(token));
}

export async function buildMagicRoundContext(input: {
  participant_id: string;
  study_id: string;
  version_id: string;
  round_number: number;
}): Promise<MagicRoundEntryContext> {
  const study = await getStudy(input.study_id);
  const studyVersion = await getStudyVersion(input.version_id);
  const researchQuestions = activeResearchQuestionsFromPacket(studyVersion?.study_design_packet_json);
  const round = getRoundConfig(input);
  const status =
    !round
      ? "unavailable"
      : !participantCanSubmit(input)
        ? "withdrawn"
        : round.status === "Open"
          ? "open"
          : round.status === "Closed"
            ? "closed"
            : "unavailable";
  return {
    study: {
      study_id: input.study_id,
      version_id: input.version_id,
      safe_display_name: study?.title ?? "your Delphi study",
      purpose: study?.description ?? "A Delphi study using structured rounds and neutral feedback.",
    },
    participant_id: input.participant_id,
    round: {
      round_number: input.round_number,
      title: round?.title ?? `Round ${input.round_number}`,
      status,
      estimated_minutes: input.round_number === 1 ? 10 : 15,
      task_type: round?.task_type ?? "unavailable",
      controlled_feedback: input.round_number > 1 && Boolean(round?.controlled_feedback_enabled),
    },
    voluntary_reminder:
      "You may complete this round, skip or decline this round if permitted by the study protocol, or withdraw according to the study information.",
    controlled_feedback_explanation:
      input.round_number > 1
        ? "You may see neutral group summaries such as medians, response spread, or distributions. This feedback is informational and is not an instruction to change your answers."
        : null,
    research_questions: researchQuestions.map((question) => ({
      id: question.id,
      displayOrder: question.displayOrder,
      text: question.text,
      ...(question.shortLabel ? { shortLabel: question.shortLabel } : {}),
      ...(question.description ? { description: question.description } : {}),
      requiredForRound1Response: question.requiredForRound1Response,
      active: question.active,
    })),
  };
}

export async function updateDeliveryWebhook(input: { req: any }): Promise<boolean> {
  const provider = getSmsProvider();
  if (!provider.verifyWebhookSignature(input.req)) return false;
  const parsed = provider.parseDeliveryWebhook(input.req);
  if (!parsed) return false;
  const inserted = recordSmsDeliveryEvent({
    provider_message_id: parsed.providerMessageId,
    event_id: parsed.eventId,
    status: parsed.status,
  });
  if (!inserted) return true;
  await writeAuditEvent({
    actor: { userId: "sms-provider", role: "system", systemRoles: ["system" as any], authSource: "anonymous" },
    action: "round_open_sms_delivery_status_updated",
    object: { type: "sms_provider_message", id: parsed.providerMessageId },
    details: { provider: provider.name, provider_message_id: parsed.providerMessageId, status: parsed.status },
  });
  return true;
}
