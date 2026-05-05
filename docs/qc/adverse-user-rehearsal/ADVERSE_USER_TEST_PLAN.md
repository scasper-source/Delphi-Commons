# Adverse User Test Plan

Status: EXECUTED WITH CONDITIONS.

Current decision: GO WITH CONDITIONS for continued controlled synthetic mock testing only.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Scope

This rehearsal is a defensive quality and governance test of the local Delphi Commons application. It uses synthetic data only and targets only the local development environment.

Out of scope:

- Production deployment.
- Real participants.
- Real human-subjects research.
- IRB launch.
- Sensitive data.
- Real credentials.
- Live external AI calls.
- Third-party attack testing.
- Destructive tests outside the local controlled environment.
- General automatic abuse moderation.

## Evidence Run

Primary passing artifact:

- `docs/qc/adverse-user-rehearsal/artifacts/adverse-user-rehearsal-2026-05-05T17-40-13-932Z.json`
- `docs/qc/adverse-user-rehearsal/artifacts/adverse-user-rehearsal-latest.json`

Superseded adverse artifact showing the pre-remediation formula-injection P0:

- `docs/qc/adverse-user-rehearsal/artifacts/adverse-user-rehearsal-2026-05-05T17-34-58-577Z.json`

Superseded runner setup failure:

- `docs/qc/adverse-user-rehearsal/artifacts/adverse-user-rehearsal-2026-05-05T17-34-11-725Z-failed.json`

The setup failure is not safety evidence against the application. The later completed run exposed the formula-injection defect, and the final completed run is the current evidence basis.

## Environment

| Field | Value |
| --- | --- |
| Commit under test | `c7364c5005419be1dd48cd76de51000eacbebbd7` |
| Branch | `master` |
| Backend URL | `http://127.0.0.1:3001` |
| Frontend URL | `http://127.0.0.1:5173` |
| Backend health | `ok`, `edelphi-server`, `development` |
| Browser evidence | Headless Microsoft Edge smoke where available |
| Mobile widths | 320px, 390px, 414px |
| AI mode | Existing deterministic local helpers, No External AI |

Local development mode accepts legacy dev role headers unless `EDELPHI_AUTH_REQUIRE_SESSION=true`. This is acceptable for local rehearsal evidence only and must not be treated as a production access-control model.

## Commands

Canonical checks and focused runner commands used during this task:

```powershell
cd server
npm.cmd run build
npm.cmd test -- zzExportPrivacy.test.mjs

cd app
npm.cmd run build
npm.cmd test -- policyGates.test.mjs

node docs\qc\adverse-user-rehearsal\run_adverse_user_rehearsal_local.mjs
```

The server test script currently runs the full server test glob after build, even when a file argument is supplied.

## Test Roles

- Study Owner / PI.
- Ethics & Methods Steward.
- PI/admin support role.
- Normal synthetic participant.
- Malicious synthetic participant.
- Careless or malicious Study Owner.
- Observer/test recorder.

Synthetic participant identifiers are limited to `SYN-P001` through `SYN-P008` and `example.test` email-shaped fixtures when needed.

## Test Categories

| Category | Coverage | Execution status |
| --- | --- | --- |
| Participant malicious input | HTML/script text, event-handler text, prompt injection, placeholder abuse, identifiers, formula text, long text, unicode/newline stress | PASS WITH P2 CONDITION |
| Participant workflow abuse | consent bypass, duplicate submit, submit after close, same-tab switching, payload size | PASS WITH P2 CONDITION |
| IDOR and access control | guessed/swapped study, participant, support, export, and admin paths where feasible | PASS |
| Study Owner/admin role abuse | post-launch consensus change, AI publication gate, de-identified export boundary | PASS |
| AI prompt injection | deterministic local/mock suggestions only; no external AI | PASS |
| Stored-XSS and rendering | headless browser smoke and export text scan | PASS WITH P2 CONDITION |
| Export/report abuse | privacy, formula injection, limitation language, restricted package labels | PASS AFTER REMEDIATION |
| Support-loop abuse | synthetic abusive placeholder note, identifier text, participant isolation | PASS |
| Participant withdrawal/removal | invitation revocation and participant self-withdrawal | PASS |
| Manual all-8 browser adverse pass | full human-clicked UI pass across all participants | NOT RUN |

## Abuse Handling Expectation

The MVP is not expected to automatically moderate all abusive content. For controlled synthetic testing, PI/study-team governance is acceptable when:

- Content is safely rendered or safely rejected.
- Content does not execute as code.
- Content does not create stored-XSS risk.
- Content does not create CSV/XLSX formula-injection risk.
- Content does not leak participant identity.
- Content does not bypass consent, role, round, support-loop, or study lifecycle controls.
- Content does not alter consensus rules or governance state.
- Content is not automatically amplified into participant-facing feedback, items, reports, or exports.
- Participant-facing reuse requires Study Owner / Methods Steward review.

The rehearsal confirmed this containment model after the narrow spreadsheet formula remediation.

## Decision Summary

| Severity | Count | Status |
| --- | ---: | --- |
| P0 | 0 | Initial formula-injection P0 remediated and rerun |
| P1 | 0 | None open |
| P2 | 2 | Duplicate Round 1 submit expectation unclear; inert markup-like text appears in text exports |
| P3 | 0 | None open |

Current adverse-user decision: GO WITH CONDITIONS for continued controlled synthetic mock testing only.
