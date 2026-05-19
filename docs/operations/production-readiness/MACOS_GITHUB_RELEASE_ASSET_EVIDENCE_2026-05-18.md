# macOS GitHub Release Asset Evidence - 2026-05-18

Status: **SUPERSEDED SPLIT MACOS RELEASE ASSETS / NOT READY FOR HUMAN TESTING / SINGLE-BUNDLE SUCCESSOR REQUIRED**.

Date/time basis: 2026-05-18 GitHub Actions release workflow run.

Track: `human_testing_candidate`.

Release tag: [`internal-macos-package-candidate-2026-05-18`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-macos-package-candidate-2026-05-18).

Workflow run: [`26055150761`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26055150761).

Commit hash:

```text
c847a023d1b188bc1dab635e154df5563353cd21
```

## Scope

This document records that GitHub had macOS Apple Silicon internal package candidate assets available for download for tag `internal-macos-package-candidate-2026-05-18`. This tag published a split operator surface: a raw unsigned installer PKG and a separate portable bundled-runtime ZIP. It is superseded for macOS installer/operator testing by the single-bundle release workflow, which must publish one installer ZIP bundle containing the PKG, verification metadata, checksums, and install instructions.

These assets are internal synthetic/low-risk package candidates only. They do not close Phase 2 by themselves and do not create production, pilot, real human-subjects, broad macOS support, App Store, signing, notarization, Gatekeeper, security-certification, accessibility-certification, legal, ethics/IRB, real-SMS, PWA, native-mobile, external-AI, or final human-testing readiness evidence.

No real participant data was used.

## Workflow Result

| Item | Result |
| --- | --- |
| Workflow name | `Build macOS internal package release` |
| Event | `push` tag |
| Tag | `internal-macos-package-candidate-2026-05-18` |
| Head SHA | `c847a023d1b188bc1dab635e154df5563353cd21` |
| Status | `completed` |
| Conclusion | `success` |
| Created at | `2026-05-18T19:19:47Z` |
| Updated at | `2026-05-18T19:20:59Z` |

## Release Assets

| Asset | Size | SHA256 |
| --- | ---: | --- |
| [`delphi-commons-macos-arm64-installer-internal-internal-macos-package-candidate-2026-05-18-c847a02.pkg`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-05-18/delphi-commons-macos-arm64-installer-internal-internal-macos-package-candidate-2026-05-18-c847a02.pkg) | 40,762,380 bytes | `027ac2112f407028c9f76c1e7f2eeafab6ee2edffb5ea5bfabe8cf9099f0a2e5` |
| [`delphi-commons-macos-arm64-portable-bundled-runtime-internal-internal-macos-package-candidate-2026-05-18-c847a02.zip`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-05-18/delphi-commons-macos-arm64-portable-bundled-runtime-internal-internal-macos-package-candidate-2026-05-18-c847a02.zip) | 41,751,180 bytes | `d95f70d7616bc163b378bbe4fc4d98452163755894a6efe44cb605a58c6e25b0` |
| [`macos-installer-checksums-internal-macos-package-candidate-2026-05-18-c847a02.json`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-05-18/macos-installer-checksums-internal-macos-package-candidate-2026-05-18-c847a02.json) | 826,771 bytes | `302012ad89cc9578f3ada7141fb0851512b5c73c6b18f8812d3214119090ff4c` |
| [`macos-installer-package-verification-internal-macos-package-candidate-2026-05-18-c847a02.json`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-05-18/macos-installer-package-verification-internal-macos-package-candidate-2026-05-18-c847a02.json) | 34 bytes | `b7ea028994d1ca087b9208093f13b2d509d4a8605587c68c2982e57d926923f6` |
| [`RELEASE_NOTES.md`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-05-18/RELEASE_NOTES.md) | 672 bytes | Not included in generated `SHA256SUMS.txt` |
| [`SHA256SUMS.txt`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-05-18/SHA256SUMS.txt) | 660 bytes | Self-checksum not recorded |

Package verification metadata:

```json
{
  "ok": true,
  "failures": []
}
```

## Downloaded-Asset Instruction Verification

Status: **PASSED** for corrected release `internal-macos-package-candidate-2026-05-18-r4`; **NOT RUN / SUPERSEDED** for the original split release asset.

The repository docs and packaging scripts were reviewed after the original split release, but this evidence file does not contain an extraction of those split release assets proving that the operator would see one coherent installer package and current instructions. Treat the original split tag as superseded for macOS installer/operator testing. The corrected single-bundle successor is recorded below.

## Corrected Current Release

Tag: [`internal-macos-package-candidate-2026-05-18-r4`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-macos-package-candidate-2026-05-18-r4).

Workflow run: [`26068696741`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26068696741).

Commit hash:

```text
60479a10585654f66b50cf2b7a9b57e066af17aa
```

Published assets:

