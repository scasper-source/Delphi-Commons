# Phase 3 SMS Evidence Packet (Mock/Sandbox + Provider Template)

Status: **MOCK/SANDBOX EVIDENCE RECORDED; PROVIDER EVIDENCE TEMPLATE READY; REAL PROVIDER EVIDENCE NOT RUN**.

Decision label: **NOT READY FOR HUMAN TESTING**.

Date basis: 2026-05-15.

## Purpose

This packet consolidates Phase 3 SMS evidence requirements before human testing:

1. Local mock/sandbox implementation evidence.
2. Provider (Twilio) sandbox/real-provider template sections.
3. Explicit NOT RUN / PROVIDER_REQUIRED placeholders when real-provider environment variables are absent.

Mock/sandbox is the default posture. Real provider behavior is gated and deferred.

## Evidence Classification

- **COMPLETE FOR MOCK/SANDBOX ONLY**: Local synthetic evidence exists.
- **PROVIDER_REQUIRED**: Requires external provider account/configuration/logs.
- **NOT RUN**: Not executed in this repository evidence capture cycle.

## Repository Validation Snapshot

Local follow-up validation on 2026-05-15 covers repository-verifiable evidence only. Commands are shown in portable form for Windows, macOS, and Linux shells; Windows PowerShell may resolve `npm` through the `npm.cmd` shim.

| Command | Result | Evidence interpretation |
| --- | --- | --- |
| `npm --prefix server run build` | PASS | TypeScript/server build evidence for SMS/Twilio code paths. |
| `node scripts/run-tests.mjs "server/tests/smsMagicLink.test.mjs"` | PASS | Mock SMS outbox, neutral copy, opt-in gates, opaque link, one-use token, audit redaction, STOP/HELP simulation, rate limits, role gates, and per-recipient Twilio link-config failure handling. |
| `node scripts/run-tests.mjs "server/tests/twilioSmsProvider.test.mjs"` | PASS | Twilio real-SMS gates, Messaging Service send shape, webhook parsers/signature checks, setup-status no-secret/no-SID response behavior. |
| `npm --prefix server test` | PASS | Full server regression suite; deployment verifier warning/failure fixtures are expected inside tests and the overall command exited 0. |
| `npm --prefix server run security:audit` | PASS | Server high-severity npm audit reported 0 vulnerabilities. |
| `git diff --check` | PASS | Whitespace check passed; Windows checkout may emit LF/CRLF warnings only. |

This snapshot does not include provider dashboard evidence, real provider sends, carrier approval, real-device evidence, accessibility evidence, or human reviewer signoff.

## A) Mock/Sandbox Evidence Packet

| Evidence item | Status | Source / notes |
| --- | --- | --- |
| Mock SMS outbox evidence | COMPLETE FOR MOCK/SANDBOX ONLY | `server/tests/smsMagicLink.test.mjs` asserts outbox send behavior, neutral copy, and opaque link format. |
| Neutral SMS copy evidence | COMPLETE FOR MOCK/SANDBOX ONLY | Copy checks enforce neutral language and STOP/HELP notice. |
| Opt-in status evidence | COMPLETE FOR MOCK/SANDBOX ONLY | Send eligibility checks enforce SMS preference + consent + active enrollment/consent state. |
| Phone verification / mock OTP behavior | COMPLETE FOR MOCK/SANDBOX ONLY | Local OTP start/verify flow is exercised for mock provider path. |
| Opaque magic-link behavior | COMPLETE FOR MOCK/SANDBOX ONLY | `/m/{token}` only; token hash persisted; one-use consume behavior enforced. |
| Resend/reminder rate limits | COMPLETE FOR MOCK/SANDBOX ONLY | Cooldown and cap suppression reasons asserted in tests. |
| Permission-gated staff controls | COMPLETE FOR MOCK/SANDBOX ONLY | Non-privileged role access to SMS policy/contact/send/verification controls is denied. |
| STOP/HELP mock handling | COMPLETE FOR MOCK/SANDBOX ONLY | Staff-gated mock inbound endpoint records HELP and processes STOP consent revocation. |
| Audit redaction evidence | COMPLETE FOR MOCK/SANDBOX ONLY | Tests assert no raw token, OTP, full phone, direct participant IDs, participant/study/email/phone/role query parameters, or sensitive SMS body leakage in the covered paths. |

