# Controlled Synthetic Mock Trial

Use this tutorial to rehearse Delphi Commons before inviting any real participants.

Current readiness: controlled mock-participant MVP testing with synthetic or low-risk data only.

## Goals

The mock trial should answer:

- Can a study owner configure and launch a study?
- Can participants consent, complete rounds, save, resume, and submit?
- Can Round 1 responses be curated into later-round items?
- Can Round 2+ feedback remain neutral and understandable?
- Can issue notes reach the study owner?
- Can reports and exports be generated?
- Are any buttons, textboxes, navigation paths, or save states broken?

## Recommended Synthetic Setup

- 1 study owner / PI.
- 1 ethics and methods steward, if testing governance.
- 8 synthetic participants.
- 2 or 3 rounds.
- Synthetic names, emails, phone numbers, and responses.
- No real participant data.

## Trial Flow

1. Create a study.
2. Configure purpose, method, panel, consent, rounds, consensus rule, feedback, AI connector mode, retention, and review.
3. Confirm consensus rule is locked before launch.
4. Launch Round 1.
5. Complete Round 1 as each synthetic participant.
6. Submit at least one "Having trouble?" issue note and confirm it appears for the study owner.
7. Curate Round 1 responses into Round 2 items.
8. Launch Round 2.
9. Complete Round 2 ratings and rationales.
10. Review controlled feedback language.
11. Generate report/export.
12. Review audit log and limitations.
13. Record defects in a defect log.

## What To Watch

- buttons that do nothing;
- textboxes that do not save;
- unclear validation;
- unclear save state;
- participant identity leaking into URLs, exports, or logs;
- coercive feedback language;
- confusing role switching;
- missing non-consensus reporting;
- broken mobile layout;
- issue notes not reaching study owner.

## Go/No-Go

Use [docs/qc/light-baseline](../qc/light-baseline/README.md) as the baseline format. Any GO decision applies only to controlled synthetic mock testing, not real human-subjects launch.
