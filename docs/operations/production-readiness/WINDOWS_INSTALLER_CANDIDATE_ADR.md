# Windows Installer Candidate ADR (Internal Engineering)

Date: 2026-05-17
Status: Accepted for Phase 1 internal engineering

## Decision
Use **Inno Setup** as the Phase 1 Windows installer-candidate technology, wrapped by `scripts/packaging/windows-installer.mjs`.

## Option comparison (Phase 1)
- **MSIX**: strong enterprise path, but higher packaging/signing/policy overhead for quick internal iteration.
- **WiX Toolset (MSI)**: long-term viable, but steeper authoring complexity for this stage.
- **NSIS**: viable, but Inno has simpler per-user install defaults and straightforward shortcut/uninstall setup for this repo.
- **Inno Setup (chosen)**: lean setup scripting, Start Menu + optional desktop shortcuts, per-user install without admin, uninstall entry, future signing-compatible output.
- **Self-extracting archive**: not a true installer and weak uninstall/discoverability.

## Why this fits current architecture
- Reuses `scripts/packaging/windows-portable.mjs` staged payload (no duplicate app build logic).
- Keeps installer concerns in packaging layer only; no business logic added.
- Installer-candidate launchers resolve package root from `scripts/windows/installer-candidate/*.vbs` by walking four parent levels and route lifecycle commands through `scripts/windows/installer-candidate-bundled-runtime.ps1`.
- Keeps runtime data in `%LOCALAPPDATA%/DelphiCommons/windows-installer-candidate` and app files under `%LOCALAPPDATA%/Programs/DelphiCommons`.

## Capabilities / constraints
- Start Menu shortcut: **Yes** (`Delphi Commons`).
- Desktop shortcut: **Yes** (optional task in installer).
- Uninstall: **Yes** (Inno uninstall entry).
- Per-user install without admin: **Yes** (`PrivilegesRequired=lowest`).
- Future code-signing path: **Yes** (sign produced `.exe` and timestamp in release flow).
- Upgrade path: **Yes** (stable `AppName/AppVersion/DefaultDirName` evolve to versioned upgrade policy).

## Governance and non-claims
This ADR does not claim production readiness, signed-distribution readiness, SmartScreen reputation, Defender certification, accessibility certification, enterprise deployment readiness, public release readiness, or human-subjects launch readiness.

## Evidence boundary
- Windows installer lifecycle execution evidence: **NOT RUN** unless captured on a real Windows install run.
- Second-machine/clean-profile installer evidence: **NOT RUN** unless captured with dated artifacts.
