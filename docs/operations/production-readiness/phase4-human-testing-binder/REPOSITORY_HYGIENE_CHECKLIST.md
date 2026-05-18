# Repository Hygiene Checklist

Status: **AUTOMATED CHECKS REFRESHED / HUMAN REVIEW REQUIRED / NOT READY FOR HUMAN TESTING**.

This checklist records release hygiene for the human-testing candidate. It is not a public release approval.

| Area | Check | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| secrets | No obvious committed credentials, API keys, private keys, or tokens | AUTOMATED_PASS / HUMAN_REVIEW_REQUIRED | Command evidence below | Automated scan is not a substitute for human review |
| real participant data | No real participant data committed | HUMAN_REQUIRED | Human review required | Code/docs may mention participants conceptually |
| sensitive exports | No sensitive export payloads committed | HUMAN_REQUIRED | Human review required | Export metadata may be documented; payloads must not be committed |
| boundary notes | Public/open-source code boundary vs private study data boundary documented | PASS | `README.md`, `docs/CURRENT_STATUS.md`, this binder | Public release remains separate |
| dependency audit | App high-severity audit result recorded | PASS_HIGH_SEVERITY_WITH_MODERATE_ADVISORY | `npm.cmd --prefix app run security:audit` | One moderate `brace-expansion` advisory reported |
| dependency audit | Server high-severity audit result recorded | PASS | `npm.cmd --prefix server run security:audit` | 0 vulnerabilities |
| working tree hygiene | Whitespace/conflict-marker check clean | PASS | `git diff --check` | CRLF warnings only |
| release scope | Unsupported surfaces and limitations documented | PASS | `CANDIDATE_RECORD.md` |  |

## Command Evidence Log

Command evidence refreshed on 2026-05-18 against candidate source snapshot `2a71d6c` plus Phase 4 binder documentation edits.

| Command | Result | Date | Notes |
| --- | --- | --- | --- |
| `git diff --check` | PASS | 2026-05-18 | Exit 0; CRLF warnings only |
| `npm.cmd --prefix app run security:audit` | PASS_HIGH_SEVERITY_WITH_MODERATE_ADVISORY | 2026-05-18 | High-severity audit threshold passed; npm reported one moderate `brace-expansion` advisory |
| `npm.cmd --prefix server run security:audit` | PASS | 2026-05-18 | 0 vulnerabilities |
| `rg -n --hidden --glob '!node_modules/**' --glob '!app/node_modules/**' --glob '!server/node_modules/**' "(AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----|xox[baprs]-|ghp_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{20,})" .` | PASS | 2026-05-18 | No matches; `rg` exit 1 indicates no matches |

## Human Review Notes

- Reviewer: **HUMAN_REQUIRED**
- Real participant data review result: **HUMAN_REQUIRED**
- Sensitive export review result: **HUMAN_REQUIRED**
- Accepted residual risks: **HUMAN_REQUIRED**
- Recommendation: **NOT READY FOR HUMAN TESTING**
