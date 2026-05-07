# Phase 1 Auth/Session/Membership/Role-Review Hardening (Mock-Trail Boundary)

Date: 2026-05-07.

## What was hardened

- Session-gated auth is now treated as required for production behavior (`EDELPHI_AUTH_REQUIRE_SESSION=true` or `NODE_ENV=production`), preventing privileged legacy header-only access paths.
- Study membership assignment/removal remains backend-enforced through study-scoped roles (`Owner`, `MethodsSteward`, `PrivacyLead`, `DataCustodian`, `Maintainer`) resolved per request.
- Role boundaries remain backend-enforced even when clients send `x-user-role`; only currently assigned study roles are accepted.
- Role downgrade/removal causes immediate access loss because request-time role resolution reads current assignment state.
- Audit logging for privileged membership changes remains explicit via `study.assignment.upsert` and `study.assignment.remove` events.

## Evidence and tests

- New test: `server/tests/authPhase1Hardening.test.mjs`.
- Test assertions cover:
  - unauthorized legacy-header access blocked when session is required,
  - unauthorized role manipulation blocked,
  - immediate post-removal access loss,
  - audit evidence for privileged membership changes.

## Boundary and non-claims

This Phase 1 hardening evidence is for controlled engineering readiness work only.

It does **not** claim:
- pilot readiness,
- production readiness,
- real human-subjects readiness,
- IRB/legal/security/accessibility certification.
