# Phase 2 macOS Follow-Up Evidence Checklist

Status: planning/checklist only. Real macOS lifecycle evidence remains **NOT PROVIDED** in this local container run.

## Scope

Use this checklist after a real macOS run (Intel and/or Apple Silicon) to capture lifecycle evidence without over-claiming platform support.

## Required capture fields

- Date/time (UTC)
- Reviewer/operator name
- Machine model + chipset
- macOS version
- Browser and Node/npm versions
- Candidate commit/package hash

## Lifecycle checks

- [ ] Build/install steps executed from docs without source edits.
- [ ] Backend starts and health endpoint responds.
- [ ] UI starts and loads.
- [ ] Controlled stop works (no orphaned process).
- [ ] Restart works.
- [ ] Data path is as documented.
- [ ] Export and backup paths are as documented.

## Known limitation checks

- [ ] Gatekeeper/signing behavior documented.
- [ ] Unsigned package warning behavior recorded (if applicable).
- [ ] Any permission prompts captured and documented.

## Evidence links to attach

- `MACOS_OPERATOR_PORTABLE_PACKAGE.md`
- `MACOS_OPERATOR_PORTABLE_RUNBOOK.md`
- `MACOS_SIGNING_DISTRIBUTION_LIMITATIONS.md`

## Non-claims

This checklist is not evidence by itself and does **not** claim macOS support readiness, pilot readiness, or production readiness.
