# Full Controlled Mock-Trial Package

Date prepared: 2026-05-05

Scope: controlled synthetic mock-participant trial only.

This package prepares and records evidence for a deeper Delphi Commons rehearsal using 8 synthetic participants, 4 Classical Delphi rounds, mobile-width checks, export privacy checks, support-loop checks, and simulated AI governance checks.

Current live execution status: CONTROLLED SYNTHETIC LOCAL RERUN COMPLETED WITH CONDITIONS.

Current documentation-package status: evidence updated after the export privacy remediation rerun. The run completed the synthetic 8-participant, 4-round lifecycle through local invitation APIs, regenerated and rescanned export packages, and completed headless browser smoke checks at 320px, 390px, and 414px. Current decision is GO WITH CONDITIONS for controlled synthetic mock testing only. The condition is that this was not a manual all-8 browser UI submission pass.

Boundary:

- Synthetic data only.
- Controlled local, development, or staging environment only.
- No production deployment.
- No real human-subjects research.
- No IRB launch.
- No sensitive participant data.
- No live external AI calls were used.
- No new AI integration.

Live run summary:

- Date: 2026-05-05.
- Environment: local development backend at `http://127.0.0.1:3001`.
- Frontend URL available: `http://127.0.0.1:5173/`.
- Method: Classical Delphi.
- Planned/terminal rounds: 4.
- Participants: 8 synthetic participants.
- API-driven lifecycle: Round 1 through Round 4 completed by all 8 synthetic participants.
- Support loop: SYN-P003 issue note, PI/admin response, and participant-visible response completed through API.
- AI mode: existing deterministic local AI helpers with No External AI mode; no live external AI calls.
- Browser/mobile pass: headless mobile smoke completed at 320px, 390px, and 414px; manual all-8 browser UI submission pass NOT RUN.
- Export privacy scan: PASS for regenerated de-identified export packages; restricted/internal packages produced warnings only.
- Current status: GO WITH CONDITIONS for controlled synthetic mock testing only.

Repository findings used to prepare this package:

- App scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm test`, `npm run security:audit`.
- Server scripts: `npm run dev`, `npm run build`, `npm test`, `npm run security:audit`, `npm start`.
- No Playwright or Cypress setup was found; current automated tests use Node's built-in test runner.
- Classical Delphi is available and maps to 4 planned/terminal rounds.
- Modified Delphi maps to 3 planned/terminal rounds.
- Existing AI defaults are no external AI mode, external AI disabled, and feature permissions disabled unless configured.
- Existing AI routes include deterministic local helper outputs such as `deterministic_mvp_synthesizer`.

Latest evidence artifact:

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T17-11-47-924Z.json`
- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-latest.json`

Files:

- `FULL_MOCK_TRIAL_SCRIPT.md` - end-to-end live script, observed API-driven results, and decision criteria.
- `SYNTHETIC_STUDY_SETUP.md` - synthetic study topic, roles, fields, and participant data.
- `PARTICIPANT_RUNBOOK.md` - participant-specific task guide and mobile checks.
- `WINDOWS_FOCUSED_MOBILE_EVIDENCE_RUNBOOK.md` - focused Windows runbook for 320px, 390px, and 414px final closeout/mobile evidence.
- `FOUR_ROUND_CLASSICAL_DELPHI_RUNBOOK.md` - round-by-round owner/steward workflow.
- `SIMULATED_AI_REHEARSAL.md` - deterministic AI fixture plan and AI boundary checks.
- `LIVE_RUN_RESULTS.md` - API-driven local run evidence and decision summary.
- `OBSERVER_NOTES.md` - evidence captured from the API-driven run and remaining manual/browser gaps.
- `DEFECT_LOG.md` - severity rubric, observed defects, and carryover watch list.
- `EXPORT_PRIVACY_CHECK.md` - export scan process and remediation result.
- `GOVERNANCE_AND_AI_CHECK.md` - governance and AI-HITL verification evidence.
- `GO_NO_GO_FOR_CONTROLLED_MOCK_TRIAL.md` - current live-run decision and remaining blockers.

Required limitation language for report/export checks:

"Consensus indicates agreement among this panel; it does not establish correctness."
