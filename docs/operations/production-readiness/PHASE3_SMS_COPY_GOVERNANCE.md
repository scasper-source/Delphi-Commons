# Phase 3 SMS Copy Governance and Review Note

Status: **SMS COPY GOVERNANCE RECORDED + MOCK CONTROL EVIDENCE UPDATED (2026-05-13)**.

Decision label: **NOT READY FOR HUMAN TESTING**.

## Scope and boundary

This note records copy governance for **mock/sandbox SMS-linked participant entry** in Phase 3.

- Documentation-only governance record.
- No provider production credentials are added.
- No real SMS production delivery is enabled.

## SMS copy principles

All invitation/reminder copy used in mock/sandbox testing must satisfy all of the following:

1. **Neutral language**: message text is informational and non-persuasive.
2. **Voluntary participation**: participation is optional and non-coercive.
3. **No study-sensitive content** in message body.
4. Message text must **not** include:
   - diagnoses,
   - allegations,
   - legal strategy,
   - participant responses,
   - consensus status,
   - identity-response hints.
5. Logs/exports must contain **no sensitive message content**.

## Approved draft messages for mock/sandbox testing

The following examples are approved for mock/sandbox testing with synthetic/internal data:

- **Invitation (mock/sandbox)**
  - "Delphi study update: your secure session link is ready: {short_link}. Participation is optional. Reply HELP for support or STOP to opt out."
- **Reminder (mock/sandbox)**
  - "Delphi reminder: a secure session link is available: {short_link}. Participation is optional. Reply HELP for support or STOP to opt out."
- **Resend confirmation (mock/sandbox)**
  - "Delphi: a new secure session link was requested and is ready: {short_link}. Participation is optional. Reply HELP for support or STOP to opt out."
- **Phone verification (Twilio/provider testing only)**
  - "Delphi phone verification code: {otp}. It expires in {ttl_minutes} minutes. Reply STOP to opt out."

Notes:
- `{short_link}` must be opaque and expiring.
- `{otp}` must not be logged, exported, committed, or copied into evidence.
- Message variants should change minimally and preserve neutral/optional language.

## Prohibited examples

The following copy patterns are prohibited:

- "Your diagnosis response is due now."
- "Most participants answered X; please align before submitting."
- "Legal review requires your allegation details today."
- "You said [participant response]; confirm immediately."
- Any message body containing condition labels, risk findings, consensus trend, or identity-response linkage.

## STOP/HELP handling requirement

Before any real SMS use, STOP/HELP behavior must be implemented and verified.

For mock/sandbox testing, one of the following must be explicitly documented per run:
- simulated STOP/HELP handling in outbox logs/transcripts, or
- explicit disabled-state note showing no real carrier delivery and no real opt-out transport.

## Opt-in requirement

- SMS must be opt-in only.
- Participant entry must remain available through approved non-SMS fallback paths where policy requires.
- No SMS send/reminder action may proceed without recorded opt-in state.

## Resend/reminder frequency and rate limit expectations

Minimum policy expectations for Phase 3 mock/sandbox behavior:

- Resend cooldown enforced (example target: no immediate repeat sends).
- Reminder frequency bounded (example target: no high-frequency repeated reminders).
- Daily per-participant cap documented for mock/sandbox tests.
- Operator-visible reason when a send is suppressed by rate-limit policy.

Candidate-stage implementation evidence (local sandbox) now records:
- resend cooldown: 10 minutes;
- daily per-participant cap: 2 sends per rolling 24 hours;
- suppression reason evidence (`resend_cooldown_active`, `daily_sms_cap_reached`).

## Staff permission gates

Send and reminder actions must be permission-gated:

- Authorized role checks are required before invite/reminder/resend actions.
- Privileged actions must be attributable to a staff actor in audit events.
- Any override path must be restricted and separately audited.

## Audit requirements

Audit evidence must show:

- send/reminder attempts recorded,
- no raw token,
- no OTP,
- no full phone number,
- no sensitive message body.

Expected audit metadata fields include attempt type, timestamp, actor, template/version, delivery-state surrogate, and redaction markers where relevant.

## Copy review checklist

Use this checklist for each template/version under test:

- [ ] Language is neutral.
- [ ] Participation is explicitly voluntary.
- [ ] No study-sensitive content appears in body text.
- [ ] No diagnosis/allegation/legal strategy/participant response/consensus/identity-response hint appears.
- [ ] STOP/HELP statement is included or simulated-equivalent handling is recorded for sandbox-only run.
- [ ] Opt-in prerequisite is documented.
- [ ] Resend/reminder cadence and rate limits are documented.
- [ ] Permission gates for sender actions are documented.
- [ ] Audit artifacts confirm no raw token/OTP/full phone/sensitive body.
- [ ] Non-claims remain visible in associated release/readiness notes.

## Remaining blockers

Phase 3 SMS copy governance remains blocked for human testing until all items below are closed:

1. Copy review signoff package produced with reviewer names/dates.
2. Mock/sandbox run evidence demonstrates STOP/HELP behavior (or clearly simulated equivalent) and opt-in enforcement.
3. Audit export review proves redaction requirements (no raw token/OTP/full phone/sensitive body).
4. Rate-limit thresholds and suppression behavior verified in execution evidence.
5. Staff permission gates verified with role-attribution evidence.

## Explicit non-claims

This note does **not** claim:

- production SMS deliverability,
- telecom/legal regulatory compliance certification,
- human-subjects approval,
- IRB approval,
- security/privacy certification,
- production readiness,
- readiness for human testing.
