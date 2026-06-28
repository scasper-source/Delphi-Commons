# Product Readiness Plan for eDelphi: Downloadable Laptop and Phone Human Testing Candidate

Status: planning document. This is not a production-readiness claim.

Date basis: 2026-06-28.

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
| Laptop installer candidates | Windows installer adapter and macOS installer adapter are merged. GitHub release assets exist for the June 28 Windows installer ZIP/EXE and macOS Apple Silicon single installer ZIP bundle. The current download tags are `internal-windows-installer-candidate-2026-06-28-r2` and `internal-macos-package-candidate-2026-06-28-r2`, both pointing at commit `18faba2`. | Installer packaging is downloadable from GitHub for internal use, but installed lifecycle, signing, reputation/Gatekeeper, clean-profile evidence, and clean Windows/macOS `r2` retest evidence remain open. |
| Phase 3 SMS candidate controls | Local mock STOP/HELP simulation, opt-in gates, resend limits, staff permission tests, gated Twilio provider plumbing, setup-status reporting, delivery callback handling, inbound STOP/HELP handling, and an operator setup prompt are merged. | Engineering-only local/provider-path evidence; still not telecom approval, pilot, production, real participant texting, or human-testing readiness. |
| GitHub repository hygiene | Private clean-history repository exists. As of 2026-06-28, default branch is `main`; `master` is archived as `archive/master-pre-main-migration`; stale remote `codex/*` and decomposition branches are removed; open PR queue is empty; latest repository cleanup commit is `dcd54e2`; latest app/server behavior commit is `2fa50fe`. | Repository collaboration surface is clean, but this does not close product, security, accessibility, or human-testing gates. |
| Current repo-verifiable checks | Latest recorded GitHub Actions CI run for the June 28 release-package commit is `28340083441`: server build/test passed and server audit reported 0 vulnerabilities; app lint/build/test passed and app tests reported 31/31; app audit still reported 5 vulnerabilities, including 1 high Vite advisory, because the workflow currently records audit output without failing the job. | Useful current-main health signal only. App dependency findings require security/dependency triage and this is not a substitute for human-required evidence. |
| Readiness claim controls | Packaging overclaim scanner now covers production/pilot/human-testing, IRB/ethics/legal/security/accessibility approval, real-SMS/PWA/native/public-release, installer/updater/signing/notarization, and Windows/macOS support-readiness language. | Guardrail only; it prevents overclaims in package evidence surfaces but does not replace human review. |

## June 2026 Repository And Code Health Update

The repository cleanup and June code-health work improve maintainability and collaboration hygiene, but they do not change the human-testing boundary.

- GitHub default branch is `main`; the old `master` line is archived as tag `archive/master-pre-main-migration`.
- Remote branch inventory is clean: no stale `codex/*`, decomposition, or `master` branches remain after pruning.
- Latest repository cleanup commit is `dcd54e2`, which updated status documentation, normalized `.gitignore`, and preserved failed May 2026 manual-browser QC artifacts.
- Latest app/server behavior commit is `2fa50fe`, the merge of PR #136.
- Current downloadable package commit is `18faba2`, which keeps release publishing available after GitHub Actions artifact quota failures and backs the June 28 Windows/macOS internal download tags.
- PRs #135 and #136 added the CI pipeline, extracted shared app types/utilities/context, moved major screens onto `AppContext`, consolidated CSS design tokens, centralized toast notifications, and added first-run operator bootstrap.
- Latest confirmed CI evidence for the release-package commit is GitHub Actions run `28340083441`: server build/test passed, server audit reported 0 vulnerabilities, app lint/build/test passed, app tests reported 31/31, and app audit reported 5 vulnerabilities including 1 high Vite advisory.
- These changes support engineering readiness and future reviewability only; `human_testing_candidate` remains **NOT READY** until the human-required evidence rows and P0 blockers are closed or explicitly accepted by authorized roles.

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
| SMS magic-link entry | In scope now. | Primary invitation/reminder entry path for phone testing. | Neutral SMS copy, opt-in/verification rules, opaque expiring links, rate limits, audit events, no sensitive content in SMS, STOP/HELP or documented simulated equivalent. If a real provider is used, provider setup, sender approval/sandbox status, callback behavior, and reviewer approval must be evidenced separately. |
| PWA install-to-home-screen | Deferred for Phase 3 by charter-based scope decision. | Later convenience path only if mobile web is insufficient and a separate ADR approves cache/storage/session policy. | Not required for Phase 3. Future PWA scope requires manifest/service-worker review, cache/storage privacy proof, logout/session revocation, and iOS/Android behavior notes. |
| Native iOS app | Deferred unless explicitly approved. | Later distribution path only if mobile web is insufficient. | TestFlight/App Store plan, permissions, secure storage, privacy labels, SDK review, push notification governance. |
| Native Android app | Deferred unless explicitly approved. | Later distribution path only if mobile web is insufficient. | Internal testing/Play plan, permissions, secure storage, Data Safety inputs, SDK review, push notification governance. |

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

Status: **COMPLETE AS SCOPE LOCK ONLY (2026-05-14).** This means the candidate surfaces are locked; it does **not** mean Phase 2 laptop evidence, Phase 3 phone/SMS evidence, Phase 4 binder evidence, or human testing is complete.

