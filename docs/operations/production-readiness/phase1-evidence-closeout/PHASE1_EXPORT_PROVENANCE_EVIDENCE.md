# Phase 1 Export Provenance Evidence

Date: 2026-05-08
Branch: `codex/phase1-export-provenance-evidence`

## Scope

This evidence records repo-verifiable export provenance improvements for Phase 1 HSB-P0-006.

The governed export package builder now includes a reviewer-facing provenance metadata file in each package:

- `<exportType>/reviewer_export_provenance.json`

The file records:

- source study ID and study version ID;
- export type and export timestamp;
- de-identification mode and data classification;
- excluded direct identifier fields for controlled de-identified packages;
- restricted/internal status for audit and complete archive packages;
- audit and provenance package references;
- known residual re-identification and free-text redaction risks;
- explicit non-claims, including no legal anonymization claim.

## Implementation Evidence

- Export builder: `server/src/routes/reports.ts`
- Export privacy scan and metadata helpers: `server/src/exports/exportPrivacy.ts`
- Export package persistence: `server/src/stores/exportManifestStore.ts`
- Focused privacy/provenance test: `server/tests/zzExportPrivacy.test.mjs`

## Test Evidence

Expected commands:

- `npm --prefix server run build`
- `npm --prefix server test`
- `node --test server/tests/zzExportPrivacy.test.mjs`

The focused export privacy test now verifies:

- all standard governed export packages include `reviewer_export_provenance.json`;
- reviewer provenance records source study/version, export type, data classification, residual risks, and non-claims;
- anonymized participant file excludes raw participant IDs and email identifiers;
- audit package reviewer provenance is explicitly marked `restricted_internal_not_deidentified`;
- restricted/internal packages continue to produce warnings, not failures, when restricted IDs are clearly labeled.

## Phase 1 Interpretation

This materially reduces HSB-P0-006 by adding reviewer-facing export provenance metadata and automated privacy/provenance assertions.

HSB-P0-006 remains **OPEN** until a Data Custodian or authorized reviewer completes human signoff/acceptance for the anonymized dataset, audit package, provenance bundle, residual-risk interpretation, and release context.

## Non-Claims

This evidence does **not** claim:

- legal anonymization;
- unrestricted public release readiness;
- production readiness;
- pilot readiness;
- real human-subjects readiness;
- IRB, legal, security, or accessibility certification.
