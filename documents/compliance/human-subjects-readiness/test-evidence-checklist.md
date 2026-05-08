# Human Subjects Readiness Test Evidence Checklist

**Project:** Delphi Commons
**Last updated:** 2026-05-02

This checklist defines the evidence required before calling Delphi Commons human-subjects ready. It should be completed for each release candidate.

## Evidence Rules

- Evidence must be reproducible from a clean checkout or documented deployment environment.
- Automated tests must include command, date, commit hash, and pass/fail result.
- Manual evidence must include reviewer, date, environment, screenshots or transcript where useful, and defects found.
- Security and accessibility evidence must identify remaining residual risk, not only pass/fail.

## Current Baseline Evidence

| Evidence item | Current status | Current command/file | Next action |
|---|---|---|---|
| Frontend governance tests | Passing | `cd app && npm.cmd test` | Keep in release checklist. |
| Backend road test | Passing | `cd server && npm.cmd test` | Expand into focused suites. |
| Backend TypeScript build | Passing through server test | `cd server && npm.cmd run build` | Keep in CI/release script. |
| Audit integrity test | Covered in backend road test | `server/tests/roadtest.test.mjs` | Add standalone audit package export test. |
| Browser-level participant dry run | Manual, incomplete | In-app browser testing | Convert to Playwright or equivalent E2E. |
| Accessibility audit | Partial | `documents/compliance/accessibility/*`; `app/tests/policyGates.test.mjs` | Add human NVDA/VoiceOver review and active participant task screenshots. |
| Security verification | Partial | Backend negative tests plus Phase 8 ASVS-oriented controls | Add CI dependency scanning, deployment secret review, and external security review evidence. |
| Backup/restore rehearsal | Partial | `server/tests/roadtest.test.mjs` | Add production runbook and off-host restore rehearsal. |

## Automated Test Evidence Required

### Consent, Withdrawal, Confidentiality

- [ ] No participant response can be submitted without active consent.
- [ ] Consent record includes participant ID, consent version ID, timestamp, and study version.
- [ ] Consent version activation is audited.
- [ ] Participant withdrawal blocks future Round 1 responses.
- [ ] Participant withdrawal blocks future later-round structured responses.
- [ ] Participant-facing confidentiality copy states confidential to research team and linked by participant ID.
- [ ] Participant-facing copy does not promise complete anonymity.
- [ ] Consent/withdrawal language appears in IRB/Ethics Pack export.

Current automated coverage includes: invitation consent is required before submission; withdrawal blocks future submission; participant retention/deletion review request can be created and staff-reviewed.

### Governance And Locked Rules

- [ ] Study version cannot activate without Study Owner signoff.
- [ ] Study version cannot activate without Ethics & Methods Steward signoff.
- [ ] Round 1 cannot open before active study version.
- [ ] Round 1 cannot open without predefined consensus rule.
- [ ] Consensus rule cannot be changed after governance lock/Round 1 opening.
- [ ] Panel- or stakeholder-informed consensus rule cannot proceed to governance signoff until pre-round input is reviewed/finalized and summarized.
- [ ] Pre-round consensus input is reported as setup evidence and not counted as a Delphi round.
- [ ] Exceptional method changes require new study version or audited correction workflow.
- [ ] Reports and exports include consensus threshold and justification.

Current automated coverage includes: activation is blocked without both required governance signoffs; consensus rule edits are blocked after governance lock; panel-informed consensus cannot submit without reviewed/summarized input; the Study Builder packet records modified Delphi bias-warning acknowledgement when Round 1 is structured.

### Round Lifecycle And Participant Tasks

- [ ] Round 1 open-text task appears only when Round 1 is open.
- [ ] Round 1 submission displays "what was submitted."
- [ ] Round 1 closed state prevents further edits.
- [ ] Round 2 cannot open before Round 1 closes.
- [ ] Round 2 cannot open without published traceable candidate items.
- [ ] Later rounds cannot exceed declared terminal round.
- [ ] Modified Delphi blocks Round 4 unless explicitly configured otherwise.
- [ ] Classic Delphi supports Round 4 when declared.
- [ ] Later-round participant task uses verbal structured judgment choices, not bare numeric entry.
- [ ] Later-round submitted response review displays words, not only numeric codes.
- [ ] Retain and revise actions are equally available where protocol allows.

Current automated coverage includes: closed Round 1 rejects further response submission; closed Round 1 setup cannot be edited; closed Round 1 cannot be reopened through ordinary transition endpoints; curation and AI synthesis are blocked until Round 1 closes; Round 2 cannot open without published traceable candidate items; frontend presents submitted-response review states and a no-local-storage draft privacy policy.

### AI Governance And Provenance

- [ ] AI output is labeled "AI Suggestion (Not Final)."
- [ ] AI suggestion cannot be published without Accept/Edit/Reject.
- [ ] Participant-facing AI-assisted content requires required signoffs.
- [ ] AI operation audit includes feature, user/role, model identifier, template version, input scope, output hash, and human decision.
- [ ] AI input scope excludes direct identifiers.
- [ ] AI cannot modify consensus threshold.
- [ ] AI cannot auto-drop dissent or minority statements.
- [ ] Candidate item provenance links to source response IDs.
- [ ] Merge/split/reject actions require rationale.
- [ ] Rejected and minority/unique items remain visible in provenance/export evidence.