Reference closeout note: [PHASE1_PRODUCT_SURFACE_LOCK_CLOSEOUT.md](./PHASE1_PRODUCT_SURFACE_LOCK_CLOSEOUT.md).
Architecture ADR recorded: [BACKEND_PACKAGING_PROCESS_SUPERVISION_ADR.md](./BACKEND_PACKAGING_PROCESS_SUPERVISION_ADR.md).
Stage 1 Windows prototype implementation note: [WINDOWS_OPERATOR_CANDIDATE_PROTOTYPE.md](./WINDOWS_OPERATOR_CANDIDATE_PROTOTYPE.md).
Stage 1 Windows portable package prototype note: [WINDOWS_OPERATOR_PORTABLE_PACKAGE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE.md).
Local Windows portable package evidence note: [WINDOWS_OPERATOR_PORTABLE_PACKAGE_LOCAL_EVIDENCE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE_LOCAL_EVIDENCE.md).
Extracted zip evidence note: [WINDOWS_OPERATOR_PORTABLE_PACKAGE_EXTRACTED_ZIP_EVIDENCE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE_EXTRACTED_ZIP_EVIDENCE.md).
Windows bundled-runtime release asset smoke evidence note: [WINDOWS_PORTABLE_BUNDLED_RUNTIME_RELEASE_ASSET_EVIDENCE_2026-05-14.md](./WINDOWS_PORTABLE_BUNDLED_RUNTIME_RELEASE_ASSET_EVIDENCE_2026-05-14.md).
Simple package download/install guide: [PACKAGE_DOWNLOAD_INSTALL_GUIDE.md](./PACKAGE_DOWNLOAD_INSTALL_GUIDE.md).
Windows Phase 2 sanity pass report: [PHASE2_WINDOWS_SANITY_PASS_REPORT.md](./PHASE2_WINDOWS_SANITY_PASS_REPORT.md).
Windows signing/distribution limitations note: [WINDOWS_SIGNING_DISTRIBUTION_LIMITATIONS.md](./WINDOWS_SIGNING_DISTRIBUTION_LIMITATIONS.md).
Windows installer candidate ADR: [WINDOWS_INSTALLER_CANDIDATE_ADR.md](./WINDOWS_INSTALLER_CANDIDATE_ADR.md).
Windows installer candidate runbook: [WINDOWS_INSTALLER_CANDIDATE_RUNBOOK.md](./WINDOWS_INSTALLER_CANDIDATE_RUNBOOK.md).
Windows installer candidate evidence: [WINDOWS_INSTALLER_CANDIDATE_EVIDENCE_2026-05-17.md](./WINDOWS_INSTALLER_CANDIDATE_EVIDENCE_2026-05-17.md).
Windows installer candidate hardening note: [WINDOWS_INSTALLER_CANDIDATE_HARDENING_2026-05-17.md](./WINDOWS_INSTALLER_CANDIDATE_HARDENING_2026-05-17.md).
Windows GitHub installer release workflow: [WINDOWS_GITHUB_INSTALLER_RELEASE_WORKFLOW.md](./WINDOWS_GITHUB_INSTALLER_RELEASE_WORKFLOW.md).
Windows GitHub installer release asset evidence: [WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-18.md](./WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-18.md).
macOS operator portable/internal package planning ADR: [MACOS_OPERATOR_PORTABLE_PACKAGE_ADR.md](./MACOS_OPERATOR_PORTABLE_PACKAGE_ADR.md).
macOS operator portable package prototype note: [MACOS_OPERATOR_PORTABLE_PACKAGE.md](./MACOS_OPERATOR_PORTABLE_PACKAGE.md).
macOS operator portable package static review evidence: [MACOS_OPERATOR_PORTABLE_PACKAGE_STATIC_REVIEW.md](./MACOS_OPERATOR_PORTABLE_PACKAGE_STATIC_REVIEW.md).
macOS operator portable runbook: [MACOS_OPERATOR_PORTABLE_RUNBOOK.md](./MACOS_OPERATOR_PORTABLE_RUNBOOK.md).
macOS signing/distribution limitations note: [MACOS_SIGNING_DISTRIBUTION_LIMITATIONS.md](./MACOS_SIGNING_DISTRIBUTION_LIMITATIONS.md).
macOS Apple Silicon defect-fix evidence note: [MACOS_OPERATOR_PORTABLE_APPLE_SILICON_DEFECT_FIX_EVIDENCE.md](./MACOS_OPERATOR_PORTABLE_APPLE_SILICON_DEFECT_FIX_EVIDENCE.md).
macOS Apple Silicon post-fix lifecycle evidence: [MACOS_OPERATOR_PORTABLE_POST_FIX_LIFECYCLE_EVIDENCE_2026-05-14.md](./MACOS_OPERATOR_PORTABLE_POST_FIX_LIFECYCLE_EVIDENCE_2026-05-14.md).
Stage 1 Windows evidence closeout note: [WINDOWS_OPERATOR_CANDIDATE_EVIDENCE_CLOSEOUT.md](./WINDOWS_OPERATOR_CANDIDATE_EVIDENCE_CLOSEOUT.md).
Local Windows supervisor evidence note: [WINDOWS_OPERATOR_CANDIDATE_LOCAL_SUPERVISOR_EVIDENCE.md](./WINDOWS_OPERATOR_CANDIDATE_LOCAL_SUPERVISOR_EVIDENCE.md).

Locked decisions:

- Windows laptop operator path: **included** as the primary laptop operator path. The portable bundled-runtime path has local/release-asset smoke evidence; the Inno Setup installer-candidate path is implemented but still lacks final `.exe` and installed lifecycle evidence.
- macOS laptop operator path: **included, evidence-dependent**; one 2026-05-14 Apple Silicon post-fix lifecycle rerun is recorded, but broad macOS support/readiness is not claimed.
- Phone participant path: **mobile web required**.
- SMS path: **mock/simulated/sandbox by default** for the current candidate; PR #85 adds a gated Twilio real-SMS setup track, but real provider credentials and delivery operations remain deferred until Twilio sender approval/sandbox evidence, privacy/security review, Data Custodian review, SMS copy review, device evidence, and human-use approval are recorded.
- PWA path: **deferred / disabled by default** for Phase 3; future PWA work requires a separate privacy ADR.
- Native iOS/Android: **excluded/deferred unless separately approved**.
- External AI mode: **No External AI unless a named connector is separately approved**.

Recorded Phase 1 evidence:

- Product surface matrix with included/deferred/not-shipped status is recorded in [PHASE1_PRODUCT_SURFACE_LOCK.md](./PHASE1_PRODUCT_SURFACE_LOCK.md).
- Runtime architecture diagram for laptop operator package and phone/SMS participant entry is recorded in [PHASE1_PRODUCT_SURFACE_LOCK.md](./PHASE1_PRODUCT_SURFACE_LOCK.md).
- Data storage and secret handling statement for laptop and phone paths is recorded in [PHASE1_PRODUCT_SURFACE_LOCK.md](./PHASE1_PRODUCT_SURFACE_LOCK.md).
- Explicit unsupported-target statements are recorded in [PHASE1_PRODUCT_SURFACE_LOCK.md](./PHASE1_PRODUCT_SURFACE_LOCK.md).

Exit gate result:

- **SATISFIED FOR SCOPE LOCK ONLY.**
- Human testing scope is locked for the candidate.
- No surface is implied supported unless it has an evidence plan.
- Remaining implementation, device evidence, package evidence, reviewer signoff, and human-observed testing are tracked in later phases and do not reopen Phase 1 unless the owner changes the product surface.

### Phase 2: Downloadable Laptop Operator Candidate

Goal: make the app runnable by a human operator on a laptop without source-code editing.

Status: **IN PROGRESS / INTERNAL PACKAGE EVIDENCE RECORDED / NOT READY FOR HUMAN TESTING**.

Current progress:

