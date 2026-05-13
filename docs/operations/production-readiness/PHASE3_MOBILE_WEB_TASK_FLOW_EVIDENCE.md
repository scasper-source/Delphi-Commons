# Phase 3 Mobile Web Task-Flow Local Automation Evidence

Status: **LOCAL SYNTHETIC AUTOMATION EVIDENCE RECORDED**.

Date basis: 2026-05-13.

## Scope

This evidence is limited to local synthetic/internal automation for Phase 3 participant mobile web task-flow coverage and does **not** claim production/pilot/human-subject/real-device/accessibility/real-SMS readiness.

## Scaffold

- Script: `docs/qc/full-mock-trial/run_phase3_mobile_task_flow_scaffold_local.mjs`
- NPM entrypoint: `npm --prefix server run test:phase3-mobile-task-flow-scaffold`
- Artifacts: timestamped Markdown plus `phase3-mobile-task-flow-scaffold-latest.json` under `docs/qc/full-mock-trial/artifacts/`.

## Task-Flow Coverage States

Recorded as PASS/PARTIAL/FAIL per run:

- consent
- Round 1
- later round
- no-active-task
- closeout/completed state
- support
- withdrawal

## Privacy/Redaction Boundary

- Token evidence is redacted to prefix/suffix snippets only.
- Participant identifiers are redacted in reviewer-facing artifacts.
- No raw magic-link token, OTP, full phone number, SMS body text, or participant identifiers are intended for reviewer-facing evidence output.

## Prerequisites

The scaffold expects a running local backend/frontend compatible with the existing Phase 3 browser scaffold environment.
