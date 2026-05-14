# Windows Portable Bundled Runtime Release Asset Evidence

Status: **WINDOWS RELEASE-ASSET SMOKE EVIDENCE RECORDED**.

Decision label: **NOT READY FOR HUMAN TESTING**.

Date/time basis: **2026-05-14** local Windows release-asset smoke session.

Track: `human_testing_candidate`.

Release tag: [`internal-package-candidate-2026-05-14-r2`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-package-candidate-2026-05-14-r2).

Release asset: [`delphi-commons-windows-portable-bundled-runtime-internal-2026-05-14-8c71b66.zip`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-package-candidate-2026-05-14-r2/delphi-commons-windows-portable-bundled-runtime-internal-2026-05-14-8c71b66.zip).

Release asset SHA256:

```text
fc7c9d18c08e155ab50bd4b30212fb7a8dda8dc14071064291ec835207fa87ea  delphi-commons-windows-portable-bundled-runtime-internal-2026-05-14-8c71b66.zip
```

Commit hash:

```text
8c71b666fe0c9aac9ad1a1939e9d025cdd356967
```

## Scope

This document records a local Windows smoke run of the GitHub release asset zip after the `r2` path-with-spaces launcher fix.

This evidence covers only a downloaded Windows portable bundled-runtime release asset extracted and run on one local Windows user profile. It does not close Phase 2 by itself and does not create production, pilot, real human-subjects, platform-support, installer, signing, SmartScreen, Defender, real-SMS, PWA, native-mobile, external-AI, security-certification, accessibility-certification, legal, or ethics/IRB readiness evidence.

No real participant data was used.

## Background

The first `internal-package-candidate-2026-05-14` release asset was superseded after a local extracted-package test exposed a Windows launcher defect when the package path contained a space. The static UI process attempted to load `C:\Users\13152\Dropbox\Delphi` as a Node module when the package was extracted under `Dropbox\Delphi Commons\...`.

PR #82 fixed the launcher by quoting `Start-Process` arguments for backend and static UI process launches. The `r2` release asset was rebuilt from the merged fix and verified from a path with spaces before publication.

## Local Environment

| Item | Observed value |
| --- | --- |
| Host shell | Windows PowerShell |
| Package root | `C:\Users\13152\Dropbox\Delphi Commons\delphi-commons-windows-portable-bundled-runtime-internal-2026-05-14-8c71b66\windows-portable-bundled-runtime-internal` |
| Runtime root | `C:\Users\13152\AppData\Local\DelphiCommons\windows-portable-bundled-runtime-internal` |
| Operator UI | `http://127.0.0.1:4173` |
| Backend health | `http://127.0.0.1:3001/health` |

## Command Evidence

The package was run from the extracted package root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-bundled-runtime.ps1 start
```

Observed output:

```text
Copying packaged server production dependencies into runtime root...
Operator UI: http://127.0.0.1:4173
Operator localhost URL (default, safe): http://127.0.0.1:4173
Health check: http://127.0.0.1:3001/health
```

Status command:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-bundled-runtime.ps1 status
```

Observed output:

```text
Backend pid: 12772 running=True
UI pid: 38812 running=True
UI URL: http://127.0.0.1:4173
Health: http://127.0.0.1:3001/health
Runtime root: C:\Users\13152\AppData\Local\DelphiCommons\windows-portable-bundled-runtime-internal
Package root: C:\Users\13152\Dropbox\Delphi Commons\delphi-commons-windows-portable-bundled-runtime-internal-2026-05-14-8c71b66\windows-portable-bundled-runtime-internal
```

Browser observation:

- `http://127.0.0.1:4173` loaded the Delphi Commons operator UI.
- The visible screen showed the dashboard for `Care Transitions Expert Delphi`.

Smoke command:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-bundled-runtime.ps1 smoke
```

Observed output:

```text
Smoke ok: http://127.0.0.1:3001/health
```

Stop command:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-bundled-runtime.ps1 stop
```

Observed output:

```text
Prototype stopped.
```

## Pass/Fail Table

| Check | Status | Notes |
| --- | --- | --- |
| GitHub `r2` Windows release asset downloaded | PASS | Release asset zip was used, not the GitHub source-code zip. |
| Extracted package path contains spaces | PASS | Package ran from `Dropbox\Delphi Commons\...`. |
| Start command | PASS | Backend and static UI launch commands completed. |
| UI browser reachability | PASS | `http://127.0.0.1:4173` loaded the operator UI. |
| Status command | PASS | Backend and UI PIDs reported `running=True`. |
| Smoke command | PASS | Backend health smoke returned `Smoke ok`. |
| Stop command | PASS | Stop returned `Prototype stopped.` |
| Second Windows machine or clean user profile | NOT RUN | Remains an open Phase 2 blocker. |
| Windows signing, installer, SmartScreen, Defender, or support-matrix evidence | NOT RUN | Not part of this release-asset smoke. |

## Interpretation

The `r2` Windows release asset fixes the path-with-spaces crash observed in the first release asset and supports a basic downloaded-package lifecycle smoke on the local Windows user profile:

- extracted release asset,
- start,
- browser UI reachability,
- status,
- smoke,
- stop.

This is stronger than staged-package evidence because it uses the GitHub release asset, but it remains local engineering evidence only. Phase 2 remains open until the remaining clean-profile/second-machine, distribution-scope, operator walkthrough, and documentation/evidence binder gates are satisfied.

## Explicit Non-Claims

This evidence does **not** claim:

- production deployment,
- pilot authorization,
- real human-subjects use,
- legal or ethics/IRB approval,
- security certification,
- accessibility certification,
- Windows platform support,
- signed installer behavior,
- SmartScreen or Defender acceptance,
- enterprise distribution readiness,
- real SMS readiness,
- PWA readiness,
- native mobile readiness,
- external AI readiness.
