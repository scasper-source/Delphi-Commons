# SMS Magic-Link Notifications

This module supports optional round-opening SMS notices for participants who have opted in, consented to study texts, and verified their phone number.

## Safety Model

- SMS is never required for participation.
- A participant must be active, consented, SMS opted-in, phone verified, and covered by an enabled study SMS policy before a text is sent.
- Phone numbers are stored with identity/contact-side preferences, not response records.
- Normal UI and audit records display masked phone references only.
- OTP verification codes, raw magic-link tokens, full phone numbers, and SMS bodies are not written to audit details.
- Magic-link URLs use `/m/{opaque-token}` only. The URL contains no participant ID, study ID, round ID, email, phone number, or role.
- Tokens are generated from 32 random bytes, stored only as hashes, expire by policy, and are single-use.
- Successful link use creates a short-lived HttpOnly cookie session and removes the token from the visible browser URL.

## Environment

- `EDELPHI_SMS_PROVIDER=mock` uses the local development provider and test outbox.
- `EDELPHI_SMS_PROVIDER=twilio` selects the Twilio-compatible provider boundary. Real delivery must be wired only with production secret handling and governance approval.
- `EDELPHI_SMS_WEBHOOK_SECRET` validates delivery callback signatures where configured.
- `EDELPHI_MAGIC_LINK_TTL_MINUTES` defaults to 60 and is capped at 24 hours.
- `EDELPHI_PHONE_OTP_TTL_MINUTES` defaults to 10.

## Neutral Text Rule

Default template:

> A new Delphi study round is open: [Study Short Name]. You may complete it here: [secure link]. Participation remains voluntary.

Forbidden SMS concepts include:

- you must respond
- the group needs you
- please align with the group
- consensus depends on you
- pressure toward consensus or another participant's behavior

## Webhooks

Provider webhook handlers must validate signatures before updating delivery state. Delivery events are idempotent by provider event ID.

## Operational Warning

Real SMS should not be enabled for real human-subjects studies until production security, retention, backup/restore, incident response, provider contract review, and IRB/governance readiness are complete.
