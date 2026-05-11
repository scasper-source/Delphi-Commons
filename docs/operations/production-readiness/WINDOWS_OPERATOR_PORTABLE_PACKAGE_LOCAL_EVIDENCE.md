# Windows Operator Portable Package Local Evidence

Status: **WINDOWS PORTABLE PACKAGE LOCAL EVIDENCE RECORDED**.

Decision label: **NOT READY FOR HUMAN TESTING**.

Date/time basis: **2026-05-11T14:11:45-04:00** local Windows evidence session.

Track: `human_testing_candidate`.

Branch: `codex/windows-portable-package-local-evidence`.

Baseline commit before this evidence/fix commit: `3412bff2ec5cc55989088745448426998bbe32b3`.

## Scope

This evidence records a local Windows run of the Stage 1 portable/internal package builder and the packaged operator lifecycle commands. It is local engineering evidence only. It does not create installer readiness, Windows support readiness, production readiness, pilot readiness, real human-subjects readiness, or certification evidence.

## Package Artifact

- Package output path: `C:\Users\13152\Dropbox\eDelphi\github-clean\build\windows-operator-portable\staging\windows-operator-portable-prototype-20260511-180914`
- Zip path: `C:\Users\13152\Dropbox\eDelphi\github-clean\build\windows-operator-portable\windows-operator-portable-prototype-20260511-180914.zip`
- Package manifest: `package-manifest.json`
- Package README: `README.txt`
- Runtime data root: `%LOCALAPPDATA%\DelphiCommons\windows-operator-portable-candidate`

Generated build outputs remain under `build/` and are not committed to the repository.

## Failure And Fix Record

| Step | Result | Evidence interpretation |
| --- | --- | --- |
| Initial builder run | Failed | Windows PowerShell 5.1 did not support `[System.IO.Path]::GetRelativePath`; the builder stopped after app/server builds. |
| Builder compatibility fix | Pass after patch | Added a `System.Uri`-based relative path helper compatible with Windows PowerShell 5.1. |
| Package run-shape review | Issue found | Initial package shape copied repo-oriented `operator-candidate.ps1` and would not run cleanly from an unzipped package root. |
| Package launcher fix | Pass after patch | Added `portable-operator-candidate.ps1` for package-root execution and `static-file-server.mjs` for serving built frontend assets without Vite. |
| First-run package mutation review | Issue found | Installing server dependencies inside the package root would mutate the unzipped package and add third-party `node_modules` contents. |
| Runtime dependency location fix | Pass after patch | The package launcher now copies the compiled backend into `%LOCALAPPDATA%\DelphiCommons\windows-operator-portable-candidate\server-runtime` and installs production dependencies there, keeping the package root clean. |
| Static UI path guard review | Pass after patch | The package static server now requires resolved request paths to equal the UI root or remain inside the UI root with a path-separator boundary. |
| Rebuild after transient file handle | Pass after rerun | One rerun failed because Windows held the previous staging `server\dist` directory briefly. After checking for lingering Node processes and waiting, the builder completed. |

## Command Evidence

