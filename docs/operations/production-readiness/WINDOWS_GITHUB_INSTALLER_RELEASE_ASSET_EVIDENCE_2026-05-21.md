# Windows GitHub Installer Release Asset Evidence - 2026-05-21

Status: **WINDOWS INTERNAL INSTALLER CANDIDATE `r8` RELEASE VERIFIED / CLEAN WINDOWS RETEST PARTIAL PASS / HUMAN USE BLOCKED**.

Date/time basis: 2026-05-29 (UTC).

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

## Clean Windows Retest Evidence - 2026-05-29

Operator report date: 2026-05-29.

Device:

- Device name: `PR2001-LEC`
- Full device name: `PR2001-LEC.ad.clarkson.edu`
- Processor: Intel(R) Core(TM) i5-10600 CPU @ 3.30GHz
- Installed RAM: 16.0 GB (15.7 GB usable)
- System type: 64-bit operating system, x64-based processor
- Pen and touch: pen support
- Windows edition: Windows 11 Enterprise
- Version: 24H2
- Installed on: 2025-08-18
- OS build: 26100.3775
- Experience: Windows Feature Experience Pack 1000.26100.66.0

Reported release under test:

- Release page: `https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-05-21-r8`
- ZIP: `delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-21-r8-85fea05.zip`

Interpretation:

- The clean Windows package install, launch, save, close-window lifecycle, relaunch, and uninstall path is reported as mostly passing.
- The package-mode auth/session blocker is **not closed** because save/list/reopen continuity was not proven for the same synthetic study. The operator reported that reopening an existing saved study and creating/saving another study are not ergonomically or functionally working as required.
- The operator also reported a governance signoff concern: Study Owner/PI and Ethics & Methods/PI signoff appeared broken or unreachable during the walkthrough. This is a separate human-use readiness blocker until reproduced, fixed, and retested.
- The operator rated the result as a Phase 2 package-path pass, but not a pass for human use. This evidence record adopts that interpretation: **package lifecycle partial pass; human-testing candidate remains not ready**.

Screenshot note: the operator reported screenshots for most moments, but the SmartScreen prompt/install start was not captured. Formal evidence closure still requires the actual screenshot/log artifacts to be linked in the Phase 4 evidence index.

## Required Follow-up

A clean Windows retest has been attempted and produced partial pass evidence with open workflow blockers. The release gate is satisfied: the real GitHub `r8` tag/release exists, its assets use the corrected short SHA, and its package manifest points at the corrected post-fix commit. Follow-up must include:

- reproduce and fix saved-study reopen/new-study continuity,
- reproduce and fix Study Owner plus Ethics & Methods signoff controls,
- rerun the affected clean-Windows steps after the fixes,
- attach screenshot/log artifacts before any readiness advancement.


## Clean Windows Retest Checklist (Required for `r8` Closure)

Use this checklist on a clean Windows profile or second Windows machine. Attach screenshots/logs to the Phase 4 binder evidence index.

| # | Requirement to prove | Evidence required | Status | Evidence link/path | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Windows version/build captured | `winver` screenshot and `systeminfo` excerpt with OS name/version/build | PASS_REPORTED | Operator report 2026-05-29; screenshot artifact pending | Windows 11 Enterprise 24H2, OS build 26100.3775 on `PR2001-LEC` |
| 2 | Correct fixed release ZIP downloaded | Screenshot/log showing exact `r8` ZIP filename downloaded from release page | PASS_REPORTED | Operator report 2026-05-29; screenshot artifact pending | Matched `delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-21-r8-85fea05.zip` |
| 3 | ZIP extracted | Screenshot of extracted folder contents including installer EXE and README | PASS_REPORTED | Operator report 2026-05-29; screenshot artifact pending |  |
| 4 | SmartScreen behavior captured if shown | Screenshot of SmartScreen prompt (or explicit note that no prompt appeared) | PASS_REPORTED_WITH_EVIDENCE_GAP | Operator report 2026-05-29 | SmartScreen/install prompt occurred, but screenshots were not captured |
| 5 | Installer starts and completes | Installer start + completion screenshots | PASS_REPORTED | Operator report 2026-05-29; screenshot artifact pending |  |
| 6 | Delphi Commons opens after install | First successful launch screenshot | PASS_REPORTED | Operator report 2026-05-29; screenshot artifact pending | Must launch installed app, not dev server |
| 7 | Desktop shortcut exists | Screenshot showing desktop shortcut present | PASS_INFERRED | Operator report 2026-05-29; screenshot artifact pending | Desktop relaunch passed in step 12 |
| 8 | Study Builder can create and save a synthetic study | Screenshots showing create + save flow completion | PASS_REPORTED | Operator report 2026-05-29; screenshot artifact pending | Synthetic-only study created and saved with no reported auth/session error |
| 9 | Dashboard lists the saved study | Dashboard screenshot with saved study visible | PASS_REPORTED | Operator report 2026-05-29; screenshot artifact pending | Must be same saved study from step 8 |
| 10 | Saved study can be reopened | Screenshot/video proving reopen of saved study from dashboard | FAIL_OR_INCONCLUSIVE | Operator report 2026-05-29 | Operator reported this neither passed nor cleanly failed because the product does not provide the needed close/open/reopen workflow clearly enough; required for auth/session blocker closure |
| 11 | Closing Delphi Commons stops the runtime | Runtime/process evidence before/after close (Task Manager or scripted check) | PASS_REPORTED | Operator report 2026-05-29; screenshot artifact pending | Runtime stop behavior reported as passing |
| 12 | Desktop relaunch works | Screenshot of successful relaunch | PASS_REPORTED | Operator report 2026-05-29; screenshot artifact pending |  |
| 13 | Start Menu relaunch works | Screenshot of successful relaunch | PASS_REPORTED | Operator report 2026-05-29; screenshot artifact pending |  |
| 14 | Smoke check after relaunch | Confirm saved study still listed/reopenable and a new study can be created/saved separately | FAIL_REPORTED | Operator report 2026-05-29 | Saved study appears persisted, but creating/saving another study or opening a separate saved study appears blocked or unclear |
| 15 | Uninstall completes cleanly | Uninstall completion screenshot + post-uninstall check | PASS_REPORTED | Operator report 2026-05-29; screenshot artifact pending |  |
| 16 | No real data/credentials/secrets used | Explicit operator attestation in evidence packet | PASS_REPORTED | Operator report 2026-05-29 | No real participant data, credentials, secrets, or sensitive exports used |

### Blocker closure condition

The Windows auth/session blocker may be marked closed only when checklist steps **8, 9, and 10** include attached evidence proving save/list/reopen continuity for the same synthetic study in the installed package session.
