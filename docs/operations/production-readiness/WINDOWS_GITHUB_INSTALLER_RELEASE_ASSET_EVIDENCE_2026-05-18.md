# Windows GitHub Installer Release Asset Evidence - 2026-05-18

Status: **WINDOWS INTERNAL INSTALLER RELEASE ASSETS AVAILABLE / NOT READY FOR HUMAN TESTING**.

Date/time basis: 2026-05-18 GitHub Actions release workflow run.

Track: `human_testing_candidate`.

Release tag: [`internal-windows-installer-candidate-2026-05-18-r2`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-05-18-r2).

Workflow run: [`26057445547`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26057445547).

Commit hash:

```text
1c6536388ce190f014aca902b321d78c850d524a
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
| Tag | `internal-windows-installer-candidate-2026-05-18-r2` |
| Head SHA | `1c6536388ce190f014aca902b321d78c850d524a` |
| Status | `completed` |
| Conclusion | `success` |
| Created at | `2026-05-18T20:05:23Z` |
| Updated at | `2026-05-18T20:07:45Z` |

Superseded first attempt: workflow run [`26057075184`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26057075184) failed before packaging because the workflow invoked `iscc /?` as a gate and Inno Setup returned a non-zero help-command exit. The workflow was fixed in PR #108 and the failed `internal-windows-installer-candidate-2026-05-18` tag was deleted before the `r2` run.

## Release Assets

| Asset | Size | SHA256 |
| --- | ---: | --- |
| [`delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r2-1c65363.zip`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r2/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r2-1c65363.zip) | 25,352,669 bytes | `f173c5798ff0c72f21f2f70182a7fc0825d3ef1a9d510c96b19b9397c542b65e` |
| [`delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r2-1c65363.exe`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r2/delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-05-18-r2-1c65363.exe) | 25,784,919 bytes | `81bad1dabea66f5b197b37036f0596773dc8c00a609faf7d94c29c577a908044` |
| [`windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-18-r2-1c65363.json`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r2/windows-installer-package-manifest-internal-windows-installer-candidate-2026-05-18-r2-1c65363.json) | 428,177 bytes | `302778db257e22d47785f9055ecea10e6aba237aa05f18ead9a77b007731ce53` |
| [`windows-installer-package-verification-internal-windows-installer-candidate-2026-05-18-r2-1c65363.json`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r2/windows-installer-package-verification-internal-windows-installer-candidate-2026-05-18-r2-1c65363.json) | 34 bytes | `b7ea028994d1ca087b9208093f13b2d509d4a8605587c68c2982e57d926923f6` |
| [`RELEASE_NOTES.md`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r2/RELEASE_NOTES.md) | 793 bytes | Not included in generated `SHA256SUMS.txt` |
| [`SHA256SUMS.txt`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-windows-installer-candidate-2026-05-18-r2/SHA256SUMS.txt) | 688 bytes | Self-checksum not recorded |

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
