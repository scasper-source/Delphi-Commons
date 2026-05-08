# Phase 1 Evidence Index

- Run date/time (UTC): 2026-05-07T20:18:45Z
- Branch: `codex/phase1-evidence-closeout`
- Base commit at run start: `487c18b`

## Commands run in this evidence collection
- `git checkout main && git pull origin main` -> **FAILED** (`main` branch missing locally; no `origin` remote configured).
- `git checkout -b codex/phase1-evidence-closeout` -> **PASS**.
- `npm run build` (in `server/`) -> **PASS**.
- `npm test` (in `server/`) -> **PASS**.
- `node ../scripts/run-tests.mjs "tests/authPhase1Hardening.test.mjs"` -> **PASS**.
- `node ../scripts/run-tests.mjs "tests/deletionRequestCustodianWorkflow.test.mjs"` -> **PASS**.
- `npm run security:audit` -> **FAIL** (`npm audit` 403 from advisory endpoint).

## Existing evidence reused
- `docs/operations/production-readiness/PHASE1_AUTH_SESSION_MEMBERSHIP_ROLE_REVIEW.md`
- `docs/operations/production-readiness/PHASE1_DEPLOYMENT_SECURITY_EVIDENCE_CHECKLIST.md`
- `docs/operations/production-readiness/PHASE1_RETENTION_DELETION_DATA_CUSTODIAN_WORKFLOW.md`
- `docs/operations/production-readiness/PHASE1_BACKUP_RESTORE_MIGRATION_ROLLBACK_REHEARSAL_WORKFLOW.md`
- `docs/operations/production-readiness/PHASE1_INCIDENT_WORKFLOW.md`
- `docs/operations/production-readiness/phase1-accessibility-closeout/PHASE1_ACCESSIBILITY_CLOSEOUT_PACKAGE.md`
- `docs/operations/production-readiness/phase1-pilot-dry-run/PHASE1_HUMAN_OBSERVED_PILOT_DRY_RUN_PACKAGE.md`
- `documents/compliance/human-subjects-readiness/control-matrix.md`
- `documents/compliance/human-subjects-readiness/release-blockers.md`
- `documents/compliance/human-subjects-readiness/test-evidence-checklist.md`

## Evidence newly generated in this run
- `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_EVIDENCE_CLOSEOUT_SUMMARY.md`
- `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_EVIDENCE_INDEX.md`
- `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_TEST_RUN_RESULTS.md`
- `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_SECURITY_DEPLOYMENT_EVIDENCE.md`
- `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_BACKUP_RESTORE_REHEARSAL_EVIDENCE.md`
- `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_INCIDENT_DRILL_EVIDENCE.md`
- `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_HUMAN_OBSERVED_DRY_RUN_EVIDENCE.md`
- `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_ACCESSIBILITY_CLOSEOUT_EVIDENCE.md`

## Additional external collaborator evidence
- `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_EXTERNAL_COLLABORATOR_BUILD_START_VALIDATION.md` - external collaborator reported successful client/server build and start, with interface loaded successfully. This is build/start smoke evidence only; business-logic and workflow validation remain pending.

## Evidence still pending
- Human-observed dry-run execution package artifacts (operator/observer/screenshots/defects/release decision).
- Manual accessibility evidence (keyboard, NVDA/VoiceOver, mobile real-device, checklists, defect retest).
- Backup/restore/migration/rollback rehearsal artifacts in named environment.
- Deployment-specific security hardening and live incident notification integration evidence.
- External institutional/legal/IRB/security governance approvals.
