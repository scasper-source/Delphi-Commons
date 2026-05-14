# Signoff Placeholders — Internal Human-Testing Candidate Binder

All signoffs below are placeholders only.

| Required signoff | Owner | Status | Evidence reference | Notes |
|---|---|---|---|---|
| Human dry-run execution signoff | Assigned human test lead | SIGNOFF_REQUIRED | HUMAN_REQUIRED | Must include dated transcript and evidence index references. |
| Accessibility review signoff | Accessibility reviewer | SIGNOFF_REQUIRED | HUMAN_REQUIRED | Do not mark complete without human accessibility evidence. |
| Security review signoff | Security reviewer | SIGNOFF_REQUIRED | HUMAN_REQUIRED | Do not mark complete without scoped security evidence. |
| Data Custodian export/deletion review signoff | Data Custodian | SIGNOFF_REQUIRED | HUMAN_REQUIRED | Required for export/deletion/retention interpretation. |
| Study Owner operational signoff | Study Owner | SIGNOFF_REQUIRED | HUMAN_REQUIRED | Must not be auto-filled from synthetic runs. |
| Incident response acknowledgement signoff | Incident owner/on-call lead | SIGNOFF_REQUIRED | HUMAN_REQUIRED | Tabletop or drill evidence must be linked. |

## Guardrails

- No line in this file may be changed to complete without attached real human evidence.
- Synthetic, scripted, or prior phase automation cannot substitute for required human signoff.
