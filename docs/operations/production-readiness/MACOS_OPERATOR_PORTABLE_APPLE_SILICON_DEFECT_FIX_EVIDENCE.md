# macOS Operator Portable Apple Silicon Defect Fix Evidence

Status: **INTERNAL ENGINEERING EVIDENCE ONLY**.
Decision label: **NOT READY FOR HUMAN TESTING**.
Date basis: **2026-05-13**.

## Scope

This note records focused fixes for defects found during a manual macOS portable/internal operator package test on Karen's Apple Silicon MacBook Air. It does not broaden the product surface and does not add `.app`, `.pkg`, `.dmg`, Tauri, signing, notarization, Gatekeeper bypasses, updater behavior, real SMS, PWA, native mobile, external AI, or public-release behavior.

## Source Mac Evidence

- Machine: MacBook Air, Mac15,12, Apple M3, 24 GB memory.
- macOS: 15.6, build 24G84.
- Architecture: arm64 / Apple Silicon.
- Runtime tools: Node v24.15.0, npm 11.12.1, Apple Git 2.39.5.
- Repository commit tested on Mac: `55e1b40d358ac8fa3e2451881626f305b77672f6`.
- Timestamp: `2026-05-13T15:14:15Z`.

## Defects Addressed

| Area | Observed defect | Fix summary |
| --- | --- | --- |
| Builder output path | Clean checkout without repo-level `build/` caused output path resolution to fall through toward `/macos-operator-portable`. | Create and resolve the output parent before canonicalizing the output root; refuse root-level output roots; keep output-root safety checks. |
| PID supervision | Lock-file PIDs did not match actual long-lived Node listener PIDs after restart. | Start backend/UI as direct background `node` processes, record those PIDs, and verify expected command paths plus localhost listeners. |
| Status/reset trust | `status`, `stop`, `restart`, and `reset` could be misled by stale PID state. | Treat state files as advisory; check actual expected backend/UI processes; clear `backend.pid`, `ui.pid`, and `instance.lock` after stopped reset/stop. |
| Smoke command | `smoke` printed `NOT RUN` placeholder text. | Implement local smoke checks for backend health `status: ok` and UI HTTP `200`. |
| Server audit | npm audit reported one high-severity transitive `fast-uri` issue. | Updated only the server lockfile transitive `fast-uri` entry from `3.1.0` to `3.1.2`; rerun audit reports zero vulnerabilities. |

## Verification Log

| Command/check | Result |
| --- | --- |
| `npm --prefix app ci` | PASS after transient Windows `EBUSY` lock cleared; exact command rerun passed. |
| `npm --prefix server ci` | PASS; audit summary reported zero vulnerabilities after lockfile update. |
| `npm --prefix app run build` | PASS when rerun outside sandbox after Vite config access denial in sandbox. |
| `npm --prefix server run build` | PASS. |
| `npm --prefix server audit --json` | Initial high `fast-uri <=3.1.1`; PASS after `fast-uri@3.1.2` lockfile update with zero reported vulnerabilities. |
| `bash -n scripts/macos/build-operator-portable-package.sh` | PASS using Git Bash syntax check. |
| `bash -n scripts/macos/portable-operator-candidate.sh` | PASS using Git Bash syntax check. |
| Guarded clean build-dir removal equivalent to `rm -rf build` | PASS; verified target stayed inside checkout before deletion. |
| `./scripts/macos/build-operator-portable-package.sh` from no `build/` state | PASS; builder recreated `build/macos-operator-portable` and produced a `.tar.gz` package. |
| Extract generated archive into `build/macos-operator-portable/extracted-test` | PASS. |
| Required package artifact inspection | PASS: `README.txt`, `package-manifest.json`, `app/dist`, `server/dist`, server package files, macOS launcher, and static file server were present; manifest parsed. |
| Package-root cleanliness before lifecycle | PASS: no `.git`, `.env`, root runtime dirs, logs, DBs, zip archives, or `node_modules` were found in the extracted package root. |
| Extracted package `status` command | PASS: reported `stopped`. |
| Final package build after generated README/manifest wording updates | PASS using alternate output root `build/macos-operator-portable-final`; default output-root rerun was blocked by a local Windows directory lock on an earlier staging folder. |
| Final alternate package artifact inspection and cleanliness | PASS. |
| Full lifecycle start/restart/reset verification in this workspace | NOT RUN as macOS evidence. This workspace is Windows/Git Bash; its `ps`/`kill` process semantics do not match macOS process supervision. Real macOS lifecycle rerun remains required. |
| Final local port check for `3001` / `4173` | PASS: no local listeners remained after cleanup. |

## Non-Claims Preserved

This note does **not** claim production readiness, pilot readiness, human-subjects readiness, IRB readiness, legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, external AI readiness, or open public release readiness.

All findings and verification entries here are internal engineering evidence only.