Current automated coverage includes: AI inter-round synthesis is lifecycle-gated; AI item materialization requires a human Accept/Edit decision; clustered Round 1 material requires human rationale; AI-influenced publication requires dual release signoff; published items must have verifiable provenance before later-round opening.

Phase 6 automated coverage also includes: AI materialized items remain draft until human action; merge/split/reject workflows require rationale; rejected items remain in the Provenance Bundle; AI output hashes, model identifiers, and prompt/template versions are exported; final wording traces through source response links and human edit rationale.

### Identity/Response Separation And Authorization

- [ ] Unauthorized roles cannot access participant master list.
- [ ] Authorized identity access writes audit event.
- [ ] Response records do not include direct identity fields.
- [ ] Participant invitation token grants only scoped participant access.
- [ ] Expired/revoked invitation token cannot access task.
- [ ] Role downgrade removes access immediately.
- [ ] UI-hidden actions are still rejected by backend.
- [ ] Admin/security role actions are audited.

Current automated coverage includes: participant session cannot list staff studies; steward session cannot act as owner even with manipulated role header; steward can read only after assignment; assignment removal immediately removes access; revoked invitation cannot open or submit.

### Audit And Export Logging

- [ ] Study create/version/signoff/activation events are audited.
- [ ] Consent create/activate/record/withdraw events are audited.
- [ ] Round open/close events are audited.
- [ ] Response and rating submissions are audited.
- [ ] Curation item changes are audited.
- [ ] AI generation and human decisions are audited.
- [ ] Export package creation is audited.
- [ ] Export package review is audited.
- [ ] Export file download is audited.
- [ ] Audit chain verifies.
- [ ] Attempted audit mutation fails.

Current automated coverage includes: round open/close events, blocked reopen, blocked early curation, blocked untraceable later-round opening, response/rating submissions, curation edits/rejections/publication blocks, AI operations, export creation/review/download, audit verification, and append-only protection.

### Reports And Export Packages

- [ ] Final Delphi Report package includes required consensus-not-correctness statement.
- [ ] Final report includes consensus, near-consensus, non-consensus, attrition, response rates, median/IQR/distributions, and limitations.
- [ ] IRB/Ethics Pack includes protocol, consent, withdrawal, confidentiality, recruitment, AI disclosure, retention, safeguards, and signoff history.
- [ ] Anonymized Response Dataset excludes identity-response mapping.
- [ ] Dataset includes data dictionary and redaction manifest.
- [ ] Audit Package includes audit events and integrity hashes.
- [ ] Provenance Bundle includes graph-friendly edges and transformation history.
- [ ] Complete Locked Archive includes manifest and package hash.
- [ ] Export manifest identifies schema version, creator, role, data cutoff, anonymization level, and file hashes.

Current automated coverage includes: governed Final Delphi Report, IRB/Ethics Pack, Anonymized Response Dataset, Audit Package, Provenance Bundle, and Complete Archive package creation; every package has manifest, hashes, data cutoff, creator role, redaction status, limitations/disclosures, and pending review status; the final report contains the required consensus-not-correctness statement plus consensus/near-consensus/non-consensus fields; anonymized response files exclude identity-response mapping; audit package includes signoffs, export review/download events, AI operations, identity access, and item changes.

### Security Controls

- [x] Secure session handling implemented and tested.
- [x] CSRF strategy documented and tested where applicable.
- [x] Rate limits protect auth, invitation, export, and admin endpoints.
- [x] Security headers configured.
- [ ] Secrets are not stored in repo or client-visible bundles.
- [x] No participant invitation token appears in API URLs or ordinary server request logs.
- [x] No client-side local/session storage is used for sensitive study content.
- [x] Free-text fields are safely rendered and XSS sink tests pass.
- [ ] File downloads/uploads, if present, are permission-gated and content-type constrained.
- [ ] Dependency scan has no unresolved critical/high vulnerabilities or has documented risk acceptance.
- [ ] OWASP ASVS checklist is completed for selected assurance level.

Current automated Phase 8 coverage includes: security headers on API responses, CORS origin rejection, auth rate limiting, CSRF rejection for cookie-backed mutations, cookie session readability for safe requests, forbidden export access by participant sessions, invalid/revoked invitation-token rejection, URL-fragment invitation links with header-based participant API calls, append-only audit integrity, and frontend source scans for unsafe HTML sinks and browser storage.

### Accessibility

- [ ] Keyboard-only flow works for Study Builder, Governance, Rounds, Curation, Participant Portal, Reporting, Admin/Security.
- [ ] Screen reader labels are meaningful for participant consent and round tasks.
- [x] Core color contrast meets WCAG 2.2 AA for tested palette pairs.
- [x] Focus indicators are visible for keyboard users.
- [ ] Error messages are associated with inputs.
- [ ] Mobile participant flow is usable at common viewport widths.
- [x] No text overlap or clipped controls in sampled desktop/mobile viewports.
- [ ] Time limits, deadlines, and reminders are understandable and accessible.

