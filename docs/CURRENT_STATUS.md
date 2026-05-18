# Current Project Status

Date basis: 2026-05-18.

Boundary statement: Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.

## Repository State

- GitHub repository: `scasper-source/Delphi-Commons`
- Verified application-code snapshot before this documentation refresh: `61f9506 Remove SMS setup browser storage`
- Open pull requests: none at the time of this snapshot
- Remote branches: `main` only at the time of this snapshot
- Stale `codex/*` branches: removed after confirming they were merged, superseded, or tied to closed PRs
- Public release: not created
- DOI/archive release: not created

## Current Verification Snapshot

The following checks passed on the GitHub-connected checkout after the `61f9506` application-code cleanup merge and before this documentation refresh:

| Area | Result |
| --- | --- |
| App tests | PASS, 28/28 |
| App lint | PASS, 0 errors |
| App production build | PASS |
| App high-severity npm audit | PASS, 0 vulnerabilities |
| Server tests | PASS |
| Server high-severity npm audit | PASS, 0 vulnerabilities |
| Whitespace diff check | PASS |
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
| Phase 2 downloadable laptop operator candidate | In progress. Windows and macOS package/installer tracks have internal engineering evidence, but clean-profile/second-machine, final installer lifecycle, signing/notarization/reputation, and operator walkthrough evidence remain open. |
| Phase 3 phone/SMS candidate | Local mock/sandbox implementation and evidence-prep are substantially complete. Real iOS/Android device evidence, real provider/sandbox evidence if in scope, accessibility review, privacy/copy/Data Custodian review, and human-observed phone walkthrough remain open. |
| Phase 4 human testing binder | Templates and binder materials exist; final candidate binder is not complete. |
| Phase 5 final human testing | Not run. |

## Still Required Before Human Testing

- Pin a candidate commit/package and record the exact supported surfaces.
- Complete clean-profile or second-machine laptop package evidence for the selected Windows path.
- Complete installed-path lifecycle evidence for any installer path used.
- Complete macOS install/lifecycle evidence if macOS is included for the candidate.
- Complete iPhone/Safari and Android/Chrome phone-flow evidence.
- Complete SMS copy/privacy/Data Custodian/security review for any SMS path used in human testing.
- Complete accessibility review for the selected surfaces.
- Assemble and sign off the human testing binder.
- Run a human-observed end-to-end walkthrough with synthetic/internal data only.

Open-source code does not imply open study data. Study data, participant identities, consent records, response data, audit logs, exports, and support notes remain private unless separately released under an approved governance process.
