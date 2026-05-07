# Production-Ready eDelphi Platform: Phased Implementation, Evidence, and Release Workflow

Status: planning document. This is not a production-readiness claim.

This document defines the workflow for moving the eDelphi MVP from controlled mock-trial readiness toward controlled pilot readiness, production-candidate readiness, and eventual public open-source release. It is implementation-oriented and evidence-driven. A release track can advance only when its required evidence exists and its blockers are closed or explicitly accepted by the authorized roles.

## Governing Documents

This workflow is subordinate to:

- [Ethical Governance Charter for Delphi Commons](../../../documents/governance/ethical-governance-charter.md)
- [AI Governance & Human-in-the-Loop Thin Spec](../../../documents/governance/ai-assistance-thin-spec.md)

Where this document is silent, the Ethical Governance Charter governs. Where this document conflicts with either governing document, the stricter human-protection, privacy, methodological-integrity, or AI-HITL requirement governs.

## Non-Claim Boundary

Current merged evidence supports controlled synthetic/mock testing only. It does not authorize:

- production deployment,
- real human-subjects research,
- IRB launch,
- use of sensitive participant data,
- legal compliance claims,
- security certification,
- accessibility conformance claims,
- unrestricted public release claims.

## Definition Of Production Readiness

The platform is production-ready only when all of the following are true for a named release candidate:

- Product workflows support complete study setup, consent, invitation, participant rounds, curation, feedback, final release, export review, support, withdrawal, retention, and incident handling without relying on ad hoc local scripts for ordinary operations.
- Governance controls enforce Study Owner, Ethics & Methods Steward, Security & Privacy Lead, Data Custodian, and maintainer decision rights.
- Human-subjects controls are implemented, documented, tested, and externally reviewed where applicable.
- Identity data, response data, audit logs, consent records, exports, and support notes are protected by production-grade authentication, authorization, encryption, retention, backup, restore, logging, and incident response.
- AI cannot decide, publish, persuade, erase dissent, silently transform study content, or use external processing without explicit enablement, disclosure, minimization, and human approval.
- Accessibility evidence supports WCAG 2.2 AA readiness for participant and staff workflows, including manual assistive-technology review.
- Deployment, upgrade, rollback, monitoring, backup, restore, and incident-response procedures have been rehearsed in production-like conditions.
- Release artifacts are reproducible from a clean checkout, signed or checksummed where appropriate, and linked to evidence.
- Supported client/install targets are named, tested, and documented; unsupported desktop or phone applications are explicitly marked not shipped.
- Remaining residual risks are documented and accepted by the authorized roles.

Production readiness is release-specific. Passing one release candidate does not automatically certify later code, later deployments, external AI connectors, new study designs, or new data classes.

## Release Tracks

| Track | Intended use | Data allowed | Required decision |
| --- | --- | --- | --- |
| `mock_trial` | Controlled synthetic or low-risk local/dev/staging rehearsal. | Synthetic or low-risk test data only. | GO / GO WITH CONDITIONS for mock testing only. |
| `pilot` | Controlled pilot under named institutional, legal, ethical, and operational constraints. | Real participant data only if all required approvals and P0 gates are closed. | Pilot authorization by Study Owner, Ethics & Methods Steward, Security & Privacy Lead, and Data Custodian. |
| `production_candidate` | Release candidate for production deployment by a controlled operator. | Deployment-specific real data only after pilot evidence and production gates pass. | Production-candidate approval with signed evidence bundle and residual-risk acceptance. |
| `public_open_source` | Public repository and tagged open-source release. | No real study data, secrets, identity mappings, or sensitive exports in the repository. | Public-release approval by maintainers after security/privacy/license/release gates pass. |

## Client Distribution Targets

Production readiness must name the client distribution targets that are supported by the release. Web deployment should be treated as the primary pilot path unless desktop or mobile packaging has its own evidence.

