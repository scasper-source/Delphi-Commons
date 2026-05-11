# Windows Operator Portable Package Extracted Zip Evidence

Status: **WINDOWS PORTABLE PACKAGE EXTRACTED ZIP EVIDENCE RECORDED**.

Decision label: **NOT READY FOR HUMAN TESTING**.

Date/time basis: **2026-05-11T14:35:13-04:00 through 2026-05-11T14:40:11-04:00** local Windows evidence session.

Track: `human_testing_candidate`.

Branch: `codex/windows-extracted-zip-local-evidence`.

Commit hash at evidence session start: `cf6c0b742f10b67b614b683364c8132df0532584`.

## Scope

This document records a local Windows run of the Stage 1 portable/internal operator package from a clean extracted zip directory separate from the build staging directory.

This evidence closes only the clean extracted-zip local Windows package execution item. It does not close Phase 2 and does not create human-testing, pilot, production, platform-support, installer, signing, SMS, PWA, native mobile, external AI, security, accessibility, IRB, or legal readiness evidence.

## Local Environment

| Item | Observed value |
| --- | --- |
| Windows PowerShell | `5.1.26100.8115` |
| Node.js | `v24.14.1` |
| npm | `11.11.0` |
| Git branch | `codex/windows-extracted-zip-local-evidence` |
| Baseline commit | `cf6c0b742f10b67b614b683364c8132df0532584` |
| Runtime root | `C:\Users\13152\AppData\Local\DelphiCommons\windows-operator-portable-candidate` |
| Operator UI | `http://127.0.0.1:4173` |
| Backend health | `http://127.0.0.1:3001/health` |

## Artifact Paths

- Generated zip path: `C:\Users\13152\Dropbox\eDelphi\github-clean\build\windows-operator-portable\windows-operator-portable-prototype-20260511-183513.zip`
- Clean extracted package path: `C:\Users\13152\Dropbox\eDelphi\github-clean\build\windows-operator-portable\extracted-test`
- Build staging package path: `C:\Users\13152\Dropbox\eDelphi\github-clean\build\windows-operator-portable\staging\windows-operator-portable-prototype-20260511-183513`
- Package manifest: `C:\Users\13152\Dropbox\eDelphi\github-clean\build\windows-operator-portable\extracted-test\package-manifest.json`
- Package README: `C:\Users\13152\Dropbox\eDelphi\github-clean\build\windows-operator-portable\extracted-test\README.txt`

Generated build and extracted-test artifacts remain under `build/` and are not committed.

## Extraction Safety

The clean extracted-test directory was removed and recreated only after resolving both paths:

| Path | Resolved value |
| --- | --- |
| Output root | `C:\Users\13152\Dropbox\eDelphi\github-clean\build\windows-operator-portable` |
| Extracted-test root | `C:\Users\13152\Dropbox\eDelphi\github-clean\build\windows-operator-portable\extracted-test` |

Safety result: **PASS**. The extracted-test root was confirmed to remain inside the package output root before recursive cleanup.

## Extracted Package Inspection

| Check | Result | Evidence |
| --- | --- | --- |
| README exists | PASS | `README.txt` present in extracted package root. |
| Manifest exists | PASS | `package-manifest.json` present in extracted package root. |
| Manifest parses as JSON | PASS | Parsed with `ConvertFrom-Json`. |
| Packaged launcher exists | PASS | `scripts/windows/portable-operator-candidate.ps1` present. |
| Static UI server exists | PASS | `tools/static-file-server.mjs` present. |
| Dependency posture visible | PASS | Manifest lists local Node.js/npm and PowerShell as required external dependencies. |

## Manifest Summary

