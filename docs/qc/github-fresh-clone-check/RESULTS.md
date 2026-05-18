# GitHub Fresh Clone/Build/Test Results

Boundary statement: Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.

## Summary

Status: PASS WITH CURRENT SECURITY AUDITS COMPLETED

The private GitHub clean-history repository was originally checked in a clean Codex cloud environment. App and server install, build, and test commands passed from the documented `app/` and `server/` directories. The original cloud security audit attempt was blocked by the npm advisory endpoint returning HTTP 403.

Follow-up verification on 2026-05-18 in the GitHub-connected checkout completed the app and server high-severity npm audits successfully with 0 vulnerabilities. The same follow-up also confirmed app tests, app lint, app production build, server tests, `git diff --check`, no open PRs, and only the `main` remote branch after cleanup.

This result confirms repository install/build/test/audit readiness for the private GitHub clean-history repository only. It does not claim production readiness, human-subjects readiness, IRB readiness, legal compliance, completed accessibility conformance, completed independent security review, or security certification.

## Historical Clean-Environment Check

- Repository: `scasper-source/Delphi-Commons`
- Commit checked: `d81b706e5ef6ea701ef7eecb92911417630d6337`
- Expected short commit: `d81b706`
- Working tree: clean for tracked files
- Evidence source: Codex cloud fresh clone/build/test readiness check reported by the maintainer on 2026-05-05

### Commands Reported

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

### Historical Results

| Area | Result | Notes |
| --- | --- | --- |
| App install | PASS | `cd app && npm install` completed. |
| App build | PASS | `cd app && npm run build` completed. |
| App tests | PASS | `cd app && npm test` completed using `node ../scripts/run-tests.mjs "tests/*.test.mjs"`. |
| Server install | PASS | `cd server && npm install` completed. |
| Server build | PASS | `cd server && npm run build` completed. |
| Server tests | PASS | `cd server && npm test` completed; server test script includes build first. |
| App security audit | BLOCKED / SUPERSEDED | Original cloud `npm audit` advisory endpoint returned HTTP 403; later local GitHub-connected audit passed. |
| Server security audit | BLOCKED / SUPERSEDED | Original cloud `npm audit` advisory endpoint returned HTTP 403; later local GitHub-connected audit passed. |
| Documentation match | PASS | README, getting-started, testing docs, and package scripts aligned with observed command behavior. |

## Current GitHub-Connected Follow-Up

- Date: 2026-05-18
- Repository: `scasper-source/Delphi-Commons`
- Commit checked: `61f950647177d91d01f37b88c4f277b1c0e08c36`
- Expected short commit: `61f9506`
- Open PRs: none at time of check
- Remote branches: `main` only at time of check

| Area | Result | Notes |
| --- | --- | --- |
| App tests | PASS | 28/28 tests passed. |
| App lint | PASS | 0 errors. |
| App production build | PASS | `npm.cmd run build` completed. |
| App security audit | PASS | 0 vulnerabilities. |
| Server tests | PASS | Full server test script completed. |
| Server security audit | PASS | 0 vulnerabilities. |
| Browser-storage policy gate | PASS | SMS setup `localStorage` persistence removed; source scan no longer detects browser storage in `app/src`. |
| GitHub branch cleanup | PASS | Stale `codex/*` branches removed; only `main` remains. |
| Open PR queue | PASS | No open PRs. |
| Diff check | PASS | `git diff --check` completed. |

## Remaining Public/Open-Source Visibility Conditions

- Independent security/ASVS review remains incomplete.
- Human-observed multi-participant browser rehearsal remains incomplete.
- Broader cross-browser/device validation remains incomplete.
- Additional accessibility review remains incomplete.
- Production hardening, operational readiness, legal/compliance review, and institutional/IRB readiness remain incomplete.
- Public release and DOI/archive steps remain incomplete.

Open-source code does not mean open study data.
