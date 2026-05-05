# Screen Reader Notes

**Project:** Delphi Commons
**Target:** WCAG 2.2 AA screen reader readiness
**Date:** 2026-05-02
**Status:** Source and structural review complete; human assistive-technology review still required.

## Positive Findings

- Sidebar has an application module label.
- Main work area uses headings that describe the active module.
- Form controls in the Study Builder use visible labels wrapping the inputs.
- Participant Round 2 ratings use a `fieldset` with an `aria-label` describing the statement being rated.
- Data bars include `aria-label` values with the metric name and percentage.
- Danger notices use `role="alert"`; non-danger notices use `role="status"`.
- Participant-facing copy avoids false anonymity and states confidentiality to the research team.

## Current Risks

- The app does not yet provide skip links for moving directly to main content.
- Some status badges are visually meaningful but may be repetitive when read in sequence.
- Warning/status sections may need stronger `aria-live` behavior for asynchronous backend actions.
- Field-level validation errors are shown in banners, but not always programmatically tied to the specific field with `aria-describedby`.
- The mobile participant no-active-task state has no visible interactive controls after the role switch, which is acceptable for the empty state but should be retested with an active invitation/task.

## Recommended Human Review

Run at least one walkthrough with:

- NVDA + Firefox or Chrome on Windows.
- VoiceOver + Safari on iOS or macOS.

Required flows:

- Create/open study.
- Complete Study Builder.
- Submit governance signoff.
- Participant consent and Round 1 response.
- Participant Round 2 verbal structured judgment.
- Withdrawal and retention/deletion review request.
- Export package review.

## Screen Reader Pass Criteria

- Headings form a meaningful outline.
- Every control has an understandable accessible name.
- Error/status messages are announced or reachable immediately after action.
- Participant task copy is understandable without visual layout.
- Rating choices are announced as words, not only numbers.
- Retain/revise choices are presented neutrally.
