# Rehearsal Script

Date: 2026-05-05

Environment:

- Local development only.
- Synthetic data only.
- Backend: `http://127.0.0.1:3001`
- Frontend: `http://127.0.0.1:5173`
- Desktop browser through the Codex in-app browser.
- Mobile-width viewport was not completed in this pass.

Roles:

- Study Owner / PI
- Ethics & Methods Steward
- Panelist / Participant
- Two synthetic invitation participants created through backend participant/invitation APIs

Script:

1. Study Owner opens or creates a synthetic study.
2. Consent materials are visible.
3. Participant acknowledgement is required before response submission.
4. Consensus rule is configured.
5. Verify the consensus rule cannot be casually changed after launch.
6. Round 1 is opened.
7. Two synthetic participants submit Round 1 responses.
8. One participant submits an issue/support note.
9. PI/admin sees the issue note.
10. PI/admin responds.
11. Participant sees the response.
12. Study Owner curates Round 1 responses into Round 2 items.
13. Round 2 is opened.
14. Two synthetic participants submit ratings/rationales.
15. Controlled feedback, report, or export is generated.
16. Export is checked for direct identity fields and the required limitation statement:

> Consensus indicates agreement among this panel; it does not establish correctness.

Decision criteria:

- P0 defects: 0
- P1 defects: 0
- Both synthetic participants can complete Round 1 and Round 2
- Issue/support-note loop works or has a safe documented workaround
- Report/export works
- No identity leakage is observed

Any GO decision applies only to controlled synthetic mock testing and does not authorize real human-subjects deployment.