| Target | Intended role | Minimum release evidence |
| --- | --- | --- |
| Hosted web app | Default staff and participant client for pilot and production-candidate deployments. | Browser support matrix, TLS/session evidence, responsive/mobile checks, accessibility evidence, cache/storage privacy review. |
| Windows desktop install | Optional packaged staff/operator client or local controlled deployment shell. | Signed installer or documented unsigned-dev limitation, install/uninstall test, Windows compatibility matrix, update strategy, local data directory policy, SmartScreen/Defender notes, accessibility smoke. |
| macOS desktop install | Optional packaged staff/operator client or local controlled deployment shell. | Signed and notarized package for release candidates, Intel/Apple Silicon support statement, install/uninstall test, Gatekeeper notes, update strategy, local data directory policy, accessibility smoke. |
| Mobile web / PWA | Preferred phone path before native apps unless native capabilities are required. | iOS Safari and Android Chrome evidence, install-to-home-screen behavior if enabled, offline/cache privacy review, small-screen accessibility, no sensitive data in unsafe browser storage. |
| Native iOS app | Optional later distribution path for approved deployments. | App Store/TestFlight plan, privacy labels, permission inventory, secure storage/keychain review, session revocation, push-notification governance if used, mobile accessibility evidence. |
| Native Android app | Optional later distribution path for approved deployments. | Play/internal testing plan, Data Safety form inputs, permission inventory, secure storage/Keystore review, session revocation, push-notification governance if used, mobile accessibility evidence. |

Desktop and phone applications must not broaden data or readiness claims. A native app release is blocked if it introduces offline storage, push notifications, device identifiers, crash analytics, third-party SDKs, or app-store telemetry without privacy review, participant disclosure, and Data Custodian approval.

## Current State Summary

Use existing evidence instead of repeating completed mock-trial work. The current state should be interpreted as a strong baseline for the `mock_trial` track and an input to later tracks.

| Area | Current status | Reuse rule |
| --- | --- | --- |
| Controlled full mock trial | Evidence exists for 8 synthetic participants x 4 Classical Delphi rounds through local browser automation. Latest documented result: P0=0, P1=0, P2=0, P3=0. | Reuse as mock-trial baseline evidence. Do not treat as pilot or production evidence. |
| Mobile final closeout | 320px, 390px, and 414px evidence passes with no page-level horizontal overflow after remediation. | Reuse as regression baseline. Add real-device and assistive-technology evidence before accessibility claims. |
| Export privacy | De-identified exports passed with 0 failures; restricted warnings remain limited to restricted/internal packages. | Reuse as export privacy regression baseline. Expand for real study packages and reviewer-ready redaction evidence. |
| AI/HITL governance | Local/test AI governance checks passed with no live external AI calls. | Reuse for No External AI mode. External AI connectors require separate policy, tests, disclosure, and minimization evidence. |
| Phase 10 operations | Documentation exists; some synthetic/dev rehearsals passed; incident response, production-like staging, independent security review, and human accessibility review remain incomplete. | Reuse documentation and partial rehearsal evidence. Complete missing drills before pilot or production-candidate claims. |
| Human-subjects readiness package | Human-subjects readiness plan, blockers, control matrix, and evidence checklist exist. | Use as the detailed control baseline. Update statuses as implementation lands. |
| Open-source readiness | Clean GitHub import exists; governance, security policy, contribution files, and release checklist exist. | Use as repository baseline. Public release still needs dependency/license/security/release evidence. |
| Install packaging | Web/local developer operation exists as the practical baseline. Windows, macOS, PWA, and native mobile packaging are not yet release-supported unless separately evidenced. | Treat installers and phone apps as future distribution work, not implied current capability. |

## Phase Roadmap

### Phase 0: Mock-Trial Baseline Stabilization

Goal: preserve the current controlled synthetic evidence as a repeatable baseline.

Required evidence:

- Latest full mock-trial artifact and pointer retained.
- Mobile final closeout screenshots retained for 320px, 390px, and 414px.
- Export privacy scan retained with 0 failures and restricted-warning interpretation.
- Build/test commands documented with commit hash.
- Known limits remain visible in docs.

Exit gate:

