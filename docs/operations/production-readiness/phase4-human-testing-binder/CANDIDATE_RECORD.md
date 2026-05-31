# Versioned Candidate Record

Status: **PREPARED / FINAL PACKAGE PIN REQUIRED / NOT READY FOR HUMAN TESTING**.

Date basis: 2026-05-18.

## Candidate Identity

| Field | Value |
| --- | --- |
| Repository | `scasper-source/Delphi-Commons` |
| Candidate source commit | `2a71d6c` (`Correct Phase 2 Windows sanity OS version`) |
| Candidate branch | `main` at the recorded source snapshot |
| Phase 4 binder branch | `codex/assemble-phase4-human-testing-binder` |
| Candidate tag | `TAG_REQUIRED_BEFORE_HUMAN_TESTING` |
| Candidate package identifier | `PACKAGE_IDENTIFIER_REQUIRED_BEFORE_HUMAN_TESTING` |
| Candidate data class | Synthetic/internal test data only |
| Decision label | `NOT READY FOR HUMAN TESTING` |

## Selected Candidate Surfaces

These are the intended candidate surfaces for final human-testing preparation. They are not considered ready until the evidence rows in this binder are filled.

| Surface | Candidate role | Current evidence posture |
| --- | --- | --- |
| Windows laptop operator path | Primary Study Owner/operator launch surface. A clean Windows laptop profile on this machine may be used if it follows the documented clean-profile run and records evidence. | Corrected `r9` package is released for retest; HUMAN_REQUIRED clean-profile or second-machine launch evidence remains open |
| Phone browser participant path | Primary participant mobile path using synthetic/internal data. | HUMAN_REQUIRED iOS/Android real-device or documented mobile-browser evidence remains open |
| SMS-linked entry or simulated SMS path | Candidate entry path only if copy/privacy/Data Custodian/security review and provider/simulation boundaries are recorded. | HUMAN_REQUIRED; real provider readiness not claimed |
| macOS laptop operator path | Optional surface if included in the final candidate scope. | Evidence-dependent; not required unless selected |

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
| `npm.cmd --prefix app test` | App unit/regression tests | PASS, 28/28 on 2026-05-18 |
| `npm.cmd --prefix app run lint` | App lint | PASS on 2026-05-18 |
| `npm.cmd --prefix app run build` | App production build | PASS on 2026-05-18 after rerun outside sandbox file-access limit |
| `npm.cmd --prefix app run security:audit` | App high-severity dependency audit | PASS for high severity on 2026-05-18; one moderate `brace-expansion` advisory reported |
| `npm.cmd --prefix server test` | Server build and tests | PASS, 28/28 on 2026-05-18 |
| `npm.cmd --prefix server run security:audit` | Server high-severity dependency audit | PASS, 0 vulnerabilities on 2026-05-18 |
| `git diff --check` | Whitespace/conflict marker check | PASS on 2026-05-18; CRLF warnings only |

## Known Limitations

- The candidate has not been tagged or packaged with a final human-testing identifier.
- Study Owner/operator launch from docs on a clean laptop profile remains `HUMAN_REQUIRED`.
- Phone participant walkthrough evidence on real devices remains `HUMAN_REQUIRED`.
- Accessibility evidence remains `HUMAN_REQUIRED`.
- Backup/restore, retention/deletion, incident drill, Data Custodian, and security signoffs remain open.
- App dependency audit reports one moderate `brace-expansion` advisory; high-severity audit threshold passes, but the advisory should be reviewed before final release/pilot decisions.
- Phase 1 human evidence remains open and is not closed by this Phase 4 binder.
- The repository is private; public release, DOI/archive release, and public/private boundary approval remain separate work.
