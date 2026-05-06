# Live Run Results

## Update: 2026-05-06 Windows Focused Mobile Closeout Evidence

- Operator date/time (UTC): 2026-05-06T19:42:16Z to 2026-05-06T19:46:52Z.
- Clean GitHub checkout branch/commit: `codex/windows-focused-mobile-closeout-evidence-results` / `1dfcef9635c55fe724fa9b050fd413c7569a73c9`.
- Disposable runtime paths used: `%TEMP%\delphi-commons-mobile-evidence-data`, `%TEMP%\delphi-commons-mobile-evidence-audit`, and `%TEMP%\delphi-commons-mobile-evidence-backups`.
- Backend health check: PASS at `http://127.0.0.1:3001/health`.
- Frontend availability check: PASS at `http://127.0.0.1:5173/` (HTTP 200).
- Execution command: `node docs\qc\full-mock-trial\run_manual_browser_mock_trial_local.mjs`.
- New artifact: `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T19-42-16-959Z.json` (and `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-latest.json`).
- Focused screenshots: `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T19-42-16-959Z-320.png`, `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T19-42-16-959Z-390.png`, `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T19-42-16-959Z-414.png`.

Focused mobile result:

| Check | 320px | 390px | 414px |
| --- | --- | --- | --- |
| Participant Portal reachable | PASS | PASS | PASS |
| Closeout reachable | PASS | PASS | PASS |
| Required limitation visible exactly | PASS | PASS | PASS |
| Synthetic participant labels visible | PASS: none observed | PASS: none observed | PASS: none observed |
| `example.test` emails visible | PASS: none observed | PASS: none observed | PASS: none observed |
| Raw participant-linkable IDs visible | PASS: none observed in inspected closeout DOM text | PASS: none observed in inspected closeout DOM text | PASS: none observed in inspected closeout DOM text |
| Identity-response mapping visible | PASS: none observed | PASS: none observed | PASS: none observed |
| Consensus-as-truth language | PASS: none observed | PASS: none observed | PASS: none observed |
| Coercive convergence language | PASS: none observed | PASS: none observed | PASS: none observed |
| Page-level horizontal overflow | FAIL/P2: detected | PASS | PASS |
| Buttons/navigation usable | PASS | PASS | PASS |
| Text readable without zoom | PASS WITH CONDITION | PASS | PASS |

The 320px horizontal-overflow condition remains open as P2. The runner reports page-level overflow with `document.documentElement.scrollWidth > document.documentElement.clientWidth + 1`; the likely affected area is the participant final closeout content/cards region at 320px. The screenshot did not show privacy leakage, missing limitation language, or workflow blockage.


## Update: 2026-05-06 Browser UI Automation Mock-Trial Pass

- Operator date/time (UTC): 2026-05-06T17:13:46Z.
- Branch/commit recorded by artifact: `master` / `9df7f75af31a152db46729d1bb60ae22a2af2c68`.
- Backend health check: PASS at `http://127.0.0.1:3001/health`.
- Frontend availability check: PASS at `http://127.0.0.1:5173/`.
- Execution command: `node docs\qc\full-mock-trial\run_manual_browser_mock_trial_local.mjs`.
- New artifact: `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T17-13-46-275Z.json` (and `.../manual-browser-mock-trial-run-latest.json`).
- Historical API-driven artifact retained: `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-06T14-18-57-949Z.json`.

Run date: 2026-05-06

Live execution status: CONTROLLED SYNTHETIC LOCAL RERUN COMPLETED WITH CONDITIONS.

Current decision: GO WITH CONDITIONS for controlled synthetic mock testing only.

The latest run completed an 8-synthetic-participant, 4-round Classical Delphi lifecycle with all participant Round 1, Round 2, Round 3, and Round 4 submissions made through a local Microsoft Edge browser UI automation pass. Study setup, curation, round progression, staff support response, final-results release, and export/package generation used local development APIs. Mobile-width browser checks covered 320px, 390px, and 414px. The prior API-driven rerun evidence remains retained. The remaining condition is a non-blocking 320px horizontal-overflow finding in the final participant closeout view.

## Boundary

Synthetic data only. Local development only. No production deployment. No real human-subjects research. No IRB launch. No sensitive participant data. No live external AI calls.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Evidence Artifact

Latest primary artifact:

- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T19-42-16-959Z.json`
- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-latest.json`

Historical browser/API-driven artifacts:

- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T17-13-46-275Z.json`

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-06T14-18-57-949Z.json`
- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T21-34-02-906Z.json`
- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-latest.json`

Prior blocked attempt (environment/startup):

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T21-28-25-629Z-failed.json`

Mobile screenshots:

- `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T19-42-16-959Z-320.png`
- `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T19-42-16-959Z-390.png`
- `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T19-42-16-959Z-414.png`
- `docs/qc/full-mock-trial/artifacts/manual-browser-final-SYN-P001-320.png`
- `docs/qc/full-mock-trial/artifacts/manual-browser-final-SYN-P001-390.png`
- `docs/qc/full-mock-trial/artifacts/manual-browser-final-SYN-P001-414.png`
- `docs/qc/full-mock-trial/artifacts/manual-browser-r1-SYN-P001.png`
- `docs/qc/full-mock-trial/artifacts/manual-browser-r2-SYN-P002.png`
- `docs/qc/full-mock-trial/artifacts/manual-browser-r3-SYN-P007.png`
- `docs/qc/full-mock-trial/artifacts/manual-browser-r4-SYN-P008.png`

## Environment

| Field | Value |
| --- | --- |
| Commit hash | `1dfcef9635c55fe724fa9b050fd413c7569a73c9` |
| Branch | `codex/windows-focused-mobile-closeout-evidence-results` |
| Run timestamp | `2026-05-06T19:42:16.959Z` |
| Backend URL | `http://127.0.0.1:3001` |
| Backend health | `{"status":"ok","service":"edelphi-server","environment":"development"}` |
| Frontend URL | `http://127.0.0.1:5173` |
| Study ID | `11bc1b5f-f6bf-4f4a-a81b-debfd0cc379e` |
| Version ID | `20dc37a6-2a1e-4ed5-a8bb-54f8787e90a6` |
| AI mode | Existing deterministic local AI helpers; No External AI mode |

