# Pilot Retention/Deletion Evidence Template (Data Custodian Review)

Template version: 2026-05-07  
Use: pilot-readiness evidence assembly only. Complete all fields with deployment-specific facts.

> Completing this template does not itself authorize real human-subjects operation.

## 1) Study/deployment context
- Study ID:
- Version ID:
- Environment (staging/pilot candidate):
- Commit hash:
- Deployment date/time (UTC):
- Data Custodian name/ID:

## 2) Retention policy execution rules
- Retention classes covered:
- Trigger conditions (time/event/legal hold):
- Execution mode tested (`dry-run` / `apply`):
- Records touched by class (counts):
- Exceptions/holds recorded:

## 3) Participant deletion/restriction requests handled
| Request ID | Participant ID (pseudonym) | Request type | Submitted at | Decision status | Data Custodian reviewer | Review note reference |
| --- | --- | --- | --- | --- | --- | --- |

## 4) Data Custodian review evidence
- Evidence that `Approved`/`Rejected`/`Completed` were performed by Data Custodian role:
  - API transcript or signed operator log:
  - Audit event IDs:

## 5) Audit events
- `participant.deletion_request.create` event IDs:
- `participant.deletion_request.review` event IDs:
- Audit integrity check output reference:

## 6) Effect on exports/reports
- Pre-execution export package IDs checked:
- Post-execution export package IDs checked:
- Report snapshots compared:
- Verification result (what changed, what was excluded, what remained and why):

## 7) Residual risks and escalations
- Residual risk items:
- Severity and owner:
- Required compensating controls:
- Escalations to governance/legal/IRB channels:

## 8) Explicit non-claims
- No production readiness claim.
- No security certification claim.
- No legal/regulatory certification claim.
- No automatic human-subjects authorization claim.
