# macOS Operator Portable Runbook (Planned Internal Candidate)

Status: **MACOS OPERATOR PORTABLE RUNBOOK RECORDED / INTERNAL ENGINEERING EVIDENCE ONLY**.
Decision label: **NOT READY FOR HUMAN TESTING**.
Phase status: **Phase 2 Downloadable Laptop Operator Candidate remains IN PROGRESS**.
Date basis: **2026-05-18**.
Track: **`human_testing_candidate`**.

## Scope and Safety Boundary

This runbook is a planning/operator procedure document for the planned macOS portable/internal operator package candidate. It is documentation-only at this time unless and until matching macOS scripts are present in the package.

A pre-fix real Mac run was recorded on 2026-05-13 with partial package/build/start evidence and lifecycle defects. A post-fix Apple Silicon real Mac rerun was recorded on 2026-05-14 and passed the lifecycle sequence for the previously observed defects.

This runbook remains the operator procedure/checklist. The evidence record is separate: [MACOS_OPERATOR_PORTABLE_POST_FIX_LIFECYCLE_EVIDENCE_2026-05-14.md](./MACOS_OPERATOR_PORTABLE_POST_FIX_LIFECYCLE_EVIDENCE_2026-05-14.md).

> Warning: command examples in this document are not operational evidence until they are executed and recorded on a real macOS machine.

## Prerequisites

- macOS shell access with permission to run local scripts from Terminal.
- For the current bundled-runtime package candidate, local Node.js/npm should not be required after packaging; if a source-only prototype is used instead, record local Node/npm as a prerequisite and do not treat it as bundled-runtime evidence.
- A produced package artifact from the repository packaging flow.
- Localhost ports expected for operator flow are available (`3001` backend API, `4173` static UI) unless changed by future package scripts.

## Build Package Command

From repository root, run the macOS package builder (clean-checkout expectation after fix: it safely creates `build/macos-operator-portable`):

```bash
rm -rf build
./scripts/macos/build-operator-portable-package.sh
```

Standard invocation:

```bash
bash ./scripts/macos/build-operator-portable-package.sh
```

If this script does not exist in your checkout/package, treat packaging as **not implemented for macOS evidence** and stop at documentation review.

## Safe Extraction Guidance

- Extract the zip into a clean, user-controlled folder (for example `~/Downloads` or `~/Desktop/lab`), not into a system directory.
- Avoid extracting over an existing package directory; use a new timestamped folder each run.
- Preserve the extracted package root as read-only operational input; runtime data belongs outside package root.
- Do not place secrets in the package root.

## Required Package File Checks

After extraction, verify these expected package-root artifacts are present (names may vary slightly by future implementation):

- `app/dist`
- `server/dist`
- `server/package.json`
- `server/package-lock.json`
- `scripts/macos/portable-operator-candidate.sh`
- `tools/static-file-server.mjs`
- `README.txt`
- `package-manifest.json`
- `LICENSE`
- `NOTICE`

If required files are missing, stop and treat the candidate as incomplete.

## Runtime Path

All mutable runtime state is expected under:

`~/Library/Application Support/DelphiCommons/macos-operator-portable-candidate`

Expected runtime subdirectories (target shape):

- `db`
- `audit`
- `exports`
- `backups`
- `logs`
- `evidence`
- `state`

## Normal Launch Path

From extracted package root, the single normal launch command is:

```bash
./scripts/macos/portable-bundled-runtime.sh
```

The launcher starts local services, attempts to open `http://127.0.0.1:4173`, and prints the same localhost URL. If the browser does not show Delphi Commons, open `http://127.0.0.1:4173` manually while the supervised run is active. This fallback guidance must remain before any shutdown/close-window guidance.

macOS lifecycle gap: closing the visible browser/app window is **IMPLEMENTATION_REQUIRED / HUMAN_REQUIRED** and is **not proven** to stop the local runtime. For supervised internal runs only, end the runtime with:

```bash
./scripts/macos/portable-bundled-runtime.sh stop
```

Do not present Stop or Status as ordinary user shortcuts. They are admin/debug lifecycle commands.

## Admin Lifecycle Evidence Sequence

From extracted package root, admin/debug command pattern is:

```bash
bash ./scripts/macos/portable-operator-candidate.sh <command>
```

For evidence collection, run this sequence:

1. `status`
2. `start`
3. `status`
4. `health`
5. `ui-head` (UI HEAD check)
6. `smoke`
7. `backup`
8. `reset` (while running, should refuse)
9. `restart`
10. `status`
11. `health`
12. `UI HEAD`
13. `stop`
14. `reset` (after stop)
15. `status`

## Expected Outputs (Planned)

Expected output patterns (examples; final strings depend on script implementation):

