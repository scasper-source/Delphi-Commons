# Versioned Candidate Record

Status: **PREPARED / JUNE 2026 WINDOWS AND MACOS PACKAGES PINNED / NOT READY FOR HUMAN TESTING**.

Date basis: 2026-06-28.

## Candidate Identity

| Field | Value |
| --- | --- |
| Repository | `scasper-source/Delphi-Commons` |
| Candidate source commit | `18faba2` (`Allow release publish after artifact quota failure`) |
| Candidate branch | `main` at the recorded source snapshot |
| Phase 4 binder branch | `main` plus follow-up evidence updates |
| Windows candidate tag | `internal-windows-installer-candidate-2026-06-28-r2` |
| Windows candidate package identifier | `delphi-commons-windows-x64-installer-internal-internal-windows-installer-candidate-2026-06-28-r2-18faba2.zip` |
| macOS candidate tag | `internal-macos-package-candidate-2026-06-28-r2` |
| macOS candidate package identifier | `delphi-commons-macos-arm64-installer-internal-internal-macos-package-candidate-2026-06-28-r2-18faba2.zip` |
| Candidate data class | Synthetic/internal test data only |
| Decision label | `NOT READY FOR HUMAN TESTING` |

## Selected Candidate Surfaces

These are the intended candidate surfaces for final human-testing preparation. They are not considered ready until the evidence rows in this binder are filled.

| Surface | Candidate role | Current evidence posture |
| --- | --- | --- |
| Windows laptop operator path | Primary Study Owner/operator launch surface. A clean Windows laptop profile on this machine may be used if it follows the documented clean-profile run and records evidence. | June 28 `r2` package is released for retest; HUMAN_REQUIRED clean-profile or second-machine launch evidence remains open |
| Phone browser participant path | Primary participant mobile path using synthetic/internal data. | HUMAN_REQUIRED iOS/Android real-device or documented mobile-browser evidence remains open |
| SMS-linked entry or simulated SMS path | Candidate entry path only if copy/privacy/Data Custodian/security review and provider/simulation boundaries are recorded. | HUMAN_REQUIRED; real provider readiness not claimed |
| macOS laptop operator path | Optional surface if included in the final candidate scope. | June 28 `r2` Apple Silicon package is released; HUMAN_REQUIRED installed lifecycle evidence remains open |

## Unsupported Or Deferred Surfaces

- Production deployment.
- Real human-subjects research.
- Controlled pilot launch.
- Real participant data, institutional data, regulated data, or sensitive exports.
- Public internet deployment without a separate deployment/security review.
- Real SMS provider use unless provider approval, copy/privacy review, STOP/HELP behavior, and reviewer signoffs are attached.
- Native mobile apps and PWA distribution.
- External AI/provider-assisted workflows beyond separately governed synthetic/mock paths.

## Test Commands

Run these against the pinned candidate before marking the candidate ready for human testing:

| Command | Purpose | Current Phase 4 status |
| --- | --- | --- |
| GitHub Actions CI | App/server build, lint, tests, and audit commands configured in CI | PASS on run `28340083441` for commit `18faba2`; app audit still reported dependency findings |
| Windows release workflow | Build and publish Windows installer assets | PASS on run `28340083451` |
| macOS release workflow | Build and publish macOS package assets | PASS on run `28340083533` |
| `git diff --check` | Whitespace/conflict marker check | NOT RUN for this documentation refresh |

## Known Limitations

- The Windows internal installer candidate has been tagged and packaged as June 28 `r2`, but clean Windows retest evidence is not yet attached.
- The macOS Apple Silicon installer candidate has been tagged and packaged as June 28 `r2`, but installed-path lifecycle evidence is not yet attached.
- Study Owner/operator launch from docs on a clean laptop profile remains `HUMAN_REQUIRED`.
- Phone participant walkthrough evidence on real devices remains `HUMAN_REQUIRED`.
- Accessibility evidence remains `HUMAN_REQUIRED`.
- Backup/restore, retention/deletion, incident drill, Data Custodian, and security signoffs remain open.
- App dependency audit reports 5 findings in the latest June 28 CI snapshot, including one high Vite advisory; the dependency/security findings should be reviewed before final release/pilot decisions.
- Phase 1 human evidence remains open and is not closed by this Phase 4 binder.
- The repository is private; public release, DOI/archive release, and public/private boundary approval remain separate work.
