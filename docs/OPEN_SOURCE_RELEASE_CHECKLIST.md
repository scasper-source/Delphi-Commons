# Open Source Release Checklist

Boundary statement: "Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research."

This checklist supports GitHub migration/open-source preparation. It does not certify production readiness, human-subjects readiness, IRB readiness, legal compliance, completed accessibility conformance, completed security review, or security certification.

Current snapshot: the public GitHub repository exists at `scasper-source/Delphi-Commons` (made public 2026-07-03). Main branch is protected with a GitHub ruleset requiring PR reviews. Latest squash-merge on `main` is `cdc807d` (2026-07-03). There are no open PRs or stale branches. DOI/archive, independent security review, and human-subjects readiness remain open.

## Licensing

- [x] LICENSE contains full Apache License 2.0 text
- [x] NOTICE is present
- [x] README includes license section
- [x] package metadata uses Apache-2.0
- [ ] source files have appropriate SPDX headers
- [ ] third-party notices reviewed
- [ ] dependency licenses reviewed
- [x] license rationale documented

## Copyright

- [x] Copyright owner confirmed
- [x] Contributor terms documented
- [ ] Third-party code excluded or clearly identified
- [ ] Generated files excluded from copyright headers
- [ ] Unclear-authorship files reviewed

## Governance

- [x] Ethical Governance Charter included or linked
- [x] AI Governance & Human-in-the-Loop Contract included or linked
- [x] Human-subjects limits stated clearly
- [x] Open-source code does not imply open study data
- [x] Delphi consensus is not represented as truth
- [x] AI is not represented as a decision-maker or consensus optimizer

## Security and Privacy

- [x] SECURITY.md exists
- [x] Responsible disclosure path documented without exposing a private contact
- [x] No tracked secrets found in final GitHub cleanup filename/path scans
- [x] No tracked real participant data found in final GitHub cleanup filename/path scans
- [x] No tracked identity mappings found in final GitHub cleanup filename/path scans
- [x] No tracked real consent records found in final GitHub cleanup filename/path scans
- [x] No tracked sensitive exports found in final GitHub cleanup filename/path scans
- [x] No local filesystem paths or private synced-folder paths found in tracked file scan
- [x] Environment files checked
- [x] Example environment file uses placeholders only
- [x] Lightweight Git history risk check reviewed for migration planning
- [x] Clean-history import into a new private GitHub repository completed
- [ ] Independent security/ASVS review completed

## GitHub Readiness

- [x] Repository builds locally in final pre-migration gate
- [x] Tests pass locally in final pre-migration gate
- [x] Private GitHub clean-environment install/build/test check passed
- [ ] Current app/server high-severity security audits completed in the GitHub-connected checkout with 0 vulnerabilities (OPEN: app audit reports 5 vulnerabilities including 1 high Vite advisory as of 2026-07-03)
- [x] README has setup instructions
- [x] CONTRIBUTING.md exists
- [x] GOVERNANCE.md exists
- [x] CITATION.cff exists
- [x] DCO.md exists if contributor certification will be used
- [x] Issue templates added
- [x] Pull request template added
- [x] Stale remote `codex/*` branches removed after merge/supersession/closed-PR review
- [x] Open PR queue checked empty at latest snapshot
- [ ] Code owners planned
- [x] Initial release version selected (v0.1.0)
- [x] CITATION.cff GitHub URL updated after the public repository URL is known

## DOI Readiness

- [x] Tagged release version created on GitHub (v0.1.0, 2026-07-03)
- [x] Zenodo or equivalent archive connected
- [x] DOI minted only after release (10.5281/zenodo.21178251)
- [x] DOI added to README after creation
- [x] DOI added to CITATION.cff after creation

## Phase 10 Evidence

- [x] Phase 10 documentation package prepared
- [x] Phase 10 synthetic/dev/staging rehearsal partially completed for the tested environment
- [ ] Incident response drill completed
- [x] Private GitHub clean-history clone/build/test evidence recorded
- [ ] Human-observed full browser dry run completed
- [ ] Production-like backup/restore rehearsal completed
- [ ] Human accessibility conformance review completed

## GitHub Migration Readiness

- [x] Final gate decision recorded after cleanup commit
- [x] No tracked runtime/sensitive files found
- [x] Full-history migration risk addressed by selected clean-history import strategy
- [x] Build/test checks passing or explicitly deferred with acceptable rationale
- [x] Remaining production/human-subjects/IRB/security/accessibility limitations remain visible

Completed migration strategy: the sanitized tree was imported into a private clean-history GitHub repository. Do not push the older local historical Git repository to GitHub unless maintainers later approve a separate private archival plan.
