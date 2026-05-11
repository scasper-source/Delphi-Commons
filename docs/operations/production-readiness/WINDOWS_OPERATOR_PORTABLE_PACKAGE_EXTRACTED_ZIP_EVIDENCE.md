# Windows Operator Portable Package Extracted Zip Evidence

Status: **WINDOWS PORTABLE PACKAGE EXTRACTED ZIP EVIDENCE RECORDED**.

Decision label: **NOT READY FOR HUMAN TESTING**.

Date/time basis: **2026-05-11T18:26:43Z** (UTC environment session).

Track: `human_testing_candidate`.

Branch: `work`.

Commit hash at evidence session start: `6e09f0acddc616e5828169089b07ebb5d4dc2e19`.

## Scope

This document records attempted extracted-zip evidence execution for the Windows portable/internal operator package prototype. The work remained strictly within the Windows portable/internal package prototype documentation lane.

## Environment Constraint

This execution environment does not provide `powershell` or `pwsh`, so Windows PowerShell package build and lifecycle execution commands could not run here.

## Zip Path And Extracted Package Path

- Generated zip path: **NOT GENERATED IN THIS ENVIRONMENT** (PowerShell unavailable).
- Clean extracted package path (`build/windows-operator-portable/extracted-test/`): **NOT CREATED IN THIS ENVIRONMENT** (zip not generated).

## Command-by-Command Evidence

| Command | Result | Evidence |
| --- | --- | --- |
| `pwsh -ExecutionPolicy Bypass -File ./scripts/windows/build-operator-portable-package.ps1` | FAIL | `/bin/bash: pwsh: command not found` |
| `powershell -ExecutionPolicy Bypass -File ./scripts/windows/build-operator-portable-package.ps1` | FAIL | `/bin/bash: powershell: command not found` |
| Extract zip to clean directory | SKIPPED | Prerequisite zip build failed due missing PowerShell runtime. |
| Lifecycle commands from extracted package (`status/start/health/smoke/backup/reset/restart/stop`) | SKIPPED | Extracted package run path was not available. |

## Pass/Fail/Skipped Table

| Check | Status | Notes |
| --- | --- | --- |
| Fresh Windows portable/internal package zip build | FAIL | Missing PowerShell binary in this Linux environment. |
| Clean extracted zip directory separate from staging | SKIPPED | No zip artifact available to extract. |
| Manifest exists and parses as JSON in extracted package | SKIPPED | Extracted package not present. |
| Package README exists | SKIPPED | Extracted package not present. |
| Packaged launcher exists | SKIPPED | Extracted package not present. |
| Static UI server exists | SKIPPED | Extracted package not present. |
| Excluded sensitive material scan before lifecycle | SKIPPED | Extracted package not present. |
| Lifecycle run from extracted package | SKIPPED | Extracted package not present. |
| Excluded sensitive material scan after lifecycle | SKIPPED | Lifecycle not run in this environment. |
| Runtime path evidence under `%LOCALAPPDATA%` | SKIPPED | Windows runtime path unavailable in this environment. |

## Manifest Summary

Not collected in this environment because the package zip could not be built.

## Package Contents Summary

Not collected in this environment because the package zip could not be built and extracted.

## Excluded Sensitive Material Check (Before/After Lifecycle)

Not executed in this environment due blocked build/lifecycle prerequisites.

## Runtime Path Evidence

Not collected in this environment. Expected runtime path remains:

- `%LOCALAPPDATA%\DelphiCommons\windows-operator-portable-candidate`

## Dependency Posture

Current Stage 1 posture remains unchanged:

- local Node.js/npm required on the target Windows machine;
- portable Node runtime is not bundled in the prototype package.

## Limitations

- Evidence in this file is environment-constrained and does not satisfy the extracted-zip Windows execution gate.
- No Windows PowerShell execution occurred here.
- No new package zip/extracted-run evidence was produced in this environment.

## Remaining Blockers

- Run the builder on Windows PowerShell and record generated zip path.
- Extract to a clean directory outside staging and run the full lifecycle command sequence.
- Record before/after sensitive-material checks for the extracted package root.
- Confirm runtime data remains under `%LOCALAPPDATA%\DelphiCommons\windows-operator-portable-candidate`.
- Verify on a second Windows machine or clean Windows user profile.
- Decide portable Node bundling vs local Node/npm prerequisite.

## Explicit Non-Claims

This evidence does **not** claim production readiness, pilot readiness, real human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, or external AI readiness.
