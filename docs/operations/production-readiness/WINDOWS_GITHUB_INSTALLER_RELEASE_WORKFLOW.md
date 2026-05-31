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
| Release tag | [`internal-windows-installer-candidate-2026-05-31-r9`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-05-31-r9) |
| Workflow run | [`26718778645`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26718778645) |
| Result | `completed` / `success` |
| Recommended asset | Windows x64 installer ZIP bundle |
| Superseded assets | `r2` deleted after user-reported Windows code 193 post-install launch failure; `r3` deleted after user-reported browser-reopen/desktop-shortcut launch issue; `r4` deleted after user-facing Stop/Status shortcuts and background-runtime lifecycle were removed; `r5` deleted after stale ZIP README Stop wording was found; `r6` deleted after review found fallback-order and attached-browser-unavailable issues; `r7` superseded by the package-mode auth fix in `r8`; `r8` superseded by the Study Workspace Launcher, multi-study persistence, and Study PI/Ethics PI signoff follow-up in `r9` |
| Remaining evidence | Clean-profile or second-machine retest on `r9` remains `NOT RUN` |
