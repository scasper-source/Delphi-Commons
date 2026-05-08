# Phase 1 Deployment/Security Evidence Checklist (Mock-Trial Track)

Date: 2026-05-07  
Track scope: `mock_trial` engineering hardening evidence only.

> This checklist maps current controls and tests to deployment/security evidence categories. It does **not** claim pilot readiness, production readiness, or security certification.

## Status key

- **MAPPED**: control exists and at least one code/test/doc evidence source is linked.
- **PARTIAL**: control exists, but deployment-specific or repeatable evidence is incomplete.
- **MISSING EVIDENCE**: expected evidence artifact/check is not yet present.

## Checklist

| Area | Current control mapping | Existing evidence links | Status | Missing evidence / gap |
| --- | --- | --- | --- | --- |
| Secrets management | Runtime config via env vars; no wildcard CORS; secure-cookie mode derivation; SMS webhook secret support. | `server/src/core/config.ts`; `.env.example`; `docs/operations/production-readiness/PRODUCTION_READY_EDELPHI_PLATFORM.md` | PARTIAL | No deployment-specific secret inventory, rotation cadence, key ownership matrix, or secret-scan artifact tied to commit/environment. |
| TLS / reverse proxy | Security model expects TLS at deployment edge; HSTS is emitted in production mode. | `server/src/core/security.ts` (`Strict-Transport-Security`); production-readiness platform doc security/deployment requirements. | PARTIAL | No reverse-proxy config snapshots (nginx/Caddy/cloud LB), certificate automation evidence, or TLS validation transcript tied to a deployment. |
| Secure cookies / session-required mode | Session and CSRF cookies support `Secure`; session-required behavior hardened for production/session-required mode. | `server/src/core/security.ts` cookie builders; `server/src/middleware/auth.ts`; `server/tests/authPhase1Hardening.test.mjs`. | MAPPED | Need deployment proof that session-required mode is active in target environment and no legacy-header path is reachable externally. |
| CORS | Explicit allowlist (`EDELPHI_ALLOWED_ORIGINS`), wildcard disallowed, origin enforcement with credentialed requests. | `server/src/core/config.ts` + `server/src/core/security.ts`. | PARTIAL | No environment-specific allowlist evidence or negative-origin integration test artifact captured for release evidence binder. |
| CSRF | Mutation requests with session cookie require matching CSRF header/token pair (with defined exemptions). | `server/src/core/security.ts`; auth login flow in `server/src/routes/auth.ts` issues CSRF token/cookie. | PARTIAL | No deployment smoke evidence demonstrating CSRF rejection/acceptance against deployed reverse-proxy origin topology. |
| Rate limits | Auth rate limiter and global mutation/invitation rate-limits with Retry-After responses. | `server/src/core/security.ts`; `server/src/routes/auth.ts`; existing road tests and auth-focused tests. | PARTIAL | No stress/load evidence for tuned thresholds, no alert thresholds defined for rate-limit anomaly behavior. |
| Security headers | Response hook sets CSP, frame protections, no-sniff, no-store, COOP/CORP, permissions policy; HSTS in prod. | `server/src/core/security.ts`. | PARTIAL | No automated response-header contract test for production profile and no deployment capture proving headers survive reverse proxy/CDN. |
| Dependency / security audit | `npm run security:audit` scripts exist (app/server). | `server/package.json`; `app/package.json`; production-readiness platform doc CI target. | PARTIAL | Missing commit-attached audit output artifact and vulnerability triage log with owner/severity/SLA. |
| Monitoring / logging | Audit event pipeline and append-only audit protections; health endpoint and audit integrity checks exist in test workflows. | `server/src/core/audit.ts`; `server/src/core/database.ts`; `server/tests/roadtest.test.mjs`; production-readiness doc. | PARTIAL | Missing production-like monitoring dashboard/alerts evidence, log retention policy, and incident response drill artifacts. |
| Residual risks | Existing docs already require residual-risk tracking and explicit boundaries for non-production claims. | `docs/operations/production-readiness/PRODUCTION_READY_EDELPHI_PLATFORM.md`; Phase 0/Phase 1 readiness docs. | PARTIAL | Need a single signed residual-risk register entry set tied to this checklist and current commit. |

