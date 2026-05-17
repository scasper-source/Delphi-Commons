# Windows Installer Candidate Evidence Template

Status: template only until executed with attached artifacts.

- Date:
- Commit hash:
- Host OS:
- Installer tool availability (`ISCC.exe`):
- Build command(s):
- Output path(s):

## Build and packaging
- Portable payload staging: NOT RUN
- Installer adapter run: NOT RUN
- Installer artifact generated: NOT RUN
- Checksums/manifests captured: NOT RUN

## Launch lifecycle
- Install step run: NOT RUN
- Start Menu launch run: NOT RUN
- Desktop shortcut run (optional): NOT RUN
- Browser auto-open run: NOT RUN
- Command window hidden/visible check: NOT RUN
- Stop shortcut run: NOT RUN
- Status/smoke run: NOT RUN
- Uninstall run: NOT RUN

## Data/privacy checks
- Runtime data location confirmed user-writable path: NOT RUN
- Program Files data write check: NOT RUN
- Sensitive artifact scan (no `.env`, DB, logs, tokens, identity maps in installer payload): NOT RUN

## Limitations / NOT RUN
- 

## Non-claims
- No code-signing/SmartScreen/Defender readiness claim.
- No production/public/human-subjects readiness claim.
- No enterprise deployment or certification readiness claim.

## Next recommended work
- Replace script/VBS launcher with a no-console native launcher helper.
- Add user-facing Status shortcut with no command shell exposure.
- Add signed-installer release path with timestamping and verification evidence.