- `mock_trial` track remains GO WITH CONDITIONS only.
- No language claims production, IRB, legal, security, or accessibility certification.

### Phase 1: Pilot-Readiness Hardening

Goal: close P0 blockers for a controlled pilot and remove ordinary reliance on local scripts for study operations.

Required implementation:

- Production authentication, session, membership, and role review.
- Deployment-specific secrets, TLS/reverse-proxy, CORS, CSRF, rate-limit, and security-header configuration.
- Retention/deletion workflow with Data Custodian review and evidence.
- Production-like backup, restore, migration, rollback, and audit-integrity rehearsal.
- Incident workflow: pause study, record incident, classify severity, notify, remediate, recover.
- Human-observed dry run covering staff and participant workflows.
- Accessibility review for consent and active round tasks with NVDA and/or VoiceOver.
- Pilot package templates for participant information, consent, confidentiality, withdrawal, retention, AI disclosure, and support.

Required evidence:

- Updated human-subjects control matrix.
- Closed or accepted P0 blocker list.
- Pilot dry-run transcript with screenshots or logs.
- Accessibility report with defects and remediations.
- Security/deployment checklist with residual risks.
- Backup/restore artifact and audit verification result.
- Incident drill artifact.

Exit gate:

- Pilot approval is possible only for a named deployment, study protocol, data class, and approval context.
- Any real participant pilot still requires applicable institutional, IRB, legal, or ethics authorization outside the software.

### Phase 2: Controlled Pilot Execution

Goal: operate one or more approved controlled pilots and collect operational evidence without expanding claims beyond the approved context.

Required implementation:

- Pilot-specific study configuration lock.
- Deployment monitoring and alerting.
- Staff onboarding and support workflow.
- Export review workflow with Data Custodian approval.
- Participant support, withdrawal, and incident paths verified during the pilot.
- Release-note and defect-triage process for pilot builds.

Required evidence:

- Pilot authorization record.
- Deployment bill of materials, commit hash, environment, and configuration summary.
- Pilot run log: dates, operators, participant counts, round states, support issues, withdrawals, incidents, exports.
- Security/privacy event review.
- Accessibility issue log from actual pilot use.
- Export package review evidence.
- Post-pilot retrospective and blocker update.

Exit gate:

- Pilot can advance only if no unresolved P0/P1 defects affect participant rights, confidentiality, identity/response separation, auditability, AI-HITL, or methodological integrity.

### Phase 3: Production-Candidate Release

Goal: prepare a production-candidate release with reproducible artifacts and production-like operations.

Required implementation:

- CI release workflow for frontend, backend, tests, security audit, dependency review, accessibility checks, artifact integrity, and documentation checks.
- Versioned migrations with tested upgrade and rollback paths.
- Production deployment guide for supported target environments.
- Signed or checksummed release artifacts.
- SBOM and dependency license review.
- Independent security review or documented ASVS review at the selected assurance level.
- Formal release notes, known limitations, and residual-risk record.

Required evidence:

- Release candidate tag and immutable evidence folder.
- CI pass record.
- Clean checkout install/build/test result.
- Production-like deploy/upgrade/rollback rehearsal.
- Restore rehearsal from production-like backup.
- ASVS/security review evidence.
- WCAG evidence package.
- Data governance and export package evidence.

Exit gate:

- `production_candidate` can be approved only with a complete evidence bundle and named owner acceptance.
- Production-candidate approval does not permit public open-source release if repository hygiene, license, vulnerability, or sensitive-data scans are incomplete.

### Phase 4: Public Open-Source Release

Goal: release source publicly without exposing study data, secrets, identity mappings, private operational records, or unsupported readiness claims.

Required implementation:

- Final public repository scan for secrets, real participant data, identity mappings, consent records, sensitive exports, local paths, and private deployment configuration.
- Public-safe sample data and synthetic fixtures only.
- Public issue templates, security policy, contribution guide, governance guide, license, notice, citation metadata, release notes, and known limitations.
- Dependency license review and third-party notice review.
- Maintainer response process for security reports and governance issues.
- Public docs that clearly separate software capabilities from institutional approval or study authorization.
- Public install matrix showing which targets are supported, experimental, or not shipped.
- Public-safe packaging docs for Windows, macOS, mobile web/PWA, and any native app only after those packages pass their evidence gates.

