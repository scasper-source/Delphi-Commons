# Product Readiness Plan for eDelphi: Downloadable Laptop and Phone Human Testing Candidate

Status: planning document. This is not a production-readiness claim.

Date basis: 2026-05-11.

This document resets the near-term readiness plan around the project's actual next goal:

**Build a downloadable/operator-ready eDelphi candidate that can run on laptops and be opened on phones through SMS-linked participant access, then use that candidate for final human testing.**

The final stage of this plan is human testing. A controlled pilot, production deployment, and public open-source release remain later decisions and require separate approvals.

## Governing Documents

This plan is subordinate to:

- [Ethical Governance Charter for Delphi Commons](../../../documents/governance/ethical-governance-charter.md)
- [AI Governance & Human-in-the-Loop Thin Spec](../../../documents/governance/ai-assistance-thin-spec.md)
- [Human Subjects Readiness Plan](../../../documents/compliance/human-subjects-readiness/HUMAN_SUBJECTS_READINESS.md)

Where documents conflict, the stricter human-protection, privacy, methodological-integrity, accessibility, security, or AI-HITL requirement governs.

## Non-Claim Boundary

Current merged evidence supports controlled synthetic/mock testing and engineering readiness only. This plan does not authorize or claim:

- production deployment,
- pilot readiness,
- real human-subjects research readiness,
- IRB/ethics approval,
- legal approval,
- security certification,
- accessibility certification,
- unrestricted public release,
- native app-store distribution.

Human-required evidence must be observed, recorded, and signed by the relevant human role. Codex may prepare tooling, templates, documentation, scripts, and evidence binders, but must not invent human observations, phone results, reviewer decisions, deployment facts, notification outcomes, or signoffs.

## Immediate Product Objective

The next target is not a pilot. The next target is:

**HUMAN TESTING CANDIDATE READY**

That means a named commit produces an operator-ready package that:

- can be downloaded or checked out cleanly on a laptop,
- can be started, stopped, reset, backed up, restored, and inspected from documented operator steps,
- exposes a mobile participant experience that can be opened on phones,
- supports SMS-linked participant entry in a governed, neutral, auditable way,
- includes synthetic demo data or a repeatable synthetic study setup,
- includes a human testing binder with checklists, observer transcript, screenshot/log index, defect rubric, and signoff forms,
- preserves all non-claims until human testing is actually completed and reviewed.

## Current State Summary

Use existing evidence as baseline. Do not rerun mock-trial work unless a change could invalidate it.

| Area | Current status | Readiness interpretation |
| --- | --- | --- |
| Mock-trial flow | Full synthetic browser automation evidence exists for 8 participants x 4 Classical Delphi rounds with P0=0, P1=0, P2=0, P3=0. | Strong mock-trial baseline only. |
| Mobile layout | 320px, 390px, and 414px final closeout evidence passed after the 320px overflow fix. | Useful regression baseline. Real-device and assistive-technology checks still required. |
| Auth/session/roles | Session-required auth hardening, membership enforcement, role downgrade behavior, and audit evidence exist. | Materially reduces pilot blocker risk. |
| Retention/deletion | Data Custodian review and deletion execution paths exist, with export suppression evidence. | Local synthetic evidence only; production-like rehearsal and signoff still required. |
| Backup/restore | Local automated backup/restore rehearsal exists with audit/data integrity checks. | Local engineering evidence only; production-like operator rehearsal still required. |
| Incident workflow | Incident records, pause-study-equivalent action, severity, notification decision, timeline, and audit checks exist. | Synthetic/tabletop evidence only; deployment-connected human drill still required. |
| Deployment security checks | Repo-verifiable security tests and deployment verification script exist. | Named environment evidence and independent/security lead acceptance still required. |
| Export privacy/provenance | Governed packages include reviewer provenance metadata; focused export privacy/provenance tests exist. | Data Custodian/reviewer signoff still required. |
| External collaborator smoke | External collaborator reported successful client/server build and start. | Build/start smoke only; not workflow validation. |
| Human/deployment closeout | Evidence-gap binders/templates exist or are being prepared. | Gaps remain open until human testing is performed against a candidate. |

## Product Tracks

