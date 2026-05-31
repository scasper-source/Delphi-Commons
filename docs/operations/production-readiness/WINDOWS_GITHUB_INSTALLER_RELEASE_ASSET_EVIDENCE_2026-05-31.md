# Windows GitHub Installer Release Asset Evidence - 2026-05-31

Status: **WINDOWS INTERNAL INSTALLER CANDIDATE `r9` RELEASE VERIFIED / CLEAN WINDOWS RETEST PENDING / HUMAN USE BLOCKED**.

Date/time basis: 2026-05-31 UTC.

Track: `human_testing_candidate`.

Release tag: [`internal-windows-installer-candidate-2026-05-31-r9`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-05-31-r9).

Release commit:

```text
e9c6f03fd2320456194bf1ec444dd650b06c9c71
```

This release supersedes `internal-windows-installer-candidate-2026-05-21-r8` for the clean Windows retest of the Study Workspace Launcher, saved-study reopen/new-study continuity, and Study PI / Ethics PI signoff flow. It does not close human-use readiness without clean Windows retest evidence.

## Candidate Definition

| Item | Value |
| --- | --- |
| Candidate tag | `internal-windows-installer-candidate-2026-05-31-r9` |
| Supersedes | `internal-windows-installer-candidate-2026-05-21-r8` |
| Source branch | `origin/main` |
| Source commit | `e9c6f03fd2320456194bf1ec444dd650b06c9c71` (`Merge pull request #130 from scasper-source/codex/study-workspace-launcher`) |
| Workflow | [`Build Windows internal installer release`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26718778645) |
| Job | [`Build Windows internal installer assets`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26718778645/job/78741969367) |
| Trigger mode | push tag |
| Result | `completed` / `success` |

## Asset Evidence

Release URL base:

```text
https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-05-31-r9
```

Download URL base:

```text
https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-31-r9/
```

| Asset | URL | SHA256 | Verification |
| --- | --- | --- | --- |
| Installer ZIP | `https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-31-r9/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-31-r9-e9c6f03.zip` | `1cf12cdaa97f14dd389e74ef8e12f1eb55631ea54f4a74856e5a0c4d1f6abbb3` | Present |
| Raw installer EXE | `https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-31-r9/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-31-r9-e9c6f03.exe` | `cf58a8ab4e34e23bd281d6149802b200c6c66f072e1e4c9c4095168464d02fc1` | Present |
| Package manifest JSON | `https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-31-r9/windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-31-r9-e9c6f03.json` | `1a7956118eabc71a7968297c0db3e7145c5451f9bfe47ab07e57a53c48bfc1a2` | Manifest `commitHash` is `e9c6f03fd2320456194bf1ec444dd650b06c9c71` |
| Verification metadata JSON | `https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-31-r9/windows-installer-package-verification-internal-windows-installer-candidate-2026-05-31-r9-e9c6f03.json` | `b7ea028994d1ca087b9208093f13b2d509d4a8605587c68c2982e57d926923f6` | `ok: true`, no failures |
| SHA256SUMS.txt | `https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-31-r9/SHA256SUMS.txt` | `825af17f4de96df1d31cc645df87d1ec555e7976220963e118b3eae6a25ade1c` | Present |
| RELEASE_NOTES.md | `https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-31-r9/RELEASE_NOTES.md` | `22e1e82df90f14d3ce7d4cb5c08df3253aefe71f969f3ceb83949869a3ddd5fd` | Present; release body keeps internal synthetic/low-risk boundary |

## Verification Result

- PR #130 was merged into `origin/main` as `e9c6f03fd2320456194bf1ec444dd650b06c9c71`.
- The release tag points at `e9c6f03fd2320456194bf1ec444dd650b06c9c71`.
- The release manifest `commitHash` is `e9c6f03fd2320456194bf1ec444dd650b06c9c71`.
- The verification metadata reports `ok: true` with no failures.
- The workflow run and job completed successfully.
- The release includes ZIP, EXE, checksums, manifest, verification metadata, and release notes.

Publish/run verification status: **PASSED FOR RELEASE ASSET CREATION AND PACKAGE VERIFICATION**.

