# Phase 1 Pilot Package Templates (Real-World Review Draft)

Status: Draft template set for Phase 1 pilot preparation and review.

Governance authority:
- Ethical Governance Charter for Delphi Commons (primary authority).
- AI Governance & Human-in-the-Loop Thin Spec (subordinate governance for AI-enabled features).

Important notice:
- These templates are implementation aids only.
- These templates are **not** legal advice, **not** IRB approval, and **not** institutional approval.
- Study owners must adapt each template for local law, institutional policy, ethics board requirements, and protocol-specific risk profile.

---

## 1) Participant Information Sheet Template

Use plain language at an accessible reading level.

### 1.1 Study identity and purpose
- Study title: `[Insert study title]`
- Protocol/version: `[Insert protocol name and version/date]`
- Study owner / principal investigator: `[Insert name, role, organization]`
- Contact email/phone: `[Insert contact details]`
- Purpose of the study:
  - `[Describe why the study is being conducted]`
  - `[Explain why a Delphi/eDelphi method is being used]`

### 1.2 Why the participant was invited
- You are invited because: `[Insert inclusion rationale]`
- Participation is voluntary. Choosing not to participate will `[state impact/no impact]`.

### 1.3 What participation involves
- Anticipated rounds: `[Insert number or range]`
- Estimated time per round: `[Insert estimate]`
- Total estimated commitment: `[Insert total estimate]`
- Activities may include:
  - open-text responses
  - item review and rating
  - optional feedback review between rounds

### 1.4 Foreseeable risks and burdens
- Potential risks include: `[Insert social/professional/psychological/time risks relevant to protocol]`
- Burdens include: `[Insert expected burden and mitigation]`
- There may be limits to confidentiality/anonymity in small panels (see section 3).

### 1.5 Potential benefits
- Direct personal benefit: `[state if none/uncertain]`
- Broader study benefit: `[Insert expected contribution]`

### 1.6 Data handling summary
- Data types collected: `[Insert list]`
- Identity and response data handling: `[Describe separation/pseudonymization approach]`
- Access controls: `[Describe who may access what and under what role constraints]`
- Retention/deletion approach: `[Summarize; detail in section 5]`

### 1.7 Participant rights summary
- Participation is voluntary.
- You may withdraw from future participation at any time.
- Prior submitted responses may remain in already aggregated, versioned, historical, or audit-linked records where removal is not feasible or would compromise study integrity.
- You may request review of deletion options where feasible and policy-permitted.

---

## 2) Consent Language Template

### 2.1 Consent statement
I confirm that:
1. I have read and understood the participant information for `[Study Title]` (protocol `[Version]`).
2. I understand participation is voluntary and I may withdraw from future participation at any time.
3. I understand confidentiality and anonymity limits have been explained, including that small-panel or specialized-domain participation may increase re-identification risk.
4. I understand prior submitted responses may remain in historical, aggregated, audit, or regulatory records according to protocol, governance rules, and feasibility limits.
5. I understand how retention and deletion requests are handled for this study.
6. I understand AI disclosure language for this study (including whether No External AI mode is active).
7. I know how to contact the study team and how to escalate concerns.
8. I consent to participate in this study.

- Participant name or pseudonym: `[Insert]`
- Date/time consent recorded: `[Insert]`
- Consent version ID/text version: `[Insert]`

### 2.2 Optional communication consent (if used)
- I consent to receive study notifications through: `[email / SMS / both / none]`
- I understand I can update communication preferences as allowed by study policy.

---

## 3) Confidentiality and Anonymity Limits Template

Use truthful, non-overpromising language.

Suggested wording:

- Your responses are treated as confidential within the approved study team and governance roles.
- We apply role-based access controls and data-separation safeguards to reduce identity exposure.
- In Delphi processes, responses may be summarized, quoted, or transformed into candidate statements for later rounds.
- We do **not** promise absolute anonymity.
- Re-identification risk can increase in small panels, narrow specialties, unique experiences, or when participants disclose identifying details.
- Where feasible, direct identifiers are excluded from analysis-facing datasets and external processing payloads.
- If required by law, policy, safety duty, or approved governance process, limited disclosure may occur.

Protocol-specific inserts:
- Additional confidentiality boundaries: `[Insert]`
- Cross-institution sharing conditions (if any): `[Insert]`
- Export/reporting disclosure constraints: `[Insert]`

---

## 4) Withdrawal and Deletion Explanation Template

Suggested wording:

- Participation is voluntary.
- You may withdraw from future rounds/tasks at any time without penalty unless explicitly stated by a lawful institutional requirement.
- Withdrawal stops new participation but does not automatically erase prior submitted content.
- Prior submissions may remain in historical snapshots, aggregate statistics, audit logs, method-trace records, and already generated reports where deletion is infeasible or would reduce methodological integrity.
- You may submit a deletion request for review by the study owner/data custodian.
- Deletion outcomes depend on feasibility, legal/policy obligations, safety/regulatory requirements, and whether records are already embedded in aggregate or immutable audit evidence.

Operational fields:
- Withdrawal pathway: `[portal action / email / phone / other]`
- Deletion request pathway: `[insert route]`
- Review SLA target: `[insert timeframe]`
- Decision authority: `[study owner + data custodian + governance role]`

