# Delphi Commons Project History

**Project:** Delphi Commons
**History through:** 2026-05-02
**Status:** Local MVP is close to mock-trial readiness; Phase 10 deployment/mock-trial readiness remains next.

This document summarizes the work completed in Codex from the original governance and MVP tickets through the current frontend/backend human-subjects readiness build. It is a project history, not a regulatory certification or IRB approval.

## 1. Foundational Governance And Planning

The project began by establishing the ethical and methodological commitments for an open-source Delphi Commons platform.

Completed foundations:

- Added the Ethical Governance Charter and compliance framework.
- Added the AI Governance / Human-in-the-Loop thin specification.
- Added the July MVP plan with explicit backend tickets and AI tickets.
- Defined the core principle that Delphi consensus must never be framed as truth.
- Established non-negotiables around uncertainty, dissent, non-consensus, attrition, confidentiality, consent, withdrawal, locked methods, AI traceability, and human approval.

Key repository history:

- `96bc97e Add governance docs and compliance framework`
- `864bbbd Add July MVP plan`

## 2. Initial Technical Skeleton

The first implementation stage created the project structure and basic runtime foundations.

Completed work:

- Created the web MVP repository skeleton.
- Added the Fastify backend with a `/health` endpoint.
- Added the React/Vite frontend scaffold.
- Added development/build structure for local iteration.

Key repository history:

- `40bc81b Add web MVP repo skeleton`
- `25d4c5a Add Fastify server with /health endpoint`
- `fc05308 Scaffold React app (Vite) for mobile-first UI`

## 3. Core Backend MVP Tickets

### Ticket 1 / 1b: Repo And React App Scaffold

Completed:

- Repository skeleton.
- React/Vite app shell.
- Mobile-first frontend foundation.
- Initial navigation and module structure.

### Ticket 2: Roles, RBAC Scaffolding, And Audit Log

Completed:

- Role model scaffolding.
- Backend role checks.
- Append-only audit log foundation.
- Admin/audit-test route.

Key repository history:

- `e2dee20 Add RBAC scaffolding and append-only audit log`

### Ticket 3: Study, StudyVersion, And Dual Signoff Gate

Completed:

- Study and StudyVersion models.
- Version status lifecycle.
- Owner and Ethics/Methods Steward signoff gate.
- Activation blocked until required signoffs are present.
- Signoff events audited.

Key repository history:

- `1228d0c Ticket 3: Study + StudyVersion + dual signoff activation gate`
- `585dbb0 Update status: Ticket 3 complete, Ticket 4 next`

### Ticket 4: Consensus Rule Required And Locked

Completed:

- Consensus rule required before Round 1.
- Consensus rule locked after Draft/governance progression.
- Round 1 opening blocked without consensus rule.
- Consensus rule actions audited.

Later refinement:

- Consensus threshold is now constrained to 60%, 70%, 80%, or 90%.
- Consensus rule source/process metadata is captured.
- PI-defined, governance-defined, protocol/IRB-defined, panel-informed pre-round, and stakeholder-informed pre-round paths are supported.
- Panel/stakeholder-informed consensus setup is treated as pre-round setup evidence, not a Delphi round.

Key repository history:

- `3cfc334 Ticket 4: consensus rule required + lock on Round 1 open; stabilize dev/build`
- `bf45110 Update status: Ticket 4 complete, Ticket 5 next`
- `9ce4bb3 Add pre-round consensus rule governance`

### Ticket 5: Identity Store And Response Store Separation

Completed:

- Separated participant identity/master data from response records.
- Responses contain participant IDs but not direct identity fields.
- Identity master list access is RBAC-gated and audited.
- Identity/response separation became a central readiness control.

Key repository history:

- `63401a2 Ticket 5: Separate identity store from responses with RBAC and audit`
- `c6e8def Update status: Ticket 5 complete`

### Ticket 6: Consent Versioning, Consent Capture, And Withdrawal

Completed:

- Consent versioning.
- Active consent required for participant submission.
- Consent capture.
- Withdrawal blocks future submissions.
- Consent and withdrawal actions audited.

Key repository history:

- `9511dd1 Add consent versioning and stabilize data store paths`

