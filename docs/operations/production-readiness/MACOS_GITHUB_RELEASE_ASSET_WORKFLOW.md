# macOS GitHub Release Asset Workflow

Status: **WORKFLOW SUCCEEDED / SINGLE INSTALLER BUNDLE AVAILABLE / NOT READY FOR HUMAN TESTING**.

Date basis: 2026-06-28.

This records the GitHub Actions workflow used to make macOS internal package assets available from GitHub.

## Workflow

| Item | Value |
| --- | --- |
| Workflow file | `.github/workflows/macos-internal-package-release.yml` |
| Trigger | Push a tag matching `internal-macos-package-candidate-*`, or run the workflow manually |
| Runner | GitHub-hosted `macos-15` arm64 runner |
| Package outputs | Apple Silicon unsigned internal installer ZIP bundle |
| Release behavior | Creates or updates a GitHub prerelease and uploads the installer ZIP bundle, release notes, and SHA256 checksums |
| Artifact behavior | The auxiliary Actions workflow artifact upload is non-blocking; the GitHub Release publish step remains the download source of record |

## Boundary

These assets are internal package candidates only. They do not create production readiness, pilot readiness, real human-subjects readiness, broad macOS support readiness, App Store distribution, signing, notarization, Gatekeeper approval, security certification, accessibility certification, real-SMS readiness, or public release readiness.

Intel Mac/x64 packaging remains deferred until separately implemented and evidenced.

## Current Release

| Item | Value |
| --- | --- |
| Release tag | [`internal-macos-package-candidate-2026-06-28-r2`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-macos-package-candidate-2026-06-28-r2) |
| Workflow run | [`28340083533`](https://github.com/scasper-source/Delphi-Commons/actions/runs/28340083533) |
| Result | `completed` / `success` |
| Recommended asset | Apple Silicon installer ZIP bundle |
| Superseded assets | `internal-macos-package-candidate-2026-05-18-r4` is archived/superseded by the June 28 `r2` download; June 28 `r1` built but did not create a release because artifact storage quota blocked the workflow before publish |
| Release asset evidence | [MACOS_GITHUB_RELEASE_ASSET_EVIDENCE_2026-06-28.md](./MACOS_GITHUB_RELEASE_ASSET_EVIDENCE_2026-06-28.md) |

## Required Follow-Up After Workflow Run

The original 2026-05-18 workflow result and split release assets are recorded in [MACOS_GITHUB_RELEASE_ASSET_EVIDENCE_2026-05-18.md](./MACOS_GITHUB_RELEASE_ASSET_EVIDENCE_2026-05-18.md). Those split assets are superseded for installer/operator testing.

The current single-bundle release is `internal-macos-package-candidate-2026-06-28-r2`. GitHub release asset availability and checksums are recorded in [MACOS_GITHUB_RELEASE_ASSET_EVIDENCE_2026-06-28.md](./MACOS_GITHUB_RELEASE_ASSET_EVIDENCE_2026-06-28.md). Human/operator install/open/reopen, clean-profile, second-machine, signing/notarization, and Gatekeeper evidence are still required before readiness claims are upgraded.
