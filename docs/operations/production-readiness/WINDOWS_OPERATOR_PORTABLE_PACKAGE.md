# Windows Operator Portable Package (Stage 1 Prototype)

Status: **PORTABLE PACKAGE PROTOTYPE**.
Decision label: **NOT READY FOR HUMAN TESTING**.
Date basis: **2026-05-11**.

## Builder

- Path: `scripts/windows/build-operator-portable-package.ps1`
- Output root: `build/windows-operator-portable`

## Dependency posture (Stage 1)

Chosen posture: **portable package still requires local Node/npm**.

Portable Node runtime bundling is **deferred to a later step**. Therefore this package is not truly standalone and remains an internal prototype.

## Build the package

From repository root in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\build-operator-portable-package.ps1
```

The builder runs frontend and backend builds, stages only selected files, emits a package manifest, and creates a zip artifact.

## Run the packaged operator flow

From the unzipped package root in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 start
```

## Runtime data path

- `%LOCALAPPDATA%\DelphiCommons\windows-operator-portable-candidate`

## Logs/evidence path

- Logs: `%LOCALAPPDATA%\DelphiCommons\windows-operator-portable-candidate\logs`
- Evidence: `%LOCALAPPDATA%\DelphiCommons\windows-operator-portable-candidate\evidence`
- Runtime backend staging: `%LOCALAPPDATA%\DelphiCommons\windows-operator-portable-candidate\server-runtime`

## Package contents (minimum Stage 1)

- `app/dist` frontend build artifact
- `server/dist` backend build artifact
- `server/package.json`
- `server/package-lock.json`
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

- Local Node/npm dependency remains.
- First-run server production dependencies are installed under the runtime data root, not into the package root.
- The package is a portable/internal prototype, not a standalone installer or signed distribution artifact.
- No installer (NSIS/MSI), signing, updater, or Tauri shell.
- No real SMS provider delivery.
- No PWA/service-worker behavior.
- No native mobile app behavior.
- No external AI behavior.

## Explicit non-claims

This prototype does **not** claim production readiness, pilot readiness, real human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, or external AI readiness.

## Next evidence required

- Run from a clean extracted zip directory, separate from the build staging directory.
- Verify on a second Windows machine or clean Windows user profile.
- Decide whether to bundle a portable Node runtime or keep local Node/npm as a documented prerequisite.
- Verify package manifest integrity and included-file inventory for every candidate build.
- Verify limitation messaging remains visible in docs and manifest.

## Local evidence

- [WINDOWS_OPERATOR_PORTABLE_PACKAGE_LOCAL_EVIDENCE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE_LOCAL_EVIDENCE.md)
- [WINDOWS_OPERATOR_PORTABLE_PACKAGE_EXTRACTED_ZIP_EVIDENCE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE_EXTRACTED_ZIP_EVIDENCE.md)
