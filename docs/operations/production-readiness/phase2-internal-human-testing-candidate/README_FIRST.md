# README_FIRST — Phase 2 Internal Human-Testing Candidate Binder

Status: **PREPARED ONLY**.

This binder integrates Phase 2 package evidence templates into a controlled internal human-testing documentation structure. It does **not** assert that human testing is complete.

## Non-claim guardrails

- Human-observation fields remain `NOT RUN` / `HUMAN_REQUIRED` until real human evidence is attached.
- No claim of pilot readiness, production readiness, real human-subjects readiness, legal readiness, IRB approval, or certification readiness.
- Accessibility, security, Data Custodian, Study Owner, and human dry-run signoffs remain incomplete placeholders unless actual signed evidence is attached.

## Binder contents

1. `OPERATOR_CHECKLIST.md` — operator execution checklist from install to final cleanup.
2. `EVIDENCE_INDEX_TEMPLATE.md` — evidence table-of-contents and link map.
3. `OBSERVER_TRANSCRIPT_TEMPLATE.md` — human observer notes template.
4. `DEFECT_SEVERITY_RUBRIC.md` — severity classification rubric for defects.
5. `SIGNOFF_PLACEHOLDERS.md` — mandatory signoff placeholders, all `SIGNOFF_REQUIRED`.

## Phase 2 package-evidence templates linked into this binder

- `../templates/PORTABLE_BUNDLED_RUNTIME_EVIDENCE_TEMPLATE.md`
- `../templates/MACOS_OPERATOR_PORTABLE_PACKAGE_EVIDENCE_TEMPLATE.md`
- `../WINDOWS_OPERATOR_PORTABLE_PACKAGE_LOCAL_EVIDENCE.md`
- `../WINDOWS_OPERATOR_PORTABLE_PACKAGE_EXTRACTED_ZIP_EVIDENCE.md`
- `../PHASE2_WINDOWS_SECOND_MACHINE_RUNBOOK.md`
- `../PHASE2_MACOS_FOLLOWUP_EVIDENCE_CHECKLIST.md`
- `../WINDOWS_SIGNING_DISTRIBUTION_LIMITATIONS.md`
- `../MACOS_SIGNING_DISTRIBUTION_LIMITATIONS.md`

## Usage order

1. Execute `OPERATOR_CHECKLIST.md` and fill only what was actually done.
2. Capture timestamps and outcomes in `OBSERVER_TRANSCRIPT_TEMPLATE.md`.
3. Record artifacts and links in `EVIDENCE_INDEX_TEMPLATE.md`.
4. Classify issues with `DEFECT_SEVERITY_RUBRIC.md`.
5. Collect required approvals in `SIGNOFF_PLACEHOLDERS.md`.

If an activity was not executed by a human in the target environment, mark it `NOT RUN` and keep the signoff as `HUMAN_REQUIRED` or `SIGNOFF_REQUIRED`.
