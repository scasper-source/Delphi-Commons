# macOS Installer Real-Mac Build Evidence - 2026-05-16

Status: **PARTIAL / INSTALL BLOCKED**

This records a real macOS operator-machine build attempt for the internal macOS installable operator candidate. It is internal synthetic/low-risk operator-machine evidence only. It is not production, pilot, human-subjects, broad macOS support, notarization, App Store, security-certification, accessibility-certification, or real-SMS readiness evidence.

## Scope Boundary

- Test data posture: synthetic/low-risk only.
- Real participant data: **NOT USED**.
- Real SMS/Twilio behavior: **NOT RUN**.
- Public release, notarization, App Store, support-matrix, security, or accessibility certification claims: **NOT MADE**.
- Device privacy note: serial number, hardware UUID, and provisioning UDID were observed only in local system tooling output and are intentionally not recorded here.

## Host And Repo Facts

| Item | Result |
| --- | --- |
| Mac model | MacBook Air, Model Identifier Mac15,12 |
| Chip architecture | Apple M3 / arm64 |
| macOS version | macOS 15.6, Build 24G84 |
| Repo path | `/Users/karenbuckle/edelphi-test/Delphi-Commons` |
| Branch | `main` |
| Commit hash used for package manifest | `fd0ad96568aeb796b2e0ea9e7432ec31ef78d160` |
| Working tree before local fixes | Clean after fast-forward to `origin/main` |
| Working tree after local fixes | Modified files listed below; not committed |
| Build-time Node | `v24.15.0` |
| Build-time npm | `11.12.1` |
| `pkgbuild` | PASS: `/usr/bin/pkgbuild` present and executed |
| `productbuild` | PASS: `/usr/bin/productbuild` present |
| `xcrun notarytool` | PRESENT: `1.0.0 (38)` |
| Signing credentials | NOT RUN / CREDENTIALS UNAVAILABLE: `security find-identity -v -p codesigning` reported `0 valid identities found` |
| Notarization credentials | NOT RUN / CREDENTIALS UNAVAILABLE: notarization-related environment/profile hints were unset |
| Gatekeeper/quarantine | NOT RUN: local install did not complete |

## Implementation Inspection

| Check | Result | Notes |
| --- | --- | --- |
| macOS installer is thin adapter over shared packaging core | PASS | `scripts/packaging/macos-installer.mjs` stages the macOS portable bundled-runtime package, then wraps it in a `.pkg`; core manifest/checksum/verification helpers remain in `scripts/packaging/core`. |
| Package-core logic duplicated unnecessarily | PASS WITH FIX | Local fix added installer-specific wrapper generation and latest-package-root tracking without copying package-core logic. |
| Windows packaging untouched unless required | PASS | No Windows packaging script was changed in this pass. |
| Portable macOS packaging preserved as separate track | PASS WITH FIX | Portable default runtime path remains unchanged; lifecycle script now allows an installer-specific runtime-root override. |

## Local Fixes Applied Before Final Build

| File | Change |
| --- | --- |
| `docs/adr/runtime/node-macos-arm64.json` | Corrected the pinned SHA256 for `node-v24.15.0-darwin-arm64.tar.gz` to the official Node.js v24.15.0 SHASUMS value: `372331b969779ab5d15b949884fc6eaf88d5afe87bde8ba881d6400b9100ffc4`. |
| `scripts/macos/portable-bundled-runtime.sh` | Preserved all lifecycle arguments so `restore [path]` is not dropped. |
| `scripts/macos/portable-operator-candidate.sh` | Added `EDELPHI_RUNTIME_ROOT` override while preserving the portable default runtime directory. |
| `scripts/packaging/macos-portable.mjs` | Narrowed the ambient-runtime guard to detect command invocations rather than the legitimate bundled runtime path `runtime/node/bin/node`. |
| `scripts/packaging/macos-installer.mjs` | Added installer runtime-root wrapper generation, latest package-root tracking, package verification output, install/runtime location manifest fields, and macOS packaging tool availability fields. |

## Validation Before Installer Build

| Command | Status | Result |
| --- | --- | --- |
| `npm --prefix app run build` | PASS | Vite production build completed; 42 modules transformed. |
| `npm --prefix server run build` | PASS | TypeScript build completed. |
| `node scripts/packaging/tests/packaging-core.test.mjs` | PASS | 8 passed, 2 skipped, 0 failed. |
| `node scripts/packaging/tests/package-verification.test.mjs` | PASS | 4 passed, 0 failed. |
| macOS-installer-specific tests | NOT RUN | No macOS-installer-specific test file exists under `scripts/packaging/tests`. |
| `git diff --check` | PASS | No whitespace errors. |

## Installer Build

