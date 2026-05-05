# Live Run Results

Run date: 2026-05-05

Live execution status: CONTROLLED SYNTHETIC LOCAL RUN COMPLETED WITH CONDITIONS.

Current decision: GO WITH CONDITIONS for controlled synthetic mock testing only.

The run completed an 8-synthetic-participant, 4-round Classical Delphi lifecycle through local development APIs and participant invitation endpoints. It also completed headless browser smoke checks at 320px, 390px, and 414px for participant and staff views. It did not complete a manual all-8 browser UI submission pass.

## Boundary

Synthetic data only. Local development only. No production deployment. No real human-subjects research. No IRB launch. No sensitive participant data. No live external AI calls.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Evidence Artifact

Primary artifact:

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T17-11-47-924Z.json`
- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-latest.json`

Mobile screenshots:

- `docs/qc/full-mock-trial/artifacts/participant-final-320-320.png`
- `docs/qc/full-mock-trial/artifacts/participant-final-390-390.png`
- `docs/qc/full-mock-trial/artifacts/participant-final-414-414.png`
- `docs/qc/full-mock-trial/artifacts/staff-dashboard-320-320.png`
- `docs/qc/full-mock-trial/artifacts/staff-dashboard-390-390.png`
- `docs/qc/full-mock-trial/artifacts/staff-dashboard-414-414.png`

## Environment

| Field | Value |
| --- | --- |
| Commit hash | `9c046cc3594b4e78e607dc37f10989eb2186dfc0` |
| Branch | `master` |
| Run timestamp | `2026-05-05T17:11:47.924Z` |
| Backend URL | `http://127.0.0.1:3001` |
| Backend health | `{"status":"ok","service":"edelphi-server","environment":"development"}` |
| Frontend URL | `http://127.0.0.1:5173` |
| Study ID | `b8bc10f2-8a10-48b5-b82b-85e5d0053c48` |
| Version ID | `c2c42b39-d285-4ae8-9435-26c96529b0c3` |
| AI mode | Existing deterministic local AI helpers; No External AI mode |

Note: an older backend process was initially found on port 3001. It was stopped and the backend was restarted from the rebuilt remediation code before the passing run.

## Commands And Checks

| Command/check | Result |
| --- | --- |
| `cd server; npm.cmd run build` | PASS |
| `cd app; npm.cmd run build` | PASS |
| Start backend from `server/dist/index.js` | PASS |
| Start frontend dev server on `127.0.0.1:5173` | PASS |
| `node docs\qc\full-mock-trial\run_full_mock_trial_local.mjs` | PASS |
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
| Retained disagreement/minority ratings | PASS: SYN-P007 and SYN-P008 retained disagreement patterns |
| Support loop | PASS |
| Consensus rule locked after activation | PASS |
| Consensus rule locked after Round 2 | PASS |
| Consensus rule locked after Round 3 | PASS |
| Final results released to participant invitation view | PASS |

## Browser And Mobile Scope

| Check | Result |
| --- | --- |
| Headless browser smoke at 320px | PASS |
| Headless browser smoke at 390px | PASS |
| Headless browser smoke at 414px | PASS |
| Horizontal overflow in inspected views | PASS: none observed |
| Synthetic participant labels/emails in inspected DOM text | PASS: none observed |
| Manual all-8 browser UI submission pass | NOT RUN |

Condition: the full lifecycle was API-driven through local invitation endpoints. Browser evidence was headless mobile smoke of participant and staff views, not a manual all-8 UI submission pass.

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
| `final-delphi-report` | `bfc26b65-1c29-4fc2-95e4-9e5e795c9f77` | deidentified_research_report | 0 | 0 | PASS |
| `anonymized-response-dataset` | `c72b0bb7-314f-4516-9483-0c4ace7e8711` | deidentified_research_report | 0 | 0 | PASS |
| `audit-package` | `faaa01f4-e592-480d-8ef0-6db476d20a3d` | restricted_internal_admin_audit | 0 | 16 | PASS WITH RESTRICTED WARNINGS |
| `provenance-bundle` | `ae0966bc-1994-4c1d-8557-fcb7f924778a` | deidentified_research_report | 0 | 0 | PASS |
| `complete-archive` | `3ab752c0-b430-4ccf-9d38-657bb5784ad0` | complete_restricted_archive | 0 | 35 | PASS WITH RESTRICTED WARNINGS |

Required limitation found exactly:

"Consensus indicates agreement among this panel; it does not establish correctness."

## Defects

| Severity | Count | Notes |
| --- | ---: | --- |
| P0 | 0 | No P0 remains from the run. |
| P1 | 0 | No P1 recorded. |
| P2 | 1 | Browser scope condition: manual all-8 browser UI submission pass not run. |
| P3 | 0 | No P3 recorded. |

## Decision

GO WITH CONDITIONS for controlled synthetic mock testing only.

This does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data.
