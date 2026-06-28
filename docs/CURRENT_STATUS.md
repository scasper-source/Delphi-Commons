# Current Project Status

Date basis: 2026-06-28.

Boundary statement: Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.

## Repository State

- GitHub repository: `scasper-source/Delphi-Commons`
- Latest repository commit on `main`: `dcd54e2` (repository cleanup, status update, and gitignore normalization, 2026-06-28)
- Latest app/server code commit on `main`: `2fa50fe` (Merge PR #136, 2026-06-28)
- Default branch: `main` (only branch; `master` archived as tag `archive/master-pre-main-migration`)
- Open pull requests: none
- Stale remote branches: none (all `codex/*` and decomposition branches cleaned up 2026-06-28)
- CI: GitHub Actions app/server jobs pass. Server audit reported 0 vulnerabilities; app audit reported 5 vulnerabilities (2 low, 2 moderate, 1 high) and requires dependency/security triage.
- Public release: not created
- DOI/archive release: not created

## Current Verification Snapshot

CI runs on every push and PR to `main`. Latest passing run: `28339250962` (2026-06-28).

| Area | Result |
| --- | --- |
| App tests | PASS, 31/31 |
| App lint | PASS, 0 errors |
| App production build | PASS |
| App high-severity npm audit | OPEN; latest CI app audit reported one high Vite advisory plus low/moderate advisories. |
| Server tests | PASS |
| Server high-severity npm audit | PASS, 0 vulnerabilities |

## June 2026 Code Health Update

The following structural improvements landed in PRs #135 and #136 (June 2026):

- **CI pipeline**: GitHub Actions runs app build/lint/test/audit and server build/test/audit on every push and PR.
- **AppContext decomposition** (6 passes): Extracted shared state (study, role, workflow, wizard, runtimeData, roundConfigs) into React Context. Eliminated prop drilling through ModuleRenderer to 12 screen components.
- **CSS design tokens**: Defined ~75 semantic CSS custom properties in `:root`, replacing ~240 hardcoded hex values across App.css. Near-duplicate colors consolidated.
- **Toast notification system**: Centralized NotificationContext with `useNotify()` hook replaces 12 scattered error/message `useState` pairs and ~100 `set*Error`/`set*Message` calls. Auto-dismiss (5s success, 8s danger) with accessible `aria-live` region.
- **First-run operator bootstrap**: `GET /auth/setup-status` and `POST /auth/setup` endpoints. Frontend `FirstRunSetupScreen` gates the app when no users exist. Creates admin/owner account + seeds demo users.
- **Shared types/utils extraction**: `appTypes.ts`, `appUtils.ts`, `AppContext.tsx`, `NotificationContext.tsx` separated from the monolithic `App.tsx`.

These changes are code-health improvements. They do not change the readiness boundary.

## Readiness Summary

Delphi Commons has strong controlled synthetic/mock-trial and internal engineering evidence. It remains **not ready** for production deployment, real human-subjects research, pilot launch, IRB/ethics launch, legal approval, independent security certification, or completed accessibility conformance.

| Track | Current interpretation |
| --- | --- |
| `mock_trial` | Controlled synthetic mock-trial evidence exists and remains the strongest validated path. |
| `human_testing_candidate` | In progress. Laptop and phone/SMS candidate work is substantially documented and partially implemented, but human-required gates remain open. |
| `controlled_pilot` | Not authorized. |
| `production_candidate` | Not authorized. |
| `public_open_source` | Private GitHub clean-history repository exists; public release and DOI/archive steps remain open. |

## Phase Snapshot

| Phase | Status |
| --- | --- |
| Phase 0 baseline preservation | Baseline mock-trial/regression evidence is preserved. |
| Phase 1 product surface lock | Complete as scope lock only. It does not authorize human testing. |
| Phase 2 downloadable laptop operator candidate | In progress. Windows internal portable ZIP, corrected Windows internal installer `r8`/`r9`/`r10` ZIP/EXE candidates, and macOS Apple Silicon single installer ZIP bundle are available on GitHub. A 2026-05-29 clean Windows `r8` operator report shows install/launch/close-window stop/relaunch/uninstall mostly passing, but saved-study reopen/new-study continuity failed or was unclear and screenshots still need attachment. The `r10` package supersedes `r9` for retest and includes package-mode multi-study persistence, a top-level Study Workspace Launcher with backend-backed New/Current/Past study paths, Study PI/Ethics PI signoff follow-up, and the Main Menu first-screen / fresh New Study reset fix; clean Windows `r10` retest evidence remains required. |
| Phase 3 phone/SMS candidate | Local mock/sandbox implementation and evidence-prep are substantially complete. Twilio integration is fully implemented (magic links, OTP, consent tracking, delivery webhooks, coercive-language filter) — activation requires only env-var configuration, not code changes. Real iOS/Android device evidence, real provider/sandbox evidence if in scope, accessibility review, privacy/copy/Data Custodian review, and human-observed phone walkthrough remain open. |
| Phase 4 human testing binder | Binder package is assembled for final human-testing preparation; candidate remains not ready until laptop/phone run evidence and required signoffs are attached. |
| Phase 5 final human testing | Not run. |

## Open P0 Blockers

One repo-verifiable dependency/security item is open: the latest CI app audit reported 5 vulnerabilities, including one high Vite advisory. The remaining readiness blockers are human-action gates:

- Pin a candidate commit/package and record the exact supported surfaces.
- Complete clean-profile or second-machine laptop package evidence for the selected Windows path, including linked screenshot/log artifacts.
- Rerun the Windows Study Workspace Launcher plus saved-study reopen/new-study continuity path against corrected `r10`.
- Rerun the Study PI plus Ethics PI signoff flow against corrected `r10`.
- Complete macOS install/lifecycle evidence if macOS is included for the candidate.
- Complete iPhone/Safari and Android/Chrome phone-flow evidence.
- Complete SMS copy/privacy/Data Custodian/security review for any SMS path used in human testing.
- Review or remediate the app npm audit findings, including the high Vite advisory, before any readiness advancement.
- Complete accessibility review for the selected surfaces.
- Execute and sign off the Phase 4 human testing binder.
- Run a human-observed end-to-end walkthrough with synthetic/internal data only.

Open-source code does not imply open study data. Study data, participant identities, consent records, response data, audit logs, exports, and support notes remain private unless separately released under an approved governance process.
