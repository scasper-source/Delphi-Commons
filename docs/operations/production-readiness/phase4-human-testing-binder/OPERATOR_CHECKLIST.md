# Operator Checklist

Execution status default: `NOT RUN`.

Use only synthetic/internal test data. Do not enter real participant data, regulated data, institutional data, or sensitive exports.

| Area | Step | Status | Evidence link/path | Notes |
| --- | --- | --- | --- | --- |
| candidate identity | Confirm candidate commit, tag, package identifier, and run date | NOT RUN | HUMAN_REQUIRED | Use `CANDIDATE_RECORD.md` |
| environment | Confirm clean laptop profile or second-machine profile and OS version | NOT RUN | HUMAN_REQUIRED | Windows 10 is acceptable if recorded accurately |
| package acquisition | Obtain the exact candidate package or clone checkout | NOT RUN | HUMAN_REQUIRED | Record path and checksum if packaged |
| install/extract | Install or extract package to the documented local path | NOT RUN | HUMAN_REQUIRED |  |
| launch | Start the documented operator launch flow | NOT RUN | HUMAN_REQUIRED | Capture command and visible result |
| health check | Confirm backend/UI health or documented status check | NOT RUN | HUMAN_REQUIRED |  |
| local URL posture | Confirm localhost binding or documented LAN/synthetic mode warning | NOT RUN | HUMAN_REQUIRED | Default should remain local unless explicitly enabled |
| study setup | Create/select a synthetic study | NOT RUN | HUMAN_REQUIRED |  |
| roles | Confirm Study Owner/operator role assignment and least-privilege posture | NOT RUN | HUMAN_REQUIRED |  |
| consent | Verify consent gate wording and acknowledgement behavior | NOT RUN | HUMAN_REQUIRED |  |
| invitations | Generate participant invitation/link using synthetic participant data | NOT RUN | HUMAN_REQUIRED |  |
| phone entry | Open participant link on selected phone/browser surface | NOT RUN | HUMAN_REQUIRED | Required by Phase 4 exit gate |
| Round 1 | Submit Round 1 participant input | NOT RUN | HUMAN_REQUIRED |  |
| later round | Complete one later-round task or documented simulated equivalent | NOT RUN | HUMAN_REQUIRED |  |
| curation | Perform staff curation/approval path with governance checks | NOT RUN | HUMAN_REQUIRED |  |
| feedback | Verify participant feedback/review state | NOT RUN | HUMAN_REQUIRED |  |
| support/withdrawal | Exercise support, withdrawal, or no-active-task path | NOT RUN | HUMAN_REQUIRED |  |
| export | Generate export/package list and route through Data Custodian review | NOT RUN | HUMAN_REQUIRED |  |
| backup | Execute backup command/path and record artifact location | NOT RUN | HUMAN_REQUIRED |  |
| restore/reset | Execute restore rehearsal or reset path and verify expected state | NOT RUN | HUMAN_REQUIRED |  |
| retention/deletion | Execute retention/deletion review path | NOT RUN | HUMAN_REQUIRED |  |
| incident | Execute incident drill path or tabletop equivalent | NOT RUN | HUMAN_REQUIRED |  |
| shutdown | Stop services and verify shutdown | NOT RUN | HUMAN_REQUIRED |  |
| cleanup | Remove temporary artifacts according to policy | NOT RUN | HUMAN_REQUIRED |  |

## Required Attachments

- Operator command log.
- Screenshots or screen recordings for launch, health, phone entry, task completion, export, backup/restore, retention/deletion, and shutdown.
- Observer transcript.
- Defect log with severity labels.
- Signoffs required by the Data Custodian and security review sheets.
