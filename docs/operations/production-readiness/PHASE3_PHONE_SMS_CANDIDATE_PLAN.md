# Phase 3 Phone Participant and SMS Candidate Plan/Evidence Matrix

Status: **PHASE 3 PHONE/SMS CANDIDATE PARTIAL IMPLEMENTATION / EVIDENCE IN PROGRESS**.

Decision label: **NOT READY FOR HUMAN TESTING**.

Phase 3 status: **PARTIALLY IMPLEMENTED IN LOCAL MOCK/SANDBOX; PHONE DEVICE AND HUMAN TESTING EVIDENCE NOT RUN**.

Date basis: 2026-05-13.

## Purpose

Define the implementation and evidence plan for a phone-openable participant experience with SMS-linked entry for a future human testing candidate using synthetic/internal test data only.

## Scope And Boundary

- Documentation-only planning artifact.
- No SMS provider production behavior is implemented by this plan.
- No real SMS credentials are added by this plan.
- PWA/service worker behavior is **deferred for Phase 3**. Mobile web in Safari/Chrome is the candidate surface; no install prompt, offline mode, service worker, background sync, or participant-data cache is in scope unless a later ADR explicitly approves PWA with cache/storage/session-revocation policy and privacy review.
- No native iOS or Android app behavior is added by this plan.

## Required Implementation Matrix

| Requirement | Planned requirement detail | Current status | Evidence owner | Evidence artifact expectation |
| --- | --- | --- | --- | --- |
| Mobile participant entry route from opaque link | Participant can open a phone-safe HTTPS URL carrying only opaque non-identifying token material. | **Complete for local mock/sandbox server/app path; phone-device evidence not run.** App parses `/m/{token}`, server consumes `/magic-links/consume`, and the local browser scaffold exercises the route when a backend/browser are available. | Engineering + QA | Route design note, token format note, and mobile open-flow capture. |
| Neutral SMS copy | Invitation/reminder messages remain neutral and avoid study-sensitive content, diagnosis, risk details, or condition labels. | **Complete as local implementation/governance baseline; human reviewer signoff not run.** Governance note recorded; automated coverage asserts neutral copy and prohibited-language absence. | Product + Compliance reviewer | SMS copy deck with reviewer notes. |
| SMS optional/opt-in | SMS channel is optional and consent/opt-in controlled; participant can use non-SMS fallback entry if defined by study policy. | **Complete for local/mock enforcement.** Send eligibility requires SMS preference, consent, active status, active consent, and verified phone; STOP simulation revokes SMS consent. Non-SMS fallback policy remains study-specific. | Product + Engineering | Settings/flow specification and operator checklist step. |
| Phone verification or mock/sandbox equivalent | Verification is either implemented for test channel or explicitly simulated via sandbox/mock flow for synthetic/internal testing. | **Complete for local/mock OTP flow.** Targeted coverage starts and verifies a development OTP; production provider verification is not claimed. | Engineering | Verification design record or mock/sandbox runbook section. |
| Opaque expiring magic links | Links are expiring and single-use or risk-controlled equivalent; token entropy and expiration are documented. | **Complete for local/mock path.** Opaque URL, hashed token storage, expiry, one-use consumption, and one-active-token-per-participant-round policy are implemented/tested; security signoff is not claimed. | Engineering + Security reviewer | Link lifecycle specification and test evidence plan. |
| No participant ID/study ID/email/phone/role in URL | URL path/query/fragment excludes direct identifiers and role labels. | **Complete for inspected/tested path; real-device URL capture not run.** Static review, regression coverage, and scaffold design use only `/m/{token}` and exclude participant/study/email fields. | Engineering + Privacy reviewer | URL schema review checklist output. |
| SMS audit without raw token/OTP/full phone/message content | Audit logs capture event metadata only (attempt, status, actor, timestamp, template/version) without sensitive fields. | **Complete for local regression scope; Data Custodian review not run.** Tests cover no raw token/OTP/full phone, participant-ID removal from SMS/magic-link audit details, and audit-package detail redaction. | Engineering + Data Custodian | Audit schema note and redaction check evidence. |
| STOP/HELP implemented or simulated | STOP/HELP response path exists or is explicitly simulated for candidate-stage testing with clear operator handling. | **Complete for local/mock simulation.** Staff-gated `/sms/mock/inbound-keyword` simulates STOP consent revocation and HELP support audit; carrier/provider behavior is not implemented. | Product + Engineering | STOP/HELP behavior note and rehearsal evidence template. |
| Resend/reminder permission gates and rate limits | Staff resend/reminder controls are permission-gated and throttled by defined limits/cooldowns. | **Complete for local/mock enforcement.** Staff permission checks, 10-minute cooldown, and daily cap of 2 per participant are covered by automated suppression-reason assertions. | Engineering + QA | Permission matrix and rate-limit test checklist. |
| Mobile web task flow: consent, Round 1, later round, no-active-task, closeout, support, withdrawal | Participant can navigate all required task states on phone form factors with clear outcomes and recovery paths. | **Partial.** Local browser scaffold covers `/m/{token}`, Round 1 submit attempt, single-use rejection, and invalid-token rejection; support/withdrawal/no-active-task and real-device scenario evidence remain open. | QA + Study operations reviewer | Scenario checklist with screenshots/screen recordings plus local scaffold artifact. |
| PWA cache/storage policy if PWA is in scope | If and only if PWA is approved for scope, cache/storage/session revocation policy is documented and privacy-reviewed. | **Deferred for Phase 3 by charter-based scope decision.** Mobile web satisfies the near-term device-agnostic participation goal with less cache/storage/session risk. | Engineering + Privacy reviewer | No Phase 3 artifact required beyond this deferral record; future PWA work requires a separate ADR and evidence plan. |

