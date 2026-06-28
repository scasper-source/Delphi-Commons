# macOS GitHub Release Asset Evidence - 2026-06-28

Status: **ASSETS AVAILABLE / PRIOR RELEASE ARCHIVED / NOT READY FOR HUMAN TESTING**.

Date basis: 2026-06-28.

Release tag: [`internal-macos-package-candidate-2026-06-28-r2`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-macos-package-candidate-2026-06-28-r2).

Release commit:

```text
18faba229b0e9047e45a88c4a087bef937926681
```

This release publishes one Apple Silicon unsigned internal installer ZIP bundle plus release notes and checksums for internal synthetic/low-risk testing only.

## Workflow Evidence

| Item | Value |
| --- | --- |
| Workflow run | [`28340083533`](https://github.com/scasper-source/Delphi-Commons/actions/runs/28340083533) |
| Result | `completed` / `success` |
| Job | `Build macOS internal package assets` |
| Job result | `success` |
| Release publish step | `success` |
| Same-commit CI run | [`28340083441`](https://github.com/scasper-source/Delphi-Commons/actions/runs/28340083441), `completed` / `success` |

The first 2026-06-28 tag, `internal-macos-package-candidate-2026-06-28-r1`, built the macOS package but did not create a release because GitHub Actions artifact storage quota blocked `actions/upload-artifact`, and the publish step was skipped. Commit `18faba2` made the auxiliary workflow-artifact upload non-blocking so the GitHub Release publish step can still run.

## Release Assets

Release URL base:

```text
https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-macos-package-candidate-2026-06-28-r2
```

Asset download URL base:

```text
https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-06-28-r2/
```

| Asset | Size | SHA256 | Status |
| --- | ---: | --- | --- |
| [`delphi-commons-macos-arm64-installer-internal-internal-macos-package-candidate-2026-06-28-r2-18faba2.zip`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-06-28-r2/delphi-commons-macos-arm64-installer-internal-internal-macos-package-candidate-2026-06-28-r2-18faba2.zip) | 40,494,627 bytes | `f82be4207f947a2bf95138d85b2b47c9d6d49dfb439c7b04155974fcec50758a` | Present |
| [`SHA256SUMS.txt`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-06-28-r2/SHA256SUMS.txt) | 171 bytes | Self-checksum not recorded | Present |
| [`RELEASE_NOTES.md`](https://github.com/scasper-source/Delphi-Commons/releases/download/internal-macos-package-candidate-2026-06-28-r2/RELEASE_NOTES.md) | 1,403 bytes | Not included in generated `SHA256SUMS.txt` | Present |

## Archive Status

| Prior release | Archive action | Successor |
| --- | --- | --- |
| [`internal-macos-package-candidate-2026-05-18-r4`](https://github.com/scasper-source/Delphi-Commons/releases/tag/internal-macos-package-candidate-2026-05-18-r4) | GitHub Release title/body marked `[ARCHIVED / SUPERSEDED]`; assets retained for traceability | `internal-macos-package-candidate-2026-06-28-r2` |

## Interpretation

This evidence confirms GitHub-hosted downloadable macOS Apple Silicon internal package assets are available for `r2`. It does **not** prove installed-path start/stop/reopen/uninstall behavior, Gatekeeper acceptance, signing, notarization, Intel Mac/x64 support, accessibility conformance, security certification, pilot readiness, production readiness, or real human-subjects readiness.

Required follow-up remains: download the `r2` ZIP on the selected Mac test surface, install the PKG, open `/Applications/Delphi Commons/Delphi Commons.app`, exercise the browser fallback if needed, record lifecycle observations, and attach the human-observed result.
