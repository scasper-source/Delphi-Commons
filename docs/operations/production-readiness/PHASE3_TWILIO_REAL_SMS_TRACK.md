# Phase 3 Twilio Real-SMS Track

Status: **IMPLEMENTATION GATED / NOT ENABLED BY DEFAULT / NOT READY FOR REAL PARTICIPANT USE**.

Date basis: 2026-05-14.

Phase 3 classification source: `PHASE3_CLOSEOUT_INDEX.md`.

## Boundary

This track adds a controlled Twilio integration path for future governed testing. It does not approve real participant outreach, human-subjects use, pilot use, production use, telecom compliance, legal approval, IRB/ethics approval, security certification, or accessibility certification.

Real Twilio sends remain blocked unless all technical gates are deliberately configured and the external compliance/review evidence below is recorded.

## Official Twilio References Checked

- Twilio Messages API: `POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`
  - https://www.twilio.com/docs/messaging/api/message-resource
- Twilio webhook signature validation:
  - https://www.twilio.com/docs/usage/webhooks/webhooks-security
- Twilio Messaging Services and Advanced Opt-Out:
  - https://www.twilio.com/docs/messaging/services
  - https://www.twilio.com/docs/messaging/services/tutorials/advanced-opt-out
- Twilio A2P 10DLC compliance overview:
  - https://www.twilio.com/docs/messaging/compliance/a2p-10dlc

## Implemented Technical Gates

Twilio is not the default provider. Mock SMS remains the default.

Twilio sends require all of the following:

- `EDELPHI_SMS_PROVIDER=twilio`
- `EDELPHI_ENABLE_REAL_SMS=true`
- `EDELPHI_REAL_SMS_ACK=TWILIO_REAL_SMS_REVIEWED_AND_APPROVED`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_MESSAGING_SERVICE_SID`
- `EDELPHI_PUBLIC_PARTICIPANT_ORIGIN` using HTTPS and not localhost
- `EDELPHI_TWILIO_WEBHOOK_BASE_URL` using HTTPS and not localhost

The provider uses Twilio Messaging Services rather than direct `From` sender configuration so opt-out/help behavior and carrier registration evidence can be tied to the Messaging Service.

## Implemented Application Behavior

- The operator UI now presents an SMS setup choice for privileged operators. SMS remains off unless the operator chooses the SMS path.
- The setup prompt sends operators to a configured Twilio Connect/setup URL when `EDELPHI_TWILIO_CONNECT_URL` is set, otherwise to the Twilio Messaging Services Console.
- The server exposes `/sms/setup-status` for privileged staff so the UI can show configuration readiness without returning Twilio credentials or SIDs.
- Round-open SMS uses generic neutral copy and an opaque `/m/{token}` link.
- Twilio round links use `EDELPHI_PUBLIC_PARTICIPANT_ORIGIN`; localhost links are rejected for real Twilio sends.
- Phone verification OTP is sent by Twilio when the Twilio provider is enabled; development OTP echo is disabled for Twilio.
- Delivery callbacks are accepted at `/sms/webhook`.
- Inbound Twilio STOP/HELP callbacks are accepted at `/sms/twilio/inbound`.
- Twilio webhooks are validated with the `X-Twilio-Signature` model against the configured public webhook base URL.
- Audit events retain provider message IDs and masked phone references only; raw OTP, raw token, full phone number, and SMS body are not recorded in application audit details.

## External Evidence Still Required

Before any real participant or human-subjects use, record:

- Twilio Messaging Service configuration evidence.
- A2P 10DLC campaign approval, Toll-Free verification, or other applicable sender-route approval for the intended US traffic.
- Opt-in language and consent provenance for every recipient.
- Twilio opt-out/help configuration evidence, including STOP/HELP handling.
- Public HTTPS participant URL and webhook URL evidence.
- Security & Privacy Lead review.
- Data Custodian review of audit/export behavior.
- SMS copy review with reviewer/date.
- Device evidence for iPhone/Safari and Android/Chrome.
- Human testing protocol approval and scope lock before any real human testing.

## Explicit Non-Claims

This track does not claim real SMS readiness, production readiness, pilot readiness, public release readiness, legal/IRB approval, telecom compliance approval, platform support readiness, or human testing readiness.
