# Backup And Restore Rehearsal Sheet

Execution status: **NOT RUN / HUMAN_REQUIRED**.

Use synthetic/internal test data only. Record artifact metadata, not sensitive payloads.

| Step | Expected evidence | Status | Evidence link/path | Notes |
| --- | --- | --- | --- | --- |
| Identify candidate data directory | Path and environment captured | NOT RUN | HUMAN_REQUIRED |  |
| Create synthetic study state | Study/task/export state exists for rehearsal | NOT RUN | HUMAN_REQUIRED |  |
| Execute backup | Command/log and artifact metadata captured | NOT RUN | HUMAN_REQUIRED |  |
| Verify backup artifact | File list/checksum/size captured | NOT RUN | HUMAN_REQUIRED |  |
| Simulate restore or reset target | Target state documented before restore | NOT RUN | HUMAN_REQUIRED |  |
| Execute restore/reset | Command/log captured | NOT RUN | HUMAN_REQUIRED |  |
| Verify restored state | Expected study/task/audit state observed | NOT RUN | HUMAN_REQUIRED |  |
| Verify no unexpected sensitive export | Review notes attached | NOT RUN | HUMAN_REQUIRED |  |
| Cleanup | Temporary artifacts removed or retained under policy | NOT RUN | HUMAN_REQUIRED |  |

## Acceptance

- Operator: **HUMAN_REQUIRED**
- Data Custodian or delegated reviewer: **HUMAN_REQUIRED**
- Open defects: **HUMAN_REQUIRED**
- Decision: **NOT READY FOR HUMAN TESTING**
