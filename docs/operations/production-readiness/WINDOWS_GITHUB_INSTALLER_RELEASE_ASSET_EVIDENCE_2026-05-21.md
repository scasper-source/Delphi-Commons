# Windows GitHub Installer Release Asset Evidence - 2026-05-21

Status: **WINDOWS INTERNAL INSTALLER CANDIDATE `r8` SCAFFOLD CORRECTED / RELEASE NOT YET VERIFIED / CLEAN WINDOWS RETEST BLOCKED**.

Date/time basis: 2026-05-21 (UTC).

Track: `human_testing_candidate`.

Release tag: `internal-windows-installer-candidate-2026-05-21-r8` (must not be used for retest until it exists on GitHub and points at the corrected post-fix commit).

Post-fix commit basis audited before this scaffold correction:

```text
9970d78e8cdfd8e214b3777a263bf5cf2304096b
```

The previous pre-fix pointer `0af49757e9546b451f79eb59a87d8fa7f9bf2f7b` is invalid for `r8`. The final `r8` tag/release must point at a corrected commit that includes the PR #125 auth gate plus the Windows package launcher environment fix for:

- `EDELPHI_ENABLE_INTERNAL_SYNTHETIC_AUTH_BOOTSTRAP=1`
- `EDELPHI_INTERNAL_SYNTHETIC_AUTH_ACK=INTERNAL_SYNTHETIC_ONLY`

## Scope

This evidence record defines the next Windows internal installer candidate that supersedes `r7`, using the existing **Build Windows internal installer release** workflow and operator flow. It is a scaffold only until the real `r8` tag/release exists and its package manifest confirms the corrected post-fix commit.

Operator flow to preserve:

1. Download installer ZIP.
2. Unzip.
3. Run contained installer EXE.
4. Launch Delphi Commons from Desktop or Start Menu.
5. Closing the Delphi Commons app window must stop the local runtime.

Release notes for this candidate must explicitly identify the fix as: **package-mode operator session / Study Builder save** and state that the built-in operator bootstrap is internal synthetic testing only, not production authentication.

## Candidate Definition

| Item | Value |
| --- | --- |
| Candidate tag | `internal-windows-installer-candidate-2026-05-21-r8` |
| Supersedes | `internal-windows-installer-candidate-2026-05-18-r7` |
| Source branch | `origin/main` |
| Source commit | Corrected post-fix commit required; must include PR #125 (`9970d78e8cdfd8e214b3777a263bf5cf2304096b`) plus the Windows launcher env fix. Do not use `0af49757e9546b451f79eb59a87d8fa7f9bf2f7b`. |
| Workflow | `Build Windows internal installer release` |
| Trigger mode | push tag |

## Expected Release Assets (Required)

The release must include all of the following artifacts:

| Asset type | Expected name |
| --- | --- |
| Installer ZIP | `delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-21-r8-<corrected-short-sha>.zip` |
| Raw installer EXE | `delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-21-r8-<corrected-short-sha>.exe` |
| Checksums | `SHA256SUMS.txt` |
| Package manifest | `windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-21-r8-<corrected-short-sha>.json` |
| Verification metadata | `windows-installer-package-verification-internal-windows-installer-candidate-2026-05-21-r8-<corrected-short-sha>.json` |
| Release notes | `RELEASE_NOTES.md` |

## Release Notes Verification Requirements

`RELEASE_NOTES.md` must explicitly include language equivalent to:

- package-mode operator session fix.
- Study Builder save behavior fix.
- internal synthetic bootstrap only; not production auth and not approval for real data, pilot, or human-subject use.

## Asset Evidence (to be filled from release page after publish)

Release URL base:

```text
https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-05-21-r8
```

Download URL base:

```text
https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-21-r8/
```

| Asset | URL | SHA256 | Verification |
| --- | --- | --- | --- |
| Installer ZIP | `<populate after publish>` | `<populate from SHA256SUMS.txt>` | Required |
| Raw installer EXE | `<populate after publish>` | `<populate from SHA256SUMS.txt>` | Required |
| Package manifest JSON | `<populate after publish>` | `<populate from SHA256SUMS.txt>` | Required |
| Verification metadata JSON | `<populate after publish>` | `<populate from SHA256SUMS.txt>` | Required (`ok: true`, no failures) |
| SHA256SUMS.txt | `<populate after publish>` | Self-checksum optional | Required |
| RELEASE_NOTES.md | `<populate after publish>` | Optional (not always in SHA256SUMS) | Required |

## Verification Result

