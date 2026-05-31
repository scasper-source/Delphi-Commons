# Current Project Status

Date basis: 2026-05-29.

Boundary statement: Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.

## Repository State

- GitHub repository: `scasper-source/Delphi-Commons`
- Verified application-code snapshot before the Phase 4 binder assembly: `2a71d6c Correct Phase 2 Windows sanity OS version`
- Open pull requests: none at the time of this snapshot
- Remote branches: `main` only at the time of this snapshot
- Stale `codex/*` branches: removed after confirming they were merged, superseded, or tied to closed PRs
- Public release: not created
- DOI/archive release: not created

## Current Verification Snapshot

The following checks were refreshed on the GitHub-connected checkout during Phase 4 binder assembly on 2026-05-18:

| Area | Result |
| --- | --- |
| App tests | PASS, 28/28 |
| App lint | PASS, 0 errors |
| App production build | PASS |
| App high-severity npm audit | PASS for high severity; one moderate `brace-expansion` advisory reported |
| Server tests | PASS, 28/28 |
| Server high-severity npm audit | PASS, 0 vulnerabilities |
| Whitespace diff check | PASS, CRLF warnings only |
| Heuristic no-secrets scan | PASS, no matches |
| Frontend browser-storage policy gate | PASS after removing SMS setup `localStorage` use |

## Readiness Summary

Delphi Commons has strong controlled synthetic/mock-trial and internal engineering evidence. It remains **not ready** for production deployment, real human-subjects research, pilot launch, IRB/ethics launch, legal approval, independent security certification, or completed accessibility conformance.

| Track | Current interpretation |
| --- | --- |
| `mock_trial` | Controlled synthetic mock-trial evidence exists and remains the strongest validated path. |
| `human_testing_candidate` | In progress. Laptop and phone/SMS candidate work is substantially documented and partially implemented, but human-required gates remain open. |
| `controlled_pilot` | Not authorized. |
| `production_candidate` | Not authorized. |
| `public_open_source` | Private GitHub clean-history repository exists; public release and DOI/archive steps remain open. |

## Phase Snapshot

| Phase | Status |
| --- | --- |
| Phase 0 baseline preservation | Baseline mock-trial/regression evidence is preserved. |
| Phase 1 product surface lock | Complete as scope lock only. It does not authorize human testing. |
| Phase 2 downloadable laptop operator candidate | In progress. Windows internal portable ZIP, corrected Windows internal installer `r8` ZIP/EXE, and macOS Apple Silicon single installer ZIP bundle are available on GitHub. A 2026-05-29 clean Windows `r8` operator report shows install/launch/close-window stop/relaunch/uninstall mostly passing, but saved-study reopen/new-study continuity failed or was unclear and screenshots still need attachment. Local follow-up code now adds package-mode multi-study and Study PI/Ethics PI signoff regressions plus clearer signoff UI; these still require merge, package rebuild, and clean Windows retest evidence. |
| Phase 3 phone/SMS candidate | Local mock/sandbox implementation and evidence-prep are substantially complete. Real iOS/Android device evidence, real provider/sandbox evidence if in scope, accessibility review, privacy/copy/Data Custodian review, and human-observed phone walkthrough remain open. |
| Phase 4 human testing binder | Binder package is assembled for final human-testing preparation; candidate remains not ready until laptop/phone run evidence and required signoffs are attached. |
| Phase 5 final human testing | Not run. |

## Still Required Before Human Testing

- Pin a candidate commit/package and record the exact supported surfaces.
- Complete clean-profile or second-machine laptop package evidence for the selected Windows path, including linked screenshot/log artifacts.
- Merge, package, and rerun the Windows saved-study reopen/new-study continuity path found during the 2026-05-29 `r8` retest.
- Merge, package, and rerun the Study PI plus Ethics PI signoff flow found confusing or unreachable during the 2026-05-29 `r8` retest.
- Complete macOS install/lifecycle evidence if macOS is included for the candidate.
- Complete iPhone/Safari and Android/Chrome phone-flow evidence.
- Complete SMS copy/privacy/Data Custodian/security review for any SMS path used in human testing.
- Complete accessibility review for the selected surfaces.
- Execute and sign off the Phase 4 human testing binder.
- Run a human-observed end-to-end walkthrough with synthetic/internal data only.

Open-source code does not imply open study data. Study data, participant identities, consent records, response data, audit logs, exports, and support notes remain private unless separately released under an approved governance process.
