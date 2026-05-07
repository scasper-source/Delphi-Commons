# Phase 1 Incident Workflow (`mock_trial` track)

Date: 2026-05-07.

## Boundary

This workflow is documentation/evidence guidance for controlled synthetic or low-risk mock-trial environments.  
It does **not** claim incident-response readiness, production readiness, security certification, or human-subjects readiness.

Incident-response readiness remains **NOT READY** until at least one incident drill artifact exists and is linked.

## 1) Pause-study state (implemented equivalent)

Current equivalent to a dedicated pause-state flag:

- stop round progression actions by Study Owner/Methods Steward,
- stop invitation issuance/re-issuance,
- stop export sharing and package distribution,
- halt participant support actions that could mutate study state.

Because a dedicated global `paused` study flag is not yet implemented, this checklist must record exactly which operations were suspended and by whom.

## 2) Incident record requirements

For each suspected incident, create an incident record containing:

- incident ID,
- discovered-at timestamp (UTC),
- reporter,
- environment and deployment label,
- commit hash/branch,
- affected study/version,
- affected role(s),
- suspected data classes exposed or at risk,
- containment actions,
- notification decision log,
- remediation and recovery status,
- residual risks.

## 3) Severity classification

Use the Phase 10 severity guide and record explicit rationale:

- **Critical**: identity-response mapping exposure, direct identifiers in de-identified exports, admin/session bypass, active execution/XSS.
- **High**: audit-integrity uncertainty, restore failure, export privacy uncertainty, external-AI boundary uncertainty.
- **Medium**: contained but meaningful risk requiring remediation tracking.
- **Low**: documentation/polish with low immediate participant-risk impact.

## 4) Suspected breach / data exposure workflow

1. Open restricted incident note and assign incident owner.
2. Trigger pause-study equivalent controls (Section 1).
3. Data Custodian preserves database/audit/backup/export evidence.
4. Security & Privacy Lead classifies severity.
5. Ethics & Methods Steward evaluates participant-rights/consent implications.
6. Decide notifications through authorized humans only (no automatic legal conclusion).
7. Record final classification and recovery decision.

## 5) Participant/staff notification templates

Use controlled, non-legal wording drafts until authorized reviewers approve:

### Participant-facing draft template

> We are reviewing a potential study-data handling issue in this mock-trial environment.  
> We paused relevant study activity while we verify scope and safety.  
> We will share what we confirm, what actions were taken, and any changes that affect your participation options.

### Staff-facing draft template

> A suspected incident has been opened under Incident ID `<id>`.  
> Containment is active. Do not proceed with round progression, invitations, or export sharing for affected scope until incident owner clearance is recorded.

## 6) Remediation and recovery status model

Track one status at a time:

- `open` -> incident identified, containment not complete.
- `contained` -> immediate risk path halted.
- `remediating` -> fix in progress.
- `retesting` -> fix validation in progress.
- `recovered_with_conditions` -> services resumed with known residual risks.
- `closed` -> owner-approved closure with residual-risk entry.

## 7) Audit events and evidence expectations

Until dedicated incident event routes exist, use existing audit and ops evidence:

- evidence of role actions (auth/session/assignment/deletion/export operations),
- backup manifest + restore records where used,
- audit-integrity verification output,
- command transcript and commit references.

Gap to close: add explicit incident-specific audit events (for create/classify/contain/notify/close) in a follow-up work packet.

## 8) Incident drill artifact template

Use: `docs/operations/production-readiness/templates/PHASE1_INCIDENT_DRILL_ARTIFACT_TEMPLATE.md`.

Minimum completion criteria:

- pause-study equivalent actions recorded,
- incident record completed,
- severity rationale recorded,
- notification drafts and decision path recorded,
- remediation/recovery status progression recorded,
- post-restore audit-integrity verification recorded if restore involved,
- residual risks and follow-up owner assigned.
