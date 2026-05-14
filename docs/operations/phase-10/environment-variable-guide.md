# Environment Variable Guide

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

Status: COMPLETE for variables found in source. Production configuration remains NOT READY.

This guide lists environment variables observed in source files. Do not add real credentials to documentation, commits, issue reports, screenshots, or prompts.

## Required vs Optional

For ordinary local development, the server has defaults for host, port, paths, CORS origins, rate limits, SMS provider, and SQLite database path. `EDELPHI_AI_KEY_ENCRYPTION_SECRET` is required only for AI connector API-key encryption/decryption paths. Production-ready required-variable policy is NOT READY.

## Runtime and Server

| Variable | Source | Default or behavior | Notes |
|---|---|---|---|
| `NODE_ENV` | `server/src/core/config.ts` | `development` unless `production` or `test` | Production mode changes cookie security and disables demo user seeding. |
| `PORT` | `server/src/core/config.ts` | `3001` | Server port. |
| `HOST` | `server/src/core/config.ts` | `127.0.0.1` | Bind host. |
| `APP_VERSION` | `server/src/core/citation.ts` | package version or `development` | Optional citation/version label. |
| `VITE_APP_VERSION` | `server/src/core/citation.ts` | package version or `development` | Optional citation/version label. |

## Data, Audit, Backup, and Database

| Variable | Source | Default or behavior | Notes |
|---|---|---|---|
| `EDELPHI_DATA_DIR` | `server/src/core/paths.ts` | `server/data` | Local SQLite and runtime data root. Treat as sensitive. |
| `EDELPHI_AUDIT_DIR` | `server/src/core/paths.ts` | `server/audit` | Audit log root. Treat as sensitive. |
| `EDELPHI_BACKUP_DIR` | `server/src/core/paths.ts` | `server/backups` | Backup root. Treat as sensitive. |
| `EDELPHI_DATABASE_PATH` | `server/src/core/database.ts` | `<EDELPHI_DATA_DIR>/edelphi.sqlite` | SQLite database file. |
| `EDELPHI_SKIP_LEGACY_IMPORT` | `server/src/core/database.ts` | unset | Set to `true` to skip legacy JSON import. |

## Auth, Sessions, Cookies, and CORS

| Variable | Source | Default or behavior | Notes |
|---|---|---|---|
| `EDELPHI_ALLOWED_ORIGINS` | `server/src/core/config.ts` | `http://127.0.0.1:5173,http://localhost:5173` | Comma-separated list. Wildcard `*` is rejected. |
| `EDELPHI_AUTH_REQUIRE_SESSION` | `server/src/middleware/auth.ts`, `server/src/routes/auth.ts`, `server/src/studies/routes.ts` | unset | Set to `true` to reject non-session actor header auth where enforced. |
| `EDELPHI_SECURE_COOKIES` | `server/src/core/config.ts` | `true` in production; otherwise false unless set | Local HTTP development may leave this false. |
| `EDELPHI_BODY_LIMIT_BYTES` | `server/src/core/config.ts` | `262144` | Fastify body limit. |
| `EDELPHI_RATE_LIMIT_WINDOW_MS` | `server/src/core/config.ts` | `60000` | Rate-limit window. |
| `EDELPHI_RATE_LIMIT_AUTH_MAX` | `server/src/core/config.ts` | `10` | Auth rate-limit max. |
| `EDELPHI_RATE_LIMIT_MUTATION_MAX` | `server/src/core/config.ts` | `300` | Mutation rate-limit max. |
| `EDELPHI_RATE_LIMIT_INVITATION_MAX` | `server/src/core/config.ts` | `120` | Participant invitation rate-limit max. |

## Security and Logging

| Item | Source | Status | Notes |
|---|---|---|---|
| Security headers | `server/src/core/security.ts` | FOUND | CSP, frame, referrer, content-type, cache, cross-origin, and permissions headers are applied. |
| Request logging | `server/src/index.ts` | FOUND | Fastify request logging is disabled; logger redacts authorization and cookie headers when enabled. |
| Logging environment variables | source inspection | NOT FOUND | No dedicated log-level env variable was found. |

## Demo and Governance Convenience

