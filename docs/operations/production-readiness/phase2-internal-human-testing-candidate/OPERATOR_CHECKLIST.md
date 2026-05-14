# Operator Checklist — Internal Human-Testing Candidate

Execution status default: `NOT RUN`.

| Area | Step | Status | Evidence link/path | Notes |
|---|---|---|---|---|
| install/extract | Obtain package and extract to controlled local path | NOT RUN | HUMAN_REQUIRED |  |
| start/status/smoke | Start backend/UI; collect health/status and smoke result | NOT RUN | HUMAN_REQUIRED |  |
| local URL posture | Verify localhost operator URL is displayed and default bind remains `127.0.0.1` | NOT RUN | HUMAN_REQUIRED |  |
| optional LAN mode | If and only if needed for synthetic phone-flow rehearsal, set `EDELPHI_ENABLE_LAN_PARTICIPANT_URL=1` and `EDELPHI_ACK_LAN_SYNTHETIC_ONLY=1`; capture acknowledgement and warnings | NOT RUN | HUMAN_REQUIRED |  |
| study setup | Create/select study and confirm synthetic/non-production scope | NOT RUN | HUMAN_REQUIRED |  |
| roles | Assign/confirm least-privilege roles for operator workflow | NOT RUN | HUMAN_REQUIRED |  |
| consent | Verify consent wording and acknowledgement gate behavior | NOT RUN | HUMAN_REQUIRED |  |
| invitations | Send invitation(s) and verify token/link handling path | NOT RUN | HUMAN_REQUIRED |  |
| participant entry | Enter participant flow and confirm participant identity boundary messaging | NOT RUN | HUMAN_REQUIRED |  |
| Round 1 | Submit Round 1 input and confirm receipt/state change | NOT RUN | HUMAN_REQUIRED |  |
| later round | Execute one later-round task (rating/feedback/review) | NOT RUN | HUMAN_REQUIRED |  |
| curation | Perform staff curation/approval path with required governance checks | NOT RUN | HUMAN_REQUIRED |  |
| closeout | Verify participant closeout wording and visible limitations | NOT RUN | HUMAN_REQUIRED |  |
| export | Generate/export package list and capture classification/review fields | NOT RUN | HUMAN_REQUIRED |  |
| deletion/retention review | Run deletion/retention request review workflow | NOT RUN | HUMAN_REQUIRED |  |
| incident path | Run incident escalation/tabletop path and record escalation timing | NOT RUN | HUMAN_REQUIRED |  |
| backup | Execute backup command/path and record artifact location | NOT RUN | HUMAN_REQUIRED |  |
| restore or reset | Execute restore rehearsal or reset path and verify expected state | NOT RUN | HUMAN_REQUIRED |  |
| support path | Submit/respond to support issue path from participant perspective | NOT RUN | HUMAN_REQUIRED |  |
| stop/final cleanup | Stop services, verify shutdown, remove temporary artifacts per policy | NOT RUN | HUMAN_REQUIRED |  |

## Mandatory execution notes

- Use only synthetic/test data.
- Keep SMS/testing internal-only; do not claim real SMS provider readiness from this checklist.
- Attach command logs, screenshots, and generated report/export metadata.
- Do not convert `NOT RUN` to `PASS` without linked evidence created during this run.