| Command | Status | Result |
| --- | --- | --- |
| `node scripts/packaging/macos-installer.mjs build` initial run | FAIL | Runtime provenance gate failed because the repo-pinned macOS runtime SHA did not match the official Node.js v24.15.0 SHASUMS value. |
| `node scripts/packaging/macos-installer.mjs build` second run | FAIL | macOS portable guard falsely treated packaged path text `runtime/node/bin/node` as an ambient `node` command. |
| `node scripts/packaging/macos-installer.mjs build` final run | PASS | App/server builds passed, production server dependencies staged with 0 npm vulnerabilities reported by `npm ci`, and `pkgbuild` wrote the package. |
| `node scripts/packaging/macos-installer.mjs verify` | PASS | Package verification succeeded. |

## Artifacts

| Artifact | Path / Value |
| --- | --- |
| Installer package | `build/macos-installer/delphi-commons-macos-installer-internal.pkg` |
| Package checksum | `4fade93b8d7b2e48fd58df22da8f279b37e9bbb2e0398757c1cb2e3c77388b13` |
| Package verification result | `build/macos-installer/package-verification.json` with `{ "ok": true, "failures": [] }` |
| Checksum inventory | `build/macos-installer/checksums.json` |
| Latest staged package root | `build/macos-installer/latest-package-root.txt` |
| Expanded inspection scratch path | `/private/tmp/delphi-commons-pkg-expanded-20260516-2006` |

## Manifest Checks

| Manifest field | Result |
| --- | --- |
| Package name | `delphi-commons-macos-installer-internal` |
| Package version | `0.0.0-internal` |
| Commit hash | `fd0ad96568aeb796b2e0ea9e7432ec31ef78d160` |
| Build timestamp | `2026-05-17T00:05:44.058Z` |
| Platform / architecture | `macos` / `arm64` |
| Node runtime version | `24.15.0` |
| Runtime source | `https://nodejs.org/dist/v24.15.0/node-v24.15.0-darwin-arm64.tar.gz` |
| Runtime SHA256 | `372331b969779ab5d15b949884fc6eaf88d5afe87bde8ba881d6400b9100ffc4` |
| Runtime license | `Node.js license (MIT-like, see bundled LICENSE)` |
| Bundled runtime location | `runtime/node` |
| Node executable | `runtime/node/bin/node` |
| npm included / used at runtime | `false` / `false` |
| Build-time dependency posture | `Node/npm required at build time` |
| Runtime dependency posture | `No local Node/npm required at runtime; packaged runtime used` |
| Install location | `/Applications/Delphi Commons/package` |
| Runtime data location | `~/Library/Application Support/DelphiCommons/macos-installer-candidate` |
| Network bind address | `127.0.0.1` |
| Signing status | `NOT RUN / CREDENTIALS UNAVAILABLE` |
| Notarization status | `NOT RUN / CREDENTIALS UNAVAILABLE` |
| Gatekeeper status | `NOT RUN` |
| Known limitations / non-claims | Present in manifest |

## Package Content And Safety Checks

| Check | Status | Result |
| --- | --- | --- |
| `.pkg` expanded for inspection | PASS | Payload expands under `/Applications/Delphi Commons/package`. |
| Packaged Node executable present | PASS | Expanded payload Node executable returned `v24.15.0`. |
| Installed wrapper runtime root | PASS | Wrapper exports `EDELPHI_RUNTIME_ROOT="$HOME/Library/Application Support/DelphiCommons/macos-installer-candidate"`. |
| Package verification | PASS | `package-verification.json` reports `ok: true`. |
| `.env`, secret, credential, private-key files | PASS | No matching files found in staged package root. |
| Runtime DB/log/backup/export/state/server-runtime directories | PASS | No mutable runtime artifact directories found in staged package root; `server/dist/exports` is code, not mutable export output. |
| Raw SMS outbox, raw token, OTP, full phone-number content scan | PASS | Targeted package-root scan outside `node_modules` and `runtime` found no matches for raw token/outbox/OTP/full phone-number test patterns. |
| Broad `token` filename scan | PASS WITH NOTE | Hits were limited to dependency source files under `server/node_modules/ret/dist/*token*`; these are regex-parser library files, not raw token artifacts. |
| Package signature | NOT RUN / UNSIGNED | `pkgutil --check-signature` reported `Status: no signature`. |

## Install And Lifecycle Results

