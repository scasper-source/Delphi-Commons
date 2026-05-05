# IDOR And Access-Control Tests

Status: EXECUTED WITH LOCAL/API AND HEADLESS SMOKE EVIDENCE.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Scope

The rehearsal checked local/dev routes for obvious insecure direct object reference and role-boundary failures. It did not perform third-party attack testing and did not target any external system.

## Route And Identifier Areas Inspected

- Study and study version routes.
- Round lifecycle routes.
- Participant invitation routes.
- Participant response routes.
- Support/issue-note routes.
- Report/export package routes.
- AI suggestion routes.
- Admin/study-owner response review routes.
- Audit/provenance package boundaries.

## Executed Checks

| Kind | Expected | Actual | Result |
| --- | --- | --- | --- |
| Consensus rule change after launch | 409 | 409 `consensus_rule_locked` | PASS |
| Participant role accesses admin response view | 403 | 403 `forbidden` | PASS |
| Invitation header accesses admin response view | 403 | 403 `forbidden` | PASS |
| Participant creates support issue for another participant | 403 | 403 `forbidden` | PASS |
| Participant guesses export package file route | 403 | 403 `forbidden` | PASS |
| Consensus rule change after results | 409 | 409 `consensus_rule_locked` | PASS |

## Same-Tab Invitation Switching

Headless browser smoke navigated from participant A invitation to participant B invitation in the same tab at 390px.

Result: PASS.

Observed:

- Final URL was participant B invitation URL.
- `xss_executed`: false.
- Forbidden synthetic label observed: false.
- Forbidden email observed: false.
- Horizontal overflow: false.

Condition: this is headless smoke evidence and does not replace a full manual all-8 browser UI pass.

## Access-Control Caveat

The artifact records this local development note:

`Local development mode accepts legacy dev role headers unless EDELPHI_AUTH_REQUIRE_SESSION=true; this is not a production access-control model.`

This means the rehearsal can support controlled synthetic local testing, but it cannot support production-readiness claims.

## Result

No P0 or P1 IDOR/access-control defect was observed in the executed local checks.

Remaining before production or real human-subjects use:

- Production authentication/session hardening.
- External security review.
- Deployment configuration review.
- Audit of all route authorization rules with production auth enabled.