### Ticket 7: Round 1 Open-Ended Collection

Completed:

- Round 1 open-text response submission.
- Submission tied to open Round 1 StudyVersion.
- Owner-only response summary.
- Reminder logging audited.
- Later UI work added review of submitted responses and edit/close behavior.

Key repository history:

- `d84cc1e Add round 1 response summary and reminder logging`

### Ticket 8: Manual Curation Desk

Completed:

- Manual draft item creation.
- Item listing and publishing.
- Merge/split workflows.
- Required merge/split rationale.
- Curation actions audited.
- Later frontend work connected real Round 1 responses into curation and provenance.

Key repository history:

- `5879525 Add manual curation items and merge rationale logging`
- `78fde62 Add manual curation desk items, merge, and split actions`

### Ticket 9: Round 2 Rating And Neutral Feedback

Completed:

- Round 2 rating endpoint.
- Neutral feedback endpoint with median, dispersion/IQR, distribution, and prior response.
- Retain/revise action support.
- Later UI changed participant-facing rating choices from bare numbers to verbal labels mapped to numeric values internally.

Key repository history:

- `a4f54b6 Add Round 2 rating and neutral feedback endpoints`

### Ticket 10: Reproducible Export Report Including Non-Consensus

Completed:

- Staff-only export report endpoint.
- StudyVersion included in export.
- Config hash and dataset hash.
- Methods, limitations, item summaries, and consensus classification.
- Non-consensus preserved.
- Export action audited.

Key repository history:

- `5d284f2 Add reproducible export report endpoint with audit logging`

## 4. Multi-Round And Method Model Expansion

### Ticket 11: Study Design Declaration

Completed:

- Study format declaration: Modified Delphi or Classic Delphi.
- Planned round count.
- Terminal round number.
- Method rationale.
- Consensus rule required before signoff/opening.
- Design settings locked outside Draft.
- Design-setting actions audited.
- Design fields included in export/report output.

Key repository history:

- `2715636 Add study design declaration and locked method config`

### Ticket 12: Generalize Round Model Beyond Round 2

Completed:

- Generic later-round item listing.
- Generic later-round rating.
- Generic later-round feedback.
- Round summary endpoints.
- Rating rounds gated by declared study design.
- Modified Delphi supports through Round 3.
- Modified Delphi Round 4 is blocked.

Key repository history:

- `c49a718 Generalize later-round response and summary routes`

### Ticket 13: Round-Aware Post-Round Reporting

Completed:

- Staff-only round report endpoint:
  - `GET /studies/:studyId/versions/:versionId/rounds/:roundNumber/report`
- Interim vs final report classification based on terminal round.
- Method/config snapshot.
- Limitations and consensus caution.
- Round summaries and item-level summaries.
- `round.report_get` audit event.

Key repository history:

- `a80d970 Add round-aware post-round report endpoint`

### Ticket 14: Classic Delphi Round 4 Support

Completed:

- Verified Classic Delphi supports Round 4.
- Classic Delphi terminal Round 4 report returns final.
- Modified Delphi Round 4 remains blocked by declared design boundary.

Key repository history:

- `3d75d7b Record Classic Delphi Round 4 verification`

### Ticket 15: Final Round-Aware Export/Report

Completed:

- Export report now reflects declared terminal round.
- Modified Delphi exports final Round 3.
- Classic Delphi exports final Round 4.
- Report includes study format, planned round count, terminal round, method rationale, consensus rule, final-round items, non-consensus items, limitations, config hash, dataset hash, and auditability metadata.

Key repository history:

- `195ff7b Make export report final-round aware`

## 5. AI Tickets A-D

The AI build followed the governance rule that AI may draft, organize, lint, or suggest, but may not decide, persuade, optimize consensus, or publish without human action.

### AI Ticket A: AISuggestion, AI Audit Events, And Decision Gating

Completed:

- AISuggestion records.
- AI operation audit events.
- AI output hashes.
- Decision states: Accepted, Edited, Rejected, None/Pending.
- Human decision required before AI output can affect participant-facing material.

### AI Ticket B: Round 1 Clustering And Candidate Statement Drafting With Provenance

Completed:

