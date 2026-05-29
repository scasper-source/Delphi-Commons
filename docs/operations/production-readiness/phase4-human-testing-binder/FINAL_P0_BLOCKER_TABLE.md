# Final P0 Blocker Table

Current decision: **OPEN P0 READINESS BLOCKERS / NOT READY FOR HUMAN TESTING**.

These are readiness blockers for the human-testing candidate decision. They are not necessarily product defects, but each blocks a `READY FOR HUMAN TESTING` mark until closed with evidence or removed from scope with explicit signoff.

| Blocker ID | Owner role | Current status | Evidence link/path | Residual risk | Required next action |
| --- | --- | --- | --- | --- | --- |
| F4-P0-001 | Release owner | OPEN | `CANDIDATE_RECORD.md` | Candidate tag/package identifier is not pinned. | Pin final tag/package identifier and record checksum/path if packaged. |
| F4-P0-002 | Study Owner/operator | PARTIAL / OPEN | `OPERATOR_CHECKLIST.md`, `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-21.md` | Clean Windows `r8` operator report on 2026-05-29 shows install, launch, close-window stop, relaunch, and uninstall mostly passing, but screenshot artifacts are not yet linked and the retest exposed saved-study workflow failures. | Attach screenshots/logs, preserve the partial lifecycle pass evidence, and keep this open until the saved-study continuity defects are fixed or explicitly split into separate accepted-risk decisions. |
| F4-P0-003 | Study Owner/operator | OPEN | `OPERATOR_CHECKLIST.md`, `SCREENSHOT_LOG_EVIDENCE_INDEX.md` | Phone participant path evidence is missing. | Run selected phone path and attach screenshots/recordings. |
| F4-P0-004 | Accessibility reviewer | OPEN | `ACCESSIBILITY_CHECKLIST.md` | Accessibility evidence and reviewer decision are missing. | Complete keyboard, screen reader, and mobile accessibility review. |
| F4-P0-005 | Data Custodian | OPEN | `DATA_CUSTODIAN_EXPORT_REVIEW_SHEET.md` | Export/data review and residual re-identification interpretation are missing. | Complete Data Custodian review and signoff. |
| F4-P0-006 | Security & Privacy Lead | OPEN | `SECURITY_REVIEW_SIGNOFF_SHEET.md`, `REPOSITORY_HYGIENE_CHECKLIST.md` | Security/privacy review, human no-real-data/no-sensitive-export review, accepted-risk signoff, and app moderate advisory review are missing. | Complete security review and decide whether to fix or accept the moderate dependency advisory before final readiness. |
| F4-P0-007 | Operations owner | OPEN | `BACKUP_RESTORE_REHEARSAL_SHEET.md`, `RETENTION_DELETION_REHEARSAL_SHEET.md`, `INCIDENT_DRILL_SHEET.md` | Operational rehearsals required before final human testing are missing. | Run backup/restore, retention/deletion, and incident drill sheets. |
| F4-P0-008 | Auth/session owner + Study Owner/operator | OPEN / FAILING_RETEST | `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-21.md`, `SCREENSHOT_LOG_EVIDENCE_INDEX.md` | 2026-05-29 clean Windows `r8` report shows create/save and dashboard list passing, but saved-study reopen was not proven and post-relaunch saved/new-study continuity failed or was unclear. | Reproduce and fix saved-study reopen/new-study continuity, then rerun steps 8, 9, 10, and post-relaunch smoke for the same synthetic study. |
| F4-P0-009 | Governance owner + Study Owner/operator | OPEN / NEW_FROM_RETEST | `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-21.md`, `SCREENSHOT_LOG_EVIDENCE_INDEX.md` | 2026-05-29 clean Windows `r8` report indicates Study Owner/PI and Ethics & Methods/PI signoff controls appear broken, unreachable, or not wired clearly enough for the operator workflow. | Reproduce the signoff workflow from the packaged app, determine whether the backend route, role switch, UI state, or product flow is failing, then fix and retest governance signoff before any human-use readiness mark. |

## Closure Rule

The candidate cannot be marked `READY FOR HUMAN TESTING` while any P0 blocker remains open.
