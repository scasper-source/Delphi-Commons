# Windows GitHub Installer Release Asset Evidence - 2026-05-21

Status: **WINDOWS INTERNAL INSTALLER CANDIDATE `r8` PREPARED / CLEAN WINDOWS RETEST REQUIRED**.

Date/time basis: 2026-05-21 (UTC).

Track: `human_testing_candidate`.

Release tag: `internal-windows-installer-candidate-2026-05-21-r8`.

Commit hash:

```text
0af49757e9546b451f79eb59a87d8fa7f9bf2f7b
```

## Scope

This evidence record defines the next Windows internal installer candidate that supersedes `r7` for clean-system retesting, using the existing **Build Windows internal installer release** workflow and operator flow.

Operator flow to preserve:

1. Download installer ZIP.
2. Unzip.
3. Run contained installer EXE.
4. Launch Delphi Commons from Desktop or Start Menu.
5. Closing the Delphi Commons app window must stop the local runtime.

Release notes for this candidate must explicitly identify the fix as: **package-mode operator session / Study Builder save**.

## Candidate Definition

| Item | Value |
| --- | --- |
| Candidate tag | `internal-windows-installer-candidate-2026-05-21-r8` |
| Supersedes | `internal-windows-installer-candidate-2026-05-18-r7` |
| Source branch | `origin/main` |
| Source commit | `0af49757e9546b451f79eb59a87d8fa7f9bf2f7b` |
| Workflow | `Build Windows internal installer release` |
| Trigger mode | push tag |

## Expected Release Assets (Required)

The release must include all of the following artifacts:

| Asset type | Expected name |
| --- | --- |
| Installer ZIP | `delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-21-r8-0af4975.zip` |
| Raw installer EXE | `delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-21-r8-0af4975.exe` |
| Checksums | `SHA256SUMS.txt` |
| Package manifest | `windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-21-r8-0af4975.json` |
| Verification metadata | `windows-installer-package-verification-internal-windows-installer-candidate-2026-05-21-r8-0af4975.json` |
| Release notes | `RELEASE_NOTES.md` |

## Release Notes Verification Requirements

`RELEASE_NOTES.md` must explicitly include language equivalent to:

- package-mode operator session fix.
- Study Builder save behavior fix.

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
- Candidate points at post-fix commit on current mainline history.
- Artifact set definition includes ZIP, EXE, checksums, manifest, and verification metadata.
- Release note requirement captures package-mode operator session / Study Builder save fix.

Publish/run verification status: **PENDING WORKFLOW EXECUTION**.

## Known Limitations / Non-Claims

This candidate remains internal synthetic/low-risk packaging evidence only. It is **not** a claim of production readiness, pilot readiness, real human-subject readiness, signed installer trust, SmartScreen/Defender approval, or broad Windows support readiness.

## Required Follow-up

A clean Windows retest is still required after publishing `r8`, including:

- fresh install on clean profile/system,
- launch from Desktop/Start Menu,
- attached-browser close => runtime stop confirmation,
- restart, uninstall, and smoke checks,
- capture of human-observed evidence before any readiness advancement.
