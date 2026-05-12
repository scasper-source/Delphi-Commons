# macOS Operator Portable Package (Phase 2 Prototype/Internal)

Status: **MACOS PORTABLE PACKAGE PROTOTYPE / NOT RUN**.
Decision label: **NOT READY FOR HUMAN TESTING**.
Date basis: **2026-05-12**.

## Scope

This document covers the scaffolded internal macOS portable operator package path for Phase 2. It is implementation scaffolding only.

macOS evidence is **NOT RUN** until lifecycle execution is completed on a real Mac.

## Builder

- Path: `scripts/macos/build-operator-portable-package.sh`
- Output root (default): `build/macos-operator-portable`

## Lifecycle launcher

- Path: `scripts/macos/portable-operator-candidate.sh`
- Supported commands: `status`, `start`, `stop`, `restart`, `smoke`, `backup`, `reset`

Backend and UI are configured for localhost-only binding (`127.0.0.1`).

Reset refuses while running.

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
- [Windows Operator Portable Package (Stage 1 Prototype)](./WINDOWS_OPERATOR_PORTABLE_PACKAGE.md)
- [Product Readiness Plan for eDelphi](./PRODUCTION_READY_EDELPHI_PLATFORM.md)
