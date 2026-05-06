# GO / NO-GO For Controlled Full Mock Trial

Current decision: GO WITH CONDITIONS.

Update 2026-05-06: focused Windows mobile closeout remediation rerun completed from the clean GitHub checkout with backend/frontend health confirmed. The browser runner again completed 8/8 synthetic participants through Rounds 1-4 and export privacy scan failures remained 0. The prior 320px final closeout horizontal-overflow condition is remediated; 320px, 390px, and 414px passed with overflow delta 0.

Decision scope: controlled synthetic mock testing only.

Reason: the export privacy P0 was remediated and the latest focused Windows rerun completed the 8-synthetic-participant, 4-round Classical Delphi lifecycle with all participant submissions made through local Microsoft Edge browser UI automation. Regenerated de-identified exports passed privacy scanning with zero failures. Final participant closeout checks at 320px, 390px, and 414px showed the required limitation language, no synthetic labels/emails, and no page-level horizontal overflow after remediation.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Live Execution Status

| Evidence | Status |
| --- | --- |
| 8-participant local invitation/API trial | PASS |
| 4 Classical Delphi rounds | PASS |
| Consent gate before participant submission | PASS |
| Support loop | PASS |
| Consensus lock after activation/Round 2/Round 3 | PASS |
| Simulated/local deterministic AI governance | PASS |
| Final results and report/export generation | PASS |
| Export privacy scan | PASS for de-identified exports; restricted warnings only for restricted packages |
| Required limitation language | PASS |
| Browser UI submission pass for all 8 participants, Rounds 1-4 | PASS |
| Mobile final closeout at 320px, 390px, 414px | PASS: required limitation visible, identifiers redacted, and no page-level horizontal overflow at all three widths |
| Human-observed manual click-through | NOT RUN |

## AI Mode

Observed mode: existing deterministic local AI helpers with No External AI mode.

Not used:

- External AI connector.
- Live external AI calls.
- New AI integration.
- Real participant data.

## Defects By Severity

| Severity | Count | Notes |
| --- | ---: | --- |
| P0 | 0 | Export privacy P0 remediated and rerun de-identified exports had zero scan failures. |
| P1 | 0 | No P1 recorded from this run. |
| P2 | 0 | No P2 recorded in the latest focused Windows rerun. |
| P3 | 0 | No P3 recorded. |

## Decision Criteria Result

| Criterion | Result |
| --- | --- |
| P0 defects: 0 | PASS |
| P1 defects: 0 unless safe workaround documented | PASS |
| All 8 synthetic participants complete Round 1 | PASS |
| All 8 synthetic participants complete Round 2 | PASS |
| Round 3 and Round 4 workflows function | PASS |
| Support loop works or has safe documented workaround | PASS |
| Report/export works | PASS |
| Required limitation sentence appears exactly | PASS |
| No identity leakage observed | PASS for de-identified exports and inspected participant/staff browser DOM text |
| No coercive consensus language observed | PASS |
| No AI output becomes participant-facing without human approval | PASS |
| No AI output decides consensus, item inclusion, final wording, or final reporting | PASS |
| No production or real human-subjects use is implied | PASS |

Required limitation observed exactly:

"Consensus indicates agreement among this panel; it does not establish correctness."

## Conditions

- Treat the run as a controlled synthetic local trial with browser UI automation for participant submissions and local API support for setup, curation, staff support response, final release, and exports.
- Treat the prior 320px final closeout horizontal overflow as remediated for controlled synthetic local browser evidence. Continue to avoid broader production/accessibility/mobile-readiness claims without separate evidence.
- Before a larger human-observed mock exercise, optionally repeat the pass with a human operator and separate browser profiles or deliberate reloads between invitation links.
- Keep using synthetic data only.
- Keep external AI disabled unless a future synthetic-only protocol explicitly configures and discloses it.

## Focused Windows Mobile Evidence

- Artifact: `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-2026-05-06T21-15-16-308Z.json`
- Latest pointer: `docs/qc/full-mock-trial/artifacts/manual-browser-mock-trial-run-latest.json`
- 320px screenshot: `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-320.png`
- 390px screenshot: `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-390.png`
- 414px screenshot: `docs/qc/full-mock-trial/artifacts/focused-mobile-closeout-2026-05-06T21-15-16-308Z-414.png`
- Horizontal overflow result: 320px PASS, 390px PASS, 414px PASS.
- Required limitation-language result: PASS at 320px, 390px, and 414px.
- Participant final closeout DOM privacy result: PASS; no synthetic labels or `example.test` emails observed by the runner.

## Export Package Evidence

| Package type | Package ID | Classification | Scan failures | Scan warnings | Result |
| --- | --- | --- | ---: | ---: | --- |
| `final-delphi-report` | `ebb790ce-8c34-432a-9ac5-a94f75e88c53` | deidentified_research_report | 0 | 0 | PASS |
| `anonymized-response-dataset` | `53e43718-3468-4fea-bacd-7fd240c06e9d` | deidentified_research_report | 0 | 0 | PASS |
| `audit-package` | `71abb86b-84bd-43b4-a8a4-b135892da89b` | restricted_internal_admin_audit | 0 | 17 | PASS WITH RESTRICTED WARNINGS |
| `provenance-bundle` | `bea0ca43-08c2-47ce-985c-6b4727f9cdb8` | deidentified_research_report | 0 | 0 | PASS |
| `complete-archive` | `b34fef2b-de8b-4cc3-9503-ac6c65f613db` | complete_restricted_archive | 0 | 35 | PASS WITH RESTRICTED WARNINGS |

Restricted warning interpretation: warnings in `audit-package` and `complete-archive` are acceptable only because those packages are clearly classified as restricted/internal and not safe for de-identified research/report sharing.

## Remaining Blockers Before Real Human-Subjects Deployment

These remain regardless of synthetic mock-trial status:

- Phase 10 operational readiness package.
- Deployment documentation.
- Environment variable guide.
- Database migration and rollback procedure.
- Backup/restore runbook and rehearsed restore evidence.
- Incident response runbook.
- Breach/escalation workflow.
- Admin onboarding.
- Responsible disclosure policy.
- Release notes/changelog process.
- Consolidated known limitations.
- Accessibility review.
- Production security review.
- Real authentication/session hardening beyond local/demo assumptions.
- IRB/institutional review and approval where applicable.
- Real-data protocol, consent, recruitment, retention, access-control, monitoring, and governance approvals.
