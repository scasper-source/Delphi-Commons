# Defect Log

Live execution status: CONTROLLED SYNTHETIC LOCAL BROWSER UI RERUN COMPLETED WITH CONDITIONS.

Current decision impact: no P0/P1 defects remain. The run is GO WITH CONDITIONS for controlled synthetic mock testing only. The latest pass completed all 8 synthetic participant submissions for Rounds 1-4 through local Microsoft Edge browser UI automation. The prior `fetch failed` attempt remains classified as an environment/startup blocked attempt, not a confirmed product P0. The remaining open P2 condition is a 320px mobile horizontal-overflow finding in the final participant closeout view. This pass was automated and local; it is not production, human-subjects, IRB, or accessibility-conformance evidence.

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
| FMT-P2-BROWSER-SCOPE | P2 | Browser evidence scope | CLOSED FOR BROWSER AUTOMATION | 2026-05-06 browser UI automation completed 8/8 synthetic participants through Rounds 1-4. | For a later human-observed rehearsal, repeat the pass manually with separate browser profiles or deliberate reloads. | The participant submission gap is closed for local browser automation; it is still not a human-observed manual click-through. |
| FMT-P2-MOBILE-METHOD-COPY | P2 | Participant mobile smoke copy | REMEDIATED | Earlier participant mobile smoke for a 4-round Classical Delphi run showed stale "3 rounds" / "Modified Delphi" text. The 2026-05-06 manual-browser pass showed "up to 4 rounds" and "Classic Delphi" in participant screenshots. | Fixed in participant portal code by binding Study Time Commitment copy to the active invitation-backed study version, with `workflow.version` fallback and neutral fallback copy when metadata is missing. | Root cause: participant portal copy read wizard defaults instead of active study-version data. Verification: `app/tests/policyGates.test.mjs` plus browser evidence in `manual-browser-mock-trial-run-2026-05-06T17-13-46-275Z.json`. |
| FMT-BROWSER-P1-MOBILE-CLOSEOUT-NAV | P1 | Participant mobile closeout navigation | REMEDIATED | During the browser pass, 320/390/414 participant final checks could not reach Closeout because participant-mode mobile hides the sidebar and the reference bar did not include Closeout. | Added Participant Portal and Closeout to the panelist reference bar; rerun showed required limitation language visible at 320/390/414. | Root cause: mobile participant navigation exposed About/Glossary only while Closeout was allowed for panelists. |
| FMT-BROWSER-P0-FINAL-CLOSEOUT-IDENTIFIER-LEAK | P0 | Participant final closeout privacy | REMEDIATED | `manual-browser-mock-trial-run-2026-05-06T17-01-49-423Z.json` found synthetic labels in participant final closeout item text. | Redacted final-result item wording and participant final-response item/rationale text using the existing export privacy redaction rules; rerun artifact `manual-browser-mock-trial-run-2026-05-06T17-13-46-275Z.json` has P0=0 and no synthetic labels/emails in inspected final closeout DOM text. | Root cause: participant-facing final closeout reused raw materialized item text and final-response rationale text from synthetic participant-authored fields; export redaction existed but closeout redaction did not. |
| FMT-BROWSER-P2-MOBILE-OVERFLOW | P2 | Mobile final closeout layout | OPEN CONDITION | Latest 320px final closeout check reported horizontal overflow while 390px and 414px passed. Required limitation was visible and identifiers were redacted. | Continue controlled synthetic testing with the condition documented; before broader mobile/browser testing, tighten mobile wrapping for final closeout cards and charts. | Non-blocking mobile layout issue; no workflow block or privacy leak observed after remediation. |

## Live Rerun Evidence

Latest browser UI artifact:

- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T17-13-46-275Z.json`
- `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-latest.json`

Historical API-driven artifacts:

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-06T14-18-57-949Z.json`
- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T21-34-02-906Z.json`
- prior blocked attempt: `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T21-28-25-629Z-failed.json`

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

Browser/mobile evidence:

- 8/8 synthetic participants submitted Round 1 through local Edge browser UI automation.
- 8/8 synthetic participants submitted Round 2 through local Edge browser UI automation.
- 8/8 synthetic participants submitted Round 3 through local Edge browser UI automation.
- 8/8 synthetic participants submitted Round 4 through local Edge browser UI automation.
- 320px participant final closeout: PASS WITH P2 layout condition.
- 390px participant final closeout: PASS.
- 414px participant final closeout: PASS.
- Required limitation language visible in final participant closeout at 320px, 390px, and 414px.
- No synthetic participant labels or `example.test` emails observed in inspected final closeout DOM text after remediation.

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
| `final-delphi-report` | `94f1ad57-a66b-4689-8632-16ea23d5f80e` | deidentified_research_report | 0 | 0 | yes |
| `anonymized-response-dataset` | `de734425-c693-4f39-98cf-bb90fd3793b5` | deidentified_research_report | 0 | 0 | yes |
| `audit-package` | `4e5c3269-a927-4469-898c-cca571d27505` | restricted_internal_admin_audit | 0 | 16 | no |
| `provenance-bundle` | `eef6baa6-8d07-4ce0-9b69-3cb6ceee8d33` | deidentified_research_report | 0 | 0 | yes |
| `complete-archive` | `a65b3b99-6e91-47b6-b755-d03f75b6ac54` | complete_restricted_archive | 0 | 35 | no |

## Carryover Watch List

These should continue to be rechecked during later mock testing.

| Watch item | Prior classification | Future check |
| --- | --- | --- |
| Human-observed all-8 browser click-through not completed | Evidence scope note | Optional if a future rehearsal requires non-automated operator evidence |
| 320px final closeout horizontal overflow | P2 mobile layout condition | Tighten final closeout wrapping/charts before broader mobile/browser testing |
| Final report action may be available before terminal round close while UI marks report stage interim | P2 labeling/workflow condition | Confirm Round 4 terminal close before treating final report/export as final |
| Same-tab switching between invitation links may briefly retain prior participant state until reload | P3 friction | Use separate browser profiles/incognito sessions or reload after switching links |
| Continue watching for broken buttons/textboxes and inconsistent smoke-test language | Monitoring item | Record as P0/P1/P2/P3 depending on impact |

## Defects By Severity

| Severity | Count | Status |
| --- | ---: | --- |
| P0 | 0 | No P0 recorded in the successful rerun |
| P1 | 0 | No P1 recorded |
| P2 | 1 | 320px final closeout horizontal overflow condition |
| P3 | 0 | No P3 recorded |