| Track | Intended use | Data allowed | Decision label |
| --- | --- | --- | --- |
| `mock_trial` | Synthetic controlled engineering rehearsal. | Synthetic or low-risk test data only. | GO / GO WITH CONDITIONS for mock testing only. |
| `human_testing_candidate` | Downloadable laptop and phone-accessible candidate for internal human testing. | Synthetic/internal test data only unless separately approved. | READY FOR HUMAN TESTING / NOT READY. |
| `controlled_pilot` | Future named pilot under institutional/legal/ethical approval. | Real participant data only after all required approvals and P0 gates. | PILOT AUTHORIZED / NOT AUTHORIZED. |
| `production_candidate` | Future production release candidate. | Deployment-specific data only after pilot and production gates. | PRODUCTION CANDIDATE APPROVED / NOT APPROVED. |
| `public_open_source` | Future public source release. | No real data, secrets, identity mappings, or sensitive exports in repo. | PUBLIC RELEASE APPROVED / NOT APPROVED. |

This plan focuses on `human_testing_candidate`.

## Supported Product Surfaces For Human Testing

| Surface | Near-term status | Product intent | Evidence required before human testing |
| --- | --- | --- | --- |
| Windows laptop operator package | In scope now. | Primary first human testing path. | Clean install/start/stop/reset, local data directory policy, backup/export paths, smoke test, uninstall/reset notes, Defender/SmartScreen limitation notes if unsigned. |
| macOS laptop operator package | In scope now if a Mac tester is available. | Secondary laptop support path. | Clean install/start/stop/reset, Intel/Apple Silicon statement, Gatekeeper/signing limitation notes, local data directory policy, smoke test. |
| Phone participant mobile web | In scope now. | Primary phone experience for participants. | iOS Safari and Android Chrome open-link evidence, responsive active task checks, consent/Round 1/later round/support/withdrawal checks, real-device accessibility notes. |
| SMS magic-link entry | In scope now. | Primary invitation/reminder entry path for phone testing. | Neutral SMS copy, opt-in/verification rules, opaque expiring links, rate limits, audit events, no sensitive content in SMS, STOP/HELP or documented simulated equivalent. |
| PWA install-to-home-screen | Design now; ship only if privacy-reviewed. | Optional phone convenience path. | Manifest/service-worker review, cache/storage privacy proof, logout/session revocation, iOS/Android behavior notes. |
| Native iOS app | Deferred unless explicitly approved. | Later distribution path only if mobile web/PWA is insufficient. | TestFlight/App Store plan, permissions, secure storage, privacy labels, SDK review, push notification governance. |
| Native Android app | Deferred unless explicitly approved. | Later distribution path only if mobile web/PWA is insufficient. | Internal testing/Play plan, permissions, secure storage, Data Safety inputs, SDK review, push notification governance. |

## Phase Roadmap

### Phase 0: Baseline Preservation

Goal: preserve current mock-trial and Phase 1 engineering evidence as a regression baseline.

Primary baseline index: `docs/operations/production-readiness/PHASE0_BASELINE_PRESERVATION_REGRESSION_INDEX.md`.

Required work:

- Keep latest mock-trial artifacts and pointers.
- Keep mobile width evidence at 320px, 390px, and 414px.
- Keep export privacy/provenance evidence and restricted-warning interpretation.
- Keep Phase 1 hardening, backup/restore, incident, deletion, deployment-security, and export-provenance evidence linked.
- Keep all non-claims visible.

Exit gate:

- `mock_trial` remains GO WITH CONDITIONS only.
- No production, pilot, IRB, legal, security, accessibility, or human-subjects readiness claim.

### Phase 1: Product Surface Lock

Goal: decide exactly what the human testing candidate will include.

