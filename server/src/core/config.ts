/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

export type ServerConfig = {
  port: number;
  host: string;
  allowedOrigins: string[];
  environment: "development" | "test" | "production";
  bodyLimitBytes: number;
  rateLimitWindowMs: number;
  authRateLimitMax: number;
  mutationRateLimitMax: number;
  invitationRateLimitMax: number;
  secureCookies: boolean;
  magicLinkTtlMinutes: number;
  phoneOtpTtlMinutes: number;
  smsProvider: "mock" | "twilio";
  smsWebhookSecret: string | null;
  realSmsEnabled: boolean;
  realSmsAcknowledged: boolean;
  publicParticipantOrigin: string | null;
  lanParticipantOrigin: string | null;
  lanParticipantModeEnabled: boolean;
  twilioAccountSid: string | null;
  twilioAuthToken: string | null;
  twilioMessagingServiceSid: string | null;
  twilioWebhookBaseUrl: string | null;
  twilioStatusCallbackUrl: string | null;
  twilioConnectUrl: string | null;
  twilioVerifyServiceSid: string | null;
  emailProvider: "mock" | "smtp";
  smtpHost: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpFromAddress: string | null;
  smtpFromName: string | null;
};

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("invalid_port");
  }
  return port;
}

function parseAllowedOrigins(value: string | undefined): string[] {
  const origins = (value ?? "http://127.0.0.1:5173,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error("allowed_origins_required");
  }

  if (origins.includes("*")) {
    throw new Error("wildcard_cors_origin_disallowed");
  }

  return Array.from(new Set(origins));
}

function parsePositiveInt(value: string | undefined, fallback: number, name: string): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`invalid_${name}`);
  }
  return parsed;
}

function nonEmpty(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseLanParticipantMode(): { enabled: boolean; origin: string | null } {
  const enabled = process.env.EDELPHI_ENABLE_LAN_PARTICIPANT_URL === "1"
    && process.env.EDELPHI_ACK_LAN_SYNTHETIC_ONLY === "1";
  if (!enabled) return { enabled: false, origin: null };
  const origin = nonEmpty(process.env.EDELPHI_LAN_PARTICIPANT_ORIGIN);
  if (!origin) throw new Error("lan_participant_origin_required");
  const parsed = new URL(origin);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("lan_participant_origin_invalid_protocol");
  return { enabled: true, origin: parsed.toString().replace(/\/$/, "") };
}

export function getServerConfig(): ServerConfig {
  const environment = process.env.NODE_ENV === "production"
    ? "production"
    : process.env.NODE_ENV === "test"
      ? "test"
      : "development";

  const lanMode = parseLanParticipantMode();
  const host = lanMode.enabled ? "0.0.0.0" : process.env.HOST ?? "127.0.0.1";
  const allowedOrigins = parseAllowedOrigins(process.env.EDELPHI_ALLOWED_ORIGINS);
  if (lanMode.origin) allowedOrigins.push(lanMode.origin);
  return {
    port: parsePort(process.env.PORT),
    host,
    allowedOrigins: Array.from(new Set(allowedOrigins)),
    environment,
    bodyLimitBytes: parsePositiveInt(process.env.EDELPHI_BODY_LIMIT_BYTES, 256 * 1024, "body_limit_bytes"),
    rateLimitWindowMs: parsePositiveInt(process.env.EDELPHI_RATE_LIMIT_WINDOW_MS, 60 * 1000, "rate_limit_window_ms"),
    authRateLimitMax: parsePositiveInt(process.env.EDELPHI_RATE_LIMIT_AUTH_MAX, 10, "rate_limit_auth_max"),
    mutationRateLimitMax: parsePositiveInt(process.env.EDELPHI_RATE_LIMIT_MUTATION_MAX, 300, "rate_limit_mutation_max"),
    invitationRateLimitMax: parsePositiveInt(process.env.EDELPHI_RATE_LIMIT_INVITATION_MAX, 120, "rate_limit_invitation_max"),
    secureCookies: environment === "production" || process.env.EDELPHI_SECURE_COOKIES === "true",
    magicLinkTtlMinutes: Math.min(
      parsePositiveInt(process.env.EDELPHI_MAGIC_LINK_TTL_MINUTES, 60, "magic_link_ttl_minutes"),
      24 * 60,
    ),
    phoneOtpTtlMinutes: parsePositiveInt(process.env.EDELPHI_PHONE_OTP_TTL_MINUTES, 10, "phone_otp_ttl_minutes"),
    smsProvider: process.env.EDELPHI_SMS_PROVIDER === "twilio" ? "twilio" : "mock",
    smsWebhookSecret: process.env.EDELPHI_SMS_WEBHOOK_SECRET ?? null,
    realSmsEnabled: process.env.EDELPHI_ENABLE_REAL_SMS === "true",
    realSmsAcknowledged: process.env.EDELPHI_REAL_SMS_ACK === "TWILIO_REAL_SMS_REVIEWED_AND_APPROVED",
    publicParticipantOrigin: nonEmpty(process.env.EDELPHI_PUBLIC_PARTICIPANT_ORIGIN),
    lanParticipantOrigin: lanMode.origin,
    lanParticipantModeEnabled: lanMode.enabled,
    twilioAccountSid: nonEmpty(process.env.TWILIO_ACCOUNT_SID),
    twilioAuthToken: nonEmpty(process.env.TWILIO_AUTH_TOKEN),
    twilioMessagingServiceSid: nonEmpty(process.env.TWILIO_MESSAGING_SERVICE_SID),
    twilioWebhookBaseUrl: nonEmpty(process.env.EDELPHI_TWILIO_WEBHOOK_BASE_URL),
    twilioStatusCallbackUrl: nonEmpty(process.env.EDELPHI_TWILIO_STATUS_CALLBACK_URL),
    twilioConnectUrl: nonEmpty(process.env.EDELPHI_TWILIO_CONNECT_URL),
    twilioVerifyServiceSid: nonEmpty(process.env.TWILIO_VERIFY_SERVICE_SID),
    emailProvider: process.env.EDELPHI_EMAIL_PROVIDER === "smtp" ? "smtp" : "mock",
    smtpHost: nonEmpty(process.env.EDELPHI_SMTP_HOST),
    smtpPort: parsePositiveInt(process.env.EDELPHI_SMTP_PORT, 587, "smtp_port"),
    smtpSecure: process.env.EDELPHI_SMTP_SECURE === "true",
    smtpUser: nonEmpty(process.env.EDELPHI_SMTP_USER),
    smtpPass: nonEmpty(process.env.EDELPHI_SMTP_PASS),
    smtpFromAddress: nonEmpty(process.env.EDELPHI_SMTP_FROM_ADDRESS),
    smtpFromName: nonEmpty(process.env.EDELPHI_SMTP_FROM_NAME),
  };
}
