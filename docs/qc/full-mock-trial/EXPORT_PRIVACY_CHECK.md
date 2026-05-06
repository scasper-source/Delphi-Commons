# Export Privacy Check

Live execution status: CONTROLLED SYNTHETIC LOCAL RERUN COMPLETED.

Current export privacy result: PASS for de-identified research/report exports. Restricted/internal packages produced warnings only and are not safe for de-identified sharing.

## Required Limitation

Every de-identified research/report export path checked must include this exact sentence:

"Consensus indicates agreement among this panel; it does not establish correctness."

Status: PASS.

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

Scanner/helper:

- `server/src/exports/exportPrivacy.ts`

Regression test:

- `server/tests/zzExportPrivacy.test.mjs`

Latest browser rerun command:

```powershell
node docs\qc\full-mock-trial\run_manual_browser_mock_trial_local.mjs
```

Earlier API-driven rerun command:

```powershell
node docs\qc\full-mock-trial\run_full_mock_trial_local.mjs
```

Prior regression/build commands:

```powershell
cd server
npm.cmd run build
npm.cmd test
node --test --test-isolation=none tests\zzExportPrivacy.test.mjs
node --test --test-isolation=none tests\roadtest.test.mjs
node --test --test-isolation=none tests\zzParticipantIssue.test.mjs
```

Forbidden pattern classes checked:

- Synthetic participant labels: `SYN-P001` through `SYN-P008`.
- `example.test` email-shaped participant identifiers.
- Generic email-like strings.
- Phone-like strings.
- Known raw participant UUIDs from the live synthetic run.
- Direct identity fields in de-identified export content.

UUID handling:

- Known participant UUIDs fail de-identified exports.
- UUID-like strings in de-identified free text are redacted to `[REDACTED_ID]`.
- Non-person export/package/file/study IDs may remain when they do not map participant identity to response content.

## Live Rerun Package Evidence

Latest browser UI evidence artifact:

- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T21-15-16-308Z.json`
- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-latest.json`

Earlier API-driven evidence artifact:

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T17-11-47-924Z.json`
- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-latest.json`

| Package type | Package ID | Classification | Files scanned | Failures | Warnings | Required limitation | Result |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| `final-delphi-report` | `ebb790ce-8c34-432a-9ac5-a94f75e88c53` | deidentified_research_report | 9 | 0 | 0 | PASS | PASS |
| `anonymized-response-dataset` | `53e43718-3468-4fea-bacd-7fd240c06e9d` | deidentified_research_report | 14 | 0 | 0 | PASS | PASS |
| `audit-package` | `71abb86b-84bd-43b4-a8a4-b135892da89b` | restricted_internal_admin_audit | 10 | 0 | 17 | PASS | PASS WITH RESTRICTED WARNINGS |
| `provenance-bundle` | `bea0ca43-08c2-47ce-985c-6b4727f9cdb8` | deidentified_research_report | 10 | 0 | 0 | PASS | PASS |
| `complete-archive` | `b34fef2b-de8b-4cc3-9503-ac6c65f613db` | complete_restricted_archive | 12 | 0 | 35 | PASS | PASS WITH RESTRICTED WARNINGS |

Restricted warning interpretation:

- `audit-package` and `complete-archive` are intentionally not safe for de-identified research/report sharing.
- They are clearly labeled restricted/internal or complete restricted archive.
- Scanner warnings are acceptable for these classifications only when package metadata declares the restriction and `safe_for_deidentified_research_report_sharing` is false.

## AI And Support Privacy

AI export privacy:

- De-identified provenance exports redact AI user ID fields.
- AI input scope IDs are export-scoped rather than raw input IDs.
- AI prompts, inputs, and outputs containing direct identifiers are not included in de-identified research/report exports.
- No External AI mode was active in the rerun.

Support-loop export privacy:

- Standard de-identified export packages do not include support/issue-note identity linkages.
- Restricted/internal packages declare whether support content is included.

Participant final closeout privacy:

- A 2026-05-06 browser run found participant-facing final closeout item text could expose synthetic participant labels from participant-authored Round 1 text.
- The closeout path now applies the same obvious direct-identifier redaction used by de-identified exports to final-result item wording and participant final-response item/rationale text.
- The latest browser rerun observed no `SYN-P001` through `SYN-P008` labels or `example.test` emails in inspected final closeout DOM text at 320px, 390px, or 414px.

## Result Summary

| Severity | Count | Notes |
| --- | ---: | --- |
| P0 | 0 | Export privacy P0 remediated and live rerun de-identified exports passed. |
| P1 | 0 | No export P1 remains. |
| P2 | 0 | Browser scope condition is tracked in the defect log, not as an export privacy defect. |
| P3 | 0 | No export P3 recorded. |

Current export privacy decision: PASS for regenerated de-identified exports; restricted/internal packages are clearly labeled and separated.
