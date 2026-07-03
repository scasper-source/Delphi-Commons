# Human Testing Candidate Checklist

Candidate decision: **NOT READY FOR HUMAN TESTING**.

This checklist is the place where the candidate can later be marked ready. It is not marked ready now because the laptop and phone run evidence required by the Phase 4 exit gate has not been attached.

| Gate | Required evidence | Status | Evidence link/path | Notes |
| --- | --- | --- | --- | --- |
| Candidate commit pinned | Source commit recorded in candidate record | PASS | `CANDIDATE_RECORD.md` | Current source snapshot: `18faba2` |
| Candidate tag/package pinned | Tag and package identifier recorded | PASS | `CANDIDATE_RECORD.md`, `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-06-28.md`, `../MACOS_GITHUB_RELEASE_ASSET_EVIDENCE_2026-06-28.md` | June 28 Windows and macOS `r2` tags and package identifiers are pinned; clean package retest evidence remains open separately |
| Binder committed or attached | Phase 4 binder present in repository | PASS | This folder | Binder package assembled for commit |
| Repository hygiene | No-secrets/no-real-data/boundary/audit checks recorded | AUTOMATED_PASS / HUMAN_REVIEW_REQUIRED | `REPOSITORY_HYGIENE_CHECKLIST.md` | Human review still required for real-data/export absence |
| Laptop candidate run | Operator launch from docs on clean laptop profile or second machine | R2 FAILED / OPEN | `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-06-28.md`, `../WINDOWS_INSTALLER_R2_FAILURE_EVIDENCE_2026-07-01.md` | Clean Windows `r2` evidence showed install/open/uninstall and multi-study list/reopen partial pass, but governance signoff, smoke/save verification, and operator function closeout failed or remained unproven |
| Phone candidate run | Phone participant path can be opened and walked through | NOT RUN | HUMAN_REQUIRED | Required by exit gate |
| SMS path review | Copy/privacy/Data Custodian/security review if SMS is in scope | NOT RUN | HUMAN_REQUIRED | Real provider readiness not claimed |
| Accessibility review | Keyboard, screen reader, mobile, and error association evidence | NOT RUN | HUMAN_REQUIRED | Required before final human testing |
| Backup/restore rehearsal | Backup and restore/reset evidence attached | NOT RUN | HUMAN_REQUIRED | Required before final human testing |
| Retention/deletion rehearsal | Retention/deletion/export suppression evidence attached | NOT RUN | HUMAN_REQUIRED | Required before final human testing |
| Incident drill | Incident workflow drill evidence attached | NOT RUN | HUMAN_REQUIRED | Required before final human testing |
| Data Custodian review | Dataset/audit/provenance/residual-risk review signed | NOT RUN | HUMAN_REQUIRED | Required before final human testing |
| Security review | Security/privacy review and accepted residual risks signed | NOT RUN | HUMAN_REQUIRED | Required before final human testing |
| Windows auth/session save-reopen proof | Installed-package Main Menu, Study Workspace Launcher, and Study Builder save/list/reopen continuity evidence attached | R2 PARTIAL_PASS / SUCCESSOR_RETEST_REQUIRED | `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-06-28.md`, `../WINDOWS_INSTALLER_R2_FAILURE_EVIDENCE_2026-07-01.md`, `../../../../server/tests/multipleStudyPersistence.test.mjs`, `../../../../app/tests/policyGates.test.mjs` | R2 proved enough of the launcher/multi-study path to be useful, but save freshness was not operator-verifiable. A successor package must show version-save timing and pass post-save/relaunch smoke. |
| Governance signoff controls | Study PI and Ethics PI signoff can be reached and recorded from packaged operator flow | R2_FAILED / SUCCESSOR_RETEST_REQUIRED | `FINAL_P0_BLOCKER_TABLE.md`, `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-06-28.md`, `../WINDOWS_INSTALLER_R2_FAILURE_EVIDENCE_2026-07-01.md`, `../../../../server/tests/signoffGovernanceFlow.test.mjs`, `../../../../app/tests/policyGates.test.mjs` | R2 installed-package evidence shows Study PI and Ethics PI signoff route remained blocked. Successor package must make saved design -> method/consensus -> submit -> dual signoff -> activation reachable from the operator flow. |
| Final P0 blocker review | No open P0 blockers | OPEN | `FINAL_P0_BLOCKER_TABLE.md` | Open readiness blockers remain |

## Readiness Mark

Current mark: **NOT READY FOR HUMAN TESTING**.

The mark may change only after all required evidence rows are updated from `NOT RUN`, `HUMAN_REQUIRED`, `HUMAN_REVIEW_REQUIRED`, `PENDING_REFRESH`, or `OPEN` to an evidence-backed passing or accepted-risk state.

This checklist does not close Phase 1 human evidence and does not authorize a pilot.
