# Phase 1 Backup/Restore/Migration/Rollback Rehearsal Executed Evidence

Date (UTC): 2026-05-08
Scope: Local automated synthetic-data rehearsal only.

## Boundary and non-claim
This evidence demonstrates a local repository automation rehearsal. It does **not** claim production-like deployment rehearsal completion, production readiness, or human-subjects readiness.

## Executed command
- `npm --prefix server run test:backup-restore-rehearsal`

## Coverage proven by the rehearsal
- Representative study flow data created by the road test prior to backup.
- Backup created via admin API and validated as integrity-OK.
- Restore executed from generated backup ID into clean runtime target.
- Post-restore integrity verified for:
  - studies,
  - participants,
  - study role assignments,
  - deletion requests,
  - audit events,
  - export manifests.
- Migration behavior exercised as automatic migration-on-open in disposable runtime.
- Rollback behavior exercised via restore-path (documented current method; no standalone rollback CLI exists).

## Result
- Local automated rehearsal: PASS.
- Production-like environment rehearsal: NOT EXECUTED in this run.
