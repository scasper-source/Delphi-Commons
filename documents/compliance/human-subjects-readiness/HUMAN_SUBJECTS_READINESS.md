# Human Subjects Readiness Plan

**Project:** eDelphi  
**Status:** Phase 1 readiness requirements baseline  
**Last updated:** 2026-05-02  
**Release target:** Human-subjects-ready release candidate, not merely demo-ready software

This document defines what must be true before eDelphi is used for a real study involving human participants. It is a product, engineering, governance, security, and methods readiness plan. It is not legal advice, IRB approval, or institutional compliance certification.

## Readiness Standard

The platform is human-subjects ready only when it can support a complete Delphi study while preserving participant rights, confidentiality limits, methodological integrity, auditability, and secure access control.

Minimum launch expectations:

- Participants can consent, respond, review submissions, withdraw from future participation, and understand confidentiality limits.
- Study teams cannot bypass required governance signoff, locked consensus rules, round state transitions, AI gates, or export review.
- Identity data and response data remain separated in the data model and user interface.
- AI is a drafting and organizing assistant only; all AI outputs remain traceable and human-approved before use.
- Reports and exports preserve uncertainty, dissent, non-consensus findings, attrition, limitations, and the required consensus-not-correctness statement.
- Sensitive actions are logged in an append-only, integrity-checkable audit trail.
- The system has production-grade authentication, authorization, backup, recovery, accessibility, and incident response procedures.

## Reference Baseline

Readiness should be assessed against these external and internal references:

- HHS/OHRP 45 CFR 46 human-subjects protections, including informed consent and IRB expectations where applicable.
- Belmont-style principles: respect for persons, beneficence, and justice.
- WCAG 2.2 AA for participant-facing and staff-facing accessibility.
- OWASP ASVS and OWASP Top 10 for web application security verification.
- NIST Cybersecurity Framework 2.0 for governance, identification, protection, detection, response, and recovery.
- HIPAA Security Rule style safeguards when studies may involve ePHI or institutionally regulated health information.
- `documents/governance/ethical-governance-charter.md`.
- `documents/governance/ai-assistance-thin-spec.md`.
- `documents/compliance/definition-of-done.md`.
- `documents/compliance/ethics-compliance-checklist.md`.

## Deliverables In This Phase

| Deliverable | Location | Purpose |
|---|---|---|
| Human Subjects Readiness Plan | `HUMAN_SUBJECTS_READINESS.md` | Defines the readiness standard and workstream structure. |
| Control Matrix | `control-matrix.md` | Maps requirements to implementation, tests, evidence, status, and launch gaps. |
| Test Evidence Checklist | `test-evidence-checklist.md` | Lists automated/manual evidence required before release. |
| Release Blockers | `release-blockers.md` | Tracks conditions that block human-subjects launch. |

## Readiness Status Categories

Use these consistently in the matrix:

- **Implemented:** Code exists and is covered by current tests or documented manual evidence.
- **Partial:** Some implementation exists, but launch-grade coverage, policy, UX, or evidence is missing.
- **Not Started:** No meaningful implementation yet.
- **Blocked:** Cannot be completed until another workstream lands.
- **Needs External Review:** Requires institutional, legal, IRB, security, or accessibility review outside ordinary engineering review.

## Workstreams

### 1. Consent, Withdrawal, Confidentiality, Retention

Required outcome: participant rights are clear, versioned, enforced, and auditable.

Current foundation:

- Consent versions, activation, consent records, and withdrawal are implemented in backend routes/stores.
- Participant portal displays consent/confidentiality language and blocks submission without consent.
- Withdrawal blocks future submissions.

Launch gap:

- Retention/deletion workflows need production policy enforcement and export evidence.
- Participant language needs formal plain-language and accessibility review.
- Withdrawal effects need a final user-facing explanation and reviewer workflow.

### 2. Governance Signoffs And Locked Consensus Rules

Required outcome: study launch and method rules cannot be casually bypassed.

Current foundation:

- Study version signoffs and activation gates exist.
- Consensus rule is required before Round 1 and locked against mid-study edits.
- Governance summary is produced from the Study Builder.

Launch gap:

- Production role membership must replace demo/local role assumptions.
- Correction/versioning workflow for exceptional governance changes must be explicit.

### 3. Round Lifecycle And Participant Task Integrity

Required outcome: each round opens, closes, and produces participant tasks only when the protocol allows it.

Current foundation:

