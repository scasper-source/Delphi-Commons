# Known Limitations and Real-Launch Blockers

Boundary statement: "Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research."

Status: COMPLETE as a current blocker list. Real-launch readiness remains NOT READY. Current app/server repo-verifiable checks and high-severity npm audits pass, but independent security review and production-like operational evidence remain open.

## Required Real-Launch Blockers

| Blocker | Status |
| --- | --- |
| Production security evidence missing or incomplete | NOT READY; current automated audits pass, but independent/security-lead acceptance remains open |
| Retention automation not fully validated | NOT READY |
| Production backup/restore operations not rehearsed | NOT READY |
| Human WCAG/accessibility evidence incomplete | NOT READY |
| Independent security/ASVS review not completed | NOT RUN |
| Incident response not rehearsed in production-like conditions | NOT RUN |
| Export package completeness not fully validated for real studies | NOT READY |
| Human-observed full dry-run evidence incomplete unless actually performed | NOT RUN |

## Project-Specific Conditions

- Automated browser evidence exists for controlled synthetic participants, but human-observed manual browser walkthrough evidence remains incomplete unless separately recorded.
- Mobile-width evidence exists in QC contexts, but real-device and assistive-technology review remain incomplete.
- Phase 10 synthetic dry-run checklist was created but not executed as a human-observed operational walkthrough.
- Migration process is automatic on database open; no standalone migration or rollback CLI was found.
- Backup/restore endpoints and local automated rehearsal evidence exist, but production-like or operator-observed backup/restore has not been executed.
- `SECURITY.md` points reporters to GitHub private vulnerability reporting if enabled; a named external security contact is still not documented.
- GitHub issue and pull request templates exist; `CODEOWNERS` is still not planned/added.
- No cloud-provider deployment, monitoring, TLS/reverse proxy, secret store, or production backup target was found.
- Multi-question support exists for setup and Round 1 capture, while full Round 2-4 per-question redesign remains a known future enhancement.

## Non-Negotiable Boundaries

- Do not use real participant data.
- Do not imply Delphi consensus is truth or correctness.
- Do not weaken consent, withdrawal, audit, RBAC, identity/response separation, neutral feedback, export privacy, or AI human-in-the-loop requirements.
- Do not treat open-source code as permission to disclose study data.
