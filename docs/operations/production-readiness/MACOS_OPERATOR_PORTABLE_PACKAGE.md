# macOS Operator Portable Package (Phase 2 Prototype/Internal)

Status: **MACOS PORTABLE PACKAGE PROTOTYPE / POST-FIX APPLE SILICON LIFECYCLE EVIDENCE RECORDED / INTERNAL ENGINEERING EVIDENCE ONLY**.
Decision label: **NOT READY FOR HUMAN TESTING**.
Date basis: **2026-05-14**.

## Scope

This document covers the scaffolded internal macOS portable operator package path for Phase 2. It is implementation scaffolding only.

One Apple Silicon macOS internal engineering runtime run was performed on **2026-05-13**. It produced partial positive package/build/start evidence but exposed lifecycle defects. Follow-up script fixes and local package verification were recorded separately.

A post-fix real Apple Silicon macOS lifecycle rerun was performed on **2026-05-14** at commit `56b37b7494e9b9c796de4a80010d290307ac3a50` and passed for the previously observed lifecycle defects. This remains internal engineering evidence only and does **not** establish macOS support readiness or human-testing readiness.

## Builder

- Path: `scripts/macos/build-operator-portable-package.sh`
- Output root (default): `build/macos-operator-portable`

## Lifecycle launcher

- Path: `scripts/macos/portable-operator-candidate.sh`
- Supported commands: `status`, `start`, `stop`, `restart`, `smoke`, `backup`, `reset`

Backend and UI are configured for localhost-only binding (`127.0.0.1`).

Status, stop, restart, and reset are expected to verify actual localhost listener processes rather than trusting stale PID files alone. Reset refuses while the expected backend or UI service is actually running.

## Runtime root policy

Runtime root is outside package root:

- `~/Library/Application Support/DelphiCommons/macos-operator-portable-candidate`

Runtime data directories are externalized (db/audit/exports/backups/logs/evidence/state/server-runtime).

## Package shape

The package builder:

- builds frontend (`app/dist`) and backend (`server/dist`);
- stages selected files only;
- includes launcher script, static-file server tool, README, and package manifest;
- creates a portable/internal archive (`.tar.gz`).

`tools/static-file-server.mjs` reuses `scripts/windows/static-file-server.mjs` as a copied package tool.

## Exclusions

The package path excludes runtime and sensitive material, including:

- `.git`
- `.env`
- secrets/keys/tokens
- logs/runtime data
- backups/exports/evidence artifacts
- `node_modules`

## Dependency posture

Current posture may require local Node.js/npm on macOS unless bundled runtime work is separately completed.

## Explicit limitations and non-claims

This prototype does **not** include or claim:

- `.app` bundle
- `.pkg` installer
- `.dmg` distribution image
- signing or notarization
- updater flow
- enterprise distribution support
- macOS support readiness
- production readiness
- pilot readiness
- real human-subject readiness

## Related documents

- [macOS Operator Portable/Internal Package ADR (Phase 2 Planning)](./MACOS_OPERATOR_PORTABLE_PACKAGE_ADR.md)
- [macOS Signing And Distribution Limitations (Phase 2)](./MACOS_SIGNING_DISTRIBUTION_LIMITATIONS.md)
- [macOS Operator Portable Runbook (planned internal candidate)](./MACOS_OPERATOR_PORTABLE_RUNBOOK.md)
- [macOS Operator Portable Post-Fix Lifecycle Evidence (2026-05-14)](./MACOS_OPERATOR_PORTABLE_POST_FIX_LIFECYCLE_EVIDENCE_2026-05-14.md)
- [Windows Operator Portable Package (Stage 1 Prototype)](./WINDOWS_OPERATOR_PORTABLE_PACKAGE.md)
- [Product Readiness Plan for eDelphi](./PRODUCTION_READY_EDELPHI_PLATFORM.md)


## 2026-05-13 Apple Silicon Manual Test (Internal Engineering Evidence Only)

Test scope: one internal engineering run on a real Apple Silicon MacBook Air (Mac15,12, Apple M3, 24 GB, macOS 15.6 build 24G84, arm64; Node v24.15.0; npm 11.12.1; Git 2.39.5 Apple Git), repo `scasper-source/Delphi-Commons` at commit `55e1b40d358ac8fa3e2451881626f305b77672f6` (branch `main`, timestamp captured near end: `2026-05-13T15:14:15Z`). No real participant data was used.

### Setup and dependency posture

- Apple Command Line Developer Tools were required (`xcode-select` prompt observed).
- Node/npm were initially missing and installed manually via official macOS installer.
- Private repo clone required GitHub authentication; temporary fine-grained read-only token used and should be revoked after testing.
- `npm --prefix app ci`: PASS (`0 vulnerabilities`).
- `npm --prefix server ci`: PASS with caution (`1 high severity vulnerability`).
- `npm audit fix` was intentionally not run during evidence collection to avoid mutating dependencies.

### Package/build evidence and defects

