# Windows GitHub Installer Release Workflow

Status: **WORKFLOW PREPARED / RELEASE RUN REQUIRED**.

Date basis: 2026-05-18.

This records the GitHub Actions workflow used to make a Windows internal installer executable available from GitHub.

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

## Required Follow-Up After Workflow Run

Record the actual GitHub release tag, asset names, checksums, workflow run status, and any install/start/stop/uninstall evidence in a separate evidence note after the workflow succeeds.
