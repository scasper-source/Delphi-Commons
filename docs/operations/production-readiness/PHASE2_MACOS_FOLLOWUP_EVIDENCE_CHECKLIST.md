# Phase 2 macOS Follow-Up Evidence Checklist

Status: **APPLE SILICON POST-FIX LIFECYCLE EVIDENCE RECORDED ON 2026-05-14**. This checklist remains a capture aid for additional Mac coverage.

## Scope

Use this checklist after a real macOS run (Intel and/or Apple Silicon) to capture lifecycle evidence without over-claiming platform support.

Recorded evidence:

- [macOS Operator Portable Post-Fix Lifecycle Evidence (2026-05-14)](./MACOS_OPERATOR_PORTABLE_POST_FIX_LIFECYCLE_EVIDENCE_2026-05-14.md)

## Required capture fields

- Date/time (UTC)
- Reviewer/operator name
- Machine model + chipset
- macOS version
- Browser and Node/npm versions
- Candidate commit/package hash

## Lifecycle checks

- [x] Build/install steps executed from docs without source edits on one Apple Silicon Mac after dependency prerequisites.
- [x] Backend starts and health endpoint responds.
- [x] UI starts and returns HTTP 200.
- [x] Controlled stop works with no orphaned listener process.
- [x] Restart works and replaces listener PIDs.
- [x] Data path is as documented.
- [x] Backup/reset snapshot paths are as documented.

## Known limitation checks

- [ ] Gatekeeper/signing behavior documented for intended distribution path.
- [ ] Unsigned package warning behavior recorded if applicable to the intended distribution path.
- [x] Permission/prompt observation recorded for this rerun: no Gatekeeper/quarantine observations reported.

## Evidence links to attach

- `MACOS_OPERATOR_PORTABLE_PACKAGE.md`
- `MACOS_OPERATOR_PORTABLE_POST_FIX_LIFECYCLE_EVIDENCE_2026-05-14.md`
- `MACOS_OPERATOR_PORTABLE_RUNBOOK.md`
- `MACOS_SIGNING_DISTRIBUTION_LIMITATIONS.md`

## Non-claims

This checklist is not evidence by itself and does **not** claim macOS support readiness, pilot readiness, or production readiness. The 2026-05-14 rerun covers one Apple Silicon Mac only.