Reference closeout note: [PHASE1_PRODUCT_SURFACE_LOCK_CLOSEOUT.md](./PHASE1_PRODUCT_SURFACE_LOCK_CLOSEOUT.md).
Architecture ADR required before implementation: [BACKEND_PACKAGING_PROCESS_SUPERVISION_ADR.md](./BACKEND_PACKAGING_PROCESS_SUPERVISION_ADR.md).
Stage 1 Windows prototype implementation note: [WINDOWS_OPERATOR_CANDIDATE_PROTOTYPE.md](./WINDOWS_OPERATOR_CANDIDATE_PROTOTYPE.md).
Stage 1 Windows portable package prototype note: [WINDOWS_OPERATOR_PORTABLE_PACKAGE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE.md).
Local Windows portable package evidence note: [WINDOWS_OPERATOR_PORTABLE_PACKAGE_LOCAL_EVIDENCE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE_LOCAL_EVIDENCE.md).
Stage 1 Windows evidence closeout note: [WINDOWS_OPERATOR_CANDIDATE_EVIDENCE_CLOSEOUT.md](./WINDOWS_OPERATOR_CANDIDATE_EVIDENCE_CLOSEOUT.md).
Local Windows supervisor evidence note: [WINDOWS_OPERATOR_CANDIDATE_LOCAL_SUPERVISOR_EVIDENCE.md](./WINDOWS_OPERATOR_CANDIDATE_LOCAL_SUPERVISOR_EVIDENCE.md).

Required decisions:

- Windows laptop operator path: included / excluded / deferred.
- macOS laptop operator path: included / excluded / deferred.
- Phone participant path: mobile web required.
- SMS path: mock provider only / real provider sandbox / real provider production credentials deferred.
- PWA path: included / excluded / deferred.
- Native iOS/Android: excluded unless separately approved.
- External AI mode: No External AI unless a named connector is separately approved.

Required evidence:

- Product surface matrix with included/deferred/not-shipped status.
- Runtime architecture diagram for laptop operator package and phone/SMS participant entry.
- Data storage and secret handling statement for laptop and phone paths.
- Explicit unsupported-target statements.

Exit gate:

- Human testing scope is locked for the candidate.
- No surface is implied supported unless it has an evidence plan.

### Phase 2: Downloadable Laptop Operator Candidate

Goal: make the app runnable by a human operator on a laptop without source-code editing.

Required implementation:

- Documented install/start/stop/reset path for Windows.
- Documented install/start/stop/reset path for macOS if in scope.
- Local runtime directory policy for database, audit logs, exports, backups, and evidence artifacts.
- Safe environment setup for development/testing secrets.
- One-command or clearly sequenced smoke test.
- Synthetic demo study seed or repeatable setup workflow.
- Operator checklist that covers study setup, roles, consent, invitations, rounds, curation, closeout, export, deletion, incident, backup, restore, and support.
- Packaging decision: script-based local package, bundled runtime, installer, or documented temporary dev package.

Required evidence:

- Clean checkout or downloaded package run result on Windows.
- Clean checkout or downloaded package run result on macOS if in scope.
- Commit hash and package/version identifier.
- Smoke test output.
- Known limitations.
- No secrets in repo or package.

Exit gate:

- Study Owner can launch the operator path from docs on a laptop.
- The candidate is ready for controlled synthetic walkthrough, not pilot or production.

### Phase 3: Phone Participant And SMS Candidate

Goal: make the participant experience openable on phones, with SMS-linked entry ready for human testing.

Required implementation:

- Mobile participant entry route works from an opaque link.
- SMS copy remains neutral and does not reveal study-sensitive content.
- SMS is optional and opt-in.
- Phone verification or clearly documented mock/sandbox equivalent exists.
- Magic links are opaque, expiring, single-use or otherwise risk-controlled, and do not include participant ID, study ID, email, phone, or role in the URL.
- SMS send/reminder attempts are audited without raw token, OTP, full phone number, or sensitive message content.
- STOP/HELP handling is implemented or explicitly simulated for the human testing candidate.
- Staff controls for resend/reminder are rate-limited and permission-gated.
- Mobile web task flow covers consent, Round 1, later round, no-active-task, closeout, support, and withdrawal.
- PWA cache/storage policy is documented if PWA is in scope.

Required evidence:

- iPhone/Safari real-device or simulator evidence.
- Android/Chrome real-device or emulator evidence.
- SMS mock/sandbox outbox evidence or provider sandbox evidence.
- Copy review for SMS messages.
- Privacy review of link/token behavior.
- Mobile screenshots or screen recordings for active tasks.

Exit gate:

- A participant tester can receive or simulate an SMS, open the phone link, consent, complete tasks, and access support/withdrawal paths using synthetic data.

### Phase 4: Human Testing Binder And Release Hygiene

Goal: assemble everything needed for final human testing.

Required implementation:

