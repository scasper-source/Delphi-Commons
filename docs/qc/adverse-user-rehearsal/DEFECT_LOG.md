# Defect Log

Status: EXECUTED WITH CONDITIONS.

Current decision impact: GO WITH CONDITIONS for continued controlled synthetic mock testing only.

"Any GO or GO WITH CONDITIONS applies only to controlled synthetic mock testing. It does not authorize production deployment, real human-subjects research, IRB launch, or use of sensitive participant data."

## Severity Definitions

P0 blocks continued controlled synthetic mock testing:

- Identity-response mapping exposed to participants or de-identified exports.
- Raw participant identifiers exposed in de-identified exports.
- Consent/acknowledgement bypass.
- Consensus rule can be changed after launch without version/governance protection.
- AI can publish participant-facing content without human approval.
- AI can alter consensus, reporting, or item inclusion without human approval.
- Coercive consensus language appears in participant-facing workflow.
- Malicious input executes as script.
- Stored-XSS executes in staff, participant, report, preview, or export views.
- Formula injection survives unsafely in spreadsheet exports.
- Participant can access another participant's response or support thread.
- Participant can access admin/study-owner views.
- IDOR exposes participant-linkable or restricted content.
- Same-tab invitation switching causes identity/response cross-linking.
- Abusive/coercive content is automatically amplified without human review.
- Production or real-data path is touched.

P1 blocks larger controlled mock trial unless safely worked around:

- Export classification ambiguous.
- Support-loop privacy uncertain.
- Audit logging missing for high-risk governance changes.
- Curation allows silent deletion of dissent.
- Malicious input causes app crash or unrecoverable workflow failure.
- Browser/mobile adverse test not run where UI behavior is material.
- AI prompt-injection handling unclear.
- Restricted export can be mistaken for de-identified export.
- IDOR errors leak internal IDs, stack traces, or sensitive implementation details.
- Same-tab invitation switching behavior is unclear or insufficiently documented.
- Payload-size handling is unclear and could plausibly cause data loss.
- No safe participant withdrawal/removal path or workaround exists.

P2 can proceed only with documented condition:

- Confusing warning copy.
- Non-blocking validation issue.
- Malicious input is contained but not clearly flagged.
- Audit evidence incomplete but core safety behavior holds.
- Mobile display problem that does not block completion or leak data.
- Very long input is accepted but safely handled.
- Suspicious input is escaped but not highlighted to admins.
- Participant withdrawal/removal exists only as a manual documented workaround but is safe for controlled synthetic testing.

P3 backlog:

- Polish.
- Clearer test labels.
- Improved admin guidance.
- Minor UX refinements.
- Future automatic moderation or triage enhancements.

## Defects And Conditions

| ID | Severity | Area | Status | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| `ADVERSE-P0-FORMULA-INJECTION` | P0 | Export/spreadsheet safety | REMEDIATED | Initial completed artifact `adverse-user-rehearsal-2026-05-05T17-34-58-577Z.json`; rerun `adverse-user-rehearsal-2026-05-05T17-40-13-932Z.json` | Formula-like cells survived in de-identified CSV exports before remediation. CSV/XLSX export neutralization and regression tests were added, then exports were regenerated and rescanned with zero formula failures. |
| `ADVERSE-P2-DUPLICATE-ROUND1` | P2 | Participant workflow | OPEN | Duplicate Round 1 submission returned 201 | Not proven to leak identity or corrupt exports. Clarify whether Round 1 allows multiple submissions or should be idempotent. |
| `ADVERSE-P2-RAW-MARKUP-IN-TEXT-EXPORTS` | P2 | Export/rendering | OPEN | 12 rendering warnings in current artifact | Script-like or markup-like text remains as inert text in text-bearing exports. No script execution or formula failure observed. |

## Remediation Evidence

Code paths changed for spreadsheet formula neutralization:

- `server/src/exports/exportPrivacy.ts`
- `server/src/routes/reports.ts`
- `server/src/exports/finalReportRenderers.ts`
- `server/src/exports/officeRenderers.ts`

Regression and policy tests updated:

- `server/tests/zzExportPrivacy.test.mjs`
- `app/tests/policyGates.test.mjs`

Commands that passed after remediation:

```powershell
cd server
npm.cmd run build
npm.cmd test -- zzExportPrivacy.test.mjs

cd app
npm.cmd run build
npm.cmd test -- policyGates.test.mjs

node docs\qc\adverse-user-rehearsal\run_adverse_user_rehearsal_local.mjs
```

## Current Rerun Defect Counts

| Severity | Count | Status |
| --- | ---: | --- |
| P0 | 0 | None open |
| P1 | 0 | None open |
| P2 | 2 | Open conditions |
| P3 | 0 | None open |

## Not A Defect By Itself

The system does not automatically classify or moderate all abusive content. That is acceptable for controlled synthetic MVP testing because the rehearsal showed containment and governance controls:

- Content did not execute as script.
- Formula-like content was neutralized in exports after remediation.
- Content was not automatically amplified into participant-facing items or reports.
- Study Owner can revoke an invitation.
- Participant can self-withdraw.
- De-identified exports had zero privacy failures.
