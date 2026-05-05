# Observer Notes

Live execution status: CONTROLLED SYNTHETIC LOCAL RUN COMPLETED WITH CONDITIONS.

Use this file as evidence from the 2026-05-05 local API-driven run with headless browser/mobile smoke, and as the starting point for any future manual all-8 browser UI rehearsal.

## Session Metadata

| Field | Value |
| --- | --- |
| Observer | Codex local API runner |
| Date/time started | `2026-05-05T17:11:47.924Z` |
| Date/time completed | `2026-05-05T17:11:47.924Z` artifact timestamp |
| Commit hash | `9c046cc3594b4e78e607dc37f10989eb2186dfc0` |
| Branch | `master` |
| App URL | `http://127.0.0.1:5173/` |
| Backend URL | `http://127.0.0.1:3001` |
| Browser | Microsoft Edge headless smoke |
| Desktop viewport | Staff dashboard headless smoke |
| Mobile viewport 320px | PASS headless smoke |
| Mobile viewport 390px | PASS headless smoke |
| Mobile viewport 414px | PASS headless smoke |
| AI mode | Existing deterministic local AI helpers with No External AI mode |
| Study ID | `b8bc10f2-8a10-48b5-b82b-85e5d0053c48` |
| Version ID | `c2c42b39-d285-4ae8-9435-26c96529b0c3` |

## Commands And Checks

| Command/check | Result | Notes |
| --- | --- | --- |
| `git status --short` | PASS | Evidence changes were present. |
| `git rev-parse --short HEAD` | PASS | `9c046cc3594b4e78e607dc37f10989eb2186dfc0`. |
| `git branch --show-current` | PASS | `master`. |
| `Get-Date -Format o` | PASS | Timestamp captured. |
| Backend health | PASS | `{"status":"ok","service":"edelphi-server","environment":"development"}`. |
| Local Node API rehearsal runner | PASS WITH CONDITIONS | Completed synthetic lifecycle, regenerated exports, privacy-scanned exports, and captured headless mobile smoke evidence. |
| App build | PASS | Completed before the successful rerun. |
| App lint | NOT RUN | No executable code change in evidence update. |
| App tests | NOT RUN | No executable code change in evidence update. |
| Server build | PASS | Completed before the successful rerun. |
| Server tests | NOT RUN | No executable code change in evidence update. |
| Security audits | NOT RUN | No dependency/security change in evidence update. |

## Round Completion Matrix

| Participant | Round 1 | Round 2 | Round 3 | Round 4 | Notes |
| --- | --- | --- | --- | --- | --- |
| SYN-P001 | PASS | PASS | PASS | PASS | Synthetic API participant |
| SYN-P002 | PASS | PASS | PASS | PASS | Synthetic API participant |
| SYN-P003 | PASS | PASS | PASS | PASS | Support-loop participant |
| SYN-P004 | PASS | PASS | PASS | PASS | Synthetic API participant |
| SYN-P005 | PASS | PASS | PASS | PASS | Retained disagreement/minority rating pattern where appropriate |
| SYN-P006 | PASS | PASS | PASS | PASS | Singleton weather-aware item source |
| SYN-P007 | PASS | PASS | PASS | PASS | Synthetic API participant |
| SYN-P008 | PASS | PASS | PASS | PASS | Retained printable-schedule perspective |

## Governance Observations

| Check | Result | Evidence |
| --- | --- | --- |
| Classic Delphi selected | PASS | `study_format: ClassicDelphi`. |
| 4 planned rounds shown | PASS | Planned round count 4 in API result. |
| Terminal round 4 shown | PASS | Terminal round 4 in API result. |
| Consensus rule configured before launch | PASS | Rule configured before activation. |
| Consensus rule locked after launch | PASS | Backend returned `consensus_rule_locked`. |
| Consensus rule locked after Round 2 | PASS | Backend returned `consensus_rule_locked`. |
| Consensus rule locked after Round 3 | PASS | Backend returned `consensus_rule_locked`. |
| Consent/acknowledgement required | PASS through API | Manual browser gate remains NOT RUN. |
| Withdrawal/voluntariness visible | NOT RUN | Browser-visible copy check required. |
| Confidentiality/anonymity limits truthful | NOT RUN | Browser-visible copy check required. |
| No production-readiness implication | PASS | Backend health reported `development`; docs retain controlled synthetic boundary. |

## Support Loop Observations

| Step | Result | Evidence |
| --- | --- | --- |
| SYN-P003 submits issue note | PASS | API-created issue note. |
| PI/admin sees note | PASS | Owner/admin issue list included the note. |
| PI/admin responds | PASS | Staff response recorded. |
| SYN-P003 sees response | PASS | Participant issue history returned staff response. |
| Other participants do not see identity-linked support info | NOT RUN | Needs negative visibility test in a future manual/browser pass. |

## AI Observations

| Check | Result | Evidence |
| --- | --- | --- |
| AI mode recorded | PASS | Existing deterministic local AI helpers with No External AI mode. |
| External AI disabled or explicitly safe synthetic-only | PASS | No live external AI calls used. |
| AI output labeled non-final | PASS | `AI Suggestion (Not Final)`. |
| Human Accept/Edit/Reject required | PASS | Human curation decision required before materialization. |
| AI cannot publish participant-facing content alone | PASS | Owner/steward release signoffs used. |
| AI cannot decide consensus | PASS | Consensus decisions remained rule/report based, not AI-decided. |
| Direct identifiers excluded from AI input | PASS | No direct identifiers were sent to external AI; local helper path used synthetic content. |
| Identity-response mapping excluded from AI input | PASS | No identity-response mapping was sent to AI. |

## Export Observations

| Check | Result | Evidence |
| --- | --- | --- |
| Export generated | PASS | Five governed export packages generated. |
| Files listed | PASS | 48 generated export files scanned. |
| Required limitation exact | PASS | Required sentence present exactly. |
| Consensus threshold included | PASS | Consensus rule context present. |
| Non-consensus included | PASS | Final report summary retained 3 non-consensus items. |
| Identity leakage absent | PASS after focused remediation regression | Original API run found synthetic labels/raw participant UUID hits; regenerated de-identified exports now scan with zero failures. |
| AI disclosure included if applicable | PASS | No External AI/local deterministic helper boundary recorded. |

## Defect Capture

Observed defects:

| ID | Severity | Summary |
| --- | --- | --- |
| FMT-2026-05-05-P0-001 | P0 | REMEDIATED: export package files contained synthetic participant labels and raw participant UUIDs in the original run; regenerated de-identified exports now pass privacy scan. |
| FMT-P2-BROWSER-SCOPE | P2 | Full lifecycle was API-driven through local invitation endpoints; browser evidence was headless mobile smoke rather than a manual all-8 UI submission pass. |

See `DEFECT_LOG.md` and `EXPORT_PRIVACY_CHECK.md` for details.
