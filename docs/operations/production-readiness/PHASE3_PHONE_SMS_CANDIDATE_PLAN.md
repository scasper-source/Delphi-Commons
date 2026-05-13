# Phase 3 Phone Participant and SMS Candidate Plan/Evidence Matrix

Status: **PHASE 3 PHONE/SMS CANDIDATE PARTIAL IMPLEMENTATION / EVIDENCE IN PROGRESS**.

Decision label: **NOT READY FOR HUMAN TESTING**.

Phase 3 status: **PARTIAL - MOCK/SANDBOX SMS MAGIC-LINK PATH HAS TARGETED TEST EVIDENCE; PHONE DEVICE EVIDENCE NOT RUN**.

Date basis: 2026-05-13.

## Purpose

Define the implementation and evidence plan for a phone-openable participant experience with SMS-linked entry for a future human testing candidate using synthetic/internal test data only.

## Scope And Boundary

- Documentation-only planning artifact.
- No SMS provider production behavior is implemented by this plan.
- No real SMS credentials are added by this plan.
- No PWA/service worker behavior is added by this plan unless explicitly approved in a separate change.
- No native iOS or Android app behavior is added by this plan.

## Required Implementation Matrix

| Requirement | Planned requirement detail | Current status | Evidence owner | Evidence artifact expectation |
| --- | --- | --- | --- | --- |
| Mobile participant entry route from opaque link | Participant can open a phone-safe HTTPS URL carrying only opaque non-identifying token material. | **Complete for mock/sandbox server/app path; phone-device evidence not run.** App parses `/m/{token}` and server consumes `/magic-links/consume`; targeted test passed on 2026-05-13. | Engineering + QA | Route design note, token format note, and mobile open-flow capture. |
| Neutral SMS copy | Invitation/reminder messages remain neutral and avoid study-sensitive content, diagnosis, risk details, or condition labels. | **Complete as implementation baseline; human reviewer signoff not run.** Governance note recorded; targeted test asserts neutral copy and prohibited-language absence. | Product + Compliance reviewer | SMS copy deck with reviewer notes. |
| SMS optional/opt-in | SMS channel is optional and consent/opt-in controlled; participant can use non-SMS fallback entry if defined by study policy. | **Complete for positive mock/sandbox path; negative-path evidence partial.** Send eligibility requires SMS preference, consent, active status, active consent, and verified phone. | Product + Engineering | Settings/flow specification and operator checklist step. |
| Phone verification or mock/sandbox equivalent | Verification is either implemented for test channel or explicitly simulated via sandbox/mock flow for synthetic/internal testing. | **Complete for local/mock OTP flow.** Targeted test starts and verifies a development OTP; production provider verification is not claimed. | Engineering | Verification design record or mock/sandbox runbook section. |
| Opaque expiring magic links | Links are expiring and single-use or risk-controlled equivalent; token entropy and expiration are documented. | **Partial.** Opaque URL, hashed token storage, expiry, and one-use consumption are recorded/tested; one-active-token-per-participant-round policy remains open. | Engineering + Security reviewer | Link lifecycle specification and test evidence plan. |
| No participant ID/study ID/email/phone/role in URL | URL path/query/fragment excludes direct identifiers and role labels. | **Complete for inspected/tested path; real-device URL capture not run.** Static review and targeted test show the link path uses only `/m/{token}` and excludes participant/study/email fields. | Engineering + Privacy reviewer | URL schema review checklist output. |
| SMS audit without raw token/OTP/full phone/message content | Audit logs capture event metadata only (attempt, status, actor, timestamp, template/version) without sensitive fields. | **Partial.** Targeted test confirms no raw token/OTP/full phone in audit rows; privacy review found direct participant IDs in SMS/magic-link audit details and export risk. | Engineering + Data Custodian | Audit schema note and redaction check evidence. |
| STOP/HELP implemented or simulated | STOP/HELP response path exists or is explicitly simulated for candidate-stage testing with clear operator handling. | **Not complete.** Governance requirement recorded; execution evidence not run. | Product + Engineering | STOP/HELP behavior note and rehearsal evidence template. |
| Resend/reminder permission gates and rate limits | Staff resend/reminder controls are permission-gated and throttled by defined limits/cooldowns. | **Partial / not evidenced.** Staff UI gating exists for SMS controls, but explicit cooldown/rate-limit thresholds and suppression evidence are not recorded. | Engineering + QA | Permission matrix and rate-limit test checklist. |
| Mobile web task flow: consent, Round 1, later round, no-active-task, closeout, support, withdrawal | Participant can navigate all required task states on phone form factors with clear outcomes and recovery paths. | **Partial.** Magic-link Round 1 response path has targeted server evidence; app has mobile entry surfaces for later-round and support/withdrawal-related flows, but phone-device scenario evidence is not run. | QA + Study operations reviewer | Scenario checklist with screenshots/screen recordings. |
| PWA cache/storage policy if PWA is in scope | If and only if PWA is approved for scope, cache/storage/session revocation policy is documented and privacy-reviewed. | Deferred pending explicit approval. | Engineering + Privacy reviewer | PWA policy note (conditional) and cache behavior evidence. |

## Required Evidence Matrix

| Evidence requirement | Minimum acceptance evidence | Status |
| --- | --- | --- |
| iPhone/Safari real-device or simulator | Timestamped run evidence covering open-link, consent, task completion, support/withdrawal navigation. | NOT RUN |
| Android/Chrome real-device or emulator | Timestamped run evidence covering open-link, consent, task completion, support/withdrawal navigation. | NOT RUN |
| SMS mock/sandbox outbox or provider sandbox | Outbox log or sandbox transcript proving invitation/reminder dispatch path with synthetic/internal test data. | **PASS - targeted server test on 2026-05-13** |
| SMS copy review | Reviewer-marked copy set showing neutral language and prohibited-content checks; governance baseline documented in `PHASE3_SMS_COPY_GOVERNANCE.md`. | **PARTIAL - governance baseline recorded; human reviewer signoff not run** |
| Link/token privacy review | Review artifact confirming no identifiers in URL and controlled token exposure handling. | **PARTIAL - review recorded in `PHASE3_MAGIC_LINK_PRIVACY_REVIEW.md`; privacy gaps remain** |
| Screenshots/screen recordings | Indexed media set for primary participant states and failure/edge states on phone form factors. | NOT RUN |

## Exit Gate (Future)

A participant tester can receive or simulate SMS, open the phone link, complete consent and tasks, and access support/withdrawal paths using synthetic/internal test data only.

## Limitations

- This matrix includes a limited targeted implementation-evidence update, but it is not a complete Phase 3 evidence binder.
- This document does not authorize real participant outreach or real human-subjects activity.
- This document does not establish production SMS deliverability or telecom compliance.
- This document does not prove accessibility compliance or security certification.

## Remaining Blockers

- No completed phone-device evidence runs are attached yet.
- SMS channel behavior has targeted mock/sandbox test evidence, but no full runbook transcript, browser walkthrough, or phone-device evidence.
- Link/token privacy review is recorded, but participant-ID audit details, audit-package export redaction, one-active-token policy, and dynamic export verification remain open.
- STOP/HELP behavior evidence is not yet recorded.
- Permission/rate-limit enforcement evidence is not yet recorded.
- Human reviewer signoff for SMS copy is not yet recorded.

## Explicit Non-Claims

This plan does **not** claim:

- production readiness,
- pilot readiness,
- real human-subjects readiness,
- IRB/ethics approval,
- legal approval,
- security certification,
- accessibility certification,
- real SMS readiness,
- PWA readiness,
- native mobile readiness,
- external AI readiness,
- human-testing readiness.