- Human testing binder with:
  - operator checklist,
  - observer transcript,
  - screenshot/log evidence index,
  - defect severity rubric,
  - accessibility checklist,
  - backup/restore rehearsal sheet,
  - retention/deletion rehearsal sheet,
  - incident drill sheet,
  - Data Custodian export review sheet,
  - security review/signoff sheet,
  - final P0 blocker table.
- Versioned candidate record:
  - commit hash,
  - branch/tag/package identifier,
  - supported surfaces,
  - unsupported surfaces,
  - test commands,
  - known limitations.
- Repository hygiene:
  - no secrets,
  - no real participant data,
  - no sensitive exports,
  - public/private boundary notes,
  - dependency/security audit result or documented endpoint limitation.

Required evidence:

- Binder committed or attached.
- Candidate checklist marked ready for human testing.
- All remaining human-required evidence marked NOT RUN / HUMAN_REQUIRED until testing occurs.

Exit gate:

- Decision may be **READY FOR HUMAN TESTING** only if the laptop and phone candidate can be run and the binder is ready.
- This does not close Phase 1 human evidence and does not authorize a pilot.

### Phase 5: Final Human Testing

Goal: conduct the actual human testing walkthrough against the pinned candidate.

Required human tests:

- Operator install/start/stop/reset on laptop.
- Staff workflow: study setup, role assignment, signoff, round launch, curation, feedback, closeout.
- Participant phone workflow: SMS link, consent, Round 1, later round, support, withdrawal/no-active-task.
- Keyboard-only walkthrough.
- NVDA and/or VoiceOver walkthrough.
- Real-device iOS and Android mobile review.
- Named deployment or local operator security review.
- Backup/restore and audit-integrity rehearsal.
- Retention/deletion execution and export suppression rehearsal.
- Incident drill with pause-study-equivalent action, severity rationale, notification/escalation decision, remediation, and recovery.
- Data Custodian review of anonymized dataset, audit package, provenance bundle, and residual re-identification risk.
- Final blocker review.

Required evidence:

- Observer transcript.
- Screenshots/logs.
- Command outputs.
- Defect log and disposition.
- Accessibility findings and remediations.
- Security/privacy residual-risk statements.
- Data Custodian export signoff or rejection.
- Final P0 blocker table.

Exit gate:

- **HUMAN TESTING COMPLETE** only if the walkthrough was actually performed and evidence is attached.
- If any P0 blocker remains open, the product remains not pilot-ready.
- If all P0 blockers are closed or accepted with authorized rationale, the project may consider a separate controlled-pilot authorization process.

## SMS And Phone Governance Rules

SMS and phone access are participant-facing governance features, not mere notification plumbing.

Rules:

- SMS must be optional and consented.
- SMS copy must be neutral.
- SMS must not include study-sensitive content, diagnoses, allegations, legal strategy, participant responses, consensus status, or identity-response hints.
- SMS links must be opaque and expiring.
- Raw SMS tokens, OTPs, and full phone numbers must not appear in audit logs or export packages.
- Phone numbers must be masked in UI and audit details.
- Reminder frequency must be rate-limited and documented.
- STOP/HELP handling must be implemented before real SMS use, or clearly simulated/disabled in the human testing candidate.
- Real SMS provider credentials must not be committed.
- Real SMS provider use requires Security & Privacy Lead and Data Custodian review before any real participant use.

## Evidence Requirements By Candidate Surface

| Evidence | Windows laptop | macOS laptop | Phone mobile web | SMS | PWA | Native mobile |
| --- | --- | --- | --- | --- | --- | --- |
| Install/start | Required if included | Required if included | Browser open-link required | Provider/mock setup required | Required if included | Deferred |
| Stop/reset/uninstall | Required | Required | Logout/session reset | Opt-out/reset | Cache reset | Deferred |
| Data directory policy | Required | Required | Browser storage policy | Phone storage/audit policy | Cache/storage policy | Secure storage policy |
| Accessibility | Keyboard and screen reader | Keyboard and VoiceOver | Real-device mobile | SMS copy clarity | Mobile a11y | Native a11y |
| Security/privacy | Local secrets, logs, exports | Local secrets, logs, exports | Link/session privacy | Token/provider privacy | Cache privacy | Permissions/SDK review |
| Human testing evidence | Required | Required if in scope | Required | Required if in scope | Required if in scope | Not in scope unless approved |

