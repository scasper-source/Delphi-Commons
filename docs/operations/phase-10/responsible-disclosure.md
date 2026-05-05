# Responsible Disclosure / Security Reporting Policy

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

Status: PARTIAL. A root [Security Policy](../../../SECURITY.md) exists, but the contact is still a placeholder. GitHub Security Advisory setup remains a handoff item.

## Policy

Please report suspected vulnerabilities privately. Do not disclose vulnerabilities publicly until maintainers have had a reasonable opportunity to investigate and remediate.

High-priority areas include:

- participant privacy;
- identity/response separation;
- consent records;
- withdrawal/deletion requests;
- audit logs;
- report/export packages;
- authentication and authorization;
- AI governance and external AI boundaries;
- support-loop privacy;
- study lifecycle and consensus-rule locking.

## What to Include

Use synthetic or low-risk evidence only:

- affected version, commit, and environment;
- concise description;
- reproduction steps against local/dev/staging only;
- expected and actual behavior;
- screenshots or logs with secrets and identifiers removed;
- whether the issue may affect de-identified exports or identity-response mappings.

## What Not to Include

Do not include:

- real participant data;
- identity mappings;
- consent records;
- production credentials;
- private institutional data;
- real study exports;
- live exploit details against systems not owned or controlled by the project.

## Current Gaps

- SECURITY.md still contains `[security contact placeholder]`.
- No `.github/SECURITY.md`, GitHub Security Advisory settings, or issue templates were found.
- Independent security/ASVS review remains NOT RUN.

