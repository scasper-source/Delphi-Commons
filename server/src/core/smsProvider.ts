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

export type NormalizedSmsInbound = {
  providerMessageId: string;
  eventId: string;
  from: string;
  body: string;
  optOutType: "STOP" | "START" | "HELP" | null;
};

export type SmsProvider = {
  name: "mock" | "twilio";
  sendSms(input: SmsSendInput): Promise<SmsSendResult>;
  verifyWebhookSignature(req: FastifyRequest): boolean;
  parseDeliveryWebhook(req: FastifyRequest): NormalizedSmsDeliveryStatus | null;
  parseInboundWebhook(req: FastifyRequest): NormalizedSmsInbound | null;
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
    parseInboundWebhook(req) {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const providerMessageId = String(body.providerMessageId ?? body.MessageSid ?? "");
      const eventId = String(body.eventId ?? body.SmsSid ?? providerMessageId);
      const from = String(body.from_phone ?? body.From ?? "");
      const messageBody = String(body.message_text ?? body.Body ?? "");
      if (!providerMessageId || !eventId || !from) return null;
      return { providerMessageId, eventId, from, body: messageBody, optOutType: null };
    },
  };
}

function requireHttpsUrl(value: string | null, name: string): string | null {
  if (!value) return null;
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error(`${name}_must_be_https`);
  if (url.hostname === "localhost" || url.hostname === "127.0.0.1") throw new Error(`${name}_must_not_be_localhost`);
  return url.toString().replace(/\/$/, "");
}

function assertTwilioSendConfig() {
  const config = getServerConfig();
  if (!config.realSmsEnabled || !config.realSmsAcknowledged) {
    throw new Error("twilio_real_sms_requires_explicit_enablement_and_acknowledgement");
  }
  if (!config.twilioAccountSid || !/^AC[0-9a-fA-F]{32}$/.test(config.twilioAccountSid)) {
    throw new Error("twilio_account_sid_required");
  }
  if (!config.twilioAuthToken) throw new Error("twilio_auth_token_required");
  if (!config.twilioMessagingServiceSid || !/^MG[0-9a-fA-F]{32}$/.test(config.twilioMessagingServiceSid)) {
    throw new Error("twilio_messaging_service_sid_required");
  }
  if (!config.publicParticipantOrigin) throw new Error("public_participant_origin_required_for_twilio_sms");
  requireHttpsUrl(config.publicParticipantOrigin, "public_participant_origin");
  if (!config.twilioWebhookBaseUrl) throw new Error("twilio_webhook_base_url_required");
  const webhookBaseUrl = requireHttpsUrl(config.twilioWebhookBaseUrl, "twilio_webhook_base_url");
  const statusCallbackUrl = config.twilioStatusCallbackUrl
    ? requireHttpsUrl(config.twilioStatusCallbackUrl, "twilio_status_callback_url")
    : `${webhookBaseUrl}/sms/webhook`;
  return {
    accountSid: config.twilioAccountSid,
    authToken: config.twilioAuthToken,
    messagingServiceSid: config.twilioMessagingServiceSid,
    statusCallbackUrl,
  };
}

function recordBody(req: FastifyRequest): Record<string, string> {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const record: Record<string, string> = {};
  for (const [key, value] of Object.entries(body)) {
    if (Array.isArray(value)) {
      record[key] = String(value[0] ?? "");
    } else if (value !== undefined && value !== null) {
      record[key] = String(value);
    }
  }
  return record;
}

function requestUrlForTwilioSignature(req: FastifyRequest): string {
  const base = requireHttpsUrl(getServerConfig().twilioWebhookBaseUrl, "twilio_webhook_base_url");
  if (!base) throw new Error("twilio_webhook_base_url_required");
  return `${base}${req.url}`;
}

function computeTwilioSignature(url: string, params: Record<string, string>, authToken: string): string {
  const payload = Object.keys(params)
    .sort()
    .reduce((acc, key) => `${acc}${key}${params[key]}`, url);
  return crypto.createHmac("sha1", authToken).update(payload).digest("base64");
}

function safeCompare(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function twilioCompatibleProvider(): SmsProvider {
  return {
    name: "twilio",
    async sendSms(input) {
      const twilio = assertTwilioSendConfig();
      const params = new URLSearchParams({
        To: input.to,
        Body: input.body,
        MessagingServiceSid: twilio.messagingServiceSid,
      });
      if (twilio.statusCallbackUrl) params.set("StatusCallback", twilio.statusCallbackUrl);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilio.accountSid}:${twilio.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (!response.ok) {
        const code = typeof payload.code === "number" || typeof payload.code === "string" ? String(payload.code) : "unknown";
        throw new Error(`twilio_send_failed_${response.status}_${code}`);
      }
      const providerMessageId = String(payload.sid ?? "");
      if (!providerMessageId) throw new Error("twilio_send_missing_message_sid");
      const status = String(payload.status ?? "queued") === "sent" ? "sent" : "queued";
      return { providerMessageId, status };
    },
    verifyWebhookSignature(req) {
      const config = getServerConfig();
      if (!config.twilioAuthToken) return false;
      const signature = req.headers["x-twilio-signature"];
      if (typeof signature !== "string") return false;
      try {
        const expected = computeTwilioSignature(requestUrlForTwilioSignature(req), recordBody(req), config.twilioAuthToken);
        return safeCompare(signature, expected);
      } catch {
        return false;
      }
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
    parseInboundWebhook(req) {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const providerMessageId = String(body.MessageSid ?? body.SmsSid ?? "");
      const eventId = String(body.SmsSid ?? body.MessageSid ?? providerMessageId);
      const from = String(body.From ?? "");
      const messageBody = String(body.Body ?? "");
      const optOutType = String(body.OptOutType ?? "").toUpperCase();
      if (!providerMessageId || !eventId || !from) return null;
      return {
        providerMessageId,
        eventId,
        from,
        body: messageBody,
        optOutType: optOutType === "STOP" || optOutType === "START" || optOutType === "HELP" ? optOutType : null,
      };
    },
  };
}

export function getSmsProvider(): SmsProvider {
  return getServerConfig().smsProvider === "twilio" ? twilioCompatibleProvider() : mockProvider();
}

export function clearMockSmsOutbox() {
  mockSmsOutbox.length = 0;
}