- **DONE:** Stage 1 Windows operator supervisor local evidence recorded.
- **DONE:** Stage 1 Windows portable/internal package local evidence recorded.
- **DONE:** Stage 1 Windows portable/internal package extracted-zip local evidence recorded.
- **DONE:** Windows signing/distribution limitations recorded.
- **DONE:** Runtime posture reconciled for the current Phase 2 candidate: local Node.js/npm remain build-time prerequisites; Windows bundled-runtime hardening now stages packaged Node and production dependencies for runtime lifecycle commands. Tauri, signing, and updater tracks remain deferred; the Windows installer-candidate track now has GitHub release assets but still lacks clean-profile installed lifecycle evidence.
- **DONE:** macOS operator portable planning, prototype, static review, runbook, and signing/distribution limitation notes recorded.
- **RECORDED (2026-05-13):** One Apple Silicon macOS internal engineering runtime run produced partial package/build/start evidence but exposed lifecycle supervision defects; this does **not** establish macOS support readiness or human-testing readiness.
- **DONE:** macOS Apple Silicon package defects fixed and internal engineering verification recorded.
- **RECORDED (2026-05-14):** Post-fix real Apple Silicon macOS lifecycle rerun passed for build, extraction, status, start, health, UI HEAD, smoke, restart, stop, reset-after-stopped, start/smoke/stop after reset, idempotent stopped-state behavior, clean-worktree build after dependencies, and server audit. This remains internal engineering evidence only and does **not** establish macOS support readiness or human-testing readiness.
- **IN PROGRESS:** Phase 2 downloadable laptop operator candidate. The current Windows portable/installer and macOS package evidence remains internal engineering evidence only and remains **NOT READY FOR HUMAN TESTING**.
- **RECORDED (2026-05-14):** Windows bundled-runtime package build, package verification, focused packaging tests, and staged lifecycle commands passed locally with packaged Node 24.15.0. This is not second-machine, clean-profile, signing, SmartScreen, Defender, or platform-support evidence.
- **RECORDED (2026-05-14):** Prompt 7 documentation/claim-scan cleanup was merged and then locally validated on main at `121a526`: app build passed, app tests passed 28/28, server tests passed, packaging/claim-scan tests passed 18/18, bundled-runtime package verification passed, app/server high-severity npm audits reported 0 vulnerabilities, and `git diff --check` passed. App lint had two existing React Hook dependency warnings and no errors.
- **RECORDED (2026-05-14):** Windows `r2` GitHub release asset smoke passed from a downloaded zip extracted under a path with spaces. Start, browser UI reachability at `http://127.0.0.1:4173`, status, smoke, and stop passed. Evidence: [WINDOWS_PORTABLE_BUNDLED_RUNTIME_RELEASE_ASSET_EVIDENCE_2026-05-14.md](./WINDOWS_PORTABLE_BUNDLED_RUNTIME_RELEASE_ASSET_EVIDENCE_2026-05-14.md). This remains one-machine/local-user evidence only and does not establish clean-profile, second-machine, signing, SmartScreen, Defender, installer, or platform-support readiness.
- **RECORDED (2026-05-15; OS corrected 2026-05-18):** Windows 10 development/setup/startup sanity pass recorded in [PHASE2_WINDOWS_SANITY_PASS_REPORT.md](./PHASE2_WINDOWS_SANITY_PASS_REPORT.md). The original PDF label said Windows 11, but the operator clarified that the run was performed on Windows 10. This pass confirmed clone/pull, Node.js/npm installation and PATH setup, frontend Vite startup at `http://localhost:5173`, backend startup at `127.0.0.1:3001`, and resolution of initial browser API connection errors after backend startup. It also observed that the backend required build/install before `npm start` because `server/dist/index.js` was initially missing. This is useful Windows setup evidence, but it is **not** a substitute for packaged Windows operator/release-asset verification on a second machine or clean Windows profile.
- **RECORDED (2026-05-17):** Windows installer-candidate adapter and hardening are merged on main. Evidence is recorded in [WINDOWS_INSTALLER_CANDIDATE_EVIDENCE_2026-05-17.md](./WINDOWS_INSTALLER_CANDIDATE_EVIDENCE_2026-05-17.md) and [WINDOWS_INSTALLER_CANDIDATE_HARDENING_2026-05-17.md](./WINDOWS_INSTALLER_CANDIDATE_HARDENING_2026-05-17.md). The adapter reuses the Windows bundled-runtime payload, fixes launcher package-root/runtime routing, selectively stages `node.exe`/`LICENSE` from the pinned Windows Node ZIP, passes package verification, and reaches the expected `ISCC.exe` unavailable gate on this Windows host. It does **not** yet produce a final `.exe`, code-signed installer, SmartScreen/Defender evidence, or real install/start/stop/uninstall evidence.
- **RECORDED (2026-05-16):** Real Apple Silicon macOS installer build evidence is recorded in [MACOS_INSTALLER_REAL_MAC_BUILD_EVIDENCE_2026-05-16.md](./MACOS_INSTALLER_REAL_MAC_BUILD_EVIDENCE_2026-05-16.md). The run produced `build/macos-installer/delphi-commons-macos-installer-internal.pkg` with checksum `4fade93b8d7b2e48fd58df22da8f279b37e9bbb2e0398757c1cb2e3c77388b13`, package verification passed, and the expanded payload used packaged Node `v24.15.0` with runtime data configured for `~/Library/Application Support/DelphiCommons/macos-installer-candidate`. Local install/lifecycle evidence remains **BLOCKED / NOT RUN** because `sudo -n installer` required a password in the Codex session; signing, notarization, and Gatekeeper remain **NOT RUN**.
- **RECORDED (2026-05-18):** GitHub Actions macOS release workflow originally created split Apple Silicon internal package assets: a portable bundled-runtime ZIP and unsigned internal installer `.pkg`. That split release surface is superseded for macOS installer/operator testing.
- **RECORDED (2026-05-18 / 2026-05-19 UTC):** Corrected macOS release `internal-macos-package-candidate-2026-05-18-r4` succeeded and published one Apple Silicon installer ZIP bundle containing the PKG, verification metadata, checksums, and instructions. Downloaded-asset inspection confirmed the bundle README, installed `.app` launcher, installed package README, and checksum status. Evidence: [MACOS_GITHUB_RELEASE_ASSET_EVIDENCE_2026-05-18.md](./MACOS_GITHUB_RELEASE_ASSET_EVIDENCE_2026-05-18.md). Installed-path human lifecycle, signing, notarization, Gatekeeper, Intel Mac/x64, and operator walkthrough evidence remain open.
- **RECORDED (2026-05-18 through 2026-05-31):** GitHub Actions Windows installer release workflow succeeded and created prerelease Windows x64 internal installer assets. The first successful May installer asset `r2` was superseded and deleted after a user-reported Windows code 193 post-install launch failure; `r3` was superseded and deleted after a user-reported browser-reopen/desktop-shortcut launch issue; `r4` was superseded and deleted after the installed package still exposed user-facing Stop/Status shortcuts and a background-runtime mental model; `r5` was superseded and deleted after stale Stop wording remained in the generated ZIP README; `r6` was superseded after review found browser-fallback order and attached-browser-unavailable cleanup issues. `r7` opened Delphi Commons through one user-facing Desktop/Start Menu launcher, used an attached Edge or Chrome app window, and stopped the local runtime when that Delphi Commons browser app window closed, but exposed the package-mode auth/session blocker. Superseding `r8` release asset evidence and the clean-Windows retest record are in [WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-21.md](./WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-21.md); the `r8` tag/release points at corrected commit `85fea05`, and package verification is `ok: true`. A 2026-05-29 clean Windows `r8` operator report shows install, launch, close-window stop, relaunch, and uninstall mostly passing, but saved-study reopen/new-study continuity failed or was unclear and Study Owner/Ethics & Methods signoff controls appeared broken or unreachable. Superseding `r10` release asset evidence is in [WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-31.md](./WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-31.md); the `r10` tag/release points at merged commit `2a831ee`, includes the Study Workspace Launcher, multi-study persistence, Study PI/Ethics PI signoff follow-up, and Main Menu first-screen / fresh New Study reset fix, and package verification is `ok: true`. Human-testing readiness remains blocked until clean Windows retest evidence is attached against the current June 28 `r2` package.
- **RECORDED (2026-06-28):** June 28 release tags `internal-windows-installer-candidate-2026-06-28-r2` and `internal-macos-package-candidate-2026-06-28-r2` succeeded and published GitHub prerelease assets from commit `18faba2`. Evidence is recorded in [WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-06-28.md](./WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-06-28.md) and [MACOS_GITHUB_RELEASE_ASSET_EVIDENCE_2026-06-28.md](./MACOS_GITHUB_RELEASE_ASSET_EVIDENCE_2026-06-28.md). The prior Windows `r10` and macOS `r4` releases are archived/superseded in GitHub. Human-testing readiness remains blocked until clean Windows/macOS package run evidence is attached.
- **RECORDED:** Repeatable synthetic study setup baseline exists in [SYNTHETIC_STUDY_SETUP.md](../../qc/full-mock-trial/SYNTHETIC_STUDY_SETUP.md), but package-specific operator walkthrough evidence remains a downstream Phase 2/4 task.