## Known Limitations / Non-Claims

This candidate remains internal synthetic/low-risk packaging evidence only. It is **not** a claim of production readiness, pilot readiness, real human-subject readiness, signed installer trust, SmartScreen/Defender approval, accessibility certification, security certification, real-SMS readiness, or broad Windows support readiness.

Human-use readiness remains blocked until clean Windows retest evidence is attached and reviewed.

## Clean Windows Retest Checklist (Required for `r9` Closure)

Use this checklist on a clean Windows profile or second Windows machine. Attach screenshots/logs to the Phase 4 binder evidence index. Use synthetic/internal data only.

| # | Requirement to prove | Evidence required | Status | Evidence link/path | Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Windows version/build captured | `winver` screenshot and machine/profile note | NOT RUN |  | Capture clean profile or second-machine status |
| 2 | Correct `r9` ZIP downloaded | Browser/download screenshot showing exact ZIP filename | NOT RUN |  | Use `delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-31-r9-e9c6f03.zip` |
| 3 | ZIP extracted | Extracted folder screenshot showing EXE, README, manifest, verification, checksums | NOT RUN |  |  |
| 4 | Installer starts and completes | SmartScreen if shown, installer start, and completion screenshots | NOT RUN |  | If SmartScreen does not show, record that explicitly |
| 5 | First launch opens installed package | Delphi Commons opens from installer, Desktop, or Start Menu with no dev terminal | NOT RUN |  | Installed package only |
| 6 | Launcher is first staff-facing screen | Screenshot showing Study Workspace Launcher with New Study, Current Studies, Past Studies / Writing Up | NOT RUN |  | Technical dashboard must not be first surface |
| 7 | New Study creates saved workspace | Screenshot sequence showing title/purpose entry, role warning, and `Create saved study workspace` success | NOT RUN |  | Must show saved backend workspace state |
| 8 | Current Studies lists saved study | Screenshot showing the newly saved study in Current Studies | NOT RUN |  | Must be same synthetic study from step 7 |
| 9 | Saved study reopens | Screenshot/video proving the same saved study opens from Current Studies into dashboard/Study Builder context | NOT RUN |  | Critical closure requirement |
| 10 | Second new study does not overwrite first | Create a second saved study, then show both studies listed and individually openable | NOT RUN |  | Proves multi-study persistence |
| 11 | Close app window stops runtime | Before/after evidence from Task Manager or runtime logs | NOT RUN |  |  |
| 12 | Relaunch persistence | Relaunch from Desktop and Start Menu, then show saved studies still listed/reopenable | NOT RUN |  |  |
| 13 | Past Studies / Writing Up path is understandable | If a closed synthetic study exists, screenshot Past Studies / Writing Up routing to reporting/closeout/dashboard context | NOT RUN |  | If no closed study exists, note not applicable |
| 14 | Study PI signoff is reachable and role-bound | Screenshot/log showing Study PI signoff after ReadyForSignoff; wrong-role attempt blocked if tested | NOT RUN |  | Must follow governance sequence |
| 15 | Ethics PI signoff is reachable and role-bound | Screenshot/log showing Ethics PI / Ethics & Methods Steward signoff after Study PI path is clear | NOT RUN |  | Must use assigned MethodsSteward role |
| 16 | Activation blocked until both signoffs exist | Screenshot/log showing activation blocked before both signoffs, then available only after both are recorded | NOT RUN |  | Critical governance closure requirement |
| 17 | Uninstall completes cleanly | Uninstall completion screenshot and app removed | NOT RUN |  |  |
| 18 | Data boundary attestation | Written note: no real participant data, credentials, secrets, or sensitive exports used | NOT RUN |  | Required for evidence packet |

### Blocker Closure Condition

The Windows package-mode workspace/auth blocker may be marked closed only when steps **6 through 12** include attached evidence proving launcher-first workflow, save/list/reopen continuity, second-study independence, and relaunch persistence in the installed package.

The governance signoff blocker may be marked closed only when steps **14 through 16** include attached evidence proving Study PI and Ethics PI signoffs are reachable, sequenced, role-bound, and activation-gated.
