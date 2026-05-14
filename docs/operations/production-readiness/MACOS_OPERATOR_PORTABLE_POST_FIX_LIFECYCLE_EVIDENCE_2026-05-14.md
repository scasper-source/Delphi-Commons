# macOS Operator Portable Post-Fix Lifecycle Evidence (2026-05-14)

Status: **POST-FIX APPLE SILICON LIFECYCLE RERUN PASSED / INTERNAL ENGINEERING EVIDENCE ONLY**.
Decision label: **NOT READY FOR HUMAN TESTING**.
Phase status: **Phase 2 remains IN PROGRESS**.
Date basis: **2026-05-14**.

## Scope

This evidence records a real macOS post-fix lifecycle rerun for the portable/internal operator package defects found in the 2026-05-13 Apple Silicon run.

Repository: `scasper-source/Delphi-Commons`.
Test environment: real macOS machine, MacBook Air, Apple Silicon.
Evidence type: internal engineering evidence only.
Commit tested: `56b37b7494e9b9c796de4a80010d290307ac3a50` (`Merge pull request #60 from scasper-source/codex/macos-portable-supervision-fixes`).
Commit date: 2026-05-13 17:36:32 -0400.

No real participant data was used.

## Governance Boundary

This evidence must be interpreted under the Ethical Governance Charter for the Open-Source eDelphi Platform and the AI Governance & Human-in-the-Loop Thin Spec.

These findings are internal engineering evidence only. They do not establish or imply production readiness, pilot readiness, human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, external AI readiness, or open public release readiness.

## Summary Finding

The post-fix real macOS lifecycle rerun passed for the previously observed macOS portable/internal operator package defects. The tested package now builds, extracts, starts, reports status, smokes, restarts, stops, resets, and returns to a clean stopped state on the real Mac test machine.

The prior defects appear resolved in this rerun, subject to the evidence boundary above.

## Environment Evidence

- macOS: 15.6, build 24G84
- Kernel: Darwin 24.6.0 arm64
- Architecture: arm64 / Apple Silicon
- Node: v24.15.0
- npm: 11.12.1
- Git: 2.39.5 Apple Git

## Pre-Test Cleanup Finding

Before the rerun, old local E-Delphi services from the prior May 13 test were still listening on:

- backend: `127.0.0.1:3001`
- UI: `127.0.0.1:4173`

The processes were verified as E-Delphi test processes by working directory:

- backend runtime path: `~/Library/Application Support/DelphiCommons/macos-operator-portable-candidate/server-runtime`
- UI/package path: `~/edelphi-test/Delphi-Commons/build/macos-operator-portable/extracted-test/macos-operator-portable-prototype-20260513-144926`

Only those confirmed E-Delphi PIDs were stopped. After stopping, both ports were clear.

## Repo State Finding

The local repo was initially still at prior tested commit `55e1b40d358ac8fa3e2451881626f305b77672f6`.

After `git fetch origin main --prune`, `origin/main` pointed to `56b37b7494e9b9c796de4a80010d290307ac3a50`. The local repo was hard-reset to `origin/main`.

Final repo state was clean: `## main...origin/main`.

## Package Build Finding

The macOS portable package build succeeded from the primary repo.

New archive created:

`build/macos-operator-portable/macos-operator-portable-prototype-20260514-130023.tar.gz`

The build did not start backend or UI listeners. Ports `3001` and `4173` remained clear after the build.

## Package Extraction and Manifest Finding

The archive was extracted into:

`build/macos-operator-portable/extracted-test/postfix-20260514-130023/`

Required package files were present:

- `app/dist`
- `server/dist`
- `server/package.json`
- `server/package-lock.json`
- executable launcher script
- `tools/static-file-server.mjs`
- `README.txt`
- `package-manifest.json`
- `LICENSE`
- `NOTICE`

The extracted package manifest recorded the tested commit: `56b37b7494e9b9c796de4a80010d290307ac3a50`.

## Lifecycle Findings