Remaining Phase 2 blockers before the downloadable laptop operator candidate gate can close:

- Verify the Windows package on a second Windows machine or clean Windows user profile. The 2026-05-15 Windows sanity pass is supporting setup/startup evidence, but because it followed a development-style Node/npm path rather than the packaged operator/release-asset path, it does not close this blocker by itself.
- Runtime posture reconciled for current Phase 2 work: local Node/npm remain required at build time; the Windows bundled-runtime package and installer-candidate payload now stage packaged Node and production dependencies for runtime lifecycle commands. Downloaded release-asset smoke evidence is recorded for one local Windows profile; clean-profile or second-machine confirmation remains required before the Phase 2 gate closes.
- **UPDATED (2026-05-14):** Portable bundled-runtime foundation ADR accepted for internal package hardening; shared packaging core exists and Windows runtime wiring has local branch evidence.
- Attach screenshot/log artifacts from the 2026-05-29 clean Windows `r8` retest, then rerun the Main Menu, Study Workspace Launcher, saved-study reopen/new-study continuity, and governance signoff paths against the June 28 `r2` package as recorded in [WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-06-28.md](./WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-06-28.md).
- Capture or explicitly accept unsigned-package behavior for the intended Windows and macOS distribution channel. Limitation notes are recorded; Windows installer packaging now has internal release assets but no code-signing, SmartScreen, Defender, or clean-profile/second-machine installer lifecycle evidence. The 2026-05-14 Apple Silicon rerun recorded no Gatekeeper/quarantine observations.
- Decide whether one Apple Silicon Mac is enough for the current internal candidate, or whether Intel Mac / additional macOS version coverage is required before closing Phase 2.
- Complete a package-specific Study Owner/operator walkthrough from docs, including synthetic study setup, roles, consent/invitations, rounds, curation, closeout, export, deletion/retention review, incident path, backup/restore, and support path.
- Complete the macOS installed-path lifecycle pass after an operator-authorized local install: start, browser/UI reachability, status, smoke, restart, backup, restore, reset, stop, port-clear checks, and uninstall or uninstall dry run.
- Preserve deferred status for Tauri, updater behavior, signing/notarization, Windows support claims, macOS support claims, and final installer readiness until separate evidence exists.

Recorded Phase 2 implementation:

- Windows install/start/stop/reset/backup/smoke paths are documented in [WINDOWS_OPERATOR_PORTABLE_PACKAGE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE.md) and related evidence notes.
- Windows installer-candidate build/install target behavior is documented in [WINDOWS_INSTALLER_CANDIDATE_RUNBOOK.md](./WINDOWS_INSTALLER_CANDIDATE_RUNBOOK.md); the candidate adapter builds/verifies payloads locally and the GitHub release workflow now publishes the Windows installer ZIP bundle and raw EXE from a Windows runner with Inno Setup available.
- Windows development/setup/startup sanity evidence is documented in [PHASE2_WINDOWS_SANITY_PASS_REPORT.md](./PHASE2_WINDOWS_SANITY_PASS_REPORT.md), including the observed need to run backend build/install before `npm start` when `server/dist/index.js` is missing.
- macOS install/start/stop/reset/backup/smoke paths are documented in [MACOS_OPERATOR_PORTABLE_PACKAGE.md](./MACOS_OPERATOR_PORTABLE_PACKAGE.md) and [MACOS_OPERATOR_PORTABLE_RUNBOOK.md](./MACOS_OPERATOR_PORTABLE_RUNBOOK.md).
- Local runtime directory policy for database, audit logs, exports, backups, evidence artifacts, logs, and state is documented for Windows and macOS package paths.
- Safe repository/package posture is documented: generated package evidence checks for no committed `.env`, secrets, runtime database, logs, backups, evidence artifacts, or package-root `node_modules`.
- Smoke commands are documented and have internal engineering pass evidence for Windows and the 2026-05-14 Apple Silicon macOS rerun.
- Packaging decision is recorded: current candidate uses script-based local packages plus internal installer-candidate tracks. Windows bundled-runtime hardening removes local Node/npm as a runtime prerequisite after package build; local Node/npm still remain build-time prerequisites. Final installer artifacts and installed lifecycle evidence remain open.
- Repeatable synthetic study setup exists as a baseline; package-specific operator walkthrough evidence is still required before closing Phase 2.

Recorded Phase 2 evidence:

