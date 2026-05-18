# Package Download And Install Guide

Status: **INTERNAL PACKAGE CANDIDATE GUIDE / NOT READY FOR HUMAN TESTING**.

Date basis: 2026-05-18.

This guide is the simple operator-facing path for internal package candidates. Use synthetic or low-risk test data only.

## Current Package Paths

| Platform | Recommended internal path | Operator flow | Current status |
| --- | --- | --- | --- |
| Windows x64 | Installer ZIP bundle | Download the ZIP, unzip it, run the included EXE, launch Delphi Commons from the Start Menu. | Available as internal GitHub release asset |
| Windows x64 fallback | Portable bundled-runtime ZIP | Download the ZIP, unzip it, run `scripts/windows/portable-bundled-runtime.ps1 start`. | Available as internal GitHub release asset |
| macOS Apple Silicon | Installer PKG | Download the PKG, install it, launch with the installed package command/shortcut path documented in the macOS runbook. | Available as internal GitHub release asset |
| macOS Apple Silicon fallback | Portable bundled-runtime ZIP | Download the ZIP, unzip it, run `scripts/macos/portable-bundled-runtime.sh start`. | Available as internal GitHub release asset |

## Current Release Pages

| Platform | Release page |
| --- | --- |
| Windows x64 installer | [`internal-windows-installer-candidate-2026-05-18-r4`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-windows-installer-candidate-2026-05-18-r4) |
| macOS Apple Silicon package | [`internal-macos-package-candidate-2026-05-18`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-macos-package-candidate-2026-05-18) |

The GitHub repository is private, so operators need repository access before these links can be used.

## Windows Installer Flow

1. Download the Windows installer ZIP bundle from the current internal GitHub release.
2. Unzip it to a local folder path you control.
3. Run the included installer EXE.
4. Launch **Delphi Commons** from the Start Menu.
5. If the browser does not open, open `http://127.0.0.1:4173`.
6. Use **Delphi Commons Stop** from the Start Menu when finished.

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

## macOS Installer PKG Flow

1. Download the macOS Apple Silicon installer PKG from the current internal GitHub release.
2. Install the PKG.
3. Start Delphi Commons using the installed package command documented in [MACOS_INSTALLER_RUNBOOK.md](./MACOS_INSTALLER_RUNBOOK.md).
4. Open `http://127.0.0.1:4173` if the browser does not open automatically.
5. Stop Delphi Commons using the installed package stop command.

## macOS Portable ZIP Flow

1. Download the macOS Apple Silicon portable bundled-runtime ZIP.
2. Unzip it to a local folder path you control.
3. Open Terminal in the unzipped package root.
4. Run:

```bash
./scripts/macos/portable-bundled-runtime.sh start
```

5. Open `http://127.0.0.1:4173` if the browser does not open automatically.
6. Stop with:

```bash
./scripts/macos/portable-bundled-runtime.sh stop
```

## Non-Claims

These package paths are internal synthetic/low-risk package candidates. They do not authorize production deployment, real human-subjects research, pilot launch, real participant data, broad platform support, code-signing trust, notarization, SmartScreen/Defender trust, security certification, accessibility certification, real-SMS use, or public release.
