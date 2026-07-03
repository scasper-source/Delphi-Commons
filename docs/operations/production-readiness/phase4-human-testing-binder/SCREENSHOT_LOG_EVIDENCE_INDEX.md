# Screenshot And Log Evidence Index

Execution status: **PARTIAL TEXT EVIDENCE RECEIVED / SCREENSHOT ARTIFACTS PENDING / HUMAN_REQUIRED**.

Store evidence in a controlled evidence folder and link exact paths here. Do not attach real participant data or sensitive exports.

| Evidence ID | Artifact type | Required moment | Status | File/link | Notes |
| --- | --- | --- | --- | --- | --- |
| F4-EVID-001 | Command log | Candidate version and environment setup | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-002 | Screenshot/log | Package install or extract | PARTIAL_REPORTED | HUMAN_REQUIRED | 2026-05-29 operator report says download/extract/install passed for corrected `r8`; SmartScreen/install prompt screenshots were not captured |
| F4-EVID-003 | Screenshot/log | Operator launch and health check | PARTIAL_REPORTED | HUMAN_REQUIRED | 2026-05-29 operator report says installed package launched without dev terminal |
| F4-EVID-004 | Screenshot | Localhost/LAN posture warning or status | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-005 | Screenshot | Synthetic study setup | PARTIAL_REPORTED | HUMAN_REQUIRED | 2026-05-29 operator report says synthetic study create/save and dashboard list passed, but reopen/new-study continuity failed or was unclear. Corrected `r10` package retest must cover the Main Menu and Study Workspace Launcher path. |
| F4-EVID-006 | Screenshot | Consent gate | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-007 | Screenshot/recording | Phone participant link open | NOT RUN | HUMAN_REQUIRED | Required by exit gate |
| F4-EVID-008 | Screenshot/recording | Participant Round 1 submission | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-009 | Screenshot/recording | Later-round task | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-010 | Screenshot/log | Staff curation/approval | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-011 | Screenshot | Support/withdrawal/no-active-task path | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-012 | Log/export metadata | Export generation and classification | NOT RUN | HUMAN_REQUIRED | No sensitive export payloads |
| F4-EVID-013 | Log | Backup and restore/reset rehearsal | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-014 | Log | Retention/deletion rehearsal | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-015 | Transcript/log | Incident drill | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-016 | Review artifact | Accessibility review | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-017 | Signoff | Data Custodian export review | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-018 | Signoff | Security/privacy review | NOT RUN | HUMAN_REQUIRED |  |
| F4-EVID-019 | Final table | P0 blocker closeout | OPEN | `FINAL_P0_BLOCKER_TABLE.md` |  |
| F4-EVID-020 | Screenshot/log | Main Menu, Study Workspace Launcher, saved-study reopen, and post-relaunch continuity | R2 PARTIAL_PASS / SUCCESSOR_RETEST_REQUIRED | `../WINDOWS_INSTALLER_R2_FAILURE_EVIDENCE_2026-07-01.md` | R2 evidence showed Main Menu, saved workspace, Current Studies, reopen, second-study independence, and relaunch persistence, but smoke/save verification still failed. Retest after version-save timestamp visibility fix. |
| F4-EVID-021 | Screenshot/log | Study PI and Ethics PI signoff controls | R2_FAILED / SUCCESSOR_RETEST_REQUIRED | `../WINDOWS_INSTALLER_R2_FAILURE_EVIDENCE_2026-07-01.md` | R2 installed-package evidence showed Study PI and Ethics PI signoff route remained blocked with no recorded or allowed inputs. |
