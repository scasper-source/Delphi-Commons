\# Definition of Done (DoD)

\*\*Project:\*\* eDelphi  

\*\*Scope:\*\* This DoD is mandatory for any work that touches: study design, rounds, participant experience, consent, identity/confidentiality, AI assistance, analysis/feedback, exports/reports, audit logging, permissions, or deployment.



If a ticket cannot satisfy this DoD, it is not “done” and must not ship.



---



\## 1) Universal Done Criteria (all features)

A feature is Done only when all of the following are true:



\### Product behavior

\- The feature behaves correctly for the happy path \*\*and\*\* the main edge cases.

\- It fails safely (clear error, no partial writes, no silent data loss).

\- User-facing text is clear, neutral, and avoids coercive language.



\### Documentation

\- Any new behavior is documented in the appropriate place (`documents/…`), including user-visible behavior and governance impacts.

\- If the change affects governance/ethics, the \*\*Ethics Compliance Checklist\*\* is updated (new rows added or existing rows marked satisfied).



\### Observability

\- The feature produces meaningful logs/telemetry (at minimum: error logs and key lifecycle events).

\- Any participant-facing or governance-relevant action generates an \*\*audit event\*\* (see §3).



---



\## 2) Required Reviews (who must sign off)

\### Standard features

\- At least one reviewer approves (or the designated maintainer if solo).



\### High-risk / governance-sensitive features

Any change touching \*\*consent, identity, access control, AI, feedback, exports, audit log, or threshold locking\*\* requires explicit signoff by:

\- \*\*Study Owner\*\* (product intent), and

\- \*\*Ethics \& Methods Steward\*\* (method + safety intent)



(If you’re solo, record this signoff as an explicit checklist item in the PR/commit message.)



---



\## 3) Audit Log Requirements (when it must exist)

For any of the following, an immutable audit log entry \*\*must\*\* be written:



\- Study creation, configuration edits, and StudyVersion creation

\- Consent version creation/activation

\- Panel invitations sent / reminders sent (without leaking identities to other roles)

\- Round open/close, deadline changes, and instrument publication

\- Any change to participant-facing prompts/items/feedback configuration

\- Any export/report generation

\- Any AI suggestion generation \*\*and\*\* the human decision (Accept/Edit/Reject)

\- Any identity store access by a privileged role



\*\*Done means:\*\* you can point to the audit event(s) produced by the feature and show they contain the required fields (timestamp, actor, role, action, object IDs, version IDs).



---



\## 4) Consent + Confidentiality Done Criteria

For features that touch consent/confidentiality:



\- Consent is \*\*explicit\*\*, \*\*versioned\*\*, and \*\*exportable\*\*.

\- Participant materials use \*\*truthful anonymity language\*\* (e.g., they may be anonymous to one another, but responses are linked by the study team across rounds).

\- Withdrawal/deletion rules are implemented as configured and are accurately described to participants.

\- No participant identity is exposed to panelists or unauthorized roles.



\*\*Done means:\*\* a new study can be configured, consent versioned, and the correct consent text is shown + exported with version ID and timestamps.



---



\## 5) Rounds + Consensus Rules Done Criteria

For features touching rounds, consensus, or feedback:



\- The \*\*consensus rule is defined before Round 1 opens\*\* and is \*\*locked\*\* once Round 1 is opened.

\- Any attempt to change locked settings results in either:

&nbsp; - a blocked action, or

&nbsp; - creation of a \*\*new StudyVersion\*\* (with clear version provenance).

\- Feedback shown to participants is \*\*neutral\*\* (statistics/distributions) and does not pressure convergence.

\- Reports/exports \*\*preserve non-consensus\*\* results (dissent remains visible).



\*\*Done means:\*\* tests confirm you cannot alter the consensus rule midstream without the correct versioning behavior, and exports still contain non-consensus outputs.



---



\## 6) AI Assistance Done Criteria

For any feature that invokes AI or displays AI outputs:



\### Human-in-the-loop gating

\- AI output is always labeled \*\*“AI Suggestion”\*\* (not final).

\- Nothing AI-generated becomes participant-facing without explicit human action: \*\*Accept / Edit / Reject\*\*.

\- Participant-facing AI-influenced content requires the configured signoffs (default: Study Owner + Ethics \& Methods Steward).



\### Safety constraints

\- AI is not used to persuade panelists, optimize consensus, or drop dissent.

\- AI transformations (clustering/merging/rewording) are reviewable and reversible.



\### Traceability

\- Each AI suggestion has provenance:

&nbsp; - what inputs it used (IDs/hashes; not necessarily raw text),

&nbsp; - model identifier/version,

&nbsp; - prompt/template version,

&nbsp; - output stored (or hashed) and linked to the resulting human-approved content.

\- The audit log records both: the AI output and the human decision.



\*\*Done means:\*\* a reviewer can reproduce what the AI suggested (or verify via stored output), see who approved it, and confirm nothing auto-published.



---



\## 7) Identity Separation + Access Control Done Criteria

For features touching participant identity or access control:



\- Identity data and response data remain separated (logical or physical separation as designed).

\- Roles/permissions enforce least privilege.

\- No endpoint returns identity information unless the caller has explicit permission.

\- Any privileged identity access is audited.



\*\*Done means:\*\* permission tests cover “allowed” and “forbidden” access paths, and identity leaks are not possible through normal UI/API flows.



---



\## 8) Export / Reporting Done Criteria

For features touching exports or reports:



\- Exports are \*\*reproducible\*\*: include StudyVersion, instrument version, consensus rule definition, dates, and relevant configuration.

\- Exports include \*\*non-consensus\*\* items and distributions/dispersion as configured.

\- Export generation is audited (who exported, what, when, which version).



\*\*Done means:\*\* you can export twice and get the same results for the same StudyVersion and dataset (or documented reasons for differences, e.g., new responses).



---



\## 9) Testing Requirements

A feature is not Done unless:



\- It has automated tests appropriate to its risk:

&nbsp; - unit tests for logic,

&nbsp; - integration tests for role gating + versioning + audit events,

&nbsp; - regression tests for any previously-fixed bugs it touches.

\- “Rails” are covered by tests for sensitive areas (consent, locking, audit, AI gating, non-consensus export).



\*\*Minimum bar for sensitive features:\*\* at least one test proving the rail cannot be bypassed.



---



\## 10) Release Readiness (when something can ship)

A change is release-ready only when:



\- All tests pass.

\- Compliance checklist rows affected by the change are updated.

\- Any migration steps are documented (if schema/config changes).

\- No participant-facing text introduces coercion, deception, or privacy ambiguity.

\- A release note entry exists if behavior changes.



---



\## 11) Quick “Done” Checklist (copy into PR/ticket)

\- \[ ] Acceptance criteria met (happy path + key edge cases)

\- \[ ] Compliance checklist updated (if governance-sensitive)

\- \[ ] Required signoffs recorded (if governance-sensitive)

\- \[ ] Audit log events emitted for relevant actions

\- \[ ] Consent/anonymity language truthful and versioned (if applicable)

\- \[ ] Consensus rule locking + non-consensus reporting preserved (if applicable)

\- \[ ] AI is proposal-only; explicit Accept/Edit/Reject; fully audited (if applicable)

\- \[ ] Tests added/updated and passing

\- \[ ] Export reproducibility verified (if applicable)

\- \[ ] Docs updated (user-facing + developer-facing)

