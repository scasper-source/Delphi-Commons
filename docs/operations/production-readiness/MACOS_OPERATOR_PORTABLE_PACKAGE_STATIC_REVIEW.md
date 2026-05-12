# macOS Operator Portable/Internal Package Static Review

Status: **STATIC REVIEW EVIDENCE RECORDED (DOCUMENTATION/REPO-VERIFIABLE ONLY)**.
Decision label: **NOT READY FOR HUMAN TESTING**.

## Review Metadata

- Date/time (UTC): `2026-05-12T17:47:39Z`
- Branch: `work`
- Commit hash: `05c99372b221b59618139acd87515e10156dc995`
- Review type: static repository/documentation review only (non-macOS runtime)

## Files Reviewed

- `scripts/macos/build-operator-portable-package.sh`
- `scripts/macos/portable-operator-candidate.sh`
- `docs/operations/production-readiness/MACOS_OPERATOR_PORTABLE_PACKAGE.md`
- `docs/operations/production-readiness/MACOS_OPERATOR_PORTABLE_RUNBOOK.md`

## Package Builder Script Static Review

File: `scripts/macos/build-operator-portable-package.sh`

Static review observations:

- Enforces strict shell mode (`set -euo pipefail`).
- Builds both app and server (`npm --prefix app run build`, `npm --prefix server run build`) before staging package output.
- Records branch and commit into `package-manifest.json`.
- Uses an `assert_within` guard for destructive operations under output root before `rm -rf`.
- Stages explicit required paths only (`app/dist`, `server/dist`, `server/package*.json`, launcher, static-file-server tool, license/notice).
- Generates package `README.txt` with explicit non-readiness statements and local Node/npm prerequisite.
- Generates `package-manifest.json` including track, build metadata, limitations, explicit non-claims, and included file list.
- Produces `.tar.gz` archive under `build/macos-operator-portable` (default).

## Launcher Script Static Review

File: `scripts/macos/portable-operator-candidate.sh`

Static review observations:

- Enforces strict shell mode (`set -euo pipefail`).
- Supports bounded command set only: `start|stop|restart|status|smoke|backup|reset`.
- Uses fixed localhost hosts (`127.0.0.1`) for API and UI.
- Externalizes runtime mutable data to user runtime path under `~/Library/Application Support/DelphiCommons/...`.
- Copies backend runtime (`server/dist` + `package*.json`) into runtime `server-runtime` before running.
- Installs production dependencies with `npm ci --omit=dev` in runtime path (not package root).
- Persists lock metadata including backend/ui pid, URLs, runtime root, package root.
- `reset` command refuses when backend pid is running; requires stop-first.
- `backup` and `reset` snapshot flows target runtime backups directory.

## Runtime Path Policy

Policy observed in launcher and package docs:

- Runtime root: `~/Library/Application Support/DelphiCommons/macos-operator-portable-candidate`.
- Mutable runtime directories are externalized from package root (`db`, `audit`, `exports`, `backups`, `logs`, `evidence`, `state`, `server-runtime`).
- Package root is intended to remain operational input, not mutable runtime state.

## Package Exclusion Policy

Static package shape indicates exclusion of runtime/sensitive artifacts from committed package scaffold:

- Runtime data, logs, backups, evidence, and runtime `node_modules` are not staged into package root by the builder.
- `.git` and `.env` are not in required staged path set.
- Package includes selected build/runtime-launch artifacts and legal files only.

## Localhost Binding Policy

Static launcher constants bind endpoints to loopback only:

- API host: `127.0.0.1` (`3001`)
- UI host: `127.0.0.1` (`4173`)

No static evidence indicates default public interface binding.

## Reset-While-Running Guard Review

Static launcher behavior for `reset`:

- Reads backend pid from lock.
- If pid exists and is running, command exits with refusal (`Refusing reset while running. Run stop first.`).
- This guard prevents destructive reset during active process execution.

## Backup/Reset Path Review

Static launcher behavior:

- `backup` creates timestamped directory under runtime `backups` and copies runtime data directories.
- `reset` creates `reset-snapshot-*` under runtime `backups` before clearing runtime mutable directories.
- No reset/backup writes are targeted to package root paths.

## README/Manifest Generation Review

Builder static generation confirms:

- `README.txt` is generated in package root and includes status, run command, runtime policy, and limitations/non-claims.
- `package-manifest.json` is generated in package root and includes branch, commit hash, timestamp, dependency posture, explicit limitations/non-claims, and included files list.

## Checks Run

| Check | Command | Result |
| --- | --- | --- |
| Shell syntax check | `bash -n scripts/macos/build-operator-portable-package.sh && bash -n scripts/macos/portable-operator-candidate.sh` | PASS |
| Documentation claim scan | `rg -n "production-ready|pilot-ready|human-subjects ready|ready for human testing|support readiness claim" scripts/macos/build-operator-portable-package.sh scripts/macos/portable-operator-candidate.sh docs/operations/production-readiness/MACOS_OPERATOR_PORTABLE_PACKAGE.md docs/operations/production-readiness/MACOS_OPERATOR_PORTABLE_RUNBOOK.md` | PASS (matches are explicit non-claims / not-ready wording) |
| Patch hygiene | `git diff --check` | PASS |
| Working tree status | `git status` | PASS (informational snapshot) |

## NOT RUN Items

The following remain **NOT RUN** in this static review record:

- Actual package build on Mac
- Extracted lifecycle execution on Mac
- Gatekeeper/quarantine behavior
- Intel vs Apple Silicon behavior
- macOS version compatibility matrix behavior

## Limitations

- This evidence is static analysis only and does not include runtime execution on macOS hardware.
- No command in this record proves process launch behavior, network binding at runtime, backup/reset side effects, or package extraction behavior on Mac.
- No signing/notarization/security-distribution validation is performed by this review.

## Remaining Blockers

- Execute package builder on real Mac and record artifact outputs.
- Execute full extracted package lifecycle on real Mac and record start/status/health/ui/backup/reset/restart/stop evidence.
- Capture Gatekeeper/quarantine observations from actual downloaded/extracted artifact path.
- Capture Intel and Apple Silicon path evidence.
- Capture macOS version compatibility evidence for supported version range.

## Explicit Non-Claims

This document does **not** claim:

- production readiness,
- pilot readiness,
- human-subjects readiness,
- installer/signing/notarization readiness,
- macOS support readiness,
- successful macOS runtime package behavior,
- Gatekeeper compatibility,
- architecture compatibility (Intel/Apple Silicon),
- macOS version compatibility.
