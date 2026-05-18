# macOS GitHub Release Asset Evidence - 2026-05-18

Status: **MACOS INTERNAL RELEASE ASSETS AVAILABLE / NOT READY FOR HUMAN TESTING / DOWNLOAD-INSTRUCTION VERIFICATION GAP OPEN**.

Date/time basis: 2026-05-18 GitHub Actions release workflow run.

Track: `human_testing_candidate`.

Release tag: [`internal-macos-package-candidate-2026-05-18`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-macos-package-candidate-2026-05-18).

Workflow run: [`26055150761`](https://github.com/scasper-source/Delphi-Commons/actions/runs/26055150761).

Commit hash:

```text
c847a023d1b188bc1dab635e154df5563353cd21
```

## Scope

This document records that GitHub had macOS Apple Silicon internal package candidate assets available for download for tag `internal-macos-package-candidate-2026-05-18`. It is not evidence that the downloaded asset README matched the later operator-model cleanup unless a separate downloaded-asset inspection is attached.

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

Status: **NOT RUN** for this recorded release asset.

The repository docs and packaging scripts were reviewed after this release, but this evidence file does not contain an extraction of `delphi-commons-macos-arm64-portable-bundled-runtime-internal-internal-macos-package-candidate-2026-05-18-c847a02.zip` proving that its bundled `README.txt` contains the intended operator instructions. Treat this tag as an internal package candidate with a downloaded-asset README verification gap until a corrected successor tag is built and the actual downloaded asset is inspected.

## Superseded Release/Tag Cleanup Status

Status: **HUMAN_REQUIRED**. The container has no configured git remote, `gh` is not installed, and unauthenticated GitHub API access was blocked, so no release/tag/asset deletion was performed. Delete superseded macOS releases only after a corrected successor candidate has succeeded and its downloaded asset has been verified.

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
