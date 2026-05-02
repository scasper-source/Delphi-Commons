# Phase 9 Accessibility Checklist

**Project:** eDelphi  
**Target:** WCAG 2.2 AA  
**Date:** 2026-05-02  
**Status:** Partial pass for current MVP screens; full release still requires human assistive-technology review.

## Reference Standard

- W3C WCAG 2 overview: WCAG 2.2 has 13 guidelines under four principles: perceivable, operable, understandable, and robust.
- W3C WCAG 2.2 additions checked in this pass: focus not obscured, target size minimum, no drag-only interaction, consistent help, redundant entry, accessible authentication.

## Automated Evidence

- `app/tests/policyGates.test.mjs`
  - Forbidden participant/coercive language check.
  - Unsafe HTML/browser storage check.
  - Core color contrast check for normal text.
  - Visible focus style check.
- `documents/compliance/accessibility/browser-validation-results.json`
  - Desktop dashboard: no horizontal overflow, no unnamed visible interactive controls, no small visible targets, no invisible sampled tab stops.
  - Mobile dashboard: no horizontal overflow, no unnamed visible interactive controls, no small visible targets, no invisible sampled tab stops.
  - Mobile participant empty-task state: no horizontal overflow or text overlap observed; no visible interactive controls in no-active-task state.

## Checklist

| Area | WCAG 2.2 AA intent | Current result | Evidence | Status | Follow-up |
|---|---|---|---|---|---|
| Keyboard navigation | All functionality available by keyboard; focus order meaningful. | Dashboard tab order reaches role picker, module buttons, next action, saved-study actions. | `keyboard-walkthrough.md`; browser validation JSON. | Partial pass | Repeat with active Round 1 and Round 2 participant tasks after seeded E2E flow. |
| Focus states | Focus visible and not obscured. | Added global `:focus-visible` outline with 3px green outline and offset. | `app/src/App.css`; app tests. | Pass for current controls | Check against sticky/fixed elements if layout changes. |
| Labels and descriptions | Inputs and controls have accessible names and visible/semantic labels. | Browser pass found zero unnamed visible interactive controls on sampled screens. | Browser validation JSON. | Pass for sampled screens | Add component-level accessibility tests if UI grows. |
| Mobile layout | Reflow without horizontal scrolling or overlap. | 390px viewport dashboard and participant screenshots show no horizontal overflow. | `mobile-screenshots.md`; screenshots. | Pass for sampled screens | Add active-task mobile screenshots for Round 1 and Round 2. |
| Contrast | Normal text contrast at least 4.5:1; non-text states visibly distinct. | Adjusted eyebrow text from `#69797a` to `#5d6d70`; test covers core text pairs. | App tests. | Pass for core palette | Run full visual contrast scan before release. |
| Screen reader flow | Landmarks, headings, labels, and status messages should make sense linearly. | App uses headings, labeled role picker, labeled module sidebar, field labels, `role=status`/`alert` notices. | `screen-reader-notes.md`; source review. | Partial pass | Human NVDA/VoiceOver review required. |
| Understandable errors | Errors should identify what happened and next action in plain language. | Backend errors are humanized in UI for common auth/study states; warning banners have short titles and details. | Copy review log. | Partial pass | Add `aria-describedby` connections for field-specific validation errors. |
| No text overlap | Text should wrap and stay inside containers. | Long curation/provenance text has `overflow-wrap` and scroll limits; sampled screenshots show no overlap. | Screenshots; CSS review. | Pass for sampled screens | Continue screenshot checks on report/export screens. |
| Participant coercion | Participant copy must not pressure convergence. | Copy uses neutral terms: retain, revise, group summary, confidential to research team. | App tests; copy review log. | Pass for sampled copy | Expand copy review for every backend-generated export and email/reminder. |
| Low-literacy participant copy | Participant-facing text should be plain and concrete. | Participant portal copy is short, plain, and rights-oriented. | Copy review log. | Partial pass | Plain-language reviewer should review consent and withdrawal copy before real study. |

## Current Release Position

Accessibility is improved and documented, but not yet sufficient for real human-subjects launch. The remaining launch evidence should include:

- Manual keyboard-only dry run across Study Builder, Governance, Rounds, Curation, Reporting, Admin/Security, and participant tasks.
- NVDA or VoiceOver walkthrough notes.
- Active participant Round 1 and Round 2 mobile screenshots.
- Full contrast scan or axe-style automated audit.
- Human plain-language review of participant consent, task, withdrawal, and error copy.
