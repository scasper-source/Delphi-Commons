# Windows Operator Candidate Prototype (Stage 1)

Status: **PROTOTYPE / INTERNAL HUMAN_TESTING_CANDIDATE PREP ONLY**.

Date basis: 2026-05-11.

This document covers Stage 1 from the Backend Packaging / Process Supervision ADR: a script-based Windows operator-run candidate with explicit process supervision behaviors. It is localhost-only by default and does not claim installer, signing, pilot, or production readiness.

## Script entrypoint

- `scripts/windows/operator-candidate.ps1`
- Commands: `start`, `stop`, `restart`, `status`, `backup`, `reset`, `smoke`.

## How to build and launch

From PowerShell in repo root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 start
```

`start` behavior:

- Builds frontend (`npm.cmd --prefix app run build` internally).
- Builds backend (`npm.cmd --prefix server run build` internally).
- Starts backend at `http://127.0.0.1:3001`.
- Starts frontend preview at `http://127.0.0.1:4173`.
- Waits for `/health` readiness before opening/printing operator UI URL.
- Writes startup events to local evidence logs.

## How to stop

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 stop
```

Stops tracked backend/UI processes, with forced kill fallback.

## How to restart

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 restart
```

## How to reset synthetic/local test data

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 reset
```

Safety behavior:

- Refuses reset while backend is running.
- Creates a reset snapshot under backups first.
- Performs explicit path-within-runtime checks before deletion.

## Backup/export behavior

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 backup
```

Creates a timestamped backup directory with a simple manifest and preserves exports data in runtime storage.

## Runtime data location

Runtime root is outside the source tree:

- `%LOCALAPPDATA%\DelphiCommons\windows-operator-candidate`

Subdirectories:

- `db`
- `audit`
- `exports`
- `backups`
- `logs`
- `evidence`
- `state`

## Logs and evidence location

- Startup/shutdown/operator event trail: `...\evidence\operator-events.log`
- Backend/stdout+stderr logs: `...\logs\backend-*.log`
- UI preview logs: `...\logs\ui-preview-*.log`

## Health/readiness check

- Backend readiness endpoint: `http://127.0.0.1:3001/health`
- Smoke helper:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 smoke
```

## Known limitations

- Prototype script assumes local Node/npm availability; no bundled portable Node runtime included yet.
- Prototype is localhost-only and does not provide LAN phone-testing mode.
- No Windows installer, signing, updater, or service install behavior.
- Process supervision is script-scoped and intended for internal candidate testing only.

## What this does not claim

This prototype does **not** claim production readiness, pilot readiness, real human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, or external AI readiness.

## Portable package prototype companion

- Windows portable package prototype note: [WINDOWS_OPERATOR_PORTABLE_PACKAGE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE.md).
- Package builder script: `scripts/windows/build-operator-portable-package.ps1`.
- Stage 1 package posture remains local Node/npm dependency (not standalone).

## Evidence closeout

- Windows candidate evidence closeout: [WINDOWS_OPERATOR_CANDIDATE_EVIDENCE_CLOSEOUT.md](./WINDOWS_OPERATOR_CANDIDATE_EVIDENCE_CLOSEOUT.md).
- Local Windows PowerShell supervisor evidence: [WINDOWS_OPERATOR_CANDIDATE_LOCAL_SUPERVISOR_EVIDENCE.md](./WINDOWS_OPERATOR_CANDIDATE_LOCAL_SUPERVISOR_EVIDENCE.md).
