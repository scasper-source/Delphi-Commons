# Support-Loop Abuse Tests

Status: EXECUTED.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Purpose

These checks test whether a participant can misuse the support loop to leak identity, expose another participant's support thread, inject unsafe text, or move unsafe content into de-identified reports.

## Synthetic Abuse Fixtures

The support note included synthetic-only adverse content:

- Placeholder abusive text.
- Identifier-like text.
- Prompt-injection text.
- Script-like text.
- Formula-like text.
- Long note content.

No real participant data, real credentials, real contact details, real institutions, or real slurs were used.

## Observed Evidence

From the current passing artifact:

| Check | Result |
| --- | --- |
| Issue created by participant | PASS |
| Stored note length | 1200 |
| Note truncated to limit | true |
| Study Owner can see issue | true |
| Participant can see own response | true |
| Other participant issue count | 0 |
| Overall support-loop abuse result | PASS |

The Study Owner response used safe synthetic staff wording and did not repeat unsafe content to the panel.

## Isolation And Export Privacy

Expected behavior held:

- Participant sees only their own support thread.
- Admin/study-owner access is role-limited.
- Another participant did not see the adverse support thread.
- De-identified export packages did not expose support-note identity linkages.
- Restricted/internal packages remained classified separately.

## Abuse Governance

Support-loop abuse does not require automatic moderation for controlled synthetic MVP testing if the content is contained. The rehearsal confirmed an available governance path:

- PI/study team can handle adverse content through protocol governance.
- Study Owner can revoke invitation access.
- Participant can self-withdraw.
- Unsafe content was not amplified into participant-facing feedback or reports without human review.

## Result

No P0 or P1 support-loop privacy defect was observed.

Remaining before real deployment:

- Production support escalation workflow.
- Breach/escalation workflow.
- Admin onboarding on what not to repeat in participant-facing support replies.
- Retention and access-control policy for support notes.
