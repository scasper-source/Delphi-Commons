# Phase 1 Backup/Restore/Migration/Rollback Rehearsal Workflow (`mock_trial` track)

Date: 2026-05-07.

## Boundary

This workflow is for controlled synthetic or non-production-like engineering rehearsal only. It does **not** claim production readiness, security certification, or human-subjects readiness.

## Existing foundation reused

- Backup/restore engine and manifest hashing: `server/src/core/backup.ts`.
- Database migrations run on database open: `server/src/core/database.ts`.
- Admin endpoints for storage/audit/backup/restore: `server/src/routes/admin.ts`.
- Existing synthetic rehearsal evidence in road test (`/admin/backups` create + restore + integrity checks): `server/tests/roadtest.test.mjs`.
- Phase 10 runbooks:
  - `docs/operations/phase-10/backup-restore-runbook.md`
  - `docs/operations/phase-10/database-migration-procedure.md`
  - `docs/operations/phase-10/PHASE_10_REHEARSAL_RESULTS.md`

## A) Production-like backup checklist (rehearsal)

1. Record runtime context before operations:
   - commit hash,
   - branch,
   - environment/profile label,
   - data/audit/backup paths,
   - operator role.
2. Verify baseline health and storage metadata:
   - `GET /health`
   - `GET /admin/storage-status`
   - `GET /admin/audit-integrity`
3. Create backup via admin endpoint:
   - `POST /admin/backups` with explicit reason label.
4. Capture and retain backup manifest fields:
   - backup ID,
   - file hashes,
   - migration list,
   - audit-integrity result,
   - data-integrity result.
5. Mark artifact sensitivity:
   - backup output treated as restricted/internal,
   - never committed to repo.

## B) Restore rehearsal checklist

1. Confirm target backup manifest exists and matches expected commit window.
2. Execute restore:
   - `POST /admin/backups/:backupId/restore`.
3. Post-restore verification (minimum):
   - `GET /health` is healthy,
   - `GET /admin/storage-status` returns expected migration count,
   - `GET /admin/audit-integrity` returns OK,
   - data-integrity check remains OK.
4. Regression smoke after restore:
   - auth/session route check,
   - one study read/list operation,
   - export listing for restored version scope.

## C) Migration rehearsal from empty database

1. Use disposable empty runtime paths (`EDELPHI_DATA_DIR`, `EDELPHI_AUDIT_DIR`, `EDELPHI_BACKUP_DIR`).
2. Start server build against empty DB path.
3. Confirm migration bootstrap occurred:
   - `GET /admin/storage-status` indicates migration entries present.
4. Execute minimal lifecycle smoke and create a backup artifact.
5. Record resulting migration count and schema state in artifact template.

## D) Migration rehearsal from previous-release database

1. Start from a preserved backup/snapshot representing prior release schema.
2. Create pre-upgrade backup (`POST /admin/backups`).
3. Deploy newer build; allow automatic migration-on-open.
4. Verify:
   - storage/migration count,
   - audit integrity,
   - data integrity,
   - core workflow read/write smoke.
5. Create post-migration backup and compare manifests.

## E) Rollback expectations and limitations (current state)

- No standalone migration rollback CLI is currently implemented.
- Expected rollback path is **restore from pre-migration backup**.
- Rollback limitations must be documented per rehearsal:
  - potential data loss window between pre-upgrade backup and rollback point,
  - schema-downgrade automation unavailable,
  - operator/manual sequencing required.

## F) Post-restore audit-integrity verification checklist

Required pass conditions:
- `GET /admin/audit-integrity` => `ok: true`.
- backup manifest integrity metadata remains consistent.
- no sequence/hash break in audit chain verification output.
- restore result records data-integrity OK.

If any integrity check fails:
- halt release-track progression,
- preserve failing artifacts,
- open blocker with severity and owner,
- rerun only after root-cause remediation.

## G) Known gaps (explicit)

- No production-grade off-host backup policy evidence in this checklist.
- No standalone migration/rollback CLI.
- No production-like DR RTO/RPO drill evidence.
- No signed operator approval package attached by default.

## H) Artifact template

Use this template for each rehearsal run:

```markdown
# Backup/Restore/Migration/Rollback Rehearsal Artifact

- Date/time (UTC):
- Commit hash:
- Branch:
- Environment label:
- Runtime paths (sanitized):
- Operator role:

## Commands run
- command 1
- command 2

## Backup result
- Backup ID:
- Manifest path:
- Migration list summary:
- Audit integrity in manifest:
- Data integrity in manifest:

## Restore result
- Restore command/result:
- Post-restore health:
- Post-restore storage status:
- Post-restore audit integrity:
- Post-restore data integrity:

## Migration checks
- Empty-db migration result:
- Prior-release migration result:

## Rollback outcome/limitations
- Rollback method used:
- Limitations observed:

## Residual risks
- Risk 1:
- Risk 2:

## Non-claims
- No production readiness claim.
- No human-subjects readiness claim.
- No security/legal/regulatory certification claim.
```


## I) Local automation command (executed)

- Local rehearsal command: `npm --prefix server run test:backup-restore-rehearsal`
- This command executes a synthetic end-to-end setup, creates a backup, restores from that backup, and asserts post-restore count parity for studies, participants, study assignments, deletion requests, audit events, and export manifests.
- Migration/rollback note: migrations are auto-applied at open; rollback remains backup-restore based (no standalone rollback CLI).

## 2026-05-08 local automation durability update
- Added focused durable rehearsal test: `server/tests/backupRestoreRehearsal.test.mjs`.
- Local command remains: `npm --prefix server run test:backup-restore-rehearsal`.
- This is explicitly local/disposable-runtime automation evidence and is not a production-like deployment rehearsal claim.