| Manifest field | Value |
| --- | --- |
| Package label | `windows-operator-portable-prototype` |
| Package name | `windows-operator-portable-prototype-20260511-183513` |
| Build timestamp UTC | `2026-05-11T18:35:13.5859907Z` |
| Manifest branch | `codex/windows-extracted-zip-local-evidence` |
| Manifest commit hash | `cf6c0b742f10b67b614b683364c8132df0532584` |
| Included file/directory count | `290` |
| Runtime data path | `%LOCALAPPDATA%\DelphiCommons\windows-operator-portable-candidate` |
| Required external dependencies | Node.js + npm on local Windows machine; PowerShell 5.1+ or PowerShell 7+ |

The manifest's build-time `packageRoot` field points to the staging package path because the manifest is generated before zip extraction. The executed package root was confirmed by `status` as `C:\Users\13152\Dropbox\eDelphi\github-clean\build\windows-operator-portable\extracted-test`.

## Package Contents Summary

Top-level extracted package entries:

- `app`
- `LICENSE`
- `NOTICE`
- `package-manifest.json`
- `README.txt`
- `scripts`
- `server`
- `tools`

Directory summary:

- `app/dist`
- `app/dist/assets`
- `scripts/windows`
- `server/dist`
- `server/dist/auth`
- `server/dist/core`
- `server/dist/exports`
- `server/dist/middleware`
- `server/dist/routes`
- `server/dist/stores`
- `server/dist/studies`
- `tools`

The `server/dist/exports` directory is compiled export-route code, not generated export data.

## Excluded Sensitive Material Check Before Execution

| Check | Result | Notes |
| --- | --- | --- |
| No `.git` directory | PASS | No match in extracted package root. |
| No `.env` or `*.env` files | PASS | No match in extracted package root. |
| No secret/credential/key files by filename pattern | PASS | No `*secret*`, `*credential*`, `*.pem`, `*.key`, `*.pfx`, or `*.p12` files found. |
| No runtime database files | PASS | No `*.sqlite` or `*.db` files found. |
| No log files | PASS | No `*.log` files found. |
| No zip artifacts inside package root | PASS | No `*.zip` files found. |
| No backups | PASS | No package-root `backups` directory or backup files found. |
| No evidence artifacts | PASS | No package-root `evidence` directory found. |
| No runtime data directories | PASS | No package-root `db`, `audit`, `logs`, `backups`, or `evidence` directories found. |
| No package-root `node_modules` | PASS | No `node_modules` directory in extracted package root. |
| Provider credential content review | PASS WITH NOTE | Targeted scan found Twilio-compatible code guards only; no provider credential values or provider credential files were found. |

## Command-by-Command Evidence

