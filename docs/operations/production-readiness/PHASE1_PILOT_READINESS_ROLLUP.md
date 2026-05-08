# Phase 1 Pilot-Readiness Rollup

Date: 2026-05-07  
Scope: Phase 1 pilot-readiness assessment using the Human Subjects Readiness control matrix, release blockers, and completed Phase 1 work packets.

## Decision status

**Pilot readiness is NOT achieved.**

Per release rule, pilot readiness cannot be marked achieved while any P0 blocker remains open unless each blocker is formally accepted by the required owner role(s) with linked evidence and rationale. As of this rollup, open P0 blockers remain and no complete formal acceptance package is linked for all open items.

## Source set used

### Baseline matrix and blocker sources
- `documents/compliance/human-subjects-readiness/control-matrix.md`
- `documents/compliance/human-subjects-readiness/release-blockers.md`
- `documents/compliance/human-subjects-readiness/HUMAN_SUBJECTS_READINESS.md`

### Phase 1 work packets reviewed
- `docs/operations/production-readiness/PHASE1_AUTH_SESSION_MEMBERSHIP_ROLE_REVIEW.md`
- `docs/operations/production-readiness/PHASE1_RETENTION_DELETION_DATA_CUSTODIAN_WORKFLOW.md`
- `docs/operations/production-readiness/PHASE1_BACKUP_RESTORE_MIGRATION_ROLLBACK_REHEARSAL_WORKFLOW.md`
- `docs/operations/production-readiness/PHASE1_INCIDENT_WORKFLOW.md`
- `docs/operations/production-readiness/PHASE1_DEPLOYMENT_SECURITY_EVIDENCE_CHECKLIST.md`
- `docs/operations/production-readiness/phase1-accessibility-closeout/PHASE1_ACCESSIBILITY_CLOSEOUT_PACKAGE.md`
- `docs/operations/production-readiness/phase1-pilot-dry-run/PHASE1_HUMAN_OBSERVED_PILOT_DRY_RUN_PACKAGE.md`

---

## 1) Completed evidence (implementation + documented evidence present)

These areas have meaningful implementation evidence and work-packet confirmation, but this section does **not** imply overall pilot readiness.

- **Session-required auth hardening and membership role-boundary enforcement evidence exists** (including dedicated focused test coverage and explicit boundary statements).  
  Evidence links:
  - `server/tests/authPhase1Hardening.test.mjs`
  - `server/src/middleware/auth.ts`
  - `docs/operations/production-readiness/PHASE1_AUTH_SESSION_MEMBERSHIP_ROLE_REVIEW.md`

- **Data Custodian decision-gate workflow for deletion-request final states is documented and tested** (final decision statuses require `data_custodian`; non-custodian finalization is blocked).  
  Evidence links:
  - `server/tests/deletionRequestCustodianWorkflow.test.mjs`
  - `server/src/routes/participants.ts`
  - `server/src/stores/deletionRequestStore.ts`
  - `docs/operations/production-readiness/PHASE1_RETENTION_DELETION_DATA_CUSTODIAN_WORKFLOW.md`

- **Backup/restore foundations and rehearsal checklist structure are in place**, including explicit restore-integrity checkpoints and limitation disclosure.  
  Evidence links:
  - `server/src/core/backup.ts`
  - `server/src/routes/admin.ts`
  - `server/tests/roadtest.test.mjs`
  - `docs/operations/production-readiness/PHASE1_BACKUP_RESTORE_MIGRATION_ROLLBACK_REHEARSAL_WORKFLOW.md`

- **Pilot dry-run and accessibility closeout package structures exist** with required artifact templates and non-claim boundaries.  
  Evidence links:
  - `docs/operations/production-readiness/phase1-pilot-dry-run/PHASE1_HUMAN_OBSERVED_PILOT_DRY_RUN_PACKAGE.md`
  - `docs/operations/production-readiness/phase1-accessibility-closeout/PHASE1_ACCESSIBILITY_CLOSEOUT_PACKAGE.md`

- **External collaborator build/start smoke validation exists** for client and server startup outside the main local automation context. The collaborator also identified business-logic and workflow validation as the next step.
  Evidence links:
  - `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_EXTERNAL_COLLABORATOR_BUILD_START_VALIDATION.md`

---

## 2) Partial evidence (implemented foundations, launch-grade evidence incomplete)

The control matrix and work packets indicate meaningful progress but incomplete closure evidence for pilot claim.

- **Security deployment evidence remains partial** (missing environment-bound TLS/proxy proofs, secret inventory/rotation artifacts, CSRF/CORS deployment smoke artifacts, dependency triage package, and monitoring/alert artifacts).  
  Sources:
  - `documents/compliance/human-subjects-readiness/control-matrix.md` (HSR-018)
  - `docs/operations/production-readiness/PHASE1_DEPLOYMENT_SECURITY_EVIDENCE_CHECKLIST.md`

- **Retention/deletion operations remain partial at execution layer** (review workflow exists, but scheduled retention execution, deletion execution ledgering, and production-like proof are still open).  
  Sources:
  - `documents/compliance/human-subjects-readiness/control-matrix.md` (HSR-004)
  - `docs/operations/production-readiness/PHASE1_RETENTION_DELETION_DATA_CUSTODIAN_WORKFLOW.md`

- **Accessibility evidence remains partial** (manual keyboard/screen-reader/real-device entries currently marked NOT RUN in package baseline).  
  Sources:
  - `documents/compliance/human-subjects-readiness/control-matrix.md` (HSR-017)
  - `docs/operations/production-readiness/phase1-accessibility-closeout/PHASE1_ACCESSIBILITY_CLOSEOUT_PACKAGE.md`

