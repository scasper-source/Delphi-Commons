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

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T20-58-23-780Z.json`
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
| Commit hash | `6c90ee57d4d0ab972ef7eebacb4859c88860be0d` |
| Branch | `master` |
| Run timestamp | `2026-05-05T20:58:23.780Z` |
| Backend URL | `http://127.0.0.1:3001` |
| Backend health | `{"status":"ok","service":"edelphi-server","environment":"development"}` |
| Frontend URL | `http://127.0.0.1:5173` |
| Study ID | `8a6db895-3a94-4730-a687-8ea55c23f8d6` |
| Version ID | `f648d68d-efe0-4df9-baf9-f95f5dc660b0` |
| AI mode | Existing deterministic local AI helpers; No External AI mode |

Note: this rerun reused the local development backend and frontend already responding at the documented local URLs. The lifecycle remained API-driven through local invitation endpoints, with headless mobile-width smoke evidence.

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
| `final-delphi-report` | `94f1ad57-a66b-4689-8632-16ea23d5f80e` | deidentified_research_report | 0 | 0 | PASS |
| `anonymized-response-dataset` | `de734425-c693-4f39-98cf-bb90fd3793b5` | deidentified_research_report | 0 | 0 | PASS |
| `audit-package` | `4e5c3269-a927-4469-898c-cca571d27505` | restricted_internal_admin_audit | 0 | 16 | PASS WITH RESTRICTED WARNINGS |
| `provenance-bundle` | `eef6baa6-8d07-4ce0-9b69-3cb6ceee8d33` | deidentified_research_report | 0 | 0 | PASS |
| `complete-archive` | `a65b3b99-6e91-47b6-b755-d03f75b6ac54` | complete_restricted_archive | 0 | 35 | PASS WITH RESTRICTED WARNINGS |

Required limitation found exactly:

"Consensus indicates agreement among this panel; it does not establish correctness."

## Defects

| Severity | Count | Notes |
| --- | ---: | --- |
| P0 | 0 | No P0 remains from the run. |
| P1 | 0 | No P1 recorded. |
| P2 | 2 | Browser scope condition: manual all-8 browser UI submission pass not run. Participant mobile smoke also showed stale method/round-count copy for the 4-round Classical Delphi run. |
| P3 | 0 | No P3 recorded. |

## Decision

GO WITH CONDITIONS for controlled synthetic mock testing only.

This does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data.
