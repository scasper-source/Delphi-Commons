# Mobile Screenshot Evidence

**Project:** Delphi Commons
**Target:** WCAG 2.2 AA reflow, target size, and no text overlap
**Date:** 2026-05-02

Screenshots were captured at 390 x 844 using local Chrome against `http://127.0.0.1:5173/`.

## Evidence Files

| File | Screen | Notes |
|---|---|---|
| `screenshots/desktop-dashboard.png` | Desktop dashboard | Baseline desktop layout. |
| `screenshots/mobile-dashboard.png` | Mobile dashboard | Sidebar/nav reflows; no horizontal overflow detected. |
| `screenshots/mobile-participant.png` | Mobile participant portal empty-task state | Participant copy wraps cleanly; confidentiality and rights copy visible; no overlap detected. |

## Automated Browser Findings

From `browser-validation-results.json`:

- Desktop dashboard: no horizontal overflow, no unnamed visible interactive controls, no small visible targets.
- Mobile dashboard: no horizontal overflow, no unnamed visible interactive controls, no small visible targets.
- Mobile participant empty-task state: no horizontal overflow; no visible interactive controls in this empty task state.

## Remaining Mobile Evidence Needed

- Mobile participant Round 1 active response form.
- Mobile participant Round 1 submitted/review/edit state.
- Mobile participant Round 2 verbal structured judgment task.
- Mobile curation desk with long participant responses.
- Mobile reporting/export review.
