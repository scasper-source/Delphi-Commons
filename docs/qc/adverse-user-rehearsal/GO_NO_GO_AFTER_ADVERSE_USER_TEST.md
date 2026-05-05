# GO / NO-GO After Adverse User Test

Current decision: GO WITH CONDITIONS.

Decision scope: continued controlled synthetic mock testing only.

This decision is not production readiness and not real human-subjects readiness.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Rationale

The adverse-user rehearsal found one P0 formula-injection defect in de-identified CSV exports. That P0 was narrowly remediated, regression-tested, and rerun. The current completed adverse artifact shows:

- P0 defects: 0.
- P1 defects: 0.
- P2 conditions: 2.
- De-identified export privacy failures: 0.
- Spreadsheet formula failures: 0.
- Required limitation language present.
- No XSS execution in headless browser smoke.
- No same-tab identity/response cross-linking observed.
- No support-loop identity leakage observed.
- No AI governance bypass observed.
- Participant withdrawal/removal governance path available.

## Evidence

Current passing artifact:

- `docs/qc/adverse-user-rehearsal/artifacts/adverse-user-rehearsal-2026-05-05T17-40-13-932Z.json`
- `docs/qc/adverse-user-rehearsal/artifacts/adverse-user-rehearsal-latest.json`

Initial completed artifact with P0:

- `docs/qc/adverse-user-rehearsal/artifacts/adverse-user-rehearsal-2026-05-05T17-34-58-577Z.json`

Screenshots:

- `docs/qc/adverse-user-rehearsal/artifacts/adverse-participant-320-320.png`
- `docs/qc/adverse-user-rehearsal/artifacts/adverse-participant-390-390.png`
- `docs/qc/adverse-user-rehearsal/artifacts/adverse-participant-414-414.png`
- `docs/qc/adverse-user-rehearsal/artifacts/same-tab-invite-switch-390.png`

## Execution Status

| Evidence | Status |
| --- | --- |
| Local/API adverse lifecycle | PASS |
| 8 synthetic participants | PASS |
| 4-round Classical Delphi adverse path | PASS |
| Malicious synthetic Round 1 inputs | PASS |
| Consent bypass check | PASS |
| Submit after round closed check | PASS |
| Duplicate submit check | PASS WITH P2 CONDITION |
| IDOR/access-control checks | PASS |
| Support-loop abuse checks | PASS |
| AI prompt-injection checks | PASS |
| Export privacy scan | PASS after remediation |
| Spreadsheet formula-injection scan | PASS after remediation |
| Stored-XSS/headless rendering smoke | PASS WITH P2 CONDITION |
| Same-tab invitation switch | PASS |
| Payload-size abuse check | PASS |
| Participant withdrawal/removal governance path | PASS |
| Manual all-8 browser UI adverse pass | NOT RUN |
| Full manual mobile adverse pass | NOT RUN |

## Export Package Evidence

| Package | Classification | Package ID | Privacy failures | Formula failures | Rendering warnings | Result |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `final-delphi-report` | `deidentified_research_report` | `b048b1d7-9880-46cd-94cf-bd616631113e` | 0 | 0 | 0 | PASS |
| `anonymized-response-dataset` | `deidentified_research_report` | `21415e27-236b-4713-bd93-2a4164661b6c` | 0 | 0 | 5 | PASS WITH P2 CONDITION |
| `audit-package` | `restricted_internal_admin_audit` | `a3faeeb6-3149-4154-a3e8-b7543c76ca1b` | 0 | 0 | 0 | PASS WITH RESTRICTED WARNINGS |
| `provenance-bundle` | `deidentified_research_report` | `596d9333-f5ac-4278-bccf-f8e1e13784a4` | 0 | 0 | 2 | PASS WITH P2 CONDITION |
| `complete-archive` | `complete_restricted_archive` | `22439adf-dbab-4175-93e2-712d20726fe6` | 0 | 0 | 5 | PASS WITH RESTRICTED WARNINGS AND P2 CONDITION |

Restricted/internal packages are not safe for de-identified sharing and must remain separated.

## Decision Criteria

| Criterion | Result |
| --- | --- |
| P0 defects: 0 | PASS after remediation |
| P1 defects: 0 unless safe workaround documented | PASS |
| No identity leakage in de-identified exports | PASS |
| No role-boundary violation in executed checks | PASS |
| No consent bypass | PASS |
| No post-launch consensus-rule manipulation | PASS |
| No participant-facing coercive language from approved workflow | PASS |
| No AI governance bypass | PASS |
| No malicious content execution | PASS |
| No stored-XSS execution | PASS |
| No unsafe formula injection in exports | PASS after remediation |
| No support-loop identity leakage | PASS |
| No IDOR exposure in executed local checks | PASS |
| No same-tab identity/response cross-linking observed | PASS |
| No automatic amplification of abusive/coercive content without human review | PASS |
| Adverse participant can be governed by PI/study-team action | PASS |
| Required limitation language appears exactly | PASS |
| Unperformed browser/mobile fields marked NOT RUN | PASS |

Required limitation observed exactly:

"Consensus indicates agreement among this panel; it does not establish correctness."

## Current Conditions

- Full manual all-8 browser UI adverse pass remains NOT RUN.
- Full manual mobile adverse pass remains NOT RUN.
- Duplicate Round 1 submission behavior should be clarified.
- Inert script-like or markup-like text in text-bearing exports should be highlighted, sanitized, or documented more strongly before production readiness.
- Production authentication/session hardening remains outside this evidence.

## Final Decision

GO WITH CONDITIONS for continued controlled synthetic mock testing only.

This decision does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data.
