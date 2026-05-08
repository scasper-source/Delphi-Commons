# Human Subjects Release Blockers

**Project:** Delphi Commons
**Last updated:** 2026-05-02

This file tracks blockers that must be resolved before using Delphi Commons for a real human-subjects study. Blockers are intentionally strict. A blocker can be downgraded only with documented rationale and appropriate human review.

## Priority Definitions

- **P0:** Blocks any real human-subjects launch.
- **P1:** Blocks public/broader launch, but may not block a tightly controlled internal dry run with no real participants.
- **P2:** Should be resolved before maturity/public release but does not block a supervised pilot if risk is accepted.

## P0 Blockers

| Blocker ID | Related controls | Blocker | Why it blocks launch | Exit criteria | Owner role |
|---|---|---|---|---|---|
| HSB-P0-001 | HSR-018 | Production security deployment evidence is not yet launch-grade. | Phase 8 added secure cookie sessions, CSRF checks, rate limits, strict CORS/security headers, and invitation-token hardening, but human-subjects launch still requires deployment-specific evidence for TLS, secrets, monitoring, and production configuration. | Session/security design approved; dependency scan and ASVS checklist complete; deployment docs show session-required mode, TLS/reverse-proxy config, secret management, and residual risks accepted by Security & Privacy Lead. | Security & Privacy Lead |
| HSB-P0-002 | HSR-004, HSR-019 | Retention automation and production backup/restore operations are incomplete. | The app now has deletion-review and backup/restore foundations, but real studies require retention execution rules, operator runbooks, off-host backup policy, and rehearsed production restore evidence. | Retention policy enforcement, deletion execution/restriction rules, backup/restore runbook, off-host backup policy, and production-like restore rehearsal evidence exist. | Data Custodian |
| HSB-P0-003 | HSR-017 | Human WCAG 2.2 AA accessibility evidence is incomplete. | Phase 9 added automated/browser evidence, screenshots, focus/contrast checks, and copy review, but participants must still be able to complete active consent and round tasks with real assistive technologies. | Human NVDA/VoiceOver audit completed; active Round 1/Round 2 participant mobile evidence captured; P0/P1 accessibility defects resolved or documented with approved mitigation. | Study Owner / Accessibility Reviewer |
| HSB-P0-004 | HSR-018 | Independent security hardening evidence is incomplete. | Sensitive participant data requires not only built-in controls but repeatable ASVS evidence, dependency review, and abuse-test results in CI or release records. | OWASP ASVS checklist completed for chosen assurance level; dependency scan clean or formally accepted; critical/high issues resolved; abuse tests run in release pipeline. | Security & Privacy Lead |
| HSB-P0-005 | HSR-020 | Incident response workflow and runbook are incomplete. | The team needs a defined way to pause, investigate, notify, and recover if participant rights or confidentiality are affected. | Pause-study state, incident record, severity rules, notification templates, and incident drill evidence exist. | Security & Privacy Lead |
| HSB-P0-006 | HSR-023, HSR-024 | Anonymized dataset, audit package, and provenance bundle are not complete enough for review. | Real studies need evidence outputs for methodological checking, governance review, and downstream transparency. | Dedicated packages produce manifests, hashes, redaction/provenance/audit files, and tests prove identity-response mapping is excluded where required. | Data Custodian |
| HSB-P0-007 | HSR-025 | Full end-to-end dry-run study evidence is incomplete. | Readiness must be demonstrated across the complete lifecycle, not only unit paths. | Dry-run transcript/evidence covers creation, signoff, invite, consent, R1, curation, later rounds, exports, withdrawal, audit verification, and restore. | Study Owner |

## P1 Blockers

