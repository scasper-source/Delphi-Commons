# Phase 1 Deployment Security Executed Evidence

Date: 2026-05-08
Branch: `codex/phase1-deployment-security-evidence`

## Scope
This artifact records **repo-verifiable** security controls and local execution evidence. It separately lists **named-deployment** checks that still require environment-specific operator evidence.

## Repo-verifiable controls executed
- Server security controls reviewed in `server/src/core/security.ts` and `server/src/core/config.ts`:
  - secrets/env handling (typed env parsing, wildcard CORS disallow, secure cookie derivation)
  - session cookie and CSRF cookie flags
  - CORS allowlist enforcement and credentialed responses
  - CSRF enforcement for cookie-backed mutations
  - mutation/invitation rate limits with `Retry-After`
  - security headers + production HSTS behavior
  - logger redaction for auth/cookie headers in `server/src/index.ts`
- Added deployment-focused security integration tests: `server/tests/securityDeploymentChecks.test.mjs`.
- Added deployment verification script: `scripts/verify-deployment-security.mjs` and npm script `security:verify:deployment`.

## Commands executed
- `npm --prefix server run build`
- `npm --prefix server test`
- `npm --prefix server run security:audit`
- `npm --prefix server run security:verify:deployment`

## Result summary
- Build: pass
- Full server tests: pass
- Security audit: inconclusive warning in this local environment when the npm advisory endpoint returned `403 Forbidden`; rerun in CI or a network-permitted environment.
- Deployment verification script: pass with warnings when required controls are configured and the npm advisory endpoint is unreachable.

## 2026-05-08 follow-up verification fix
- Updated `scripts/verify-deployment-security.mjs` so required controls remain hard failures while recommended production controls are warnings.
- Updated wildcard CORS verification to reject comma-separated origin lists containing `*`, matching `server/src/core/config.ts`.
- Added regression coverage proving the verifier rejects `EDELPHI_ALLOWED_ORIGINS=https://app.example.org,*` before running audit.
- Added explicit production cookie flag assertions for `HttpOnly`, `SameSite=Strict`, and `Secure`.

## Named-deployment controls still required
The following require operator evidence for each environment (dev/staging/prod), and are not claimed complete by repo-only checks:
- TLS termination and certificate chain/cipher validation at reverse proxy/edge.
- Reverse proxy forwarding behavior and header preservation validation.
- Secret manager ownership/rotation records and access-control logs.
- Production monitoring/alerting dashboards and retention policy evidence.
- Independent reviewer validation artifacts.

## Non-claims
- No claim of independent security review completion.
- No claim of security certification.
- No claim of production readiness.
