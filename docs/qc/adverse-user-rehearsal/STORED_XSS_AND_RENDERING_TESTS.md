# Stored-XSS And Rendering Tests

Status: EXECUTED WITH HEADLESS BROWSER SMOKE AND EXPORT SCANNING.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Purpose

These checks test whether participant-authored malicious synthetic text executes as code or is rendered unsafely in participant, staff, report, preview, or export contexts.

## Fixtures

The rehearsal used synthetic text containing:

- HTML tags.
- Script-like text.
- Event-handler-like text.
- Iframe/object/embed-like text.
- Markdown-style links.
- Prompt-injection text.
- Placeholder abusive content.
- Formula-like text.
- Newline-heavy and unicode stress text.

No real slurs, real credentials, real contact details, or real participant data were used.

## Headless Browser Smoke

| View | Width | Result | Screenshot |
| --- | ---: | --- | --- |
| Adverse participant portal | 320px | PASS | `docs/qc/adverse-user-rehearsal/artifacts/adverse-participant-320-320.png` |
| Adverse participant portal | 390px | PASS | `docs/qc/adverse-user-rehearsal/artifacts/adverse-participant-390-390.png` |
| Adverse participant portal | 414px | PASS | `docs/qc/adverse-user-rehearsal/artifacts/adverse-participant-414-414.png` |
| Same-tab invitation switch | 390px | PASS | `docs/qc/adverse-user-rehearsal/artifacts/same-tab-invite-switch-390.png` |

Observed in all headless browser smoke checks:

- `xssExecuted`: false.
- Horizontal overflow: false.
- Forbidden synthetic label observed: false.
- Forbidden email observed: false.

## Export Rendering Scan

After the initial formula-injection P0 was remediated, the rerun produced:

- Privacy failures: 0.
- Spreadsheet formula failures: 0.
- Rendering warnings: 12.

The rendering warnings indicate script-like or markup-like strings remain as inert text in some text-bearing exports:

- `anonymized-response-dataset/ratings.csv`
- `anonymized-response-dataset/responses.csv`
- `provenance-bundle/item_transformation_history.csv`
- `complete-archive/anonymized_dataset.json`

Finding ID: `ADVERSE-P2-RAW-MARKUP-IN-TEXT-EXPORTS`.

## Interpretation

No stored-XSS execution was observed. The remaining issue is not automatic moderation; it is that unsafe-looking text is still visible as inert exported text in some artifacts. For controlled synthetic testing this is a P2 condition because:

- No script execution was observed.
- No formula injection remained after remediation.
- No identity leakage was observed in de-identified exports.
- Human review is required before participant-facing reuse.

Before production readiness, exports and previews should either sanitize/highlight this content more explicitly or document safe handling instructions for reviewers.