Required evidence:

- Public-release checklist.
- Secret/data scan results.
- Dependency license and vulnerability scan results.
- Tagged release and checksums.
- Installer/app checksums or store build identifiers for supported packaged clients.
- Public documentation review.
- Maintainer approval record.

Exit gate:

- Public source release is allowed only if no real study data or sensitive operational material is present and the docs do not imply unrestricted human-subjects or production readiness.

## Evidence Requirements By Track

| Evidence category | `mock_trial` | `pilot` | `production_candidate` | `public_open_source` |
| --- | --- | --- | --- | --- |
| Build/test | Local app/server build and tests. | Clean checkout plus deployment-specific smoke tests. | CI, clean checkout, install, build, tests, release artifact checks. | CI, clean checkout, public docs checks. |
| Browser flow | Synthetic full lifecycle. | Human-observed or approved operator dry run plus pilot logs. | Production-like E2E and upgrade/rollback. | Public-safe demo or synthetic walkthrough only. |
| Security | Local negative tests and policy gates. | Deployment checklist, secrets/TLS/session evidence, dependency scan. | ASVS/security review, vulnerability triage, monitoring, incident evidence. | Secret scan, vulnerability scan, SECURITY.md, responsible disclosure. |
| Privacy | Export scan with synthetic data. | Real-data handling plan, retention/deletion evidence, export review. | Data classification, redaction, audit, backup/restore, retention evidence. | Repository must contain no real data or private operational records. |
| Human subjects | Boundary language and synthetic-only decision. | Institutional/IRB/legal/ethics approvals where applicable. | Approved production protocol support and residual-risk acceptance. | Clear no-approval/no-certification disclaimers. |
| AI governance | No External AI mode and local AI-HITL tests. | Study-specific AI disclosure and no external AI unless approved. | AI provenance, audit, minimization, connector controls. | Public docs for AI boundaries and safe configuration. |
| Accessibility | Automated/mobile baseline. | Human assistive-technology evidence for active tasks. | WCAG 2.2 AA evidence package and remediation log. | Public docs disclose status accurately. |
| Operations | Local/dev runbooks and partial rehearsals. | Incident, backup/restore, support, monitoring rehearsal. | Production-like deploy, upgrade, rollback, restore, incident drill. | Public install and maintainer processes. |
| Client packaging | No packaged clients required. | Hosted web client unless a named desktop/mobile pilot package is approved. | Supported Windows, macOS, PWA, iOS, or Android targets each need install, update, security, privacy, and accessibility evidence. | Public release page clearly marks shipped, experimental, and unsupported client targets. |

## Testing Requirements

Minimum release-candidate commands must include:

- frontend install/build/test,
- backend install/build/test,
- security audit or equivalent dependency vulnerability check,
- policy/gate tests for governance, AI-HITL, export privacy, and forbidden language,
- browser E2E for participant and staff flows,
- backup/restore and audit-integrity test,
- accessibility automated checks,
- documentation link and readiness-claim scan,
- installer/package smoke tests for every supported desktop or mobile target,
- `git diff --check`.

Manual testing is required before pilot and production-candidate gates:

- Study Owner workflow.
- Ethics & Methods Steward workflow.
- Security & Privacy Lead or admin workflow.
- Data Custodian export and retention workflow.
- Participant consent, Round 1, later-round response, closeout, support, and withdrawal workflow.
- Keyboard-only workflow.
- Screen reader workflow.
- Mobile viewport and real-device checks.
- Windows install/uninstall and update checks if Windows packaging is in scope.
- macOS install/uninstall, signing/notarization, and update checks if macOS packaging is in scope.
- PWA install/cache/storage checks if mobile web/PWA packaging is in scope.
- iOS/Android app install, permission, secure storage, session revocation, and accessibility checks if native phone applications are in scope.

