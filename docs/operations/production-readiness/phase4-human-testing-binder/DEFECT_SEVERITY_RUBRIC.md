# Defect Severity Rubric

Use this rubric during Phase 4 preparation and Phase 5 human testing. Until testing occurs, defect observations remain `NOT RUN` / `HUMAN_REQUIRED`.

| Severity | Definition | Required action | Ready impact |
| --- | --- | --- | --- |
| P0 | Blocks install/launch, blocks phone entry, causes data loss/corruption, exposes sensitive data, permits unauthorized access, invalidates consent, prevents withdrawal/support, or creates a safety/privacy/compliance risk that cannot be accepted. | Stop the run, record evidence, assign owner, fix or formally remove scope, then rerun affected path. | Candidate cannot be marked ready. |
| P1 | Major workflow failure with workaround, serious accessibility blocker, major export/audit/provenance issue, or security/privacy issue with bounded impact and possible mitigation. | Record evidence, assign owner, decide fix vs accepted risk with named signoff. | Candidate cannot be marked ready unless accepted by required owner. |
| P2 | Workflow defect, confusing UX, non-blocking accessibility issue, incomplete copy, or evidence gap that does not invalidate the run. | Record issue and remediation plan. | May proceed only with explicit accepted-risk note. |
| P3 | Minor copy, cosmetic, documentation, or low-risk evidence polish item. | Record for cleanup. | Does not block readiness unless cumulative risk is unacceptable. |

## Stop Rules

- Any open P0 keeps the decision at `NOT READY FOR HUMAN TESTING`.
- Any unresolved P1 requires explicit owner acceptance before readiness can be considered.
- Any defect involving real participant data, secrets, sensitive exports, or unauthorized access must be treated as P0 until reviewed.
- Any mismatch between the actual OS/device/provider used and the documented evidence must be corrected before signoff.

## Defect Record Template

| Defect ID | Severity | Title | Evidence link/path | Owner | Status | Required next action |
| --- | --- | --- | --- | --- | --- | --- |
| HUMAN_REQUIRED | HUMAN_REQUIRED | HUMAN_REQUIRED | HUMAN_REQUIRED | HUMAN_REQUIRED | HUMAN_REQUIRED | HUMAN_REQUIRED |