- Windows extracted-zip package run result is recorded in [WINDOWS_OPERATOR_PORTABLE_PACKAGE_EXTRACTED_ZIP_EVIDENCE.md](./WINDOWS_OPERATOR_PORTABLE_PACKAGE_EXTRACTED_ZIP_EVIDENCE.md), with commit hash, package identifier, smoke output, runtime path evidence, known limitations, and package-root sensitive-material checks.
- Windows bundled-runtime `r2` GitHub release asset smoke result is recorded in [WINDOWS_PORTABLE_BUNDLED_RUNTIME_RELEASE_ASSET_EVIDENCE_2026-05-14.md](./WINDOWS_PORTABLE_BUNDLED_RUNTIME_RELEASE_ASSET_EVIDENCE_2026-05-14.md), with release tag, asset URL, checksum, commit hash, path-with-spaces extraction, start/status/browser/smoke/stop output, and remaining limitations.
- Windows 10 development/setup/startup sanity pass result is recorded in [PHASE2_WINDOWS_SANITY_PASS_REPORT.md](./PHASE2_WINDOWS_SANITY_PASS_REPORT.md), with Node.js/npm setup, frontend/backend startup, browser-console observation, backend build/install quirk, and screenshot summary. This evidence strengthens the Windows setup record but does not establish packaged operator second-machine or clean-profile readiness.
- Windows installer-candidate adapter and hardening evidence is recorded in [WINDOWS_INSTALLER_CANDIDATE_EVIDENCE_2026-05-17.md](./WINDOWS_INSTALLER_CANDIDATE_EVIDENCE_2026-05-17.md) and [WINDOWS_INSTALLER_CANDIDATE_HARDENING_2026-05-17.md](./WINDOWS_INSTALLER_CANDIDATE_HARDENING_2026-05-17.md), with app/server build, production dependency staging, selective pinned-runtime staging, package verification, launcher/runtime-root hardening, and missing-`ISCC.exe` boundary.
- Windows installer GitHub release asset evidence is recorded in [WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-18.md](./WINDOWS_GITHUB_INSTALLER_RELEASE_ASSET_EVIDENCE_2026-05-18.md), with release tag, asset URLs, checksums, workflow result, package verification metadata, and remaining install/reputation limitations.
- macOS Apple Silicon post-fix lifecycle run result is recorded in [MACOS_OPERATOR_PORTABLE_POST_FIX_LIFECYCLE_EVIDENCE_2026-05-14.md](./MACOS_OPERATOR_PORTABLE_POST_FIX_LIFECYCLE_EVIDENCE_2026-05-14.md), with commit hash, package identifier, smoke output, clean-worktree packaging evidence, runtime lifecycle evidence, and known limitations.
- macOS installable operator candidate build evidence is recorded in [MACOS_INSTALLER_REAL_MAC_BUILD_EVIDENCE_2026-05-16.md](./MACOS_INSTALLER_REAL_MAC_BUILD_EVIDENCE_2026-05-16.md), with host facts, validation results, runtime provenance fix, `.pkg` path/checksum, manifest fields, package verification, content scan, and the blocked local install result.
- Prompt 7 local validation on 2026-05-14 recorded app build/test, server test, packaging/claim-scan tests, bundled-runtime package verification, app/server high-severity npm audit, and diff-check results on merged main.
- Windows and macOS signing/distribution limitation notes are recorded, but they do not provide signed installer, notarization, SmartScreen, Gatekeeper, enterprise distribution, or support-matrix evidence.

Exit gate result:

- **NOT YET SATISFIED.**
- Study Owner/operator launch from docs on a clean laptop profile remains to be evidenced.
- The package path is close to controlled synthetic walkthrough readiness, and one Windows downloaded portable release-asset smoke plus one Windows development/setup/startup sanity pass plus Windows installer GitHub release-asset verification are now recorded, but Phase 2 remains open until Windows clean-profile or second-machine packaged-operator verification, Windows installer lifecycle evidence, distribution-scope evidence, macOS support-scope evidence, and operator walkthrough evidence are recorded.
- Even after Phase 2 closes, the result is readiness for controlled synthetic walkthrough only, not pilot or production.

### Phase 3: Phone Participant And SMS Candidate

Goal: make the participant experience openable on phones, with SMS-linked entry ready for human testing.

Phase 3 plan/evidence matrix: [PHASE3_PHONE_SMS_CANDIDATE_PLAN.md](./PHASE3_PHONE_SMS_CANDIDATE_PLAN.md).
SMS copy governance note: [PHASE3_SMS_COPY_GOVERNANCE.md](./PHASE3_SMS_COPY_GOVERNANCE.md).
SMS mock/sandbox and provider evidence packet: [PHASE3_SMS_EVIDENCE_PACKET.md](./PHASE3_SMS_EVIDENCE_PACKET.md).
Magic-link privacy review: [PHASE3_MAGIC_LINK_PRIVACY_REVIEW.md](./PHASE3_MAGIC_LINK_PRIVACY_REVIEW.md).
Twilio real-SMS track: [PHASE3_TWILIO_REAL_SMS_TRACK.md](./PHASE3_TWILIO_REAL_SMS_TRACK.md).

Current Phase 3 status as of 2026-05-18: **LOCAL MOCK/SANDBOX IMPLEMENTATION AND EVIDENCE-PREP SUBSTANTIALLY COMPLETE; DEVICE/PROVIDER/HUMAN EVIDENCE GATES OPEN** and **NOT READY FOR HUMAN TESTING**.

Completion snapshot:

- Codex-doable Phase 3 materials are complete for the current local mock/sandbox scope: implementation matrix, SMS evidence packet, SMS copy reviewer packet, magic-link privacy reviewer packet, mobile task-flow scaffold, mobile device runbooks/templates, and PWA deferral record are in place.
- Required implementation matrix items: 10 complete for local mock/sandbox scope, with PWA deferred for Phase 3 and native iOS/Android excluded unless separately approved. PR #85 adds gated Twilio provider plumbing, setup-status reporting, delivery callback handling, inbound STOP/HELP handling, and an operator setup prompt for the real-provider track.
- Required evidence items: SMS mock/sandbox automation, SMS evidence packet, SMS copy governance, link/token privacy remediation, and mobile task-flow automation are recorded for internal engineering use only; iPhone/Safari, Android/Chrome, real provider/sandbox, accessibility, reviewer signoff, and human-observed evidence remain NOT RUN / HUMAN_REQUIRED / PROVIDER_REQUIRED.
- PWA decision: deferred for Phase 3. The charter requires device-agnostic participation, accessibility, secure defaults, data minimization, and low-waste operation; it does not require installable/offline PWA behavior. Mobile web is the Phase 3 phone surface.
- Targeted verification: Phase 3 server build, focused SMS/magic-link regression tests, and full server tests passed on 2026-05-13 in the merged Phase 3 PRs. The gated Twilio setup track merged on 2026-05-15 with app/server builds, focused Twilio and SMS magic-link tests, full server tests, and server security audit passing. A 2026-05-15 local follow-up completed the SMS evidence packet and reran focused SMS/Twilio tests plus full server tests.
- Optional browser scaffolds: `npm --prefix server run test:phase3-magic-link-browser-scaffold` passed locally on 2026-05-13 with live backend/frontend prerequisites and Microsoft Edge headless; `npm --prefix server run test:phase3-mobile-task-flow-scaffold` passed locally on 2026-05-13 and recorded consent, Round 1, support, no-active-task, later round, closeout, and withdrawal observations. Cloud runs without backend/frontend prerequisites can only produce precondition evidence.
- Exit gate remains open because phone-device evidence, real SMS/provider evidence, telecom/provider setup evidence, accessibility evidence, and human reviewer/signoff work are still outstanding.

