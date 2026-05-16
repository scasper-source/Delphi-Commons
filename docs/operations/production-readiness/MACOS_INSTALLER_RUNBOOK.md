# macOS Installer Runbook (Internal Candidate)

Internal testing only; synthetic/low-risk data only.

## Artifact
- Build output: `build/macos-installer/`
- Verify checksum: `shasum -a 256 delphi-commons-macos-installer-internal.pkg`

## Install
- `sudo installer -pkg delphi-commons-macos-installer-internal.pkg -target /`

## First launch / lifecycle
- `/Applications/Delphi\ Commons/package/scripts/macos/delphi-commons start`
- URL: `http://127.0.0.1:4173`
- Commands: `status`, `smoke`, `restart`, `stop`, `backup`, `restore [path]`, `reset`, `uninstall`

## Runtime paths
- `~/Library/Application Support/DelphiCommons/macos-installer-candidate`

## Logging and defects
- Logs under runtime `logs/`.
- Record defects with command, timestamp, expected vs actual, and artifact path.

## Limitations and non-claims
- Signing: NOT RUN unless signing evidence exists.
- Notarization: NOT RUN unless notarization evidence exists.
- Gatekeeper/quarantine: NOT RUN unless tested on Mac.
- Not App Store/public release/broad macOS support.
- Not production/pilot/human-subjects readiness.
