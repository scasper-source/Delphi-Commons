# Phase 3 Mobile Device Evidence Runbook (iPhone/Safari + Android/Chrome)

Status: **READY TO EXECUTE / EVIDENCE NOT YET RUN IN THIS FILE**.

Date basis: 2026-05-15.

## Purpose and boundary

This runbook defines how to capture **human-observed** Phase 3 mobile evidence for:

- iPhone/Safari (real device preferred, iOS Simulator allowed as interim evidence),
- Android/Chrome (real device preferred, Android Emulator allowed as interim evidence),
- opaque `/m/{token}` entry and full participant path states.

This runbook is an execution guide only. It does **not** claim that iPhone/Android evidence has already been run.

## Required evidence states to capture

Capture screenshot and screen-recording evidence for all states below on each platform/browser pairing:

1. Opaque link open (`/m/{token}`)
2. Consent and participant rights
3. Round 1 active task state
4. Later round active task state
5. No-active-task / waiting state
6. Closeout / final results state
7. Support issue flow (open + submit + acknowledgement)
8. Withdrawal flow (open + confirm + resulting state)

## Redaction and safety rules (mandatory)

- Never include raw magic-link tokens in evidence filenames, docs, or issue trackers.
- Never include participant names, full phone numbers, OTP values, or sensitive support message text.
- Use neutral synthetic text for support/withdrawal notes.
- If a screenshot includes sensitive values on screen, redact before storage using static overlays.
- Store only redacted artifacts in repository-tracked paths.

## Evidence package location

Store artifacts under a dated folder (example):

- `docs/operations/production-readiness/artifacts/phase3-mobile-device-evidence-YYYYMMDD/`

Recommended subfolders:

- `iphone-safari/`
- `android-chrome/`
- `simulator-or-emulator/` (if used)

## iPhone/Safari run path

### A) Real iPhone (preferred)

1. Prepare a synthetic or approved non-human-subject test participant token.
2. Open the opaque link in Safari via Notes, SMS mock inbox, or direct paste.
3. Record full flow while capturing checkpoint screenshots.
4. Export screen recording to evidence folder.
5. Complete an evidence template row for each required state.

### B) iOS Simulator (interim)

1. Start Simulator and select target iPhone model.
2. Open Safari in simulator.
3. Paste opaque `/m/{token}` link.
4. Execute required state captures.
5. Mark all such captures as **SIMULATOR ONLY (NOT REAL DEVICE)** in template.

## Android/Chrome run path

### A) Real Android device (preferred)

1. Prepare synthetic/approved token.
2. Open link in Chrome.
3. Record full flow and checkpoint screenshots.
4. Export recording and store evidence.
5. Complete template metadata.

### B) Android Emulator (interim)

1. Start AVD and launch Chrome.
2. Paste opaque `/m/{token}` link.
3. Execute required states.
4. Mark as **EMULATOR ONLY (NOT REAL DEVICE)** in template.

## State-by-state operator checklist

For each platform run:

- [ ] `/m/{token}` route resolves and does not expose direct participant identifiers in URL.
- [ ] Consent page includes voluntary participation and withdrawal rights language.
- [ ] Round 1 task can be completed and submitted.
- [ ] Later round task can be completed and submitted.
- [ ] No-active-task state appears between rounds or when round closed.
- [ ] Closeout/final results page is reachable when released.
- [ ] Support issue flow permits issue submission and acknowledgement.
- [ ] Withdrawal flow is reachable and visibly changes future participation state.

## Execution reporting requirements

Each execution must record:

- date/time (UTC),
- tester initials,
- device model and OS version,
- browser version,
- app commit hash,
- package/source (local build, staged package, hosted env),
- observed result (PASS/PARTIAL/FAIL),
- defect references,
- explicit label: REAL DEVICE, SIMULATOR, or EMULATOR.

## Required NOT RUN language until execution exists

Until real runs are completed and attached, related Phase 3 closeout docs must keep:

- iPhone/Safari device evidence: **NOT RUN**
- Android/Chrome device evidence: **NOT RUN**
- Human-observed walkthrough evidence: **HUMAN_REQUIRED**

## Related templates

- `PHASE3_MOBILE_EVIDENCE_TEMPLATES.md`
- `PHASE3_MOBILE_WEB_TASK_FLOW_EVIDENCE.md`
- `PHASE3_CLOSEOUT_INDEX.md`
