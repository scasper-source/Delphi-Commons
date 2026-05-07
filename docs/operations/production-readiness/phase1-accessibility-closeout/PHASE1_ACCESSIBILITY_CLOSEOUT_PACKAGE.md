# Phase 1 Accessibility Closeout Package (`mock_trial` baseline reuse)

Date: 2026-05-07.

## Boundary

This package organizes accessibility closeout evidence for Phase 1 pilot-readiness preparation.
It does **not** claim WCAG conformance, accessibility certification, production readiness, or human-subjects readiness.

## Baseline reuse and status

Reuse existing automated/synthetic accessibility-relevant evidence where valid (existing UI checks, mobile synthetic screenshots, policy gate checks). Treat this as baseline only.

Manual evidence status (initial):
- Keyboard-only human walkthrough: **NOT RUN**.
- NVDA/VoiceOver assisted review: **NOT RUN**.
- Mobile real-device review: **NOT RUN**.

## Required package contents

1. Keyboard-only walkthrough record for consent and active round tasks.
2. NVDA and/or VoiceOver review transcript.
3. Mobile real-device review record.
4. Error-message/input association checklist.
5. Focus order, labels, contrast, time limits, copy clarity checklist.
6. Defect log and remediation evidence template.

## 1) Keyboard-only walkthrough scope

Use template: `KEYBOARD_WALKTHROUGH_TEMPLATE.md`.

Minimum tasks:
- Consent page reachability and action by keyboard only.
- Active round response entry and submission by keyboard only.
- Support path keyboard navigation.
- Withdrawal path keyboard navigation.
- No keyboard trap and predictable focus restoration after errors/dialogs.

## 2) NVDA/VoiceOver review template

Use template: `SCREEN_READER_REVIEW_TEMPLATE.md`.

Capture:
- screen reader/version/browser/device,
- announced labels and role names,
- error announcements and field association,
- heading landmarks and navigation quality,
- ambiguous/unclear copy findings.

## 3) Mobile real-device review template

Use template: `MOBILE_REAL_DEVICE_REVIEW_TEMPLATE.md`.

Capture at minimum:
- iOS Safari and/or Android Chrome real device details,
- consent and active round task usability,
- zoom/reflow behavior,
- touch target clarity,
- orientation and viewport behavior,
- closeout/support/withdrawal path usability notes.

## 4) Error-message/input association checklist

Use template: `ERROR_ASSOCIATION_CHECKLIST_TEMPLATE.md`.

Required checks:
- every invalid input has a visible error message,
- error message is programmatically associated with the relevant input,
- focus moves to or clearly indicates first invalid field,
- summary errors (if present) link or reference field locations,
- copy is specific and actionable.

## 5) Focus/labels/contrast/time-limit/copy checklist

Use template: `UX_A11Y_CHECKLIST_TEMPLATE.md`.

Checklist domains:
- focus order and visibility,
- labels and accessible names,
- contrast and legibility,
- time-limit messaging and user control (where applicable),
- clarity/non-coercive participant copy.

## 6) Defect log and remediation evidence template

Use template: `A11Y_DEFECT_REMEDIATION_TEMPLATE.md`.

Each defect record should include:
- severity (`P0`-`P3`),
- reproducible steps,
- expected vs observed,
- affected role/page/device/assistive technology,
- fix reference (commit/PR),
- retest status and evidence links.

## Output expectations

- Completed templates for all sections above.
- Explicit **NOT RUN** markers for any manual evidence not yet completed.
- Consolidated closeout summary with residual accessibility risks and owners.
