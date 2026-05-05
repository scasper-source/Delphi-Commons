# Admin Onboarding Guide

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

Status: PARTIAL. Admin/user endpoints exist for controlled local/dev/staging use. Production admin onboarding is NOT READY.

## Roles

- Study Owner: accountable for study setup, participant-facing materials, and study operations.
- Ethics & Methods Steward: accountable for methods, consent/participant protection, neutral feedback, and Delphi limitations.
- Security & Privacy Lead: accountable for confidentiality, incident response, access controls, and privacy.
- Data Custodian: accountable for data stores, backup/restore, export handling, and retention.
- Open Source Maintainer: accountable for repository health, release process, dependency review, and vulnerability handling.

Dual signoff remains required for governance-sensitive participant-facing materials unless explicitly configured otherwise.

## Local/Dev Admin Setup

The server seeds demo users outside production unless `EDELPHI_SEED_DEMO_USERS=false`. Demo users are development conveniences only and must not be treated as production credentials.

To create a controlled synthetic admin user through the API, use `POST /admin/users` as an authorized Admin or Maintainer. Use placeholders only, for example:

- email: `synthetic-admin@example.invalid`
- password: `changeme-dev-only-not-for-real-use`

Do not place real passwords, secrets, or participant data in docs, tickets, screenshots, or commits.

## Admin Capabilities Found

| Capability | Endpoint | Status |
|---|---|---|
| List users | `GET /admin/users` | FOUND |
| Create user | `POST /admin/users` | FOUND |
| Update roles/display name | `PATCH /admin/users/:userId` | FOUND |
| Disable user | `PATCH /admin/users/:userId` with `disabled` | FOUND |
| Revoke user sessions | `PATCH /admin/users/:userId` with `revoke_sessions` or disable | FOUND |
| List storage/migrations | `GET /admin/storage-status` | FOUND |
| Check audit integrity | `GET /admin/audit-integrity` | FOUND |
| Check data integrity | `GET /admin/data-integrity` | FOUND |
| List/create/restore backups | `/admin/backups` endpoints | FOUND |

## Onboarding Checklist

| Step | Status |
|---|---|
| Confirm synthetic/local/dev/staging scope | NOT RUN |
| Confirm role assignment and least privilege | NOT RUN |
| Confirm user can log in | NOT RUN |
| Confirm user cannot access unauthorized admin areas | NOT RUN |
| Confirm user/session disable works | NOT RUN |
| Confirm audit records appear for admin actions | NOT RUN |
| Confirm no real participant data is used | NOT RUN |

## AI Boundary for Admins

AI suggestions are non-binding, must be labeled as suggestions, require human acceptance/edit/reject, and must not steer participants toward consensus. Admins must not configure external AI for real data in this readiness state.

