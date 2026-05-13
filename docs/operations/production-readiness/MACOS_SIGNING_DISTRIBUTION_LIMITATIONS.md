# macOS Signing And Distribution Limitations (Phase 2)

Status: **MACOS SIGNING/DISTRIBUTION LIMITATIONS RECORDED**.
Decision label: **NOT READY FOR HUMAN TESTING**.
Phase status: **Phase 2 Downloadable Laptop Operator Candidate remains IN PROGRESS**.
Date basis: **2026-05-12**.
Track: **`human_testing_candidate`**.

Branch/commit basis: derived from the current repository branch and commit at the time this note is recorded. See local Git metadata for the exact branch and commit hash associated with this documentation update.

## Purpose

Record current macOS signing and distribution limitations for the planned Phase 2 macOS portable/internal operator package path, so evidence boundaries are explicit and overclaim-safe.

## Current Artifact Classification

The current macOS package path is:

- a planned future internal portable/internal operator package path;
- scoped as a future candidate path only if a Mac tester is available;
- planning-level documentation only for this track.

The current macOS package path is not:

- a shipped macOS package;
- evidence of macOS support readiness;
- evidence of installer readiness;
- evidence of production or human-testing readiness.

## Explicit Evidence Boundaries

At this time, the record contains **no** evidence of:

- Apple Developer ID signing execution for any macOS candidate artifact;
- notarization submission/approval;
- Gatekeeper behavior;
- quarantine attribute behavior;
- `.app` bundle packaging;
- `.pkg` installer packaging;
- `.dmg` packaging;
- updater behavior;
- uninstall/upgrade lifecycle behavior;
- enterprise distribution path;
- MDM/Jamf/Intune deployment behavior;
- Intel/Apple Silicon compatibility coverage;
- macOS version support matrix commitments;
- accessibility/security/legal/IRB certification evidence.

One Apple Silicon internal engineering runtime run was recorded on **2026-05-13** in a dedicated evidence note; that run does not close signing/distribution blockers and does not establish macOS support readiness.

## Relationship To Phase 2 Blockers

This note closes only the documentation requirement to record macOS signing/distribution limitations.

This note does **not** close other Phase 2 blockers, including:

- obtaining clean-run macOS operator evidence on a Mac tester machine;
- deciding runtime prerequisite strategy for macOS candidate packaging;
- other open candidate hardening and evidence tasks tracked in the product readiness plan.

## Limitations

- Distribution posture is planning-only and internal-candidate scoped.
- No signed or notarized macOS artifact evidence exists.
- No installer/distribution-image evidence exists.
- No updater/uninstall/upgrade lifecycle evidence exists.
- No enterprise rollout path is documented.
- No platform support matrix is documented.

## Remaining Blockers (macOS Signing/Distribution Scope)

- Decide macOS signing strategy (if approved), including certificate source/custody and operational controls.
- Implement and verify signing/notarization workflow (if approved) for any future candidate artifacts.
- Capture Gatekeeper and quarantine behavior evidence for the intended distribution channel.
- Define packaging/distribution path (if approved) and collect install/uninstall/upgrade evidence.
- Record tested hardware/OS scope before any macOS support-readiness claim.

## Explicit Non-Claims

This note does **not** claim production readiness, pilot readiness, real human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, external AI readiness, or open public release readiness.

The product remains **NOT READY FOR HUMAN TESTING**, and Phase 2 remains **IN PROGRESS**.

## Related Documents

- [Product Readiness Plan for eDelphi](./PRODUCTION_READY_EDELPHI_PLATFORM.md)
- [macOS Operator Portable/Internal Package ADR (Phase 2 Planning)](./MACOS_OPERATOR_PORTABLE_PACKAGE_ADR.md)
- [Windows Signing And Distribution Limitations (Phase 2)](./WINDOWS_SIGNING_DISTRIBUTION_LIMITATIONS.md)