## Security And Privacy Requirements

Before `pilot`:

- Production authentication/session model documented and tested.
- Role membership is backend-enforced and auditable.
- Secrets are outside repo and outside client bundles.
- TLS/reverse-proxy and secure-cookie configuration are documented.
- CORS, CSRF, rate limits, and security headers are deployment-verified.
- Identity and response data remain separated.
- Invitation tokens are scoped, expiring, revocable, and absent from ordinary logs.
- Export packages have classification, manifest, hashes, review state, and access logging.
- Retention and deletion requests are auditable.

Before `production_candidate`:

- ASVS or equivalent security review is complete.
- Dependency and license scans are clean or risk-accepted.
- Backup/restore is rehearsed from production-like storage.
- Monitoring and incident response are rehearsed.
- Data classification and residual-risk record are approved.

## Human-Subjects Readiness Requirements

The [Human Subjects Readiness Plan](../../../documents/compliance/human-subjects-readiness/HUMAN_SUBJECTS_READINESS.md) remains the detailed control baseline.

Before any real participant use:

- Applicable institutional, IRB, ethics, legal, or sponsor approvals are documented.
- Participant information, consent, withdrawal, confidentiality, retention, and support language are reviewed.
- The system truthfully states confidentiality and linkage limits; it does not promise complete anonymity where round linkage exists.
- Participants can decline, withdraw, and seek support without penalty.
- Study configuration, consensus rule, feedback format, and governance signoffs are locked before launch.
- Reports preserve consensus, near-consensus, non-consensus, attrition, limitations, and the required consensus-not-correctness statement.

## AI Governance Readiness Requirements

Before `pilot`:

- AI is disabled by default or operating only in approved No External AI mode.
- AI suggestions are labeled "AI Suggestion (Not Final)".
- Participant-facing AI-influenced content requires human Accept/Edit/Reject and configured signoff.
- AI cannot modify consensus thresholds, decide item inclusion, drop dissent, publish content, personalize pressure, or claim correctness.
- AI operations are audited with model/template/version/output hash and human action.

Before any external AI connector:

- External AI is explicitly enabled by an administrator.
- Study-level disclosure and participant-facing consent language are reviewed.
- Data minimization rules exclude direct identifiers and identity-response mappings.
- Connector logs and outputs are auditable.
- The Ethics & Methods Steward and Security & Privacy Lead approve the connector for the named study or deployment.

## Accessibility Requirements

Before `pilot`:

- Participant consent and round tasks pass keyboard-only review.
- Participant consent and round tasks pass screen reader review with NVDA and/or VoiceOver.
- Mobile participant flows pass at common widths and at least one real-device review.
- Error messages are associated with inputs.
- Focus order, labels, contrast, time limits, and copy clarity are reviewed.

Before `production_candidate`:

- WCAG 2.2 AA evidence package exists for participant and staff workflows.
- P0/P1 accessibility defects are resolved or have approved mitigations.
- Accessibility status is documented without overclaiming certification.

## Deployment And Install Packaging Requirements

Before `pilot`:

- Environment variables are documented with safe defaults.
- Production-like install path is documented.
- Supported client targets are explicitly named; unsupported targets are marked not shipped.
- Database initialization, migration, backup, restore, and rollback are rehearsed.
- Operator can start, stop, monitor, and recover services from docs.
- Secrets and runtime data directories are outside version control.
- Hosted web deployment has the first complete support path unless a desktop or mobile client has its own pilot evidence.
- Any Windows/macOS installer or phone app used in pilot has a documented installation, update, uninstall, and data-removal path.

Before `production_candidate`:

- Release artifacts are versioned, checksummed, and reproducible.
- Supported deployment targets are named.
- Windows installers, macOS packages, PWA manifests/service workers, and native mobile app builds are each versioned, checksummed or store-identified, and tied to the release commit if shipped.
- Upgrade and rollback from the prior release are tested.
- SBOM and dependency license review exist.
- Operational runbooks are linked from release notes.
- Code signing, notarization, app-store review status, privacy labels, permission inventories, and third-party SDK inventories are documented for packaged clients where applicable.

