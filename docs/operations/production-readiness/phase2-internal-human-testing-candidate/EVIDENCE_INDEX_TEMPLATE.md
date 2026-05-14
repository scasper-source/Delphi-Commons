# Evidence Index Template — Internal Human-Testing Candidate

Status defaults: `NOT RUN`, `HUMAN_REQUIRED`, `SIGNOFF_REQUIRED`.

## A) Run metadata

- Date/time local: NOT RUN
- Date/time UTC: NOT RUN
- Operator(s): HUMAN_REQUIRED
- Observer(s): HUMAN_REQUIRED
- Branch: NOT RUN
- Commit hash: NOT RUN
- Environment label: NOT RUN

## B) Artifact index

| Evidence category | Required artifact | Status | Link/path | Notes |
|---|---|---|---|---|
| install/extract | Extraction log and package directory listing | NOT RUN | HUMAN_REQUIRED |  |
| start/status/smoke | Startup log + backend health + UI smoke evidence | NOT RUN | HUMAN_REQUIRED |  |
| study setup/roles | Study setup and role assignment screenshots/logs | NOT RUN | HUMAN_REQUIRED |  |
| consent/invitations | Consent screen evidence + invite dispatch/receipt evidence | NOT RUN | HUMAN_REQUIRED |  |
| participant rounds | Round 1 and later-round participant evidence | NOT RUN | HUMAN_REQUIRED |  |
| curation/closeout | Curation decisions and participant closeout evidence | NOT RUN | HUMAN_REQUIRED |  |
| export | Export manifest + package classification/review evidence | NOT RUN | HUMAN_REQUIRED |  |
| deletion/retention | Deletion/retention workflow evidence | NOT RUN | HUMAN_REQUIRED |  |
| incident/support | Incident drill/tabletop + support interaction evidence | NOT RUN | HUMAN_REQUIRED |  |
| backup/restore/reset | Backup + restore/reset evidence | NOT RUN | HUMAN_REQUIRED |  |
| stop/cleanup | Shutdown and final cleanup evidence | NOT RUN | HUMAN_REQUIRED |  |

## C) Linked Phase 2 package verification templates

- [Portable bundled runtime evidence template](../templates/PORTABLE_BUNDLED_RUNTIME_EVIDENCE_TEMPLATE.md)
- [macOS operator portable package evidence template](../templates/MACOS_OPERATOR_PORTABLE_PACKAGE_EVIDENCE_TEMPLATE.md)
- [Windows portable package local evidence](../WINDOWS_OPERATOR_PORTABLE_PACKAGE_LOCAL_EVIDENCE.md)
- [Windows extracted zip evidence](../WINDOWS_OPERATOR_PORTABLE_PACKAGE_EXTRACTED_ZIP_EVIDENCE.md)
- [Phase 2 Windows second machine runbook](../PHASE2_WINDOWS_SECOND_MACHINE_RUNBOOK.md)
- [Phase 2 macOS follow-up evidence checklist](../PHASE2_MACOS_FOLLOWUP_EVIDENCE_CHECKLIST.md)

## D) Human-observation and signoff gating

- Human dry-run observation complete: NOT RUN / HUMAN_REQUIRED
- Accessibility signoff attached: SIGNOFF_REQUIRED
- Security signoff attached: SIGNOFF_REQUIRED
- Data Custodian signoff attached: SIGNOFF_REQUIRED
- Study Owner signoff attached: SIGNOFF_REQUIRED
