# Rehearsal Results - Test 4

Date: 2026-05-05

## Clean Run

Passed:

- `app npm.cmd run build`
- `server npm.cmd run build`
- Backend health check returned OK at `http://127.0.0.1:3001/health`.
- Frontend opened at `http://127.0.0.1:5173/`.

Earlier focused checks passed after the repair work that preceded this rerun:

- `app npm.cmd test -- policyGates.test.mjs`
- `server npm.cmd test -- zzParticipantIssue.test.mjs`

## Synthetic Study Used

- Study: Care Transitions Expert Delphi
- Study ID: `75f86334-4a1c-4eb1-a152-603f162561d9`
- Version ID: `b8e15151-6b72-40b1-8aa9-0943b8830740`
- Participants:
  - Synthetic participant 1: invitation token link only; no account password required.
  - Synthetic participant 2: invitation token link only; no account password required.

## Browser Flow Evidence

Passed in browser:

- Study Owner opened a synthetic study workspace.
- Consent materials were visible in the participant portal.
- Participant acknowledgement was required before Round 1 submission; an attempted submission without the consent acknowledgement was blocked.
- Consensus threshold lock was visible after launch; Study Builder did not expose a normal post-launch save path for the locked threshold.
- Round 1 was opened.
- Two distinct synthetic invitation participants submitted Round 1 responses through the browser.
- One invitation participant submitted a `Having trouble?` issue note.
- Study Owner dashboard displayed the participant issue note.
- Study Owner recorded a response and marked the issue reviewed.
- The participant saw the study-team response in the participant issue history.
- Round 1 was closed through the Rounds screen.
- Study Owner curated both Round 1 responses into candidate statements.
- Both candidate statements were published for Round 2.
- Round 2 setup was saved and opened.
- Two distinct synthetic invitation participants submitted Round 2 ratings and rationales through the browser.
- Round 2 participant screen displayed the controlled-feedback agency language and required interpretation statement:
  - `You may revise or retain your view.`
  - `You may keep your previous response.`
  - `You may revise your response.`
  - `Different views are valuable.`
  - `Consensus does not mean correctness.`
- Reporting dashboard loaded current synthetic Round 2 results and showed item classifications with `n=2`.
- Report/export package preparation worked.

Backend verification after browser submissions:

- Six response records existed: two Round 1 open-ended responses and four Round 2 rating records.
- Both synthetic participants had one Round 1 response and two Round 2 item ratings.

## Export / Report Check

Passed:

- Reporting displayed the required limitation statement:
  - `Consensus indicates agreement among this panel; it does not establish correctness.`
- Prepared export package contained six files:
  - `CITATION.md`
  - `final_report/final_delphi_report.docx`
  - `final_report/final_delphi_report.json`
  - `final_report/final_item_results.csv`
  - `final_report/final_item_results.xlsx`
  - `final_report/required_limitations_and_disclosures.md`
- Export scan found no synthetic participant names.
- Export scan found no synthetic participant emails.
- Export scan found no phone-number terms or values.
- Export scan found no raw synthetic participant IDs.
- Export scan found the required limitation statement.

Clarification:

- The export metadata includes redaction-profile labels such as `participant_ids: excluded_from_public_report`. These labels are not direct identity fields and were treated as disclosure metadata, not identity leakage.

## Language / Ethics Check

No observed participant-facing controlled-feedback language pressured convergence or framed consensus as correctness.

Forbidden-language scan of the participant feedback path did not find:

- outlier
- deviant
- nonconforming
- you aligned
- you disagreed with the panel
- success rate
- failed to reach the right answer
- align with the group
- you should change
- consensus answer
- correct answer

## Remaining Friction / Evidence Gaps

- Mobile-width rehearsal was not completed in the available in-app browser runtime.
- `Final Delphi Report` can still be prepared before the declared terminal round is complete, although the Reporting dashboard labels the report stage as `interim` and includes limitations.
- Switching between two invitation links in the same browser tab may briefly retain prior participant state until reload. The browser reload workaround allowed the second participant to load the correct task and complete both rounds.

## Result

Test 4 supports GO WITH CONDITIONS for a larger controlled synthetic mock-participant trial.

This is not authorization for real human-subjects research, production deployment, sensitive participant data, or IRB launch.
