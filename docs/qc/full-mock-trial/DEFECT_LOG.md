# Defect Log

Live execution status: CONTROLLED SYNTHETIC LOCAL RERUN COMPLETED WITH CONDITIONS.

Current decision impact: no P0/P1 defects remain. The run is GO WITH CONDITIONS for controlled synthetic mock testing only. The remaining P2 condition is scope-related: the full lifecycle was API-driven through local invitation endpoints with headless mobile browser smoke, not a manual all-8 browser UI submission pass.

## Severity Definitions

P0 blocks even controlled synthetic mock trial:

- Identity leakage in participant-facing views or exports.
- Identity-response mapping exposed to participants.
- Direct identifiers sent to AI without explicit safe synthetic-only configuration.
- External AI active by default without explicit configuration/disclosure.
- Consensus rule can be changed after launch without version/governance protection.
- Participant can submit without required acknowledgement/consent.
- Participant cannot complete required Round 1 or Round 2 workflow.
- Export/report omits required limitation language.
- App frames consensus as correctness/truth.
- Coercive consensus language.
- AI can publish participant-facing content without human approval.
- AI can decide inclusion/exclusion/final wording without human approval.
- Unsafe production/sensitive-data path.

P1 blocks larger controlled mock trial unless safely worked around:

- Support loop broken with no safe workaround.
- Report/export generation broken.
- Round 3 or Round 4 workflow unavailable despite being represented as supported.
- Curation creates dead end or loses responses.
- Missing save/submit state causing realistic data-loss risk.
- Mobile workflow impossible for participant completion.
- Governance/AI gate missing for participant-facing content.
- AI suggestions not clearly labeled as non-final.
- AI provenance missing where the feature claims traceability.
- External AI boundary unclear.

P2 can proceed with documented condition:

- Confusing copy.
- Minor layout issue.
- Non-blocking mobile awkwardness.
- Missing helper text.
- Incomplete but non-critical audit display.
- AI simulation unavailable while AI feature is inactive or not represented as ready.
- Cosmetic defects.
- Evidence scope limitation that does not block controlled synthetic testing.

P3 backlog:

- Polish.
- Minor documentation improvement.
- Low-risk UX improvement.

## Observed Defects And Conditions

| ID | Severity | Area | Status | Evidence | Workaround | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| FMT-2026-05-05-P0-001 | P0 | Export privacy | REMEDIATED | Original scan found synthetic identifier/raw participant ID hits in generated export files. Rerun de-identified packages had zero scan failures. | Fixed by export classification metadata, de-identified free-text redaction, restricted/internal package separation, and regression privacy scanning. | Root cause: standard exports could carry participant self-identifiers in free text, and internal audit/archive content was not clearly separated from de-identified exports. |
| FMT-P2-BROWSER-SCOPE | P2 | Browser evidence scope | OPEN CONDITION | The complete 8-participant, 4-round lifecycle was API-driven through local invitation endpoints. Browser evidence was headless mobile smoke, not a manual all-8 UI submission pass. | For a later human-observed rehearsal, run all participant flows manually or with browser UI automation using isolated profiles/reloads. | Does not block controlled synthetic mock testing; it does prevent claiming a manual all-8 browser pass. |

## Live Rerun Evidence

Primary artifact:

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T17-11-47-924Z.json`
- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-latest.json`

Live rerun status:

- P0: 0.
- P1: 0.
- P2: 1.
- P3: 0.

Lifecycle:

- 8/8 synthetic participants completed Round 1.
- 8/8 synthetic participants completed Round 2.
- 8/8 synthetic participants completed Round 3.
- 8/8 synthetic participants completed Round 4.
- SYN-P007 and SYN-P008 retained disagreement/minority rating patterns.
- Support loop completed end to end.
- Consensus rule change attempts after activation, Round 2, and Round 3 were blocked.

Mobile/headless browser smoke:

- 320px participant/staff views: PASS.
- 390px participant/staff views: PASS.
- 414px participant/staff views: PASS.
- No horizontal overflow observed in inspected views.
- No synthetic participant labels or `example.test` emails observed in inspected DOM text.

## Export Privacy Remediation Evidence

Relevant code paths:

- `server/src/exports/exportPrivacy.ts`
- `server/src/routes/reports.ts`
- `server/src/stores/exportManifestStore.ts`

Regression test:

- `server/tests/zzExportPrivacy.test.mjs`

Live rerun package evidence:

| Package type | Package ID | Classification | Scan failures | Scan warnings | Safe for de-identified sharing |
| --- | --- | --- | ---: | ---: | --- |
| `final-delphi-report` | `bfc26b65-1c29-4fc2-95e4-9e5e795c9f77` | deidentified_research_report | 0 | 0 | yes |
| `anonymized-response-dataset` | `c72b0bb7-314f-4516-9483-0c4ace7e8711` | deidentified_research_report | 0 | 0 | yes |
| `audit-package` | `faaa01f4-e592-480d-8ef0-6db476d20a3d` | restricted_internal_admin_audit | 0 | 16 | no |
| `provenance-bundle` | `ae0966bc-1994-4c1d-8557-fcb7f924778a` | deidentified_research_report | 0 | 0 | yes |
| `complete-archive` | `3ab752c0-b430-4ccf-9d38-657bb5784ad0` | complete_restricted_archive | 0 | 35 | no |

## Carryover Watch List

These should continue to be rechecked during later mock testing.

| Watch item | Prior classification | Future check |
| --- | --- | --- |
| Manual all-8 browser UI pass not completed | P2 evidence scope condition | Complete manual/in-app browser pass if the next rehearsal requires human-observed UI evidence |
| Final report action may be available before terminal round close while UI marks report stage interim | P2 labeling/workflow condition | Confirm Round 4 terminal close before treating final report/export as final |
| Same-tab switching between invitation links may briefly retain prior participant state until reload | P3 friction | Use separate browser profiles/incognito sessions or reload after switching links |
| Continue watching for broken buttons/textboxes and inconsistent smoke-test language | Monitoring item | Record as P0/P1/P2/P3 depending on impact |

## Defects By Severity

| Severity | Count | Status |
| --- | ---: | --- |
| P0 | 0 | Export privacy P0 remediated and rerun passed |
| P1 | 0 | No P1 recorded |
| P2 | 1 | Browser evidence scope condition |
| P3 | 0 | No P3 recorded |
