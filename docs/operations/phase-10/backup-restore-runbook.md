# Backup and Restore Runbook

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

Status: PARTIAL. Backup and restore functions and admin endpoints exist. Phase 10 backup/restore rehearsal: NOT RUN.

## Current Backup Surface

Source files:

- `server/src/core/backup.ts`
- `server/src/routes/admin.ts`

Admin endpoints:

- `GET /admin/backups`
- `POST /admin/backups`
- `POST /admin/backups/:backupId/restore`

Backup content currently includes:

- SQLite database copy.
- Audit log copy if present.
- `manifest.json` with backup ID, reason, file hashes, migration list, audit integrity result, and data integrity result.

## Categories

| Category | Status | Notes |
|---|---|---|
| Local/dev backup | PARTIAL | Endpoint and local filesystem copy exist. Phase 10 rehearsal NOT RUN. |
| Staging backup | PARTIAL | Same mechanism may apply if staging uses local filesystem paths. No staging road test was found. |
| Restore rehearsal | NOT RUN | No Phase 10 restore was executed. |
| Production-grade backup/restore | NOT READY | Off-host storage, retention, access controls, schedules, monitoring, and rehearsed restore evidence are missing. |

## Local/Dev Backup Procedure

1. Confirm environment is synthetic/local/dev/staging only.
2. Confirm no real participant data is present.
3. Confirm authorized role: Data Custodian, Security & Privacy Lead, Maintainer, or Admin.
4. Call `POST /admin/backups` with a reason such as `phase-10-local-dev-preflight`.
5. Record backup ID, timestamp, file paths, SHA-256 hashes, migration list, audit integrity, and data integrity.
6. Treat backup artifacts as sensitive. Do not commit them.

Phase 10 backup creation: NOT RUN.

## Restore Procedure

1. Stop user activity in the target environment.
2. Confirm the backup ID and manifest.
3. Preserve the current database/audit files if safe.
4. Call `POST /admin/backups/:backupId/restore`.
5. Verify `GET /health`.
6. Verify `GET /admin/audit-integrity`.
7. Verify `GET /admin/data-integrity`.
8. Verify at least one synthetic study, export package list, and audit event list as appropriate.
9. Record defects, operator, timestamp, and verification results.

Phase 10 restore rehearsal: NOT RUN.

## Production Limit

This runbook does not define production backup schedules, off-host storage, key management, disaster recovery RTO/RPO, legal hold, retention automation, or incident-grade chain of custody. Production backup/restore readiness is NOT READY.

