# Phase 3 Mobile Web Task-Flow Local Automation Evidence

Status: **LOCAL SYNTHETIC MOBILE-BROWSER AUTOMATION PASS RECORDED**.

Date basis: 2026-05-13.

## Scope

This evidence is limited to local synthetic/internal automation for Phase 3 participant mobile web task-flow coverage and does **not** claim production/pilot/human-subject/real-device/accessibility/real-SMS readiness.

The 2026-05-13 local run passed with a live local backend/frontend and Microsoft Edge headless at a 390px mobile viewport. Earlier Cloud attempts without those live services are precondition evidence only.

## Scaffold

- Script: `docs/qc/full-mock-trial/run_phase3_mobile_task_flow_scaffold_local.mjs`
- NPM entrypoint: `npm --prefix server run test:phase3-mobile-task-flow-scaffold`
- Current PASS artifact: `docs/qc/full-mock-trial/artifacts/phase3-mobile-task-flow-scaffold-2026-05-13T21-32-09-080Z.md`
- Latest JSON: `docs/qc/full-mock-trial/artifacts/phase3-mobile-task-flow-scaffold-latest.json`

## Task-Flow Coverage States

Recorded as PASS/PARTIAL/FAIL per run. Current local PASS coverage:

- consent information, participant rights, and withdrawal language
- Round 1 mobile browser submission
- participant support issue submission
- no-active-task/waiting state between rounds
- later-round structured judgment submission
- released closeout/final-results view
- withdrawal from future participation



## Manual device evidence companion

For iPhone/Safari and Android/Chrome human-observed capture procedures, use:

- `PHASE3_MOBILE_DEVICE_EVIDENCE_RUNBOOK.md`
- `PHASE3_MOBILE_EVIDENCE_TEMPLATES.md`

The local scaffold output below remains **browser/viewport automation evidence only** and not real-device evidence.

## Evidence state classification

- Local scaffold execution state: **COMPLETE FOR MOCK/SANDBOX ONLY**.
- iPhone/Safari evidence: **NOT RUN**.
- Android/Chrome evidence: **NOT RUN**.
- Human-observed walkthrough evidence: **HUMAN_REQUIRED**.
- Accessibility review evidence: **NOT RUN**.

## Privacy/Redaction Boundary

- Token evidence is redacted to prefix/suffix snippets only.
- Participant identifiers are redacted in reviewer-facing artifacts.
- No raw magic-link token, OTP, full phone number, SMS body text, or participant identifiers are intended for reviewer-facing evidence output.

## Prerequisites

The scaffold expects a running local backend/frontend compatible with the existing Phase 3 browser scaffold environment.