Note: this rerun used the clean GitHub checkout, disposable local runtime paths, and the local development backend/frontend at the documented local URLs. It included browser UI automation for all participant submissions. The run was performed before this evidence/docs commit, with no production data and no code remediation in this branch. The runner respected default local rate limiting with recorded retry/backoff events during compressed automation.

## Commands And Checks

| Command/check | Result |
| --- | --- |
| `cd server; npm.cmd install` | PASS |`r`n| `cd server; npm.cmd run build` | PASS |`r`n| `cd server; npm.cmd test` | PASS |
| `cd app; npm.cmd install` | PASS |`r`n| `cd app; npm.cmd run build` | PASS |`r`n| `cd app; npm.cmd test` | PASS |
| Start backend from `server/dist/index.js` | PASS |
| Start frontend dev server on `127.0.0.1:5173` | PASS |
| `node docs\qc\full-mock-trial\run_manual_browser_mock_trial_local.mjs` | PASS WITH CONDITIONS |
| Backend health check | PASS |
| Git metadata capture | PASS |

## Lifecycle Results

| Check | Result |
| --- | --- |
| Classical Delphi selected | PASS |
| Planned rounds | PASS: 4 |
| Terminal round | PASS: Round 4 |
| Consent gate before Round 1 submission | PASS |
| Round 1 completion | PASS: 8/8 synthetic participants |
| Round 2 completion | PASS: 8/8 synthetic participants |
| Round 3 completion | PASS: 8/8 synthetic participants |
| Round 4 completion | PASS: 8/8 synthetic participants |
| Round 1 browser UI submissions | PASS: 8/8 synthetic participants |
| Round 2 browser UI submissions | PASS: 8/8 synthetic participants |
| Round 3 browser UI submissions | PASS: 8/8 synthetic participants |
| Round 4 browser UI submissions | PASS: 8/8 synthetic participants |
| Retained disagreement/minority ratings | PASS: SYN-P007 and SYN-P008 retained disagreement patterns |
| Support loop | PASS |
| Consensus rule locked after activation | PASS |
| Consensus rule locked after Round 2 | PASS |
| Consensus rule locked after Round 3 | PASS |
| Final results released to participant invitation view | PASS |

## Browser And Mobile Scope

| Check | Result |
| --- | --- |
| Participant browser UI submission pass | PASS: 8 participants x 4 rounds |
| Mobile-width participant checks at 320px | PASS WITH CONDITION: final closeout limitation visible and identifiers redacted; horizontal overflow detected |
| Mobile-width participant checks at 390px | PASS |
| Mobile-width participant checks at 414px | PASS |
| Synthetic participant labels/emails in inspected final closeout DOM text | PASS: none observed after remediation |
| Human-observed manual click-through | NOT RUN: this pass used local browser automation |

Condition: participant submissions were exercised through the local browser UI, but study setup, curation, round progression, staff response, final release, and export generation used local APIs. The pass was automated rather than human-observed manual clicking.

## AI Results

| Check | Result |
| --- | --- |
| No live external AI calls | PASS |
| No External AI mode | PASS |
| AI output labeled non-final | PASS |
| Human Accept/Edit/Reject before materialization | PASS |
| Owner and Methods Steward signoff before publication | PASS |
| AI decided consensus/final wording | PASS: no evidence observed |

## Export Results

| Package type | Package ID | Classification | Scan failures | Scan warnings | Required limitation |
| --- | --- | --- | ---: | ---: | --- |
| `final-delphi-report` | `abd662eb-8a7c-400f-8cf3-1e444004a2fb` | deidentified_research_report | 0 | 0 | PASS |
| `anonymized-response-dataset` | `6e4d561a-b048-460c-905a-411c774b51dc` | deidentified_research_report | 0 | 0 | PASS |
| `audit-package` | `8edeeee2-fb41-4aa1-b621-c940815aed89` | restricted_internal_admin_audit | 0 | 17 | PASS WITH RESTRICTED WARNINGS |
| `provenance-bundle` | `8900b6fd-cf9c-459f-bf3c-f3668c9a0eb0` | deidentified_research_report | 0 | 0 | PASS |
| `complete-archive` | `cf51550b-d950-4ba4-9d56-568f107a89b1` | complete_restricted_archive | 0 | 35 | PASS WITH RESTRICTED WARNINGS |

Required limitation found exactly:

"Consensus indicates agreement among this panel; it does not establish correctness."

## Defects

| Severity | Count | Notes |
| --- | ---: | --- |
| P0 | 0 | No P0 remains from the rerun. |
| P1 | 0 | No P1 recorded. |
| P2 | 1 | Mobile final closeout at 320px still had horizontal overflow in the focused Windows rerun. |
| P3 | 0 | No P3 recorded. |

## Decision

GO WITH CONDITIONS for controlled synthetic mock testing only.

This does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data.