Current Phase 9 evidence includes: accessibility checklist, keyboard walkthrough, screen-reader notes, mobile screenshot evidence, copy review log, automated browser validation JSON, mobile/desktop screenshots, and app tests for contrast, focus style, unsafe HTML/storage, and forbidden participant language.

### Backup, Recovery, And Operations

- [ ] Fresh deployment from documentation succeeds.
- [ ] Database migration applies from empty database.
- [ ] Migration applies from previous release database.
- [ ] Backup is created using documented command/process.
- [ ] Restore from backup succeeds.
- [ ] Audit integrity verifies after restore.
- [ ] Export packages remain downloadable after restore.
- [ ] Incident response drill completes.
- [ ] Study pause blocks participant submissions.
- [ ] Admin can revoke participant invitation/session.

Current automated coverage includes: backup manifest creation, database/audit backup hashing, restore operation, and post-restore audit/data integrity verification.

## Manual Dry-Run Study Evidence Required

Complete and document at least one full dry-run study:

- [ ] Create study as Study Owner.
- [ ] Complete Study Builder with purpose, Delphi suitability, panel criteria, consent, rounds, feedback, AI, and retention.
- [ ] Submit governance packet.
- [ ] Record Study Owner and Ethics & Methods Steward signoffs.
- [ ] Activate study version.
- [ ] Configure and open Round 1.
- [ ] Invite at least three test participants.
- [ ] Participants review consent and submit Round 1 responses on desktop and mobile.
- [ ] One participant withdraws.
- [ ] Close Round 1.
- [ ] Curate responses into candidate items with at least one merge/split/rationale and one minority/unique retained statement.
- [ ] Publish Round 2 items with required signoff.
- [ ] Participants complete structured judgment task using verbal choices.
- [ ] Open and complete subsequent round according to study design.
- [ ] Generate final report and all export packages.
- [ ] Review and approve/reject an export package.
- [ ] Download export files.
- [ ] Verify audit log and audit integrity.
- [ ] Verify anonymized dataset excludes identity-response mapping.
- [ ] Verify provenance bundle traces final items to source responses.
- [ ] Restore backup and verify study/report/audit data.

## Evidence Log Template

Use this template for each release candidate:

```text
Release candidate:
Commit:
Environment:
Reviewer:
Date:

Automated tests:
- Command:
- Result:
- Output location:

Manual tests:
- Flow tested:
- Result:
- Evidence:
- Defects:

Security/accessibility review:
- Scope:
- Result:
- Residual risks:

Release decision:
- Ready / Not ready:
- Blockers:
```

## 2026-05-07 Phase 1 evidence closeout update
- Added closeout package: `docs/operations/production-readiness/phase1-evidence-closeout/`.
- Decision remains `PARTIAL / EVIDENCE INCOMPLETE` pending human-required and deployment-specific evidence.


## 2026-05-08 retention/deletion execution update
- Added data-custodian-only deletion execution endpoint to move approved requests to Completed and apply participant suppression markers for future exports.
- Added audit action `participant.deletion_request.execute` and test coverage for unauthorized execution blocking and execution ledger evidence.
- This update materially reduces HSB-P0-002, but **does not claim production readiness or human-subjects readiness**. A human-observed production deployment/restore rehearsal remains required before closure.


## 2026-05-08 local backup/restore rehearsal evidence
- [x] Local automated backup/restore rehearsal command exists and is runnable: `npm --prefix server run test:backup-restore-rehearsal`.
- [x] Local automated rehearsal verifies post-restore data integrity across study, participant, assignment, deletion-request, audit, and export-manifest domains.
- [ ] Production-like, operator-observed deployment rehearsal evidence attached (still required).

## 2026-05-08 focused local rehearsal update
- [x] Added dedicated local rehearsal test: `server/tests/backupRestoreRehearsal.test.mjs`.
- [x] Executed command: `npm --prefix server run test:backup-restore-rehearsal`.
- [ ] Production-like, operator-observed deployment rehearsal evidence attached (still required).

## 2026-05-08 incident workflow evidence update
- [x] Focused incident workflow test added and executed: `npm --prefix server run test:incident-workflow` (`server/tests/incidentWorkflowPhase1.test.mjs`).
- [x] Coverage includes authorized incident creation, unauthorized action blocked, pause-study-equivalent state change, remediation/recovery timeline record, and audit integrity.
- [ ] Live notification/escalation drill evidence in deployment-like environment (still required).

## 2026-05-08 security evidence update
- Added deployment security verification command: `npm --prefix server run security:verify:deployment`.
- Added focused backend security deployment test coverage: `server/tests/securityDeploymentChecks.test.mjs`.
- Independent security review evidence remains required separately; this checklist update does not claim that review is complete.
