# Defect Log Delta - Test 4

Severity definitions:

- P0: ethical, security, privacy, or governance blocker; do not test with mock participants.
- P1: major functional or methodological defect; fix before mock trial.
- P2: significant friction or incomplete evidence; may proceed only with documented workaround.
- P3: polish issue.

| ID | Severity | Area | Finding | Evidence | Workaround | Recommended action |
| --- | --- | --- | --- | --- | --- | --- |
| QC-IBR4-001 | P2 | Export labeling | `Final Delphi Report` export can still be prepared before the declared terminal round is complete, although the UI labels the report stage as `interim`. | Test 4 study design declared terminal round 3. After Round 2, Reporting allowed preparing a Final Delphi Report package and also showed `Report stage: interim` plus limitations stating the MVP report is interim relative to the StudyVersion design. | Treat the package as interim synthetic evidence only; do not treat it as terminal closeout evidence. | Consider renaming the action to `Prepare interim report` until the terminal round closes, or make the interim label part of the package title. |
| QC-IBR4-002 | P2 | Mobile evidence | A dedicated 320-390px viewport rehearsal was not completed in the available in-app browser runtime. | Desktop browser pass completed. The browser runtime did not provide a practical viewport resize during this rehearsal. | Use existing responsive tests/static checks as partial evidence; run a dedicated mobile viewport pass before inviting a larger synthetic panel. | Complete a mobile-width pass with Playwright or a browser profile that can enforce 320px/390px widths. |
| QC-IBR4-003 | P3 | Invitation context switching | Switching from one invitation token to another in the same browser tab may briefly retain prior participant state until reload. | During Test 4, opening participant 2 after participant 1 initially showed prior participant state. A browser reload on the participant 2 invitation URL loaded the correct participant context, and participant 2 completed Round 1 and Round 2. | For the controlled mock trial, use separate browser profiles/incognito sessions or reload after switching invitation links in the same tab. | Ensure invitation-token changes clear participant-local state immediately without requiring reload. |

## Resolved From Prior Rehearsals

| Prior ID | Status | Evidence |
| --- | --- | --- |
| QC-IBR-001 | Resolved | Study Builder `Open Round 1` no longer produced `use_round_transition_endpoint`; Round 1 opened from the Study Builder workflow. |
| QC-IBR-002 | Resolved | PI dashboard saw an invitation-linked support note, PI recorded a response, and the participant saw the study-team response in the invitation portal issue history. |
| QC-IBR3-001 | Resolved | Direct invitation links rendered the active Round 1 task and later the active Round 2 task after the participant-invite hydration fix. |
| QC-IBR3-002 | Resolved | Two distinct synthetic invitation participants completed Round 1 and Round 2 through the browser. |
| QC-IBR3-003 | Resolved in this pass | Reporting UI loaded current browser-submitted Round 2 ratings and showed item classifications with `n=2`. |
| QC-IBR3-004 | Still open as P2 | See QC-IBR4-001. |
| QC-IBR3-005 | Still open as P2 | See QC-IBR4-002. |

## P0 / P1 Review

No P0 defect was observed in this pass. No P1 defect was observed in this pass. Remaining issues are P2/P3 conditions for synthetic mock testing and do not authorize real human-subjects deployment.