- Inter-round synthesis foundations.
- Round 1 response clustering/drafting support.
- Candidate item generation from source response links.
- Provenance links from raw anonymized responses to candidate items.
- AI-assisted materialization requires human review and release controls.

### AI Ticket C: Neutrality Linter

Completed:

- Neutrality linting support.
- Forbidden/coercive language checks.
- Participant-facing wording safeguards.
- Tests and UI copy avoid terms like "truth," "correct answer," "outlier," "deviant," "move toward the group," "optimize consensus," and similar pressure language.

### AI Ticket D: IRB Pack Generator

Completed:

- IRB pack draft generation foundation.
- IRB-related AI output remains draft-only.
- IRB pack cannot be exported for official use until accepted and release-signed.
- AI disclosure language included in ethics/export evidence.

## 6. Frontend Architecture And Product Buildout

The frontend evolved from a scaffold into a role-aware conductor interface for study owners, stewards, data custodians, admins, and panelists.

Major frontend modules built:

- Dashboard / active study overview.
- Study Builder wizard.
- Governance checklist and signoff screen.
- Round Manager.
- Curation Desk.
- Controlled Feedback screen.
- Participant Portal.
- Reporting Dashboard.
- Audit Log Viewer.
- Admin / Security Console.
- Role assignment and review UI.

Major frontend design principles implemented:

- Calm, professional interface.
- Progressive disclosure in the Study Builder.
- Role-aware navigation and actions.
- Visual management of blockers and next actions.
- No coercive convergence language.
- Plain participant-facing copy.
- Professional researcher/admin copy.
- Methodological guardrails shown inline.

Important frontend corrections made through live review:

- Fixed text overlapping cards and inputs.
- Removed unnecessary scaffold/wired labels from navigation.
- Improved feedback panel spacing.
- Corrected reporting page output model text and status spacing.
- Improved curation layout for long participant responses.
- Fixed governance checklist alignment and signoff spacing.
- Fixed status text running together.
- Improved Data Custodian/Admin spacing.
- Built saved-study/open-study flow.
- Built Study Builder wizard and backend save path.
- Fixed save behavior and study list expectations.
- Added archive option instead of destructive delete.
- Added planned round visibility for modified/classic models.
- Added Round 1 setup and participant Round 1 flow.
- Added participant review of what was submitted.
- Applied retain/revise review pattern across later rounds.
- Added Round 2 opening and rating workflow.
- Replaced bare numeric participant rating language with verbal choices.
- Added pre-round consensus setting UI.
- Restricted consensus threshold to 60/70/80/90.
- Added plain-language explanation of threshold and agreement minimum rating.
- Polished the consensus explanation layout.

Key repository history:

- `2826c15 Build eDelphi production workflow foundation`
- `b3d0032 Build eDelphi workflow and round progression MVP`
- `9ce4bb3 Add pre-round consensus rule governance`

## 7. Backend Production Workflow Foundation

After the MVP tickets, the backend was hardened toward production-style behavior.

Completed:

- Real user accounts.
- Session/login foundation.
- Study membership and assignments.
- Backend-enforced roles for protected endpoints.
- Participant invitation links/tokens scoped to one study/version.
- Invitation revocation.
- Participant access without passwords or API keys.
- Role downgrade/removal access tests.
- Header manipulation rejection in session-required mode.
- Deletion review request foundation.
- Backup/restore foundation.
- Data integrity inspection.
- Audit integrity verification.

Key repository history:

- `08ee4d4 Add human subjects readiness and harden auth roles`
- `b589e8e Harden governance audit exports and security`

## 8. Human Subjects Readiness Phases

### Phase 1: Readiness Requirements

Completed deliverables:

- `HUMAN_SUBJECTS_READINESS.md`
- Control matrix.
- Test evidence checklist.
- Release blocker list.

This phase mapped requirements to implementation, tests, and evidence across consent, withdrawal, confidentiality, retention, governance, rounds, AI, identity separation, audit, accessibility, security, backup/recovery, incident response, and export evidence.

### Phase 2: Production Authentication And Roles

Completed:

