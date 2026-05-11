# Windows Operator Candidate Evidence Closeout

- Status: **WINDOWS CANDIDATE PROTOTYPE EVIDENCE RECORDED**.
- Decision label: **NOT READY FOR HUMAN TESTING**.
- Date/time basis (UTC): **2026-05-11T16:52:02Z through 2026-05-11T16:53:40Z**.
- Commit hash: **db9d3fad35479c8d9493085056151f3f0217ba02**.
- Branch: **work**.

## Scope And Basis

This closeout records Stage 1 Windows downloadable/operator-run candidate prototype evidence as far as executable in the current environment. Evidence aligns to:

- `BACKEND_PACKAGING_PROCESS_SUPERVISION_ADR.md`
- `WINDOWS_OPERATOR_CANDIDATE_PROTOTYPE.md`
- `PHASE1_PRODUCT_SURFACE_LOCK.md`
- `PRODUCTION_READY_EDELPHI_PLATFORM.md`

Environment constraint: this host does not provide `pwsh`/Windows PowerShell, so `scripts/windows/operator-candidate.ps1` commands could not be executed directly.

## Command-by-command evidence

1. `date -u '+%Y-%m-%dT%H:%M:%SZ'` → `2026-05-11T16:52:02Z`
2. `git rev-parse HEAD` → `db9d3fad35479c8d9493085056151f3f0217ba02`
3. `git rev-parse --abbrev-ref HEAD` → `work`
4. `command -v pwsh || true` → no output (PowerShell unavailable)
5. `npm --prefix app run build` → pass
6. `npm --prefix server run build` → pass
7. `npm --prefix app test` → pass (28/28)
8. `npm --prefix server test` → pass (all suites passed; deployment verifier includes expected warnings/inconclusive audit branch covered by tests)
9. Linux-equivalent launch evidence (since PowerShell unavailable):
   - `HOST=127.0.0.1 PORT=3001 ... node server/dist/index.js` (background) → launched
   - `curl -sf http://127.0.0.1:3001/health` → `{"status":"ok","service":"edelphi-server","environment":"production"}`
   - `npm --prefix app run preview -- --host 127.0.0.1 --port 4173 --strictPort` (background) → launched
   - `curl -I -s http://127.0.0.1:4173/ | head -n 1` → `HTTP/1.1 200 OK`
10. Stop behavior evidence:
   - `kill <ui-pid> <backend-pid>` then `ps -p <pid>` checks → processes not running
11. Restart behavior evidence:
   - backend relaunched; `curl -sf /health` again returned status `ok`; then stopped successfully
12. Runtime/log artifact path recorded:
   - `docs/operations/production-readiness/artifacts/windows-candidate-evidence-20260511/`

## Required smoke evidence table

| Item | Result | Evidence note |
| --- | --- | --- |
| build frontend | PASS | `npm --prefix app run build` completed successfully. |
| build backend | PASS | `npm --prefix server run build` completed successfully. |
| run tests | PASS | `npm --prefix app test` and `npm --prefix server test` passed. |
| launch backend | PASS (environment-adapted) | Launched via Linux shell equivalent to script backend launch. |
| health check passes | PASS | `/health` returned status `ok` before and after restart. |
| operator UI opens or URL is available | PASS (URL available) | `http://127.0.0.1:4173` responded `HTTP/1.1 200 OK`. |
| stop works | PASS (environment-adapted) | Manual stop via signal succeeded; no running PIDs afterward. |
| restart works | PASS (environment-adapted) | Backend restart and health recheck passed. |
| reset works or is explicitly not implemented | SKIPPED (not executed) | Implemented in PowerShell script; not runnable here due missing PowerShell. |
| backup works or is explicitly not implemented | SKIPPED (not executed) | Implemented in PowerShell script; not runnable here due missing PowerShell. |
| export works or is explicitly not implemented | SKIPPED (not executed) | No explicit export command in Stage 1 script; export directory behavior only. |
| runtime data path documented | PASS (documented) | Runtime root policy documented as `%LOCALAPPDATA%\DelphiCommons\windows-operator-candidate`. |
| logs documented | PASS (documented + artifact logs) | Windows path documented; local run logs captured in artifact directory. |
| no secrets committed | PASS (spot-check) | No new secret material added in this closeout work. |
| no real participant data used | PASS | Synthetic/local test execution only. |

## Artifact and log paths

- Evidence directory (this run): `docs/operations/production-readiness/artifacts/windows-candidate-evidence-20260511/`
- Files captured:
  - `backend.log`, `backend-restart.log`
  - `ui-preview.log`
  - `health.json`, `health-restart.json`
  - `ui-head.txt`
  - `backend.pid`, `ui.pid`, `backend-restart.pid`
  - post-stop PID checks: `backend-post-stop.txt`, `ui-post-stop.txt`, `backend-restart-post-stop.txt`

## Known limitations / failures / skipped items

1. **Could not run `scripts/windows/operator-candidate.ps1` directly** because `pwsh` is unavailable in this environment.
2. **Windows-native behaviors not directly evidenced here**: script-managed lock behavior, PowerShell `start/stop/restart/reset/backup/smoke` command pathways, and browser auto-open step.
3. **Reset/backup/export smoke commands not directly executed through the Windows operator script** in this environment.
4. Remote sync with `main` could not be verified because no accessible `origin` remote is configured in this environment.

## Remaining blockers to decision upgrade

- Run this same closeout on an actual Windows environment with PowerShell and execute the script commands directly (`start`, `smoke`, `status`, `backup`, `reset`, `stop`, `restart`) with captured logs.
- Produce explicit Windows evidence for reset snapshot and backup manifest outcomes from the script paths.
- Produce explicit Windows evidence for runtime path materialization under `%LOCALAPPDATA%`.

## Explicit non-claims

This closeout does **not** claim production readiness, pilot readiness, real human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, or external AI readiness.
