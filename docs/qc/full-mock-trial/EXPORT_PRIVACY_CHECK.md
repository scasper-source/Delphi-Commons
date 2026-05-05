# Export Privacy Check

Live execution status: API-DRIVEN LOCAL RUN COMPLETED; EXPORT PRIVACY REMEDIATION VERIFIED; FULL BROWSER/MOBILE RUN NOT COMPLETED.

This file records the original 2026-05-05 export privacy failure and the focused remediation evidence from regenerated local development export packages.

## Required Limitation

Every de-identified research/report export path checked must include this exact sentence:

"Consensus indicates agreement among this panel; it does not establish correctness."

Status after remediation: PASS.

## Export Classification

| Export package | Classification | Restricted/internal only | Safe for de-identified research/report sharing | Direct identifiers included | Participant-response mapping included |
| --- | --- | --- | --- | --- | --- |
| `final-delphi-report` | deidentified_research_report | no | yes | no | no |
| `anonymized-response-dataset` | deidentified_research_report | no | yes | no | no |
| `provenance-bundle` | deidentified_research_report | no | yes | no | no |
| `audit-package` | restricted_internal_admin_audit | yes | no | yes, restricted | yes, restricted |
| `complete-archive` | complete_restricted_archive | yes | no | yes, restricted | yes, restricted |

Restricted/internal packages must not be treated as de-identified research/report exports.

## Scanner

Scanner/helper added:

- `server/src/exports/exportPrivacy.ts`

Regression test added:

- `server/tests/zzExportPrivacy.test.mjs`

Scan command used in verification:

```powershell
cd server
npm.cmd test
```

Additional focused commands run:

```powershell
cd server
npm.cmd run build
node --test --test-isolation=none tests\zzExportPrivacy.test.mjs
node --test --test-isolation=none tests\roadtest.test.mjs
node --test --test-isolation=none tests\zzParticipantIssue.test.mjs
```

Forbidden pattern classes checked:

- Synthetic participant labels: `SYN-P001` through `SYN-P008`.
- `example.test` email-shaped participant identifiers.
- Generic email-like strings.
- Phone-like strings.
- Known raw participant UUIDs used in the regression fixture.
- Direct identity fields in de-identified export content.

UUID handling:

- Known participant UUIDs fail de-identified exports.
- UUID-like strings in de-identified free text are redacted to `[REDACTED_ID]`.
- Non-person export/package/file/study IDs may remain when they do not map participant identity to response content.

## Regenerated Package Evidence

Regenerated package evidence came from the focused export privacy regression run in local development test runtime:

`C:\Users\13152\Dropbox\eDelphi\server\data\test-runtime\road-1777999868910-a81801dfd83358\data\edelphi.sqlite`

| Package type | Package ID | Classification | Files scanned | Failures | Warnings | Result |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `final-delphi-report` | `780fb0bd-ecce-4504-8119-2c1ddf9b6d07` | deidentified_research_report | 6 | 0 | 0 | PASS |
| `anonymized-response-dataset` | `72e3bbe4-1a71-454e-8df0-0cd53de5c690` | deidentified_research_report | 9 | 0 | 0 | PASS |
| `audit-package` | `91393805-d9e1-4ea7-aa9c-931614aee16a` | restricted_internal_admin_audit | 7 | 0 | 4 | PASS WITH RESTRICTED WARNINGS |
| `provenance-bundle` | `d9601448-874e-4e49-9b15-08532b1c0015` | deidentified_research_report | 7 | 0 | 0 | PASS |
| `complete-archive` | `0120a1a1-1c15-404d-aeeb-db0a154186b6` | complete_restricted_archive | 9 | 0 | 8 | PASS WITH RESTRICTED WARNINGS |

Restricted warning interpretation:

- `audit-package` and `complete-archive` are intentionally not safe for de-identified research/report sharing.
- They are clearly labeled restricted/internal or complete restricted archive.
- Scanner warnings are acceptable for these classifications only when the package metadata declares the restriction and `safe_for_deidentified_research_report_sharing` is false.

## AI And Support Privacy

AI export privacy after remediation:

- De-identified provenance exports redact AI user ID fields.
- AI input scope IDs are export-scoped rather than raw input IDs.
- AI prompts, inputs, and outputs containing direct identifiers are not included in de-identified research/report exports.

Support-loop export privacy after remediation:

- Standard de-identified export packages do not include support/issue-note identity linkages.
- Restricted/internal packages declare whether support content is included. Current generated restricted packages do not include support issue note content.

## Result Summary

| Severity | Count | Notes |
| --- | ---: | --- |
| P0 | 0 | Export privacy P0 remediated in regression evidence. |
| P1 | 0 | No export P1 remains from the remediation evidence. |
| P2 | 0 | Browser/mobile evidence gap is tracked in the defect log, not this export scan. |
| P3 | 0 | No export P3 recorded. |

Current export privacy decision: PASS for regenerated de-identified exports; restricted/internal packages are clearly labeled and separated.
