# ADR: macOS Installable Operator Candidate

## Status
Proposed (Phase 2/3 readiness track, internal-only candidate).

## Decision
Use a **new parallel macOS installer track** that produces a `.pkg` candidate when built on a real Mac with `pkgbuild`; retain existing macOS portable bundled-runtime flow unchanged.

## 1) Artifact strategy
- Primary: `.pkg` internal operator candidate.
- Optional `.dmg`: deferred unless needed; not required for this Phase 2 checkpoint.
- Rationale: keeps adapter thin by reusing packaged portable payload + packaging core checks; avoids replacing stable portable path.

## 2) Install/runtime locations
- Immutable app/package payload target: `/Applications/Delphi Commons/package` (installer payload root).
- Mutable runtime root: `~/Library/Application Support/DelphiCommons/macos-installer-candidate`.
- Runtime logs/backups/exports/evidence/reset snapshots remain under runtime root only.

## 3) Launcher/operator model
- Minimal surface: installed command wrapper (`delphi-commons`) using packaged runtime.
- No LaunchAgent/background daemon in this phase.
- Operator lifecycle commands: `start|stop|status|restart|smoke|backup|restore|reset|uninstall`.

## 4) Runtime model
- Bundled pinned Node runtime is required and used.
- Built frontend + backend + production dependencies are staged from shared packaging flow.
- Runtime requires no local Node/npm.
- Build still requires local Node/npm.

## 5) Security/privacy posture
- Default local bind remains `127.0.0.1`.
- No packaged runtime DB/logs/backups/exports/evidence.
- No secrets or `.env` in package.
- Runtime state isolated under operator profile root.

## 6) Signing/notarization/Gatekeeper posture
- Implement only when credentials and Mac-host execution evidence exist.
- Default status in this branch: unsigned internal candidate; notarization NOT RUN; Gatekeeper NOT RUN unless executed and recorded.

## 7) Uninstall/reset posture
- Uninstall: documented manual uninstall removes app payload; runtime data preserved unless operator explicitly removes it.
- Reset: idempotent, with backup snapshot before destructive cleanup.

## 8) Evidence gate
Before claiming usable for controlled internal Mac testing, require:
1. Real Mac build logs + package checksum evidence.
2. Install/start/status/smoke/restart/stop/backup/restore/reset evidence.
3. Runtime path separation verification evidence.
4. Forbidden material and overclaim scans passing.

One-machine success is not broad macOS support readiness.

## Non-claims
- Not production/pilot/human-subjects readiness.
- Not notarization, App Store, or public distribution readiness.
- Not broad macOS support claim.
