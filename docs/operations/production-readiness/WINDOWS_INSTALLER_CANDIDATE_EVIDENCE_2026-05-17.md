# Windows Installer Candidate Evidence (2026-05-17)

- Commit tested: `6fa4d4d`
- Merged main cleanup commit: `6a45b6d`
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
3. `node scripts/packaging/windows-installer.mjs build` after cleanup
   - Result: **PARTIAL / PASS TO INSTALLER TOOL GATE**
   - Cleanup host: Windows (`win32 x64`).
   - `app` build passed.
   - `server` build passed.
   - Production server dependency staging passed with 0 reported vulnerabilities.
   - Pinned Windows Node runtime staged with selective `node.exe`/`LICENSE` extraction.
   - Installer package manifest verification passed with `{ "ok": true, "failures": [] }`.
   - Installer executable generation was **NOT RUN** because Inno Setup `ISCC.exe` is not installed on this host.

## Installer tooling availability
- Inno Setup `ISCC.exe`: **NOT RUN** on this Linux host.
- Windows installer executable generation: **NOT RUN** on this host.
- Cleanup Windows host Inno Setup `ISCC.exe`: **NOT FOUND**.
- Cleanup Windows installer executable generation: **NOT RUN** because `ISCC.exe` is unavailable.

## Evidence and boundaries
- Added thin adapter `scripts/packaging/windows-installer.mjs` that reuses `windows-portable.mjs` staged payload.
- Added Inno Setup script generation (`installer.iss`) and VBS launch/stop shortcuts in staged payload.
- Runtime root convention for installer track: `%LOCALAPPDATA%/DelphiCommons/windows-installer-candidate`.
- Install root target convention: `%LOCALAPPDATA%/Programs/DelphiCommons`.

## Cleanup review
- Static review found the initial VBS launch/stop shortcuts resolved the package root incorrectly from `scripts/windows/installer-candidate`, producing a `scripts\scripts\windows\portable-bundled-runtime.ps1` path.
- Static review also found the initial shortcut path delegated to the portable wrapper, which would have used the portable runtime subdirectory instead of `%LOCALAPPDATA%/DelphiCommons/windows-installer-candidate`.
- Cleanup changed the generated shortcuts to call an installer-specific PowerShell wrapper in `scripts/windows/installer-candidate`.
- The installer wrapper sets packaged Node, packaged `server/node_modules`, disabled runtime `npm ci`, and the installer-specific runtime root before delegating to `portable-operator-candidate.ps1`.
- Browser opening is left to the lifecycle script after readiness instead of a fixed VBS sleep.
- Optional desktop shortcut generation targets the current user's desktop for the per-user installer path.
- Windows runtime staging now extracts only the required `node.exe` and `LICENSE` from the pinned Node ZIP, avoiding full-archive `Expand-Archive` failures under long workspace paths.
- Static cleanup checks run locally: `node --check scripts/packaging/windows-installer.mjs`, `node scripts/packaging/tests/packaging-core.test.mjs`, and `node scripts/packaging/tests/package-verification.test.mjs` passed.
- Post-GitHub-reconciliation checks also passed: `node scripts/packaging/tests/windows-installer.test.mjs`, `node scripts/packaging/tests/windows-portable-package.test.mjs`, and `node scripts/packaging/windows-installer.mjs verify`.
- Real Windows Inno Setup build/install/start/stop/uninstall evidence remains **NOT RUN** until executed on a Windows host with `ISCC.exe`.

## Sensitive-material posture
- Adapter reuses packaging-core forbidden-material and overclaim scans during manifest generation.
- Initial run did not produce a final installer artifact due to upstream runtime download failure.
- Cleanup run did not produce a final installer artifact because `ISCC.exe` was unavailable on the Windows host.

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
