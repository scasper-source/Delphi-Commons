# Malicious Input Fixtures

Status: EXECUTED.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Fixture Principles

All fixtures are synthetic and local/dev only. The fixtures intentionally avoid real participant data, real credentials, real institutions, real contact details, and real slurs or targeted abuse.

Synthetic placeholder abuse uses:

- `[ABUSIVE_PLACEHOLDER]`
- `[HARASSMENT_PLACEHOLDER]`

The purpose is to test containment, rendering, export safety, and governance workflow behavior, not to create a general moderation system.

## Fixture Categories

| Category | Examples used | Expected containment |
| --- | --- | --- |
| HTML and script-like text | `<script>...`, `<img ... onerror=...>` | Stored/displayed as inert text or rejected; no execution |
| Event-handler text | `onerror`, `onload` patterns | No browser execution |
| Embedded content text | `iframe`, `object`, `embed` text | Inert text only |
| Markdown links | Example-only links | Safe or inert rendering |
| Suspicious URLs | `https://example.test/...` | No external production target |
| Email-shaped strings | `syn-p001@example.test` style | Redacted or excluded from de-identified exports |
| Phone-like strings | Fake formatted values | Redacted or excluded from de-identified exports |
| UUID-like strings | Synthetic UUID-shaped values | Redacted in de-identified free text; participant-linkable IDs excluded |
| Synthetic labels | `SYN-P001` through `SYN-P008` | Redacted or excluded from de-identified exports |
| Identity-claim text | Attempts to identify another participant | Not trusted as identity mapping |
| Coercive text | Attempts to pressure consensus | Not published without human review |
| Prompt injection | "Ignore previous instructions" style text | Treated as participant text, not governance instruction |
| Export exfiltration text | Requests to reveal hidden data | No hidden data released |
| Long text | Oversized rationale/support payloads | Rejected or safely truncated |
| Unicode stress | Emoji, punctuation, combining/bidirectional markers | Safe rendering |
| Newline-heavy text | Many-line text | Safe storage/export representation |
| Formula-like text | Values beginning with `=`, `+`, `-`, `@`, including leading spaces/tabs | Neutralized in CSV/XLSX exports |

## Execution Evidence

The runner submitted malicious synthetic Round 1 inputs for all eight synthetic participants and also injected selected formula/prompt fixtures into later rating rationales.

Primary current artifact:

- `docs/qc/adverse-user-rehearsal/artifacts/adverse-user-rehearsal-latest.json`

The artifact records:

- `malicious synthetic Round 1 inputs submitted`: PASS.
- Fixture categories: HTML/script-like text, prompt injection, coercive placeholder text, direct identifiers, formula-like strings, unicode/newline stress.
- Payload-size handling: PASS.

## Payload-Size Result

| Attempt | Result |
| --- | --- |
| Over-limit Round 1 submission without consent | 403 `active_consent_required` |
| Over-limit Round 1 submission after consent | 400 |
| Overall payload-size result | PASS |

## Containment Result

The fixtures did not:

- Execute as script in headless browser smoke.
- Expose forbidden synthetic labels or emails in inspected participant DOM text.
- Alter consensus rules.
- Publish unsafe AI suggestions without human review.
- Leak identity-response mappings through de-identified exports.
- Survive as unsafe spreadsheet formulas after remediation.

Remaining P2 condition: script-like or markup-like text can remain as inert text in some text-bearing exports. This is acceptable for controlled synthetic testing because no execution was observed and spreadsheet formula risk was neutralized, but it should be highlighted or sanitized more clearly before production readiness.
