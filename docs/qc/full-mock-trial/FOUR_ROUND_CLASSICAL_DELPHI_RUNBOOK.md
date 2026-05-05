# Four-Round Classical Delphi Runbook

Live execution status: CONTROLLED SYNTHETIC LOCAL RUN COMPLETED WITH CONDITIONS.

This runbook is for Study Owner / PI, Ethics & Methods Steward, PI/admin support role, and observer use during controlled synthetic rehearsal. API-driven workflow evidence and headless browser/mobile smoke evidence were recorded on 2026-05-05; a manual all-8 browser UI submission pass remains required only as a documented condition for broader rehearsal confidence.

## Repository Support Confirmed During Inspection

- Classical Delphi is an available method.
- Classical Delphi maps to 4 planned rounds and terminal round 4 in frontend wizard logic and backend study design logic.
- Backend rating rounds allow rounds 2, 3, and 4 for `ClassicDelphi`.
- Modified Delphi maps to 3 rounds and is not the target method for this package.
- Round lifecycle gates require previous rounds to close before later curation/opening.
- Consensus rule changes are blocked once the StudyVersion is no longer Draft.

## Pre-Launch Governance

1. Create or open the synthetic study.
2. Select Classic Delphi.
3. Confirm the design packet records 4 planned rounds and terminal round 4.
4. Enter the fictional community garden scheduling app study fields.
5. Configure the PI-defined consensus rule before launch: 80% agreement at rating 7+.
6. Confirm consent, confidentiality limits, voluntariness, withdrawal, retention, and identity-response separation content.
7. Confirm AI disclosure says no live external AI and human approval is required for any AI suggestion.
8. Obtain required governance signoff before activation/opening.
9. Attempt to change the consensus rule after activation and verify it is locked or requires a governed new version.

Status: PASS through API for setup, activation, governance signoff, and consensus lock checks. Browser-visible governance copy was only smoke-checked, not manually walked by all roles.

## Round 1: Open-Ended Elicitation

Owner actions:

1. Configure Round 1 as open text.
2. Open Round 1.
3. Generate or distribute synthetic invitation links.
4. Monitor submissions from all 8 synthetic participants.
5. Confirm all Round 1 responses are visible to staff in role-appropriate form.
6. Confirm participant-facing views do not expose other participants' identities.
7. Close Round 1 only after all expected submissions or documented synthetic non-response decisions.

Participant actions:

- Submit assigned open-ended responses.
- SYN-P003 submits support issue note.

Evidence:

| Evidence | Status |
| --- | --- |
| Round 1 opened | PASS API |
| 8 submissions received | PASS API |
| Consent gate verified | PASS API; browser gate NOT RUN |
| Support note submitted and answered | PASS API |
| Identity leak check | PASS API for participant-facing mapping; browser UI NOT RUN |

## Round 1 To Round 2 Curation

Owner/steward actions:

1. Review Round 1 responses.
2. Use manual curation, documentation-only deterministic AI fixtures, or an existing deterministic local helper path that is verified as synthetic-only and no-external-AI.
3. Preserve singleton/minority statements for review.
4. Confirm any AI output is labeled `AI Suggestion (Not Final)`.
5. Confirm AI output requires human Accept/Edit/Reject before materialization.
6. Confirm provenance/source-response links where implemented.
7. Publish only human-approved items.
8. Confirm curation actions are auditable where implemented.

Status: PASS through existing deterministic local helper path with human curation and signoff.

## Round 2: Structured Rating

Owner actions:

1. Configure Round 2 as a rating round.
2. Confirm controlled feedback settings are neutral and allowed.
3. Open Round 2 only after Round 1 is closed and traceable items are published.
4. Monitor all 8 synthetic participants' ratings/rationales.
5. Close Round 2 when complete.

Participant actions:

- Submit ratings/rationales for each approved item.

Evidence:

| Evidence | Status |
| --- | --- |
| Round 2 opened | PASS API |
| 8 participants completed | PASS API |
| Save/submit states clear | PASS API; browser UI NOT RUN |
| No identity leak observed | PASS API for participant-facing mapping; browser UI NOT RUN |
| Round 2 closed | PASS API |

## Round 2 To Round 3 Feedback

Owner/steward actions:

1. Generate or review controlled feedback from Round 2.
2. If AI/mock AI drafts narrative feedback, treat it as advisory.
3. Confirm human approval before participant-facing release.
4. Confirm feedback includes aggregate information only.
5. Confirm feedback permits retain or revise with equal weight.
6. Confirm no pressure to converge.

Status: PASS through API with human-reviewed controlled feedback.

## Round 3: Re-Rating And Rationale Revision

Owner actions:

1. Carry forward or curate traceable Round 3 items.
2. Open Round 3 only after Round 2 is closed.
3. Confirm participants can view controlled feedback.
4. Monitor all 8 synthetic submissions.
5. Confirm at least two participants retain minority or disagreeing ratings.
6. Close Round 3 when complete.

Evidence:

| Evidence | Status |
| --- | --- |
| Round 3 opened | PASS API |
| Controlled feedback visible | PASS API; browser UI NOT RUN |
| 8 participants completed | PASS API |
| Disagreement retained without stigma | PASS API; browser UI NOT RUN |
| Round 3 closed | PASS API |

## Round 3 To Round 4 Feedback

Owner/steward actions:

1. Generate or review second controlled feedback cycle.
2. Confirm AI/mock AI does not recommend changing consensus thresholds.
3. Confirm AI/mock AI does not recommend dropping dissenting items solely because they are minority views.
4. Confirm any summary remains human-reviewed and non-binding.

Status: PASS through API.

## Round 4: Final Rating/Stability Round

Owner actions:

1. Carry forward or curate traceable Round 4 items.
2. Open Round 4 only after Round 3 is closed.
3. Monitor all 8 synthetic final ratings/rationales.
4. Confirm final participant submit state.
5. Close Round 4.
6. Confirm terminal close creates final result evidence where implemented.

Evidence:

| Evidence | Status |
| --- | --- |
| Round 4 opened | PASS API |
| 8 participants completed | PASS API |
| Final submit state clear | PASS API; browser UI NOT RUN |
| No participant dead ends | PASS API; browser UI NOT RUN |
| Terminal round closed | PASS API |

## Final Report And Export

Owner/steward/data-custodian actions:

1. Generate final report/export package.
2. Confirm consensus threshold is included.
3. Confirm consensus, near-consensus, and non-consensus items are included where applicable.
4. Confirm dissent and methodological uncertainty are preserved.
5. Confirm required limitation language appears exactly:

"Consensus indicates agreement among this panel; it does not establish correctness."

6. Confirm report does not frame consensus as truth.
7. Run export privacy check.
8. Review export package and record approval/rejection notes.

Status: PASS after focused remediation regression for regenerated de-identified exports. The original API run failed export privacy, but the P0 is now remediated in regression evidence. Manual all-8 browser UI submission remains a P2 condition.