## B) Provider (Twilio) Evidence Template

Complete this section only after gated provider setup in a non-production environment.

### B1. Messaging Service / Sender Approval / Sandbox Status

- Status: **PROVIDER_REQUIRED**
- Required evidence:
  - Messaging Service SID route selected for Delphi Commons traffic.
  - Sender path evidence (A2P 10DLC / Toll-Free Verification / approved sender type).
  - Sandbox/limited-send status if approval is pending.
- Placeholder:
  - `NOT RUN (PROVIDER_REQUIRED): Twilio sender approval/sandbox artifacts not attached in repository.`

### B2. `/sms/setup-status` Output Evidence

- Status: **COMPLETE FOR MOCK/SANDBOX ONLY** for non-secret readiness flags.
- Status for real provider execution: **PROVIDER_REQUIRED**.
- Repository test coverage confirms the setup-status response does not expose Twilio Account SID, Auth Token, Messaging Service SID, configured raw sender number, OTP, or token fields.
- Capture template:
  - Date/time UTC:
  - Operator role used:
  - Redacted JSON output attached:
  - Assertion: output contains readiness flags only and no secrets/SIDs/raw sender.

### B3. Delivery Callback Evidence (`/sms/webhook`)

- Status: **PROVIDER_REQUIRED**
- Required evidence:
  - Twilio callback request sample (redacted).
  - Signature-validated receipt outcome.
  - Notification status transition evidence (queued/sent/delivered/failed).
- Placeholder:
  - `NOT RUN (PROVIDER_REQUIRED): No real provider callback transcript recorded.`

### B4. Inbound STOP/HELP Provider Evidence (`/sms/twilio/inbound`)

- Status: **PROVIDER_REQUIRED**
- Required evidence:
  - STOP inbound callback and resulting consent/preference change.
  - HELP inbound callback and resulting support audit event.
  - Signature validation outcome.
- Placeholder:
  - `NOT RUN (PROVIDER_REQUIRED): No Twilio inbound STOP/HELP transcript recorded.`

### B5. No-Secret / No-SID Exposure Checks

- Status: **COMPLETE FOR MOCK/SANDBOX ONLY** for setup-status response tests.
- Status for live provider run: **PROVIDER_REQUIRED**.
- Required checks:
  - No Twilio Account SID exposure.
  - No Auth Token exposure.
  - No Messaging Service SID exposure.
  - No raw sender number exposure.
  - No OTP/token exposure in setup status or provider evidence artifacts.

Repository evidence covers `/sms/setup-status` response shape only. Live-provider screenshots, dashboard exports, and callback transcripts must be reviewed separately before they are attached.

### B6. Provider Dashboard Screenshots

- Status: **NOT RUN** unless manually attached.
- Attachment placeholders:
  - Messaging Service configuration screenshot (redacted where required).
  - Sender approval/compliance status screenshot.
  - Message logs screenshot for controlled test sends.
  - STOP/HELP handling dashboard view (if available).

## C) Provider Evidence Execution Rule

If real provider environment variables are not configured, provider evidence execution must remain:

- `NOT RUN (PROVIDER_REQUIRED)`

for provider-only checks/transcripts.

## D) Remaining External Gates Before Human Testing

1. Twilio sender-route approval and compliance artifacts.
2. Provider callback/inbound STOP/HELP transcript evidence.
3. Human reviewer signoffs (SMS copy, privacy/security, Data Custodian).
4. Real-device phone evidence (iPhone/Safari and Android/Chrome).
5. Human-observed synthetic phone walkthrough using the selected laptop package.

## Non-Claims

This packet does **not** claim production readiness, real participant outreach readiness, IRB/legal approval, telecom compliance approval, accessibility certification, or human-testing readiness.
