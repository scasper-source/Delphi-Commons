# Windows GitHub Installer Release Asset Evidence - 2026-05-18

Status: **WINDOWS INTERNAL INSTALLER RELEASE ASSETS AVAILABLE / NOT READY FOR HUMAN TESTING**.

Date/time basis: 2026-05-18 GitHub Actions release workflow run.

Track: `human_testing_candidate`.

Release tag: [`internal-windows-installer-candidate-2026-05-18-r4`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-05-18-r4).

Workflow run: [`26059709643`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26059709643).

Commit hash:

```text
3e42de42b2d1681665eaaf4e06f055d83ddb70b8
```

## Scope

This document records that GitHub now has Windows x64 internal installer candidate assets available for download.

The recommended operator asset is the installer ZIP bundle. The simple internal flow is: download the ZIP, unzip it, run the included installer EXE, then launch Delphi Commons from the Start Menu.

These assets are internal synthetic/low-risk package candidates only. They do not close Phase 2 by themselves and do not create production, pilot, real human-subjects, broad Windows support, code-signing, SmartScreen, Defender, enterprise deployment, security-certification, accessibility-certification, legal, ethics/IRB, real-SMS, PWA, native-mobile, external-AI, or final human-testing readiness evidence.

No real participant data was used.

## Workflow Result

| Item | Result |
| --- | --- |
| Workflow name | `Build Windows internal installer release` |
| Event | `push` tag |
| Tag | `internal-windows-installer-candidate-2026-05-18-r4` |
| Head SHA | `3e42de42b2d1681665eaaf4e06f055d83ddb70b8` |
| Status | `completed` |
| Conclusion | `success` |
| Created at | `2026-05-18T20:50:35Z` |
| Updated at | `2026-05-18T20:52:30Z` |

Superseded first attempt: workflow run [`26057075184`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26057075184) failed before packaging because the workflow invoked `iscc /?` as a gate and Inno Setup returned a non-zero help-command exit. The workflow was fixed in PR #108 and the failed `internal-windows-installer-candidate-2026-05-18` tag was deleted before the `r2` run.

Superseded `r2`: the `r2` release built successfully, but a user install attempt reported Windows `CreateProcess` code 193 because the installer post-install step tried to execute `delphi-commons-launch.vbs` directly. PR #110 changed the Inno Setup script to launch VBS scripts through `wscript.exe`, and the broken `r2` release/tag was deleted after this `r3` release succeeded.

Superseded `r3`: the `r3` release fixed the Windows Script Host launch route, but a user install attempt reported that closing the browser left the local app running and later Start Menu/Desktop launches did not reopen the browser. PR #112 made the start command idempotent so an already-running app reopens the browser, and made the desktop shortcut unconditional. The superseded `r3` release/tag was deleted after this `r4` release succeeded.

## Release Assets

| Asset | Size | SHA256 |
| --- | ---: | --- |
| [`delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r4-3e42de4.zip`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r4/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r4-3e42de4.zip) | 25,353,700 bytes | `43a695f5a91ab8a6b2991bb46e2941db321314fa43d430816908dddef1844bf2` |
| [`delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r4-3e42de4.exe`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r4/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r4-3e42de4.exe) | 25,785,946 bytes | `c62a59825ca2585931c705b16f0fe04991e6673b921b97d6b6cf362b71cd835c` |
| [`windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-18-r4-3e42de4.json`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r4/windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-18-r4-3e42de4.json) | 428,177 bytes | `1900e26360f8ca0171c9ad8a854e6ef4439d372ed71ee4bd4f3a340065fc5706` |
| [`windows-installer-package-verification-internal-windows-installer-candidate-2026-05-18-r4-3e42de4.json`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r4/windows-installer-package-verification-internal-windows-installer-candidate-2026-05-18-r4-3e42de4.json) | 34 bytes | `b7ea028994d1ca087b9208093f13b2d509d4a8605587c68c2982e57d926923f6` |
| [`RELEASE_NOTES.md`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r4/RELEASE_NOTES.md) | 793 bytes | Not included in generated `SHA256SUMS.txt` |
| [`SHA256SUMS.txt`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r4/SHA256SUMS.txt) | 688 bytes | Self-checksum not recorded |

Package verification metadata:

```json
{
  "ok": true,
  "failures": []
}
```

## Remaining Open Gates

- The Windows installer is unsigned.
- SmartScreen and Defender behavior remain `NOT RUN`.
- Clean Windows profile or second-machine install/start/status/browser-open/smoke/restart/backup/restore/reset/stop/uninstall evidence remains `NOT RUN`.
- Enterprise deployment, code-signing, support-matrix, and accessibility evidence remain `NOT RUN`.
- This does not close Phase 1 human evidence, Phase 2 laptop candidate evidence, Phase 4 binder signoff, or Phase 5 final human testing.
