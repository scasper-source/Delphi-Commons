# Light QC Results

Date/time: 2026-05-04, local development environment.

## 1. Clean Run Check

| Check | Command / Evidence | Result |
|---|---|---|
| App dependencies | `npm.cmd install --ignore-scripts --no-audit` in `app` | Passed; up to date. Lockfile synchronized package license metadata. |
| Server dependencies | `npm.cmd install --ignore-scripts --no-audit` in `server` | Passed; up to date. Lockfile synchronized package license metadata. |
| Frontend running | `Invoke-WebRequest http://127.0.0.1:5173/` | HTTP 200. |
| Backend running | `Invoke-WebRequest http://127.0.0.1:3001/health` | Returned backend health JSON. |
| Migrations | `GET /admin/storage-status` as owner | 8 migrations applied; SQLite WAL and foreign keys enabled. |
| Seed data | No standalone seed script found. Demo users are seeded automatically outside production unless disabled. Backend road tests create synthetic study data. |
| App tests | `npm.cmd test` in `app` | Passed 26/26. |
| Server tests | `npm.cmd test` in `server` | Passed 7/7. |
| App build | `npm.cmd run build` in `app` | Passed. |
| Server build | `npm.cmd run build` in `server` | Passed. |
| App lint | `npm.cmd run lint` in `app` | Passed with 2 warnings, 0 errors. |
| App security audit | `npm.cmd run security:audit` in `app` | Passed; 0 high vulnerabilities. |
| Server security audit | `npm.cmd run security:audit` in `server` | Passed; 0 high vulnerabilities. |

Note: initial app `npm audit` without registry access failed in sandbox, then passed after approved registry access.

## 2. Happy-Path Delphi Flow

The backend road-test suite completed the synthetic Delphi lifecycle. Evidence from `server/tests/roadtest.test.mjs` and passing `server npm.cmd test`:

- create study
- create study version
- configure study design, consent, panel criteria, consensus rule, and pre-round consensus input
- enforce governance signoffs before launch
- open Round 1
- submit synthetic Round 1 responses
- block curation before Round 1 closes
- close Round 1
- synthesize and manually curate traceable Round 2 items
- require AI suggestion human decision/signoff before participant-facing publication
- configure and lock Round 2 feedback
- open Round 2
- submit synthetic Round 2 ratings and rationales
- detect non-response and preserve attrition context
- generate Round 2 report
- close Round 2
- carry forward Round 3 items
- configure/open Round 3
- submit synthetic Round 3 ratings
- generate final report, final results snapshot, governed export packages, audit/provenance package, and archive/backup checks

Result: automated happy-path backend flow passed.

Limitation: a full manual browser happy-path click-through was not completed in this light baseline.

## 3. Charter Red-Flag Check

| Requirement | Observed Support | Result |
|---|---|---|
| Explicit consent | Consent version and participant acknowledgement are required before response submission. | Pass for mock baseline. |
| Consent version/timestamp | Consent versions and consent records are represented and audited. | Pass. |
| Withdrawal | Participant withdrawal and deletion/retention review paths exist with non-punitive language. | Pass. |
| Identity/response separation | Data integrity endpoint reports no direct identity fields in responses; identity, consent, responses, items, audit, and exports are separate collections/tables. | Pass. |
| Neutral feedback | Frontend tests reject forbidden coercive language; controlled feedback copy is neutral. | Pass. |
| Locked consensus rule | Backend tests enforce locked consensus rule and prevent mid-study threshold edits. | Pass. |
| Non-consensus reporting | Reports/exports include non-consensus and required limitation language. | Pass. |
| Audit logs | Audit integrity endpoint returned `ok: true`; tests verify append-only audit behavior. | Pass. |
| Required interpretation limit | Required statement appears in app/server/export renderers: "Consensus indicates agreement among this panel; it does not establish correctness." | Pass. |

## 4. AI Governance Red-Flag Check