- Round 1 open-text collection, later structured judgment rounds, Round 3/4 support, and close/open transitions exist.
- Closed Round 1 setup locks in the UI.
- Participant Round 2+ task now uses verbal structured judgment choices while preserving coded values for analysis.

Launch gap:

- Full dry-run evidence is needed across Classic and Modified Delphi designs.
- Reminder/deadline handling needs production scheduling and neutral-message review.

### 4. AI Governance And Provenance

Required outcome: AI cannot decide, persuade, publish, erase dissent, or obscure provenance.

Current foundation:

- AI suggestions are stored, labeled, decision-gated, and audited.
- Curation items include provenance foundations, merge/split rationale, and publication gates.
- AI-assisted IRB/export drafts have governed package foundations.

Launch gap:

- Provenance graph and transformation history need stronger export/test coverage.
- External AI connector policy must be explicit before any external connector is enabled.
- AI data minimization tests need expansion.

### 5. Identity/Response Separation

Required outcome: identity data is separated from response data, and identity access is privileged and audited.

Current foundation:

- Participant master data and response stores are separated.
- Backend tests cover unauthorized identity access and audit logging.
- Participant invitation links avoid ordinary participant accounts/API keys.

Launch gap:

- Production authentication, session management, study membership, and admin role review are launch blockers.
- Encryption-at-rest/deployment secrets policy must be specified for production.

### 6. Audit Logging And Export Logging

Required outcome: sensitive actions are append-only, integrity-checkable, reviewable, and exportable.

Current foundation:

- Audit events are written for major lifecycle actions.
- Audit integrity verification exists.
- Export package creation, review, and download are audit logged.

Launch gap:

- Audit event taxonomy should be finalized.
- Incident and correction events need first-class workflows.
- Audit package export needs final review coverage.

### 7. Accessibility

Required outcome: study teams and participants can use the system across devices and assistive technologies.

Current foundation:

- UI uses semantic form controls, labels, keyboard-compatible inputs, and responsive layouts.
- Participant portal is simplified and mobile-oriented.

Launch gap:

- WCAG 2.2 AA audit is not complete.
- Automated accessibility tests and manual screen reader/keyboard evidence are not yet recorded.

### 8. Security Controls

Required outcome: the system is hardened for sensitive human-subjects research data.

Current foundation:

- Backend-enforced role gates exist for many endpoints.
- Data separation, audit logging, and export permission gates exist.
- Server tests cover several access-control and governance failures.

Launch gap:

- Production auth/session security, CSRF strategy, rate limits, security headers, dependency scanning, token expiry/revocation, and secrets handling must be completed.
- OWASP ASVS evidence is not yet complete.

### 9. Backup/Recovery

Required outcome: data can be backed up, restored, and verified without breaking audit integrity.

Current foundation:

- Persistent stores and database foundations exist.
- Audit integrity checks exist.

Launch gap:

- Backup, restore, migration rollback, disaster recovery, and rehearsal evidence are not complete.

### 10. Incident Response

Required outcome: the team can pause, investigate, document, notify, and recover from confidentiality, data integrity, or participant-rights incidents.

Current foundation:

- Audit log provides event history.
- Archive behavior preserves records and audit history.

Launch gap:

- Incident workflow, pause-study state, notification templates, severity criteria, and response runbook are not complete.

### 11. IRB/Export Package Evidence

Required outcome: study teams can produce clear, reviewable evidence for IRB/ethics review, downstream users, methodological audit, and reproducible analysis.

Current foundation:

- Final report package architecture, export manifests, Office renderers, package review, and download controls exist.
- IRB pack AI drafting foundation exists.

Launch gap:

- All package types must be completed: Final Delphi Report, IRB/Ethics Pack, Anonymized Response Dataset, Audit Package, Provenance Bundle, Complete Locked Archive.
- Redaction controls and import of IRB decision metadata need implementation.

## Phase 1 Exit Criteria

Phase 1 is complete when:

- The control matrix exists and covers all readiness domains.
- Every row has an owner-ready status, implementation reference, expected evidence, and launch gap.
- Test evidence checklist identifies automated, manual, security, accessibility, and operational evidence.
- Release blocker list identifies P0 blockers and gives the next engineering workstream.
- Existing implementation is not overstated: partial items remain marked partial.

## Next Phase Recommendation

After Phase 1, the next build phase should be:

**Phase 2: Production Authentication, Authorization, And Membership**

Reason: most remaining human-subjects readiness controls depend on reliable identity, session, membership, and backend-enforced role boundaries.
