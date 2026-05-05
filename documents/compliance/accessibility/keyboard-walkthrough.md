# Keyboard Walkthrough

**Project:** Delphi Commons
**Target:** WCAG 2.2 AA keyboard and focus behavior
**Date:** 2026-05-02

## Method

The current local app at `http://127.0.0.1:5173/` was tested with a headless browser at:

- Desktop: 1365 x 900
- Mobile dashboard: 390 x 844
- Mobile participant portal: 390 x 844

The browser validation pass sampled the first 18 Tab stops where focusable controls were present.

## Results

| Screen | Result | Evidence |
|---|---|---|
| Desktop dashboard | Tab order starts at Current role, proceeds through module navigation, next action, refresh/archive, and saved-study actions. All sampled focus stops were visible. | `browser-validation-results.json` |
| Mobile dashboard | Tab order remains visible after single-column reflow. No horizontal scrolling was detected. | `browser-validation-results.json`; `screenshots/mobile-dashboard.png` |
| Mobile participant no-active-task state | No active task controls were present in the sampled empty state; page content reflowed without horizontal overflow. | `browser-validation-results.json`; `screenshots/mobile-participant.png` |

## Focus Improvements Added

Global focus styling was added for:

- `button`
- `select`
- `input`
- `textarea`
- `summary`
- generic tabindex targets

Focus indicator:

```css
outline: 3px solid #2f6f73;
outline-offset: 3px;
```

## Follow-Up Keyboard Scenarios Required

- Complete Study Builder using keyboard only.
- Record governance signoff using keyboard only.
- Configure, open, and close Round 1 using keyboard only.
- Submit Round 1 participant response using keyboard only.
- Complete Round 2 verbal structured judgment task using keyboard only.
- Review and download export package using keyboard only.
- Confirm focus is not trapped or obscured in any future modal/dialog workflow.
