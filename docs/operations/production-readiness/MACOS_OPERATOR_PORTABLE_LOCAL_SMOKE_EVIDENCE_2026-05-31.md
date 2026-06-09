# macOS Operator Portable Local Smoke Evidence - 2026-05-31

Status: **LOCAL SOURCE-BUILT MACOS PORTABLE SMOKE PASSED WITH FOLLOW-UP FINDINGS / NOT READY FOR HUMAN TESTING**.
Decision label: **NOT CLEAN RELEASE-ASSET MACOS EVIDENCE**.
Phase status: **Phase 2 remains IN PROGRESS**.
Date basis: **2026-05-31**.

## Scope

This document records a macOS Apple Silicon local source-build and portable package lifecycle smoke report provided by tester Ande Wyffels.

This is useful engineering evidence for the shared application and macOS portable lifecycle path at the tested source commit. It is not a clean GitHub-release macOS installer retest and does not supersede the existing `internal-macos-package-candidate-2026-05-18-r4` release-asset evidence.

No real participant data, credentials, secrets, or sensitive exports were reported as used.

## Boundary

This evidence is internal synthetic/low-risk package evidence only. It does not establish or imply production readiness, pilot readiness, human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, broad macOS support readiness, signing, notarization, Gatekeeper readiness, real SMS readiness, PWA readiness, native mobile readiness, external AI readiness, or open public release readiness.

The tested source commit includes the shared application changes through `2a831eee203d70bf295f821712603502667109dd`, but the tester did not run from a newly published macOS release asset that points at that commit.

## Test Metadata

| Item | Value |
| --- | --- |
| Tester | Ande Wyffels |
| Test date | 2026-05-31 |
| Machine architecture | `arm64` |
| macOS version | `26.3` |
| Node | `v26.2.0` |
| npm | `11.13.0` |
| Commit tested | `2a831eee203d70bf295f821712603502667109dd` |
| Branch/source | `main` |
| Package path | `~/Code/Casper/Delphi-Commons/build/macos-portable-bundled-runtime-internal/staging/run-1780256213147-16365/macos-portable-bundled-runtime-internal` |

## Install And Build Results

| Check | Result |
| --- | --- |
| `npm --prefix app ci` | PASS |
| `npm --prefix server ci` | PASS |
| Server build | PASS |
| App build | PASS |
| Server test | PASS |
| macOS portable package build | PASS |

## Lifecycle Results

| Check | Result | Notes |
| --- | --- | --- |
| Initial status | PASS | Reported stopped. |
| Start | PASS | Runtime started. |
| Browser UI loaded | PASS | UI loaded at `http://127.0.0.1:4173`. |
| Smoke after start | PASS | Local smoke passed. |
| Restart | PASS | Runtime restarted. |
| Smoke after restart | PASS | Local smoke passed after restart. |
| Stop | PASS | Runtime stopped. |
| Reset after stop | PASS | Reset completed after stop. |
| Final status | PASS | Reported stopped. |
| Final ports clear | PASS | Ports `3001` and `4173` were clear. |

## SMS Setup Prompt

| Check | Result | Notes |
| --- | --- | --- |
| SMS setup prompt visible | NOT TESTED | Required if macOS operator walkthrough includes SMS setup UX. |
| Twilio setup link opens | NOT TESTED | Required before any real-SMS readiness claim. |
| No real credentials entered | PASS | Tester reported no real credentials entered. |

## Tester Summary

General application inspection found no obvious click-through issues. The local source-built package lifecycle passed start, restart, smoke, stop, reset, and final port-clear checks. The tester also identified one dependency vulnerability/update and several packaging hygiene issues that should be triaged before a new macOS release candidate is treated as ready for clean-package retest.

## Follow-Up Findings

| ID | Finding | Status | Recommended handling |
| --- | --- | --- | --- |
| MACOS-2026-05-31-F1 | `app/package-lock.json` still contains `brace-expansion` `5.0.5` under `@typescript-eslint/typescript-estree`; tester supplied a diff updating it to `5.0.6`. | OPEN | Update the app lockfile or otherwise document why the vulnerable transitive version is acceptable. |
| MACOS-2026-05-31-F2 | `scripts/verify-deployment-security.mjs` can hard-fail with `spawn npm ENOENT` when `npm` is not on `PATH` in the spawned context. | OPEN | Resolve npm relative to `process.execPath` when possible, use platform-aware npm command resolution, or downgrade ENOENT to an explicit environment warning where appropriate. |
| MACOS-2026-05-31-F3 | macOS portable package build staging directories accumulate under `build/macos-portable-bundled-runtime-internal/staging/run-*` and include large dependency trees. | OPEN | Add a cleanup/prune command or keep-latest policy for staging and server production dependency run directories. |
| MACOS-2026-05-31-F4 | Reset snapshots accumulate under `~/Library/Application Support/DelphiCommons/macos-operator-portable-candidate/backups/`. | OPEN | Consider pruning reset snapshots after reset, for example keep the latest 5 snapshots, while preserving explicit backup behavior. |
| MACOS-2026-05-31-F5 | `scripts/packaging/macos-portable.mjs` has dense one-line functions (`buildPackage`, `stageRuntime`, `assertNoAmbient`) that make failures hard to diagnose. | OPEN | Reformat for maintainability before adding more macOS packaging complexity. |

## Readiness Interpretation

This run is a positive macOS engineering smoke result for the source-built portable package at commit `2a831eee203d70bf295f821712603502667109dd`.

It does not close macOS release-readiness because:

- the test did not run from a newly published macOS release asset;
- SMS setup UX was not tested;
- signing, notarization, and Gatekeeper behavior remain unevidenced;
- clean-profile and second-machine Mac execution remain unevidenced unless separately attached;
- the tester identified dependency/security-verifier and package hygiene follow-up findings.

## Next Required macOS Steps

1. Triage and fix or explicitly defer the five follow-up findings above.
2. Build a new macOS internal candidate release asset from the corrected merged commit if macOS is in scope for the next release package.
3. Verify the release manifest points at the corrected commit.
4. Run a clean macOS package walkthrough from the release asset, including install/extract, first launch, Main Menu first screen, New Study saved workspace creation, Current Studies reopen, second study non-overwrite behavior, signoff surface, stop/close lifecycle, reset, uninstall or cleanup, and no-real-data attestation.
