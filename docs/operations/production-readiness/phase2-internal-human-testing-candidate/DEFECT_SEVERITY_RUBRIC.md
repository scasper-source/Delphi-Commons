# Defect Severity Rubric — Internal Human-Testing Candidate

Use this rubric while human testing is executed. Until then, defect observations remain `NOT RUN` / `HUMAN_REQUIRED`.

| Severity | Definition | Typical examples | Default release impact |
|---|---|---|---|
| P0 | Safety, confidentiality, identity-separation, consent-rights, or authorization failure with potential serious harm/exposure. | Unauthorized data access, broken consent gate, identity-response correlation exposure. | NO-GO |
| P1 | Critical workflow/control failure that blocks required controlled operation or invalidates evidence quality. | Cannot proceed through rounds, export control enforcement failure, backup restore failure. | NO-GO unless explicitly waived with documented risk acceptance (human signoff required). |
| P2 | Significant but non-critical defect causing friction, confusion, or degraded usability without immediate safety/control break. | Misleading copy, unstable but recoverable workflow step, non-blocking UI defects. | GO WITH CONDITIONS possible if documented and accepted. |
| P3 | Minor quality/documentation/polish issue without material workflow or safeguard impact. | Typo, formatting issue, cosmetic alignment issue. | GO WITH CONDITIONS possible. |

## Classification rules

- Assign severity based on observed impact, not intent.
- Use highest applicable severity when multiple impacts apply.
- Reclassify if new evidence changes impact understanding.
- Any unresolved P0/P1 blocks internal human-testing completion claims.
