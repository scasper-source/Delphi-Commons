# Windows installer-candidate packaging hardening (internal) — 2026-05-17

This note records **internal synthetic/low-risk packaging hardening only** for Windows installer-candidate launchers and runtime-root wiring.

## What changed

- Installer-candidate launcher generation now resolves package root from `scripts\windows\installer-candidate\*.vbs` back to the actual package root (`<package>`), preventing `scripts\scripts\...` path construction.
- Installer-candidate lifecycle now uses `scripts/windows/installer-candidate-bundled-runtime.ps1`, a thin adapter over `portable-bundled-runtime.ps1` that sets installer runtime path conventions:
  - `EDELPHI_RUNTIME_SUBDIR=windows-installer-candidate`
  - default runtime root `%LOCALAPPDATA%\DelphiCommons\windows-installer-candidate`

## Scope and non-claims

- No production readiness claim.
- No pilot readiness claim.
- No real human-subjects readiness claim.
- No installer readiness claim from code changes alone.
- No signing, SmartScreen, Defender, or platform-support readiness claim.
- No second-machine or clean-profile installer lifecycle evidence is included here.

## Evidence status

- Installed-package lifecycle evidence: **NOT RUN** in this change.
- Clean-profile/second-machine evidence: **NOT RUN** in this change.

