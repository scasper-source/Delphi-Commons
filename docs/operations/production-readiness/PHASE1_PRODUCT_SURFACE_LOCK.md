# Phase 1 Product Surface Lock (human_testing_candidate)

Status: complete as planning/scope lock only; refreshed with current evidence pointers. This is not an implementation, deployment, pilot, or production readiness claim.

Date basis: 2026-05-14.

Track: `human_testing_candidate`.

## Owner Decisions (Locked)

The following owner decisions are final for Phase 1 and must not be changed by implementation work without explicit owner re-approval:

- Windows laptop operator path: **INCLUDED** as the primary laptop operator path for the current candidate.
- macOS laptop operator path: **INCLUDED BUT EVIDENCE-DEPENDENT**; one post-fix Apple Silicon internal engineering lifecycle rerun (2026-05-14) passed for the previously observed portable lifecycle defects, but no broad macOS support/readiness claim is made.
- Phone participant path: **REQUIRED as mobile web**; PWA/native install behavior is not required for Phase 3.
- SMS path: **MOCK/SIMULATED/SANDBOX ONLY** for now; real production SMS credentials and delivery operations are deferred.
- Non-SMS fallback: **REQUIRED** via QR code or copy-link.
- PWA path: **DEFERRED / DISABLED BY DEFAULT** for Phase 3; future PWA work requires a separate privacy ADR before any service-worker/cache/storage behavior is enabled.
- Native iOS/Android: **DEFERRED / NOT SHIPPED** unless separately approved.
- External AI mode: **NO EXTERNAL AI** unless a named connector is separately approved.
- Tauri/native installer track: **DEFERRED**; current candidate uses script-based local packages with documented prerequisites and runtime directories.
- Backend packaging/process supervision: **ADR RECORDED**; implementation/evidence continues in Phase 2 package work.

## Product Surface Matrix

| Surface | Status | Phase 1 interpretation |
| --- | --- | --- |
| Windows laptop operator path | Included | Primary operator surface for the candidate package; Phase 2 contains package evidence and remaining Windows clean-machine checks. |
| macOS laptop operator path | Included (evidence-dependent) | In scope with one post-fix Apple Silicon lifecycle rerun recorded; no broad Mac support claim without the Phase 2 support-scope/signing decisions. |
| Phone participant path (mobile web) | Included (required) | Required participant surface; Phase 3 local scaffold covers core mobile task-flow paths, with real-device evidence still pending. |
| SMS invitation/reminder path | Included as mock/sandbox only | Local/mock candidate controls are in Phase 3; real provider production delivery is deferred. |
| Non-SMS participant fallback (QR/copy-link) | Included (required) | Required alternate participant entry. |
| PWA/service-worker install path | Deferred / disabled by default | Not required for Phase 3; not enabled until a future privacy ADR approves cache/storage/session behavior. |
| Native iOS app | Deferred / not shipped | Not part of this candidate scope. |
| Native Android app | Deferred / not shipped | Not part of this candidate scope. |
| External AI connectors | Not included | No external AI mode in this phase. |
| Tauri/native installer implementation | Deferred | Current candidate remains script-based; bundled runtime, installer, updater, and app-store style distribution are separate future tracks. |

## Runtime Architecture (Planning Diagram)

```text
+--------------------------------------------------------------+
| Laptop operator package (Windows included; macOS in scope)   |
|                                                              |
|  Operator UI/API process                                     |
|  - Study setup, session administration, curation, exports    |
|  - Local audit/event capture                                 |
|  - Script-based start/stop/reset/smoke package commands      |
|                                                              |
|  Local storage                                                |
|  - DB, audit logs, backups, exports in local runtime path    |
|  - Secrets from local env/dev secret config only             |
+--------------------------+-----------------------------------+
                           |
                           | Generates opaque participant access link
                           v
               +-------------------------------+
               | Participant entry channels    |
               | - SMS mock/sandbox outbox     |
               | - QR code (fallback)          |
               | - Copy-link (fallback)        |
               +---------------+---------------+
                               |
                               v
                +-------------------------------+
                | Phone participant mobile web  |
                | - Consent/tasks/support paths |
                | - No PWA by default           |
                +-------------------------------+
```

## Data Storage And Secret Handling Statement

- Candidate scope assumes **local operator-managed storage** for database, logs, backups, and exports.
- Secrets remain in local environment/developer secret configuration and must not be committed to repository history.
- SMS in Phase 1 is restricted to mock/sandbox behavior; production SMS credentials and delivery operations are out of scope.
- SMS/magic-link URLs use opaque token material in candidate scope; participant ID, study ID, email, phone, and role must not be embedded in the URL.
- SMS/audit evidence must avoid raw token, OTP, full phone number, and sensitive message content.
- No external AI connectors are enabled in this phase.

## Deferred ADR List

The following decisions are explicitly deferred to separate ADRs before any corresponding implementation or support claim:

1. Tauri/native installer/updater ADR (required before installer or app-shell support claims).
2. PWA privacy ADR (required before enabling service worker/PWA features).
3. Native mobile ADR (required before any iOS/Android native app path).
4. External AI connector ADR (required before any external AI mode).

## Explicit Unsupported-Target Statements

Phase 1 lock does **not** claim:

- production readiness,
- pilot readiness,
- real human-subjects readiness,
- IRB/legal/security/accessibility certification,
- installer readiness,
- real production SMS provider readiness,
- PWA/service-worker/cache readiness,
- native mobile readiness,
- broad macOS support readiness beyond the recorded Apple Silicon internal engineering rerun.

## Phase 1 Exit Gate

Phase 1 is complete only when scope is locked with documented included/deferred/not-shipped surfaces and no implied support outside the matrix.

**Exit gate result (2026-05-14): SATISFIED FOR SCOPE LOCK ONLY.**

## Related Closeout Evidence

- [Phase 1 Product Surface Lock closeout note](./PHASE1_PRODUCT_SURFACE_LOCK_CLOSEOUT.md)
- [Backend Packaging and Process Supervision ADR](./BACKEND_PACKAGING_PROCESS_SUPERVISION_ADR.md)
- [Product Readiness Plan](./PRODUCTION_READY_EDELPHI_PLATFORM.md)
- [Windows Operator Portable Package](./WINDOWS_OPERATOR_PORTABLE_PACKAGE.md)
- [macOS Operator Portable Package](./MACOS_OPERATOR_PORTABLE_PACKAGE.md)
- [macOS Operator Portable Post-Fix Lifecycle Evidence (2026-05-14)](./MACOS_OPERATOR_PORTABLE_POST_FIX_LIFECYCLE_EVIDENCE_2026-05-14.md)
- [Phase 3 Phone/SMS Candidate Plan](./PHASE3_PHONE_SMS_CANDIDATE_PLAN.md)
- [Phase 3 Magic-Link Privacy Review](./PHASE3_MAGIC_LINK_PRIVACY_REVIEW.md)
- [Phase 3 Mobile Web Task-Flow Evidence](./PHASE3_MOBILE_WEB_TASK_FLOW_EVIDENCE.md)
