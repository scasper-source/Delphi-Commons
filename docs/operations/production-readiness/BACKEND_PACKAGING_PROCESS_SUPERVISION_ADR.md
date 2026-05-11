# Backend Packaging and Process Supervision ADR

- Status: **ACCEPTED FOR PHASE 2 PLANNING**.
- Implementation status: **STAGE 1 PROTOTYPE IMPLEMENTED (scripts/documentation baseline)**.
- Date basis: **2026-05-11**.
- Track: **`human_testing_candidate`**.

## Purpose

Define the Phase 2 planning decision for how the local Node/Fastify backend is bundled, launched, supervised, health-checked, stopped, logged, and protected from orphaning/corrupting local runtime data for the first Windows downloadable human testing candidate.

This ADR is architecture and safety guidance only. It does not implement Tauri, installer flow, Windows packaging scripts, native mobile, real SMS delivery, PWA/service worker behavior, or external AI.

## Decision Summary

Adopt a conservative staged path:

1. **Stage 1 (first implementation target): internal Windows portable candidate with an explicit operator launcher/supervisor process.**
   - Bundle built frontend assets + built backend server artifact + portable Node runtime.
   - Use a visible operator launcher that starts the backend, waits for health, opens operator UI, monitors process lifecycle, and performs graceful shutdown.
   - Keep runtime data outside source tree and package directory.

2. **Stage 2: Tauri v2 desktop shell using the same backend supervision contract proven in Stage 1.**
   - Tauri is deferred until Stage 1 evidence exists.
   - Tauri shell may replace browser opening behavior, but backend lifecycle/safety rules remain unchanged.

3. **Stage 3: installer/signing/updater after evidence and separate ADR approvals.**
   - No installer/signing/updater implementation in this ADR.

## Options Considered

| Option | Fit for first Windows human_testing_candidate | Key strengths | Key concerns / why not first |
| --- | --- | --- | --- |
| Tauri sidecar launching backend | **Planned Stage 2** | Native-feeling shell, good long-term desktop path. | Adds shell complexity before backend lifecycle contract is proven; defer until Stage 1 evidence. |
| Bundled portable Node runtime + built server | **Selected for Stage 1** | Lowest change risk; reuses existing Node/Fastify runtime behavior; explicit operator process control. | Larger package; requires careful runtime path and process supervision discipline. |
| Node SEA / single executable | Deferred | Potentially simpler operator artifact in future. | Runtime compatibility and native-module behavior risk; slower iteration for first candidate. |
| Electron | Rejected for near-term path | Mature ecosystem. | Larger runtime footprint and duplicate desktop stack relative to Tauri planning direction. |
| Docker Desktop | Rejected for first candidate | Repeatable container runtime. | Poor fit for non-engineering operator workflow; heavy dependency for human testing candidate. |
| Browser-only dev scripts | Rejected for first downloadable candidate | Minimal packaging work. | Does not meet “downloadable operator-ready candidate” objective cleanly for non-dev operators. |
| Hosted staging / cloud-only | Rejected for this track | Easier remote access. | Conflicts with local operator-managed candidate intent and deferred hosted topology ADRs. |
| Native OS service/background daemon | Rejected by default | Could auto-start/recover. | Violates transparency goal for first candidate; hidden background behavior increases operator risk. |

## Required Decision Points

### Decided now

- **Backend artifact shape:** built Node server app + pinned portable Node runtime directory.
- **Frontend artifact shape:** built static frontend bundle served by local backend (or equivalent local operator UI target).
- **Startup command:** operator-visible launcher command starts supervisor -> launches backend child process -> blocks until health-check passes -> opens UI.
- **Stop/shutdown command:** explicit operator stop command performs graceful shutdown request first, then bounded forced kill if timeout.
- **Health check endpoint/behavior:** `/health` on local backend must report process ready state and basic dependency readiness for operator use.
- **Port selection/collision behavior:** default fixed localhost port with collision check; on collision, fail with explicit operator message (no silent random port for Stage 1).
- **Single-instance behavior:** enforce single running candidate per runtime directory via lock file + PID metadata.
- **Runtime data directory:** outside source tree, outside package binaries, under operator profile path.
- **Database path:** runtime data directory `/db` subtree.
- **Audit log path:** runtime data directory `/audit` subtree.
- **Export path:** runtime data directory `/exports` subtree.
- **Backup path:** runtime data directory `/backups` subtree.
- **Evidence/log path:** runtime data directory `/evidence` and `/logs` subtrees.
- **stdout/stderr strategy:** tee backend stdout/stderr to rotating log files and supervisor console output.
- **Crash handling:** supervisor detects unexpected backend exit, records exit code + timestamp, shows operator-visible failure state, preserves logs.
- **Orphan-process prevention:** backend launched as child of supervisor with process-group termination on stop/exit; stale PID lock cleanup on start after validation.
- **Reset behavior:** explicit reset command requires stopped backend, archives current runtime data snapshot, then resets selected working data.
- **Backup behavior:** explicit backup command uses consistent snapshot procedure with manifest and timestamp.
- **Corruption prevention/runtime data locking:** single-instance lock + graceful shutdown before reset/backup-sensitive operations.
- **LAN phone-testing exposure policy:** deferred feature, disabled by default in Stage 1.
- **Localhost-only default:** bind backend to `127.0.0.1` by default.
- **Secrets/env handling:** load from local operator env/config outside repo/package; no secrets committed or bundled.

