# Phase 3 SMS Copy Governance and Reviewer Packet

Status: **REVIEWER PACKET UPDATED (2026-05-15)**.

Decision label: **NOT READY FOR HUMAN TESTING**.

Phase 3 classification source: `PHASE3_CLOSEOUT_INDEX.md`.

## Scope and boundary

This packet records copy governance for **mock/sandbox SMS-linked participant entry** in Phase 3.

- Documentation-only governance record.
- No provider production credentials are added.
- No real SMS production delivery is enabled.

## Reviewer-ready SMS message class table

Reviewer status values are intentionally initialized to `NOT REVIEWED` until human signoff occurs.

| Message class | Exact copy/template | Includes link? | Study-sensitive content in body? | Participation framed optional? | STOP/HELP handling | Reviewer status |
|---|---|---:|---:|---:|---|---|
| Invitation | `Delphi study update: your secure session link is ready: {short_link}. Participation is optional. Reply HELP for support or STOP to opt out.` | Yes (`{short_link}`) | No | Yes (`Participation is optional`) | Explicit STOP + HELP instructions in body; inbound keyword processing supports both | **NOT REVIEWED** |
| Reminder | `Delphi reminder: a secure session link is available: {short_link}. Participation is optional. Reply HELP for support or STOP to opt out.` | Yes (`{short_link}`) | No | Yes (`Participation is optional`) | Explicit STOP + HELP instructions in body; inbound keyword processing supports both | **NOT REVIEWED** |
| Phone verification | `Delphi phone verification code: {otp}. It expires in {ttl_minutes} minutes. Reply STOP to opt out.` | No | No (contains OTP only) | N/A (verification transaction message; not participation prompt) | STOP instruction in body; no HELP string in template | **NOT REVIEWED** |
| STOP confirmation | **No outbound STOP confirmation SMS template currently surfaced in app/provider logic.** | N/A | N/A | N/A | Inbound STOP is processed and sets participant preference to `no_sms` + revokes consent in stored preference state; no outbound confirmation text defined | **NOT REVIEWED** |
| HELP/support response | **No outbound HELP auto-response SMS template currently surfaced in app/provider logic.** | N/A | N/A | N/A | Inbound HELP is processed and audited as support-needed; follow-up support workflow is external/manual | **NOT REVIEWED** |
| Error/failure message surfaced to participant | **No participant-facing SMS failure/error template currently surfaced.** Delivery failures are handled via staff-facing audit/notification metadata. | No | No | N/A | Not applicable for outbound participant copy in current implementation | **NOT REVIEWED** |

## Source-of-truth mapping (implementation vs packet copy)

- Canonical invitation SMS body currently emitted by server logic: `buildNeutralSmsBody(...)` in `server/src/core/smsNotifications.ts`.
- Phone verification SMS body currently emitted by server logic: `buildPhoneVerificationSmsBody(...)` in `server/src/core/smsNotifications.ts`.
- Inbound STOP/HELP behavior is handled by `handleInboundSmsKeyword(...)` in `server/src/core/smsNotifications.ts` and does not currently include an outbound auto-reply body.

## Copy governance constraints

All invitation/reminder copy used in mock/sandbox testing must satisfy all of the following:

1. **Neutral language**: message text is informational and non-persuasive.
2. **Voluntary participation**: participation is optional and non-coercive.
3. **No study-sensitive content** in message body.
4. Message text must **not** include:
   - diagnoses,
   - allegations,
   - legal strategy,
   - participant responses,
   - consensus status,
   - identity-response hints.
5. Logs/exports must contain **no sensitive message content**.

## STOP/HELP handling requirement

Before any real SMS use, STOP/HELP behavior must be implemented and verified.

For mock/sandbox testing, one of the following must be explicitly documented per run:
- simulated STOP/HELP handling in outbox logs/transcripts, or
- explicit disabled-state note showing no real carrier delivery and no real opt-out transport.

## Signoff placeholders (must remain open until human review)

| Reviewer role | Reviewer name | Date | Status | Notes |
|---|---|---|---|---|
| Security & Privacy Lead | `TBD` | `TBD` | **OPEN** | Awaiting packet review of copy/privacy boundary alignment. |
| Data Custodian | `TBD` | `TBD` | **OPEN** | Awaiting retention/export and identifier-handling validation. |
| SMS copy reviewer | `TBD` | `TBD` | **OPEN** | Awaiting class-by-class copy approval/revision requests. |
| Accessibility/mobile reviewer | `TBD` | `TBD` | **OPEN** | Awaiting mobile readability/comprehension signoff for SMS text patterns. |

## Remaining Phase 3 exit-gate blockers

1. Human reviewers must update class-level statuses from `NOT REVIEWED` to `REVIEWED` or `CHANGES REQUIRED` with dated rationale.
2. STOP/HELP outbound confirmation decision (explicit template vs documented no-auto-reply policy) must be approved by SMS copy + privacy reviewers.
3. Mock/sandbox run evidence must demonstrate opt-in enforcement, resend cooldown/cap behavior, and suppression reasons.
4. Audit/export evidence must continue to prove no raw token/OTP/full phone/sensitive body leakage.
5. Human signoff rows above must remain open until completed by assigned reviewers.

## Explicit non-claims

This note does **not** claim:

- production SMS deliverability,
- telecom/legal regulatory compliance certification,
- human-subjects approval,
- IRB approval,
- security/privacy certification,
- production readiness,
- readiness for human testing.
