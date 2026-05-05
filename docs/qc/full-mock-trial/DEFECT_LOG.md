# Defect Log

Live execution status: API-DRIVEN LOCAL RUN COMPLETED; EXPORT PRIVACY REMEDIATION VERIFIED; FULL BROWSER/MOBILE RUN NOT COMPLETED.

Current decision impact: the export privacy P0 is remediated in regression evidence, but no GO is issued because the full browser/mobile run is still NOT RUN.

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

P3 backlog:

- Polish.
- Minor documentation improvement.
- Low-risk UX improvement.

## Observed Defects In Full Mock Trial

| ID | Severity | Area | Status | Evidence | Workaround | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| FMT-2026-05-05-P0-001 | P0 | Export privacy | REMEDIATED | Original scan found synthetic identifier/raw participant ID hits and direct-identifier field-name hits in generated export files. Regression packages regenerated after remediation had zero scan failures for de-identified exports. | Fixed by export classification metadata, de-identified free-text redaction, restricted/internal package separation, and regression privacy scanning. | Root cause: export files claimed identifiers were excluded, but standard exports could carry participant self-identifiers in free text, and internal audit/archive content was not clearly separated from de-identified research/report exports. |
| FMT-2026-05-05-P2-001 | P2 | Browser/mobile evidence | OPEN | Full manual browser pass and mobile widths 320px, 390px, and 414px were NOT RUN. | Run the manual browser/mobile rehearsal after P0 export issue is fixed. | API-driven lifecycle completed, but UI-specific issues cannot be cleared from API evidence alone. |

## Export Privacy Remediation Evidence

Remediation summary:

- Added export package privacy metadata for de-identified, restricted internal/admin audit, and complete restricted archive classifications.
- Added conservative export-output redaction for obvious participant labels, email-like strings, phone-like strings, and UUID-like strings in de-identified export text.
- Kept stored source responses unchanged.
- Added a privacy scanner helper that fails de-identified exports on participant-linkable identifiers and warns on correctly labeled restricted/internal packages.
- Added a regression test that seeds `SYN-P001` through `SYN-P008`, `example.test` identifiers, phone-like strings, and participant UUIDs in open text, rationales, provenance excerpts, and audit events.

Regression tests added:

- `server/tests/zzExportPrivacy.test.mjs`

Relevant code paths changed:

- `server/src/exports/exportPrivacy.ts`
- `server/src/routes/reports.ts`
- `server/src/stores/exportManifestStore.ts`

Regenerated package evidence from the focused regression run:

| Package type | Package ID | Classification | Scan failures | Scan warnings | Safe for de-identified sharing |
| --- | --- | --- | ---: | ---: | --- |
| `final-delphi-report` | `780fb0bd-ecce-4504-8119-2c1ddf9b6d07` | deidentified_research_report | 0 | 0 | yes |
| `anonymized-response-dataset` | `72e3bbe4-1a71-454e-8df0-0cd53de5c690` | deidentified_research_report | 0 | 0 | yes |
| `audit-package` | `91393805-d9e1-4ea7-aa9c-931614aee16a` | restricted_internal_admin_audit | 0 | 4 | no |
| `provenance-bundle` | `d9601448-874e-4e49-9b15-08532b1c0015` | deidentified_research_report | 0 | 0 | yes |
| `complete-archive` | `0120a1a1-1c15-404d-aeeb-db0a154186b6` | complete_restricted_archive | 0 | 8 | no |

Commands:

- `npm.cmd run build`
- `node --test --test-isolation=none tests\zzExportPrivacy.test.mjs`
- `node --test --test-isolation=none tests\roadtest.test.mjs`
- `node --test --test-isolation=none tests\zzParticipantIssue.test.mjs`
- `npm.cmd test`

## Non-Defect Runner Note

An earlier API runner attempt reached Round 1, then failed during AI item materialization because the runner sent `human_rationales` where the backend expects `rationales`. The corrected runner continued the same synthetic study with fresh invitations. This was a runner payload correction, not a product defect.

## Carryover Watch List From Prior QC

These are not newly observed defects in this run. They should be explicitly rechecked during the next browser/mobile run.

| Watch item | Prior classification | Future check |
| --- | --- | --- |
| Dedicated mobile-width rehearsal at 320px, 390px, and 414px not yet completed | P2 evidence gap | Complete mobile-width participant path checks |
| Final report action may be available before terminal round close while UI marks report stage interim | P2 labeling/workflow condition | Confirm Round 4 terminal close before treating final report/export as final |
| Same-tab switching between invitation links may briefly retain prior participant state until reload | P3 friction | Use separate browser profiles/incognito sessions or reload after switching links |
| Continue watching for broken buttons/textboxes and inconsistent smoke-test language | Monitoring item | Record as P0/P1/P2/P3 depending on impact |

## Defects By Severity

| Severity | Count | Status |
| --- | ---: | --- |
| P0 | 0 | Export privacy P0 remediated in regression evidence |
| P1 | 0 | No P1 defect recorded from API-driven run |
| P2 | 1 | Browser/mobile evidence gap |
| P3 | 0 | No P3 defect recorded |