| Step | Command | Status | Result |
| --- | --- | --- | --- |
| Port check before start: UI | `lsof -nP -iTCP:4173 -sTCP:LISTEN` | PASS | No listener found. |
| Port check before start: backend | `lsof -nP -iTCP:3001 -sTCP:LISTEN` | PASS | No listener found. |
| Existing install check | `test -e '/Applications/Delphi Commons'` | PASS | No existing `/Applications/Delphi Commons` path found. |
| Install | `sudo -n installer -pkg build/macos-installer/delphi-commons-macos-installer-internal.pkg -target /` | BLOCKED | `sudo: a password is required`. Codex did not request or handle an interactive password prompt on this personal Mac. |
| Start | `/Applications/Delphi\ Commons/package/scripts/macos/delphi-commons start` | NOT RUN | Dependent on successful install. |
| UI/browser open | `http://127.0.0.1:4173` | NOT RUN | Dependent on successful install/start. |
| Status | `/Applications/Delphi\ Commons/package/scripts/macos/delphi-commons status` | NOT RUN | Dependent on successful install. |
| Smoke | `/Applications/Delphi\ Commons/package/scripts/macos/delphi-commons smoke` | NOT RUN | Dependent on successful install/start. |
| Restart | `/Applications/Delphi\ Commons/package/scripts/macos/delphi-commons restart` | NOT RUN | Dependent on successful install/start. |
| Status after restart | `/Applications/Delphi\ Commons/package/scripts/macos/delphi-commons status` | NOT RUN | Dependent on successful install/restart. |
| Backup | `/Applications/Delphi\ Commons/package/scripts/macos/delphi-commons backup` | NOT RUN | Dependent on successful install. |
| Restore | `/Applications/Delphi\ Commons/package/scripts/macos/delphi-commons restore` | NOT RUN | Dependent on successful install and backup. |
| Reset | `/Applications/Delphi\ Commons/package/scripts/macos/delphi-commons reset` | NOT RUN | Dependent on successful install; destructive runtime reset not attempted without installed package evidence. |
| Stop | `/Applications/Delphi\ Commons/package/scripts/macos/delphi-commons stop` | NOT RUN | Dependent on successful install/start. |
| Port check after stop | `lsof -nP -iTCP:4173 -sTCP:LISTEN`; `lsof -nP -iTCP:3001 -sTCP:LISTEN` | NOT RUN | Dependent on successful install/start/stop. |
| Uninstall / uninstall dry run | `/Applications/Delphi\ Commons/package/scripts/macos/delphi-commons uninstall` | NOT RUN | Dependent on successful install. |
| Runtime directory after uninstall | `~/Library/Application Support/DelphiCommons/macos-installer-candidate` | NOT RUN | No install/uninstall occurred. |

## Runtime Safety Findings

| Check | Status | Result |
| --- | --- | --- |
| Backend bind address | PASS BY MANIFEST / NOT RUNTIME-OBSERVED | Manifest and lifecycle script use `127.0.0.1`; runtime listener not observed because install/start did not run. |
| UI bind address | PASS BY SCRIPT / NOT RUNTIME-OBSERVED | Lifecycle script uses `127.0.0.1`; runtime listener not observed because install/start did not run. |
| Runtime state under expected operator-profile path | PASS BY WRAPPER / NOT RUNTIME-CREATED | Installer wrapper points to `~/Library/Application Support/DelphiCommons/macos-installer-candidate`; directory did not exist after blocked install. |
| Immutable package code separated from runtime state | PASS BY PACKAGE INSPECTION | Package root contains app/server/runtime code, not mutable DB/log/backup/export/state directories. |
| Stop clears listeners | NOT RUN | Requires installed lifecycle start/stop. |
| Stale PID handling | NOT RUN | Requires installed lifecycle exercise. |
| Reset idempotence / backup before reset | NOT RUN | Reset was not attempted on this personal Mac because install did not complete. |
| Logs do not contain secrets/tokens/OTPs/full phone numbers | NOT RUN | Installer runtime logs were not created. |
| SMS mock/sandbox default | PASS BY CONFIG/DOC BOUNDARY / NOT RUNTIME-OBSERVED | No real SMS/Twilio behavior was run. |
| Twilio/real SMS gated and inactive | PASS BY TEST BOUNDARY / NOT RUNTIME-OBSERVED | No provider credentials were used; real SMS was not run. |

## Remaining Blockers

- Local install and installed-path lifecycle evidence are blocked until an operator runs the installer with macOS administrator authorization.
- Gatekeeper/quarantine behavior remains NOT RUN.
- Signing and notarization remain NOT RUN / credentials unavailable.
- Installed app start/status/smoke/restart/backup/restore/reset/stop/uninstall evidence remains NOT RUN.
- This is one Apple Silicon Mac build/package evidence only; it is not broad macOS platform support.

## Explicit Non-Claims

- This is not production readiness.
- This is not pilot readiness.
- This is not human-subjects readiness.
- This is not broad macOS platform support.
- This is not notarization readiness.
- This is not App Store readiness.
- This is not security or accessibility certification.
- This is not real SMS readiness.
- This is internal synthetic/low-risk operator-machine installer evidence only.
