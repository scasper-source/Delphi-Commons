# Accessibility Copy Review Log

**Project:** Delphi Commons
**Target:** WCAG 2.2 AA understandable content plus Delphi Commons charter language
**Date:** 2026-05-02

## Review Rules

Participant-facing copy should:

- Use short sentences where possible.
- Explain confidentiality without promising complete anonymity.
- Avoid coercive convergence language.
- Make “retain response” and “revise response” equally acceptable.
- Refer to consensus as panel agreement, not truth or correctness.
- State that AI assistance, if offered, is optional and non-directive.

Avoid:

- truth
- correct answer
- outlier
- deviant
- noncompliant participant
- move toward the group
- optimize consensus
- persuade
- fix disagreement

## Reviewed Copy

| Location | Copy reviewed | Result | Notes |
|---|---|---|---|
| Participant portal confidentiality | “Responses are confidential to research team members with approved access and are linked across rounds through participant IDs.” | Pass | Clear, accurate, does not promise complete anonymity. |
| Participant draft privacy | “Draft responses are not stored in browser local storage. If you type a response and try to leave before submitting, the browser will warn you.” | Pass | Plain and privacy-preserving. |
| Participant waiting state | “The next task will appear here when the research team opens the round and configures the participant task.” | Pass | Clear next-state explanation. |
| Participant rights | “Participation is voluntary. You may withdraw from future participation.” | Pass | Rights-oriented and plain. |
| Round 1 prompt instruction | “There is no expected answer, and disagreement or uncertainty is useful to the study.” | Pass | Non-coercive and methodologically appropriate. |
| Round 2 instruction | “Review each candidate statement independently. Retaining a submitted rating and revising a submitted rating are both acceptable choices.” | Pass | Preserves equal dignity for retain/revise. |
| Reporting statement | “Consensus indicates agreement among this panel; it does not establish correctness.” | Pass | Required limitation language present. |
| Controlled feedback guardrail | “Controlled feedback summarizes this panel’s responses. It does not define correctness and should not pressure any panelist to change a response.” | Pass | Neutral and non-coercive. |

## Automated Copy Evidence

`app/tests/policyGates.test.mjs` includes a forbidden-language test for participant-facing coercive terms.

## Follow-Up

- Plain-language reviewer should evaluate consent and withdrawal copy before real participant use.
- Add review of reminder emails/messages once they are generated as real communication artifacts.
- Add copy review for active Round 1 and Round 2 browser screenshots from a seeded dry run.
