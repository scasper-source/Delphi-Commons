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

export function getServerConfig(): ServerConfig {
  const environment = process.env.NODE_ENV === "production"
    ? "production"
    : process.env.NODE_ENV === "test"
      ? "test"
      : "development";

  return {
    port: parsePort(process.env.PORT),
    host: process.env.HOST ?? "127.0.0.1",
    allowedOrigins: parseAllowedOrigins(process.env.EDELPHI_ALLOWED_ORIGINS),
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
  };
}
