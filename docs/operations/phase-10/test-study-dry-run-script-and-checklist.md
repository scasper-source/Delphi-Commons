# Test Study Dry-Run Script and Operator Checklist

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

Status: COMPLETE as a manual checklist. Full Phase 10 dry run: NOT RUN.

No new script was added because the repository already has focused QC scripts and no general Phase 10 dry-run script convention. Use this checklist for a future documented synthetic dry run.

## Existing Related Synthetic Scripts

- `node docs\qc\full-mock-trial\run_full_mock_trial_local.mjs` - existing synthetic/local full mock-trial runner. NOT RUN for Phase 10.
- `node docs\qc\adverse-user-rehearsal\run_adverse_user_rehearsal_local.mjs` - existing synthetic/local adverse-user rehearsal runner. NOT RUN for Phase 10.

## Operator Header

Record before starting:

- operator:
- date/time:
- commit hash:
- branch:
- environment:
- backend URL:
- frontend URL:
- browser and viewport:
- data directory:
- audit directory:
- backup directory:
- commands run:

## Checklist

| Step | Expected evidence | Status |
|---|---|---|
| Install app dependencies | `cd app; npm.cmd install` completed | NOT RUN |
| Install server dependencies | `cd server; npm.cmd install` completed | NOT RUN |
| Build app | `npm.cmd run build` completed | NOT RUN |
| Build server | `npm.cmd run build` completed | NOT RUN |
| Run app tests | `npm.cmd test` completed | NOT RUN |
| Run server tests | `npm.cmd test` completed | NOT RUN |
| Run security audit for app | `npm.cmd run security:audit` completed | NOT RUN |
| Run security audit for server | `npm.cmd run security:audit` completed | NOT RUN |
| Start backend | health returns non-production environment | NOT RUN |
| Start frontend | local URL opens | NOT RUN |
| Migration/init check | `GET /admin/storage-status` recorded | NOT RUN |
| Admin login/setup | synthetic admin only, no real credentials | NOT RUN |
| Study creation | harmless fictional synthetic study created | NOT RUN |
| Governance checklist/signoff | dual signoff or documented configuration | NOT RUN |
| Consent/participant information | visible and truthful about limits | NOT RUN |
| Synthetic participant setup | no real identifiers; example.invalid/example.test only | NOT RUN |
| Round 1 open response | consent required; one field per active research question | NOT RUN |
| Curation/item creation | no participant identity leakage | NOT RUN |
| Round 2 rating | participant can rate/respond | NOT RUN |
| Controlled feedback | neutral, non-coercive, no truth claim | NOT RUN |
| Later rounds if configured | workflow completes or limitation documented | NOT RUN |
| Final/report export | required limitation sentence present exactly | NOT RUN |
| Export privacy scan | no direct identifiers or identity-response mapping in de-identified exports | NOT RUN |
| Audit log visibility | relevant events visible to authorized role | NOT RUN |
| Backup creation | backup manifest, hashes, migration list recorded | NOT RUN |
| Restore rehearsal | restore completed; audit/data integrity verified | NOT RUN |
| Incident mini-drill | triage, containment, preservation, escalation, post-review recorded | NOT RUN |
| No sensitive data in logs/URLs/browser storage/analytics/exports | inspected and recorded | NOT RUN |

Required limitation sentence for export/report verification:

“Consensus indicates agreement among this panel; it does not establish correctness.”

## Exit Criteria for Future Run

- All required synthetic workflow steps are PASS or documented with severity.
- No P0/P1 unresolved defect blocks controlled synthetic testing.
- Backup/restore and incident drill evidence are recorded if operational readiness status is to be upgraded.
- Any unperformed item remains NOT RUN.