| Command | Result |
| --- | --- |
| `powershell -ExecutionPolicy Bypass -File .\scripts\windows\build-operator-portable-package.ps1` | Initially failed with `GetRelativePath` compatibility error. |
| `powershell -ExecutionPolicy Bypass -File .\scripts\windows\build-operator-portable-package.ps1` | Failed once in sandboxed context with Vite/esbuild `spawn EPERM`; rerun outside sandbox was required. |
| `powershell -ExecutionPolicy Bypass -File .\scripts\windows\build-operator-portable-package.ps1` | Failed once on previous staging deletion because Windows briefly held `server\dist`; no lingering Node process was found, and a later rerun succeeded. |
| `powershell -ExecutionPolicy Bypass -File .\scripts\windows\build-operator-portable-package.ps1` | Passed after fixes; created package root and zip listed above. |
| `powershell -ExecutionPolicy Bypass -File <package>\scripts\windows\portable-operator-candidate.ps1 status` | Passed before start with `Not running.` |
| `powershell -ExecutionPolicy Bypass -File <package>\scripts\windows\portable-operator-candidate.ps1 start` | Passed; backend and static UI launched. |
| `powershell -ExecutionPolicy Bypass -File <package>\scripts\windows\portable-operator-candidate.ps1 status` | Passed; backend pid and UI pid reported running. |
| `Invoke-RestMethod http://127.0.0.1:3001/health` | Passed with `{ "status": "ok", "service": "edelphi-server", "environment": "production" }`. |
| `Invoke-WebRequest -Method Head http://127.0.0.1:4173/` | Passed with HTTP `200`. |
| `powershell -ExecutionPolicy Bypass -File <package>\scripts\windows\portable-operator-candidate.ps1 smoke` | Passed with `Smoke ok: http://127.0.0.1:3001/health`. |
| `powershell -ExecutionPolicy Bypass -File <package>\scripts\windows\portable-operator-candidate.ps1 reset` while running | Passed safety expectation by refusing with `Stop prototype before reset.` |
| `powershell -ExecutionPolicy Bypass -File <package>\scripts\windows\portable-operator-candidate.ps1 backup` | Passed; backup created under runtime root. |
| `powershell -ExecutionPolicy Bypass -File <package>\scripts\windows\portable-operator-candidate.ps1 restart` | Passed; backend and UI relaunched. |
| `powershell -ExecutionPolicy Bypass -File <package>\scripts\windows\portable-operator-candidate.ps1 stop` | Passed with `Prototype stopped.` |
| `Get-NetTCPConnection -LocalPort 3001,4173 -State Listen` after stop | No listeners returned. |
| `powershell -ExecutionPolicy Bypass -File <package>\scripts\windows\portable-operator-candidate.ps1 reset` after stop | Passed; reset snapshot created under runtime root. |
| Final `status` | Passed with `Not running.` |

## Smoke Table

| Check | Result | Notes |
| --- | --- | --- |
| Builder runs on local Windows | PASS | Required Windows PowerShell compatibility fix and sandbox rerun. |
| Package root created | PASS | `windows-operator-portable-prototype-20260511-180343`. |
| Zip created | PASS | Zip file created under `build/windows-operator-portable`. |
| Package README created | PASS | Includes status, run command, limitations, runtime path, and non-claims. |
| Package manifest created | PASS | Records label, timestamp, branch, commit, dependencies, limitations, and included files. |
| Sensitive material excluded from generated package | PASS | No `.git`, `.env`, database, log, zip, backup, evidence, or runtime data matches in the package root after corrected lifecycle run. |
| Start | PASS | Backend and static UI launched from package-specific command. |
| Status | PASS | Reports backend/UI pids and runtime/package roots. |
| Backend health | PASS | `/health` returned status `ok`. |
| UI HEAD | PASS | Static UI returned HTTP `200`. |
| Smoke | PASS | Health smoke passed. |
| Backup | PASS | Backup directory created under runtime root. |
| Reset refusal while running | PASS | Reset refused while backend was running. |
| Restart | PASS | Backend health and UI HEAD passed after restart. |
| Stop | PASS | Stop command completed; ports were no longer listening. |
| Reset after stop | PASS | Reset completed and created a snapshot. |
| Clean extracted zip from separate directory | NOT RUN | Still required before any human-testing candidate claim. |
| Second Windows machine or clean user profile | NOT RUN | Still required before any Windows human-testing candidate claim. |

## Verification Commands