| Variable | Source | Default or behavior | Notes |
|---|---|---|---|
| `EDELPHI_SEED_DEMO_USERS` | `server/src/auth/demoUsers.ts` | Demo users seed outside production unless set to `false` | Do not rely on demo users for production. |
| `EDELPHI_DEMO_GOVERNANCE_ASSIGNMENTS` | `server/src/studies/routes.ts` | Enabled outside production unless set to `false`; explicit `true` enables lookup | Development convenience only. |

## AI-Related

| Variable | Source | Default or behavior | Notes |
|---|---|---|---|
| `EDELPHI_AI_KEY_ENCRYPTION_SECRET` | `server/src/core/aiKeyCrypto.ts` | required for AI key encryption/decryption paths | Use `changeme-dev-only` style placeholders for local tests only; do not commit real secrets. |

AI suggestions are non-binding, must be labeled as suggestions, require human acceptance/edit/reject, and must not steer participants toward consensus.

## SMS / Magic Link

| Variable | Source | Default or behavior | Notes |
|---|---|---|---|
| `EDELPHI_MAGIC_LINK_TTL_MINUTES` | `server/src/core/config.ts` | `60`, capped at 1440 | Magic-link TTL. |
| `EDELPHI_PHONE_OTP_TTL_MINUTES` | `server/src/core/config.ts` | `10` | Phone OTP TTL. |
| `EDELPHI_SMS_PROVIDER` | `server/src/core/config.ts` | `mock`; `twilio` when set to `twilio` | Real SMS provider readiness is NOT READY for real studies. |
| `EDELPHI_SMS_WEBHOOK_SECRET` | `server/src/core/config.ts` | `null` | Optional webhook secret. |
| `EDELPHI_ENABLE_REAL_SMS` | `server/src/core/config.ts` | unset/false | Must be `true` before Twilio sends are allowed. This is only one technical gate and is not a readiness approval. |
| `EDELPHI_REAL_SMS_ACK` | `server/src/core/config.ts` | unset | Must equal `TWILIO_REAL_SMS_REVIEWED_AND_APPROVED` before Twilio sends are allowed. Do not set without documented approval. |
| `EDELPHI_PUBLIC_PARTICIPANT_ORIGIN` | `server/src/core/config.ts`, `server/src/core/smsNotifications.ts` | unset | Required for Twilio round links; must be HTTPS and not localhost. |
| `EDELPHI_TWILIO_WEBHOOK_BASE_URL` | `server/src/core/config.ts`, `server/src/core/smsProvider.ts` | unset | Required to validate Twilio webhook signatures against the exact public webhook URL; must be HTTPS and not localhost. |
| `EDELPHI_TWILIO_STATUS_CALLBACK_URL` | `server/src/core/config.ts`, `server/src/core/smsProvider.ts` | unset | Optional explicit Twilio status callback URL; defaults to `<EDELPHI_TWILIO_WEBHOOK_BASE_URL>/sms/webhook` when Twilio sends are enabled. |
| `TWILIO_ACCOUNT_SID` | `server/src/core/config.ts`, `server/src/core/smsProvider.ts` | unset | Required for Twilio sends and webhook signature validation. Secret-adjacent account identifier; do not commit. |
| `TWILIO_AUTH_TOKEN` | `server/src/core/config.ts`, `server/src/core/smsProvider.ts` | unset | Required Twilio secret for API auth and webhook validation. Never commit, paste into prompts, screenshots, or evidence. |
| `TWILIO_MESSAGING_SERVICE_SID` | `server/src/core/config.ts`, `server/src/core/smsProvider.ts` | unset | Required Twilio Messaging Service SID for sends. Configure opt-out/help behavior and carrier registration in Twilio before real use. |

## Email-Related

No SMTP or email-provider environment variables were found in source during Phase 10 inspection.

## Deployment-Related

No cloud-provider, container, TLS, reverse-proxy, monitoring, or production secret-store environment variables were found in source during Phase 10 inspection.

## Not Found

- No `.env.example` file was found during Phase 10 inspection.
- No cloud-provider variables were found.
- No production database service variables were found.
- No SMTP/email provider variables were found.
