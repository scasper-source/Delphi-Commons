# Phase 3 Phone Participant and SMS Candidate Plan/Evidence Matrix

Status: **PHASE 3 PHONE/SMS CANDIDATE PLAN RECORDED**.

Decision label: **NOT READY FOR HUMAN TESTING**.

Phase 3 status: **NOT RUN / IN PLANNING**.

Date basis: 2026-05-12.

## Purpose

Define the implementation and evidence plan for a phone-openable participant experience with SMS-linked entry for a future human testing candidate using synthetic/internal test data only.

## Scope And Boundary

- Documentation-only planning artifact.
- No SMS provider production behavior is implemented by this plan.
- No real SMS credentials are added by this plan.
- No PWA/service worker behavior is added by this plan unless explicitly approved in a separate change.
- No native iOS or Android app behavior is added by this plan.

## Required Implementation Matrix

| Requirement | Planned requirement detail | Current planning status | Evidence owner | Evidence artifact expectation |
| --- | --- | --- | --- | --- |
| Mobile participant entry route from opaque link | Participant can open a phone-safe HTTPS URL carrying only opaque non-identifying token material. | Planned only. Not implemented by this document. | Engineering + QA | Route design note, token format note, and mobile open-flow capture. |
| Neutral SMS copy | Invitation/reminder messages remain neutral and avoid study-sensitive content, diagnosis, risk details, or condition labels. | Planned only. | Product + Compliance reviewer | SMS copy deck with reviewer notes. |
| SMS optional/opt-in | SMS channel is optional and consent/opt-in controlled; participant can use non-SMS fallback entry if defined by study policy. | Planned only. | Product + Engineering | Settings/flow specification and operator checklist step. |
| Phone verification or mock/sandbox equivalent | Verification is either implemented for test channel or explicitly simulated via sandbox/mock flow for synthetic/internal testing. | Planned only. | Engineering | Verification design record or mock/sandbox runbook section. |
| Opaque expiring magic links | Links are expiring and single-use or risk-controlled equivalent; token entropy and expiration are documented. | Planned only. | Engineering + Security reviewer | Link lifecycle specification and test evidence plan. |
| No participant ID/study ID/email/phone/role in URL | URL path/query/fragment excludes direct identifiers and role labels. | Planned only. | Engineering + Privacy reviewer | URL schema review checklist output. |
| SMS audit without raw token/OTP/full phone/message content | Audit logs capture event metadata only (attempt, status, actor, timestamp, template/version) without sensitive fields. | Planned only. | Engineering + Data Custodian | Audit schema note and redaction check evidence. |
| STOP/HELP implemented or simulated | STOP/HELP response path exists or is explicitly simulated for candidate-stage testing with clear operator handling. | Planned only. | Product + Engineering | STOP/HELP behavior note and rehearsal evidence template. |
| Resend/reminder permission gates and rate limits | Staff resend/reminder controls are permission-gated and throttled by defined limits/cooldowns. | Planned only. | Engineering + QA | Permission matrix and rate-limit test checklist. |
| Mobile web task flow: consent, Round 1, later round, no-active-task, closeout, support, withdrawal | Participant can navigate all required task states on phone form factors with clear outcomes and recovery paths. | Planned only. | QA + Study operations reviewer | Scenario checklist with screenshots/screen recordings. |
| PWA cache/storage policy if PWA is in scope | If and only if PWA is approved for scope, cache/storage/session revocation policy is documented and privacy-reviewed. | Deferred pending explicit approval. | Engineering + Privacy reviewer | PWA policy note (conditional) and cache behavior evidence. |

## Required Evidence Matrix

| Evidence requirement | Minimum acceptance evidence | Status |
| --- | --- | --- |
| iPhone/Safari real-device or simulator | Timestamped run evidence covering open-link, consent, task completion, support/withdrawal navigation. | NOT RUN |
| Android/Chrome real-device or emulator | Timestamped run evidence covering open-link, consent, task completion, support/withdrawal navigation. | NOT RUN |
| SMS mock/sandbox outbox or provider sandbox | Outbox log or sandbox transcript proving invitation/reminder dispatch path with synthetic/internal test data. | NOT RUN |
| SMS copy review | Reviewer-marked copy set showing neutral language and prohibited-content checks; governance baseline documented in `PHASE3_SMS_COPY_GOVERNANCE.md`. | NOT RUN |
| Link/token privacy review | Review artifact confirming no identifiers in URL and controlled token exposure handling. | NOT RUN |
| Screenshots/screen recordings | Indexed media set for primary participant states and failure/edge states on phone form factors. | NOT RUN |

## Exit Gate (Future)

A participant tester can receive or simulate SMS, open the phone link, complete consent and tasks, and access support/withdrawal paths using synthetic/internal test data only.

## Limitations

- This is a planning/evidence matrix only; it is not implementation evidence.
- This document does not authorize real participant outreach or real human-subjects activity.
- This document does not establish production SMS deliverability or telecom compliance.
- This document does not prove accessibility compliance or security certification.

## Remaining Blockers

- No completed phone-device evidence runs are attached yet.
- SMS channel behavior remains unverified in mock/sandbox evidence.
- Link/token privacy review artifacts are not yet recorded.
- STOP/HELP behavior evidence is not yet recorded.
- Permission/rate-limit enforcement evidence is not yet recorded.

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
