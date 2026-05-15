/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

const { getSmsProvider } = await import("../dist/core/smsProvider.js");
const Fastify = (await import("fastify")).default;
const { getServerConfig } = await import("../dist/core/config.js");
const { registerSecurity, resetRateLimitsForTests } = await import("../dist/core/security.js");
const { smsRoutes } = await import("../dist/routes/sms.js");

const accountSid = `AC${"a".repeat(32)}`;
const authToken = "twilio-test-auth-token";
const messagingServiceSid = `MG${"b".repeat(32)}`;
const messageSid = `SM${"c".repeat(32)}`;

function resetTwilioEnv() {
  delete process.env.EDELPHI_SMS_PROVIDER;
  delete process.env.EDELPHI_ENABLE_REAL_SMS;
  delete process.env.EDELPHI_REAL_SMS_ACK;
  delete process.env.EDELPHI_PUBLIC_PARTICIPANT_ORIGIN;
  delete process.env.EDELPHI_TWILIO_WEBHOOK_BASE_URL;
  delete process.env.EDELPHI_TWILIO_STATUS_CALLBACK_URL;
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_MESSAGING_SERVICE_SID;
  delete process.env.TWILIO_PHONE_NUMBER;
}


function setBaseTwilioEnv() {
  process.env.EDELPHI_SMS_PROVIDER = "twilio";
  process.env.TWILIO_ACCOUNT_SID = accountSid;
  process.env.TWILIO_AUTH_TOKEN = authToken;
  process.env.TWILIO_MESSAGING_SERVICE_SID = messagingServiceSid;
  process.env.EDELPHI_TWILIO_WEBHOOK_BASE_URL = "https://hooks.example.test";
  process.env.EDELPHI_PUBLIC_PARTICIPANT_ORIGIN = "https://participant.example.test";
  process.env.TWILIO_PHONE_NUMBER = "+15558675309";
}


function twilioSignature(url, params, token) {
  const payload = Object.keys(params)
    .sort()
    .reduce((acc, key) => `${acc}${key}${params[key]}`, url);
  return crypto.createHmac("sha1", token).update(payload).digest("base64");
}

test("twilio provider refuses real sends until explicit real-SMS gates are set", async (t) => {
  resetTwilioEnv();
  t.after(resetTwilioEnv);
  setBaseTwilioEnv();

  const provider = getSmsProvider();
  assert.equal(provider.name, "twilio");
  await assert.rejects(
    () => provider.sendSms({ to: "+15550101234", body: "Neutral test body", metadata: {} }),
    /twilio_real_sms_requires_explicit_enablement_and_acknowledgement/,
  );
});

test("twilio provider sends via Messaging Service with redacted local inputs and status callback", async (t) => {
  resetTwilioEnv();
  setBaseTwilioEnv();
  process.env.EDELPHI_ENABLE_REAL_SMS = "true";
  process.env.EDELPHI_REAL_SMS_ACK = "TWILIO_REAL_SMS_REVIEWED_AND_APPROVED";
  t.after(resetTwilioEnv);

  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit = null;
  globalThis.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedInit = init;
    return { ok: true, status: 201, json: async () => ({ sid: messageSid, status: "queued" }) };
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const result = await getSmsProvider().sendSms({
    to: "+15550101234",
    body: "Delphi study update: your secure session link is ready: https://participant.example.test/m/opaque. Participation is optional. Reply HELP for support or STOP to opt out.",
    metadata: { participant_id: "should-not-be-sent-to-provider" },
  });

  assert.equal(result.providerMessageId, messageSid);
  assert.equal(result.status, "queued");
  assert.equal(capturedUrl, `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`);
  assert.equal(
    capturedInit.headers.Authorization,
    `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
  );
  const body = capturedInit.body;
  assert.equal(body.get("To"), "+15550101234");
  assert.equal(body.get("MessagingServiceSid"), messagingServiceSid);
  assert.equal(body.get("StatusCallback"), "https://hooks.example.test/sms/webhook");
  assert.equal(body.has("participant_id"), false);
});

test("twilio webhook signature validation and parsers accept delivery and inbound forms", (t) => {
  resetTwilioEnv();
  setBaseTwilioEnv();
  t.after(resetTwilioEnv);
  const provider = getSmsProvider();

  const deliveryBody = { MessageSid: messageSid, MessageStatus: "delivered" };
  const deliveryReq = {
    url: "/sms/webhook",
    body: deliveryBody,
    headers: {
      "x-twilio-signature": twilioSignature("https://hooks.example.test/sms/webhook", deliveryBody, authToken),
    },
  };
  assert.equal(provider.verifyWebhookSignature(deliveryReq), true);
  assert.deepEqual(provider.parseDeliveryWebhook(deliveryReq), {
    providerMessageId: messageSid,
    eventId: messageSid,
    status: "delivered",
  });

  const inboundBody = { MessageSid: messageSid, From: "+15550109999", Body: "STOP", OptOutType: "STOP" };
  const inboundReq = {
    url: "/sms/twilio/inbound",
    body: inboundBody,
    headers: {
      "x-twilio-signature": twilioSignature("https://hooks.example.test/sms/twilio/inbound", inboundBody, authToken),
    },
  };
  assert.equal(provider.verifyWebhookSignature(inboundReq), true);
  assert.deepEqual(provider.parseInboundWebhook(inboundReq), {
    providerMessageId: messageSid,
    eventId: messageSid,
    from: "+15550109999",
    body: "STOP",
    optOutType: "STOP",
  });
});

test("sms setup status exposes Twilio connection readiness without secrets", async (t) => {
  resetTwilioEnv();
  setBaseTwilioEnv();
  process.env.EDELPHI_ENABLE_REAL_SMS = "true";
  process.env.EDELPHI_REAL_SMS_ACK = "TWILIO_REAL_SMS_REVIEWED_AND_APPROVED";
  process.env.EDELPHI_TWILIO_CONNECT_URL = "https://www.twilio.com/authorize/CNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  t.after(resetTwilioEnv);

  resetRateLimitsForTests();
  const config = getServerConfig();
  const app = Fastify({ logger: false, bodyLimit: config.bodyLimitBytes });
  registerSecurity(app, config);
  await app.register(smsRoutes);
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "GET",
    url: "/sms/setup-status",
    headers: { "x-user-id": "owner-1", "x-user-role": "owner" },
  });
  assert.equal(response.statusCode, 200, response.body);
  const body = response.json();
  assert.equal(body.setup.provider, "twilio");
  assert.equal(body.setup.ready_for_real_sms_attempt, true);
  assert.equal(body.setup.auth_token_configured, true);
  assert.equal(body.setup.connect_url, "https://www.twilio.com/authorize/CNaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  const serialized = JSON.stringify(body);
  assert.doesNotMatch(serialized, new RegExp(authToken));
  assert.doesNotMatch(serialized, new RegExp(accountSid));
  assert.doesNotMatch(serialized, new RegExp(messagingServiceSid));
  assert.doesNotMatch(serialized, /\+15558675309|15558675309/);
  assert.doesNotMatch(serialized.toLowerCase(), /\"otp\"\s*:|\"token\"\s*:/);
});