| Command | Result |
| --- | --- |
| `npm.cmd --prefix server run build` | PASS |
| `npm.cmd --prefix app run build` | PASS after rerun outside sandbox; first attempt failed with Vite/esbuild `spawn EPERM` in sandboxed context. |
| `npm.cmd --prefix server test` | PASS |
| `npm.cmd --prefix app test` | PASS |
| Documentation claim scan | PASS; matches were explicit non-claims/decision labels only, and no direct overclaim phrasing was found. |
| `git diff --check` | PASS; line-ending warnings only. |

## Manifest Summary

- Package name: `windows-operator-portable-prototype-20260511-180914`
- Build timestamp UTC: `2026-05-11T18:09:14.0955496Z`
- Branch recorded by manifest: `codex/windows-portable-package-local-evidence`
- Commit recorded by manifest: `3412bff2ec5cc55989088745448426998bbe32b3`
- Included file/directory count: `290`
- Required external dependencies: Node.js + npm on local Windows machine; PowerShell 5.1+ or PowerShell 7+
- Explicit limitation: no bundled portable Node runtime; local Node/npm dependency remains

## Package Contents Summary

The corrected generated package includes:

- `app/dist`
- `server/dist`
- `server/package.json`
- `server/package-lock.json`
- `scripts/windows/portable-operator-candidate.ps1`
- `tools/static-file-server.mjs`
- `README.txt`
- `package-manifest.json`
- `LICENSE`
- `NOTICE`

The package launcher installs server production dependencies under the runtime root, not under the package root.

## Excluded Sensitive Material Check

The generated package root was scanned for:

- `.git`
- `.env` and `*.env`
- `*.sqlite` and `*.db`
- `*.log`
- `*.zip`
- runtime `logs`, `backups`, `evidence`, and `node_modules` directories

Result: **no matches after corrected lifecycle run**.

The package includes `server/dist/exports`, which is compiled export-route code, not generated export data.

## Runtime Path Evidence

Runtime root after lifecycle testing:

- `C:\Users\13152\AppData\Local\DelphiCommons\windows-operator-portable-candidate`

Observed runtime subdirectories:

- `audit`
- `backups`
- `db`
- `evidence`
- `exports`
- `logs`
- `server-runtime`
- `state`

Observed backup/reset artifacts:

- `backup-20260511-141021`
- `reset-snapshot-20260511-141145`

The `server-runtime` directory held production dependencies outside the package root. `fastify\package.json` was present under `server-runtime\node_modules`, confirming the dependency location fix.

## Limitations

- This is a Stage 1 portable/internal package prototype only.
- The package still requires local Node.js and npm.
- The package zip is not a standalone desktop app.
- The package was validated from the build staging directory, not from a fresh extracted zip directory.
- The package was validated on one Windows machine/user context only.
- No Tauri shell is implemented.
- No NSIS/MSI installer is implemented.
- No code signing, SmartScreen reputation, updater, or enterprise distribution path is implemented.
- No macOS package evidence is created by this run.
- No real SMS provider delivery is implemented.
- No PWA/service-worker behavior is enabled.
- No native iOS or Android app is implemented.
- No external AI connector is enabled.
- Human accessibility testing, phone testing, and final human-testing binder evidence remain required later gates.

## Remaining Blockers

- Clean extracted zip lifecycle evidence.
- Second-machine or clean-profile Windows evidence.
- Decision on bundled portable Node runtime versus documented local Node/npm prerequisite.
- Windows signing/distribution ADR and evidence.
- Tauri implementation remains deferred.
- macOS package/build evidence remains missing.
- Phone participant mobile web and SMS mock/sandbox evidence remain separate Phase 3 work.
- Human testing binder and human-observed evidence remain separate later work.

## Explicit Non-Claims

This evidence does **not** claim:

- production readiness,
- pilot readiness,
- real human-subjects readiness,
- IRB approval,
- legal approval,
- security certification,
- accessibility certification,
- installer readiness,
- Windows support readiness,
- macOS support readiness,
- real SMS readiness,
- PWA readiness,
- native mobile readiness,
- external AI readiness,
- readiness for unrestricted real-world use.