Phase 3 closeout interpretation:

- **Closed from here:** local mock/sandbox implementation, repository-verifiable SMS/magic-link/Twilio guardrail tests, evidence packet scaffolding, reviewer packet scaffolding, mobile runbooks/templates, and PWA deferral documentation.
- **Still open:** actual iPhone/Safari and Android/Chrome evidence, real provider/sandbox Twilio evidence if SMS provider testing is in scope, accessibility review, SMS copy review, privacy/security review, Data Custodian review, and human-observed phone walkthrough.
- Therefore Phase 3 is ready for evidence collection, not closed for the Production Ready exit gate.

Phase 3 blocker interpretation:

- SMS remains mock/sandbox/internal-only by default. Real provider credentials, telecom/compliance readiness, and production SMS operations remain deferred.
- Twilio real-SMS plumbing now has a gated implementation track, but it remains disabled by default and does not close real-SMS readiness, telecom compliance, privacy/security review, Data Custodian review, copy review, device evidence, or human-testing approval.
- Downloaded-package operators now receive an SMS setup choice in the UI and can be directed to Twilio setup guidance before study SMS policy configuration; the setup check returns readiness flags only, not secrets. The first-run SMS setup choice is in-memory UI state only and is not persisted in browser storage.
- Opaque-link, token-privacy, and SMS audit boundaries are implemented for engineering scope, but these controls still require human-observed phone evidence and signoff artifacts.
- Mobile web is the required phone path for this candidate; PWA install/offline behavior and native mobile app paths remain out of scope unless separately approved.

Local task-flow scaffold evidence note: [PHASE3_MOBILE_WEB_TASK_FLOW_EVIDENCE.md](./PHASE3_MOBILE_WEB_TASK_FLOW_EVIDENCE.md).

Required implementation:

- Mobile participant entry route works from an opaque link.
- SMS copy remains neutral and does not reveal study-sensitive content.
- SMS is optional and opt-in.
- Real-provider SMS setup, if enabled, is surfaced as an operator choice and remains feature-gated until provider setup and review evidence are recorded.
- Phone verification or clearly documented mock/sandbox equivalent exists.
- Magic links are opaque, expiring, single-use or otherwise risk-controlled, and do not include participant ID, study ID, email, phone, or role in the URL.
- SMS send/reminder attempts are audited without raw token, OTP, full phone number, or sensitive message content.
- STOP/HELP handling is implemented or explicitly simulated for the human testing candidate.
- Staff controls for resend/reminder are rate-limited and permission-gated.
- Mobile web task flow covers consent, Round 1, later round, no-active-task, closeout, support, and withdrawal.
- PWA cache/storage policy is not required for Phase 3 because PWA is deferred; future PWA work requires a separate ADR and privacy-reviewed cache/storage/session-revocation policy.

Required evidence:

- iPhone/Safari real-device or simulator evidence.
- Android/Chrome real-device or emulator evidence.
- SMS mock/sandbox outbox evidence or provider sandbox evidence.
- For Twilio or another real provider: sender/Messaging Service approval or sandbox status, delivery callback evidence, inbound STOP/HELP evidence, setup-status evidence, and no-secret/no-SID exposure checks.
- Copy review for SMS messages.
- Privacy review of link/token behavior.
- Mobile screenshots or screen recordings for active tasks.

Exit gate:

- A participant tester can receive or simulate an SMS, open the phone link, consent, complete tasks, and access support/withdrawal paths using synthetic data.

### Phase 4: Human Testing Binder And Release Hygiene

Goal: assemble everything needed for final human testing.

Status: **BINDER ASSEMBLED / HUMAN_REQUIRED ITEMS OPEN / NOT READY FOR HUMAN TESTING**.

Phase 4 binder package status:

| Requirement | Phase 4 artifact | Status |
| --- | --- | --- |
| Binder index | [Phase 4 human testing binder index](./phase4-human-testing-binder/README.md) | ASSEMBLED |
| Operator checklist | [Operator checklist](./phase4-human-testing-binder/OPERATOR_CHECKLIST.md) | ASSEMBLED; execution remains `NOT RUN` / `HUMAN_REQUIRED` |
| Observer transcript | [Observer transcript](./phase4-human-testing-binder/OBSERVER_TRANSCRIPT.md) | ASSEMBLED; execution remains `NOT RUN` / `HUMAN_REQUIRED` |
| Screenshot/log evidence index | [Screenshot/log evidence index](./phase4-human-testing-binder/SCREENSHOT_LOG_EVIDENCE_INDEX.md) | ASSEMBLED; evidence attachment remains `HUMAN_REQUIRED` |
| Defect severity rubric | [Defect severity rubric](./phase4-human-testing-binder/DEFECT_SEVERITY_RUBRIC.md) | ASSEMBLED |
| Accessibility checklist | [Accessibility checklist](./phase4-human-testing-binder/ACCESSIBILITY_CHECKLIST.md) | ASSEMBLED; review remains `NOT RUN` / `HUMAN_REQUIRED` |
| Backup/restore rehearsal sheet | [Backup/restore rehearsal sheet](./phase4-human-testing-binder/BACKUP_RESTORE_REHEARSAL_SHEET.md) | ASSEMBLED; rehearsal remains `NOT RUN` / `HUMAN_REQUIRED` |
| Retention/deletion rehearsal sheet | [Retention/deletion rehearsal sheet](./phase4-human-testing-binder/RETENTION_DELETION_REHEARSAL_SHEET.md) | ASSEMBLED; rehearsal remains `NOT RUN` / `HUMAN_REQUIRED` |
| Incident drill sheet | [Incident drill sheet](./phase4-human-testing-binder/INCIDENT_DRILL_SHEET.md) | ASSEMBLED; drill remains `NOT RUN` / `HUMAN_REQUIRED` |
| Data Custodian export review sheet | [Data Custodian export review sheet](./phase4-human-testing-binder/DATA_CUSTODIAN_EXPORT_REVIEW_SHEET.md) | ASSEMBLED; signoff remains `HUMAN_REQUIRED` |
| Security review/signoff sheet | [Security review/signoff sheet](./phase4-human-testing-binder/SECURITY_REVIEW_SIGNOFF_SHEET.md) | ASSEMBLED; signoff remains `HUMAN_REQUIRED` |
| Final P0 blocker table | [Final P0 blocker table](./phase4-human-testing-binder/FINAL_P0_BLOCKER_TABLE.md) | ASSEMBLED; P0 readiness blockers remain open |
| Versioned candidate record | [Versioned candidate record](./phase4-human-testing-binder/CANDIDATE_RECORD.md) | ASSEMBLED with commit hash, branch/tag/package fields, supported/unsupported surfaces, test commands, and known limitations |
| Human testing candidate checklist | [Human testing candidate checklist](./phase4-human-testing-binder/HUMAN_TESTING_CANDIDATE_CHECKLIST.md) | CREATED; current mark remains `NOT READY FOR HUMAN TESTING` |
| Repository hygiene | [Repository hygiene checklist](./phase4-human-testing-binder/REPOSITORY_HYGIENE_CHECKLIST.md) | ASSEMBLED; automated checks refreshed, human no-real-data/no-sensitive-export review remains required |