## Testing Requirements Before Human Testing

Minimum repo-verifiable checks:

- `npm --prefix server run build`
- `npm --prefix server test`
- frontend install/build/test where applicable
- export privacy/provenance focused test
- backup/restore rehearsal test
- incident workflow test
- deployment security verifier, if safe environment variables are supplied
- app smoke test for operator and participant entry paths
- mobile viewport checks at 320px, 390px, and 414px
- documentation claim scan for overstatements
- `git diff --check`

Minimum manual preflight checks:

- launch candidate on selected laptop path,
- open staff URL,
- open participant phone URL,
- simulate or send SMS with neutral copy,
- create synthetic study,
- confirm synthetic participant can complete at least one active task,
- confirm export package generation,
- confirm backup can be created,
- confirm reset/uninstall path is documented.

## Human Testing Decision Labels

| Label | Meaning |
| --- | --- |
| `NOT READY FOR HUMAN TESTING` | Candidate cannot yet be installed/run/walked through. |
| `READY FOR HUMAN TESTING WITH CONDITIONS` | Candidate can be walked through, but limitations are explicit. |
| `READY FOR HUMAN TESTING` | Candidate is installable/runnable on selected surfaces and binder is complete. |
| `HUMAN TESTING COMPLETE WITH OPEN BLOCKERS` | Human walkthrough happened, but some P0 blockers remain open. |
| `HUMAN TESTING COMPLETE; PILOT REVIEW MAY BEGIN` | Human walkthrough happened and P0 blockers are closed or accepted by authorized roles. |

None of these labels equals production readiness.

## Blockers That Remain Human-Required

These blockers cannot be closed by Codex alone:

- named deployment or laptop package security acceptance,
- production-like or operator-observed backup/restore acceptance,
- human accessibility review,
- independent/security lead hardening signoff,
- deployment-connected incident drill acceptance,
- Data Custodian export/residual-risk signoff,
- final human-observed end-to-end dry run acceptance.

## Codex-Ready Work Packets

| Packet | Objective | Done evidence |
| --- | --- | --- |
| HTC-WP1 | Define supported candidate surfaces. | Matrix marks Windows, macOS, phone web, SMS, PWA, native apps as included/deferred/not shipped. |
| HTC-WP2 | Build Windows operator run path. | Windows install/start/stop/reset docs and smoke evidence. |
| HTC-WP3 | Build macOS operator run path. | macOS install/start/stop/reset docs and smoke evidence, if in scope. |
| HTC-WP4 | Build synthetic demo study setup. | One documented setup path creates a repeatable human testing study. |
| HTC-WP5 | Harden phone participant flow. | Phone URL flow covers consent, active rounds, support, withdrawal, and closeout on mobile. |
| HTC-WP6 | Harden SMS magic-link path. | Neutral SMS, opaque link, opt-in, mock/sandbox evidence, audit/privacy checks. |
| HTC-WP7 | Decide PWA scope. | PWA is shipped, deferred, or not shipped with cache/storage rationale. |
| HTC-WP8 | Assemble human testing binder. | Binder contains checklists, transcript, screenshot/log index, defect rubric, signoffs, and blocker table. |
| HTC-WP9 | Run candidate smoke evidence. | Build/tests/smoke/mobile/export/backup/security checks are recorded. |
| HTC-WP10 | Execute final human testing. | Human evidence is attached and final blocker status is updated. |

## Later Work After Human Testing

If human testing succeeds, create a separate controlled-pilot readiness decision. That later process must still address:

- institutional/IRB/legal/ethics approvals where applicable,
- real-data deployment security,
- production monitoring,
- provider contracts for SMS or external services,
- final accessibility remediation,
- independent security review,
- production backup/restore and incident procedures,
- release notes and residual-risk acceptance.

Public open-source release remains separate and requires repository hygiene, license/dependency review, public docs, security policy, and removal of any sensitive material.

## Maintenance Rules

- Update this plan whenever the supported surfaces change.
- Do not call a laptop or phone target supported until its evidence exists.
- Mark native phone apps deferred unless explicitly approved.
- Keep SMS and phone governance visible in every release decision.
- Link every readiness claim to commit-specific evidence.
- Prefer "not ready" over ambiguous evidence.