| Step | Command | Result |
| --- | --- | --- |
| Baseline Git state | `git status --short --branch` | PASS: local `main` was fast-forwarded to GitHub `origin/main`, then working branch `codex/windows-extracted-zip-local-evidence` was created. |
| Baseline commit | `git log -1 --format='%H%n%s%n%ci'` | PASS: `cf6c0b742f10b67b614b683364c8132df0532584`, merge of PR #45. |
| Placeholder evidence review | Read `WINDOWS_OPERATOR_PORTABLE_PACKAGE_EXTRACTED_ZIP_EVIDENCE.md` | PASS: prior file recorded PowerShell unavailable / commands not run, so it did not close extracted-zip evidence. |
| Build package, sandboxed first attempt | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\build-operator-portable-package.ps1` | EXPECTED HARNESS FAIL: Vite/esbuild failed with `spawn EPERM` inside the sandbox before package creation. |
| Build package, local Windows rerun | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\build-operator-portable-package.ps1` | PASS outside sandbox; created package root, zip, and manifest listed above. |
| Clean extracted-test setup | Resolve output/extract roots, remove only checked `extracted-test`, run `Expand-Archive` | PASS: extracted zip into `build/windows-operator-portable/extracted-test`. |
| Initial extracted status | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 status` | PASS: `Not running.` |
| Start, sandboxed first attempt | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 start` | EXPECTED HARNESS FAIL: sandbox could not remove existing `%LOCALAPPDATA%` runtime `server-runtime\dist`. |
| Start, local Windows rerun | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 start` | PASS outside sandbox; subsequent status and health checks confirmed running backend/UI. |
| Status after start | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 status` | PASS: backend pid `38024` running, UI pid `50736` running; package root reported as extracted-test. |
| Backend health after start | `Invoke-RestMethod -Uri http://127.0.0.1:3001/health` | PASS: status `ok`, service `edelphi-server`, environment `production`. |
| UI HEAD after start | `Invoke-WebRequest -UseBasicParsing -Uri http://127.0.0.1:4173/ -Method Head` | PASS: HTTP `200 OK`. |
| Smoke | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 smoke` | PASS: `Smoke ok: http://127.0.0.1:3001/health`. |
| Backup | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 backup` | PASS: backup created at `C:\Users\13152\AppData\Local\DelphiCommons\windows-operator-portable-candidate\backups\backup-20260511-143759`. |
| Reset while running | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 reset` | PASS: refused as expected with `Stop prototype before reset.` |
| Restart | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 restart` | PASS outside sandbox; subsequent status and health checks confirmed relaunch. |
| Status after restart | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 status` | PASS: backend pid `37348` running, UI pid `63396` running. |
| Backend health after restart | `Invoke-RestMethod -Uri http://127.0.0.1:3001/health` | PASS: status `ok`, service `edelphi-server`, environment `production`. |
| UI HEAD after restart | `Invoke-WebRequest -UseBasicParsing -Uri http://127.0.0.1:4173/ -Method Head` | PASS: HTTP `200 OK`. |
| Stop | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 stop` | PASS: `Prototype stopped.` |
| Reset after stop | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 reset` | PASS: reset snapshot created at `C:\Users\13152\AppData\Local\DelphiCommons\windows-operator-portable-candidate\backups\reset-snapshot-20260511-143907`. |
| Final status | `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 status` | PASS: `Not running.` |
| Final port check | `Get-NetTCPConnection -LocalPort 3001,4173 -State Listen` | PASS: no listeners on `3001` or `4173`. |

## Pass/Fail/Skipped Table

| Check | Status | Notes |
| --- | --- | --- |
| Local Git baseline updated from GitHub `main` | PASS | `main` fast-forwarded to `origin/main` before branch/evidence work. |
| Previous extracted-zip evidence identified as environment-constrained | PASS | Placeholder recorded PowerShell unavailable and lifecycle not run. |
| Fresh package zip built on local Windows | PASS | Sandbox attempt failed with `spawn EPERM`; local Windows rerun passed. |
| Clean extracted zip directory separate from staging | PASS | Extracted to `build/windows-operator-portable/extracted-test`. |
| README exists | PASS | Present in extracted package root. |
| Manifest exists and parses as JSON | PASS | Present and parsed with `ConvertFrom-Json`. |
| Packaged launcher exists | PASS | `scripts/windows/portable-operator-candidate.ps1`. |
| Static UI server exists | PASS | `tools/static-file-server.mjs`. |
| Excluded sensitive material scan before lifecycle | PASS | No package-root secrets/runtime/log/backups/evidence/node_modules artifacts found. |
| Initial status | PASS | `Not running.` |
| Start | PASS | Start passed outside sandbox; backend/UI confirmed running. |
| Status after start | PASS | Backend/UI running with PIDs. |
| Backend health after start | PASS | `/health` returned `ok`. |
| UI HEAD after start | PASS | HTTP `200 OK`. |
| Smoke | PASS | Health smoke passed. |
| Backup | PASS | Backup created under `%LOCALAPPDATA%` runtime root. |
| Reset while running refuses | PASS | Refused with `Stop prototype before reset.` |
| Restart | PASS | Relaunched backend/UI. |
| Status after restart | PASS | Backend/UI running with new PIDs. |
| Backend health after restart | PASS | `/health` returned `ok`. |
| UI HEAD after restart | PASS | HTTP `200 OK`. |
| Stop | PASS | `Prototype stopped.` |
| Reset after stop | PASS | Reset snapshot created under runtime root. |
| Final status | PASS | `Not running.` |
| Final port cleanup | PASS | No listeners on `3001` or `4173`. |
| Excluded sensitive material scan after lifecycle | PASS | Package root remained clean. |
| Runtime data outside package root | PASS | Runtime data/dependencies observed under `%LOCALAPPDATA%`. |
| Second Windows machine or clean user profile | NOT RUN | Remains an open Phase 2 blocker. |

