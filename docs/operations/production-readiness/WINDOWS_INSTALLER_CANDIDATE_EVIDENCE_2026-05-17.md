# Windows Installer Candidate Evidence (2026-05-17)

- Commit tested: `6fa4d4d`
- Host: Linux (Codex container)
- Goal: Phase 1 installer-candidate adapter proof, not production readiness.

## Commands run
1. `node scripts/packaging/windows-installer.mjs build`
   - Result: **PARTIAL / FAILED**
   - `app` build passed.
   - `server` build passed.
   - Portable dependency staging started.
   - Runtime archive download failed due to DNS/network lookup (`getaddrinfo EAI_AGAIN nodejs.org`).
   - Installer build step was therefore **NOT RUN**.
2. `git diff --check`
   - Result: **PASS**

## Installer tooling availability
- Inno Setup `ISCC.exe`: **NOT RUN** on this Linux host.
- Windows installer executable generation: **NOT RUN** on this host.

## Evidence and boundaries
- Added thin adapter `scripts/packaging/windows-installer.mjs` that reuses `windows-portable.mjs` staged payload.
- Added Inno Setup script generation (`installer.iss`) and VBS launch/stop shortcuts in staged payload.
- Runtime root convention for installer track: `%LOCALAPPDATA%/DelphiCommons/windows-installer-candidate`.
- Install root target convention: `%LOCALAPPDATA%/Programs/DelphiCommons`.

## Sensitive-material posture
- Adapter reuses packaging-core forbidden-material and overclaim scans during manifest generation.
- This run did not produce a final installer artifact due to upstream runtime download failure.

## Non-claims
- No installer signing evidence.
- No SmartScreen/Defender trust evidence.
- No real Windows install/start/stop/uninstall evidence.
- No no-console-window claim.
- No production/public/human-subjects readiness claim.

## Recommended next work
1. Run adapter on a Windows host with Inno Setup 6 installed.
2. Capture install/start/browser-open/stop/uninstall evidence from clean user profile.
3. Replace VBS+PowerShell launcher with native no-console launcher helper.
4. Add signed installer workflow with timestamping and verification.