### Explicitly deferred

- Dynamic multi-instance port pools.
- Background auto-start service mode.
- LAN/TLS exposure modes.
- Production-grade high-availability or clustered process supervision.

## Required Local-Server Safety Rules

For `human_testing_candidate`, implementation must enforce:

- Backend binds to `127.0.0.1` by default.
- No LAN exposure unless a future explicit operator phone-testing mode is implemented under a separate ADR.
- No interpretation as production deployment approval.
- No real participant data for this candidate track without separate approvals.
- No secrets in repository or packaged artifacts.
- Runtime data stored outside source tree.
- No hidden background service by default.
- Clear shutdown behavior with bounded timeout and logged outcome.
- Clear operator-visible failure state when launch or health check fails.

## Recommended Implementation Contract for Prompt 3

Prompt 3 should build **Stage 1 only**:

1. Internal Windows portable candidate structure (artifact layout + runtime-directory policy).
2. Operator launcher/supervisor entrypoint with start/stop/status/health behaviors.
3. Backend lifecycle contract (launch, health wait, log capture, graceful shutdown, forced kill fallback).
4. Runtime path contract (`db`, `audit`, `exports`, `backups`, `logs`, `evidence`).
5. Single-instance lock + stale lock recovery logic.
6. Reset and backup commands with safety checks.
7. Explicit limitation messaging (localhost-only, no installer, no signing, no updater, no real SMS, no PWA/service worker, no external AI).

Prompt 3 should **not** implement Tauri shell yet. Tauri is the next stage after Stage 1 evidence.

## Evidence Requirements for Prompt 4

Prompt 4 evidence must include, at minimum:

- Launch evidence (command + output + resulting process IDs).
- Backend health evidence (`/health` success and failure-path example).
- Operator UI open evidence.
- Stop evidence (graceful then forced-kill path if needed).
- Restart evidence.
- Reset evidence (pre/post state with archive/snapshot reference).
- Backup evidence (backup artifact + manifest).
- Export evidence (artifact path and generated output example).
- Runtime data path evidence (showing data outside source tree).
- Known limitations list.
- Explicit no-overclaim statement (not production/pilot/human-subject-ready/certified/signed/installer-ready/etc.).

## Deferred ADRs (Explicit)

Keep deferred unless separately decided:

1. Windows signing/distribution path.
2. macOS signing/notarization/distribution path.
3. WebView2 runtime strategy.
4. LAN phone-testing mode and TLS/network exposure.
5. Real SMS provider/compliance/log-retention model.
6. PWA/service-worker enablement.
7. Updater/signing-key custody.
8. Hosted pilot/production topology.
9. Native mobile wrapper/distribution strategy.
10. External AI connector mode.

## Linkage

- [Phase 1 Product Surface Lock](./PHASE1_PRODUCT_SURFACE_LOCK.md)
- [Phase 1 Product Surface Lock closeout](./PHASE1_PRODUCT_SURFACE_LOCK_CLOSEOUT.md)
- [Install Architecture Decision Record](./INSTALL_ARCHITECTURE_DECISION_RECORD.md)
- [Product Readiness Plan for eDelphi](./PRODUCTION_READY_EDELPHI_PLATFORM.md)


## Implementation Note (2026-05-11)

- Stage 1 script/documentation prototype reference: [WINDOWS_OPERATOR_CANDIDATE_PROTOTYPE.md](./WINDOWS_OPERATOR_CANDIDATE_PROTOTYPE.md).
- Stage 1 portable package prototype reference: [WINDOWS_OPERATOR_PORTABLE_PACKAGE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE.md).
- Current implementation remains local-script based and internal; portable Node bundling, Tauri Stage 2, and installer/signing stay deferred.