| Check | Result | Finding |
| --- | --- | --- |
| `status` before start | PASS | Returned `stopped` even with stale prior-run PID files present; launcher was not fooled by stale PID state. |
| `start` | PASS | Reported UI at `http://127.0.0.1:4173` and health at `http://127.0.0.1:3001/health`. |
| `status` after start | PASS | Reported `running backend=50624 ui=50629`; actual listeners matched recorded PID files. |
| Backend health | PASS | Returned `{"status":"ok","service":"edelphi-server","environment":"production"}`. The environment label is runtime configuration, not a readiness claim. |
| UI HEAD | PASS | Returned `HTTP/1.1 200 OK`. |
| `smoke` | PASS | Returned `smoke ok: backend health ok; UI HTTP 200 (internal engineering evidence only)`. |
| `restart` | PASS | Replaced backend PID `50624` and UI PID `50629` with backend PID `50897` and UI PID `50902`; old PIDs were gone and new listeners matched. |
| Smoke after restart | PASS | Smoke passed after restart. |
| `stop` | PASS | Returned `stopped`; old PIDs gone; ports clear; runtime state directory empty. |
| `reset` after stopped | PASS | Completed safely and created `reset-snapshot-20260514-130847`; status remained stopped, ports remained clear, state remained empty. |
| Start/smoke/stop after reset | PASS | Restarted cleanly as `running backend=51289 ui=51294`; smoke passed; stop succeeded; final status stopped. |
| Idempotent stopped-state commands | PASS | `status` while stopped returned stopped; `stop` while stopped returned stopped; `reset` while stopped created `reset-snapshot-20260514-131146`; final ports clear and state empty. |

## Server Audit Finding

At the tested commit, server npm audit passed:

- `npm audit --audit-level=high`: `found 0 vulnerabilities`
- `npm audit --omit=dev --audit-level=high`: `found 0 vulnerabilities`

The previously observed high-severity server audit issue was not reproduced at the tested commit.

## Clean Worktree / Clean Build Finding

A separate clean Git worktree was created from `origin/main`:

`~/edelphi-test/Delphi-Commons-cleanbuild-postfix-20260514-130023`

The worktree started with no `build/` directory. Initial package build without dependencies failed at `sh: tsc: command not found`, as expected because `app/node_modules` and `server/node_modules` were absent.

After running:

- `npm --prefix app ci`
- `npm --prefix server ci`

both dependency installs passed with `0 vulnerabilities`, and TypeScript tooling existed in both app and server.

The clean-worktree package build was rerun and passed. It created repo-local output path `build/macos-operator-portable` and produced:

`build/macos-operator-portable/macos-operator-portable-prototype-20260514-131705.tar.gz`

The archive manifest recorded `56b37b7494e9b9c796de4a80010d290307ac3a50`.

Ports remained clear.

Finding: the prior clean-checkout/output-root defect appears resolved. Dependency installation remains a prerequisite for packaging.

## Final State

- Final port check: no `3001` listener and no `4173` listener.
- Final launcher status from extracted package: `stopped`.
- Primary repo state: `## main...origin/main`.
- Clean-build worktree state: `## HEAD (no branch)`.
- Runtime state directory: empty.

## Overall Conclusion

The post-fix real macOS lifecycle rerun passed for the previously observed portable/internal operator package defects:

1. Clean build output-root behavior is corrected after dependency prerequisites.
2. Launcher PID supervision records and reports the actual long-lived listener PIDs.
3. `status` is not fooled by stale PID files.
4. `restart` replaces old listener PIDs with new listener PIDs correctly.
5. `stop` clears listeners and state.
6. `reset` after stopped is safe and does not leave stale state.
7. `smoke` performs real backend/UI HTTP checks.
8. Server audit no longer reproduces the prior high-severity vulnerability finding.

These findings support closing the specific macOS portable lifecycle defects as fixed for this internal engineering rerun, while preserving all governance limits and avoiding any broader readiness claim.