## Required Evidence Matrix

| Evidence requirement | Minimum acceptance evidence | Status |
| --- | --- | --- |
| iPhone/Safari real-device or simulator | Timestamped run evidence covering open-link, consent, task completion, support/withdrawal navigation. | NOT RUN |
| Android/Chrome real-device or emulator | Timestamped run evidence covering open-link, consent, task completion, support/withdrawal navigation. | NOT RUN |
| SMS mock/sandbox outbox or provider sandbox | Outbox log or sandbox transcript proving invitation/reminder dispatch path with synthetic/internal test data. | **PARTIAL/PASS for targeted local automated path.** Server regression coverage passes; local browser scaffold passed on 2026-05-13 with live backend/frontend prerequisites and wrote redacted artifacts. Provider sandbox evidence is not run. |
| SMS copy review | Reviewer-marked copy set showing neutral language and prohibited-content checks; governance baseline documented in `PHASE3_SMS_COPY_GOVERNANCE.md`. | **PARTIAL - governance baseline and automated copy checks recorded; human reviewer signoff not run.** |
| Link/token privacy review | Review artifact confirming no identifiers in URL and controlled token exposure handling. | **PARTIAL - review and local remediation recorded in `PHASE3_MAGIC_LINK_PRIVACY_REVIEW.md`; independent Security/Privacy or Data Custodian signoff not run.** |
| Screenshots/screen recordings | Indexed media set for primary participant states and failure/edge states on phone form factors. | NOT RUN |

## Exit Gate (Future)

A participant tester can receive or simulate SMS, open the phone link, complete consent and tasks, and access support/withdrawal paths using synthetic/internal test data only.

## Limitations

- This matrix includes targeted local implementation evidence, but it is not a complete Phase 3 evidence binder.
- This document does not authorize real participant outreach or real human-subjects activity.
- This document does not establish production SMS deliverability or telecom compliance.
- This document does not prove accessibility compliance or security certification.
- This document explicitly defers PWA/offline/install-to-home-screen behavior for Phase 3; phone evidence is for browser-based mobile web only.

## Remaining Blockers

- No completed phone-device evidence runs are attached yet.
- SMS channel behavior has targeted mock/sandbox test evidence, but no provider sandbox transcript, full real-device walkthrough, or phone-device evidence.
- Link/token privacy review and local remediation are recorded, but independent Security/Privacy and Data Custodian signoff remain open.
- STOP/HELP and permission/rate-limit behavior have local automated evidence only; real carrier/provider behavior and human-observed rehearsal remain open.
- Human reviewer signoff for SMS copy is not yet recorded.
- PWA remains deferred unless a later approved ADR demonstrates a charter-compatible need and covers cache/storage/session-revocation evidence.

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


## Phase 3 local hardening update (2026-05-13)
- Implemented: SMS/magic-link audit `details` no longer include direct `participantId`/`participant_id` fields for magic-link creation/use, round-open send/fail, and phone verification events; object IDs and authorization behavior remain unchanged.
- Implemented: new-send token minimization now revokes prior active participant+study+version+round magic-link tokens before issuing a new token, with regression coverage verifying only one active usable token remains.
- Implemented: audit-package JSON export now applies detail-level redaction for `participantId`/`participant_id` fields to align with reviewer-facing redaction metadata.
- Added regression checks for opaque URL token path, no raw token persistence/audit leakage, OTP and full-phone non-leakage, participant-ID absence from SMS/magic-link audit details, and one-active-token behavior across repeated sends.
- Non-claim boundary: these updates are local engineering hardening only and do not constitute production/pilot/human-subjects/real-SMS readiness claims.


## Phase 3 browser/mobile scaffold update (2026-05-13)
- Added local scripted scaffold: `docs/qc/full-mock-trial/run_phase3_magic_link_browser_scaffold_local.mjs`.
- Scope covered by scaffold: synthetic study/version/participant setup, SMS opt-in + verified phone configuration, mock round-open SMS send verification, local shared-database seeding of an opaque `/m/{token}` for browser entry, mobile-sized browser open and submit attempt, single-use token rejection check, invalid-token rejection check.
- Token handling note: the scaffold does not require an API that exposes mock SMS body text or raw tokens; notification APIs remain redacted.
- Support/withdrawal/no-active-task paths: scaffold validates the Round 1 magic-link path only; full scenario-path evidence still requires targeted scripted extension and human/device walkthrough evidence.
- Local run evidence: `docs/qc/full-mock-trial/artifacts/phase3-magic-link-browser-scaffold-2026-05-13T20-54-54-667Z.md` and `phase3-magic-link-browser-scaffold-latest.json` record a PASS run with redacted token evidence only.
- Explicit non-claim boundary: this scaffold is local automation evidence only; iPhone/Safari and Android/Chrome real-device evidence remain **NOT RUN**.
