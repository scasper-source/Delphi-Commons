# Windows GitHub Installer Release Workflow

Status: **WINDOWS INTERNAL INSTALLER RELEASE ASSETS AVAILABLE / NOT READY FOR HUMAN TESTING**.

Date basis: 2026-05-18.

This records the GitHub Actions workflow used to make a Windows internal installer executable available from GitHub.

Release asset evidence: [WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-18.md](./WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-18.md).

## Workflow

| Item | Value |
| --- | --- |
| Workflow file | `.github/workflows/windows-internal-installer-release.yml` |
| Trigger | Push a tag matching `internal-windows-installer-candidate-*`, or run the workflow manually |
| Runner | GitHub-hosted `windows-latest` runner |
| Installer tool | Inno Setup installed during the workflow |
| Package output | Windows x64 unsigned internal installer ZIP bundle plus raw EXE |
| Release behavior | Creates or updates a GitHub prerelease and uploads the installer ZIP bundle, raw installer, checksums, package manifest, and verification metadata |

## Boundary

These assets are internal package candidates only. They do not create production readiness, pilot readiness, real human-subjects readiness, code-signing trust, SmartScreen approval, Defender approval, enterprise deployment readiness, security certification, accessibility certification, real-SMS readiness, or public release readiness.

## Current Release

| Item | Value |
| --- | --- |
| Release tag | [`internal-windows-installer-candidate-2026-05-18-r2`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-05-18-r2) |
| Workflow run | [`26057445547`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26057445547) |
| Result | `completed` / `success` |
| Recommended asset | Windows x64 installer ZIP bundle |
| Remaining evidence | Clean-profile or second-machine install/start/stop/uninstall remains `NOT RUN` |
