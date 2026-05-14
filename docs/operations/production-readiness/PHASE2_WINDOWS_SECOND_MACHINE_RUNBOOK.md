# Phase 2 Windows Second-Machine / Clean-Profile Verification Runbook

Status: prepared template. Execution evidence is **NOT RUN** in this repository-only environment.

## Goal

Produce human-observed evidence that the Windows operator candidate can run from a fresh clone/package on a second machine or clean Windows user profile.

## Preconditions (HUMAN_REQUIRED)

- Named Windows machine/profile details recorded.
- Candidate commit hash and package artifact hash recorded.
- No prior Delphi runtime files under target profile.

## Procedure

1. Acquire candidate from clean checkout or packaged zip.
2. Verify prerequisites exactly as documented (current posture: local Node/npm required).
3. Start backend and UI using documented operator commands.
4. Run health checks and record outputs.
5. Execute smoke workflow: login, create synthetic study, consent path, one participant submission, round progression, export, backup creation.
6. Stop services and verify no orphan processes.
7. Relaunch and verify persisted data reopens correctly.
8. Record defects/limitations with severity.

## Required artifacts

- Terminal transcript or command log.
- Screenshot(s) of UI load and staff dashboard.
- Health endpoint output.
- Evidence table with pass/fail per step.
- Environment metadata (OS version, browser version, Node/npm versions).

## Pass criteria

- All critical startup and smoke steps pass without undocumented manual fixes.
- Any non-critical issues are documented with workaround and risk rating.

## Non-claims

Even if this runbook passes, it does **not** by itself claim pilot readiness, production readiness, or human-subjects readiness.


## Phase 2 bundled-runtime foundation note (2026-05-14)

- This runbook still validates the current accepted local Node/npm prerequisite posture.
- A shared packaging core now exists for future bundled-runtime packaging work, but this runbook is not evidence that bundled runtime packaging is complete.
- Continue to record Node/npm version evidence until bundled-runtime evidence templates are executed and approved.
