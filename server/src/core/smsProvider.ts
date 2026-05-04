/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "node:crypto";
import type { FastifyRequest } from "fastify";
import { getServerConfig } from "./config.js";

export type SmsSendInput = {
  to: string;
  body: string;
  metadata: Record<string, string | number | boolean | null>;
};

export type SmsSendResult = {
  providerMessageId: string;
  status: "sent" | "queued";
};

export type NormalizedSmsDeliveryStatus = {
  providerMessageId: string;
  eventId: string;
  status: "delivered" | "undelivered" | "failed" | "sent";
};

export type SmsProvider = {
  name: "mock" | "twilio";
  sendSms(input: SmsSendInput): Promise<SmsSendResult>;
  verifyWebhookSignature(req: FastifyRequest): boolean;
  parseDeliveryWebhook(req: FastifyRequest): NormalizedSmsDeliveryStatus | null;
};

export type MockSmsOutboxEntry = SmsSendInput & SmsSendResult & { sentAt: string };

export const mockSmsOutbox: MockSmsOutboxEntry[] = [];

function mockProvider(): SmsProvider {
  return {
    name: "mock",
    async sendSms(input) {
      const result: SmsSendResult = {
        providerMessageId: `mock-${crypto.randomUUID()}`,
        status: "sent",
      };
      mockSmsOutbox.push({ ...input, ...result, sentAt: new Date().toISOString() });
      return result;
    },
    verifyWebhookSignature() {
      return true;
    },
    parseDeliveryWebhook(req) {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const providerMessageId = String(body.providerMessageId ?? body.MessageSid ?? "");
      const eventId = String(body.eventId ?? body.SmsSid ?? providerMessageId);
      const rawStatus = String(body.status ?? body.MessageStatus ?? "delivered");
      if (!providerMessageId || !eventId) return null;
      const status =
        rawStatus === "failed" || rawStatus === "undelivered" || rawStatus === "sent"
          ? rawStatus
          : "delivered";
      return { providerMessageId, eventId, status };
    },
  };
}

function twilioCompatibleProvider(): SmsProvider {
  return {
    name: "twilio",
    async sendSms(_input) {
      // Production credentials and HTTP delivery are intentionally kept behind this boundary.
      // Real sends should be wired only after production security/IRB readiness.
      throw new Error("twilio_provider_not_configured_for_local_build");
    },
    verifyWebhookSignature(req) {
      const config = getServerConfig();
      if (!config.smsWebhookSecret) return false;
      const signature = req.headers["x-edelphi-sms-signature"];
      if (typeof signature !== "string") return false;
      const payload = JSON.stringify(req.body ?? {});
      const expected = crypto.createHmac("sha256", config.smsWebhookSecret).update(payload).digest("hex");
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    },
    parseDeliveryWebhook(req) {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const providerMessageId = String(body.MessageSid ?? body.providerMessageId ?? "");
      const eventId = String(body.EventSid ?? body.SmsSid ?? providerMessageId);
      const rawStatus = String(body.MessageStatus ?? body.status ?? "");
      if (!providerMessageId || !eventId) return null;
      const status =
        rawStatus === "delivered" || rawStatus === "undelivered" || rawStatus === "failed" || rawStatus === "sent"
          ? rawStatus
          : "sent";
      return { providerMessageId, eventId, status };
    },
  };
}

export function getSmsProvider(): SmsProvider {
  return getServerConfig().smsProvider === "twilio" ? twilioCompatibleProvider() : mockProvider();
}

export function clearMockSmsOutbox() {
  mockSmsOutbox.length = 0;
}
