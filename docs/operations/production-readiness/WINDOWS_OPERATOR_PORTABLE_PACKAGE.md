# Windows Operator Portable Package

Status: **PORTABLE PACKAGE PROTOTYPE / BUNDLED-RUNTIME RELEASE-ASSET SMOKE RECORDED**.
Decision label: **NOT READY FOR HUMAN TESTING**.
Date basis: **2026-05-14**.

## Builder

- Stage 1 legacy builder: `scripts/windows/build-operator-portable-package.ps1`
- Bundled-runtime hardening builder: `scripts/windows/portable-bundled-runtime.ps1 build`
- Bundled-runtime packaging core: `scripts/packaging/windows-portable.mjs`
- Bundled-runtime output root: `build/windows-portable-bundled-runtime-internal`
- Latest bundled-runtime package pointer: `build/windows-portable-bundled-runtime-internal/latest-package-root.txt`

## Dependency posture

Stage 1 legacy package: **local Node/npm required at runtime**.

Bundled-runtime hardening track: **local Node/npm are still required at build time**, but the staged internal package is designed so lifecycle commands use a packaged Windows `node.exe` and build-time production server dependencies. A downloaded `r2` GitHub release asset smoke is recorded for one local Windows user profile; clean-profile or second-machine evidence remains required before closing Phase 2.

Bundled-runtime package rules:

- Node runtime source and SHA256 are pinned in `docs/adr/runtime/node-windows-x64.json`.
- The package stages `runtime/node/node.exe`.
- npm is not staged into the runtime and is not used by lifecycle commands.
- Production server dependencies are installed during package build and staged under `server/node_modules`.
- Runtime data remains under `%LOCALAPPDATA%\DelphiCommons\windows-portable-bundled-runtime-internal`, never inside the package root.
- Default network binding remains `127.0.0.1`.

## Build the bundled-runtime package

From repository root in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-bundled-runtime.ps1 build
```

The builder runs frontend and backend builds, installs production server dependencies into a build staging directory, verifies the pinned Node runtime archive by SHA256, stages selected files, emits a package manifest, and writes an evidence template.

## Verify the bundled-runtime package

After a successful build:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-bundled-runtime.ps1 verify
```

Verification checks manifest inventory/checksums, runtime metadata, packaged `node.exe`, staged `server/node_modules`, and lifecycle script guardrails against ambient `node`, `npm`, or `npx` use at runtime.

## Run the packaged operator flow

From the unzipped package root in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-bundled-runtime.ps1 start
```

The same wrapper supports `status`, `smoke`, `backup`, `restart`, `stop`, and `reset`.

## Runtime data path

- Stage 1 legacy package: `%LOCALAPPDATA%\DelphiCommons\windows-operator-portable-candidate`
- Bundled-runtime package: `%LOCALAPPDATA%\DelphiCommons\windows-portable-bundled-runtime-internal`

## Logs/evidence path

- Logs: `%LOCALAPPDATA%\DelphiCommons\<runtime-subdir>\logs`
- Evidence: `%LOCALAPPDATA%\DelphiCommons\<runtime-subdir>\evidence`
- Runtime backend staging: `%LOCALAPPDATA%\DelphiCommons\<runtime-subdir>\server-runtime`

## Package contents (bundled-runtime hardening track)

- `app/dist` frontend build artifact
- `server/dist` backend build artifact
- `server/package.json`
- `server/package-lock.json`
- `server/node_modules` production dependencies staged at build time
- `runtime/node/node.exe` pinned Windows Node runtime executable
- `runtime/node/LICENSE`
- `scripts/windows/portable-bundled-runtime.ps1`
- `scripts/windows/portable-operator-candidate.ps1`
- `tools/static-file-server.mjs`
- `README.txt`
- `package-manifest.json`
- `LICENSE`
- `NOTICE`

## Safety rules

- No destructive cleanup outside package output root.
- Cleanup paths are validated to remain inside output root.
- Source control metadata is not copied.
- Runtime data is not copied.
- Logs/exports/backups/evidence artifacts are not copied.
- `.env`, credentials, keys, tokens, and secrets are not copied.

## Limitations

- Local Node/npm dependency remains for package build.
- Runtime no-local-Node behavior is implemented for package lifecycle commands and covered by package verification; the downloaded `r2` release asset has local one-profile smoke evidence. Clean-machine or clean-profile evidence remains required before closing Phase 2.
- Lifecycle evidence for the bundled-runtime package is recorded for the `r2` GitHub release asset start/status/browser/smoke/stop path. Backup, restart, reset, clean-profile, and second-machine evidence remain separate gates unless a named run records them.
- The package is a portable/internal prototype, not a standalone installer or signed distribution artifact.
- No installer (NSIS/MSI), signing, updater, or Tauri shell.
- No real SMS provider delivery.
- No PWA/service-worker behavior.
- No native mobile app behavior.
- No external AI behavior.

## Explicit non-claims

This prototype does **not** claim production readiness, pilot readiness, real human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, or external AI readiness.

## Next evidence required

- Verify on a second Windows machine or clean Windows user profile.
- Build and verify a named bundled-runtime package artifact.
- Run bundled-runtime lifecycle evidence from the extracted package for backup, restart, reset, and clean-profile/second-machine coverage.
- Verify package manifest integrity and included-file inventory for every candidate build.
- Verify limitation messaging remains visible in docs and manifest.

## Local evidence

- 2026-05-14 current-branch bundled-runtime validation: build, package verify, focused packaging tests, and staged lifecycle commands passed locally on Windows using packaged Node 24.15.0. Lifecycle sequence covered `status`, stopped-state `reset`, `start`, `status`, `smoke`, `backup`, `restart`, `status`, `smoke`, `stop`, and final `status`. This is not second-machine, clean-profile, signing, SmartScreen, Defender, or Windows platform-support evidence.
- 2026-05-14 GitHub `r2` release asset smoke: downloaded release zip, extracted under a path with spaces, `start`, browser UI reachability, `status`, `smoke`, and `stop` passed. Evidence: [WINDOWS_PORTABLE_BUNDLED_RUNTIME_RELEASE_ASSET_EVIDENCE_2026-05-14.md](./WINDOWS_PORTABLE_BUNDLED_RUNTIME_RELEASE_ASSET_EVIDENCE_2026-05-14.md). This is not second-machine, clean-profile, signing, SmartScreen, Defender, installer, or Windows platform-support evidence.
- [WINDOWS_OPERATOR_PORTABLE_PACKAGE_LOCAL_EVIDENCE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE_LOCAL_EVIDENCE.md)
- [WINDOWS_OPERATOR_PORTABLE_PACKAGE_EXTRACTED_ZIP_EVIDENCE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE_EXTRACTED_ZIP_EVIDENCE.md)
- [WINDOWS_PORTABLE_BUNDLED_RUNTIME_RELEASE_ASSET_EVIDENCE_2026-05-14.md](./WINDOWS_PORTABLE_BUNDLED_RUNTIME_RELEASE_ASSET_EVIDENCE_2026-05-14.md)
- [WINDOWS_SIGNING_DISTRIBUTION_LIMITATIONS.md](./WINDOWS_SIGNING_DISTRIBUTION_LIMITATIONS.md)
