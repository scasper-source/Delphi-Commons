# Ethics Compliance Checklist — July Pilot (ADK Fire Conference)
**Project:** Delphi Commons
**Target:** MVP compliance for a real Delphi study run before the July conference.
**Authority:** Charter governs; AI Thin Spec is subordinate.
**Legend:**
- **Priority:** P0 (must ship for July) | P1 (ship if time)
- **Status:** Not Started | Partial | Done
- **Evidence:** link to tests, screenshots, or PRs

---

## P0 — Non-Negotiables for July (must ship)

### 1) Governance gate + roles
| ID | Priority | Requirement | UI/UX control | Backend enforcement | Proof test | Status | Evidence |
|---|---:|---|---|---|---|---|---|
| JUL-GOV-01 | P0 | Deployment MUST assign accountable roles; and before launch MUST require Governance Checklist signoff by Study Owner + Ethics & Methods Steward.  | “Roles” screen + “Launch checklist” requiring both signoffs | `LaunchStudy()` rejects unless roles exist + both signoffs recorded for current StudyVersion | Integration: attempt launch with missing role/signoff → blocked |  |  |
| JUL-GOV-02 | P0 | Platform outputs MUST never be framed as “truth”; exports must include limitations that consensus ≠ correctness.  | Export preview includes mandatory “limitations” block | Export generator always injects limitations text; cannot be removed | Integration: export contains limitations |  |  |

### 2) Participant information + consent + withdrawal
| ID | Priority | Requirement | UI/UX control | Backend enforcement | Proof test | Status | Evidence |
|---|---:|---|---|---|---|---|---|
| JUL-CON-01 | P0 | MUST support Participant Information Sheet with minimum content.  | Participant Info builder with required sections | Publish blocked unless required fields complete | Unit: required field validation |  |  |
| JUL-CON-02 | P0 | MUST capture explicit consent; version + timestamp consent; export consent records; allow withdrawal; explain withdrawal effects.  | Consent screen shows version; explicit checkbox; “Withdraw” with effects dialog | No consent → no participation; withdrawal blocks further prompts; consent records exportable | Integration: no consent blocks; withdrawal blocks; consent export includes version/timestamp |  |  |
| JUL-CON-03 | P0 | Participants MUST have adequate time to decide (notes: ~2 weeks standard).  | Invite wizard defaults to 14-day decision window (can override with rationale) | Store decision window; block “Open R1” before minimum unless waiver+rationale logged | Integration: default 14 days; override requires rationale |  |  |

### 3) Truthful anonymity + identity separation + access control
| ID | Priority | Requirement | UI/UX control | Backend enforcement | Proof test | Status | Evidence |
|---|---:|---|---|---|---|---|---|
| JUL-SEC-01 | P0 | MUST state plainly that complete anonymity cannot be guaranteed (researcher links responses across rounds).  | Mandatory consent clause cannot be deleted (only “override with noncompliance” flag) | Template engine includes clause; removal requires explicit override + audit | Unit: default consent includes clause; override audited |  |  |
| JUL-SEC-02 | P0 | MUST implement unique participant IDs; strict separation of identity data from response data; least privilege; encryption in transit/at rest; immutable audit logs for identity access; secure master list handling.  | Separate “Master list” UI vs “Responses” UI; role-gated views | Separate stores/keys; RBAC on endpoints; identity access writes audit events | Integration: unauthorized role cannot access master list; access creates audit event |  |  |

### 4) Core Delphi method fidelity (Rounds + content analysis integrity)
| ID | Priority | Requirement | UI/UX control | Backend enforcement | Proof test | Status | Evidence |
|---|---:|---|---|---|---|---|---|
| JUL-ROUND-01 | P0 | MUST enforce multi-round design (≥2 rounds); Round 1 open-ended OR documented replacement with bias warning + provenance.  | Study template defaults to 2–3 rounds; if “Modified Delphi,” shows warning + forces provenance | Round plan validator rejects single-round; modified mode requires rationale+provenance | Integration: cannot create 1-round study; modified requires rationale |  |  |
| JUL-CA-01 | P0 | MUST include audit trail for collapsing/merging decisions; preserve unique statements; support export of raw anonymized data for checks.  | Curation Desk requires “reason” for merge/split; “keep as-is” option | Merge/split endpoints require rationale; no auto-delete; raw anonymized export strips identifiers | Integration: merge without rationale blocked; export contains no identity fields |  |  |

### 5) Feedback neutrality + anti-coercion
| ID | Priority | Requirement | UI/UX control | Backend enforcement | Proof test | Status | Evidence |
|---|---:|---|---|---|---|---|---|
| JUL-FB-01 | P0 | MUST compute/display median + dispersion; show each participant their prior response alongside group summary; preserve feedback configuration.  | Panelist feedback page shows median + IQR/SD + distribution + “Your prior response” | Stats service calculates correctly; feedback config versioned per StudyVersion | Unit: known dataset median/IQR; Integration: panelist sees only own prior |  |  |
| JUL-FB-02 | P0 | MUST avoid coercive language (“align with the group”); present feedback neutrally; “retain my response” equal dignity.  | Two equal buttons: “Keep my response” / “Revise”; UI copy guide enforced | UI text lint (forbidden phrases) + component constraints (no outlier labels) | UI snapshot/grep test: forbidden strings absent |  |  |

