# Suspected Data Exposure / Security Incident Escalation Workflow

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

Status: COMPLETE as a documented workflow. Phase 10 escalation drill: NOT RUN.
Incident/escalation readiness remains NOT READY until a completed drill artifact exists.

This workflow avoids legal conclusions. Use "suspected data exposure/security incident" until an authorized human determines otherwise.

## Immediate Path

1. Reporter notifies the Study Owner and Security & Privacy Lead privately.
2. Security & Privacy Lead opens a restricted incident note.
3. Study Owner applies pause-study equivalent controls (stop progression/invitations/exports for affected scope) if participant rights or confidentiality may be affected.
4. Data Custodian preserves database, audit, backup, and export evidence.
5. Ethics & Methods Steward assesses consent, disclosure, participant-facing language, and study-integrity implications.
6. Open Source Maintainer coordinates software fix planning if the issue is code-related.

## Severity Guide

| Severity | Trigger examples | Immediate action |
|---|---|---|
| Critical | identity-response mapping exposed; direct identifiers in de-identified export; admin access bypass; malicious script execution | Stop affected activity, preserve evidence, restrict access, escalate immediately. |
| High | audit integrity uncertain; backup restore failure; support-loop privacy uncertainty; external AI boundary unclear | Restrict affected workflow and assign owner. |
| Medium | confusing warning copy; contained unsafe input; incomplete evidence | Document condition and track remediation. |
| Low | polish, documentation clarity, low-risk backlog item | Track in backlog. |

## Notification Decision Points

Authorized humans must decide:

- whether the incident involves real data or only synthetic/low-risk test data;
- whether any participant, institution, maintainer, repository host, or regulator must be notified;
- whether public disclosure is needed;
- whether a security advisory is appropriate;
- whether study activity can resume.

## Required Records

- date/time discovered;
- environment;
- reporter;
- affected system area;
- affected data categories;
- evidence preserved;
- containment steps;
- notification decisions;
- remediation steps;
- retest evidence;
- residual risk.

Phase 10 suspected incident drill: NOT RUN.
