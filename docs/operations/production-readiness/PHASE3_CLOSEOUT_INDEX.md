# Phase 3 Phone/SMS Closeout Index

Status: **REVIEWER-READY INDEX FOR CURRENT IMPLEMENTATION/EVIDENCE STATE**.

Decision label: **NOT READY FOR HUMAN TESTING**.

Date basis: 2026-05-15.

## Classification legend

- **COMPLETE**
- **COMPLETE FOR MOCK/SANDBOX ONLY**
- **NOT RUN**
- **HUMAN_REQUIRED**
- **PROVIDER_REQUIRED**
- **BLOCKED**

## Required implementation and evidence register

| Item | Classification | Evidence/source | Notes |
| --- | --- | --- | --- |
| Opaque `/m/{token}` mobile entry route and token consumption flow | COMPLETE FOR MOCK/SANDBOX ONLY | `PHASE3_PHONE_SMS_CANDIDATE_PLAN.md`, `PHASE3_MAGIC_LINK_PRIVACY_REVIEW.md` | Local engineering and synthetic browser evidence only. |
| Expiring, one-use magic link with one-active-token minimization | COMPLETE FOR MOCK/SANDBOX ONLY | `PHASE3_MAGIC_LINK_PRIVACY_REVIEW.md` | Hardening recorded; no external security certification claimed. |
| URL excludes direct identifiers/role/study metadata | COMPLETE FOR MOCK/SANDBOX ONLY | `PHASE3_MAGIC_LINK_PRIVACY_REVIEW.md` | Real-device URL observation evidence not run. |
| SMS neutral copy baseline + prohibited-content rules | COMPLETE FOR MOCK/SANDBOX ONLY | `PHASE3_SMS_COPY_GOVERNANCE.md` | Governance complete as baseline; reviewer signoff remains open. |
| SMS opt-in gates and fallback policy boundary | COMPLETE FOR MOCK/SANDBOX ONLY | `PHASE3_PHONE_SMS_CANDIDATE_PLAN.md`, `PHASE3_SMS_COPY_GOVERNANCE.md` | Enforced in local tests; study-specific fallback policy remains human-owned. |
| STOP/HELP behavior | COMPLETE FOR MOCK/SANDBOX ONLY | `PHASE3_PHONE_SMS_CANDIDATE_PLAN.md`, `PHASE3_TWILIO_REAL_SMS_TRACK.md` | Simulated locally and Twilio endpoints implemented; carrier/provider proof not run. |
| Resend/reminder permission + cooldown/cap behavior | COMPLETE FOR MOCK/SANDBOX ONLY | `PHASE3_PHONE_SMS_CANDIDATE_PLAN.md`, `PHASE3_SMS_COPY_GOVERNANCE.md` | Local policy enforcement evidence only. |
| Audit redaction (no raw token/OTP/full phone/SMS body in reviewer-facing artifacts) | COMPLETE FOR MOCK/SANDBOX ONLY | `PHASE3_PHONE_SMS_CANDIDATE_PLAN.md`, `PHASE3_MAGIC_LINK_PRIVACY_REVIEW.md` | Data Custodian signoff is still required. |
| Local mobile task-flow scaffold (consent/round/support/wait/closeout/withdrawal) | COMPLETE FOR MOCK/SANDBOX ONLY | `PHASE3_MOBILE_WEB_TASK_FLOW_EVIDENCE.md`, `PHASE3_MOBILE_DEVICE_EVIDENCE_RUNBOOK.md`, `PHASE3_MOBILE_EVIDENCE_TEMPLATES.md` | Headless local browser evidence only (390px) plus manual device runbook/templates. |
| iPhone/Safari device evidence | NOT RUN | `PHASE3_PHONE_SMS_CANDIDATE_PLAN.md` | Must be timestamped and attached before exit gate closure. |
| Android/Chrome device evidence | NOT RUN | `PHASE3_PHONE_SMS_CANDIDATE_PLAN.md` | Must be timestamped and attached before exit gate closure. |
| Accessibility review evidence for phone flow | NOT RUN | `PHASE3_PHONE_SMS_CANDIDATE_PLAN.md` | No accessibility certification/readiness claim. |
| Human-observed phone walkthrough evidence | HUMAN_REQUIRED | `PHASE3_PHONE_SMS_CANDIDATE_PLAN.md` | Human observer transcript/checklist required. |
| SMS copy reviewer signoff package | HUMAN_REQUIRED | `PHASE3_SMS_COPY_GOVERNANCE.md` | Reviewer names/dates/decision required. |
| Privacy/security reviewer signoff on magic-link + audit/export posture | HUMAN_REQUIRED | `PHASE3_MAGIC_LINK_PRIVACY_REVIEW.md` | Independent reviewer approval is open. |
| Data Custodian signoff on audit/export redaction posture | HUMAN_REQUIRED | `PHASE3_PHONE_SMS_CANDIDATE_PLAN.md`, `PHASE3_TWILIO_REAL_SMS_TRACK.md` | Required before human-testing gate closure. |
| Twilio Messaging Service sender-route approval evidence (A2P/TFV/etc.) | PROVIDER_REQUIRED | `PHASE3_TWILIO_REAL_SMS_TRACK.md` | External provider process prerequisite for real SMS. |
| Twilio real send + delivery callback transcript evidence | PROVIDER_REQUIRED | `PHASE3_TWILIO_REAL_SMS_TRACK.md` | Real-provider logs/evidence not run. |
| Public HTTPS participant origin + webhook deployment evidence | PROVIDER_REQUIRED | `PHASE3_TWILIO_REAL_SMS_TRACK.md` | Needed for real SMS path. |
| Real SMS for participant outreach/testing | BLOCKED | `PHASE3_TWILIO_REAL_SMS_TRACK.md` | Blocked pending provider approvals and human governance signoffs. |

## What remains before Phase 3 exit gate can close

1. Run and attach **real device evidence** for iPhone/Safari and Android/Chrome.
2. Complete **human reviewer signoffs**: SMS copy, privacy/security, and Data Custodian.
3. Complete **provider prerequisites** for Twilio real SMS (sender approvals, HTTPS endpoints, delivery/STOP/HELP evidence).
4. Attach **human-observed walkthrough evidence** for the end-to-end phone participant path.
5. Keep all non-claims intact until every required human/provider item is closed.

## Explicit non-claims

This index does **not** claim production readiness, pilot readiness, real human-subjects readiness, real SMS readiness, telecom compliance approval, IRB/legal/security/accessibility certification, or PWA/native mobile readiness.


## Phase 3 device evidence runbook/templates

- Runbook: `PHASE3_MOBILE_DEVICE_EVIDENCE_RUNBOOK.md`
- Templates: `PHASE3_MOBILE_EVIDENCE_TEMPLATES.md`
- Current status of real iPhone/Android execution in this repository: **NOT RUN** (human/device-required).
