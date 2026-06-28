# Package Download And Install Guide

Status: **INTERNAL PACKAGE CANDIDATE GUIDE / NOT READY FOR HUMAN TESTING**.

Date basis: 2026-06-28.

This guide is the simple operator-facing path for internal package candidates. Use synthetic or low-risk test data only.

## Current Package Paths

| Platform | Recommended internal path | Operator flow | Current status |
| --- | --- | --- | --- |
| Windows x64 | Installer ZIP bundle | Download the ZIP, unzip it, run the included EXE, launch Delphi Commons from the Desktop or Start Menu, and close the Delphi Commons window when finished. | Available as internal GitHub release asset |
| Windows x64 fallback | Portable bundled-runtime ZIP | Download the ZIP, unzip it, run `scripts/windows/portable-bundled-runtime.ps1 start`. | Available as internal GitHub release asset |
| macOS Apple Silicon | Installer ZIP bundle | Download the ZIP bundle, unzip it, run the included PKG, then open `/Applications/Delphi Commons/Delphi Commons.app`. Browser fallback is `http://127.0.0.1:4173`. Closing the browser window is **not proven** to stop macOS runtime. | Available as corrected internal GitHub release asset |

## Current Release Pages

| Platform | Release page |
| --- | --- |
| Windows x64 installer | [`internal-windows-installer-candidate-2026-06-28-r2`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-06-28-r2) |
| macOS Apple Silicon package | [`internal-macos-package-candidate-2026-06-28-r2`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-macos-package-candidate-2026-06-28-r2) |

The GitHub repository is private, so operators need repository access before these links can be used.

The prior May release pages remain in GitHub only as archived/superseded traceability records.

## Windows Installer Flow

1. Download the Windows installer ZIP bundle from the current internal GitHub release.
2. Unzip it to a local folder path you control.
3. Run the included installer EXE.
4. Launch **Delphi Commons** from the Desktop or Start Menu.
5. If the browser does not open, open `http://127.0.0.1:4173` while the app is running.
6. When finished, close the Delphi Commons browser app window; this stops the local runtime.

## Windows Portable ZIP Flow

1. Download the Windows portable bundled-runtime ZIP.
2. Unzip it to a local folder path you control.
3. Open PowerShell in the unzipped package root.
4. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-bundled-runtime.ps1 start
```

5. Open `http://127.0.0.1:4173` if the browser does not open automatically.
6. Stop with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-bundled-runtime.ps1 stop
```

## macOS Installer Bundle Flow

1. Download `delphi-commons-macos-arm64-installer-internal-internal-macos-package-candidate-2026-06-28-r2-18faba2.zip` from the current internal GitHub release.
2. Unzip it to a local folder path you control.
3. Run the included PKG.
4. Open `/Applications/Delphi Commons/Delphi Commons.app`.
5. If the browser does not show Delphi Commons, open `http://127.0.0.1:4173` while the supervised run is active.
6. macOS lifecycle gap: closing the visible browser/app window is **IMPLEMENTATION_REQUIRED / HUMAN_REQUIRED** and is **not proven** to stop the local runtime. For supervised internal runs only, end the runtime with the admin stop command documented in the macOS runbook. Do not present Stop or Status as normal user shortcuts.

## macOS Developer/Admin Portable Flow

The macOS portable bundled-runtime wrapper remains developer/admin package machinery. Do not present it as the normal operator release package.

For local engineering work only, open Terminal in a staged package root and run:

```bash
./scripts/macos/portable-bundled-runtime.sh
```

If the browser does not show Delphi Commons, open `http://127.0.0.1:4173` while the supervised run is active.

For supervised internal runs only, end the runtime with this admin command:

```bash
./scripts/macos/portable-bundled-runtime.sh stop
```

Do not present Stop or Status as normal user shortcuts.

## Non-Claims

These package paths are internal synthetic/low-risk package candidates. They do not authorize production deployment, real human-subjects research, pilot launch, real participant data, broad platform support, code-signing trust, notarization, SmartScreen/Defender trust, security certification, accessibility certification, real-SMS use, or public release.
