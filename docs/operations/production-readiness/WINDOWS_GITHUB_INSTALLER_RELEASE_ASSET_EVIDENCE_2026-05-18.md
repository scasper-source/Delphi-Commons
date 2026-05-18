# Windows GitHub Installer Release Asset Evidence - 2026-05-18

Status: **WINDOWS INTERNAL INSTALLER RELEASE ASSETS AVAILABLE / NOT READY FOR HUMAN TESTING**.

Date/time basis: 2026-05-18 GitHub Actions release workflow run.

Track: `human_testing_candidate`.

Release tag: [`internal-windows-installer-candidate-2026-05-18-r7`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-05-18-r7).

Workflow run: [`26061390715`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26061390715).

Commit hash:

```text
58c3cf73ffac5de8e939f45de0280acb090c9cf6
```

## Scope

This document records that GitHub now has Windows x64 internal installer candidate assets available for download.

The recommended operator asset is the installer ZIP bundle. The simple internal flow is: download the ZIP, unzip it, run the included installer EXE, then launch Delphi Commons from the Desktop or Start Menu. If the browser app window does not open, open `http://127.0.0.1:4173` while the app is running. When finished, closing the Delphi Commons browser app window stops the local runtime.

These assets are internal synthetic/low-risk package candidates only. They do not close Phase 2 by themselves and do not create production, pilot, real human-subjects, broad Windows support, code-signing, SmartScreen, Defender, enterprise deployment, security-certification, accessibility-certification, legal, ethics/IRB, real-SMS, PWA, native-mobile, external-AI, or final human-testing readiness evidence.

No real participant data was used.

## Workflow Result

| Item | Result |
| --- | --- |
| Workflow name | `Build Windows internal installer release` |
| Event | `push` tag |
| Tag | `internal-windows-installer-candidate-2026-05-18-r7` |
| Head SHA | `58c3cf73ffac5de8e939f45de0280acb090c9cf6` |
| Status | `completed` |
| Conclusion | `success` |
| Created at | `2026-05-18T21:25:52Z` |
| Updated at | `2026-05-18T21:28:34Z` |

Superseded first attempt: workflow run [`26057075184`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26057075184) failed before packaging because the workflow invoked `iscc /?` as a gate and Inno Setup returned a non-zero help-command exit. The workflow was fixed in PR #108 and the failed `internal-windows-installer-candidate-2026-05-18` tag was deleted before the `r2` run.

Superseded `r2`: the `r2` release built successfully, but a user install attempt reported Windows `CreateProcess` code 193 because the installer post-install step tried to execute `delphi-commons-launch.vbs` directly. PR #110 changed the Inno Setup script to launch VBS scripts through `wscript.exe`, and the broken `r2` release/tag was deleted after this `r3` release succeeded.

Superseded `r3`: the `r3` release fixed the Windows Script Host launch route, but a user install attempt reported that closing the browser left the local app running and later Start Menu/Desktop launches did not reopen the browser. PR #112 made the start command idempotent so an already-running app reopens the browser, and made the desktop shortcut unconditional. The superseded `r3` release/tag was deleted after this `r4` release succeeded.

Superseded `r4`: the `r4` release made start idempotent and created the desktop launcher unconditionally, but still exposed a background-runtime mental model. PR #114 aligned the installed lifecycle with the visible browser window: the installed launcher opens an attached Edge app window, stops the local runtime when that window closes, and removes user-facing Stop/Status shortcuts. The superseded `r4` release/tag was deleted after `r5` succeeded.

Superseded `r5`: the `r5` release contained the installed lifecycle fix, but the generated installer ZIP README still mentioned a user-facing Stop shortcut. PR #115 removed that stale Stop instruction from the generated ZIP README and updated the readiness/install docs. The superseded `r5` release/tag was deleted after `r7` succeeded.

Superseded `r6`: the `r6` release removed the stale Stop instruction from the generated ZIP README, but automated review found two remaining issues: the browser fallback appeared after the shutdown step, and a missing attached browser could leave the runtime running in the background. PR #116 moved the fallback before the final shutdown step, supports Chrome as an attached browser fallback, checks attached-browser availability before startup, and stops the runtime before surfacing any attached-browser launch failure. The superseded `r6` release/tag was deleted after this `r7` release succeeded.

Downloaded ZIP README verification: the `r7` installer ZIP was downloaded after release, expanded locally, and `README_INSTALL_WINDOWS.txt` was confirmed to list the browser fallback before the final close-window shutdown step and to contain no `Delphi Commons Stop` instruction.

## Release Assets

| Asset | Size | SHA256 |
| --- | ---: | --- |
| [`delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r7-58c3cf7.zip`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r7/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r7-58c3cf7.zip) | 25,354,189 bytes | `a4ca850ca0763878cc5b5a1acd0de97fd12076ca15cc4324df009bdbfca50853` |
| [`delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r7-58c3cf7.exe`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r7/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r7-58c3cf7.exe) | 25,786,365 bytes | `10f6a1a7f65cf64394f0078e161057f5d6f4909676c17a0d380208f283cb558c` |
| [`windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-18-r7-58c3cf7.json`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r7/windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-18-r7-58c3cf7.json) | 428,177 bytes | `bbd2833949b377ad97638e87f0af8ce72b6e506995b2a62f1200b2f4875c3727` |
| [`windows-installer-package-verification-internal-windows-installer-candidate-2026-05-18-r7-58c3cf7.json`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r7/windows-installer-package-verification-internal-windows-installer-candidate-2026-05-18-r7-58c3cf7.json) | 34 bytes | `b7ea028994d1ca087b9208093f13b2d509d4a8605587c68c2982e57d926923f6` |
| [`RELEASE_NOTES.md`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r7/RELEASE_NOTES.md) | 793 bytes | Not included in generated `SHA256SUMS.txt` |
| [`SHA256SUMS.txt`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r7/SHA256SUMS.txt) | 688 bytes | Self-checksum not recorded |

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
- Clean Windows profile or second-machine install/start/browser-window-open/browser-window-close-to-stop/smoke/restart/backup/restore/reset/uninstall evidence remains `NOT RUN`.
- Enterprise deployment, code-signing, support-matrix, and accessibility evidence remain `NOT RUN`.
- This does not close Phase 1 human evidence, Phase 2 laptop candidate evidence, Phase 4 binder signoff, or Phase 5 final human testing.
