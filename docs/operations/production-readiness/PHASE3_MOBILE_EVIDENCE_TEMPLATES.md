# Phase 3 Mobile Evidence Templates

Status: **TEMPLATE ONLY / NO EXECUTION CLAIM**.

Date basis: 2026-05-15.

Use this file to record iPhone/Safari and Android/Chrome evidence without storing sensitive values.

## Redaction checklist (apply before saving)

- [ ] Token redacted (`redacted:abc123...wxyz` pattern only).
- [ ] Participant identifiers removed or masked.
- [ ] Phone numbers masked (`***-***-1234` max).
- [ ] OTP values removed.
- [ ] Sensitive support/free-text message content removed or generalized.

## Screenshot template

| Field | Value |
| --- | --- |
| Artifact type | Screenshot |
| Platform | iPhone/Safari \| Android/Chrome \| iOS Simulator \| Android Emulator |
| Device model | |
| OS version | |
| Browser/version | |
| App commit hash | |
| Package/source used | local dev \| operator package \| hosted staging |
| Scenario state | link-open \| consent \| round1 \| later-round \| waiting \| closeout \| support \| withdrawal |
| Artifact path | |
| Token handling | redacted only |
| Observed result | PASS \| PARTIAL \| FAIL |
| Defect(s) found | none \| ticket IDs |
| Tester initials/date (UTC) | |

## Screen recording template

| Field | Value |
| --- | --- |
| Artifact type | Screen recording |
| Platform | iPhone/Safari \| Android/Chrome \| iOS Simulator \| Android Emulator |
| Device model | |
| OS version | |
| Browser/version | |
| App commit hash | |
| Package/source used | local dev \| operator package \| hosted staging |
| Scenarios covered | link-open, consent, round1, later-round, waiting, closeout, support, withdrawal |
| Artifact path | |
| Token handling | redacted only |
| Observed result | PASS \| PARTIAL \| FAIL |
| Defect(s) found | none \| ticket IDs |
| Tester initials/date (UTC) | |

## Session summary template

| Field | Value |
| --- | --- |
| Execution date/time (UTC) | |
| Real-device evidence run? | YES \| NO |
| Simulator/emulator evidence run? | YES \| NO |
| iPhone/Safari status | NOT RUN \| PASS \| PARTIAL \| FAIL |
| Android/Chrome status | NOT RUN \| PASS \| PARTIAL \| FAIL |
| Evidence folder | |
| Commit hash | |
| Remaining human/device-required items | |
| Summary defects | |
| Recorder initials | |
