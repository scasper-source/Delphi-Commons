# Governance And AI Check

Live execution status: API-DRIVEN LOCAL RUN COMPLETED; FULL BROWSER/MOBILE RUN NOT COMPLETED.

This checklist records what was verified through the 2026-05-05 local API-driven run. UI-only and mobile-only checks remain NOT RUN until a manual browser rehearsal is completed.

## Study Governance Checks

| Check | Expected | Result |
| --- | --- | --- |
| Study uses Classic Delphi | Classic Delphi selected | PASS |
| Planned round count | 4 | PASS |
| Terminal round | 4 | PASS |
| Consensus threshold configured before launch | 80% at rating 7+ | PASS |
| Consensus source documented | PI-defined or explicitly documented alternative | PASS |
| Consensus rule locked after launch | Change blocked or governed new version required | PASS |
| Consensus rule locked after Round 2 | Change blocked or governed new version required | PASS |
| Consensus rule locked after Round 3 | Change blocked or governed new version required | PASS |
| Consent/acknowledgement gate required | Required before submission | PASS through API payload; browser gate NOT RUN |
| Voluntariness visible | Participants can decline/withdraw where implemented | NOT RUN |
| Confidentiality limits truthful | No false anonymity promise | NOT RUN |
| Identity-response separation represented accurately | No participant-facing identity mapping | PASS through API path; browser UI NOT RUN |
| Non-consensus preserved | Report/export retains non-consensus | PASS |
| Required limitation exact | Present in report/export | PASS |
| Export privacy safe | No direct identifiers or identity-response mapping risk | PASS after focused remediation regression; full browser rerun NOT RUN |

## AI Configuration Checks

| Check | Expected | Result |
| --- | --- | --- |
| AI mode recorded | none, documentation-only deterministic fixtures, existing mock AI, local AI, or external AI | PASS: existing deterministic local AI helpers |
| External AI disabled by default | Yes | PASS |
| No External AI mode active unless explicitly changed | Yes | PASS |
| AI feature permissions intentional | Enabled only for safe synthetic/mock test if used | PASS |
| No live external AI calls | Yes | PASS |
| No new AI integration | Yes | PASS |
| AI disclosure visible if AI simulated in UI | Yes, where implemented | NOT RUN |
| AI output labeled non-final | `AI Suggestion (Not Final)` or equivalent | PASS |
| Human Accept/Edit/Reject required | Required before study content changes | PASS |
| Human approval before participant-facing release | Required | PASS |
| AI cannot decide consensus | Confirmed | PASS |
| AI cannot decide item inclusion/exclusion alone | Confirmed | PASS |
| AI cannot decide final wording alone | Confirmed | PASS |

## AI Payload Privacy Checks

| Check | Expected | Result |
| --- | --- | --- |
| Direct identifiers excluded | No names, emails, phone numbers, contact details | PASS for live AI path used |
| Identity-response mappings excluded | No master list or mapping table | PASS for live AI path used |
| Consent records with identifiers excluded | Excluded | PASS for live AI path used |
| API keys and provider secrets excluded | Excluded | PASS |
| Synthetic response excerpts only | If AI fixture uses response text | PASS |
| Aggregate-only feedback input | For controlled feedback narrative | PASS |

## AI Governance Behavior Checks

| Behavior | Expected | Result |
| --- | --- | --- |
| Clustering preserves minority/singleton statements | Preserved or reviewable | PASS through deterministic suggestion path |
| Item drafting has provenance/source links where implemented | Present or limitation documented | PASS |
| Neutrality linting advisory only | Human decides | PASS through governed suggestion path |
| Feedback narrative neutral | No pressure to converge | PASS |
| Final report assistance preserves non-consensus | Yes | PASS |
| External AI boundary clear | No ambiguity | PASS |

## Forbidden AI/Feedback Language

Record any occurrence as at least P1, and as P0 if participant-facing or export/report language frames consensus as truth or pressures convergence.

- You should align with the group.
- The group is correct.
- Consensus proves the answer.
- Outliers should reconsider.
- Correct answer.
- Deviant.
- Wrong.
- Optimize consensus.
- Fix disagreement.

Observed forbidden consensus-as-truth hits in export scan: 0.

## Current Result

Governance and AI-HITL checks passed through the API-driven local run, with two important limits:

- Full browser-visible governance copy and participant-facing UI checks remain NOT RUN.
- Original export privacy failed with P0; focused remediation regression now passes for regenerated de-identified exports. Browser/mobile rerun remains required before any GO or GO WITH CONDITIONS for the larger controlled full mock trial.
