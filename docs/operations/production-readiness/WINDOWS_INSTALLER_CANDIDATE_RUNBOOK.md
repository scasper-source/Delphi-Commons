# Windows Installer Candidate Runbook (Phase 1 Internal Engineering)

## Scope
Internal engineering and mock-trial preparation only.

## Tester flow (target)
1. Download installer artifact.
2. Double-click installer.
3. Install Delphi Commons.
4. Open Start Menu and click **Delphi Commons**.
5. Local services start and default browser opens to `http://127.0.0.1:4173`.

## Build command (engineering)
- `node scripts/packaging/windows-installer.mjs build`

## Expected outputs
- `build/windows-installer/staging/.../delphi-commons-windows-installer-candidate-internal/` (staged payload)
- `build/windows-installer/package-verification.json` with package-verification result
- `build/windows-installer/INSTALLER_NOT_RUN.txt` when not on Windows or ISCC missing
- `build/windows-installer/delphi-commons-windows-installer-candidate-internal.exe` when built on Windows with Inno Setup

## Runtime/data separation
- Installed app payload: `%LOCALAPPDATA%\Programs\DelphiCommons`
- Runtime data/logs/backups/exports: `%LOCALAPPDATA%\DelphiCommons\windows-installer-candidate`
- Uninstall removes installed app files; runtime data is preserved unless explicitly deleted.

## Start/stop/status user operations (Phase 1)
- Start Menu shortcut: **Delphi Commons** (launch/start/browser open)
- Start Menu shortcut: **Delphi Commons Stop** (stop local services)
- Start Menu shortcut: **Delphi Commons Status** (status)
- Smoke for engineering fallback remains script-based today and is a Phase 2 UX gap.

## Troubleshooting
- If browser does not open, manually open `http://127.0.0.1:4173` once and check whether Delphi Commons UI loads.
- If app does not start, collect runtime logs from `%LOCALAPPDATA%\DelphiCommons\windows-installer-candidate\logs`.
- If installer artifact is not produced, check `build/windows-installer/INSTALLER_NOT_RUN.txt` for reason.

## Explicit non-claims
- No code-signing / SmartScreen / Defender trust claim.
- No production/public/human-subjects readiness claim.
- No enterprise deployment claim.
- No accessibility/security certification claim.