- `status` before start: reports not running.
- `start`: confirms backend + UI start attempt and pid/state capture.
- `status` after start: reports backend pid and UI pid running.
- `health`: returns service health OK from `http://127.0.0.1:3001/health`.
- `UI HEAD`: returns HTTP `200` from `http://127.0.0.1:4173/`.
- `smoke`: verifies `http://127.0.0.1:3001/health` returns `status: ok` and `http://127.0.0.1:4173/` returns HTTP `200`; failures must be treated as failed internal engineering evidence, not as readiness evidence. The 2026-05-14 post-fix real Mac rerun recorded a real smoke PASS.
- `backup`: creates timestamped backup under runtime `backups`.
- `reset` while running: refuses reset and instructs stop-first behavior.
- `restart`: stops/restarts and returns to healthy state.
- `stop`: confirms processes stopped.
- `reset` after stop: creates reset snapshot, clears mutable runtime state per script policy, and removes stale `state/backend.pid`, `state/ui.pid`, and `state/instance.lock` files.
- final `status`: reports not running.

## Package-Root Cleanliness Checks

After lifecycle execution, verify package root is still clean:

- no runtime logs/backups/db/exports/audit/state data created inside package root;
- no `.env` or secret files added;
- no generated `*.db`, `*.sqlite`, `*.log`, or runtime `node_modules` created in package root;
- mutable runtime artifacts remain under runtime path only.

Suggested checks from package root:

```bash
find . -maxdepth 3 \( -name "*.env" -o -name "*.db" -o -name "*.sqlite" -o -name "*.log" \)
find . -maxdepth 3 -type d \( -name logs -o -name backups -o -name db -o -name audit -o -name exports -o -name state -o -name node_modules \)
```

## Troubleshooting

### Local Node/npm missing

- Symptom: command not found / dependency install failures.
- Action: install supported Node.js + npm locally and retry.
- Boundary: this candidate currently assumes local runtime prerequisites.

### Ports in use

- Symptom: start/health/ui checks fail or bind errors on `3001` / `4173`.
- Action: identify and stop conflicting local process, then rerun lifecycle.

### Shell permissions

- Symptom: permission denied executing script.
- Action: use `bash <script>` form, and if needed `chmod +x` on package scripts in user-owned directories.

### Quarantine / Gatekeeper observations

- Symptom: extracted scripts or binaries are blocked/quarantined.
- Action: record exact prompt/error text in evidence; do not bypass organizational security policy.
- Boundary: no signing/notarization evidence exists for this candidate path.

### npm vulnerability warnings

- Symptom: npm reports vulnerabilities during dependency installation.
- Action: record warning output and dependency versions in evidence; do not convert warning output into unsupported security-readiness claims.

### Stale or mismatched PID state

- Symptom: `status`, `stop`, `restart`, or `reset` disagrees with actual localhost listeners.
- Action: record the lock file, PID files, `lsof` listener evidence for ports `3001` and `4173`, and the process command lines. Treat mismatches as internal engineering defects until corrected.
- Expected policy: launcher state is advisory only. Actual backend/UI process checks must confirm expected localhost listener commands before reporting `running`, stopping services, or refusing reset.

## Limitations

Current planned candidate limitations include:

- no `.app` bundle;
- no `.pkg` installer;
- no `.dmg` distribution image;
- no signing;
- no notarization;
- no updater;
- no enterprise distribution support;
- no macOS support readiness claim.

## Explicit Non-Claims

This runbook does **not** claim:

- production readiness;
- pilot readiness;
- human-subjects readiness;
- installer readiness;
- signed/notarized distribution readiness;
- Windows support readiness;
- macOS support readiness;
- real SMS readiness;
- PWA readiness;
- native mobile readiness;
- external AI readiness;
- broad validated Mac support beyond the specific 2026-05-14 Apple Silicon internal engineering rerun.

The decision label remains **NOT READY FOR HUMAN TESTING**.


## 2026-05-14 bundled-runtime internal hardening update

- macOS Phase 2 packaging now uses `scripts/packaging/macos-portable.mjs` via thin shell entrypoint `scripts/macos/build-operator-portable-package.sh`.
- Bundled runtime target implemented in this phase: Apple Silicon `macos/arm64` with Node `24.15.0` metadata at `docs/adr/runtime/node-macos-arm64.json`.
- Intel Mac `x64` remains deferred and is not claimed supported in this package line.
- Build-time still requires local Node/npm in the source checkout. Runtime lifecycle uses packaged Node (`scripts/macos/portable-bundled-runtime.sh`) and does not require ambient `node`, `npm`, or `npx`.
- Signing, notarization, Gatekeeper/quarantine compatibility, platform support readiness, pilot readiness, production readiness, and human-subject readiness remain out of scope and NOT CLAIMED.
