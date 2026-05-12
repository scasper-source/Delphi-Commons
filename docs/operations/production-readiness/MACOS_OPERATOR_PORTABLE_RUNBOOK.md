# macOS Operator Portable Runbook (Planned Internal Candidate)

Status: **MACOS OPERATOR PORTABLE RUNBOOK RECORDED**.
Decision label: **NOT READY FOR HUMAN TESTING**.
Phase status: **Phase 2 Downloadable Laptop Operator Candidate remains IN PROGRESS**.
Date basis: **2026-05-12**.
Track: **`human_testing_candidate`**.

## Scope and Safety Boundary

This runbook is a planning/operator procedure document for the planned macOS portable/internal operator package candidate. It is documentation-only at this time unless and until matching macOS scripts are present in the package.

No claim is made here that this runbook has been validated on real Mac hardware.

## Prerequisites

- macOS shell access with permission to run local scripts from Terminal.
- Local Node.js and npm available on PATH (current dependency posture is local runtime prerequisite, not bundled runtime).
- A produced package artifact from the repository packaging flow.
- Localhost ports expected for operator flow are available (`3001` backend API, `4173` static UI) unless changed by future package scripts.

## Build Package Command

From repository root, run the planned macOS package builder:

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

## Lifecycle Commands (Planned Operator Flow)

From extracted package root, expected command pattern:

```bash
bash ./scripts/macos/portable-operator-candidate.sh <command>
```

Run in this sequence:

1. `status`
2. `start`
3. `status`
4. `health`
5. `ui-head`
6. `smoke`
7. `backup`
8. `reset` (while running, should refuse)
9. `restart`
10. `status`
11. `health`
12. `ui-head`
13. `stop`
14. `reset` (after stop)
15. `status`

## Expected Outputs (Planned)

Expected output patterns (examples; final strings depend on script implementation):

- `status` before start: reports not running.
- `start`: confirms backend + UI start attempt and pid/state capture.
- `status` after start: reports backend pid and UI pid running.
- `health`: returns service health OK from `http://127.0.0.1:3001/health`.
- `ui-head`: returns HTTP `200` from `http://127.0.0.1:4173/`.
- `smoke`: prints health smoke success.
- `backup`: creates timestamped backup under runtime `backups`.
- `reset` while running: refuses reset and instructs stop-first behavior.
- `restart`: stops/restarts and returns to healthy state.
- `stop`: confirms processes stopped.
- `reset` after stop: creates reset snapshot and clears mutable runtime state per script policy.
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

## Limitations

Current planned candidate limitations include:

- no `.app` bundle;
- no `.pkg` installer;
- no `.dmg` distribution image;
- no signing;
- no notarization;
- no updater;
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
- validated Mac execution evidence.

The decision label remains **NOT READY FOR HUMAN TESTING**.
