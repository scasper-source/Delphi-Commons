# Windows GitHub Installer Release Asset Evidence - 2026-05-21

Status: **WINDOWS INTERNAL INSTALLER CANDIDATE `r8` RELEASE VERIFIED / CLEAN WINDOWS RETEST REQUIRED / NOT RUN**.

Date/time basis: 2026-05-22 (UTC).

Track: `human_testing_candidate`.

Release tag: `internal-windows-installer-candidate-2026-05-21-r8`.

Release commit:

```text
85fea0527c5df70b06d2990f99861c6e71c792e4
```

The previous pre-fix pointer `0af49757e9546b451f79eb59a87d8fa7f9bf2f7b` is invalid for `r8`. The corrected `r8` tag/release points at `85fea0527c5df70b06d2990f99861c6e71c792e4`, which includes the PR #125 auth gate plus the Windows package launcher environment fix for:

- `EDELPHI_ENABLE_INTERNAL_SYNTHETIC_AUTH_BOOTSTRAP=1`
- `EDELPHI_INTERNAL_SYNTHETIC_AUTH_ACK=INTERNAL_SYNTHETIC_ONLY`

## Scope

This evidence record defines the Windows internal installer candidate that supersedes `r7`, using the existing **Build Windows internal installer release** workflow and operator flow. The real `r8` tag/release exists and its package manifest confirms the corrected post-fix commit.

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
| Source commit | `85fea0527c5df70b06d2990f99861c6e71c792e4` (`Merge pull request #128 from scasper-source/codex/windows-package-auth-bootstrap-env`) |
| Workflow | `Build Windows internal installer release` |
| Trigger mode | push tag |

## Expected Release Assets (Required)

The release must include all of the following artifacts:

| Asset type | Expected name |
| --- | --- |
| Installer ZIP | `delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-21-r8-85fea05.zip` |
| Raw installer EXE | `delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-21-r8-85fea05.exe` |
| Checksums | `SHA256SUMS.txt` |
| Package manifest | `windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-21-r8-85fea05.json` |
| Verification metadata | `windows-installer-package-verification-internal-windows-installer-candidate-2026-05-21-r8-85fea05.json` |
| Release notes | `RELEASE_NOTES.md` |

## Release Notes Verification Requirements

`RELEASE_NOTES.md` must explicitly include language equivalent to:

- package-mode operator session fix.
- Study Builder save behavior fix.
- internal synthetic bootstrap only; not production auth and not approval for real data, pilot, or human-subject use.

## Asset Evidence

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
| Installer ZIP | `https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-21-r8/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-21-r8-85fea05.zip` | `b97043e241dd5ef710b3f93f94f6792e0f7984fcecea2e26b34cacd9a03f132c` | Present |
| Raw installer EXE | `https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-21-r8/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-21-r8-85fea05.exe` | `c02df45ef1fbb192e8350d35d40ad36e8824df17238944dd8c4f3d4a3360b1ed` | Present |
| Package manifest JSON | `https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-21-r8/windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-21-r8-85fea05.json` | `fa733e4e912aebf6f2ca9f2a7db608604e9dfb979349912c9950cc91a877fcc9` | Manifest `commitHash` is `85fea0527c5df70b06d2990f99861c6e71c792e4` |
| Verification metadata JSON | `https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-21-r8/windows-installer-package-verification-internal-windows-installer-candidate-2026-05-21-r8-85fea05.json` | `b7ea028994d1ca087b9208093f13b2d509d4a8605587c68c2982e57d926923f6` | `ok: true`, no failures |
| SHA256SUMS.txt | `https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-21-r8/SHA256SUMS.txt` | Self-checksum optional | Present |
| RELEASE_NOTES.md | `https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-21-r8/RELEASE_NOTES.md` | Optional (not in `SHA256SUMS.txt`) | Present; release body and asset identify package-mode operator session fix and internal synthetic auth-only boundary |

## Verification Result

Current repository-state verification for `r8` preparation:

- Candidate tag convention incremented from `r7` to `r8`.
- Scaffold no longer points at the invalid pre-fix `0af49757e9546b451f79eb59a87d8fa7f9bf2f7b` commit.
- The real `r8` tag/release points at `85fea0527c5df70b06d2990f99861c6e71c792e4`.
- Release manifest `commitHash` is `85fea0527c5df70b06d2990f99861c6e71c792e4`.
- Verification metadata reports `ok: true` with no failures.
- Artifact set definition includes ZIP, EXE, checksums, manifest, and verification metadata.
- Release note requirement captures package-mode operator session / Study Builder save fix.

Publish/run verification status: **PASSED FOR RELEASE ASSET CREATION AND PACKAGE VERIFICATION**.

## Known Limitations / Non-Claims

This candidate remains internal synthetic/low-risk packaging evidence only. It is **not** a claim of production readiness, pilot readiness, real human-subject readiness, signed installer trust, SmartScreen/Defender approval, or broad Windows support readiness.

## Required Follow-up

A clean Windows retest is still required and has not been run. The release gate is satisfied: the real GitHub `r8` tag/release exists, its assets use the corrected short SHA, and its package manifest points at the corrected post-fix commit. The retest must include:

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
| 2 | Correct fixed release ZIP downloaded | Screenshot/log showing exact `r8` ZIP filename downloaded from release page | NOT RUN | HUMAN_REQUIRED | Must match `delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-21-r8-85fea05.zip`; do not use any `0af4975` asset |
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
