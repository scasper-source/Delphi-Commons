# Live API Run Results

Run date: 2026-05-05

Live execution status: API-DRIVEN LOCAL RUN COMPLETED; EXPORT PRIVACY REMEDIATION VERIFIED; FULL BROWSER/MOBILE RUN NOT COMPLETED.

Final decision from original API run: NO-GO.

Current post-remediation status: P0 export privacy defect remediated; ready to rerun full browser/mobile controlled synthetic mock trial.

## Scope Actually Executed

This was a controlled synthetic local development run through backend APIs. It exercised the full 8-participant, 4-round Classical Delphi lifecycle, support-loop API path, governed AI suggestion path, final report generation, export package generation, and export privacy scanning.

It was not a full manual browser rehearsal. It did not complete the required mobile-width checks at 320px, 390px, or 414px.

## Environment

| Field | Value |
| --- | --- |
| Commit hash | `f4ff08b` |
| Branch | `master` |
| Run timestamp captured | `2026-05-05T12:23:15.0179669-04:00` |
| Evidence update timestamp | `2026-05-05T12:24:42.5791970-04:00` |
| Backend URL | `http://127.0.0.1:3001` |
| Backend health | `{"status":"ok","service":"edelphi-server","environment":"development"}` |
| Frontend URL | `http://127.0.0.1:5173/` |
| Environment | Local development |
| Browser/manual run | NOT RUN |
| Mobile widths | NOT RUN |
| Study ID | `cd8d8653-e9a7-48d8-8077-ad2c3c2966a2` |
| Version ID | `94949d0c-999b-4703-a544-961ccecfcdc6` |

## Commands And Checks

| Command/check | Result | Notes |
| --- | --- | --- |
| `git status --short` | PASS | Existing documentation changes present. |
| `git rev-parse --short HEAD` | PASS | `f4ff08b`. |
| `git branch --show-current` | PASS | `master`. |
| `Get-Date -Format o` | PASS | Timestamp captured. |
| Backend health request | PASS | Local server reported development environment. |
| Local Node API rehearsal runner | PASS WITH DEFECTS | Completed lifecycle and export scan; P0 defect found. |
| App build/lint/tests | NOT RUN | Documentation/evidence update only after live API run. |
| Server build/tests | NOT RUN | Documentation/evidence update only after live API run. |

An earlier API runner attempt reached Round 1, then failed during AI item materialization because the runner sent `human_rationales` where the backend expects `rationales`. The corrected runner continued the same synthetic study with fresh invitations. This was a runner payload correction, not a product defect.

## Lifecycle Results

| Check | Result | Evidence |
| --- | --- | --- |
| Classical Delphi selected | PASS | `study_format: ClassicDelphi`. |
| Planned round count | PASS | 4 planned rounds. |
| Terminal round | PASS | Round 4 terminal. |
| Round 1 completion | PASS | 8/8 synthetic participants submitted. |
| Round 2 completion | PASS | 8/8 synthetic participants submitted ratings/rationales. |
| Round 3 completion | PASS | 8/8 synthetic participants submitted re-ratings/rationales. |
| Round 4 completion | PASS | 8/8 synthetic participants submitted final ratings/rationales. |
| Support loop | PASS | SYN-P003 submitted issue note; PI/admin saw and responded; SYN-P003 saw response. |
| Consensus rule locked after activation | PASS | Backend returned `consensus_rule_locked`. |
| Consensus rule locked after Round 2 | PASS | Backend returned `consensus_rule_locked`. |
| Consensus rule locked after Round 3 | PASS | Backend returned `consensus_rule_locked`. |
| Browser participant workflow | NOT RUN | API-driven run only. |
| Mobile participant workflow | NOT RUN | 320px, 390px, and 414px checks not completed. |

## AI Results

AI mode used: existing deterministic local AI helpers with No External AI mode.

| Check | Result | Evidence |
| --- | --- | --- |
| No live external AI calls | PASS | Run used local deterministic helper path only. |
| AI output labeled non-final | PASS | Suggestions labeled `AI Suggestion (Not Final)`. |
| Human decision required before item materialization | PASS | Corrected runner used human curation decisions before publishing. |
| Human signoff before participant-facing release | PASS | Owner and Methods Steward signoffs were used before release. |
| AI decided consensus | PASS | No evidence that AI decided consensus. |
| AI decided final wording without human approval | PASS | No evidence; generated suggestions required human decisions/signoff. |
| External AI boundary | PASS | No External AI mode used. |

## Final Report Results

| Field | Value |
| --- | --- |
| Report stage | `final` |
| Study format | `ClassicDelphi` |
| Planned round count | 4 |
| Terminal round number | 4 |
| Final round number | 4 |
| Published final-round item count | 4 |
| Consensus item count | 1 |
| Near-consensus item count | 0 |
| Non-consensus item count | 3 |
| Round 1 response count | 8 |
| Final-round submission count | 32 |
| Round response rates | 100% for all four rounds |
| Required limitation present | PASS |

Required limitation found:

"Consensus indicates agreement among this panel; it does not establish correctness."

## Export Packages Scanned

Generated package types and IDs:

| Package type | Package ID |
| --- | --- |
| `final-delphi-report` | `6576f5a1-878e-4b77-82c5-b59878c0f18e` |
| `anonymized-response-dataset` | `f15be872-9c69-4f6c-b7eb-9638904737d6` |
| `audit-package` | `20881b37-1ddd-41c0-a9ee-45eb1730be54` |
| `provenance-bundle` | `6b2340c2-dd67-47fe-a6cd-c8b21f28f0b8` |
| `complete-archive` | `c6e855fa-f8c9-4bb8-ba37-a622bec241d8` |

Scan summary:

| Check | Result |
| --- | --- |
| Export files scanned | 48 |
| Required limitation present | PASS |
| Forbidden consensus-as-truth terms | 0 observed |
| Synthetic identifier/raw participant ID hits | 40 observed |
| Direct-identifier field-name hits | 10 observed |

P0 finding:

Generated export package files included synthetic participant labels in exported rationale text and raw participant UUIDs in audit package files. The synthetic labels came from test-runner rationale text, but the export path still demonstrates that free-text self-identifiers can pass into exports. Raw participant UUIDs in audit exports are a separate structural privacy concern for a controlled full mock trial.

Representative files with observed hits:

- `anonymized-response-dataset/ratings.csv`
- `audit-package/audit_events.csv`
- `audit-package/audit_events.json`
- `anonymized-response-dataset/data_dictionary.txt`
- `anonymized-response-dataset/redaction_manifest.csv`
- `anonymized-response-dataset/responses.csv`
- `provenance-bundle/item_transformation_history.csv`
- `complete-archive/anonymized_dataset.json`
- `complete-archive/items_and_provenance.json`

## Defects

| ID | Severity | Status | Summary |
| --- | --- | --- | --- |
| FMT-2026-05-05-P0-001 | P0 | REMEDIATED | Export package files contained synthetic participant labels and raw participant UUIDs in the original run; regenerated regression exports now pass de-identified privacy scans. |
| FMT-2026-05-05-P2-001 | P2 | OPEN | Full manual browser and mobile-width rehearsal still NOT RUN. |

## Decision

Original run decision: NO-GO.

Current post-remediation status: P0 export privacy defect remediated; ready to rerun full browser/mobile controlled synthetic mock trial.

A full browser/mobile pass remains required before any GO or GO WITH CONDITIONS for the larger controlled full mock trial.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."
