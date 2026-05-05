# Role Abuse Tests

Status: EXECUTED WITH CONDITIONS.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Purpose

These tests check whether a participant, Study Owner, or PI/admin support user can misuse role authority to bypass governance, leak identity-response mappings, or alter study state in ways that undermine the Ethical Governance Charter.

## Study Owner / Admin Abuse Checks

| Attempt | Expected behavior | Observed result |
| --- | --- | --- |
| Change consensus rule after launch | Blocked or governance/version workflow required | PASS, 409 `consensus_rule_locked` |
| Change consensus rule after results exist | Blocked or governance/version workflow required | PASS, 409 `consensus_rule_locked` |
| Publish AI-generated unsafe item automatically | AI content remains non-final until human action | PASS |
| Publish participant-facing items after human edit | Unsafe text removed before publication | PASS |
| Export participant-linkable data as de-identified | De-identified exports reject identifiers and mappings | PASS after remediation |
| Convert restricted/internal export into de-identified package | Restricted packages remain classified and separated | PASS |
| Include support-note identity data in de-identified report | Not included in de-identified packages | PASS |

## Participant Workflow Abuse Checks

| Attempt | Expected behavior | Observed result |
| --- | --- | --- |
| Submit Round 1 without consent/acknowledgement | Blocked server-side | PASS, 403 `active_consent_required` |
| Submit after Round 1 closed | Blocked server-side | PASS, 409 `round1_not_open` |
| Duplicate Round 1 submission | Blocked or idempotent if single-submit policy applies | P2 condition, accepted with 201 |
| Attempt admin response view with participant role | Forbidden | PASS, 403 |
| Attempt admin response view with invitation header | Forbidden | PASS, 403 |
| Guess export package with participant context | Forbidden | PASS, 403 |
| Same-tab invitation switching | No identity/response cross-linking | PASS in headless smoke |

## Duplicate Round 1 Condition

Finding ID: `ADVERSE-P2-DUPLICATE-ROUND1`.

The API accepted another Round 1 response record with status 201. This was not proven to create an identity leak, role bypass, or export privacy failure. Report logic still generated controlled outputs and scans passed. The behavior should be clarified before larger rehearsals:

- If one response per participant per round is required, enforce idempotency or replacement.
- If multiple Round 1 submissions are allowed, make that policy explicit in UI and reporting.

Current severity: P2 for controlled synthetic testing.

## Abuse Governance Path

Automatic moderation is not required at this MVP stage. The rehearsal verified a safe governance path for controlled synthetic testing:

- Study Owner can revoke an invitation.
- Revoked token returned 404.
- Participant self-withdraw returned 200.
- Prior synthetic content remained governed by export privacy and report controls.

This supports PI/study-team governance as the primary abuse-control mechanism for MVP testing.
