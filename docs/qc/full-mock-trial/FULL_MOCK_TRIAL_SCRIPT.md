# Full Controlled Mock-Trial Script

Live execution status: CONTROLLED SYNTHETIC LOCAL RERUN COMPLETED WITH CONDITIONS.

This script is the controlling script for the full controlled synthetic mock-participant rehearsal. The latest evidence was recorded on 2026-05-05 after export privacy remediation. The full 8-participant, 4-round lifecycle was completed through local invitation APIs, and headless browser mobile smoke was completed at 320px, 390px, and 414px. A manual all-8 browser UI submission pass remains NOT RUN and is tracked as a P2 condition.

## Scope

- 8 synthetic participants.
- 4 Classical Delphi rounds.
- Local, development, or controlled staging environment only.
- Synthetic data only.
- Documentation-only deterministic AI fixtures by default; existing deterministic local AI helpers may be used when explicitly verified as local/mock and synthetic-only.
- No production deployment.
- No real human-subjects research.
- No IRB launch.
- No sensitive participant data.
- No live external AI calls.

## Canonical Commands Observed

Frontend:

```powershell
cd app
npm run dev
npm run build
npm run lint
npm test
npm run security:audit
```

Backend:

```powershell
cd server
npm run dev
npm run build
npm test
npm run security:audit
npm start
```

No Playwright or Cypress command was found during inspection. Current automated tests are Node test files under `app/tests/` and `server/tests/`.

## Environment Record

| Field | Value |
| --- | --- |
| Commit hash | `9c046cc3594b4e78e607dc37f10989eb2186dfc0` |
| Branch | `master` |
| Date/time | `2026-05-05T17:11:47.924Z` |
| Environment | Local development |
| Backend URL | `http://127.0.0.1:3001` |
| Frontend URL | `http://127.0.0.1:5173` |
| Browser | Microsoft Edge headless smoke |
| Desktop viewport | Staff dashboard headless smoke |
| Mobile widths | PASS at 320px, 390px, and 414px for participant/staff inspected views |
| Commands run | Git metadata, backend health, app/server build, local mock-trial runner |
| AI mode used | Existing deterministic local AI helpers with No External AI mode |
| Observer | Codex local API runner |
| Evidence artifact | `docs/qc/full-mock-trial/artifacts/full-mock-trial-run-latest.json` |

## Future Live Script

### A. Environment And Startup

1. Record commit hash, branch, date/time, environment, browser, viewport, app URL, backend URL, and commands used.
2. Run canonical docs-appropriate checks.
3. Run app/server build/test/typecheck/lint only if executable code changes were made or time permits.
4. Start backend and frontend using documented local/dev commands.
5. Confirm environment is visibly not production, or document absence of staging/mock banner as a defect.

Result: PASS. Backend health reported `environment: development`; headless browser smoke inspected the local frontend.

### B. Study Setup And Governance

6. Study Owner creates or opens the synthetic study.
7. Confirm study purpose is visible.
8. Confirm Delphi suitability/methodology fields exist if implemented.
9. Confirm expert/panel criteria fields exist if implemented.
10. Confirm consent/participant information materials are visible.
11. Confirm consent language truthfully describes confidentiality/anonymity limits if implemented.
12. Confirm withdrawal/voluntariness language is visible if implemented.
13. Configure consensus rule before launch.
14. Launch or activate the study.
15. Attempt to casually change the consensus rule after launch.
16. Confirm the rule is locked or requires a new study version/governance workflow.
17. Repeat this consensus-rule-change attempt after Round 2 and Round 3 if feasible.

Result: PASS through local APIs for study setup, launch, and consensus lock checks. Browser-visible copy was smoke-checked in headless mobile views but not manually clicked through by all participants.

### C. Round 1

18. Open Round 1.
19. All 8 synthetic participants access Round 1.
20. Confirm acknowledgement/consent gate is required before submission.
21. Each participant submits a synthetic open-ended response.
22. Confirm all submissions are visible to the Study Owner in an anonymized or role-appropriate way.
23. Confirm participant identity is not exposed where it should not be exposed.

Result: PASS through API. All 8 synthetic participants submitted Round 1.

### D. Support Loop

24. Participant SYN-P003 submits an issue/support note.
25. PI/admin sees the issue/support note.
26. PI/admin responds.
27. Participant SYN-P003 sees the response.
28. Confirm no other participant sees identity-linked support information.
29. If support-loop functionality is incomplete, document the safest available workaround and classify severity.

Result: PASS through API. SYN-P003 submitted an issue note, PI/admin responded, and SYN-P003 saw the response. Cross-participant negative visibility check remains NOT RUN.

### E. Simulated AI Round 1 To Round 2

30. Run or document simulated AI clustering if supported.
31. Confirm AI output is labeled as suggestion/not final.
32. Confirm AI does not publish directly to participants.
33. Confirm human Accept/Edit/Reject is required.
34. Confirm unique/minority statements are preserved or remain reviewable.
35. Confirm provenance/traceability exists if implemented.
36. Confirm curation decisions are auditable if implemented.
37. Confirm no coercive or consensus-pressuring language appears.

