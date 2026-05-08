# Phase 1 Backup/Restore/Migration/Rollback Rehearsal Executed Evidence

Date (UTC): 2026-05-08
Scope: Local automated synthetic-data rehearsal only.

## Boundary and non-claim
This evidence demonstrates a local repository automation rehearsal. It does **not** claim production-like deployment rehearsal completion, production readiness, or human-subjects readiness.

## Executed command
- `npm --prefix server run test:backup-restore-rehearsal`

## Coverage proven by the rehearsal
- Creates representative synthetic study data.
- Creates a backup via admin API and records manifest integrity checks.
- Asserts the post-backup mutation succeeds and changes persisted state before restore.
- Restores the backup into the same disposable runtime target after verified post-backup mutation.
- Verifies post-restore integrity for study, participant, role-assignment, deletion-request, audit-event, and export-manifest domains.
- Exercises migration behavior through clean runtime bootstrap (`schema_migrations` populated and preserved across restore).
- Exercises rollback behavior through backup-restore rollback path (current supported rollback approach; no standalone migration rollback CLI).

## Result
- Local automated rehearsal: PASS.
- Production-like environment rehearsal: NOT EXECUTED in this run.
