/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ServerConfig } from "./config.js";

export const SESSION_COOKIE_NAME = "edelphi_session";
export const CSRF_COOKIE_NAME = "edelphi_csrf";
export const PARTICIPANT_INVITATION_HEADER = "x-participant-invitation";

type RateBucket = {
  windowStartedAt: number;
  count: number;
};

const rateBuckets = new Map<string, RateBucket>();

function parseRequestPath(url: string): string {
  try {
    return new URL(url, "http://edelphi.local").pathname;
  } catch {
    return "/";
  }
}

function isMutation(method: string): boolean {
  return method === "POST" || method === "PATCH" || method === "DELETE" || method === "PUT";
}

function clientIp(req: FastifyRequest): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

function rateKeyForRequest(req: FastifyRequest): string | null {
  const path = parseRequestPath(req.url);
  if (path.startsWith("/participant/")) {
    const token = participantInvitationToken(req);
    return `invitation:${clientIp(req)}:${token ? crypto.createHash("sha256").update(token).digest("base64url") : "missing"}`;
  }

  if (isMutation(req.method)) {
    return `mutation:${clientIp(req)}`;
  }

  return null;
}

function maxForRequest(req: FastifyRequest, config: ServerConfig): number {
  const path = parseRequestPath(req.url);
  if (path.startsWith("/participant/")) return config.invitationRateLimitMax;
  return config.mutationRateLimitMax;
}

export function consumeRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = rateBuckets.get(key);
  if (!existing || now - existing.windowStartedAt >= windowMs) {
    rateBuckets.set(key, { windowStartedAt: now, count: 1 });
    return { ok: true };
  }

  existing.count += 1;
  if (existing.count <= maxRequests) return { ok: true };

  return {
    ok: false,
    retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - existing.windowStartedAt)) / 1000)),
  };
}

export function resetRateLimitsForTests() {
  rateBuckets.clear();
}

export function parseCookies(header: unknown): Record<string, string> {
  if (typeof header !== "string" || !header.trim()) return {};

  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const index = part.indexOf("=");
    if (index < 1) return acc;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (!key) return acc;
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

export function bearerToken(req: FastifyRequest): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export function requestSessionToken(req: FastifyRequest): string | null {
  return bearerToken(req) ?? parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME] ?? null;
}

export function participantInvitationToken(req: FastifyRequest): string | null {
  const header = req.headers[PARTICIPANT_INVITATION_HEADER];
  return typeof header === "string" && header.trim() ? header.trim() : null;
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function cookieBase(config: ServerConfig, expiresAt?: string): string {
  const parts = ["Path=/", "SameSite=Strict"];
  if (expiresAt) parts.push(`Expires=${new Date(expiresAt).toUTCString()}`);
  if (config.secureCookies) parts.push("Secure");
  return parts.join("; ");
}

export function sessionCookie(token: string, expiresAt: string, config: ServerConfig): string {
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; ${cookieBase(config, expiresAt)}`;
}

export function csrfCookie(token: string, expiresAt: string, config: ServerConfig): string {
  return `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}; ${cookieBase(config, expiresAt)}`;
}

export function clearSessionCookies(config: ServerConfig): string[] {
  const expired = "Thu, 01 Jan 1970 00:00:00 GMT";
  const secure = config.secureCookies ? "; Secure" : "";
  return [
    `${SESSION_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Expires=${expired}${secure}`,
    `${CSRF_COOKIE_NAME}=; Path=/; SameSite=Strict; Expires=${expired}${secure}`,
  ];
}

function requestUsesSessionCookie(req: FastifyRequest): boolean {
  return Boolean(parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME]);
}

function validateCsrf(req: FastifyRequest): boolean {
  if (!isMutation(req.method)) return true;
  const path = parseRequestPath(req.url);
  if (path === "/auth/login") return true;
  if (path.startsWith("/participant/")) return true;
  if (!requestUsesSessionCookie(req)) return true;

  const cookies = parseCookies(req.headers.cookie);
  const csrfCookieValue = cookies[CSRF_COOKIE_NAME];
  const headerValue = req.headers["x-csrf-token"];
  return typeof headerValue === "string" && Boolean(csrfCookieValue) && headerValue === csrfCookieValue;
}

function applySecurityHeaders(reply: FastifyReply, config: ServerConfig) {
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("Referrer-Policy", "no-referrer");
  reply.header("X-Frame-Options", "DENY");
  reply.header("Cache-Control", "no-store");
  reply.header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  reply.header("Cross-Origin-Opener-Policy", "same-origin");
  reply.header("Cross-Origin-Resource-Policy", "same-origin");
  reply.header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  if (config.environment === "production") {
    reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

function applyCors(req: FastifyRequest, reply: FastifyReply, config: ServerConfig): boolean {
  const requestOrigin = req.headers.origin;
  reply.header("Vary", "Origin");

  if (typeof requestOrigin !== "string") return true;
  if (!config.allowedOrigins.includes(requestOrigin)) {
    reply.code(403).send({ error: "cors_origin_not_allowed" });
    return false;
  }

  reply.header("Access-Control-Allow-Origin", requestOrigin);
  reply.header("Access-Control-Allow-Credentials", "true");
  reply.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  reply.header(
    "Access-Control-Allow-Headers",
    `Authorization,Content-Type,X-CSRF-Token,${PARTICIPANT_INVITATION_HEADER},X-User-ID,X-User-Role`,
  );
  return true;
}

export function registerSecurity(app: FastifyInstance, config: ServerConfig) {
  app.addHook("onRequest", async (req, reply) => {
    applySecurityHeaders(reply, config);

    const corsOk = applyCors(req, reply, config);
    if (!corsOk) return;

    if (req.method === "OPTIONS") {
      reply.code(204).send();
      return;
    }

    const key = rateKeyForRequest(req);
    if (key) {
      const rate = consumeRateLimit(key, maxForRequest(req, config), config.rateLimitWindowMs);
      if (!rate.ok) {
        reply.header("Retry-After", String(rate.retryAfterSeconds));
        reply.code(429).send({ error: "rate_limited" });
        return;
      }
    }

    if (!validateCsrf(req)) {
      reply.code(403).send({ error: "csrf_token_required" });
    }
  });

  app.setErrorHandler((error: unknown, _req, reply) => {
    const err = error as { statusCode?: unknown; message?: unknown };
    const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
    const safeError = statusCode >= 500 ? "internal_error" : typeof err.message === "string" ? err.message : "request_error";
    reply.code(statusCode).send({ error: safeError });
  });
}
