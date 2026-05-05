# GO / NO-GO For Larger Controlled Mock Trial

Decision: GO WITH CONDITIONS

This decision applies only to the larger controlled mock-participant MVP trial with synthetic or low-risk data. It does not authorize real human-subjects deployment, IRB launch, production use, or use with sensitive participant data.

## Reason

Test 4 cleared the prior P1 browser-flow blockers:

1. Direct participant invitation links rendered the active participant task.
2. Two distinct synthetic invitation participants completed Round 1 and Round 2 through the browser.
3. The participant support-note loop worked end to end: participant note, PI dashboard visibility, PI response, participant-visible response.
4. Reporting and export package preparation worked for the synthetic Round 2 data.
5. Export scan found no synthetic participant names, emails, phone numbers, or raw participant IDs, and included the required limitation language.

## Conditions

Proceed only under these conditions:

- Synthetic data only.
- Controlled local/development environment only.
- No real participant identities, emails, phone numbers, consent records, or sensitive study data.
- Use separate browser profiles/incognito windows or reload when switching between invitation participants in one tab.
- Treat generated report/export evidence as interim until the terminal round closeout path is rehearsed.
- Complete a dedicated mobile-width pass before a larger synthetic panel rehearsal if phone completion is part of that test.

## Remaining Non-Blocking Issues

- P2: Final report action is available before terminal round close, though UI marks the report stage as interim.
- P2: Mobile-width browser evidence was not captured in this rehearsal.
- P3: Same-tab switching between invitation links may require reload to clear previous participant state.

## Boundary Statement

This GO WITH CONDITIONS applies only to controlled synthetic mock testing. Delphi Commons is not approved for real human-subjects research, production deployment, sensitive participant data, or IRB launch without separate governance, security, accessibility, retention, backup/restore, and incident-response readiness.