Current repository-state verification for `r8` preparation:

- Candidate tag convention incremented from `r7` to `r8`.
- Scaffold no longer points at the invalid pre-fix `0af49757e9546b451f79eb59a87d8fa7f9bf2f7b` commit.
- The real `r8` tag/release must point at a corrected post-fix commit that includes the explicit Windows package launcher bootstrap environment.
- Artifact set definition includes ZIP, EXE, checksums, manifest, and verification metadata.
- Release note requirement captures package-mode operator session / Study Builder save fix.

Publish/run verification status: **BLOCKED UNTIL REAL `r8` TAG/RELEASE EXISTS AT THE CORRECTED COMMIT**.

## Known Limitations / Non-Claims

This candidate remains internal synthetic/low-risk packaging evidence only. It is **not** a claim of production readiness, pilot readiness, real human-subject readiness, signed installer trust, SmartScreen/Defender approval, or broad Windows support readiness.

## Required Follow-up

A clean Windows retest is still required, but must not start until the real GitHub `r8` tag/release exists, its assets use the corrected short SHA, and its package manifest points at the corrected post-fix commit. After that, retest must include:

- fresh install on clean profile/system,
- launch from Desktop/Start Menu,
- attached-browser close => runtime stop confirmation,
- restart, uninstall, and smoke checks,
- capture of human-observed evidence before any readiness advancement.


## Clean Windows Retest Checklist (Required for `r8` Closure)

Use this checklist on a clean Windows profile or second Windows machine. Attach screenshots/logs to the Phase 4 binder evidence index.

| # | Requirement to prove | Evidence required | Status | Evidence link/path | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Windows version/build captured | `winver` screenshot and `systeminfo` excerpt with OS name/version/build | NOT RUN | HUMAN_REQUIRED | Record exact edition and build number |
| 2 | Correct fixed release ZIP downloaded | Screenshot/log showing exact `r8` ZIP filename downloaded from release page | BLOCKED | HUMAN_REQUIRED | Must match real `r8` asset name and corrected commit; do not use any `0af4975` asset |
| 3 | ZIP extracted | Screenshot of extracted folder contents including installer EXE and README | NOT RUN | HUMAN_REQUIRED | Use default extractor or equivalent |
| 4 | SmartScreen behavior captured if shown | Screenshot of SmartScreen prompt (or explicit note that no prompt appeared) | NOT RUN | HUMAN_REQUIRED | Unsigned-candidate behavior must be documented |
| 5 | Installer starts and completes | Installer start + completion screenshots | NOT RUN | HUMAN_REQUIRED | Include successful completion state |
| 6 | Delphi Commons opens after install | First successful launch screenshot | NOT RUN | HUMAN_REQUIRED | Must launch installed app, not dev server |
| 7 | Desktop shortcut exists | Screenshot showing desktop shortcut present | NOT RUN | HUMAN_REQUIRED | Capture icon/title clearly |
| 8 | Study Builder can create and save a synthetic study | Screenshots showing create + save flow completion | NOT RUN | HUMAN_REQUIRED | Synthetic-only study name |
| 9 | Dashboard lists the saved study | Dashboard screenshot with saved study visible | NOT RUN | HUMAN_REQUIRED | Must be same saved study from step 8 |
| 10 | Saved study can be reopened | Screenshot/video proving reopen of saved study from dashboard | NOT RUN | HUMAN_REQUIRED | **Required for auth/session blocker closure** |
| 11 | Closing Delphi Commons stops the runtime | Runtime/process evidence before/after close (Task Manager or scripted check) | NOT RUN | HUMAN_REQUIRED | Must show no lingering runtime after close |
| 12 | Desktop relaunch works | Screenshot of successful relaunch via desktop shortcut | NOT RUN | HUMAN_REQUIRED | After step 11 stop confirmation |
| 13 | Start Menu relaunch works | Screenshot of successful relaunch via Start Menu entry | NOT RUN | HUMAN_REQUIRED | Confirm equivalent behavior |
| 14 | Uninstall completes cleanly | Uninstall completion screenshot + post-uninstall check | NOT RUN | HUMAN_REQUIRED | Include removal confirmation |
| 15 | No real data/credentials/secrets used | Explicit operator attestation in evidence packet | NOT RUN | HUMAN_REQUIRED | No real participants, no real credentials, no sensitive exports |

### Blocker closure condition

The Windows auth/session blocker may be marked closed only when checklist steps **8, 9, and 10** include attached evidence proving save/list/reopen continuity for the same synthetic study in the installed package session.