Result: PASS through existing deterministic local AI helper path. Suggestions were labeled non-final and required human curation/signoff before participant-facing release.

### F. Round 2

38. Study Owner opens Round 2.
39. All 8 synthetic participants submit ratings/rationales.
40. Confirm all can complete the round without dead ends.
41. Confirm save/submit states are clear.
42. Confirm participant identity does not leak.

Result: PASS through API. All 8 synthetic participants submitted Round 2 ratings/rationales.

### G. Simulated AI Feedback After Round 2

43. Generate or document controlled feedback.
44. If AI/mock AI drafts feedback narrative, confirm it is neutral and advisory only.
45. Confirm human approval is required before participant-facing release.
46. Confirm feedback contains aggregate information only.
47. Confirm feedback does not pressure convergence.

Result: PASS through API. Controlled feedback/AI assistance remained advisory and human-reviewed.

### H. Round 3

48. Open Round 3.
49. All 8 synthetic participants view controlled feedback.
50. All 8 submit re-ratings/rationales.
51. At least two participants retain disagreement or minority ratings.
52. Confirm the interface permits disagreement without stigma.
53. Confirm no language implies consensus equals correctness.

Result: PASS through API. All 8 synthetic participants submitted Round 3 re-ratings/rationales, including retained disagreement/minority rating patterns.

### I. Simulated AI Feedback After Round 3

54. Generate or document second controlled feedback cycle.
55. Confirm AI/mock AI does not recommend changing consensus thresholds.
56. Confirm AI/mock AI does not recommend dropping dissenting items solely because they are minority views.
57. Confirm any AI-generated summary remains human-reviewed and non-binding.

Result: PASS through API. No evidence that AI recommended threshold changes or dropping dissenting items.

### J. Round 4

58. Open Round 4.
59. All 8 synthetic participants submit final ratings/rationales.
60. Confirm final submit state is clear.
61. Confirm final participant workflow has no dead ends.

Result: PASS through API. All 8 synthetic participants submitted Round 4 final ratings/rationales.

### K. Final Report/Export

62. Generate controlled feedback, final report, or export.
63. Confirm export/report includes consensus threshold used.
64. Confirm export/report includes consensus, near-consensus, and non-consensus where applicable.
65. Confirm export/report includes required limitation language exactly:

"Consensus indicates agreement among this panel; it does not establish correctness."

66. Confirm export/report does not frame consensus as truth.
67. Confirm AI-generated report text, if any, required human approval.

Result: PASS for generation and required limitation. Original API run failed export privacy; focused remediation regression now passes for regenerated de-identified exports, with restricted/internal packages clearly separated.

### L. Export Privacy Check

68. Inspect exported files manually and with simple text search where feasible.
69. Check for participant names, real names, emails, phone numbers, direct identity fields, identity-response mappings, account IDs that function as direct identifiers, support notes leaking identity beyond appropriate roles, and AI prompt/input/output logs containing direct identifiers or identity-response mappings.
70. If the app exports JSON, CSV, PDF, or HTML, inspect each available format.
71. Document exact files checked.
72. Record any identity leakage as P0 unless clearly harmless synthetic-only metadata and not structurally dangerous.

Result: Original API scan failed. Focused remediation scan passed for regenerated de-identified exports: zero failures for `final-delphi-report`, `anonymized-response-dataset`, and `provenance-bundle`; restricted warnings only for `audit-package` and `complete-archive`.

### M. Mobile-Width Rehearsal

73. Repeat highest-risk participant steps at mobile width: consent/acknowledgement, Round 1 submission, support note, Round 2 rating/rationale, Round 3 re-rating, Round 4 final rating, and final submit state.
74. Record mobile layout problems, inaccessible buttons, hidden submit states, horizontal scrolling, clipped text, or impossible workflows.

Required widths:

- 320px
- 390px
- 414px

Result: PARTIAL PASS WITH CONDITION. Headless browser smoke checks passed at 320px, 390px, and 414px for inspected participant final-result and staff dashboard views, with no horizontal overflow and no synthetic participant labels/emails observed in inspected DOM text. A full manual mobile participant submission flow across all high-risk steps remains NOT RUN and is included in the browser scope P2 condition.

## Severity System

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

## Decision Criteria

- P0 defects: 0.
- P1 defects: 0 unless a safe workaround is documented for synthetic testing only.
- All 8 synthetic participants complete Round 1.
- All 8 synthetic participants complete Round 2.
- Round 3 and Round 4 workflows function, or limitations are explicitly documented.
- Support loop works or has a safe documented workaround.
- Report/export works.
- Required limitation sentence appears exactly.
- No identity leakage observed.
- No coercive consensus language observed.
- No AI output becomes participant-facing without human approval.
- No AI output decides consensus, item inclusion, final wording, or final reporting.
- No production or real human-subjects use is implied.

Current status: GO WITH CONDITIONS for controlled synthetic mock testing only. The export privacy P0 is remediated, all 8 synthetic participants completed 4 Classical Delphi rounds through local invitation APIs, and regenerated de-identified exports passed privacy scanning. The condition is that the lifecycle was API-driven with headless browser/mobile smoke, not a manual all-8 browser UI submission pass.