| Requirement | Observed Support | Result |
|---|---|---|
| AI suggestions labeled | UI/tests include "AI Suggestion (Not Final)" / "AI Suggestion - Not Final." | Pass. |
| Human acceptance required | Backend tests block AI publication without human acceptance/signoff. | Pass. |
| Required signoff enforced | Road tests enforce Study Owner and Ethics/Methods signoff where configured. | Pass. |
| AI does not pressure convergence | Static tests reject coercive participant-facing language. | Pass. |
| Traceability preserved | AI suggestions, item materialization, provenance, audit, output hashes, and export package evidence are tested. | Pass. |
| External AI disabled unless configured | AI connector defaults safe; no external AI mode and feature permissions are server-gated. | Pass. |

## 5. Security Smoke Test

| Check | Evidence | Result |
|---|---|---|
| Committed secrets | Static scan found no `.env`, private key, or obvious secret files tracked. `git ls-files server/data` returned none. | Pass with local-data caveat. |
| Secrets in frontend bundle/source | Frontend tests reject browser storage and unsafe HTML sinks; security scan did not find obvious hardcoded provider credentials. | Pass. |
| Participant identifiers in URLs | Static scan found staff/demo API URLs using `participant_id` query parameters. | Defect QC-LB-001. |
| Browser storage | Frontend tests assert no `localStorage` or `sessionStorage` usage. | Pass. |
| Logs/audit secrets | Tests assert API keys, encrypted key names, OTPs, tokens, and phone numbers do not appear in audit/export paths. | Pass. |
| Response exports | Tests assert anonymized participant CSV and governed exports exclude API key material and preserve limitations. | Pass. |
| Unauthorized admin/study access | Anonymous `/studies` and `/admin/audit-integrity` returned 403. | Pass. |
| Participant access to another response | Existing backend tests cover participant-scoped invitation/magic-link access and identity mapping restrictions. | Pass by automated tests. |

## 6. Lean / Six Sigma Friction Walk

This was a light static/automated walk, not a full observed browser trial.

Approximate workflow burden:

- Study creation and opening workspace: 1-2 screens, about 2-4 key actions after landing.
- Study Builder: 9 configured steps plus optional sidecars; clear but still substantial for a PI.
- Consent setup: one Study Builder step, then participant acknowledgement at entry.
- Round 1 participant response: orientation/consent, one response screen, save/submit/review actions.
- Curation: curation desk with AI suggestion/manual item workflow; requires governance-aware review.
- Round 2: round setup/open, participant controlled-feedback cards, rating/rationale, save/submit/review.
- Export/report: reporting screen and export package actions.

Friction observations:

- Study Builder is methodologically rich but heavy; acceptable for mock PI testing, likely needs guided templates later.
- The local/mock dashboard can confuse users because it shows active mock content but also says "Create or open a study."
- Participant issue support loop now exists, but multi-session browser verification remains needed.
- Save/resume and sticky actions are present in participant flows.
- No horizontal-scroll browser audit was performed in this light pass.

## 7. Delphi-Method Fidelity Check

| Method Requirement | Observed Support | Result |
|---|---|---|
| At least two rounds | Supports Round 1 plus later structured rounds. | Pass. |
| Round 1 open-ended | Round 1 open-text response flow and curation are present. | Pass. |
| Modified Delphi warning/provenance | Study format/provenance and modified Delphi warnings exist in design/reporting surfaces. | Pass. |
| Expert inclusion criteria | Panel criteria are captured in Study Builder and governance packets. | Pass. |
| Neutral/statistical feedback | Median, IQR/distribution, neutral summaries, and rationales are configured/locked by round. | Pass. |
| Consensus predefined | Consensus threshold/source/process are pre-launch settings and locked after governance. | Pass. |
| Dissent/non-consensus reportable | Final/reporting outputs include non-consensus and preserved perspectives. | Pass. |
| Item provenance preserved | Item source links, AI provenance, manual edits, merge/split/reject rationale, and export provenance are tested. | Pass. |

## Overall Baseline

No P0 or P1 blocker was found for a controlled mock trial with synthetic or low-risk data. Several P2 evidence gaps and mock-trial conditions remain.