- **Incident readiness remains partial/not ready operationally** (workflow guidance exists, but drill artifact and dedicated incident event implementation evidence are not complete).  
  Sources:
  - `documents/compliance/human-subjects-readiness/control-matrix.md` (HSR-020)
  - `docs/operations/production-readiness/PHASE1_INCIDENT_WORKFLOW.md`

- **Human-observed full dry-run evidence package is structurally defined but not fully completed in this rollup** (templates present; completed run artifacts must be attached and linked).  
  Sources:
  - `documents/compliance/human-subjects-readiness/control-matrix.md` (HSR-025)
  - `docs/operations/production-readiness/phase1-pilot-dry-run/PHASE1_HUMAN_OBSERVED_PILOT_DRY_RUN_PACKAGE.md`

---

## 3) Open P0 blockers (must close or be formally accepted by required roles)

From `release-blockers.md`:

1. **HSB-P0-001** — Production security deployment evidence not launch-grade (Owner: Security & Privacy Lead).
2. **HSB-P0-002** — Retention automation and production backup/restore operations incomplete (Owner: Data Custodian).
3. **HSB-P0-003** — Human WCAG 2.2 AA accessibility evidence incomplete (Owner: Study Owner / Accessibility Reviewer).
4. **HSB-P0-004** — Independent security hardening evidence incomplete (Owner: Security & Privacy Lead).
5. **HSB-P0-005** — Incident response workflow/runbook and drill evidence incomplete (Owner: Security & Privacy Lead).
6. **HSB-P0-006** — Anonymized dataset/audit/provenance package completeness insufficient (Owner: Data Custodian).
7. **HSB-P0-007** — Full end-to-end dry-run evidence incomplete (Owner: Study Owner).

**Blocking interpretation for this rollup:** all seven P0 blockers remain open for pilot claim purposes.

---

## 4) External review / approval requirements

The following approvals/reviews are required before any real human-subjects pilot claim:

- **Security & Privacy Lead**: formal signoff on deployment security evidence, ASVS checklist coverage, residual risk acceptance, and incident readiness evidence.
- **Data Custodian**: formal signoff on retention/deletion execution controls, backup/restore operations evidence, and de-identification/redaction package controls.
- **Study Owner + Accessibility Reviewer**: formal signoff on manual accessibility evidence (keyboard, NVDA/VoiceOver, real-device active-task flows), including any accepted mitigations.
- **Study Owner + Ethics & Methods Steward**: formal review for participant-rights-critical controls and release-blocker closure/acceptance changes as required by matrix maintenance rules.
- **Institutional/external governance processes (as applicable)**: IRB/ethics, legal, and institutional privacy/security reviews remain outside this engineering rollup and must be completed separately where required.

---

## 5) Next recommended implementation PRs

Prioritized to target P0 closure path:

1. **PR-A11Y-P0**: execute and attach full manual accessibility evidence pack (keyboard, NVDA/VoiceOver, mobile real-device for active consent and Round 1/Round 2 tasks), including defect remediation links.
2. **PR-SEC-P0-DEPLOY**: add deployment-bound security evidence bundle (secret inventory/rotation, TLS/proxy validation, CORS/CSRF integration smoke, security header contract capture, dependency triage artifacts).
3. **PR-RET-P0-EXEC**: implement retention policy executor + deletion execution ledger + post-decision export exclusion verification tests.
4. **PR-INC-P0**: implement incident records/events, pause-study control model, and at least one completed incident drill artifact with recovery evidence.
5. **PR-EXPORT-P0**: close anonymized dataset/audit/provenance package gaps with reviewer-facing completeness checks and tests proving identity-response mapping exclusion.
6. **PR-DRYRUN-P0**: complete a fully human-observed end-to-end dry-run evidence binder with linked screenshots/transcripts/decision record and defect disposition.

---

## 6) Explicit non-claims

This rollup is a readiness status summary and evidence organizer only. It does **not** claim:

- pilot readiness achieved,
- production readiness achieved,
- human-subjects readiness achieved,
- legal approval,
- IRB/ethics-board approval,
- institutional security/privacy certification,
- regulatory certification.

---

## 7) Readiness gate rule (explicit)

Do **not** mark Phase 1 pilot readiness achieved unless:

1. every P0 blocker is either **closed with linked evidence artifacts** **or** formally accepted by the required owner roles with dated rationale, and
2. the rollup document links the supporting evidence artifacts for each closed/accepted item.

Current state against this gate: **NOT MET**.


## 2026-05-08 retention/deletion execution update
- Added data-custodian-only deletion execution endpoint to move approved requests to Completed and apply participant suppression markers for future exports.
- Added audit action `participant.deletion_request.execute` and test coverage for unauthorized execution blocking and execution ledger evidence.
- This update materially reduces HSB-P0-002, but **does not claim production readiness or human-subjects readiness**. A human-observed production deployment/restore rehearsal remains required before closure.


## 2026-05-08 backup/restore rehearsal execution update
- Local automated rehearsal evidence added and executed via `npm --prefix server run test:backup-restore-rehearsal`.
- Evidence artifact: `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_BACKUP_RESTORE_REHEARSAL_EXECUTED_EVIDENCE.md`.
- This improves HSB-P0-002 evidence quality for local automation but does **not** satisfy production-like deployment rehearsal requirements by itself.

## 2026-05-08 backup/restore rehearsal evidence refinement
- Added and executed focused local rehearsal suite: `server/tests/backupRestoreRehearsal.test.mjs` via `npm --prefix server run test:backup-restore-rehearsal`.
- Coverage explicitly includes study, participant, role-assignment, deletion-request, audit, export-manifest, migration-state, and restore-rollback-path checks in disposable runtime.
- P0 blocker HSB-P0-002 remains OPEN pending production-like, operator-observed deployment rehearsal evidence.

