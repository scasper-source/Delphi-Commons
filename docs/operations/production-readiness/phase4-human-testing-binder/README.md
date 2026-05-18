# Phase 4 Human Testing Binder And Release Hygiene

Date basis: 2026-05-18.

Status: **BINDER ASSEMBLED / HUMAN_REQUIRED ITEMS OPEN / NOT READY FOR HUMAN TESTING**.

This binder assembles the artifacts needed to prepare for final human testing of Delphi Commons. It does not close Phase 1 human evidence, approve real human-subjects research, authorize a controlled pilot, authorize production deployment, or approve use with real participant data.

All execution rows default to `NOT RUN` or `HUMAN_REQUIRED` until a human operator, observer, reviewer, or signatory performs the step and links evidence created during that run.

## Binder Contents

| Artifact | Purpose | Current status |
| --- | --- | --- |
| [Candidate record](./CANDIDATE_RECORD.md) | Pins the candidate source snapshot, branch/package identifiers, selected surfaces, test commands, and known limitations. | PREPARED; final tag/package still required |
| [Human testing candidate checklist](./HUMAN_TESTING_CANDIDATE_CHECKLIST.md) | Shows whether the candidate can be marked ready for human testing. | NOT READY; run evidence open |
| [Operator checklist](./OPERATOR_CHECKLIST.md) | Human operator walkthrough checklist for laptop and phone candidate execution. | NOT RUN / HUMAN_REQUIRED |
| [Observer transcript](./OBSERVER_TRANSCRIPT.md) | Observer notes and timing template for the human walkthrough. | NOT RUN / HUMAN_REQUIRED |
| [Screenshot/log evidence index](./SCREENSHOT_LOG_EVIDENCE_INDEX.md) | Index for screenshots, screen recordings, logs, and exported evidence. | NOT RUN / HUMAN_REQUIRED |
| [Defect severity rubric](./DEFECT_SEVERITY_RUBRIC.md) | P0/P1/P2/P3 severity definitions and stop rules. | READY FOR USE |
| [Accessibility checklist](./ACCESSIBILITY_CHECKLIST.md) | Keyboard, screen reader, mobile, error association, and support path review. | NOT RUN / HUMAN_REQUIRED |
| [Backup/restore rehearsal sheet](./BACKUP_RESTORE_REHEARSAL_SHEET.md) | Rehearsal worksheet for backup, restore, reset, and artifact integrity. | NOT RUN / HUMAN_REQUIRED |
| [Retention/deletion rehearsal sheet](./RETENTION_DELETION_REHEARSAL_SHEET.md) | Rehearsal worksheet for retention, deletion, export suppression, and audit trace. | NOT RUN / HUMAN_REQUIRED |
| [Incident drill sheet](./INCIDENT_DRILL_SHEET.md) | Tabletop or connected incident drill worksheet. | NOT RUN / HUMAN_REQUIRED |
| [Data Custodian export review sheet](./DATA_CUSTODIAN_EXPORT_REVIEW_SHEET.md) | Data Custodian review of dataset, audit, provenance, and residual risk. | SIGNOFF_REQUIRED |
| [Security review/signoff sheet](./SECURITY_REVIEW_SIGNOFF_SHEET.md) | Security and privacy review/signoff worksheet. | SIGNOFF_REQUIRED |
| [Repository hygiene checklist](./REPOSITORY_HYGIENE_CHECKLIST.md) | No-secrets, no-real-data, boundary, and dependency audit checklist. | AUTOMATED CHECKS REFRESHED; human review/signoff required |
| [Final P0 blocker table](./FINAL_P0_BLOCKER_TABLE.md) | Final readiness blocker table before human testing. | OPEN BLOCKERS |

## Use Order

1. Confirm the candidate source snapshot and package identifier in `CANDIDATE_RECORD.md`.
2. Review repository hygiene command evidence in `REPOSITORY_HYGIENE_CHECKLIST.md` and complete the human no-real-data/no-sensitive-export review.
3. Execute the laptop operator path from `OPERATOR_CHECKLIST.md` on the selected clean laptop profile or second machine.
4. Execute the selected phone path and attach screenshots, logs, and observer notes.
5. Run accessibility, backup/restore, retention/deletion, incident, Data Custodian, and security review sheets.
6. Update `FINAL_P0_BLOCKER_TABLE.md`.
7. Only after all required gates are closed may `HUMAN_TESTING_CANDIDATE_CHECKLIST.md` be marked `READY FOR HUMAN TESTING`.

## Exit Gate

The decision remains **NOT READY FOR HUMAN TESTING** until both are true:

- the selected laptop candidate can be installed/launched/stopped/reset from docs on the chosen clean profile or second machine; and
- the selected phone candidate can be opened and walked through with synthetic/internal data, with the binder evidence attached.

This binder is release hygiene for final human testing only. It does not authorize a pilot or any real human-subjects study.
