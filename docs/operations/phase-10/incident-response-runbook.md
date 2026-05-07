# Incident Response Runbook

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

Status: COMPLETE as a documented procedure. Phase 10 incident drill: NOT RUN. Dedicated incident-record workflow was not found in source.
Incident-response readiness remains NOT READY until a completed incident drill artifact is recorded.

Use the term "suspected data exposure/security incident" until an authorized human determines legal or institutional classification.

## Roles

- Study Owner: pauses study activity and coordinates participant-facing decisions.
- Ethics & Methods Steward: assesses participant-rights, consent, and methodological implications.
- Security & Privacy Lead: leads triage, containment, evidence preservation, and security decisions.
- Data Custodian: protects database, audit, backup, export, and retention artifacts.
- Open Source Maintainer: coordinates code fixes and disclosure for software vulnerabilities.

## Triage

1. Record reporter, timestamp, environment, affected study/version, and summary.
2. Classify suspected impact:
   - participant rights or consent;
   - identity/response separation;
   - export privacy;
   - auth/session/RBAC;
   - audit integrity;
   - AI governance;
   - availability or data loss;
   - open-source vulnerability.
3. Confirm whether any real participant or sensitive data is involved. If yes, stop using these non-production runbooks as sufficient authority and escalate to authorized institutional/legal channels.

## Containment

1. Stop relevant synthetic study activity if needed (pause-study equivalent when no dedicated pause-state flag exists).
2. Disable affected user/session through admin user controls where appropriate.
3. Revoke sessions where available.
4. Stop export sharing and preserve generated packages.
5. If a backup may be needed, create one before destructive cleanup.
6. Do not delete logs, audit files, exports, or database evidence unless instructed by authorized incident leadership.

## Preserve Evidence

Preserve:

- commit hash and branch;
- command history used for the rehearsal;
- backend health response;
- database path and backup manifest if created;
- audit integrity result;
- data integrity result;
- export manifests and privacy classifications;
- screenshots or browser transcripts if safe;
- relevant logs without secrets or unnecessary direct identifiers.

## Escalation and Notification Decision Points

Escalate to Security & Privacy Lead and Ethics & Methods Steward if the suspected issue touches:

- identity-response mapping;
- consent, withdrawal, or voluntariness;
- participant-facing coercive language;
- export privacy;
- AI publication or external AI boundary;
- auth/session/RBAC;
- audit integrity or backup/restore;
- any real or sensitive data.

Notification decisions must be made by authorized humans. This runbook does not make legal determinations.

## Remediation

1. Open a defect with severity and scope.
2. Apply the smallest safe fix if the issue is directly scoped and understood.
3. Add or update regression tests where feasible.
4. Regenerate affected export packages if export behavior changed.
5. Rerun the relevant checks.
6. Update QC/readiness docs with what was actually tested.

## Post-Incident Review

Record:

- root cause;
- affected roles and artifacts;
- participant or study impact;
- whether identity separation held;
- whether exports remained privacy-safe;
- what was fixed;
- what remains deferred;
- whether operational runbooks or tests changed.

Phase 10 incident response drill: NOT RUN.
