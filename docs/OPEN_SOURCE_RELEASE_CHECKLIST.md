# Open Source Release Checklist

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

This checklist supports GitHub migration/open-source preparation. It does not certify production readiness, human-subjects readiness, IRB readiness, legal compliance, completed accessibility conformance, completed security review, or security certification.

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
- [x] Clean-history import into a new private GitHub repository selected before public GitHub migration
- [ ] Independent security/ASVS review completed

## GitHub Readiness

- [x] Repository builds locally in final pre-migration gate
- [x] Tests pass locally in final pre-migration gate
- [x] README has setup instructions
- [x] CONTRIBUTING.md exists
- [x] GOVERNANCE.md exists
- [x] CITATION.cff exists
- [x] DCO.md exists if contributor certification will be used
- [x] Issue templates added
- [x] Pull request template added
- [ ] Code owners planned
- [ ] Initial release version selected
- [ ] CITATION.cff GitHub URL updated after the public repository URL is known

## DOI Readiness

- [ ] Public release created on GitHub
- [ ] Zenodo or equivalent archive connected
- [ ] DOI minted only after release
- [ ] DOI added to README after creation
- [ ] DOI added to CITATION.cff after creation

## Phase 10 Evidence

- [x] Phase 10 documentation package prepared
- [x] Phase 10 synthetic/dev/staging rehearsal partially completed for the tested environment
- [ ] Incident response drill completed
- [ ] True fresh-clone deployment rehearsal completed
- [ ] Full manual browser dry run completed
- [ ] Production backup/restore rehearsal completed
- [ ] Human accessibility conformance review completed

## GitHub Migration Readiness

- [x] Final gate decision recorded after cleanup commit
- [x] No tracked runtime/sensitive files found
- [x] Full-history migration risk addressed by selected clean-history import strategy
- [x] Build/test checks passing or explicitly deferred with acceptable rationale
- [ ] Remaining production/human-subjects/IRB/security/accessibility limitations remain visible

Selected migration strategy: create a new private GitHub repository from the sanitized current tree as a clean first commit. Do not push the existing local Git history to GitHub unless maintainers later approve a separate private archival plan.
