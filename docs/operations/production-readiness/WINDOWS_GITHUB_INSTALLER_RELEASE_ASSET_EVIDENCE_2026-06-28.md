# Windows GitHub Installer Release Asset Evidence - 2026-06-28

Status: **ASSETS AVAILABLE / PRIOR RELEASE ARCHIVED / NOT READY FOR HUMAN TESTING**.

Date basis: 2026-06-28.

Release tag: [`internal-windows-installer-candidate-2026-06-28-r2`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-06-28-r2).

Release commit:

```text
18faba229b0e9047e45a88c4a087bef937926681
```

This release publishes a Windows x64 unsigned internal installer ZIP bundle, raw installer EXE, checksums, package manifest, and verification metadata for internal synthetic/low-risk testing only.

## Workflow Evidence

| Item | Value |
| --- | --- |
| Workflow run | [`28340083451`](https://github.com/scasper-source/Delphi-Commons/actions/runs/28340083451) |
| Result | `completed` / `success` |
| Job | `Build Windows internal installer assets` |
| Job result | `success` |
| Release publish step | `success` |
| Same-commit CI run | [`28340083441`](https://github.com/scasper-source/Delphi-Commons/actions/runs/28340083441), `completed` / `success` |

The first 2026-06-28 tag, `internal-windows-installer-candidate-2026-06-28-r1`, did not create a release because GitHub Actions artifact storage quota blocked `actions/upload-artifact`, and the publish step was skipped. Commit `18faba2` made the auxiliary workflow-artifact upload non-blocking so the GitHub Release publish step can still run.

## Release Assets

Release URL base:

```text
https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-06-28-r2
```

Asset download URL base:

```text
https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-06-28-r2/
```

| Asset | Size | SHA256 | Status |
| --- | ---: | --- | --- |
| [`delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-06-28-r2-18faba2.zip`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-06-28-r2/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-06-28-r2-18faba2.zip) | 25,365,318 bytes | `5d803515897587fab53fdd6b7540f779bafa645b97b9fb56a0c1fcc8cd4b1a55` | Present |
| [`delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-06-28-r2-18faba2.exe`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-06-28-r2/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-06-28-r2-18faba2.exe) | 25,794,215 bytes | `47d0cca893ef7696ab3a6e2001eb7cb6b9671e2f1a7fb52eafb126bcef3839d5` | Present |
| [`windows-installer-package-manifest-internal-windows-installer-candidate-2026-06-28-r2-18faba2.json`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-06-28-r2/windows-installer-package-manifest-internal-windows-installer-candidate-2026-06-28-r2-18faba2.json) | 428,177 bytes | `8c53399a26c61ae4fd694fa54af11cc3bb8e764dcf0edee635e88c39ab98aebf` | Present |
| [`windows-installer-package-verification-internal-windows-installer-candidate-2026-06-28-r2-18faba2.json`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-06-28-r2/windows-installer-package-verification-internal-windows-installer-candidate-2026-06-28-r2-18faba2.json) | 34 bytes | `b7ea028994d1ca087b9208093f13b2d509d4a8605587c68c2982e57d926923f6` | Present |
| [`SHA256SUMS.txt`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-06-28-r2/SHA256SUMS.txt) | 688 bytes | Self-checksum not recorded | Present |
| [`RELEASE_NOTES.md`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-06-28-r2/RELEASE_NOTES.md) | 793 bytes | Not included in generated `SHA256SUMS.txt` | Present |

## Archive Status

| Prior release | Archive action | Successor |
| --- | --- | --- |
| [`internal-windows-installer-candidate-2026-05-31-r10`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-05-31-r10) | GitHub Release title/body marked `[ARCHIVED / SUPERSEDED]`; assets retained for traceability | `internal-windows-installer-candidate-2026-06-28-r2` |

## Interpretation

This evidence confirms GitHub-hosted downloadable Windows internal package assets are available for `r2`. It does **not** prove clean-profile install/start/stop/relaunch/uninstall behavior, SmartScreen/Defender acceptance, code signing, accessibility conformance, security certification, pilot readiness, production readiness, or real human-subjects readiness.

Required follow-up remains: download the `r2` ZIP on the selected Windows test surface, install and launch it, exercise the Study Workspace Launcher and governance signoff paths, record screenshots/logs, and attach the human-observed result.
