# Phase 1 Product Surface Lock (human_testing_candidate)

Status: complete as planning/scope lock only. This is not an implementation, deployment, pilot, or production readiness claim.

Date basis: 2026-05-11.

Track: `human_testing_candidate`.

## Owner Decisions (Locked)

The following owner decisions are final for Phase 1 and must not be changed by implementation work without explicit owner re-approval:

- Windows laptop operator path: **INCLUDED**.
- macOS laptop operator path: **INCLUDED BUT EVIDENCE-DEPENDENT**; one Apple Silicon internal engineering run (2026-05-13) now exists but exposed lifecycle supervision defects, so no macOS support/readiness claim is made.
- Phone participant path: **REQUIRED as mobile web**.
- SMS path: **MOCK/SIMULATED/SANDBOX ONLY** for now; real production SMS deferred.
- Non-SMS fallback: **REQUIRED** via QR code or copy-link.
- PWA path: **DEFERRED / DISABLED BY DEFAULT** pending separate privacy ADR.
- Native iOS/Android: **DEFERRED / NOT SHIPPED** unless separately approved.
- External AI mode: **NO EXTERNAL AI** unless a named connector is separately approved.
- Tauri: **ACCEPTED FOR PLANNING ONLY**; implementation not started.
- Backend packaging/process supervision: **DEFERRED** to separate ADR before Tauri implementation.

## Product Surface Matrix

| Surface | Status | Phase 1 interpretation |
| --- | --- | --- |
| Windows laptop operator path | Included | Primary operator surface for the candidate package. |
| macOS laptop operator path | Included (evidence-dependent) | In scope, but no support claim until Mac build/test evidence is produced. |
| Phone participant path (mobile web) | Included (required) | Required participant surface. |
| SMS invitation/reminder path | Included as mock/sandbox only | Real provider production delivery is deferred. |
| Non-SMS participant fallback (QR/copy-link) | Included (required) | Required alternate participant entry. |
| PWA/service-worker install path | Deferred / disabled by default | Not enabled until privacy ADR approval. |
| Native iOS app | Deferred / not shipped | Not part of this candidate scope. |
| Native Android app | Deferred / not shipped | Not part of this candidate scope. |
| External AI connectors | Not included | No external AI mode in this phase. |
| Tauri implementation | Planning only | Architecture option accepted for planning, but implementation not started. |

## Runtime Architecture (Planning Diagram)

```text
+-------------------------------------------------------------+
| Laptop operator package (Windows included; macOS in scope)  |
|                                                             |
|  Operator UI/API process                                    |
|  - Study setup, session administration, curation, exports   |
|  - Local audit/event capture                                |
|                                                             |
|  Local storage                                               |
|  - DB, audit logs, backups, exports in local runtime path   |
|  - Secrets from local env/dev secret config only            |
+--------------------------+----------------------------------+
                           |
                           | Generates participant access link
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
- No external AI connectors are enabled in this phase.

## Deferred ADR List

The following decisions are explicitly deferred to separate ADRs before any corresponding implementation or support claim:

1. Backend packaging/process supervision ADR (required before Tauri implementation).
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
- real production SMS readiness,
- PWA readiness,
- native mobile readiness,
- macOS support readiness without Mac build/test evidence.

## Phase 1 Exit Gate

Phase 1 is complete only when scope is locked with documented included/deferred/not-shipped surfaces and no implied support outside the matrix.

**Exit gate result (2026-05-11): SATISFIED FOR SCOPE LOCK ONLY.**

## Related Closeout Evidence

- [Phase 1 Product Surface Lock closeout note](./PHASE1_PRODUCT_SURFACE_LOCK_CLOSEOUT.md)
- [Backend Packaging and Process Supervision ADR](./BACKEND_PACKAGING_PROCESS_SUPERVISION_ADR.md)