Client packaging-specific gates:

- Windows: installer format selected, package signed for production candidates or explicitly marked unsigned development build, install/uninstall tested on supported Windows versions, update strategy documented, local data and log directories documented, no secrets stored in application files.
- macOS: package format selected, release-candidate package signed and notarized, Intel/Apple Silicon support documented, install/uninstall tested, update strategy documented, local data and log directories documented, no secrets stored in application bundle.
- Mobile web/PWA: manifest and service worker reviewed, cache does not retain sensitive study data beyond approved policy, iOS Safari and Android Chrome tested, home-screen install behavior documented, mobile accessibility evidence recorded.
- Native iOS/Android: app permissions minimized, secure storage used for tokens, logout and remote revocation tested, crash/analytics SDKs reviewed or disabled, push notifications do not reveal study participation or sensitive content, store privacy disclosures prepared.

## Documentation Requirements

Each release track must include:

- release scope and non-scope,
- allowed data class,
- readiness claim and explicit non-claims,
- installation and deployment instructions,
- test commands and evidence links,
- security/privacy notes,
- AI mode and connector status,
- accessibility status,
- known limitations,
- incident/contact/support path,
- release decision and approver roles.

## Release Gates

| Gate | Applies to | Required approvers |
| --- | --- | --- |
| Mock-trial GO / GO WITH CONDITIONS | `mock_trial` | Maintainer or Study Owner. |
| Pilot authorization | `pilot` | Study Owner, Ethics & Methods Steward, Security & Privacy Lead, Data Custodian. |
| Production-candidate approval | `production_candidate` | Study Owner, Ethics & Methods Steward, Security & Privacy Lead, Data Custodian, Open Source Maintainer. |
| Public open-source release approval | `public_open_source` | Open Source Maintainers, Security & Privacy Lead, Data Custodian, Ethics & Methods Steward. |

Release gates fail automatically if:

- any P0 blocker remains open for the target track,
- evidence is missing, stale, or not tied to a commit,
- the release includes real data, secrets, identity mappings, or sensitive exports outside approved storage,
- AI governance boundaries are weakened,
- consensus is framed as truth or correctness,
- participant rights, confidentiality, withdrawal, or retention controls are bypassed,
- accessibility or security status is overstated.

## Explicit Blockers Before Unrestricted Real-World Use

Unrestricted real-world use is blocked until all of the following are true:

- No P0 human-subjects, security, privacy, accessibility, operational, or AI-governance blockers remain.
- Independent or appropriately scoped security review is complete.
- WCAG evidence is complete for participant and staff workflows.
- Production deployment, monitoring, backup, restore, migration, rollback, and incident drills are complete.
- Real-data retention, deletion, export, and access-review workflows are tested.
- External approvals required by the deployment context are complete.
- Public docs accurately state limits and do not imply universal suitability, certification, or approval.

## Codex-Ready Work Packets

### Phase 0 Work Packets

| Packet | Objective | Inputs | Done evidence |
| --- | --- | --- | --- |
| P0-WP1 | Add release-track labels and claim vocabulary to docs. | This document, existing QC docs. | Docs scan shows consistent `mock_trial`, `pilot`, `production_candidate`, `public_open_source` wording. |
| P0-WP2 | Create a repeatable mock-trial evidence index. | Latest full mock-trial artifacts and screenshots. | Index links commit, commands, artifacts, results, limits. |
| P0-WP3 | Add readiness-claim lint checks. | Existing policy gate tests. | Test fails on production/IRB/security/accessibility overclaims in docs. |

### Phase 1 Work Packets

