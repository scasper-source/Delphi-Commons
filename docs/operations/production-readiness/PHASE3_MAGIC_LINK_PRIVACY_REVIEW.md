# Phase 3 Magic-Link Privacy Review Packet

Status: **REVIEWER PACKET UPDATED (2026-05-15)**.
Decision label: **NOT READY FOR HUMAN TESTING**.

Date recorded: 2026-05-15 (UTC)

Phase 3 classification source: `PHASE3_CLOSEOUT_INDEX.md`.

## Scope

This packet summarizes implemented privacy posture for Phase 3 SMS magic-link and phone OTP pathways, with reviewer-ready status placeholders.

## Privacy review matrix

Reviewer status values are intentionally initialized to `NOT REVIEWED` and must be updated by human reviewers only.

| Review area | Current implementation summary | Reviewer status |
|---|---|---|
| Token generation | Magic-link token generated from cryptographically secure randomness (`crypto.randomBytes(32)`), URL-safe encoded; token path shape is opaque `/m/{token}`. | **NOT REVIEWED** |
| Token hashing/storage | Raw magic-link token is not persisted; SHA-256 Base64URL hash is stored (`token_hash`). OTP is stored as hash (`otp_hash`) and compared by hash. | **NOT REVIEWED** |
| Expiry | Magic-link TTL is clamped to `1..1440` minutes and enforced on consume; OTP has policy TTL and expires if not consumed. | **NOT REVIEWED** |
| Single-use/revocation behavior | Magic links are single-use (`consumed_at` gate). Prior active links for same participant+study+version+round are revoked before issuing new token. | **NOT REVIEWED** |
| URL contents | Participant/study/round/phone/role metadata are not embedded in the URL; URL contains opaque token only. | **NOT REVIEWED** |
| Audit contents | Audit events for SMS/magic-link avoid raw token and OTP, use masked phone fields, and avoid participant direct IDs in event `details` for covered magic-link/SMS actions. | **NOT REVIEWED** |
| Export behavior | `audit-package/audit_events.json` applies detail-level redaction for participant ID keys; export privacy helpers classify direct identifiers and restricted content. | **NOT REVIEWED** |
| Provider callback behavior | Inbound keyword callbacks process STOP/HELP using normalized/masked phone handling and audit metadata (`provider_message_id`, masked phone, source). No outbound auto-reply template currently defined. | **NOT REVIEWED** |
| Phone/OTP redaction | OTP plaintext is not logged/exported; phone is represented as masked (`***-***-####`) and by hash/last-four where needed. | **NOT REVIEWED** |

## Reviewer signoff placeholders (must remain open)

| Reviewer role | Reviewer name | Date | Status | Notes |
|---|---|---|---|---|
| Security & Privacy Lead | `TBD` | `TBD` | **OPEN** | Validate privacy controls and residual risk acceptance. |
| Data Custodian | `TBD` | `TBD` | **OPEN** | Validate data minimization/redaction/export retention posture. |
| SMS copy reviewer | `TBD` | `TBD` | **OPEN** | Validate content/privacy boundary for participant-facing SMS text. |
| Accessibility/mobile reviewer | `TBD` | `TBD` | **OPEN** | Validate mobile comprehension and response burden impacts. |

## Validation evidence expectation

Before human-testing readiness can advance, reviewer packet validation must include:

1. Targeted SMS/magic-link regression tests passing.
2. Privacy/export claim scan confirming docs and code remain aligned.
3. Human reviewer updates to status fields (currently all open).

## Remaining Phase 3 exit-gate blockers

1. All matrix rows remain `NOT REVIEWED` pending human reviewer adjudication.
2. All reviewer signoff placeholders remain `OPEN` pending named assignees and dated approvals.
3. STOP/HELP outbound confirmation posture (auto-reply vs no-auto-reply policy) still requires explicit governance decision in reviewer signoff.
4. Phase 3 remains **NOT READY FOR HUMAN TESTING** until above items are closed with evidence.

## Explicit non-claims

- This review does **not** claim production readiness.
- This review does **not** claim pilot/human-subjects readiness.
- This review does **not** claim legal/privacy certification.
- This review does **not** claim real-SMS carrier/compliance approval.
