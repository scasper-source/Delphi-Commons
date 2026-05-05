# Phase 10 Rehearsal Results

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

Final status: Phase 10 synthetic/dev/staging rehearsal partially completed for the tested environment.

This rehearsal used synthetic/dev data only. It does not claim production readiness, human-subjects readiness, IRB readiness, legal compliance, completed accessibility conformance, or security certification.

## Rehearsal Metadata

| Field | Value |
|---|---|
| Date/time started | 2026-05-05T15:43:48.9480808-04:00 |
| Date/time completed | 2026-05-05T15:50:51.3579866-04:00 |
| Commit hash | `f0f0eff15b411b1c6c40891b960e182afe78c04d` |
| Branch | `master` |
| Environment | Local development, disposable runtimes under ignored `server/data/` paths |
| Existing dev/staging data disturbed | No evidence of disturbance; working tree remained clean before results docs were written |

## Disposable Directories Used

| Purpose | Directory |
|---|---|
| Initial isolated backend start attempt | `C:\Users\13152\Dropbox\eDelphi\server\data\phase10-rehearsal-20260505-154444` |
| Isolated backend health smoke | `C:\Users\13152\Dropbox\eDelphi\server\data\phase10-rehearsal-20260505-154521` |
| Backend road-test disposable runtime | `C:\Users\13152\Dropbox\eDelphi\server\data\test-runtime\road-1778010422232-f39ad0924cb3` |
| Admin disable/session disposable runtime | `C:\Users\13152\Dropbox\eDelphi\server\data\test-runtime\phase10-admin-1778010463755-65092d289e7628` |

## Environment Variables Used

Secrets are redacted.

| Variable | Value |
|---|---|
| `EDELPHI_DATA_DIR` | disposable runtime path, varied by check |
| `EDELPHI_AUDIT_DIR` | disposable runtime path, varied by check |
| `EDELPHI_BACKUP_DIR` | disposable runtime path, varied by check |
| `EDELPHI_DATABASE_PATH` | disposable SQLite path for isolated backend smoke |
| `PORT` | `3310` for isolated backend smoke |
| `HOST` | `127.0.0.1` |
| `EDELPHI_ALLOWED_ORIGINS` | `http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:5174` |
| `EDELPHI_AI_KEY_ENCRYPTION_SECRET` | `[REDACTED_DEV_PLACEHOLDER]` |
| `EDELPHI_RATE_LIMIT_AUTH_MAX` | `2` inside backend road test |
| `EDELPHI_AUTH_REQUIRE_SESSION` | temporarily set to `true` during disabled-session check |

## Commands Run

| Command | Result |
|---|---|
| `git status --short` | PASS; clean before rehearsal docs were written |
| `git rev-parse HEAD` | PASS; `f0f0eff15b411b1c6c40891b960e182afe78c04d` |
| `git branch --show-current` | PASS; `master` |
| `Get-Date -Format o` | PASS |
| `Test-Path app\node_modules` | PASS; `True` |
| `Test-Path server\node_modules` | PASS; `True` |
| `cd app; npm.cmd install` | PASS; dependencies up to date |
| `cd server; npm.cmd install` | PASS; dependencies up to date |
| `cd app; npm.cmd run build` | PASS |
| `cd server; npm.cmd run build` | PASS |
| Isolated backend `node --no-warnings dist\index.js` with disposable env and `PORT=3310` | PARTIAL; health returned development, but the process was not retained after the shell command |
| Frontend smoke `npm.cmd run dev -- --host 127.0.0.1 --port 5174` | PASS; HTTP 200; alternate port used to avoid disturbing open local app on 5173 |
| `cd server; node --test --test-isolation=none tests\roadtest.test.mjs` | PASS; backend road test completed |
| Focused disabled-admin/session Node injection check | PASS |
| `cd server; node --test --test-isolation=none tests\zzExportPrivacy.test.mjs` | PASS |
| SQLite export package summary query against road-test runtime | PASS |
| SQLite export content keyword/limitation query against road-test runtime | PASS |
| `Get-Date -Format o` after evidence capture | PASS; completion timestamp recorded |
| `Invoke-WebRequest http://127.0.0.1:3310/health` cleanup check | PASS; returned `not-listening` |
| `Invoke-WebRequest http://127.0.0.1:5174/` cleanup check | FOUND lingering frontend smoke process before cleanup |
| `Stop-Process -Id 63316 -Force` | PASS; stopped the rehearsal frontend smoke process |
| Final `Invoke-WebRequest` cleanup checks for `3310` and `5174` | PASS; both returned `not-listening` |

## Results By Area

