# Human Testing Candidate Checklist

Candidate decision: **NOT READY FOR HUMAN TESTING**.

This checklist is the place where the candidate can later be marked ready. It is not marked ready now because the laptop and phone run evidence required by the Phase 4 exit gate has not been attached.

| Gate | Required evidence | Status | Evidence link/path | Notes |
| --- | --- | --- | --- | --- |
| Candidate commit pinned | Source commit recorded in candidate record | PASS | `CANDIDATE_RECORD.md` | Current source snapshot: `2a831ee` |
| Candidate tag/package pinned | Tag and package identifier recorded | PASS | `CANDIDATE_RECORD.md`, `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-31.md` | Windows `r10` tag and package identifier are pinned; clean Windows retest evidence remains open separately |
| Binder committed or attached | Phase 4 binder present in repository | PASS | This folder | Binder package assembled for commit |
| Repository hygiene | No-secrets/no-real-data/boundary/audit checks recorded | AUTOMATED_PASS / HUMAN_REVIEW_REQUIRED | `REPOSITORY_HYGIENE_CHECKLIST.md` | Human review still required for real-data/export absence |
| Laptop candidate run | Operator launch from docs on clean laptop profile or second machine | PARTIAL / OPEN | `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-21.md` | 2026-05-29 clean Windows `r8` report shows install/launch/lifecycle/uninstall mostly passed, but screenshots are pending and saved-study continuity failed or was unclear |
| Phone candidate run | Phone participant path can be opened and walked through | NOT RUN | HUMAN_REQUIRED | Required by exit gate |
| SMS path review | Copy/privacy/Data Custodian/security review if SMS is in scope | NOT RUN | HUMAN_REQUIRED | Real provider readiness not claimed |
| Accessibility review | Keyboard, screen reader, mobile, and error association evidence | NOT RUN | HUMAN_REQUIRED | Required before final human testing |
| Backup/restore rehearsal | Backup and restore/reset evidence attached | NOT RUN | HUMAN_REQUIRED | Required before final human testing |
| Retention/deletion rehearsal | Retention/deletion/export suppression evidence attached | NOT RUN | HUMAN_REQUIRED | Required before final human testing |
| Incident drill | Incident workflow drill evidence attached | NOT RUN | HUMAN_REQUIRED | Required before final human testing |
| Data Custodian review | Dataset/audit/provenance/residual-risk review signed | NOT RUN | HUMAN_REQUIRED | Required before final human testing |
| Security review | Security/privacy review and accepted residual risks signed | NOT RUN | HUMAN_REQUIRED | Required before final human testing |
| Windows auth/session save-reopen proof | Installed-package Main Menu, Study Workspace Launcher, and Study Builder save/list/reopen continuity evidence attached | OPEN / CORRECTED_PACKAGE_RELEASED_PENDING_RETEST | `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-31.md`, `../../../../server/tests/multipleStudyPersistence.test.mjs`, `../../../../app/tests/policyGates.test.mjs` | Corrected `r10` package exists and includes the Main Menu, Study Workspace Launcher, fresh New Study reset, and multi-study persistence coverage; close only after corrected package rerun evidence for launcher path, steps 8/9/10, second-study independence, and post-relaunch smoke |
| Governance signoff controls | Study PI and Ethics PI signoff can be reached and recorded from packaged operator flow | OPEN / CORRECTED_PACKAGE_RELEASED_PENDING_RETEST | `FINAL_P0_BLOCKER_TABLE.md`, `../WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-31.md`, `../../../../server/tests/signoffGovernanceFlow.test.mjs`, `../../../../app/tests/policyGates.test.mjs` | Corrected `r10` package exists and includes backend sequencing plus clearer UI, but this row remains open until corrected package retest evidence exists. |
| Final P0 blocker review | No open P0 blockers | OPEN | `FINAL_P0_BLOCKER_TABLE.md` | Open readiness blockers remain |

## Readiness Mark

Current mark: **NOT READY FOR HUMAN TESTING**.

The mark may change only after all required evidence rows are updated from `NOT RUN`, `HUMAN_REQUIRED`, `HUMAN_REVIEW_REQUIRED`, `PENDING_REFRESH`, or `OPEN` to an evidence-backed passing or accepted-risk state.

This checklist does not close Phase 1 human evidence and does not authorize a pilot.