- Real user accounts.
- Secure session foundations.
- Study membership table.
- Backend-enforced roles.
- Participant invitation links with expiration/revocation/one-study scope.
- No participant passwords or API keys.
- Role assignment/review UI.
- Audit events for membership, role changes, identity access, and admin actions.

Acceptance coverage added:

- Participant cannot access staff views.
- Steward cannot act as PI unless explicitly assigned.
- Inactive invitation cannot submit.
- Role downgrade removes access.
- Backend rejects manipulated UI/client role attempts.

### Phase 3: Data Model Hardening

Completed foundations:

- Relational schema/migration foundations.
- Immutable study version behavior.
- Separate identity, consent, response, rating/item, audit, and export records.
- Soft archive behavior.
- Withdrawal/deletion request workflow.
- Backup/restore procedure.
- Seed/test fixtures and integrity checks.

### Phase 4: Participant Production Flow

Completed:

- Invitation landing behavior.
- Consent version display and acknowledgement.
- Confidentiality language: "confidential to research team" rather than false anonymity.
- Round 1 open-text task.
- Round 2+ structured judgment with verbal choices.
- Retain/revise workflow.
- Withdrawal workflow.
- Participant review of submitted content.
- Draft/autosave risk surfaced as a release issue.
- Plain-language participant copy foundations.

### Phase 5: Governance Gate And Round Lifecycle

Completed:

- Required signoffs before launch.
- Consensus rule locked before Round 1.
- Modified Delphi warning when Round 1 is structured.
- Round 1 closure prevents further participant changes.
- Curation gated on Round 1 closure.
- Round 2 gated on published traceable items.
- Round 3/4 carry-forward governed by declared design.
- State transitions audited.

### Phase 6: Curation, AI, And Provenance

Completed:

- Raw anonymized responses feed curation.
- Candidate items preserve source links.
- Merge/split/reject/retain require rationale.
- Minority/unique statements visible by default.
- AI suggestions labeled "AI Suggestion (Not Final)."
- AI outputs cannot reach panelists without human accept/edit/reject and signoff.
- AI operation hashes and prompt/template versions included in evidence.
- Rejected items remain in provenance.

### Phase 7: Reporting And Exports

Completed package foundations:

- Final Delphi Report.
- IRB / Ethics Pack.
- Anonymized Response Dataset.
- Audit Package.
- Provenance Bundle.
- Complete Locked Archive.

Each package includes:

- Manifest.
- Schema version.
- Hashes.
- Data cutoff.
- Creator and role.
- Review status.
- Redaction status.
- Limitations/disclosures.
- Download audit logging.

Required reporting behavior:

- Consensus, near-consensus, and non-consensus are included.
- Required statement is present: "Consensus indicates agreement among this panel; it does not establish correctness."
- Anonymized dataset excludes identity-response mapping.
- Audit package includes signoffs, exports, AI operations, identity access, and item changes.

### Phase 8: Security Hardening

Completed:

- ASVS-oriented controls.
- Secure HttpOnly/SameSite session cookies.
- CSRF cookie/header checks for cookie-backed mutations.
- Bearer-session support.
- Auth/invitation/mutation rate limits.
- Strict CORS allowlist.
- No-store/security headers.
- Generic server error handling.
- Request body limits.
- Header-based participant invitation tokens.
- URL-fragment invitation links.
- Deprecated URL-token routes.
- Participant free-text input length checks.
- No unsafe React HTML sinks.
- No browser local/session storage for sensitive data.
- Append-only audit hash verification.

Remaining before real launch:

- Deployment-specific TLS/reverse-proxy validation.
- Secret management.
- CI dependency scanning.
- Penetration/ASVS review evidence.
- Operational monitoring.

### Phase 9: Accessibility And UX Validation

Completed:

- WCAG 2.2 AA-oriented checklist.
- Keyboard walkthrough notes.
- Screen reader review notes.
- Mobile screenshots.
- Copy review log.
- Focus styling.
- Contrast improvement.
- Automated source checks for unsafe sinks/storage.
- Browser validation for sampled pages.

Remaining before real launch:

- Human NVDA/VoiceOver review.
- Active Round 1 and Round 2 participant mobile evidence.
- Full contrast/axe-style audit.
- Plain-language review for consent/withdrawal/task/error copy.