| Blocker ID | Related controls | Blocker | Why it matters | Exit criteria | Owner role |
|---|---|---|---|---|---|
| HSB-P1-001 | HSR-011, HSR-012 | AI release gates and provenance exports need broader coverage across all participant-facing AI-influenced content. | Prevents silent AI transformation or accidental publication of AI-influenced material. | All AI-influenced participant-facing materials require configured signoff; provenance bundle includes AI operation hashes and human decisions. | Ethics & Methods Steward |
| HSB-P1-002 | HSR-009 | Participant controlled feedback display needs full real-data integration for later rounds. | Panelists need neutral feedback, prior response, and distribution/dispersion where appropriate. | Later-round participant task displays configured feedback neutrally and passes forbidden-language tests. | Ethics & Methods Steward |
| HSB-P1-003 | HSR-021 | IRB decision import and IRB pack final renderer are incomplete. | IRB workflow should support approval metadata, stipulations, consent versions, and protocol updates. | IRB pack export includes imported decision metadata and editable reviewer-facing sections. | Study Coordinator |
| HSB-P1-004 | HSR-015 | Audit taxonomy is not finalized. | Reviewers need consistent categories for identity access, AI operations, exports, corrections, and incidents. | Audit event taxonomy documented and reflected in filters/export package. | Security & Privacy Lead |

## P2 Blockers

| Blocker ID | Related controls | Blocker | Why it matters | Exit criteria | Owner role |
|---|---|---|---|---|---|
| HSB-P2-001 | HSR-022 | Final report document polish and styling need reviewer-ready formatting. | Downstream users and IRB reviewers need professional, readable outputs. | Rendered DOCX/XLSX reviewed visually; formatting defects resolved. | Study Owner |
| HSB-P2-002 | HSR-025 | CI/release automation is not complete. | Manual verification is slower and easier to skip. | CI runs frontend, backend, security, accessibility, and export artifact tests. | Open Source Maintainer |

## Launch Decision Rule

Do not run a real human-subjects study if any P0 blocker remains open.

A supervised internal dry run may proceed with P0 blockers only if:

- no real participant data is collected,
- all users are internal testers,
- test data is synthetic,
- the dry run purpose is to produce readiness evidence,
- the risk acceptance is documented.

## Blocker Review Cadence

- Review blockers after every readiness workstream.
- Update related HSR rows in `control-matrix.md`.
- Add test evidence in `test-evidence-checklist.md`.
- Require Study Owner and Ethics & Methods Steward review before closing blockers related to participant rights, AI, reporting, or method integrity.

## 2026-05-07 status note
- Phase 1 evidence closeout package added; blockers requiring human-observed, deployment-specific, and external approvals remain active.


## 2026-05-08 retention/deletion execution update
- Added data-custodian-only deletion execution endpoint to move approved requests to Completed and apply participant suppression markers for future exports.
- Added audit action `participant.deletion_request.execute` and test coverage for unauthorized execution blocking and execution ledger evidence.
- This update materially reduces HSB-P0-002, but **does not claim production readiness or human-subjects readiness**. A human-observed production deployment/restore rehearsal remains required before closure.


### 2026-05-08 update (HSB-P0-002)
- Added executed local automation evidence for backup/restore/migration/rollback rehearsal path.
- Linked evidence: `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_BACKUP_RESTORE_REHEARSAL_EXECUTED_EVIDENCE.md`.
- Blocker status remains OPEN pending production-like, human-observed deployment rehearsal evidence.

### 2026-05-08 update (HSB-P0-002, local evidence refinement)
- Added focused local automation rehearsal test and execution evidence for backup/restore/migration/rollback-path verification.
- Linked evidence: `server/tests/backupRestoreRehearsal.test.mjs` and `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_BACKUP_RESTORE_REHEARSAL_EXECUTED_EVIDENCE.md`.
- Blocker remains OPEN until production-like deployment rehearsal evidence is attached.

### 2026-05-08 update (HSB-P0-005)
- Incident workflow routes and focused automated tests were added for create/classify/contain/pause/timeline/audit-integrity paths.
- Synthetic/tabletop incident drill evidence was updated and linked.
- Blocker remains OPEN until deployment-connected, human-operated notification/escalation drill evidence is attached.
