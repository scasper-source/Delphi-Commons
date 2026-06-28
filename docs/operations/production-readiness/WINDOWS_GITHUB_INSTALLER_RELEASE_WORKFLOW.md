# Windows GitHub Installer Release Workflow

Status: **WINDOWS INTERNAL INSTALLER RELEASE ASSETS AVAILABLE / NOT READY FOR HUMAN TESTING**.

Date basis: 2026-06-28.

This records the GitHub Actions workflow used to make a Windows internal installer executable available from GitHub.

Current release asset evidence: [WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-06-28.md](./WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-06-28.md).

## Workflow

| Item | Value |
| --- | --- |
| Workflow file | `.github/workflows/windows-internal-installer-release.yml` |
| Trigger | Push a tag matching `internal-windows-installer-candidate-*`, or run the workflow manually |
| Runner | GitHub-hosted `windows-latest` runner |
| Installer tool | Inno Setup installed during the workflow |
| Package output | Windows x64 unsigned internal installer ZIP bundle plus raw EXE |
| Release behavior | Creates or updates a GitHub prerelease and uploads the installer ZIP bundle, raw installer, checksums, package manifest, and verification metadata |
| Artifact behavior | The auxiliary Actions workflow artifact upload is non-blocking; the GitHub Release publish step remains the download source of record |

## Boundary

These assets are internal package candidates only. They do not create production readiness, pilot readiness, real human-subjects readiness, code-signing trust, SmartScreen approval, Defender approval, enterprise deployment readiness, security certification, accessibility certification, real-SMS readiness, or public release readiness.

## Current Release

| Item | Value |
| --- | --- |
| Release tag | [`internal-windows-installer-candidate-2026-06-28-r2`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-06-28-r2) |
| Workflow run | [`28340083451`](https://github.com/scasper-source/Delphi-Commons/actions/runs/28340083451) |
| Result | `completed` / `success` |
| Recommended asset | Windows x64 installer ZIP bundle |
| Superseded assets | Earlier May `r2` deleted after user-reported Windows code 193 post-install launch failure; `r3` deleted after user-reported browser-reopen/desktop-shortcut launch issue; `r4` deleted after user-facing Stop/Status shortcuts and background-runtime lifecycle were removed; `r5` deleted after stale ZIP README Stop wording was found; `r6` deleted after review found fallback-order and attached-browser-unavailable issues; `r7` superseded by the package-mode auth fix in `r8`; `r8` superseded by the Study Workspace Launcher, multi-study persistence, and Study PI/Ethics PI signoff follow-up in `r9`; `r9` superseded by the Main Menu first-screen and fresh New Study reset fix in `r10`; `r10` is archived/superseded by the June 28 `r2` download; June 28 `r1` did not create a release because artifact storage quota blocked the workflow before publish |
| Remaining evidence | Clean-profile or second-machine retest on June 28 `r2` remains `NOT RUN` |
