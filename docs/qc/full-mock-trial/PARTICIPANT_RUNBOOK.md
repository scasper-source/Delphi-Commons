# Participant Runbook

Live execution status: CONTROLLED SYNTHETIC LOCAL RUN COMPLETED WITH CONDITIONS.

This runbook guides synthetic participants through the 8-participant, 4-round Classical Delphi rehearsal. It is not for real participants. Round completion was verified through local invitation APIs on 2026-05-05, and headless mobile smoke passed for inspected participant/staff views. A manual all-8 browser UI submission pass remains NOT RUN.

## Boundary For Every Participant

- Use only synthetic participant IDs.
- Use only `example.test` email-shaped identifiers if a field requires an email.
- Do not enter real names, real emails, real phone numbers, real organizations, real institutional details, or private facts.
- Do not submit sensitive data.
- Use separate browser profiles, incognito sessions, or a reload after switching invitation links in the same tab.

## Participant Matrix

| Participant | Identifier if required | Browser/session | Round 1 | Round 2 | Round 3 | Round 4 |
| --- | --- | --- | --- | --- | --- | --- |
| SYN-P001 | syn-p001@example.test | Manual UI NOT RUN | PASS API | PASS API | PASS API | PASS API |
| SYN-P002 | syn-p002@example.test | Manual UI NOT RUN | PASS API | PASS API | PASS API | PASS API |
| SYN-P003 | syn-p003@example.test | Manual UI NOT RUN | PASS API | PASS API | PASS API | PASS API |
| SYN-P004 | syn-p004@example.test | Manual UI NOT RUN | PASS API | PASS API | PASS API | PASS API |
| SYN-P005 | syn-p005@example.test | Manual UI NOT RUN | PASS API | PASS API | PASS API | PASS API |
| SYN-P006 | syn-p006@example.test | Manual UI NOT RUN | PASS API | PASS API | PASS API | PASS API |
| SYN-P007 | syn-p007@example.test | Manual UI NOT RUN | PASS API | PASS API | PASS API | PASS API |
| SYN-P008 | syn-p008@example.test | Manual UI NOT RUN | PASS API | PASS API | PASS API | PASS API |

## Round 1 Instructions

1. Open the assigned synthetic invitation link.
2. Confirm the study title is the fictional community garden scheduling app scenario.
3. Read the consent/acknowledgement content.
4. Confirm the consent/acknowledgement gate is required before submission.
5. Submit the assigned open-ended response from `SYNTHETIC_STUDY_SETUP.md`.
6. Confirm a successful save/submit state.
7. Confirm no other participant's identity or response ownership is exposed.

Status: PASS through API. Manual browser invitation/session path NOT RUN.

## Support Loop For SYN-P003

Participant SYN-P003 should submit this issue note:

```text
Synthetic issue note: I can see the Round 1 page, but I want to confirm whether the response was submitted successfully.
```

Observer checks:

- PI/admin sees the note.
- PI/admin responds.
- SYN-P003 sees the response.
- Other participants do not see identity-linked support information.

Status: PASS through API for SYN-P003 issue note, staff response, and participant-visible response. Other-participant negative visibility check NOT RUN.

## Round 2 Instructions

1. Open the assigned synthetic invitation link or reload the current invitation session.
2. Confirm Round 2 is the active task.
3. Review each structured item.
4. Submit ratings and rationales using the deterministic fixture values.
5. Confirm the save/submit state is clear.
6. Confirm no participant identity leak is visible.

Status: PASS through API. Manual browser invitation/session path NOT RUN.

## Round 3 Instructions

1. Open the assigned synthetic invitation link or reload the current invitation session.
2. Confirm controlled feedback is visible if implemented.
3. Confirm feedback is aggregate, neutral, and non-coercive.
4. Re-rate or revise rationales.
5. At least SYN-P005 and SYN-P008 should retain disagreement or minority ratings where appropriate.
6. Confirm the UI allows retaining disagreement without stigma.

Forbidden language to watch for:

- outlier
- deviant
- wrong
- align with the group
- group is correct
- consensus proves

Status: PASS through API. Manual browser invitation/session path NOT RUN.

## Round 4 Instructions

1. Open the assigned synthetic invitation link or reload the current invitation session.
2. Confirm Round 4 is the final controlled feedback or final-rating/stability round.
3. Submit final ratings/rationales.
4. Confirm final submit state is clear.
5. Confirm no dead end appears after submission.

Status: PASS through API. Manual browser invitation/session path NOT RUN.

## Mobile-Width Participant Checks

Repeat the highest-risk steps at 320px, 390px, and 414px:

- Consent/acknowledgement.
- Round 1 submission.
- Support note.
- Round 2 rating/rationale.
- Round 3 re-rating.
- Round 4 final rating.
- Final submit state.

Record:

- Hidden or inaccessible buttons.
- Clipped text.
- Horizontal scrolling.
- Textboxes that cannot be used.
- Ambiguous save/submit states.
- Any layout that makes completion impossible.

Status: PARTIAL PASS WITH CONDITION. Headless browser smoke passed at 320px, 390px, and 414px for inspected participant final-result and staff dashboard views. The full manual mobile submission flow across these high-risk steps remains NOT RUN.
