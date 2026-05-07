# Phase 1 Human-Observed Pilot Dry-Run Package (`mock_trial` baseline reuse)

Date: 2026-05-07.

## Boundary

This package defines documentation artifacts for a human-observed dry run. It reuses existing mock-trial evidence as baseline only and does **not** claim pilot readiness, production readiness, human-subjects readiness, or certification.

## Baseline reuse rule

Use existing mock-trial evidence for prior automation results (artifacts, screenshots, export privacy, and decisions) as reference context only. Do not rerun full trials unless a change or explicit instruction requires rerun evidence.

## 1) Operator checklist (required)

Use template: `OPERATOR_CHECKLIST_TEMPLATE.md`.

Minimum checklist sections:
- environment context (commit, branch, runtime paths, operator identities),
- role/session setup,
- staff workflow steps,
- participant workflow steps,
- export review steps,
- incident/escalation capture hooks,
- defects and release recommendation summary.

## 2) Observer transcript template (required)

Use template: `OBSERVER_TRANSCRIPT_TEMPLATE.md`.

Transcript captures:
- timestamped step-by-step observations,
- expected vs actual behavior,
- user-visible wording and consent copy checks,
- accessibility/usability notes,
- blocker and severity labels.

## 3) Screenshot/log evidence requirements

Required evidence bundle per dry run:
- command transcript (build/start/test/check commands actually run),
- backend health and storage/audit-integrity snapshots,
- staff UI screenshots for each major stage,
- participant screenshots at consent, Round 1, later round, closeout,
- support interaction evidence,
- withdrawal path evidence,
- export review evidence (package list, classifications, review decisions),
- defect log and release decision summary.

Evidence hygiene:
- redact secrets and direct identifiers,
- avoid real participant data,
- keep artifacts under ignored/runtime evidence paths.

## 4) Staff workflow coverage matrix

Dry run must include human-observed execution of:
- study setup/edit,
- governance/signoff checkpoints,
- participant provisioning/invitation,
- round progression controls,
- support note/response handling,
- deletion/retention request review path,
- export package generation/listing/review,
- incident-path acknowledgement (tabletop acceptable for Phase 1 if clearly marked).

## 5) Participant workflow coverage matrix

Dry run must include human-observed execution of:
- consent view and consent action,
- Round 1 submission,
- one later-round task (rating/feedback),
- closeout page and limitation-language visibility,
- support request path,
- withdrawal path.

## 6) Export review coverage

At minimum, capture:
- package type/classification list,
- Data Custodian or designated reviewer decision for each reviewed package,
- restricted-warning interpretation notes,
- confirmation that de-identified sharing boundaries are followed.

## 7) Defect severity rubric

Use template: `DEFECT_SEVERITY_RUBRIC_TEMPLATE.md`.

Severity guide for dry-run defects:
- **P0**: participant-rights/confidentiality/identity-separation break, auth bypass, severe data exposure.
- **P1**: major workflow failure, incorrect consent/withdrawal behavior, export control failure without confirmed exposure.
- **P2**: workflow friction or inconsistent behavior that does not invalidate safeguards.
- **P3**: minor copy/polish/documentation issues.

## 8) Release decision template

Use template: `RELEASE_DECISION_TEMPLATE.md`.

Decision options for this package:
- `GO WITH CONDITIONS (mock/pilot rehearsal scope only)`
- `NO-GO`

The template must explicitly include non-claims:
- no pilot readiness claim by default,
- no production readiness claim,
- no human-subjects authorization claim.

## Required package outputs

- Completed operator checklist.
- Completed observer transcript.
- Screenshot/log evidence index.
- Defect log using severity rubric.
- Release decision record.

All outputs should link exact commit hash and environment label.