| Asset | Size | SHA256 |
| --- | ---: | --- |
| [`delphi-commons-macos-arm64-installer-internal-internal-macos-package-candidate-2026-05-18-r4-60479a1.zip`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-05-18-r4/delphi-commons-macos-arm64-installer-internal-internal-macos-package-candidate-2026-05-18-r4-60479a1.zip) | 40,486,737 bytes | `d953fd00e8f4da41853f82379f829f9e256e91d9889c9daf7b42dbec041e3d94` |
| [`RELEASE_NOTES.md`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-05-18-r4/RELEASE_NOTES.md) | 1,403 bytes | `041090bc70e0fa7ed3a31dff97935c8a3126e676acd10e1733dbf9f3781af65c` |
| [`SHA256SUMS.txt`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-05-18-r4/SHA256SUMS.txt) | 171 bytes | `690be1e4ad623c08c505e70d9c1b12199d2940e3676e1fe3dbcd2fadca2097d7` |

Downloaded ZIP checksum verification:

```text
delphi-commons-macos-arm64-installer-internal-internal-macos-package-candidate-2026-05-18-r4-60479a1.zip: OK
```

Extracted bundle contents:

| Bundled item | Size | SHA256 |
| --- | ---: | --- |
| `README_INSTALL_MACOS.txt` | 1,032 bytes | `0f00bf17cd8ea3878e57577cf5cad7ab2296cfc1895a3ddbc5e8853585f6fc55` |
| `delphi-commons-macos-arm64-installer-internal-internal-macos-package-candidate-2026-05-18-r4-60479a1.pkg` | 40,763,899 bytes | `fda25282bed3dca1b901388abe1d2d2245a95103327d2370cea0f904ad7377bd` |
| `macos-installer-checksums-internal-macos-package-candidate-2026-05-18-r4-60479a1.json` | 827,077 bytes | `1574017097561ea302fa58423384e7c4b43f79f240e0e67e4e11cc6e0b85f884` |
| `macos-installer-package-verification-internal-macos-package-candidate-2026-05-18-r4-60479a1.json` | 34 bytes | `b7ea028994d1ca087b9208093f13b2d509d4a8605587c68c2982e57d926923f6` |

Downloaded-asset inspection evidence:

- `README_INSTALL_MACOS.txt` says to run the included PKG, open `/Applications/Delphi Commons/Delphi Commons.app`, use `http://127.0.0.1:4173` as the browser fallback, and treats window-close shutdown as not proven.
- `pkgutil --payload-files` showed `./Applications/Delphi Commons/Delphi Commons.app`, `./Applications/Delphi Commons/Delphi Commons.app/Contents/MacOS/Delphi Commons`, `./Applications/Delphi Commons/package/scripts/macos/delphi-commons`, and `./Applications/Delphi Commons/package/README.txt`.
- `pkgutil --expand-full` confirmed the installed app launcher executes `"$INSTALL_ROOT/package/scripts/macos/delphi-commons"`.
- The installed package `README.txt` says to install the release PKG, open `/Applications/Delphi Commons/Delphi Commons.app`, manually open `http://127.0.0.1:4173` if needed, and use the admin stop command only for supervised internal runs.
- `pkgutil --check-signature` reported `Status: no signature`, as expected for the unsigned internal package candidate.

## Superseded Release/Tag Cleanup Status

Status: **DONE** after corrected release `internal-macos-package-candidate-2026-05-18-r4` succeeded and the downloaded asset was verified.

Deleted superseded releases/tags:

| Release/tag | Reason superseded | Corrected successor |
| --- | --- | --- |
| `internal-macos-package-candidate-2026-05-18` | Published split raw PKG plus portable ZIP, not one macOS installer package. | `internal-macos-package-candidate-2026-05-18-r4` |
| `internal-macos-package-candidate-2026-05-18-r2` | Published split raw PKG plus portable ZIP, not one macOS installer package. | `internal-macos-package-candidate-2026-05-18-r4` |
| `internal-macos-package-candidate-2026-05-18-r3` | Published one installer bundle, but the installed package README still described portable ZIP extraction. | `internal-macos-package-candidate-2026-05-18-r4` |

Remote tag check after cleanup showed only:

```text
60479a10585654f66b50cf2b7a9b57e066af17aa refs/tags/internal-macos-package-candidate-2026-05-18-r4
```

## Remaining Open Gates

- The macOS `.pkg` is unsigned and not notarized.
- Gatekeeper/quarantine behavior remains `NOT RUN`.
- Clean-profile Mac execution remains `NOT RUN`.
- Second-machine Mac execution remains `NOT RUN`.
- Phone/operator walkthrough remains `NOT RUN`.
- Installed-path lifecycle evidence remains `NOT RUN` until a human operator installs and exercises launch/browser-open/fallback/smoke/admin stop/uninstall or uninstall dry run.
- Closing the visible browser/app window stopping the macOS runtime remains `IMPLEMENTATION_REQUIRED / HUMAN_REQUIRED`; do not claim it works without evidence.
- Intel Mac/x64 packaging remains deferred.
- This does not close Phase 1 human evidence, Phase 2 laptop candidate evidence, Phase 4 binder signoff, or Phase 5 final human testing.
