# Testing Guide

This guide documents current test commands and known gaps.

## Frontend App Tests

```powershell
cd app
npm test
```

The frontend tests cover governance gates, participant-facing copy constraints, orientation, controlled feedback, attrition UI, mobile workflow expectations, closeout language, SMS magic-link UI copy, study context sidecar behavior, and participant issue reporting.

## Frontend Build

```powershell
cd app
npm run build
```

## Frontend Lint

```powershell
cd app
npm run lint
```

## Server Tests

```powershell
cd server
npm test
```

The server test command runs `npm run build` first. Tests include citation builders, backend road-test coverage, SMS magic-link mobile entry, study context disclosure, AI proposal import suggestion governance, and participant issue reporting.

## Server Build

```powershell
cd server
npm run build
```

## Road Tests

The backend road test exercises a synthetic end-to-end flow: study setup, consent, governance, AI safeguards, reporting, exports, audit behavior, backup/restore, and data integrity. It is still automated coverage, not a substitute for a human browser mock trial.

## Security Audit

```powershell
cd app
npm run security:audit
```

```powershell
cd server
npm run security:audit
```

## Governance Tests

Governance-oriented tests should protect:

- explicit consent;
- locked consensus rules;
- non-consensus reporting;
- participant issue loops;
- audit logs;
- role-based access;
- participant privacy and identity separation;
- neutral controlled feedback.

## AI Governance Tests

AI governance tests should verify:

- AI suggestions are labeled as non-final;
- AI outputs require human accept/edit/reject action;
- participant-facing AI-assisted content is not published without approval;
- external AI is disabled unless configured and disclosed;
- no AI feature pressures convergence or claims correctness.

## Known Testing Gaps

- Full manual 8-participant browser rehearsal has not yet been completed.
- Cross-browser testing is limited.
- Mobile testing is represented by UI expectations and screenshots, but still needs real-device rehearsal.
- Accessibility needs additional screen-reader and keyboard review.
- Production deployment, backup/restore, retention automation, incident response, and security hardening remain future work.

## Manual Browser Rehearsal Process

Before any mock trial with real people, rehearse with synthetic participants:

1. Start backend and frontend locally.
2. Create a study.
3. Complete Study Builder and governance review.
4. Launch Round 1.
5. Complete Round 1 as multiple synthetic participants.
6. Send a participant issue note and verify PI visibility.
7. Curate Round 1 into Round 2 items.
8. Launch Round 2.
9. Complete Round 2 on desktop and phone-width viewports.
10. Generate exports and inspect limitations, non-consensus, and audit evidence.
11. Record defects with severity.
