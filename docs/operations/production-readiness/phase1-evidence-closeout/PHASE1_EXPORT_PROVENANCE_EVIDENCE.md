# Phase 1 Export Provenance Evidence (HSB-P0-006)

**Date:** 2026-05-08  
**Scope:** Export package completeness evidence for anonymized dataset, audit package, and provenance bundle.  
**Status:** Materially reduced; blocker remains open pending human reviewer signoff and deployment-context evidence continuity.

## What changed

- Added reviewer-facing provenance metadata file to every governed export package:
  - `<exportType>/reviewer_export_provenance.json`
- Metadata now includes:
  - source study id and version id,
  - export timestamp,
  - de-identification mode,
  - excluded fields,
  - known residual risks,
  - audit/provenance references.
- Added focused privacy/export tests to assert:
  - anonymized participant files exclude direct participant IDs and email identifiers,
  - de-identified exports include reviewer provenance metadata,
  - restricted/internal packages are explicitly labeled as restricted mode.

## Explicit constraints and non-claims

- This evidence does **not** claim legal anonymization sufficiency.
- This evidence does **not** claim HIPAA, GDPR, or IRB compliance.
- De-identified output language is limited to **controlled mock/pilot evidence** context.

## Automated evidence

- `npm --prefix server run build`
- `npm --prefix server test`
- `npm --prefix server test -- server/tests/zzExportPrivacy.test.mjs`

## Source references

- Export metadata implementation: `server/src/routes/reports.ts`
- Export privacy test updates: `server/tests/zzExportPrivacy.test.mjs`
- Related blocker and controls:
  - `documents/compliance/human-subjects-readiness/release-blockers.md`
  - `documents/compliance/human-subjects-readiness/control-matrix.md`
  - `documents/compliance/human-subjects-readiness/test-evidence-checklist.md`
