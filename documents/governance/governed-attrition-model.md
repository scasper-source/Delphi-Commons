# Governed Attrition Model

This platform treats non-response and withdrawal as methodological events, not as participant removal.

Participant status is stored as a study-version enrollment record. The supported statuses are `ACTIVE`, `NON_RESPONSIVE_FLAGGED`, `WITHDRAWN_PARTICIPANT`, `WITHDRAWN_PI`, and `COMPLETED`. Status changes append timeline entries and audit events, while prior responses remain in the response store.

The non-response policy is configured before launch and is locked after Round 1 opens. Detection is deterministic: missed current-round deadline, optional no-activity threshold, and incomplete submission after deadline when configured. Detection flags a participant for review but does not withdraw them automatically.

The PI/admin workflow is intentionally staged:

1. Detect and flag configured non-response.
2. Queue a neutral reminder.
3. Start and expire the follow-up window.
4. Queue a final notice when enabled.
5. Mark inactive for future rounds only, with reason, note, round, and safeguard acknowledgement.

Participant self-withdrawal remains voluntary. Withdrawal blocks future participation through the invitation or participant submission APIs, but prior submitted responses remain in historical round data, audit logs, exports, and attrition reporting according to the study protocol and consent terms.

Exports and reports include attrition summaries and the required limitation:

> Attrition may affect interpretation of consensus. Participants marked inactive or withdrawn from future rounds remain represented in prior submitted data according to the study protocol. Consensus indicates agreement among this panel; it does not establish correctness.

The anonymized response dataset includes participant status rows using pseudonymous participant codes only. It does not expose direct participant identity or an identity-response mapping.