## Excluded Sensitive Material Check After Execution

| Check | Result | Notes |
| --- | --- | --- |
| No `.git` directory | PASS | No match in extracted package root. |
| No `.env` or `*.env` files | PASS | No match in extracted package root. |
| No secret/credential/key files by filename pattern | PASS | No `*secret*`, `*credential*`, `*.pem`, `*.key`, `*.pfx`, or `*.p12` files found. |
| No runtime database files | PASS | No `*.sqlite` or `*.db` files found in package root. |
| No log files | PASS | No `*.log` files found in package root. |
| No zip artifacts inside package root | PASS | No `*.zip` files found in package root. |
| No backups | PASS | No package-root `backups` directory or backup files found. |
| No evidence artifacts | PASS | No package-root `evidence` directory found. |
| No runtime data directories | PASS | No package-root `db`, `audit`, `logs`, `backups`, or `evidence` directories found. |
| No package-root `node_modules` | PASS | Runtime production dependencies were not installed into the package root. |

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

Observed runtime artifacts:

- Latest backup: `C:\Users\13152\AppData\Local\DelphiCommons\windows-operator-portable-candidate\backups\backup-20260511-143759`
- Latest reset snapshot: `C:\Users\13152\AppData\Local\DelphiCommons\windows-operator-portable-candidate\backups\reset-snapshot-20260511-143907`
- Runtime dependency check: `C:\Users\13152\AppData\Local\DelphiCommons\windows-operator-portable-candidate\server-runtime\node_modules\fastify\package.json` existed.

Interpretation: runtime data, logs, backups, evidence, and server production dependencies were placed under `%LOCALAPPDATA%\DelphiCommons\windows-operator-portable-candidate`, not inside the clean extracted package root.

## Dependency Posture

Current Stage 1 posture remains unchanged:

- local Node.js/npm are required on the Windows machine;
- portable Node runtime is not bundled;
- server production dependencies are installed under the runtime root on first run;
- the package remains a portable/internal prototype, not a standalone installer or signed distribution artifact.

## Limitations

- This is local Windows engineering evidence only.
- This evidence was collected on one Windows machine/user context only.
- A second Windows machine or clean Windows user profile check remains open.
- The package still requires local Node.js and npm.
- The package zip is not a standalone desktop application.
- No bundled portable Node runtime is included.
- No Tauri shell is implemented.
- No NSIS/MSI installer is implemented.
- No code signing, SmartScreen reputation, updater, or enterprise distribution path is implemented.
- No macOS package evidence is created by this run.
- No phone participant real-device evidence is created by this run.
- No real SMS provider delivery is implemented or approved.
- No PWA/service-worker behavior is enabled.
- No native iOS or Android app is implemented.
- No external AI connector is enabled.
- Human accessibility testing, security review, legal/IRB review, phone testing, SMS testing, and final human-testing binder evidence remain required later gates.

## Remaining Blockers

- Verify on a second Windows machine or clean Windows user profile.
- Decide whether the candidate will bundle a portable Node runtime or keep local Node/npm as a documented prerequisite.
- Record Windows signing/distribution limitations, including unsigned-package behavior if applicable.
- Preserve deferred status for Tauri, NSIS/MSI installer work, updater behavior, and platform support claims until separate evidence exists.
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