## Existing test/control map (quick index)

- Session-required and membership/role boundary hardening test: `server/tests/authPhase1Hardening.test.mjs`.
- Core HTTP security controls and enforcement hooks: `server/src/core/security.ts`.
- Auth flow/session issuance and logout handling: `server/src/routes/auth.ts`.
- Deployment/security gate expectations and boundary language: `docs/operations/production-readiness/PRODUCTION_READY_EDELPHI_PLATFORM.md`.

## Codex-ready follow-up work packets

### P1-SEC-WP1 — Deployment secret inventory and rotation evidence
- **Goal:** Produce commit-linked secret-management evidence for a named environment.
- **Tasks:**
  1. Add `docs/operations/production-readiness/evidence/phase1-secrets-<env>-<date>.md` template with secret classes, owners, storage backend, rotation cadence, and last-rotation timestamps.
  2. Add sanitized command transcript for secret presence checks (without revealing values).
  3. Add residual-risk note for any unmanaged secrets.
- **Done when:** checklist row “Secrets management” is upgraded to MAPPED with dated artifact links.

### P1-SEC-WP2 — TLS/reverse-proxy verification pack
- **Goal:** Provide deployment-edge evidence that TLS and forwarded security semantics are correct.
- **Tasks:**
  1. Capture reverse-proxy config snippet (sanitized) and certificate automation path.
  2. Add curl/OpenSSL transcript proving TLS version/cipher baseline and valid chain.
  3. Capture response headers through edge proxy (including HSTS).
- **Done when:** TLS row has environment-bound artifact links and no open P0 config gaps.

### P1-SEC-WP3 — Security header/CORS/CSRF integration smoke suite
- **Goal:** Automate deploy-target security behavior checks.
- **Tasks:**
  1. Add integration script that verifies allowed origin pass + disallowed origin fail.
  2. Add CSRF negative and positive mutation checks using session cookies.
  3. Add response-header assertions (CSP, XFO, HSTS in prod profile).
- **Done when:** script is runnable in CI and outputs a timestamped artifact attached to this checklist.

### P1-SEC-WP4 — Dependency and vulnerability triage evidence
- **Goal:** Convert `npm audit` outputs into actionable, tracked evidence.
- **Tasks:**
  1. Run app/server audit in controlled CI job.
  2. Publish artifact files with commit hash, timestamp, and package-lock hash.
  3. Maintain triage table (severity, exploitability, owner, due date, disposition).
- **Done when:** dependency/security audit row is MAPPED with current artifact and triage log.

### P1-SEC-WP5 — Monitoring/logging and residual risk register
- **Goal:** Establish operational evidence for detection and response readiness.
- **Tasks:**
  1. Document alert rules for auth anomalies, rate-limit spikes, and audit-integrity failures.
  2. Add log retention and access policy summary.
  3. Create residual-risk register snapshot tied to this checklist revision.
- **Done when:** monitoring/logging + residual-risk rows are MAPPED with dated evidence.

## Boundary (explicit non-claims)

This checklist is an engineering evidence organizer for `mock_trial` hardening. It is **not** a claim of:
- production readiness,
- pilot readiness,
- security certification,
- legal or regulatory certification,
- real human-subjects operational authorization.

## 2026-05-08 execution update

- Added repo-verifiable deployment security checks:
  - `server/tests/securityDeploymentChecks.test.mjs` for production HSTS behavior, CSRF enforcement, and CORS allow/deny behavior.
  - `scripts/verify-deployment-security.mjs` for named-environment checklist execution without secret disclosure.
- Added executed evidence artifact: `docs/operations/production-readiness/phase1-evidence-closeout/PHASE1_DEPLOYMENT_SECURITY_EXECUTED_EVIDENCE.md`.
- HSB-P0-001 is materially reduced via executable checks and evidence structure, but still needs named-deployment TLS/proxy/monitoring artifacts for closure.
- HSB-P0-004 remains open pending independent reviewer evidence.
