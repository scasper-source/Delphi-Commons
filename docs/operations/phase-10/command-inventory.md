# Command Inventory

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

Status: COMPLETE for commands found in `app/package.json`, `server/package.json`, source routes, and existing QC scripts. Missing operational commands are marked MISSING or NOT FOUND.

## Root

| Command | Status | Source |
|---|---|---|
| Root package script | NOT FOUND | No root `package.json` found. |

## Frontend App

Run from `app/`.

| Command | Purpose | Source |
|---|---|---|
| `npm.cmd install` | Install dependencies | npm convention; package lock present |
| `npm.cmd run dev` | Vite dev server | `app/package.json` |
| `npm.cmd run dev -- --host 127.0.0.1 --port 5173` | Local frontend URL used by docs/QC | README/docs convention |
| `npm.cmd run build` | TypeScript build plus Vite build | `app/package.json` |
| `npm.cmd run lint` | ESLint | `app/package.json` |
| `npm.cmd test` | Node test runner for `tests/*.test.mjs` | `app/package.json` |
| `npm.cmd run security:audit` | npm audit high severity threshold | `app/package.json` |
| `npm.cmd run preview` | Vite preview | `app/package.json` |

## Backend Server

Run from `server/`.

| Command | Purpose | Source |
|---|---|---|
| `npm.cmd install` | Install dependencies | npm convention; package lock present |
| `npm.cmd run dev` | Build then run `node dist/index.js` | `server/package.json` |
| `npm.cmd run build` | TypeScript build | `server/package.json` |
| `npm.cmd test` | Build then run Node tests | `server/package.json` |
| `npm.cmd run security:audit` | npm audit high severity threshold | `server/package.json` |
| `npm.cmd start` | Run built server | `server/package.json` |

## Health and Admin API Checks

These are HTTP operations, not package scripts.

| Operation | Status | Source |
|---|---|---|
| `GET /health` | FOUND | `server/src/index.ts` |
| `GET /admin/storage-status` | FOUND | `server/src/routes/admin.ts` |
| `GET /admin/audit-integrity` | FOUND | `server/src/routes/admin.ts` |
| `GET /admin/data-integrity` | FOUND | `server/src/routes/admin.ts` |
| `GET /admin/backups` | FOUND | `server/src/routes/admin.ts` |
| `POST /admin/backups` | FOUND | `server/src/routes/admin.ts` |
| `POST /admin/backups/:backupId/restore` | FOUND | `server/src/routes/admin.ts` |
| `GET /admin/users` | FOUND | `server/src/routes/admin.ts` |
| `POST /admin/users` | FOUND | `server/src/routes/admin.ts` |
| `PATCH /admin/users/:userId` | FOUND | `server/src/routes/admin.ts` |

## Migration, Seed, Export, and Dry-Run Commands

| Command or operation | Status | Note |
|---|---|---|
| Standalone migration CLI | NOT FOUND | SQLite migrations run automatically when `getDatabase()` opens the database. |
| Standalone rollback CLI | NOT FOUND | Rollback procedure must rely on pre-migration backups until a dedicated command exists. |
| Standalone seed CLI | NOT FOUND | Demo users seed automatically outside production unless `EDELPHI_SEED_DEMO_USERS=false`. |
| Standalone export CLI | NOT FOUND | Exports are generated via report/export API routes and QC scripts. |
| `node docs\qc\full-mock-trial\run_full_mock_trial_local.mjs` | FOUND | Existing synthetic/local QC script; NOT RUN for Phase 10. |
| `node docs\qc\adverse-user-rehearsal\run_adverse_user_rehearsal_local.mjs` | FOUND | Existing synthetic/local QC script; NOT RUN for Phase 10. |

## Phase 10 Execution Status

No dry run, migration rehearsal, backup/restore rehearsal, incident drill, or staging road test was executed as part of preparing this documentation package.

