# Focused Regression After Multi-Question Support

Date: 2026-05-05

Status: PASS for focused automated local regression.

Boundary statement:

> Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data.

## Scope

This was a focused regression after Phase 1A multi-research-question support. It was not a full manual all-participant browser trial.

Covered:

- multi-question Study Builder packet behavior
- Round 1 participant submission with separate answers keyed by `researchQuestionId`
- legacy one-question compatibility through existing tests
- curation compatibility with separate Round 1 answers
- deterministic AI suggestion gate remains human-reviewed before item materialization
- Round 2 participant item retrieval after multi-question curation
- feedback statistics output, including median, Q1, Q3, IQR, and distribution
- report language and required consensus limitation statement
- de-identified export privacy scans
- ordered research-question export files
- Round 1 response counts grouped by research question
- adversarial free-text identifiers and spreadsheet formula-like text in multi-question responses
- identity-separation checks in participant context and de-identified exports

Not covered:

- full manual all-8-participant browser UI submission pass
- full mobile manual pass through every multi-question participant step
- production deployment
- real participant data

## Commands Run

```powershell
cd server
npm.cmd test -- ratingStats.test.mjs roadtest.test.mjs zzExportPrivacy.test.mjs
node --test tests\zzzMultiQuestionFocusedRegression.mjs
```

```powershell
cd app
npm.cmd test -- policyGates.test.mjs
```

The isolated focused regression runner is intentionally named `zzzMultiQuestionFocusedRegression.mjs`, not `*.test.mjs`, because the backend test harness uses `--test-isolation=none`; this focused test creates its own synthetic runtime and must not mutate the default wildcard test process environment.

## Focused Regression Result

Automated focused regression: PASS.

The focused runner verified:

- 3 active research questions were exposed in participant invitation context.
- Round 1 blocked submission before active consent.
- Each synthetic participant submitted three separate Round 1 answers.
- Adversarial Round 1 text included synthetic labels, example.test emails, phone-like strings, UUID-like strings, script-like text, prompt-injection text, and spreadsheet formula-like text.
- Deterministic AI curation saw separate answers from all three research questions.
- AI item materialization was blocked before human decision.
- Study Owner manually curated safe Round 2 items with provenance back to Round 1 responses.
- Participant Round 2 item payloads did not expose other participants' identifiers.
- Direct feedback output included expected median, Q1, Q3, IQR, response count, and distribution.
- Round 2 report included the required limitation statement.
- Report language did not include tested coercive/consensus-as-correctness phrases.
- De-identified export packages passed privacy scanning.
- CSV formula-like cells were neutralized in scanned exports.
- `research_questions.csv`, `round1_response_counts_by_question.csv`, and `responses.csv` preserved research-question grouping.
- De-identified exports did not expose known synthetic labels, emails, or raw participant IDs.

## Findings

P0: none.

P1: none.

P2: full manual browser and full mobile pass remain outside this focused regression.

P3: keep the focused regression runner available for future multi-question changes.

## Current Interpretation

The focused normal and adversarial regression requested after multi-question support has been completed through automated local checks. The result supports continued controlled synthetic mock testing.

This result does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data.