| Packet | Objective | Inputs | Done evidence |
| --- | --- | --- | --- |
| P1-WP1 | Implement production membership and role review workflow. | Human-subjects controls, current role gates. | Backend tests prove assignment, removal, downgrade, and audit behavior. |
| P1-WP2 | Convert remaining ordinary operations from local API/script assumptions into staff UI or operator commands. | Full mock-trial runner, staff workflows. | Human-observed dry run uses approved UI/operator paths. |
| P1-WP3 | Implement incident workflow. | Phase 10 incident runbook. | Pause-study state, incident record, severity, notification template, recovery, and drill artifact. |
| P1-WP4 | Implement retention/deletion execution evidence. | Human-subjects readiness plan. | Data Custodian review, deletion/restriction rules, audit events, export evidence. |
| P1-WP5 | Run pilot accessibility closeout. | Accessibility docs and mobile evidence. | NVDA/VoiceOver notes, keyboard transcript, mobile screenshots, defect log. |
| P1-WP6 | Produce deployment-specific security checklist and smoke test. | Environment guide, security tests. | TLS/secrets/session/CORS/CSRF/rate-limit/security-header evidence tied to commit. |

### Phase 2 Work Packets

| Packet | Objective | Inputs | Done evidence |
| --- | --- | --- | --- |
| P2-WP1 | Build pilot run log template and operator checklist. | Full mock-trial and Phase 10 runbooks. | Pilot log captures operators, dates, round states, support, withdrawals, incidents, exports. |
| P2-WP2 | Add export review closeout for real-study packages. | Export package code and privacy scan. | Data Custodian approval/rejection path, package manifest, redaction evidence. |
| P2-WP3 | Add monitoring and alert review for pilot deployment. | Deployment docs. | Health checks, alert paths, operational event review. |
| P2-WP4 | Update blockers after pilot. | Release blockers and pilot log. | Blocker file records closed, new, downgraded, or accepted risks with approvers. |

### Phase 3 Work Packets

| Packet | Objective | Inputs | Done evidence |
| --- | --- | --- | --- |
| P3-WP1 | Create release-candidate CI workflow. | App/server test commands, policy gates. | CI runs build, tests, security audit, accessibility checks, docs checks, artifact checks. |
| P3-WP2 | Add migration upgrade/rollback rehearsal. | Database migration procedure. | Empty-db, prior-release upgrade, rollback, restore, and audit-integrity evidence. |
| P3-WP3 | Produce SBOM and dependency/license review. | Package manifests. | SBOM, license table, unresolved risk log. |
| P3-WP4 | Assemble production-candidate evidence bundle. | Pilot and CI evidence. | Immutable evidence folder linked from release notes. |
| P3-WP5 | Define desktop installer packaging plan. | Deployment docs, supported platform decision. | Windows and macOS package format, signing/notarization, update, uninstall, data-directory, and evidence requirements documented. |
| P3-WP6 | Define mobile distribution plan. | Mobile/PWA requirements, privacy requirements. | PWA vs native app decision, iOS/Android support matrix, privacy labels, permission inventory, secure storage, app-store/testing path documented. |

### Phase 4 Work Packets

| Packet | Objective | Inputs | Done evidence |
| --- | --- | --- | --- |
| P4-WP1 | Run public repository hygiene scan. | Release checklist. | No secrets, real data, identity mappings, consent records, sensitive exports, or private paths. |
| P4-WP2 | Finalize public docs and release notes. | Docs index, README, known limitations. | Public docs state scope, setup, governance, AI limits, data boundaries, accessibility status, support path. |
| P4-WP3 | Finalize public release metadata. | LICENSE, NOTICE, CITATION.cff, SECURITY.md. | Tagged release, checksums, citation URL, maintainer approval. |
| P4-WP4 | Create post-release maintenance workflow. | Governance and contribution docs. | Issue labels, security triage, release cadence, vulnerability response process. |
| P4-WP5 | Publish supported client install matrix. | Packaging evidence. | Public release page identifies Windows, macOS, PWA, iOS, and Android status as supported, experimental, or not shipped. |

## Maintenance Rules

- Update this document when release gates change.
- Update blocker and control-matrix documents when work packets close.
- Link every readiness claim to commit-specific evidence.
- Prefer downgrading claims over accepting ambiguous evidence.
- Keep public docs stricter than marketing language.
