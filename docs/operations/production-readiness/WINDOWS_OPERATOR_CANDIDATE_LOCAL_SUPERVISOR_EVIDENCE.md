# Windows Operator Candidate Local Supervisor Evidence

- Status: **WINDOWS POWERSHELL SUPERVISOR EVIDENCE RECORDED**.
- Decision label: **NOT READY FOR HUMAN TESTING**.
- Date/time basis: **2026-05-11T13:09:23-04:00**.
- Branch: **`codex/windows-supervisor-local-evidence`**.
- Baseline commit before local fixes: **`036ccade942b6e7ab7a70133fe8b44245e04334f`**.

## Scope

This evidence records a local Windows run of `scripts/windows/operator-candidate.ps1` after the Stage 1 Windows operator candidate prototype landed on `main`.

This run used the actual Windows PowerShell entrypoint rather than the earlier Linux-equivalent closeout path. It found and fixed Windows-specific supervisor defects before recording passing lifecycle evidence.

This evidence does not claim human-testing readiness. The prototype still depends on local Node/npm and is not a bundled downloadable installer.

## Local Environment

| Item | Observed value |
| --- | --- |
| PowerShell | Windows PowerShell `5.1.26100.8115` |
| `pwsh` | Not available |
| Node.js | `v24.14.1` |
| npm | Plain `npm` was blocked by local execution policy; script now uses `npm.cmd` internally |
| Runtime root | `C:\Users\13152\AppData\Local\DelphiCommons\windows-operator-candidate` |
| Operator UI | `http://127.0.0.1:4173` |
| Backend health | `http://127.0.0.1:3001/health` |

## Defects Found And Remediated

| Defect | Evidence | Remediation |
| --- | --- | --- |
| Script continued after failed native build command | Initial `start` continued after `server` build emitted `tsc is not recognized`. | Added checked command invocation so failed `npm.cmd` commands stop execution. |
| `Start-Process -Environment` is unavailable in Windows PowerShell 5.1 | Initial `start` failed with `A parameter cannot be found that matches parameter name 'Environment'`. | Added PowerShell 5.1-compatible process-environment scoping before backend launch. |
| `$pid` conflicts with PowerShell's read-only `$PID` variable | Initial `status` failed with `Cannot overwrite variable pid because it is read-only or constant`. | Renamed function parameters to `processId`. |
| `restart` left a child Vite process listening on port `4173` | Initial `restart` failed with `Port 4173 already in use`. | Added recursive child-process termination before stopping tracked parent processes. |

## Command Evidence

| Step | Command / check | Result |
| --- | --- | --- |
| Baseline status | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 status` | PASS: `Not running.` |
| Pre-start smoke | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 smoke` | EXPECTED FAIL: unable to connect before backend start. |
| Dependency setup | `npm.cmd --prefix app ci` | PASS: 178 packages installed; 0 vulnerabilities reported. |
| Start | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 start` | PASS after fixes. |
| Status after start | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 status` | PASS: backend/UI running; runtime root reported. |
| Health | `Invoke-RestMethod http://127.0.0.1:3001/health` | PASS: `{"status":"ok","service":"edelphi-server","environment":"production"}` |
| UI availability | `Invoke-WebRequest -UseBasicParsing -Method Head http://127.0.0.1:4173/` | PASS: HTTP `200`. |
| Smoke while running | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 smoke` | PASS: `Smoke ok: http://127.0.0.1:3001/health`. |
| Reset safety while running | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 reset` | PASS: refused with `Stop prototype before reset.` |
| Backup | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 backup` | PASS: backup created at `...\backups\backup-20260511-130359`. |
| Backup manifest | `manifest.json` in backup directory | PASS: manifest includes `db`, `audit`, and `exports`. |
| Restart | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 restart` | PASS after recursive child-process stop fix. |
| Health after restart | `/health` rechecked | PASS: status `ok`. |
| UI after restart | HTTP HEAD rechecked | PASS: HTTP `200`. |
| Stop | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 stop` | PASS: `Prototype stopped.` |
| Port cleanup | `Get-NetTCPConnection -LocalPort 3001,4173 -State Listen` | PASS: no listeners after stop. |
| Final status | `operator-candidate.ps1 status` | PASS: `Not running.` |
| Reset after stop | `operator-candidate.ps1 reset` | PASS: reset completed with snapshot `...\backups\reset-snapshot-20260511-130753`. |
| Final port check | `Get-NetTCPConnection -LocalPort 3001,4173 -State Listen` | PASS: no listeners after reset. |

## Runtime Artifacts

Local runtime artifacts are intentionally outside the repository:

- Runtime root: `C:\Users\13152\AppData\Local\DelphiCommons\windows-operator-candidate`
- Backup manifest: `...\backups\backup-20260511-130359\manifest.json`
- Reset snapshot: `...\backups\reset-snapshot-20260511-130753`
- Snapshot event log: `...\backups\reset-snapshot-20260511-130753\operator-events.log`
- Current post-reset event log: `...\evidence\operator-events.log`

Observed snapshot event log includes start, smoke, backup, restart, and recursive child-process stop events.

## Repo Checks

| Check | Result |
| --- | --- |
| `npm.cmd --prefix server run build` | PASS |
| `npm.cmd --prefix app run build` | PASS after rerun outside sandbox; sandboxed attempt failed with `esbuild` spawn `EPERM`. |
| `npm.cmd --prefix server test` | PASS; deployment verifier warnings/inconclusive audit branch observed inside test output, but command exited successfully. |
| `npm.cmd --prefix app test` | PASS, 28/28 tests. |

## Remaining Limitations

- This is still a script-based prototype, not a downloadable installer.
- The prototype still assumes local Node/npm availability.
- No portable Node runtime is bundled yet.
- No Windows signing, SmartScreen, Defender, or Smart App Control evidence has been completed for a packaged artifact.
- No LAN phone-testing mode is implemented.
- No real SMS delivery is implemented or approved.
- No human-observed end-to-end walkthrough has been completed.
- No macOS evidence is included.

## Decision

The Windows PowerShell supervisor path is now locally exercised for:

- status,
- start,
- health,
- UI availability,
- smoke,
- reset refusal while running,
- backup,
- restart,
- stop,
- child process cleanup,
- reset after stop,
- runtime/log path behavior.

Decision remains: **NOT READY FOR HUMAN TESTING**.

The next Windows packaging step should focus on turning this script-scoped prototype into a reproducible downloadable/internal package and replacing the local Node/npm assumption with the packaging strategy required by the Backend Packaging and Process Supervision ADR.

## Explicit Non-Claims

This evidence does **not** claim production readiness, pilot readiness, real human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, or external AI readiness.
