# Phase 1 Retention/Deletion Workflow with Data Custodian Review (`mock_trial` track)

Date: 2026-05-07.

## Scope and boundary

This workflow documents Phase 1 implementation/evidence for:
- retention policy execution rules,
- participant deletion/restriction request handling,
- Data Custodian approval/denial authority,
- audit events,
- effects on exports/reports,
- pilot-readiness evidence packaging.

This document does **not** claim human-subjects readiness, pilot readiness, or production readiness.

## Existing foundation reused

- Participant deletion requests are already created from invitation scope and tracked in `deletion_requests` collection.
- Staff review endpoint already supports status transitions and review notes.
- Export/report paths already use de-identification and redaction controls.

## Phase 1 execution rules

1. **Request creation path**
   - Participant submits `POST /participant/invitation/deletion-request`.
   - Initial status is `Requested`.

2. **Review staging**
   - Staff roles with study oversight can move request to `UnderReview`.
   - `UnderReview` does not require a final decision note.

3. **Data Custodian decision gate (new hardening)**
   - Final decision statuses `Approved`, `Rejected`, and `Completed` require actor role `data_custodian`.
   - Non-custodian attempts to apply these statuses return `403 data_custodian_review_required`.

4. **Review note requirements**
   - Any non-`UnderReview` status update requires `review_note`.

5. **Audit requirements**
   - Request creation: `participant.deletion_request.create`.
   - Request listing: `participant.deletion_request.list`.
   - Review action: `participant.deletion_request.review` with `status` and `reviewed_by_role` in details.

## Effect on exports and reports

- This workflow governs decision/audit lifecycle for participant deletion/restriction requests.
- Export/report generation remains redaction-first and de-identification-classification-based.
- Approved deletion/restriction outcomes must be reflected operationally via follow-up work packets before pilot claims (e.g., automated execution actions + export omission proofs for real deployments).

## Current evidence links

- Route enforcement and audit details:
  - `server/src/routes/participants.ts`
- Request model/status storage:
  - `server/src/stores/deletionRequestStore.ts`
- Export/report redaction behavior:
  - `server/src/routes/reports.ts`
  - `server/src/exports/exportPrivacy.ts`
- Focused role-gate test:
  - `server/tests/deletionRequestCustodianWorkflow.test.mjs`

## Open gaps (explicit)

- No automated policy executor yet for scheduled retention purge/anonymization jobs.
- No pilot-grade evidence artifact proving end-to-end deletion execution in a production-like environment.
- No signed human-subjects governance approvals included here.

## Codex-ready follow-up packets

- **P1-RET-WP1:** Add retention policy schedule executor with dry-run + apply modes.
- **P1-RET-WP2:** Add deletion execution ledger linking request ID -> actions taken -> affected record classes.
- **P1-RET-WP3:** Add export verification test proving post-execution packages/reports honor approved deletion/restriction outcomes.
- **P1-RET-WP4:** Produce pilot evidence bundle from template (see compliance template file).


## 2026-05-08 retention/deletion execution update
- Added data-custodian-only deletion execution endpoint to move approved requests to Completed and apply participant suppression markers for future exports.
- Added audit action `participant.deletion_request.execute` and test coverage for unauthorized execution blocking and execution ledger evidence.
- This update materially reduces HSB-P0-002, but **does not claim production readiness or human-subjects readiness**. A human-observed production deployment/restore rehearsal remains required before closure.
