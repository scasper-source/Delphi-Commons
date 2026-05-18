# Windows GitHub Installer Release Asset Evidence - 2026-05-18

Status: **WINDOWS INTERNAL INSTALLER RELEASE ASSETS AVAILABLE / NOT READY FOR HUMAN TESTING**.

Date/time basis: 2026-05-18 GitHub Actions release workflow run.

Track: `human_testing_candidate`.

Release tag: [`internal-windows-installer-candidate-2026-05-18-r3`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-05-18-r3).

Workflow run: [`26058602892`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26058602892).

Commit hash:

```text
43be65b45f98ad59224f47ef9d0df107d4180f1a
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
| Tag | `internal-windows-installer-candidate-2026-05-18-r3` |
| Head SHA | `43be65b45f98ad59224f47ef9d0df107d4180f1a` |
| Status | `completed` |
| Conclusion | `success` |
| Created at | `2026-05-18T20:29:04Z` |
| Updated at | `2026-05-18T20:31:02Z` |

Superseded first attempt: workflow run [`26057075184`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26057075184) failed before packaging because the workflow invoked `iscc /?` as a gate and Inno Setup returned a non-zero help-command exit. The workflow was fixed in PR #108 and the failed `internal-windows-installer-candidate-2026-05-18` tag was deleted before the `r2` run.

Superseded `r2`: the `r2` release built successfully, but a user install attempt reported Windows `CreateProcess` code 193 because the installer post-install step tried to execute `delphi-commons-launch.vbs` directly. PR #110 changed the Inno Setup script to launch VBS scripts through `wscript.exe`, and the broken `r2` release/tag was deleted after this `r3` release succeeded.

## Release Assets

| Asset | Size | SHA256 |
| --- | ---: | --- |
| [`delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r3-43be65b.zip`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r3/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r3-43be65b.zip) | 25,350,899 bytes | `3060c7b6681ddc12a8142d0834cc0f45ba26b573120b2eecd92e880676f8844b` |
| [`delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r3-43be65b.exe`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r3/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r3-43be65b.exe) | 25,783,147 bytes | `4aa490bb369c8508bdab6dc4aaca02517acd34381abc86099c94597547879183` |
| [`windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-18-r3-43be65b.json`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r3/windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-18-r3-43be65b.json) | 428,177 bytes | `eac926eb482cd60dfb606403072acfb5a3ee58473de0aeccb609e06115c3e307` |
| [`windows-installer-package-verification-internal-windows-installer-candidate-2026-05-18-r3-43be65b.json`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r3/windows-installer-package-verification-internal-windows-installer-candidate-2026-05-18-r3-43be65b.json) | 34 bytes | `b7ea028994d1ca087b9208093f13b2d509d4a8605587c68c2982e57d926923f6` |
| [`RELEASE_NOTES.md`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r3/RELEASE_NOTES.md) | 793 bytes | Not included in generated `SHA256SUMS.txt` |
| [`SHA256SUMS.txt`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r3/SHA256SUMS.txt) | 688 bytes | Self-checksum not recorded |

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
