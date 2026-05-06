# Live Run Results

## Update: 2026-05-06 Windows 320px Mobile Closeout Remediation Evidence

- Operator date/time (UTC): 2026-05-06T21:15:16Z to 2026-05-06T21:19:59Z.
- Clean GitHub checkout branch/commit: `codex/windows-focused-mobile-closeout-evidence-results` / `75834d01a544b3bde7a00536e9772e1c5e22b3bd`.
- Disposable runtime paths used: `%TEMP%\delphi-commons-mobile-fix-data`, `%TEMP%\delphi-commons-mobile-fix-audit`, and `%TEMP%\delphi-commons-mobile-fix-backups`.
- Backend health check: PASS at `http://127.0.0.1:3001/health`.
- Frontend availability check: PASS at `http://127.0.0.1:5173/` (HTTP 200).
- Execution command: `node docs\qc\full-mock-trial\run_manual_browser_mock_trial_local.mjs`.
- New artifact: `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T21-15-16-308Z.json` (and `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-latest.json`).
- Focused screenshots: `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-320.png`, `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-390.png`, `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-414.png`.
- Remediation summary: the 320px overflow was caused by content-based minimum sizing for `.panel.wide` grid items inside `.screen-grid`. The fix adds global border-box sizing and explicit `min-width: 0` / `max-width: 100%` containment for panels. The evidence runner now records layout diagnostics with document scroll width and overflow delta.

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
| Page-level horizontal overflow | PASS: document scroll width 320 / overflow delta 0 | PASS: overflow delta 0 | PASS: overflow delta 0 |
| Buttons/navigation usable | PASS | PASS | PASS |
| Text readable without zoom | PASS | PASS | PASS |

The prior 320px horizontal-overflow P2 is remediated for controlled synthetic local browser evidence. The latest runner reports P0=0, P1=0, P2=0, P3=0, with required limitation language visible and no synthetic labels or `example.test` emails in inspected final closeout DOM text at 320px, 390px, or 414px.


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

The latest run completed an 8-synthetic-participant, 4-round Classical Delphi lifecycle with all participant Round 1, Round 2, Round 3, and Round 4 submissions made through a local Microsoft Edge browser UI automation pass. Study setup, curation, round progression, staff support response, final-results release, and export/package generation used local development APIs. Mobile-width browser checks covered 320px, 390px, and 414px. The prior API-driven rerun evidence remains retained. The prior 320px horizontal-overflow finding in the final participant closeout view is now remediated in controlled synthetic local browser evidence.

## Boundary

Synthetic data only. Local development only. No production deployment. No real human-subjects research. No IRB launch. No sensitive participant data. No live external AI calls.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Evidence Artifact

Latest primary artifact:

- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T21-15-16-308Z.json`
- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-latest.json`

Historical browser/API-driven artifacts:

- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T19-42-16-959Z.json`
- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T17-13-46-275Z.json`

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-06T14-18-57-949Z.json`
- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T21-34-02-906Z.json`
- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-latest.json`

Prior blocked attempt (environment/startup):

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T21-28-25-629Z-failed.json`

Mobile screenshots:

- `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-320.png`
- `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-390.png`
- `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-414.png`
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
| Commit hash | `75834d01a544b3bde7a00536e9772e1c5e22b3bd` |
| Branch | `codex/windows-focused-mobile-closeout-evidence-results` |
| Run timestamp | `2026-05-06T21:15:16.308Z` |
| Backend URL | `http://127.0.0.1:3001` |
| Backend health | `{"status":"ok","service":"edelphi-server","environment":"development"}` |
| Frontend URL | `http://127.0.0.1:5173` |
| Study ID | `383e72f9-a15d-42f6-b586-642ad95694b3` |
| Version ID | `c087a947-7d97-4e0d-87d3-b2878b006566` |
| AI mode | Existing deterministic local AI helpers; No External AI mode |

Note: this rerun used the clean GitHub checkout, disposable local runtime paths, and the local development backend/frontend at the documented local URLs. It included browser UI automation for all participant submissions. The run was performed after the 320px mobile closeout containment fix was committed locally. No production data was used. The runner respected default local rate limiting with recorded retry/backoff events during compressed automation.

## Commands And Checks

| Command/check | Result |
| --- | --- |
| `cd server; npm.cmd install` | PASS |
| `cd server; npm.cmd run build` | PASS |
| `cd server; npm.cmd test` | PASS |
| `cd app; npm.cmd install` | PASS |
| `cd app; npm.cmd run build` | PASS |
| `cd app; npm.cmd test` | PASS |
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
| Mobile-width participant checks at 320px | PASS: final closeout limitation visible, identifiers redacted, no page-level horizontal overflow |
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
| `final-delphi-report` | `ebb790ce-8c34-432a-9ac5-a94f75e88c53` | deidentified_research_report | 0 | 0 | PASS |
| `anonymized-response-dataset` | `53e43718-3468-4fea-bacd-7fd240c06e9d` | deidentified_research_report | 0 | 0 | PASS |
| `audit-package` | `71abb86b-84bd-43b4-a8a4-b135892da89b` | restricted_internal_admin_audit | 0 | 17 | PASS WITH RESTRICTED WARNINGS |
| `provenance-bundle` | `bea0ca43-08c2-47ce-985c-6b4727f9cdb8` | deidentified_research_report | 0 | 0 | PASS |
| `complete-archive` | `b34fef2b-de8b-4cc3-9503-ac6c65f613db` | complete_restricted_archive | 0 | 35 | PASS WITH RESTRICTED WARNINGS |

Required limitation found exactly:

"Consensus indicates agreement among this panel; it does not establish correctness."

## Defects

| Severity | Count | Notes |
| --- | ---: | --- |
| P0 | 0 | No P0 remains from the rerun. |
| P1 | 0 | No P1 recorded. |
| P2 | 0 | No P2 recorded in the latest focused Windows rerun. |
| P3 | 0 | No P3 recorded. |

## Decision

GO WITH CONDITIONS for controlled synthetic mock testing only.

This does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data.
