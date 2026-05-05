# Database Migration Procedure

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

Status: PARTIAL. SQLite schema migrations exist in `server/src/core/database.ts` and run automatically when the server opens the database. No standalone migration or rollback command was found. Phase 10 migration rehearsal: NOT RUN.

## Current Architecture

- Database driver: SQLite via `node:sqlite`.
- Default database path: `server/data/edelphi.sqlite`.
- Override path: `EDELPHI_DATABASE_PATH`.
- Migrations table: `schema_migrations`.
- Migration execution: automatic inside `getDatabase()`.
- Storage status endpoint: `GET /admin/storage-status`.

## Preflight

1. Confirm this is local/dev/staging synthetic-only work.
2. Confirm no real participant data or sensitive institutional data is present.
3. Record commit hash, branch, date/time, operator, `NODE_ENV`, and database path.
4. Stop active test participants from using the environment.
5. Create a backup before opening a changed server build against existing data.
6. Confirm `EDELPHI_DATA_DIR`, `EDELPHI_AUDIT_DIR`, `EDELPHI_BACKUP_DIR`, and `EDELPHI_DATABASE_PATH` if set.

## Backup Before Migration

Use the backup runbook before applying a server build that may introduce new migrations:

- [Backup and restore runbook](./backup-restore-runbook.md)
- `POST /admin/backups` if the server is healthy and admin access is available.
- File-system backup of the SQLite database and audit log only in controlled local/dev/staging environments.

Phase 10 backup-before-migration rehearsal: NOT RUN.

## Migration Execution

There is no separate migration command. Migrations run when the server initializes the database:

```powershell
cd server
npm.cmd run build
npm.cmd start
```

Then verify:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:3001/health
```

For storage/migration status, call `GET /admin/storage-status` as an authorized role.

Phase 10 migration execution rehearsal: NOT RUN.

## Verification

Verify:

- `GET /health` returns a non-production environment for local/dev/staging.
- `GET /admin/storage-status` reports SQLite storage, migration count, WAL journal mode, and foreign keys enabled.
- `GET /admin/audit-integrity` reports audit integrity.
- `GET /admin/data-integrity` reports data integrity.
- Existing synthetic study data, if intentionally retained, is still readable.
- Export packages remain classified and privacy-safe.

Phase 10 verification rehearsal: NOT RUN.

## Rollback Notes

No standalone rollback command was found. For local/dev/staging synthetic data:

1. Stop the server.
2. Preserve the failed database and audit log for investigation if safe.
3. Restore from the pre-migration backup.
4. Start the server.
5. Verify health, storage status, audit integrity, and data integrity.
6. Record the incident/defect and do not reuse corrupted artifacts as readiness evidence.

Rollback rehearsal: NOT RUN.

## Production Caveat

Production-grade migrations require a dedicated deployment plan, restore rehearsal, change window, rollback plan, monitoring, secrets management, and responsible operator signoff. Production-grade migration readiness is NOT READY.

