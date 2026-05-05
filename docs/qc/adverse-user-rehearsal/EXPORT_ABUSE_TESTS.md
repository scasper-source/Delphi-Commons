# Export Abuse Tests

Status: EXECUTED, WITH ONE P0 FOUND, REMEDIATED, AND RERUN.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Purpose

These checks test whether malicious participant-authored text, synthetic identifiers, AI prompt text, support notes, internal IDs, or restricted material can leak through generated reports or export packages.

Required limitation language:

"Consensus indicates agreement among this panel; it does not establish correctness."

## Export Packages Scanned

| Package | Classification | Safe for de-identified sharing | Current result |
| --- | --- | --- | --- |
| `final-delphi-report` | `deidentified_research_report` | yes | PASS |
| `anonymized-response-dataset` | `deidentified_research_report` | yes | PASS WITH P2 RENDERING WARNING |
| `audit-package` | `restricted_internal_admin_audit` | no | PASS WITH RESTRICTED WARNINGS |
| `provenance-bundle` | `deidentified_research_report` | yes | PASS WITH P2 RENDERING WARNING |
| `complete-archive` | `complete_restricted_archive` | no | PASS WITH RESTRICTED WARNINGS AND P2 RENDERING WARNING |

## Current Rerun Evidence

Primary passing artifact:

- `docs/qc/adverse-user-rehearsal/artifacts/adverse-user-rehearsal-2026-05-05T17-40-13-932Z.json`

| Package | Package ID | Files | Privacy failures | Privacy warnings | Formula failures | Rendering warnings | Limitation present |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `final-delphi-report` | `b048b1d7-9880-46cd-94cf-bd616631113e` | 9 | 0 | 0 | 0 | 0 | yes |
| `anonymized-response-dataset` | `21415e27-236b-4713-bd93-2a4164661b6c` | 12 | 0 | 0 | 0 | 5 | yes |
| `audit-package` | `a3faeeb6-3149-4154-a3e8-b7543c76ca1b` | 10 | 0 | 16 | 0 | 0 | yes |
| `provenance-bundle` | `596d9333-f5ac-4278-bccf-f8e1e13784a4` | 10 | 0 | 0 | 0 | 2 | yes |
| `complete-archive` | `22439adf-dbab-4175-93e2-712d20726fe6` | 12 | 0 | 17 | 0 | 5 | yes |

Aggregate scan results:

- Privacy failures: 0.
- Restricted/internal privacy warnings: 33.
- Spreadsheet formula failures: 0.
- Rendering warnings: 12.

Restricted warnings are acceptable only for correctly classified restricted/internal packages that are not safe for de-identified sharing.

## Initial P0 And Remediation

Initial completed adverse run:

- `docs/qc/adverse-user-rehearsal/artifacts/adverse-user-rehearsal-2026-05-05T17-34-58-577Z.json`
- Decision: NO-GO for continued controlled synthetic mock testing.
- P0: `ADVERSE-P0-FORMULA-INJECTION`.

The P0 occurred because formula-like text survived in de-identified CSV exports, including:

- `anonymized-response-dataset/ratings.csv`
- `anonymized-response-dataset/responses.csv`
- `provenance-bundle/item_transformation_history.csv`

Remediation:

- CSV export cells now neutralize formula-like text before CSV escaping.
- XLSX string cells now neutralize formula-like text before XML escaping.
- Regression tests seed formula-like rationale, response, item, and AI provenance text.
- The adverse runner was rerun after rebuilding/restarting the backend.

Relevant code paths:

- `server/src/exports/exportPrivacy.ts`
- `server/src/routes/reports.ts`
- `server/src/exports/finalReportRenderers.ts`
- `server/src/exports/officeRenderers.ts`
- `server/tests/zzExportPrivacy.test.mjs`

## Current Result

The export P0 is remediated for the controlled synthetic local evidence run. The current export result supports GO WITH CONDITIONS for continued controlled synthetic mock testing only.

Remaining P2 export condition:

- Script-like or markup-like text remains as inert text in some text-bearing exports. This did not execute and did not leak identity, but reviewer-facing handling should be improved before production readiness.
