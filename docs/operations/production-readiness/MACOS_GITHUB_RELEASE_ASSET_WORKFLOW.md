# macOS GitHub Release Asset Workflow

Status: **WORKFLOW PREPARED / RELEASE RUN REQUIRED**.

Date basis: 2026-05-18.

This records the GitHub Actions workflow used to make macOS internal package assets available from GitHub.

## Workflow

| Item | Value |
| --- | --- |
| Workflow file | `.github/workflows/macos-internal-package-release.yml` |
| Trigger | Push a tag matching `internal-macos-package-candidate-*`, or run the workflow manually |
| Runner | GitHub-hosted `macos-15` arm64 runner |
| Package outputs | Apple Silicon portable bundled-runtime ZIP and unsigned internal installer PKG |
| Release behavior | Creates or updates a GitHub prerelease and uploads package assets, checksums, and verification metadata |

## Boundary

These assets are internal package candidates only. They do not create production readiness, pilot readiness, real human-subjects readiness, broad macOS support readiness, App Store distribution, signing, notarization, Gatekeeper approval, security certification, accessibility certification, real-SMS readiness, or public release readiness.

Intel Mac/x64 packaging remains deferred until separately implemented and evidenced.

## Required Follow-Up After Workflow Run

Record the actual GitHub release tag, asset names, checksums, workflow run status, and any install/start/stop evidence in a separate evidence note after the workflow succeeds.
