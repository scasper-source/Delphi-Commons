# Security And Privacy Findings

Status: CURRENT EVIDENCE SUMMARY.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Current Decision

GO WITH CONDITIONS for continued controlled synthetic mock testing only.

This is not production readiness and not real human-subjects readiness.

## Findings By Severity

| Severity | Count | Current status |
| --- | ---: | --- |
| P0 | 0 | Initial formula-injection P0 remediated and rerun |
| P1 | 0 | None open |
| P2 | 2 | Duplicate Round 1 submit policy unclear; inert markup-like text remains in text exports |
| P3 | 0 | None open |

## Remediated During This Task

| ID | Severity | Area | Status | Evidence |
| --- | --- | --- | --- | --- |
| `ADVERSE-P0-FORMULA-INJECTION` | P0 | Export/spreadsheet safety | REMEDIATED | Initial adverse artifact failed; current rerun has 0 formula failures |

Before remediation, formula-like cells survived in de-identified CSV exports. After remediation, CSV and XLSX export paths neutralize formula-like strings, focused regression tests pass, and regenerated adverse exports have zero formula failures.

## Open Conditions

| ID | Severity | Area | Status | Evidence |
| --- | --- | --- | --- | --- |
| `ADVERSE-P2-DUPLICATE-ROUND1` | P2 | Participant workflow | OPEN | Duplicate Round 1 response accepted with 201 |
| `ADVERSE-P2-RAW-MARKUP-IN-TEXT-EXPORTS` | P2 | Export/rendering | OPEN | 12 rendering warnings for inert script-like or markup-like text |

The duplicate Round 1 behavior is not proven unsafe, but policy should be clarified. The markup-like text did not execute and did not create a formula-injection failure after remediation, but reviewer-facing handling should be improved before production readiness.

## Checks That Passed

- Consent gate blocked submission without acknowledgement.
- Round state blocked submission after Round 1 closed.
- Consensus rule changes after launch and after results were blocked.
- Participant role/admin route boundaries held in executed local checks.
- Participant support thread isolation held.
- Same-tab invitation switching did not show identity/response cross-linking in headless smoke.
- Headless mobile smoke at 320px, 390px, and 414px observed no XSS execution and no horizontal overflow.
- De-identified exports had zero privacy failures.
- Restricted/internal exports were labeled separately and not safe for de-identified sharing.
- Required limitation language appeared exactly.
- AI suggestions stayed non-final until human review.
- No external AI calls occurred.
- Participant withdrawal/removal governance path worked through invitation revocation and self-withdraw.

## Not Fully Run

| Evidence | Status |
| --- | --- |
| Full manual all-8 participant browser UI adverse pass | NOT RUN |
| Full manual mobile adverse pass across all participant tasks | NOT RUN |
| Production-authenticated security review | NOT RUN |
| Third-party penetration test | NOT RUN and out of scope |

## Carryover Watch Items

- Full manual all-8 UI pass remains a condition from the larger mock trial.
- Prior QC noted same-tab invitation switching could briefly retain previous participant state until reload. The adverse headless switch passed, but manual testing should keep using separate profiles or deliberate reloads.
- In sampled participant portal text, some static copy may still refer to prior smoke-test/method wording. Treat copy inconsistencies as a cleanup watch item before public-facing release.

## Remaining Blockers Before Real Human-Subjects Deployment

- Phase 10 operational readiness package.
- Deployment documentation.
- Environment variable guide.
- Database migration and rollback procedure.
- Backup/restore runbook and rehearsed restore evidence.
- Incident response runbook.
- Breach/escalation workflow.
- Admin onboarding and role operations guide.
- Responsible disclosure policy.
- Release notes/changelog process.
- Consolidated known limitations.
- Production authentication/session hardening.
- Production security review.
- Accessibility review.
- IRB/institutional review and approval where applicable.
- Real-data protocol, consent, recruitment, retention, monitoring, and governance approvals.
