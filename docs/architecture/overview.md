# Architecture Overview

Delphi Commons is a React/Vite frontend and Fastify/TypeScript backend for governed Delphi workflows.

Current readiness: controlled synthetic mock trials only. This architecture overview is not a production security certification.

## Repository Layout

- `app/`: React/Vite web UI.
- `app/src/App.tsx`: main application shell and screens.
- `app/src/content/`: shared participant-facing and citation content.
- `app/src/core/`: frontend types, workflow logic, and shared UI helpers.
- `app/src/policies/`: frontend policy checks and forbidden language guards.
- `server/`: Fastify backend, persistence, routes, audit, exports, and services.
- `server/src/core/`: backend core services.
- `server/src/routes/`: backend API routes.
- `server/src/stores/`: persistence stores.
- `server/tests/`: backend tests and road tests.
- `documents/`: governance and compliance documents.
- `docs/`: GitHub/open-source and developer documentation.

## Study Lifecycle

Study lifecycle behavior is represented in frontend workflow state and backend study routes/stores. Look for study setup, launch gates, round states, closeout, exports, and audit behavior in:

- `app/src/core/studyWizard.ts`
- `app/src/App.tsx`
- `server/src/studies/`
- `server/tests/roadtest.test.mjs`

## Roles And RBAC

Roles include Study Owner / PI, Ethics & Methods Steward, Security & Privacy Lead, participant roles, and admin-like responsibilities. Permission checks are spread across frontend policy helpers and backend middleware/routes:

- `app/src/core/permissions.ts`
- `app/src/policies/governance.ts`
- `server/src/middleware/`
- `server/src/studies/routes.ts`

## Consent

Consent is treated as explicit, versioned, and separate from orientation. Consent language and participant information must preserve voluntariness, confidentiality limits, withdrawal rights, and data handling.

Relevant areas:

- Study Builder consent step in `app/src/App.tsx`
- backend road-test coverage in `server/tests/roadtest.test.mjs`
- governance charter in `documents/governance/ethical-governance-charter.md`

## Withdrawal And Attrition

The governed attrition model preserves historical responses while allowing participant withdrawal and PI-managed inactive status for future rounds.

Relevant docs and code:

- `documents/governance/governed-attrition-model.md`
- participant and dashboard UI in `app/src/App.tsx`
- backend tests in `server/tests/roadtest.test.mjs`

## Identity / Response Separation

The platform is designed to separate participant identity/contact data from response data where feasible. Full anonymity from the study team is not promised because Delphi rounds often require response linkage across rounds.

Check:

- backend stores under `server/src/stores/`
- security and auth helpers under `server/src/core/`
- audit/privacy tests in `server/tests/roadtest.test.mjs`

## Rounds

Rounds support open-ended Round 1 collection, later rating/ranking rounds, controlled feedback, terminal round closeout, and final results.

Relevant areas:

- round screens in `app/src/App.tsx`
- backend round routes/stores under `server/src/`
- road-test coverage in `server/tests/roadtest.test.mjs`

## Curation

Curation transforms Round 1 responses into later-round items. Provenance and auditability are required. AI assistance, if used, must remain non-final until human accepted or edited.

Relevant areas:

- curation UI in `app/src/App.tsx`
- AI governance services under `server/src/core/`
- AI governance docs under `documents/governance/`

## Consensus Rules

Consensus rules are predefined, locked before launch, and must not be changed after results are visible without governed amendment. Consensus means agreement among this panel, not correctness.

Relevant areas:

- Study Builder rounds/consensus UI in `app/src/App.tsx`
- governance policy tests in `app/tests/policyGates.test.mjs`
- backend road-test coverage in `server/tests/roadtest.test.mjs`

## Feedback

Controlled feedback is neutral, compact, and participant-protective. It may include prior response, group median, IQR/distribution, neutral summaries, and approved anonymized rationales. It must not pressure convergence.

Relevant areas:

- participant feedback UI in `app/src/App.tsx`
- orientation and help content in `app/src/content/orientation.ts`
- frontend policy tests in `app/tests/policyGates.test.mjs`

## Audit Logs

Audit logs record governance, AI, export, participant issue, SMS, and study events without logging secrets or unnecessary identifying data.

Relevant areas:

- backend audit services under `server/src/core/`
- audit stores under `server/src/stores/`
- road-test coverage in `server/tests/roadtest.test.mjs`

## Exports

Exports support reproducible packages, citation metadata, reports, manifests, and final results. Exports must preserve non-consensus results and limitations.

Relevant areas:

- `server/src/routes/reports.ts`
- `server/src/stores/exportManifestStore.ts`
- `server/src/core/citation.ts`
- export tests in `server/tests/roadtest.test.mjs`

## AI Governance

AI features are drafting/organizing aids only. They must be disclosed, permissioned, minimized, audited, and human-reviewed before affecting study content.

Relevant areas:

- `documents/governance/ai-assistance-thin-spec.md`
- `documents/governance/study-ai-connector.md`
- `app/src/App.tsx`
- `server/src/core/ai*`
- `server/src/routes/ai.ts`