Key repository history:

- `ee55330 Add WCAG accessibility validation evidence`

## 9. Current Testing And Road-Test Evidence

Current automated evidence includes:

- Frontend policy/accessibility tests.
- Backend end-to-end road test covering study creation, auth, roles, consent, invitations, Round 1, curation, AI, later rounds, reporting, exports, withdrawal, audit integrity, and backup/restore.
- App build.
- Server build.

Current successful commands as of the latest work:

- `cd app && npm.cmd run build`
- `cd app && npm.cmd test`
- `cd server && npm.cmd test`

## 10. Current Repository State

Most recent commits:

- `9ce4bb3 Add pre-round consensus rule governance`
- `ee55330 Add WCAG accessibility validation evidence`
- `b589e8e Harden governance audit exports and security`
- `08ee4d4 Add human subjects readiness and harden auth roles`
- `2826c15 Build eDelphi production workflow foundation`
- `b3d0032 Build eDelphi workflow and round progression MVP`

The working tree was clean immediately after commit `9ce4bb3`.

## 11. Current Product Position

The system is close to being ready for a mock trial with real people, provided the trial is framed as a software workflow/usability rehearsal and not a real human-subjects study.

Appropriate mock-trial rules:

- Use synthetic or low-risk study content.
- Do not enter private, clinical, employer, patient, or identifiable information.
- Tell testers this is a platform rehearsal.
- Treat exports as test artifacts.
- Archive/reset test studies after use.

Mock-trial workflow to test:

1. PI creates a study.
2. PI sets threshold, agreement rating, and rule source.
3. Governance signoff flow works.
4. Round 1 opens.
5. Participants acknowledge consent/confidentiality language and submit open responses.
6. PI closes Round 1.
7. Curation turns responses into traceable candidate items.
8. Items are accepted/published.
9. Round 2 opens.
10. Participants rate using verbal choices.
11. Reporting/export packages are generated.
12. Audit/provenance evidence is reviewed.

## 12. Phase 10: Next Planned Work

Phase 10 has not been completed yet. The planned Monday work is:

- Commit current work. Completed on 2026-05-02 as `9ce4bb3`.
- Define staging vs production environments.
- Add visible mock-trial/staging banner.
- Create deployment readiness checklist.
- Confirm no sensitive data in logs, URLs, browser storage, analytics, or exports.
- Confirm backup/restore and export package behavior.
- Run full end-to-end localhost road test.
- Plan cloud migration:
  - GitHub repository.
  - Private repo initially, public/open-source later when ready.
  - Staging hosting.
  - Managed database target, likely Postgres.
  - Object storage for exports/backups.
  - Environment variable template.
- Prepare mock-trial packet:
  - Participant instructions.
  - No-sensitive-data warning.
  - Fake study scenario.
  - Small invitation plan.
  - Tester feedback form/checklist.
- Deploy staging when account setup is ready.
- Run the full road test against staging.

## 13. Open Release Blockers

The current release blocker file tracks strict blockers before real human-subjects launch. The major P0 themes are:

- Production security deployment evidence.
- Retention automation and production backup/restore operations.
- Human WCAG 2.2 AA accessibility evidence.
- Independent security hardening evidence.
- Incident response workflow/runbook.
- Completeness of anonymized dataset, audit package, and provenance bundle.
- Full end-to-end dry-run evidence.

The current product can support a controlled mock trial with synthetic data, but it should not yet be used for a real human-subjects study.

## 14. Core Design Commitments Preserved

Across the tickets and phases, the following commitments have stayed central:

- Consensus means agreement among this panel, not correctness.
- Non-consensus and minority/unique views are retained.
- Participants are not pressured to converge.
- Participants can retain or revise responses.
- Confidentiality is described accurately; complete anonymity is not falsely promised.
- Consensus rules are predefined and locked before Round 1.
- AI is draft-only and human-governed.
- Participant-facing AI-influenced material requires human approval.
- Identity-response mapping is separated and access controlled.
- Sensitive actions are auditable.
- Exports are package-based, versioned, hashed, and review-gated.
- The platform is being built toward human-subjects readiness, not just feature completion.
