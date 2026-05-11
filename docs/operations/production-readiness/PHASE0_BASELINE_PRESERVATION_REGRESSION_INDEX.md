# Phase 0 Baseline Preservation Regression Index

Date basis: 2026-05-11.

Purpose: preserve current mock-trial and Phase 1 engineering/human-deployment evidence as a fixed regression baseline before laptop/phone human-testing-candidate work.

Scope boundary: this index is for controlled synthetic/mock-trial evidence preservation and planning continuity only.

## Non-claim boundary (strict)

This index does **not** claim:

- production readiness,
- pilot readiness,
- IRB approval,
- legal certification,
- security certification,
- accessibility certification,
- real human-subjects readiness.

Evidence linked here is suitable only as a regression baseline for controlled synthetic/mock-trial work and planning toward laptop/phone human testing.

## Preserved baseline evidence map

### A) Latest mock-trial artifacts and pointer files

- Full mock-trial pointer: `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-latest.json`
- Manual-browser mock-trial pointer: `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-latest.json`
- Latest full mock-trial artifact currently pointed to: `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-06T14-18-57-949Z.json`
- Latest manual-browser mock-trial artifact currently pointed to: `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T21-15-16-308Z.json`
- Mock-trial result and gate context: `docs/qc/full-mock-trial/LIVE_RUN_RESULTS.md`, `docs/qc/full-mock-trial/GO_NO_GO_FOR_CONTROLLED_MOCK_TRIAL.md`

### B) Mobile closeout evidence (320px / 390px / 414px)

- 320px: `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-320.png`
- 390px: `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-390.png`
- 414px: `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-414.png`
- Supporting runbook and interpretation: `docs/qc/full-mock-trial/WINDOWS_FOCUSED_MOBILE_EVIDENCE_RUNBOOK.md`

### C) Export privacy evidence

- Export privacy check: `docs/qc/full-mock-trial/EXPORT_PRIVACY_CHECK.md`
- Mock-trial release/gate interpretation: `docs/qc/full-mock-trial/GO_NO_GO_FOR_CONTROLLED_MOCK_TRIAL.md`

### D) Export provenance evidence

- Phase 1 export provenance executed evidence: `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_EXPORT_PROVENANCE_EVIDENCE.md`

### E) Restricted-warning interpretation for restricted/internal packages

Restricted-warning interpretation is preserved from the export privacy/gate documents:

- Warnings are acceptable only for explicitly restricted/internal packages (`audit-package`, `complete-archive`).
- Those restricted/internal packages are not for de-identified sharing.
- De-identified sharing decisions rely on governed package outputs and documented review controls.

Source anchors: `docs/qc/full-mock-trial/EXPORT_PRIVACY_CHECK.md`, `docs/qc/full-mock-trial/GO_NO_GO_FOR_CONTROLLED_MOCK_TRIAL.md`.

### F) Phase 1 auth/session/membership/role hardening evidence

- Work packet: `docs/operations/production-readiness/PHASE1_AUTH_SESSION_MEMBERSHIP_ROLE_REVIEW.md`
- Indexed in closeout: `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_EVIDENCE_INDEX.md`

### G) Phase 1 retention/deletion/Data Custodian evidence

- Workflow/work packet: `docs/operations/production-readiness/PHASE1_RETENTION_DELETION_DATA_CUSTODIAN_WORKFLOW.md`
- Executed evidence: `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_RETENTION_DELETION_EXECUTION_EVIDENCE.md`
- Human/deployment signoff gap binder: `docs/operations/production-readiness/phase1-human-deployment-closeout/DATA_CUSTODIAN_EXPORT_REVIEW_SIGNOFF.md`

### H) Phase 1 backup/restore rehearsal evidence

- Workflow/work packet: `docs/operations/production-readiness/PHASE1_BACKUP_RESTORE_MIGRATION_ROLLBACK_REHEARSAL_WORKFLOW.md`
- Executed evidence: `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_BACKUP_RESTORE_REHEARSAL_EXECUTED_EVIDENCE.md`
- Human/deployment rehearsal gap binder: `docs/operations/production-readiness/phase1-human-deployment-closeout/PRODUCTION_LIKE_BACKUP_RESTORE_RETENTION_REHEARSAL.md`

### I) Phase 1 incident workflow evidence

- Workflow/work packet: `docs/operations/production-readiness/PHASE1_INCIDENT_WORKFLOW.md`
- Executed evidence: `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_INCIDENT_DRILL_EVIDENCE.md`
- Deployment-connected gap binder: `docs/operations/production-readiness/phase1-human-deployment-closeout/DEPLOYMENT_CONNECTED_INCIDENT_DRILL_EVIDENCE.md`

### J) Phase 1 deployment-security evidence

- Checklist/work packet: `docs/operations/production-readiness/PHASE1_DEPLOYMENT_SECURITY_EVIDENCE_CHECKLIST.md`
- Executed evidence: `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_DEPLOYMENT_SECURITY_EXECUTED_EVIDENCE.md`
- Named deployment + independent signoff gaps: `docs/operations/production-readiness/phase1-human-deployment-closeout/NAMED_DEPLOYMENT_SECURITY_EVIDENCE.md`, `docs/operations/production-readiness/phase1-human-deployment-closeout/INDEPENDENT_SECURITY_HARDENING_SIGNOFF.md`

### K) Phase 1 human/deployment closeout binder and remaining gaps

- Binder summary: `docs/operations/production-readiness/phase1-human-deployment-closeout/PHASE1_HUMAN_DEPLOYMENT_CLOSEOUT_SUMMARY.md`
- P0 blocker closeout table: `docs/operations/production-readiness/phase1-human-deployment-closeout/PHASE1_P0_BLOCKER_CLOSEOUT_TABLE.md`

Preserved interpretation: binder remains gap-oriented and contains outstanding `NOT PROVIDED`, `NOT RUN`, `HUMAN_REQUIRED`, `DEPLOYMENT_REQUIRED`, and `SIGNOFF_REQUIRED` items.

## Phase 0 Exit Gate

- `mock_trial`: **GO WITH CONDITIONS**
- `human_testing_candidate`: **NOT YET**
- `controlled_pilot`: **NOT READY**
- `production_candidate`: **NOT READY**
- `public_open_source`: **NOT READY**
