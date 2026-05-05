# GitHub Fresh Clone/Build/Test Results

Boundary statement: Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.

## Summary

Status: PASS WITH SECURITY AUDIT INCONCLUSIVE

The private GitHub clean-history repository was checked in a clean Codex cloud environment. App and server install, build, and test commands passed from the documented `app/` and `server/` directories. Security audit commands were blocked by the npm advisory endpoint returning HTTP 403 in that environment.

This result confirms clean-environment install/build/test readiness for the private GitHub repository only. It does not claim production readiness, human-subjects readiness, IRB readiness, legal compliance, completed accessibility conformance, completed security review, or security certification.

## Repository Checked

- Repository: `scasper-source/Delphi-Commons`
- Commit checked: `d81b706e5ef6ea701ef7eecb92911417630d6337`
- Expected short commit: `d81b706`
- Working tree: clean for tracked files
- Evidence source: Codex cloud fresh clone/build/test readiness check reported by the maintainer on 2026-05-05

## Commands Reported

```bash
git rev-parse HEAD
git status --porcelain
git status -sb
sed -n '1,220p' README.md
sed -n '1,220p' docs/getting-started.md
sed -n '1,220p' docs/development/testing.md
cat app/package.json
cat server/package.json
cd app && npm install
cd app && npm run build
cd app && npm test
cd server && npm install
cd server && npm run build
cd server && npm test
cd app && npm run security:audit
cd server && npm run security:audit
```

## Results

| Area | Result | Notes |
|---|---|---|
| App install | PASS | `cd app && npm install` completed. |
| App build | PASS | `cd app && npm run build` completed. |
| App tests | PASS | `cd app && npm test` completed using `node ../scripts/run-tests.mjs "tests/*.test.mjs"`. |
| Server install | PASS | `cd server && npm install` completed. |
| Server build | PASS | `cd server && npm run build` completed. |
| Server tests | PASS | `cd server && npm test` completed; server test script includes build first. |
| App security audit | BLOCKED / INCONCLUSIVE | `npm audit` advisory endpoint returned HTTP 403. |
| Server security audit | BLOCKED / INCONCLUSIVE | `npm audit` advisory endpoint returned HTTP 403. |
| Documentation match | PASS | README, getting-started, testing docs, and package scripts aligned with observed command behavior. |

## Documentation Findings

- No substantive mismatch was found between `README.md`, `docs/getting-started.md`, `docs/development/testing.md`, `app/package.json`, `server/package.json`, and observed command behavior.
- The repository intentionally has no root-level npm workspace command.
- Commands are documented and expected to run from `app/` and `server/`.
- The testing guide documents `scripts/run-tests.mjs`, matching the package scripts and successful test execution.

## Remaining Public/Open-Source Visibility Conditions

- Security audit verification remains inconclusive until `npm audit` can reach the advisory endpoint or another approved dependency review is performed.
- Manual multi-participant browser rehearsal remains incomplete.
- Broader cross-browser/device validation remains incomplete.
- Additional accessibility review remains incomplete.
- Production hardening, operational readiness, security review, legal/compliance review, and institutional/IRB readiness remain incomplete.

Open-source code does not mean open study data.
