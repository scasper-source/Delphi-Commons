# Adverse User Rehearsal

This package records the local defensive adverse-user rehearsal for Delphi Commons.

Current decision: GO WITH CONDITIONS for continued controlled synthetic mock testing only.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Contents

- `ADVERSE_USER_TEST_PLAN.md` - scope, commands, roles, and execution summary.
- `MALICIOUS_INPUT_FIXTURES.md` - synthetic adverse inputs used.
- `ROLE_ABUSE_TESTS.md` - participant and Study Owner/admin abuse checks.
- `IDOR_AND_ACCESS_CONTROL_TESTS.md` - guessed ID and role-boundary checks.
- `STORED_XSS_AND_RENDERING_TESTS.md` - browser/rendering/export execution checks.
- `AI_PROMPT_INJECTION_TESTS.md` - deterministic local AI governance checks.
- `EXPORT_ABUSE_TESTS.md` - export privacy, rendering, and formula-injection checks.
- `SUPPORT_LOOP_ABUSE_TESTS.md` - support-note abuse and isolation checks.
- `SECURITY_AND_PRIVACY_FINDINGS.md` - consolidated findings and blockers.
- `DEFECT_LOG.md` - remediated P0 and open P2 conditions.
- `GO_NO_GO_AFTER_ADVERSE_USER_TEST.md` - decision record.
- `run_adverse_user_rehearsal_local.mjs` - local/API runner with headless browser smoke.
- `artifacts/` - JSON evidence and screenshots.

## Evidence

Current passing artifact:

- `artifacts/adverse-user-rehearsal-2026-05-05T17-40-13-932Z.json`
- `artifacts/adverse-user-rehearsal-latest.json`

Initial completed artifact that found the formula-injection P0:

- `artifacts/adverse-user-rehearsal-2026-05-05T17-34-58-577Z.json`

Current open conditions:

- Full manual all-8 browser UI adverse pass remains NOT RUN.
- Full manual mobile adverse pass remains NOT RUN.
- Duplicate Round 1 submit behavior needs policy clarification.
- Inert markup-like text in exports should be highlighted, sanitized, or documented more strongly before production readiness.