---

## 5) Retention Explanation Template

Suggested wording:

- Study records are retained according to protocol-defined retention windows and applicable institutional/legal requirements.
- Different record classes may have different retention periods (for example: contact data, consent records, response content, audit logs, and exported reporting artifacts).
- At retention end, records are deleted, de-identified, archived, or otherwise handled according to approved policy.
- Some records may require longer retention for legal, regulatory, security, or scientific integrity reasons.

Retention schedule table (complete per protocol):

| Record class | Example contents | Retention period | Deletion/de-identification method | Owner role |
|---|---|---|---|---|
| Identity/contact | names, email, phone | `[Insert]` | `[Insert]` | `[Insert]` |
| Consent | consent version + timestamp | `[Insert]` | `[Insert]` | `[Insert]` |
| Responses/ratings | round submissions | `[Insert]` | `[Insert]` | `[Insert]` |
| Audit log | governance/action events | `[Insert]` | `[Insert]` | `[Insert]` |
| Exports/reports | outputs for review/reporting | `[Insert]` | `[Insert]` | `[Insert]` |

---

## 6) AI Disclosure / No External AI Disclosure Template

This section must match the study’s configured AI mode and actual operating controls.

### 6.1 Core disclosure (all studies)
- AI assistance, if enabled, is optional and non-directive.
- Human study leadership remains responsible for method, interpretation, and final decisions.
- AI outputs may be incomplete or incorrect and must be reviewed before use.

### 6.2 No External AI mode disclosure (when active)
Suggested wording:
- This study is currently in **No External AI** mode.
- In this mode, study data is not sent by this platform configuration to external AI providers.
- If local deterministic helper features are enabled, they operate within the configured internal controls.

### 6.3 External AI enabled disclosure (when active)
Suggested wording:
- This study may use approved external AI services for limited support tasks.
- External processing must exclude direct participant identifiers and other prohibited data classes according to governance policy.
- AI usage is logged and subject to study-level review and human approval controls.

Protocol-specific AI fields:
- Mode at launch: `[No External AI / External AI enabled]`
- Permitted AI tasks: `[Insert]`
- Prohibited AI tasks: `[Insert]`
- Participant-facing explanation location: `[Insert]`

---

## 7) Support Contact and Issue Escalation Template

### 7.1 Participant support contact
- Primary support contact: `[Insert name/role]`
- Support email: `[Insert]`
- Support phone: `[Insert]`
- Support hours/time zone: `[Insert]`
- Recommended issue report content: `[what happened, when, and screenshot if appropriate; avoid sensitive details unless required]`

### 7.2 Escalation route
- Step 1: Study team support triage within `[timeframe]`
- Step 2: Escalate unresolved privacy/safety/governance issues to `[Data Custodian / Privacy Lead / Ethics Lead]`
- Step 3: Escalate unresolved critical concerns to institutional channel `[IRB/ethics office/compliance channel as applicable]`

### 7.3 Urgent risk or safety language
- If there is immediate risk of harm, participants should contact local emergency services first and then notify the study team when safe to do so.

---

## 8) Study-Owner Adaptation Checklist (Protocol-Specific)

Complete before participant-facing release.

### 8.1 Protocol alignment
- [ ] Insert protocol name, version, and date in all sections.
- [ ] Confirm method description matches actual round design.
- [ ] Confirm time commitment and burden statements match planned workflow.

### 8.2 Rights, confidentiality, and consent integrity
- [ ] Verify confidentiality language is truthful and does not promise absolute anonymity.
- [ ] Verify withdrawal language distinguishes future participation stop vs. prior-data feasibility constraints.
- [ ] Verify deletion request process and decision authority are accurate.
- [ ] Verify consent versioning and activation process are defined.

### 8.3 Retention and data governance
- [ ] Fill retention schedule by record class.
- [ ] Validate retention windows against policy/legal requirements.
- [ ] Confirm owner roles for each record class.
- [ ] Confirm cross-border/storage/export constraints if applicable.

### 8.4 AI governance alignment
- [ ] Confirm participant text matches actual AI mode at launch.
- [ ] If No External AI mode is active, ensure all participant language reflects that status.
- [ ] If external AI is enabled, verify prohibited data classes are excluded and human approval controls are active.
- [ ] Confirm AI-related disclosures are included in participant information and consent language.

### 8.5 Contact and escalation readiness
- [ ] Verify active support mailbox/phone and response SLA.
- [ ] Verify named escalation roles and institutional route.
- [ ] Verify participant-facing instructions for technical and privacy issues.

### 8.6 Governance signoff checkpoint
- [ ] Reviewed for alignment with Ethical Governance Charter.
- [ ] Reviewed for alignment with AI Governance & Human-in-the-Loop Thin Spec.
- [ ] Reviewed by designated study governance roles.
- [ ] Marked as protocol-specific draft pending institutional/legal/IRB review where required.

---

## 9) Non-Approval Disclaimer Block (Include in participant-facing packet footer)

Suggested footer text:

> Template origin: Delphi Commons Phase 1 pilot package templates. This packet has been adapted for protocol `[Insert]`. This material is provided for study operations and governance alignment and does not itself constitute legal advice, IRB approval, ethics-board approval, or institutional approval.