Required implementation status:

- **COMPLETE FOR BINDER ASSEMBLY:** All Phase 4 binder documents listed above have been created and linked.
- **PARTIAL FOR RELEASE HYGIENE:** Automated hygiene checks are recorded. Human review remains required for no-real-participant-data and no-sensitive-export confirmation.
- **NOT COMPLETE FOR HUMAN TESTING READINESS:** Laptop and phone candidate run evidence, reviewer signoffs, and P0 blocker closure remain open.

Required evidence:

- Binder committed or attached.
- Candidate checklist created and marked with the current readiness decision. The current mark remains **NOT READY FOR HUMAN TESTING** until laptop and phone run evidence is attached.
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
- Operator setup/status surfaces may expose readiness flags only; they must not expose Account SID, auth tokens, Messaging Service SID, raw sender numbers, message bodies, raw OTPs, or raw magic-link tokens.
- Real SMS provider use requires Security & Privacy Lead and Data Custodian review before any real participant use.

## Evidence Requirements By Candidate Surface

| Evidence | Windows laptop | macOS laptop | Phone mobile web | SMS | PWA | Native mobile |
| --- | --- | --- | --- | --- | --- | --- |
| Install/start | Required if included | Required if included | Browser open-link required | Provider/mock setup required | Deferred for Phase 3 | Deferred |
| Stop/reset/uninstall | Required | Required | Logout/session reset | Opt-out/reset | Deferred for Phase 3 | Deferred |
| Data directory policy | Required | Required | Browser storage policy | Phone storage/audit policy | Deferred; future ADR required | Secure storage policy |
| Accessibility | Keyboard and screen reader | Keyboard and VoiceOver | Real-device mobile | SMS copy clarity | Deferred; mobile web a11y carries Phase 3 | Native a11y |
| Security/privacy | Local secrets, logs, exports | Local secrets, logs, exports | Link/session privacy | Token/provider privacy | Deferred; future cache privacy review required | Permissions/SDK review |
| Human testing evidence | Required | Required if in scope | Required | Required if in scope | Not required for Phase 3 | Not in scope unless approved |

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

Latest repo-verifiable validation snapshot:

- 2026-06-28, release-package commit `18faba2`: GitHub Actions CI run `28340083441` completed successfully. Windows release workflow run `28340083451` and macOS release workflow run `28340083533` completed successfully and published the June 28 `r2` GitHub prerelease assets. Server build/test passed and server audit reported 0 vulnerabilities; app lint/build/test passed and app tests reported 31/31, but app audit still reported 5 vulnerabilities (2 low, 2 moderate, 1 high), including Vite advisory output; this remains a dependency/security triage item.
- Earlier on 2026-06-28, PR #136 head `a62d15e` merged into `main` as `2fa50fe`: GitHub Actions CI run `28339250962` completed successfully. Server build/test passed and `npm audit --audit-level=high` reported 0 vulnerabilities. App lint/build/test passed and app tests reported 31/31, but app `npm audit --audit-level=high` reported 5 vulnerabilities (2 low, 2 moderate, 1 high), including Vite advisory output. Follow-up repository cleanup commit `dcd54e2` updated documentation, gitignore, and preserved failed QC artifacts; no product-behavior or human-readiness claim is made from that cleanup commit.
- 2026-05-14, merged main at `121a526`: `npm.cmd --prefix app run build` passed after rerun outside the local sandbox; `npm.cmd --prefix app run test` passed 28/28; `npm.cmd --prefix server test` passed; packaging/claim-scan tests passed 18/18; `powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-bundled-runtime.ps1 verify` passed; app and server `npm audit --audit-level=high` reported 0 vulnerabilities; `git diff --check` passed. `npm.cmd --prefix app run lint` produced two existing React Hook dependency warnings and no errors.
- 2026-05-14, merged main at `121a526`: claim-scan follow-up coverage catches standalone `IRB approval`, combined `IRB/ethics approval`, and standalone `ethics approval` package overclaims.
- 2026-05-15, merged main at `eb4bacb`: PR #85 added the gated Twilio setup/provider track and operator SMS setup prompt. Validation recorded in the PR, with portable command forms shown here: `npm --prefix server run build` passed; `npm --prefix app run build` passed; `node scripts/run-tests.mjs "server/tests/twilioSmsProvider.test.mjs"` passed; `node scripts/run-tests.mjs "server/tests/smsMagicLink.test.mjs"` passed; `npm --prefix server test` passed; `npm --prefix server run security:audit` passed with 0 vulnerabilities.
- 2026-05-17, merged main at `6a45b6d`: Windows installer candidate cleanup and GitHub hardening reconciliation passed `node scripts/packaging/windows-installer.mjs build` through payload verification to the expected missing-`ISCC.exe` gate; `node scripts/packaging/windows-installer.mjs verify` passed; `node scripts/packaging/tests/windows-installer.test.mjs`, `node scripts/packaging/tests/windows-portable-package.test.mjs`, `node scripts/packaging/tests/packaging-core.test.mjs`, and `node scripts/packaging/tests/package-verification.test.mjs` passed; `git diff --check` passed.
- 2026-05-18, merged main at `61f9506`: GitHub cleanup follow-up removed SMS setup browser-storage persistence and merged PR #100. Validation on the GitHub-connected checkout passed `npm.cmd --prefix app test` (28/28), `npm.cmd --prefix app run lint`, `npm.cmd --prefix app run build`, `npm.cmd --prefix app run security:audit` (0 vulnerabilities), `npm.cmd --prefix server test`, `npm.cmd --prefix server run security:audit` (0 vulnerabilities), and `git diff --check`. GitHub branch cleanup left only `main`, and the open PR queue was empty.
- 2026-05-18, Phase 4 binder assembly at source snapshot `2a71d6c`: `npm.cmd --prefix app test` passed 28/28; `npm.cmd --prefix app run lint` passed; `npm.cmd --prefix app run build` passed after rerun outside the local sandbox file-access limit; `npm.cmd --prefix server test` passed 28/28; `npm.cmd --prefix server run security:audit` passed with 0 vulnerabilities; `npm.cmd --prefix app run security:audit` passed the high-severity threshold while reporting one moderate `brace-expansion` advisory; heuristic secret scan returned no matches; `git diff --check` passed with CRLF warnings only.

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
| HTC-WP6 | Harden SMS magic-link path. | Neutral SMS, opaque link, opt-in, mock/sandbox evidence, audit/privacy checks, and gated Twilio setup/provider track with real-provider evidence still open. |
| HTC-WP7 | Decide PWA scope. | **Done for Phase 3:** PWA is deferred by charter-based scope decision; future PWA requires separate ADR plus cache/storage/session-revocation evidence. |
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


