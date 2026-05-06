# Defect Log

Live execution status: CONTROLLED SYNTHETIC LOCAL RERUN COMPLETED WITH CONDITIONS.

Current decision impact: no P0/P1 defects remain for the successful rerun. The prior `fetch failed` attempt is classified as an environment/startup blocked attempt (backend/frontend not started), not a confirmed product P0. Manual all-8 browser UI submission remains NOT RUN. FMT-P2-MOBILE-METHOD-COPY remains remediated in code/tests pending explicit manual browser re-evidence.

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
| FMT-P2-BROWSER-SCOPE | P2 | Browser evidence scope | OPEN CONDITION | The complete 8-participant, 4-round lifecycle was API-driven through local invitation endpoints in the prior successful run. Manual all-8 browser UI submission pass remains not performed. | For a later human-observed rehearsal, run all participant flows manually or with browser UI automation using isolated profiles/reloads. | Does not block controlled synthetic mock testing; it does prevent claiming a manual all-8 browser pass. |
| FMT-ENV-2026-05-05-FETCH-STARTUP | P2 | Runner startup precondition | BLOCKED ATTEMPT (NOT PRODUCT DEFECT) | `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T21-28-25-629Z-failed.json` captured `fetch failed` when services were not up; a subsequent rerun with backend health OK and frontend running succeeded (`...21-34-02-906Z.json`). | Start backend (`server/dist/index.js`) and verify `/health` before running; start frontend for browser smoke capture. | Reclassified from temporary P0 framing to environment/startup evidence issue. |
| FMT-P2-MOBILE-METHOD-COPY | P2 | Participant mobile smoke copy | REMEDIATED (CODE/TEST), BROWSER EVIDENCE PENDING | Prior participant mobile smoke for the 4-round Classical Delphi synthetic run showed stale text: "This study is planned for up to 3 rounds" and a "Modified Delphi" badge. | Fixed in participant portal code by binding Study Time Commitment copy to the active invitation-backed study version, with `workflow.version` fallback and neutral fallback copy when metadata is missing. | Root cause: participant portal copy read wizard defaults instead of active study-version data. Verification: `app/tests/policyGates.test.mjs` covers active-version method/round copy behavior and guards against wizard-default leakage. 2026-05-06 rerun still lacks manual/mobile browser re-evidence. |
| FMT-2026-05-06-MANUAL-BROWSER-GAP | P2 | Browser evidence scope | OPEN CONDITION | 2026-05-06 rerun succeeded for API-driven lifecycle but did not perform manual all-8 browser UI submissions. | Manual participant-by-participant browser run (or stable UI automation) must be executed and evidenced before claiming full browser pass completion. | Keeps readiness evidence gap open for manual browser submission coverage. |
| FMT-2026-05-06-MOBILE-NOT-RUN | P2 | Mobile-width browser pass | OPEN CONDITION | 2026-05-06 artifact recorded 320/390/414 smoke as NOT_RUN because no supported headless browser executable was found. | Install/configure supported browser executable and rerun mobile checks in controlled environment. | This is an evidence limitation, not an API lifecycle failure. |

## Live Rerun Evidence

Primary artifact:

- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T21-34-02-906Z.json`
- `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-latest.json`
- prior blocked attempt: `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-2026-05-05T21-28-25-629Z-failed.json`

Live rerun status:

- P0: 0.
- P1: 0.
- P2: 2.
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
- Stale method/round-count text was observed in participant mobile smoke and recorded as P2.

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
| Manual all-8 browser UI pass not completed | P2 evidence scope condition | Complete manual/in-app browser pass if the next rehearsal requires human-observed UI evidence |
| Participant mobile smoke shows stale method/round-count copy | P2 confusing copy | Correct participant time-commitment/method badge copy so it reflects the active study version |
| Final report action may be available before terminal round close while UI marks report stage interim | P2 labeling/workflow condition | Confirm Round 4 terminal close before treating final report/export as final |
| Same-tab switching between invitation links may briefly retain prior participant state until reload | P3 friction | Use separate browser profiles/incognito sessions or reload after switching links |
| Continue watching for broken buttons/textboxes and inconsistent smoke-test language | Monitoring item | Record as P0/P1/P2/P3 depending on impact |

## Defects By Severity

| Severity | Count | Status |
| --- | ---: | --- |
| P0 | 0 | No P0 recorded in the successful rerun |
| P1 | 0 | No P1 recorded |
| P2 | 2 | Browser evidence scope condition; headless smoke NOT RUN where executable unavailable |
| P3 | 0 | No P3 recorded |
