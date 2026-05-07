# Phase 0 Mock-Trial Baseline Evidence Index

Scope date: May 6, 2026 evidence baseline reused for `mock_trial` track only.

## Baseline evidence links (reused, no reruns)

- Latest full mock-trial artifact: `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-latest.json`.
- Latest manual-browser full mock-trial artifact: `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T21-15-16-308Z.json`.
- Latest manual-browser pointer: `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-latest.json`.

## Mobile closeout screenshots (final)

- 320px: `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-320.png`.
- 390px: `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-390.png`.
- 414px: `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-414.png`.

## Export privacy result (baseline)

- Decision: PASS for de-identified exports with 0 failures.
- Restricted-warning interpretation: warnings are acceptable only for explicitly restricted/internal packages (`audit-package`, `complete-archive`), and those outputs are not for de-identified sharing.
- Source summary: `docs/qc/full-mock-trial/EXPORT_PRIVACY_CHECK.md` and `docs/qc/full-mock-trial/GO_NO_GO_FOR_CONTROLLED_MOCK_TRIAL.md`.

## Commands and associated commit hashes

Baseline command evidence is reused from `docs/qc/full-mock-trial/LIVE_RUN_RESULTS.md`.

- Build/test command set (Windows-focused baseline run):
  - `cd server; npm.cmd install`
  - `cd server; npm.cmd run build`
  - `cd server; npm.cmd test`
  - `cd app; npm.cmd install`
  - `cd app; npm.cmd run build`
  - `cd app; npm.cmd test`
- Manual-browser command:
  - `node docs\qc\full-mock-trial\run_manual_browser_mock_trial_local.mjs`
- Associated commits documented in evidence:
  - Clean checkout run context: `75834d01a544b3bde7a00536e9772e1c5e22b3bd`
  - Artifact-recorded branch/commit context: `master` / `9df7f75af31a152db46729d1bb60ae22a2af2c68`

## Current decision

**GO WITH CONDITIONS** for `mock_trial` only (controlled synthetic testing).

## Explicit non-claims

This Phase 0 index does **not** claim:

- production readiness,
- real human-subjects readiness,
- IRB approval/readiness,
- legal certification,
- security certification,
- accessibility certification.

## Documentation claim check

Current linked readiness/QC docs keep boundary language that GO/GO WITH CONDITIONS is limited to controlled synthetic mock testing and does not authorize production deployment, real human-subjects use, or certification claims.
