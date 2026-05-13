# PHASE 3 MAGIC-LINK PRIVACY REVIEW

Status: **MAGIC LINK PRIVACY REVIEW RECORDED**  
Decision label: **NOT READY FOR HUMAN TESTING**

Date recorded: 2026-05-12 (UTC)

## Scope

This review covers Phase 3 mobile magic-link privacy requirements against the currently implemented server-side behavior.

## Files inspected

- `server/src/routes/sms.ts`
- `server/src/core/smsNotifications.ts`
- `server/src/stores/smsStore.ts`
- `server/src/core/smsProvider.ts`
- `server/src/core/audit.ts`
- `server/src/routes/reports.ts`
- `server/src/exports/exportPrivacy.ts`
- `app/src` magic-link/mobile entry surface discovery via code search
- `documents/governance/sms-magic-link-notifications.md`
- `docs/operations/production-readiness/PRODUCTION_READY_EDELPHI_PLATFORM.md`

## Current behavior summary

1. **Magic-link URL format appears opaque**
   - SMS links are generated as `/m/{token}` using a 32-byte random Base64URL token.
   - Tokens are hashed (SHA-256, Base64URL) before persistence; raw tokens are not stored in `magic_link_tokens`.

2. **Magic links expire and are consumed once**
   - TTL is policy-controlled and clamped to 1..1440 minutes.
   - Consumption checks for `consumed_at IS NULL`, `revoked_at IS NULL`, and `expires_at > now`.
   - Successful use marks `consumed_at` and creates a separate short-lived magic session cookie.

3. **Participant mobile entry is sessionized after token use**
   - `/magic-links/consume` exchanges token for HttpOnly cookie `edelphi_magic_session`.
   - Downstream participant routes require this cookie-backed session.

4. **Audit logging posture is mixed**
   - SMS and magic-link audit events generally avoid raw token/OTP/full-phone content and use masked phone fields.
   - However, multiple audit details still include direct internal participant IDs for magic-link and SMS events.

5. **Export posture has a high-risk contradiction for audit-package JSON**
   - `audit-package/audit_events.json` exports raw `relevantAuditEvents` objects.
   - If audit details contain participant IDs, those IDs are exported in this restricted package despite metadata claiming participant direct identifiers are excluded.

## Privacy property assessment

| Property | Result | Evidence | Notes |
|---|---|---|---|
| links are opaque | **PASS** | `/m/{token}` construction and random token generation; token hash stored, not token plaintext | URL path token does not embed semantic participant/study fields. |
| links expire | **PASS** | TTL policy + expiry enforcement in token consumption query | Expired tokens rejected. |
| links are single-use or otherwise risk-controlled | **PARTIAL / FAIL** | Single token consumption is enforced, but issuance path does not revoke prior unconsumed tokens for same participant/round and may create multiple live tokens across sends | Risk control exists per token but not per participant-round; concurrent valid links can exist. |
| URL must not expose participant ID, study ID, email, phone, role, diagnosis/topic, or round metadata | **PASS** | URL path uses opaque token only | No listed metadata is embedded in URL shape. |
| raw tokens must not appear in audit logs or exports | **PASS (logs)** / **NOT-RUN (full export surface)** | Reviewed audited SMS/magic-link writes in inspected routes/core; no raw token fields written | Full dynamic export corpus not executed in this review; static inspection only for inspected paths. |
| OTPs/full phone numbers must not appear in audit logs or exports | **PASS (logs)** / **NOT-RUN (full export surface)** | OTP compared by hash; audit details use masked phone | Export runtime verification not executed in this review. |

## Findings and gaps

### Gap A — Participant IDs are logged in magic-link/SMS audit details

- Several events include `participantId` (direct identifier) inside `details` for `magic_link_created`, `magic_link_used`, `round_open_sms_sent`, and related actions.
- This increases re-identification/linkability risk in audit and downstream restricted export artifacts.

### Gap B — Audit package JSON exports raw audit event details

- `audit-package/audit_events.json` is generated from `relevantAuditEvents` without additional detail-level redaction.
- The same route labels this file as excluding participant direct identifiers, which may not be accurate if details contain participant IDs.

### Gap C — Token risk window can be multiplied

- No revocation/invalidating of prior active tokens for same participant-round at issuance time was found.
- Multiple still-valid links can exist simultaneously after repeated sends/retries/manual triggering.

## Fixes/tests added

- **No code changes were applied** in this review pass.
- Reason: scope requested documentation plus inspection, and no low-risk one-file privacy fix was implemented in this pass.

## Remaining gaps before human testing

1. Enforce participant-round token minimization strategy (e.g., revoke prior active token on new send, or strict one-active-token policy).
2. Redact participant identifiers from audit details for participant-facing SMS/magic-link events (or replace with non-linkable aliases).
3. Ensure `audit-package/audit_events.json` applies explicit detail redaction consistent with its declared privacy metadata.
4. Add explicit privacy tests that assert:
   - no raw token values in audit event serialization,
   - no OTP/full phone in audit details,
   - no participant direct IDs in de-identified outputs,
   - participant-round token issuance policy behavior.
5. Re-run export privacy verification with focused fixtures covering SMS/magic-link audit events.

## Explicit non-claims

- This review **does not claim** production readiness, pilot readiness, or human-subjects readiness.
- This review **does not claim** formal legal/privacy compliance certification.
- This review **does not claim** complete dynamic export-path verification; only static inspected-path posture is recorded.
- This review **does not claim** threat-model completeness or penetration-test equivalence.



## Phase 3 local hardening update (2026-05-13)
- Implemented: SMS/magic-link audit `details` no longer include direct `participantId`/`participant_id` fields for magic-link creation/use, round-open send/fail, and phone verification events; object IDs and authorization behavior remain unchanged.
- Implemented: new-send token minimization now revokes prior active participant+study+version+round magic-link tokens before issuing a new token, with regression coverage verifying only one active usable token remains.
- Implemented: audit-package JSON export now applies detail-level redaction for `participantId`/`participant_id` fields to align with reviewer-facing redaction metadata.
- Added regression checks for opaque URL token path, no raw token persistence/audit leakage, OTP and full-phone non-leakage, participant-ID absence from SMS/magic-link audit details, and one-active-token behavior across repeated sends.
- Non-claim boundary: these updates are local engineering hardening only and do not constitute production/pilot/human-subjects/real-SMS readiness claims.