- Clean-checkout defect reproduced before workaround: `./scripts/macos/build-operator-portable-package.sh` failed when repo `build/` was absent (`cd .../build: No such file or directory`, attempted `mkdir /macos-operator-portable` rejected by read-only root filesystem).
- Workaround used for evidence collection: `mkdir -p build` (git status remained clean).
- Package built successfully afterward, including archive and manifest under `build/macos-operator-portable/...`.
- Extracted package inspection passed (`README.txt`, `package-manifest.json`, `app/dist`, `server/dist`, launcher and static-file-server present).

### Lifecycle results (pre-fix tested package)

| Step | Result | Notes |
| --- | --- | --- |
| `status` before start | PASS | Reported `stopped`. |
| `start` | PASS with caution | UI + health endpoints announced; npm warning repeated (`1 high severity vulnerability`). |
| `status` after start | PASS | Reported running. |
| `curl -s http://127.0.0.1:3001/health` | PASS | Returned `{"status":"ok","service":"edelphi-server","environment":"production"}`; runtime label only, not production-readiness evidence. |
| `curl -I http://127.0.0.1:4173/` | PASS | HTTP 200. |
| `smoke` | CAUTION | Placeholder output (`smoke: NOT RUN in non-macOS CI environment`), not a real runtime smoke pass. |
| `backup` | PASS | Runtime backup path created. |
| `reset` while running | PASS | Correctly refused reset while active. |
| `restart` + post-checks | FAIL/CAUTION | Launcher reported `stopped` while backend/UI listeners still active. |
| `stop` after second run | FAIL/CAUTION | Reproduced false stopped state; listeners remained active. |
| targeted listener cleanup + post-stop `reset` | PASS with caution | Manual PID cleanup succeeded; process supervision defect remains open. |

### Safety boundary and remaining blockers

- Prominent defects requiring post-fix real macOS rerun:
  - build script clean-checkout portability defect when `build/` does not exist;
  - launcher PID supervision mismatch (lock-file PIDs differed from real listeners);
  - `status`/`stop`/`restart` can falsely report stopped while listeners remain on `3001`/`4173`;
  - `smoke` in this tested package is a placeholder, not real runtime smoke evidence;
  - `reset` left `state/backend.pid`, `state/ui.pid`, and `state/instance.lock` files after reset (review required);
  - server dependency install reported one high severity npm audit vulnerability (security/dependency caution only).
- Pre/post package-root cleanliness checks: PASS (no runtime data/secrets materialized in extracted package root).
- Runtime data materialized under `~/Library/Application Support/DelphiCommons/macos-operator-portable-candidate` with expected runtime directories and backup/reset artifacts.
- Gatekeeper/quarantine observations in this run: none observed.
- Manual browser open (`open http://127.0.0.1:4173/`) succeeded as visual inspection only; this is not human-subjects readiness evidence.

### Explicit non-claims (preserved)

This internal evidence does **not** claim production readiness, pilot readiness, human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, external AI readiness, or open public release readiness.

## 2026-05-14 Apple Silicon Post-Fix Lifecycle Rerun (Internal Engineering Evidence Only)

Detailed evidence: [MACOS_OPERATOR_PORTABLE_POST_FIX_LIFECYCLE_EVIDENCE_2026-05-14.md](./MACOS_OPERATOR_PORTABLE_POST_FIX_LIFECYCLE_EVIDENCE_2026-05-14.md).

Summary: the package built, extracted, started, reported accurate status, returned backend health, returned UI HTTP 200, passed real `smoke`, restarted with new listener PIDs, stopped cleanly, reset safely after stopped, restarted after reset, and preserved a clean stopped final state on a real Apple Silicon MacBook Air.

Specific prior defects closed by this rerun:

- clean-checkout/output-root behavior after dependency prerequisites;
- PID supervision mismatch;
- stale PID files misleading `status`;
- restart not replacing old listeners correctly;
- stop leaving listeners/state behind;
- reset-after-stopped stale state;
- placeholder `smoke`;
- high-severity server audit finding at the tested commit.

Remaining boundary: this is one Apple Silicon internal engineering rerun. It does not provide Intel Mac coverage, signed/notarized distribution evidence, installer evidence, accessibility evidence, security certification, pilot readiness, production readiness, or human-subjects readiness.


## 2026-05-14 bundled-runtime internal hardening update

- macOS Phase 2 packaging now uses `scripts/packaging/macos-portable.mjs` via thin shell entrypoint `scripts/macos/build-operator-portable-package.sh`.
- Bundled runtime target implemented in this phase: Apple Silicon `macos/arm64` with Node `24.15.0` metadata at `docs/adr/runtime/node-macos-arm64.json`.
- Intel Mac `x64` remains deferred and is not claimed supported in this package line.
- Build-time still requires local Node/npm in the source checkout. Runtime lifecycle uses packaged Node (`scripts/macos/portable-bundled-runtime.sh`) and does not require ambient `node`, `npm`, or `npx`.
- Signing, notarization, Gatekeeper/quarantine compatibility, platform support readiness, pilot readiness, production readiness, and human-subject readiness remain out of scope and NOT CLAIMED.
