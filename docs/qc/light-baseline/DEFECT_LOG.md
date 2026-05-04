# Defect Log

Severity definitions:

- P0: ethical, security, privacy, or governance blocker; do not test with mock participants.
- P1: major functional or methodological defect; fix before mock trial.
- P2: significant friction or incomplete evidence; may proceed only with documented workaround.
- P3: polish issue.

## Open Findings

| ID | Severity | Area | Finding | Evidence | Mock-Trial Workaround | Recommended Fix |
|---|---:|---|---|---|---|---|
| QC-LB-001 | P2 | Privacy / URLs | Internal participant item/feedback API uses `participant_id` in query strings. This should not be used with real participant identifiers. | Static scan found `participant_id` query usage in `app/src/core/api.ts` and backend road-test URLs. Invitation and SMS magic-link routes avoid identity-bearing URLs, but staff/demo round-item calls still use query identity. | Use synthetic participant IDs only. Do not use real participant identifiers in mock trial URLs. | Replace query participant IDs with invitation/session-bound participant context or opaque participant references before real study use. |
| QC-LB-002 | P2 | Data hygiene / GitHub readiness | Local SQLite runtime databases and test-runtime backups exist under `server/data/`. They appear gitignored, but should be cleaned or reviewed before repository migration. | File scan found many `server/data/test-runtime/**/edelphi.sqlite` files and `server/data/edelphi.sqlite`. `git ls-files server/data` returned no tracked files; `.gitignore` excludes `server/data/`. | Proceed only with synthetic/low-risk data. Do not share the local runtime directory. | Add a pre-GitHub cleanup step to archive/delete local runtime data after confirming it contains no real participant data. |
| QC-LB-003 | P2 | Evidence gap / UI workflow | Happy path is covered by automated backend road tests and static frontend checks, but not yet by a full manual browser click-through with multiple mock participants. | Backend tests passed and exercise the full synthetic Delphi lifecycle. No 8-participant manual browser run was performed in this light baseline. | Proceed with a controlled mock trial only if the team expects live observation and quick repair. Keep participant data synthetic/low-risk. | Run a manual browser mock trial with 8 synthetic participants before any external pilot. |
| QC-LB-004 | P2 | Mock support workflow | Participant issue reporting now has a PI response loop, but it has not yet been tested in a multi-user browser scenario with separate PI and participant sessions. | App/server tests cover issue creation/response and local dashboard wiring. Manual multi-session verification was not performed in this pass. | During mock trial, keep Codex/developer support available and ask participants to screenshot/report any support-loop failure. | Add a browser/E2E test covering participant note -> PI dashboard -> PI response -> participant update. |
| QC-LB-005 | P3 | Code quality | Frontend lint passes with two React hook dependency warnings. | `npm run lint` reported two `react-hooks/exhaustive-deps` warnings in `app/src/App.tsx`; no lint errors. | Accept for controlled mock trial. | Review hook dependency structure before polishing or production hardening. |

## Closed / Not Reproduced In This Pass

| Area | Result |
|---|---|
| App start | Frontend responded with HTTP 200 at `http://127.0.0.1:5173/`. |
| Backend start | Backend health returned `{"status":"ok","service":"edelphi-server","environment":"development"}` at `http://127.0.0.1:3001/health`. |
| Dependency vulnerabilities | `npm audit --audit-level=high` found 0 vulnerabilities for app and server. |
| Unauthorized admin/study access smoke | Anonymous requests to `/studies` and `/admin/audit-integrity` returned 403. |
| Audit integrity | `/admin/audit-integrity` returned `ok: true`. |
| Data integrity | `/admin/data-integrity` returned `ok: true` with no response identity fields found. |