| Area | Result | Evidence |
|---|---|---|
| Fresh deploy from docs | PARTIAL | Install/build commands passed. Backend health returned `{"status":"ok","service":"edelphi-server","environment":"development"}` on disposable `PORT=3310`. Frontend dev smoke returned HTTP 200 on `5174`. A true fresh clone was NOT RUN, and the backend was started with direct `node dist\index.js` process handling rather than a retained `npm.cmd start` terminal. |
| Backup/restore rehearsal | PASS | `tests\roadtest.test.mjs` created and restored a backup in disposable runtime. Backup manifest: `server\data\test-runtime\road-1778010422232-f39ad0924cb3\backups\c92a0f49-eff9-44ab-8a34-b420fa4a1352\manifest.json`. Audit and data integrity verified after restore. |
| Admin/session/invitation checks | PASS for implemented states | Disabled admin login returned 401; disabled existing session returned 401 with session-required mode; revoked sessions count was 1; participant admin access was blocked. Road test covered role boundaries, participant export denial, invitation creation, revoked invitation rejection, and malformed invitation rejection. Explicit expired/disabled invitation states beyond revocation were NOT FOUND. |
| Export package generation and verification | PASS | Road test generated final report, IRB pack, anonymized response dataset, audit package, provenance bundle, and complete archive packages. Export files checked included purpose, suitability/method terms, recruitment/panel terms, rounds, response/attrition terms, consensus rule, median, dispersion/IQR, non-consensus, and required limitation language. Export privacy regression also passed. |
| AI/HITL verification | PASS | Road test verified No External AI defaults, blocked incomplete external AI configuration, AI suggestion labeling, release signoff gates, and human review requirements for AI-influenced outputs. No live external AI call was made. |
| Incident response drill | NOT RUN | Incident response runbook exists, but no incident drill was executed in this rehearsal. |
| Full manual browser dry run | NOT RUN | This rehearsal used command/API/test harness checks plus frontend smoke, not a full manual all-participant browser run. |
| Human accessibility conformance review | NOT RUN | No Phase 10 human WCAG/assistive-technology review was executed. |
| Independent security/ASVS review | NOT RUN | No independent security certification or ASVS review was executed. |

## Export Package Evidence

The road-test runtime contained 81 export files. Export package classifications observed:

| Package | Classification | Safe for de-identified sharing | Direct identifiers | Participant-response mapping |
|---|---|---:|---:|---:|
| `final-delphi-report` | `deidentified_research_report` | true | false | false |
| `irb-pack` | `deidentified_research_report` | true | false | false |
| `anonymized-response-dataset` | `deidentified_research_report` | true | false | false |
| `audit-package` | `restricted_internal_admin_audit` | false | true | true |
| `provenance-bundle` | `deidentified_research_report` | true | false | false |
| `complete-archive` | `complete_restricted_archive` | false | true | true |

Required limitation language was present:

“Consensus indicates agreement among this panel; it does not establish correctness.”

## Bugs Or Documentation Gaps Discovered

- The non-production deployment guide did not include an explicit disposable-runtime example before this rehearsal.
- The documented local frontend port `5173` was already in use by the open in-app browser session, so the frontend smoke used `5174` to avoid disturbance.
- The isolated backend start succeeded for health smoke but was not retained as a long-running process after the shell command; future rehearsal docs should prefer a visible terminal, service wrapper, or explicit process lifecycle instructions.
- Explicit expired-invitation and disabled-invitation states were not found as separate features. Revoked and malformed invitation behavior was tested.
- Incident drill remains NOT RUN.

## Documentation Corrections Made

- Added a "Disposable Local Rehearsal Variant" section to [non-production-deployment-guide.md](./non-production-deployment-guide.md).
- Re-tested the corrected approach conceptually during this rehearsal with disposable environment variables, alternate backend port `3310`, and alternate frontend port `5174`; a true retained `npm.cmd start` terminal rehearsal remains PARTIAL.

## Follow-Up Before GitHub Migration

- Add a dedicated Phase 10 rehearsal script if repeated operational rehearsals become common.
- Add `.env.example` with placeholders only.
- Replace the `SECURITY.md` security contact placeholder or configure GitHub Security Advisories.
- Decide whether to add `.github` issue templates and pull request template.
- Run an incident response drill and record evidence.
- Run a true fresh-clone rehearsal when the repository is ready for GitHub migration.
- Keep local runtime artifacts under ignored paths and confirm none contain real participant data before migration.

## Explicit Final Status

Phase 10 synthetic/dev/staging rehearsal partially completed for the tested environment.

Operational readiness is not achieved because the retained fresh-deploy procedure was only partially exercised, incident response drill was NOT RUN, full manual browser dry run was NOT RUN, human accessibility conformance review was NOT RUN, and independent security/ASVS review was NOT RUN.