## Phase 3 local hardening update (2026-05-13)
- Implemented: SMS/magic-link audit `details` no longer include direct `participantId`/`participant_id` fields for magic-link creation/use, round-open send/fail, and phone verification events; object IDs and authorization behavior remain unchanged.
- Implemented: new-send token minimization now revokes prior active participant+study+version+round magic-link tokens before issuing a new token, with regression coverage verifying only one active usable token remains.
- Implemented: audit-package JSON export now applies detail-level redaction for `participantId`/`participant_id` fields to align with reviewer-facing redaction metadata.
- Added regression checks for opaque URL token path, no raw token persistence/audit leakage, OTP and full-phone non-leakage, participant-ID absence from SMS/magic-link audit details, and one-active-token behavior across repeated sends.
- Non-claim boundary: these updates are local engineering hardening only and do not constitute production/pilot/human-subjects/real-SMS readiness claims.

## Phase 3 SMS governance update (2026-05-13)
- Implemented: local/mock STOP and HELP keyword simulation through a staff-gated inbound endpoint.
- Implemented: local/mock resend cooldown and daily SMS cap enforcement with suppression-reason assertions.
- Implemented: permission tests for SMS controls and redacted HELP support audit events.
- Non-claim boundary: these updates do not establish carrier integration, telecom compliance, real SMS readiness, or human-testing readiness.

## Phase 3 browser scaffold update (2026-05-13)
- Added: local scripted `/m/{token}` browser scaffold for synthetic/internal magic-link flow checks.
- Covered when run with prerequisites: synthetic participant setup, mock SMS send verification, local shared-database magic-link token seeding without exposing SMS body text through an API, mobile-sized browser open, Round 1 submit attempt, single-use rejection, invalid-token rejection, and redacted artifact writing.
- Local run evidence: `docs/qc/full-mock-trial/artifacts/phase3-magic-link-browser-scaffold-2026-05-13T20-54-54-667Z.md`.
- Precondition: the scaffold is optional and requires a running local backend plus compatible browser automation support; failure without that backend is expected and does not by itself indicate a build/test failure.
- Non-claim boundary: this scaffold is not phone-device, human-observed, accessibility, real-SMS, or production readiness evidence.

## Phase 3 mobile task-flow scaffold update (2026-05-13)
- Added and repaired: local scripted mobile task-flow scaffold for synthetic/internal participant state coverage.
- Covered when run with prerequisites: consent information, Round 1 submission, participant support issue submission, no-active-task waiting state, later-round structured judgment submission, released closeout/final-results view, withdrawal action, and redacted evidence output.
- Local run evidence: `docs/qc/full-mock-trial/artifacts/phase3-mobile-task-flow-scaffold-2026-05-13T21-32-09-080Z.md`.
- Non-claim boundary: this scaffold is not iPhone/Safari or Android/Chrome real-device evidence, not accessibility evidence, not human-observed testing, not real-SMS/provider evidence, and not production readiness evidence.

## Phase 3 Twilio setup track update (2026-05-15)
- Implemented: gated Twilio provider plumbing with mock SMS remaining the default path unless the real-provider environment is explicitly configured.
- Implemented: operator SMS setup prompt and setup-status check that reports readiness flags without exposing provider secrets or sensitive identifiers.
- Implemented: Twilio delivery callback handling, inbound STOP/HELP handling, and Twilio-backed phone verification behavior with development OTP disclosure disabled for the real provider path.
- Added regression checks for Twilio provider behavior and existing SMS magic-link privacy controls.
- Non-claim boundary: this update does not establish Twilio account readiness, carrier approval, telecom compliance, real participant texting approval, device evidence, human-observed testing, pilot readiness, or production readiness.

## Phase 2 macOS installable candidate track (new, parallel)
- Added a thin macOS installer adapter (`scripts/packaging/macos-installer.mjs`) that reuses shared packaging core and existing macOS portable package staging.
- The macOS portable flow remains developer/admin package machinery; the normal macOS tester release path is now one installer ZIP bundle.
- Current merged status: installer packaging logic is implemented, real-Mac `.pkg` build/package-verification evidence is recorded, corrected release `internal-macos-package-candidate-2026-05-18-r4` has downloaded-asset inspection evidence, and June 28 release `internal-macos-package-candidate-2026-06-28-r2` has GitHub release asset evidence. Install and installed-path human lifecycle remain **BLOCKED / NOT RUN** until an operator-authorized macOS install is performed.
- 2026-06-28 operator-model cleanup status: macOS remains an **internal package candidate / NOT READY FOR HUMAN TESTING**. The intended normal surface is one launch path with browser fallback to `http://127.0.0.1:4173`; Stop/Status are admin/debug lifecycle commands, not ordinary user shortcuts. Closing the visible browser/app window stopping the macOS runtime remains **IMPLEMENTATION_REQUIRED / HUMAN_REQUIRED** until proven on macOS. GitHub asset availability is **PASSED** for June 28 `r2`; installed lifecycle remains **NOT RUN**.
- Non-claims remain: no signing/notarization/Gatekeeper claim, no broad macOS support claim, no production/pilot/human-subjects readiness claim.

## Phase 2 Windows installer candidate track (new, parallel)
- Added an Inno Setup installer-candidate adapter (`scripts/packaging/windows-installer.mjs`) that reuses the Windows portable bundled-runtime payload and shared packaging verification.
- Added installer-specific launcher/runtime routing through `scripts/windows/installer-candidate-bundled-runtime.ps1`, with runtime data under `%LOCALAPPDATA%\DelphiCommons\windows-installer-candidate`.
- Current merged status: app/server build, production dependency staging, selective pinned-runtime staging, package verification, and launcher hardening tests pass. GitHub Actions produced the June 28 `r2` Windows ZIP/EXE download assets from a Windows runner with Inno Setup available; clean-profile or second-machine installed lifecycle evidence remains **NOT RUN**.
- Non-claims remain: no code-signing/SmartScreen/Defender claim, no clean-profile or second-machine installer lifecycle claim, no broad Windows support claim, no production/pilot/human-subjects readiness claim.
