# SMS Setup Guide for Operators

This guide covers what an operator (you or any future deployer) needs to do to enable SMS notifications in Delphi Commons. SMS is used for round-open magic links and phone verification.

## Overview

Each operator runs their own Twilio account. There is no shared central Twilio account. This is intentional — it's the correct compliance pattern for an open-source distribution model where many unrelated operators may run independent studies.

## Step 1: Create a Twilio Account

Sign up at https://www.twilio.com/. You'll need:
- A valid email
- A phone number for account verification
- A payment method (pay-as-you-go is fine for small pilots)

## Step 2: A2P 10DLC Brand Registration (US/Canada)

If you're sending SMS to US numbers, you **must** complete A2P 10DLC registration before your number can send messages. This is a carrier-level requirement, not optional.

### Which registration type?

| Situation | Registration Type |
|-----------|------------------|
| Individual in US/Canada, **no EIN** | Sole Proprietor |
| Has an EIN (any size) | Low Volume Standard or Standard |
| University or institution is the sender | Standard (register as the institution) |

### Critical rules

- **Register under your own real operating entity, not the Delphi Commons project.**
- **If you have an EIN, do not choose Sole Proprietor.** Sole Proprietor is only for individuals without a tax ID.
- **Don't mix identities.** The entity, brand name, website, and opt-in/message flow shown to participants must all line up with whoever is registered. If Clarkson University is the sender, register as Clarkson. If it's your independent project, register as yourself.
- **Sole Proprietor limits:** 1 campaign, 1 phone number, low throughput. Fine for a small pilot.

### Timing

A2P 10DLC registration takes time to complete (days to weeks). Your US local number **cannot send SMS until registration finishes**. Start this well before you need to send round-open notifications to participants.

### References

- [Required information for US A2P 10DLC registration](https://www.twilio.com/docs/messaging/guides/10dlc/a2p-10dlc-registration)
- [Comparison: Sole Proprietor vs Low Volume Standard vs Standard](https://www.twilio.com/docs/messaging/guides/10dlc)
- [A2P 10DLC Brand Registration overview](https://www.twilio.com/docs/messaging/guides/10dlc/a2p-10dlc-brand-registration)

## Step 3: Register a Campaign

After brand registration, register a campaign describing your use case. For a Delphi study, the messaging use case is:

- **Use case:** Research participation notifications
- **Message flow:** Participants enroll via a web interface, provide phone number, verify via OTP, and consent to receive round-open notifications
- **Opt-in:** Collected during enrollment with explicit disclosure
- **Opt-out:** STOP keyword honored immediately; system tracks `sms_consent_revoked_at`
- **Message content:** Round-open magic links and verification codes only (no marketing)

## Step 4: Get a Phone Number

Purchase a US local number in Twilio. After A2P registration completes and your campaign is approved, this number will be able to send SMS.

## Step 5: Enable Twilio Verify (for phone verification)

Delphi Commons uses Twilio Verify for phone number verification (OTP codes).

1. In the Twilio Console, go to **Verify > Services**
2. Create a new Verify Service (name it something like "Delphi Commons Verification")
3. Copy the **Service SID** (starts with `VA...`)

## Step 6: Configure Environment Variables

Set these in your server environment:

```bash
# Twilio credentials (from your Twilio Console dashboard)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1XXXXXXXXXX

# Twilio Verify (for phone OTP)
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# SMS provider mode ("twilio" for real, "mock" for development)
EDELPHI_SMS_PROVIDER=twilio
```

For local development, use `EDELPHI_SMS_PROVIDER=mock` — this skips Twilio entirely and logs messages to an in-memory outbox.

## Step 7: Verify Consent Flow

Before going live with participants, confirm that:

- [ ] Participants see explicit SMS consent disclosure during enrollment
- [ ] Consent timestamp is recorded (`sms_consent_at`)
- [ ] STOP keyword immediately revokes consent (`sms_consent_revoked_at`)
- [ ] HELP keyword returns a help message
- [ ] No messages are sent to participants who haven't consented
- [ ] No messages are sent after consent is revoked

## International Operators

- Sole Proprietor registration is **US/Canada only** and requires no tax ID
- Other countries have different sender registration requirements
- Check Twilio's documentation for your country's messaging regulations
- The general architecture (own account, own registration) still applies everywhere

## For Stephen (Project Owner) — Pilot Notes

- Your first live pilot: register as Sole Proprietor (no EIN, independent project)
- Branding/consent language should say "Delphi Commons" or your name, not Clarkson
- Start A2P registration at least 2 weeks before you need SMS working
- If a future deployment is institutionally owned by Clarkson, register fresh as Clarkson for that deployment
