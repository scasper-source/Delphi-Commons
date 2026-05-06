# Live Run Results

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

- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T17-13-46-275Z.json`
- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-latest.json`

Historical API-driven artifacts:

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-06T14-18-57-949Z.json`
- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T21-34-02-906Z.json`
- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-latest.json`

Prior blocked attempt (environment/startup):

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T21-28-25-629Z-failed.json`

Mobile screenshots:

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
| Commit hash | `9df7f75af31a152db46729d1bb60ae22a2af2c68` |
| Branch | `master` |
| Run timestamp | `2026-05-06T17:13:46.275Z` |
| Backend URL | `http://127.0.0.1:3001` |
| Backend health | `{"status":"ok","service":"edelphi-server","environment":"development"}` |
| Frontend URL | `http://127.0.0.1:5173` |
| Study ID | `255f09b8-f750-48ff-ba26-ead58965b75b` |
| Version ID | `f6a662e6-6722-498c-9d07-501b2f8f7f77` |
| AI mode | Existing deterministic local AI helpers; No External AI mode |

Note: this rerun used the local development backend and frontend at the documented local URLs. It included browser UI automation for all participant submissions. The run was performed from the listed local HEAD with uncommitted rehearsal/remediation changes in the working tree; commit after review is recommended before treating the artifact as reproducible from a clean checkout. The runner respected default local rate limiting with recorded retry/backoff events during compressed automation.

## Commands And Checks

| Command/check | Result |
| --- | --- |
| `cd server; npm.cmd run build` | PASS |
| `cd app; npm.cmd run build` | PASS |
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
| `final-delphi-report` | `c48cf948-7d4a-417c-b3d2-0e80a1fe8360` | deidentified_research_report | 0 | 0 | PASS |
| `anonymized-response-dataset` | `539c7ec5-6bb1-4514-9d84-1c6d6dbdd367` | deidentified_research_report | 0 | 0 | PASS |
| `audit-package` | `a6d27173-ab7a-4330-9a5b-bd2b5c720c7e` | restricted_internal_admin_audit | 0 | 17 | PASS WITH RESTRICTED WARNINGS |
| `provenance-bundle` | `4ba988da-5aae-4024-8f81-dd9226bd090c` | deidentified_research_report | 0 | 0 | PASS |
| `complete-archive` | `6ff98504-f84b-4d5a-bbec-0608826887f4` | complete_restricted_archive | 0 | 35 | PASS WITH RESTRICTED WARNINGS |

Required limitation found exactly:

"Consensus indicates agreement among this panel; it does not establish correctness."

## Defects

| Severity | Count | Notes |
| --- | ---: | --- |
| P0 | 0 | No P0 remains from the rerun. |
| P1 | 0 | No P1 recorded. |
| P2 | 1 | Mobile final closeout at 320px had horizontal overflow. |
| P3 | 0 | No P3 recorded. |

## Decision

GO WITH CONDITIONS for controlled synthetic mock testing only.

This does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data.
