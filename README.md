# Delphi Commons

Delphi Commons is an open-source platform for ethically governed Delphi and eDelphi studies. It helps study teams design studies, manage consent, run multi-round Delphi workflows, curate items, provide neutral controlled feedback, preserve dissent and non-consensus, audit decisions, and export reproducible study materials.

An eDelphi study is a Delphi study conducted online. Delphi Commons is not just a survey app: it is built around Delphi-method fidelity, participant protection, predefined consensus rules, transparent reporting limits, and human-in-the-loop governance for any AI-assisted workflows.

## Who It Is For

Delphi Commons is for researchers, study owners, methods stewards, open-source maintainers, and teams preparing controlled Delphi studies. It is currently most appropriate for local development, synthetic mock trials, methods rehearsal, and governance review.

## Current Status

Current readiness: controlled mock-participant MVP testing with synthetic or low-risk data only.

“Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

This repository is not yet approved for real human-subjects studies, production deployments, regulated data, institutional data, or sensitive participant data. Before real use, the project still needs production security review, backup/restore verification, retention automation, accessibility review, incident response, deployment hardening, and IRB/institutional approval where applicable.

## What It Is Not Ready For

Do not use this repository yet for:

- real human-subjects data;
- real consent records;
- identifiable participant contact lists;
- protected health information or regulated data;
- production SMS/email notification delivery;
- unattended external AI processing;
- claims that Delphi consensus establishes truth or correctness.

Open-source code does not imply open study data. Study data, participant identities, consent records, response data, audit logs, and exports remain private unless explicitly released under a separate approved governance process.

## Prerequisites

- Node.js 20 or later is recommended.
- npm is required.
- Git is recommended for local development.
- A modern browser is required for the web app.
- Windows, macOS, and Linux setup notes are in [docs/install](./docs/install/).

There is no root-level npm workspace command yet. Run install, build, test, and development commands from `app/` and `server/` as shown below.

## Local Install

Install frontend dependencies:

```powershell
cd app
npm install
```

Install backend dependencies:

```powershell
cd ../server
npm install
```

The backend uses local runtime data under `server/data/` by default. That directory is local-only and should not be committed or shared.

## Run Backend

```powershell
cd server
npm run dev
```

The backend builds TypeScript and starts the Fastify server. The health endpoint is typically:

```text
http://127.0.0.1:3001/health
```

## Run Frontend

In a second terminal:

```powershell
cd app
npm run dev -- --host 127.0.0.1 --port 5173
```

Then open:

```text
http://127.0.0.1:5173/
```

## Run Tests

Frontend tests:

```powershell
cd app
npm test
```

Backend tests, including build and road-test coverage:

```powershell
cd server
npm test
```

## Run Builds

Frontend build:

```powershell
cd app
npm run build
```

Backend build:

```powershell
cd server
npm run build
```

## Run Security Audit

```powershell
cd app
npm run security:audit
```

```powershell
cd server
npm run security:audit
```

## Documentation

- [Documentation index](./docs/index.md)
- [Getting started](./docs/getting-started.md)
- [Classical Delphi tutorial](./docs/tutorials/classical-delphi.md)
- [Modified Delphi tutorial](./docs/tutorials/modified-delphi.md)
- [Synthetic mock-trial tutorial](./docs/tutorials/mock-trial.md)
- [Architecture overview](./docs/architecture/overview.md)
- [Testing guide](./docs/development/testing.md)
- [AI-assisted development policy](./docs/development/ai-assisted-development.md)
- [Ethical Governance Charter](./documents/governance/ethical-governance-charter.md)
- [AI Governance & Human-in-the-Loop Thin Spec](./documents/governance/ai-assistance-thin-spec.md)
- [Human-subjects readiness plan](./documents/compliance/human-subjects-readiness/HUMAN_SUBJECTS_READINESS.md)
- [Phase 10 operational readiness docs](./docs/operations/phase-10/README.md)
- [Phase 10 rehearsal results](./docs/operations/phase-10/PHASE_10_REHEARSAL_RESULTS.md)
- [Full controlled mock-trial package](./docs/qc/full-mock-trial/README.md)
- [Adverse-user rehearsal package](./docs/qc/adverse-user-rehearsal/README.md)
- [Open-source release checklist](./docs/OPEN_SOURCE_RELEASE_CHECKLIST.md)
- [Security policy](./SECURITY.md)

## License

Copyright 2026 Stephen T. Casper.

This project is licensed under the Apache License, Version 2.0. See [LICENSE](./LICENSE).

SPDX-License-Identifier: Apache-2.0

Open-source code does not imply open study data. Deployments of this platform must preserve participant privacy, consent boundaries, study-level data governance, and human-subjects protections.

## Copyright and Ownership

Copyright 2026 Stephen T. Casper.

Unless otherwise noted, Stephen T. Casper is the copyright owner of the original source code in this repository.

Contributions are accepted only under the project's contribution terms and the Apache License 2.0. Contributors must not submit code, documentation, data, model output, or other material that they do not have the right to contribute.
