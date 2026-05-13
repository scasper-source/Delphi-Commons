# macOS Operator Portable/Internal Package ADR (Phase 2 Planning)

Status: **MACOS OPERATOR PORTABLE PACKAGE PLANNING RECORDED**.
Decision label: **NOT READY FOR HUMAN TESTING**.
Phase status: **Phase 2 Downloadable Laptop Operator Candidate remains IN PROGRESS**.
Date basis: **2026-05-12**.
Track: **`human_testing_candidate`**.

## Purpose

Record the planned Phase 2 path for a future macOS laptop operator portable/internal candidate package, without changing current Windows package behavior and without overclaiming macOS support/readiness.

This ADR is planning-only documentation. It does not implement scripts, packaging automation, installer behavior, signing/notarization, updater flow, real SMS, PWA, native mobile, or external AI behavior.

## Decision Summary

- macOS is **planned** as a future laptop operator path in Phase 2.
- one Apple Silicon internal engineering runtime run was recorded on **2026-05-13** with partial package/build/start evidence and lifecycle defects; this does **not** establish macOS support readiness or human-testing readiness.
- The product remains **NOT READY FOR HUMAN TESTING**.
- Phase 2 remains **IN PROGRESS**.

## Planned Package Shape (Future Candidate)

Planned package class:

- internal portable package candidate for controlled engineering/human-testing-prep work;
- explicit operator command entrypoint (no hidden service);
- clean package root containing only app/runtime launcher artifacts and documentation;
- mutable runtime state stored outside package root.

Planned package-root contents (minimum expectation):

- built frontend artifact;
- built backend artifact;
- operator command wrapper(s) and docs;
- package manifest/inventory note;
- license/notice files;
- no runtime logs, DB, backups, exports, or secrets.

## Planned Runtime Root and Data Layout

Expected runtime root:

- `~/Library/Application Support/DelphiCommons/macos-operator-portable-candidate`

Expected subdirectories under runtime root:

- `db`
- `audit`
- `exports`
- `backups`
- `logs`
- `evidence`
- `state`

Rules:

- Runtime data must live under the runtime root, not in the package root.
- Package root should remain clean across runs.
- No secrets should be committed to repo or bundled into package artifacts.

## Planned Operator Lifecycle Commands

Future macOS operator flow should expose explicit lifecycle commands consistent with Windows operator-process supervision expectations:

- `status`
- `start`
- `health`
- `smoke`
- `backup`
- `reset`
- `restart`
- `stop`

Behavior expectations:

- explicit, operator-visible lifecycle management;
- bounded startup with health-check feedback;
- graceful stop first, bounded forced stop fallback;
- no hidden background service by default.

## Network and Data Safety Posture

- localhost-only default (`127.0.0.1` binding) unless a future separately approved mode changes this.
- no real participant data for this candidate track.
- no secrets in package artifacts.
- no claim of deployment, pilot, or production suitability.

## Runtime Prerequisite Decision (Open)

The macOS runtime dependency posture is unresolved for Phase 2 planning and depends on broader candidate packaging direction:

- Option A: local Node.js/npm prerequisite (documented) for first macOS internal candidate.
- Option B: bundled portable runtime in a later macOS candidate.

Current decision state:

- **Unresolved** pending/paired with the Windows bundled-runtime vs local-prerequisite decision and associated evidence.

## Evidence Status and Required Next Evidence

Current macOS evidence status:

- one Apple Silicon internal engineering runtime run recorded on **2026-05-13** (partial positive evidence with lifecycle defects).
- post-fix real macOS lifecycle rerun remains required before any macOS support/readiness statement.

Minimum evidence required before any macOS support/readiness statement:

- run on real Mac hardware (Apple Silicon and/or Intel statement with explicit tested scope);
- clean package extraction/launch evidence;
- lifecycle command evidence (`start/health/smoke/backup/reset/restart/stop`);
- runtime-root path evidence (including logs/evidence/backups/db/audit/exports/state);
- known-limitations and non-claims evidence kept visible.

Until that evidence exists, macOS remains planning-only for this track.

## Explicit Limitations (Current)

This planned macOS path currently includes **none** of the following:

- `.app` bundle;
- notarization;
- Gatekeeper behavior evidence;
- signing certificate/custody path;
- installer package (`.pkg`) or distribution disk image (`.dmg`);
- updater behavior;
- enterprise distribution path.

Therefore, this ADR does **not** support any macOS support-readiness claim.

## Explicit Non-Claims

This ADR does **not** claim production readiness, pilot readiness, real human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, external AI readiness, or open public release readiness.

The product remains **NOT READY FOR HUMAN TESTING**, and Phase 2 remains **IN PROGRESS**.

## Related Documents

- [Product Readiness Plan for eDelphi](./PRODUCTION_READY_EDELPHI_PLATFORM.md)
- [Backend Packaging and Process Supervision ADR](./BACKEND_PACKAGING_PROCESS_SUPERVISION_ADR.md)
- [Windows Operator Portable Package (Stage 1 Prototype)](./WINDOWS_OPERATOR_PORTABLE_PACKAGE.md)
- [Windows Signing And Distribution Limitations (Phase 2)](./WINDOWS_SIGNING_DISTRIBUTION_LIMITATIONS.md)
- [macOS Signing And Distribution Limitations (Phase 2)](./MACOS_SIGNING_DISTRIBUTION_LIMITATIONS.md)
