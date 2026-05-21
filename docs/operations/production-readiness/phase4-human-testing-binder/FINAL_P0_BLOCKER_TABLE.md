# Final P0 Blocker Table

Current decision: **OPEN P0 READINESS BLOCKERS / NOT READY FOR HUMAN TESTING**.

These are readiness blockers for the human-testing candidate decision. They are not necessarily product defects, but each blocks a `READY FOR HUMAN TESTING` mark until closed with evidence or removed from scope with explicit signoff.

| Blocker ID | Owner role | Current status | Evidence link/path | Residual risk | Required next action |
| --- | --- | --- | --- | --- | --- |
| F4-P0-001 | Release owner | OPEN | `CANDIDATE_RECORD.md` | Candidate tag/package identifier is not pinned. | Pin final tag/package identifier and record checksum/path if packaged. |
| F4-P0-002 | Study Owner/operator | OPEN | `OPERATOR_CHECKLIST.md`, `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-21.md` | Clean laptop profile or second-machine operator launch evidence is missing for the superseding Windows installer candidate (`r8`). | Execute and attach the full 15-step clean-Windows retest checklist. |
| F4-P0-003 | Study Owner/operator | OPEN | `OPERATOR_CHECKLIST.md`, `SCREENSHOT_LOG_EVIDENCE_INDEX.md` | Phone participant path evidence is missing. | Run selected phone path and attach screenshots/recordings. |
| F4-P0-004 | Accessibility reviewer | OPEN | `ACCESSIBILITY_CHECKLIST.md` | Accessibility evidence and reviewer decision are missing. | Complete keyboard, screen reader, and mobile accessibility review. |
| F4-P0-005 | Data Custodian | OPEN | `DATA_CUSTODIAN_EXPORT_REVIEW_SHEET.md` | Export/data review and residual re-identification interpretation are missing. | Complete Data Custodian review and signoff. |
| F4-P0-006 | Security & Privacy Lead | OPEN | `SECURITY_REVIEW_SIGNOFF_SHEET.md`, `REPOSITORY_HYGIENE_CHECKLIST.md` | Security/privacy review, human no-real-data/no-sensitive-export review, accepted-risk signoff, and app moderate advisory review are missing. | Complete security review and decide whether to fix or accept the moderate dependency advisory before final readiness. |
| F4-P0-007 | Operations owner | OPEN | `BACKUP_RESTORE_REHEARSAL_SHEET.md`, `RETENTION_DELETION_REHEARSAL_SHEET.md`, `INCIDENT_DRILL_SHEET.md` | Operational rehearsals required before final human testing are missing. | Run backup/restore, retention/deletion, and incident drill sheets. |
| F4-P0-008 | Auth/session owner + Study Owner/operator | OPEN | `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-21.md`, `SCREENSHOT_LOG_EVIDENCE_INDEX.md` | Installed-package auth/session continuity for Study Builder save/list/reopen is not yet evidenced on clean Windows retest. | Mark closed only when steps 8, 9, and 10 evidence is attached for the same synthetic study in the superseding `r8` run. |

## Closure Rule

The candidate cannot be marked `READY FOR HUMAN TESTING` while any P0 blocker remains open.
