# Non-Production Deployment Guide

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

Status: PARTIAL. Local development commands are documented. No provider-specific staging deployment, production deployment, monitoring, TLS, or secret-management procedure was found in the repository.

## Scope

Use this guide only for local, development, or controlled staging mock-trial environments. Do not use this guide for production or real human-subjects research.

## Existing Local Commands

Backend:

```powershell
cd server
npm.cmd install
npm.cmd run build
npm.cmd start
```

Frontend:

```powershell
cd app
npm.cmd install
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Development server shortcut:

```powershell
cd server
npm.cmd run dev
```

Health check:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3001/health
```

Expected local health shape:

```json
{"status":"ok","service":"edelphi-server","environment":"development"}
```

## Non-Production Preflight

1. Confirm the worktree contains no real participant data, secrets, production credentials, or real study exports.
2. Confirm `server/data/`, `server/audit/`, and `server/backups/` are treated as sensitive local runtime artifacts.
3. Run the relevant commands in [command inventory](./command-inventory.md).
4. Confirm backend health reports `development` or an explicitly controlled staging setting.
5. Confirm the frontend visibly communicates mock-trial/non-production use before broader staging road tests. If no visible staging/mock banner is present in the target environment, record that as a defect or condition.

## Staging Banner / Mock-Trial Warning Requirement

Any controlled staging environment must display or otherwise make obvious that it is not production and must not use real participant data unless separate approvals exist. Absence of a visible warning is NOT RUN for this Phase 10 package and should be verified during a future staging road test.

## AI Boundary

AI suggestions are non-binding, must be labeled as suggestions, require human acceptance/edit/reject, and must not steer participants toward consensus. Do not configure live external AI for Phase 10 dry runs unless a separate safe synthetic-only test plan explicitly authorizes it.

## Not Included

- Cloud provider deployment: NOT FOUND.
- TLS/reverse proxy setup: NOT FOUND.
- Production secret store: NOT FOUND.
- Production monitoring/alerting: NOT FOUND.
- Production backup target: NOT FOUND.
- Production retention automation: NOT READY.

