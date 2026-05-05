# Simulated AI Rehearsal

Live execution status: CONTROLLED SYNTHETIC LOCAL RUN COMPLETED WITH CONDITIONS.

AI mode observed in the API-driven run: existing deterministic local AI helpers with No External AI mode.

No live external AI calls were used. No new AI integration was added for this rehearsal.

## Repository AI Findings From Inspection

- The study AI connector default is No External AI mode.
- External AI is disabled by default.
- AI feature permissions default to disabled.
- External AI validation blocks No External AI mode, missing provider/model/key configuration, and direct-identifier payload risks.
- Existing local deterministic helper routes include inter-round synthesis behavior with model IDs such as `deterministic_mvp_synthesizer`.
- Existing AI suggestion records use the label `AI Suggestion (Not Final)`.
- Existing AI suggestion decisions include Accepted, Edited, and Rejected.
- Materializing AI candidate items requires a prior human decision.
- Participant-facing release gates can require Owner and Methods Steward signoff.

The 2026-05-05 API-driven run exercised the existing deterministic local helper path. Browser-visible AI disclosure checks remain NOT RUN.

## Planned AI Boundary

| Boundary check | Planned expected result | Live result |
| --- | --- | --- |
| External AI active by default | No | PASS |
| No External AI mode active | Yes, unless explicitly changed for a synthetic-only future test | PASS |
| Direct identifiers sent to AI | No | PASS |
| Identity-response mapping sent to AI | No | PASS |
| AI can publish participant-facing content without human approval | No | PASS |
| AI can decide consensus | No | PASS |
| AI can decide final wording without human approval | No | PASS |

## Fixture 1: Round 1 Clustering Suggestion

Label:

AI Suggestion (Not Final)

Input scope:

Anonymized synthetic Round 1 response excerpts only. No participant names, emails, phone numbers, master list, consent records, or identity-response mapping.

Deterministic fixture output:

```json
{
  "schema_version": "mock_ai_cluster_v1",
  "label": "AI Suggestion (Not Final)",
  "clusters": [
    {
      "cluster_id": "cluster-calendar-equipment",
      "theme": "Shared calendar and equipment scheduling",
      "source_ids": ["SYNTH-R1-001", "SYNTH-R1-007"],
      "minority_statement_preserved": false
    },
    {
      "cluster_id": "cluster-reminders-coverage",
      "theme": "Reminders and shift coverage",
      "source_ids": ["SYNTH-R1-002", "SYNTH-R1-003", "SYNTH-R1-005"],
      "minority_statement_preserved": true,
      "minority_note": "Quiet-hours concern must remain reviewable."
    },
    {
      "cluster_id": "cluster-accessible-printable",
      "theme": "Accessible, low-data, and printable views",
      "source_ids": ["SYNTH-R1-004", "SYNTH-R1-008"],
      "minority_statement_preserved": true
    },
    {
      "cluster_id": "cluster-weather-aware",
      "theme": "Weather-aware scheduling",
      "source_ids": ["SYNTH-R1-006"],
      "minority_statement_preserved": true
    }
  ],
  "safeguards": {
    "publication_requires_human_decision": true,
    "minority_statements_preserved": true,
    "identity_fields_excluded": true
  }
}
```

Checks:

- Human Accept/Edit/Reject required: PASS through API-driven local helper path.
- Minority/singleton statements preserved: PASS through deterministic suggestion path.
- Provenance or source links available where implemented: PASS.
- No coercive language: PASS; no forbidden consensus-as-truth terms observed in export scan.

## Fixture 2: Round 2 Item Drafting

Label:

AI Suggestion (Not Final)

Candidate items:

1. The app should provide a shared calendar for plots, watering shifts, and shared equipment.
2. The app should send configurable reminders for watering and shift coverage.
3. The app should support accessible, low-data, and printable scheduling views.
4. The app should incorporate weather-aware scheduling adjustments.

Required human actions:

- Accept, edit, or reject each candidate.
- Add rationale for any grouped or edited candidate.
- Confirm source-response links where implemented.
- Publish only after human approval and any required release signoff.

Live result: PASS through API-driven local helper path with human curation/signoff before release.

## Fixture 3: Neutrality Linting

Advisory-only linter input:

```text
Participants should align with the group by rating the shared calendar highly because the group is probably correct.
```

Expected deterministic finding:

```json
{
  "label": "AI Suggestion (Not Final)",
  "severity": "warning",
  "categories": ["leading_or_coercive_language", "consensus_pressuring"],
  "messages": [
    "Remove pressure to align with the group.",
    "Remove implication that the group is correct."
  ],
  "suggested_text": "Review the aggregate ratings and your prior response. You may retain or revise your rating."
}
```

Checks:

- Linter suggestion advisory only: PASS through governed suggestion path.
- Human decides final wording: PASS.
- Coercive source language not participant-facing: PASS through API evidence; browser UI NOT RUN.

## Fixture 4: Controlled Feedback Narrative

Allowed deterministic narrative:

```text
The prior round showed varied ratings. The median and distribution are provided to support reflection. You may keep your prior rating or revise it. Different views remain useful to the study.
```

Forbidden implications:

- You should align with the group.
- The group is correct.
- Consensus proves the answer.
- Outliers should reconsider.

Checks:

- Aggregate-only feedback: PASS through API-driven run.
- Human approval before release: PASS.
- No pressure to converge: PASS; no forbidden consensus-as-truth terms observed in export scan.

## Fixture 5: Final Report Assistance

Allowed deterministic summary:

```text
The synthetic panel reached consensus on some scheduling priorities and did not reach consensus on others. Non-consensus items are retained as part of the mock study findings. The result reflects agreement patterns in this synthetic panel only.
```

Required limitation:

"Consensus indicates agreement among this panel; it does not establish correctness."

Checks:

- Non-consensus and dissent preserved: PASS.
- Required limitation exact: PASS.
- AI does not frame consensus as truth: PASS.
- Human approval before final report text: PASS through API evidence.

## External AI Boundary Classification

If a future live run finds external AI active by default, classify as at least P1.

If any participant data, direct identifier, or identity-response mapping could be sent externally without explicit safe synthetic-only configuration and disclosure, classify as P0.

Current observed classification for the 2026-05-05 API-driven run: existing deterministic local AI helpers with No External AI mode. No external AI connector was used.
