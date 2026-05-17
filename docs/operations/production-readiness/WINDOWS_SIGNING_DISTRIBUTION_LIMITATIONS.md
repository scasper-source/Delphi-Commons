# Windows Signing And Distribution Limitations (Phase 2)

Status: **WINDOWS SIGNING/DISTRIBUTION LIMITATIONS RECORDED**.
Decision label: **NOT READY FOR HUMAN TESTING**.
Phase status: **Phase 2 Downloadable Laptop Operator Candidate remains IN PROGRESS**.
Date basis: **2026-05-17**.
Track: **`human_testing_candidate`**.

Branch/commit basis: derived from the current repository branch and commit at the time this note is recorded. See local Git metadata for the exact branch and commit hash associated with this documentation update.

## Purpose

Record the current Windows signing and distribution limitations for the portable/internal operator package zip and the Windows installer-candidate adapter so Phase 2 evidence is explicit and overclaim-safe.

## Current Artifact Classification

The current Windows distribution surfaces are:

- an internal portable package prototype / release-asset zip path;
- an internal Inno Setup installer-candidate adapter path;
- intended for controlled local engineering/operator-package evidence only;
- dependent on local Node.js/npm at build time;
- designed to use packaged Node and staged production server dependencies at runtime after package build;
- not a signed, reputation-established, clean-profile-proven, human-testing-ready distribution.

The current Windows distribution record is not:

- signed;
- notarized or reputation-established;
- a completed/proven installer release;
- an MSIX/MSI package;
- a Tauri shell;
- an updater-enabled application;
- an enterprise deployment package;
- a public release artifact;
- evidence of Windows support readiness;
- evidence of installer readiness;
- evidence of production or human-testing readiness.

## Explicit Evidence Boundaries

At this time, the record contains **no** evidence of:

- Authenticode/code-signing execution for the package artifact;
- certificate acquisition/custody/signing-key management decisions;
- SmartScreen reputation establishment;
- Microsoft Defender or Smart App Control behavior beyond local engineering runs already documented;
- browser-download warning behavior for external/public download channels;
- final Inno Setup `.exe` generation;
- installer UX behavior from a real installed run;
- uninstall/upgrade/updater behavior;
- enterprise distribution path (for example Intune, SCCM, or managed software catalog rollout);
- support matrix commitments or Windows-version compatibility guarantees.

Local Windows runs remain engineering/package-lifecycle evidence only.

## Relationship To Phase 2 Blockers

This note closes only the documentation requirement to record Windows signing/distribution limitations.

This note does **not** close other Phase 2 blockers, including:

- second Windows machine or clean Windows user profile verification;
- Windows installer executable generation and clean-profile install/start/stop/uninstall evidence;
- other open candidate hardening and evidence tasks tracked in the product readiness plan.

## Limitations

- Package distribution posture remains internal-only and engineering-scoped.
- The portable artifact remains unsigned and non-installer based.
- The installer-candidate adapter is merged, but final `.exe` generation and installed lifecycle evidence remain **NOT RUN** until executed on a Windows host with Inno Setup `ISCC.exe`.
- Local Node/npm remain build-time prerequisites; packaged Node is used for bundled-runtime package lifecycle commands after package build.
- No updater/upgrade lifecycle evidence exists; uninstall evidence is still not captured for a real installer run.
- No enterprise rollout path is documented.

## Remaining Blockers (Windows Signing/Distribution Scope)

- Decide signing strategy (including certificate source, custody model, operational controls, and renewal/revocation process).
- Implement and verify signing flow (if approved) for candidate artifacts.
- Gather SmartScreen/Defender behavior evidence appropriate to the intended distribution channel.
- Complete the approved installer/distribution path, including Inno Setup `.exe` build, install/start/status/stop/uninstall evidence, and upgrade evidence if upgrades are in scope.
- Define explicit supported-Windows-version matrix and verification evidence before any Windows support-readiness claim.

## Explicit Non-Claims

This note does **not** claim production readiness, pilot readiness, real human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, external AI readiness, or open public release readiness.

The product remains **NOT READY FOR HUMAN TESTING**, and Phase 2 remains **IN PROGRESS**.

## Related Documents

- [Product Readiness Plan for eDelphi](./PRODUCTION_READY_EDELPHI_PLATFORM.md)
- [Windows Operator Portable Package (Stage 1 Prototype)](./WINDOWS_OPERATOR_PORTABLE_PACKAGE.md)
- [Windows Operator Portable Package Extracted Zip Evidence](./WINDOWS_OPERATOR_PORTABLE_PACKAGE_EXTRACTED_ZIP_EVIDENCE.md)
- [Windows Installer Candidate ADR](./WINDOWS_INSTALLER_CANDIDATE_ADR.md)
- [Windows Installer Candidate Evidence](./WINDOWS_INSTALLER_CANDIDATE_EVIDENCE_2026-05-17.md)
- [Backend Packaging and Process Supervision ADR](./BACKEND_PACKAGING_PROCESS_SUPERVISION_ADR.md)