### 6) Consensus rule governance + locking + versioning
| ID | Priority | Requirement | UI/UX control | Backend enforcement | Proof test | Status | Evidence |
|---|---:|---|---|---|---|---|---|
| JUL-CONS-01 | P0 | MUST require predefined consensus rule before Round 1; MUST lock against mid-study changes (changes require new study version); reports include threshold, justification, limitations.  | Builder step requires rule + justification; editing after R1 shows “Create new version” | Backend blocks in-place edits after R1 open; only `CreateStudyVersion()` allowed | Integration: edit after R1 blocked; new version created |  |  |

### 7) Reporting + reproducible exports + dissent preserved
| ID | Priority | Requirement | UI/UX control | Backend enforcement | Proof test | Status | Evidence |
|---|---:|---|---|---|---|---|---|
| JUL-RPT-01 | P0 | MUST include items reaching, near, and failing consensus with distributions/dispersion (non-consensus preserved).  | Report builder has fixed sections; cannot hide non-consensus | Export schema always includes all categories + stats | Integration: export includes failing items + dispersion |  |  |
| JUL-RPT-02 | P0 | MUST provide reproducible exports: regenerable from archived dataset + archived configuration; immutable audit log for changes and exports.  | Export screen shows StudyVersion + config hash; audit log view | Store config snapshot + dataset hash; export writes audit event | Integration: rerun export yields same hash (same dataset) |  |  |

### 8) Attrition management + participant care
| ID | Priority | Requirement | UI/UX control | Backend enforcement | Proof test | Status | Evidence |
|---|---:|---|---|---|---|---|---|
| JUL-CARE-01 | P0 | MUST provide upfront statement of rounds/time; configurable deadlines (~2 weeks typical); reminder tooling; transparent response rates.  | Round dashboard shows response rate; reminders tool; “time commitment” preview | Server computes response rates; reminders logged; no identity leak to panelists | Integration: correct response rate; reminders audited |  |  |

### 9) AI assistance (only if you include AI in the July pilot)
> If you decide to run July with **no AI**, these can be P1.
> If you want AI to speed July, these are **P0** because they’re the safety rails.

| ID | Priority | Requirement | UI/UX control | Backend enforcement | Proof test | Status | Evidence |
|---|---:|---|---|---|---|---|---|
| JUL-AI-01 | P0 | Humans MUST decide: AI may propose; AI output labeled “AI Suggestion”; no AI content reaches panelists without Accept/Edit/Reject.  | Every AI block shows “AI Suggestion (Not Final)” + buttons | Publish endpoints reject AI-derived content lacking acceptance record | Integration: cannot publish unaccepted AI content |  |  |
| JUL-AI-02 | P0 | Two-person gate: participant-facing R2 item set, wording changes, feedback config, consent materials, IRB export require Owner + Methods Steward signoff (default).  | “Pending approvals” banner; dual signoff UI | Backend requires both approvals when default enabled | Integration: 1 approval blocks |  |  |
| JUL-AI-03 | P0 | No silent transformation; must show provenance links (which anonymized responses contributed; transformation history; provenance type).  | Curation Desk shows source snippets + history graph | Store provenance graph; API returns source IDs + history | Integration: candidate item displays sources + history |  |  |
| JUL-AI-04 | P0 | AI audit log MUST include: feature invoked, timestamp, user+role, model/version, prompt template version, input scope IDs, output hash+stored output, human action, resulting content version IDs.  | Audit log “AI” filter shows full chain | Append-only events required on AI call + acceptance decision | Integration: AI call + accept creates events |  |  |
| JUL-AI-05 | P0 | AI data minimization: no direct identifiers; no identity↔response mapping; prefer anonymized text + item IDs + aggregates.  | “What data is sent” inspector | Request builder strips identifiers by schema | Unit: sanitizer removes identifiers |  |  |
| JUL-AI-06 | P0 | Forbidden AI behavior: drive convergence; change thresholds; auto-drop dissent; deceptive anonymity; undisclosed secondary use/training.  | No UI affordances; copy rules prevent coercive phrasing | Policy layer rejects prohibited operations | Negative tests: prohibited ops return error |  |  |
| JUL-AI-07 | P0 | External AI connectors (if enabled): explicit admin config; study-level disclosure; per-study/per-feature disable; document data sent; “no external AI” mode.  | Admin connector settings + disclosure preview | Connector cannot run unless enabled + disclosure set | Integration: connector blocked when not enabled/disclosed |  |  |

---

## P1 — “Nice if time” for July (ship after P0)

| ID | Priority | Requirement | UI/UX control | Backend enforcement | Proof test | Status | Evidence |
|---|---:|---|---|---|---|---|---|
| JUL-INC-01 | P1 | MUST offer mitigations for anonymity/accountability risk: optional structured justification fields; conduct expectations.  | Optional “Add rationale” field + conduct expectations page | Store rationale with response; role-gated visibility | Integration: rationale saved; not visible to other panelists |  |  |
| JUL-ACC-01 | P1 | Accessibility & inclusion: WCAG-aligned UI; device-agnostic; time-zone sensitivity; plain-language materials.  | Accessibility checklist + mobile-friendly views | UI components comply; timezone-aware scheduling | a11y checks; timezone tests |  |  |
| JUL-INC-02 | P1 | Pause study + document remediation + notify participants if rights/confidentiality affected.  | “Pause study” + incident form | Study state machine; audit incident | Integration: paused blocks submissions; incident logged |  |  |

---
