# GitHub Cleanup Handoff

Boundary statement: “Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.”

Status: READY FOR CLEAN-HISTORY PRIVATE IMPORT. This handoff records the selected GitHub migration strategy and remaining non-production limitations.

Selected migration strategy: create a new private GitHub repository from the sanitized current tree as a clean first commit. Do not push the existing local Git history to GitHub unless maintainers later approve a separate private archival plan.

## Revisit Before GitHub Migration

- `README.md`: readiness language, install commands, and no-production/no-human-subjects limits reviewed during final cleanup.
- `LICENSE`: Apache-2.0 text present.
- `NOTICE`: attribution present.
- `SECURITY.md`: updated with GitHub private vulnerability reporting guidance and no public exploit details.
- `CONTRIBUTING.md`: updated to reject real participant data, secrets, runtime databases, private logs, and backup/archive artifacts.
- `GOVERNANCE.md`: updated to distinguish open-source code from private study data and to prevent consensus-as-truth framing.
- `CODE_OF_CONDUCT.md`: NOT FOUND; decide whether to add.
- Issue templates: added security/privacy-safe bug and documentation templates.
- Pull request template: added checks for tests, docs, privacy, AI governance, and no real data.
- Release checklist: existing [Open Source Release Checklist](../../OPEN_SOURCE_RELEASE_CHECKLIST.md) updated after Phase 10 rehearsal and final cleanup evidence.
- `.env.example`: added with local/dev placeholders only.
- GitHub Security Advisories: configure privately before broad open-source visibility.
- Screenshots: add only synthetic/local screenshots with no private paths or real data.
- Release tag readiness: do not tag a production or human-subjects-ready release without separate evidence.

## Clean-History Import Procedure

Use this approach for the new private GitHub repository:

1. Confirm the local working tree is clean.
2. Create the new GitHub repository as private.
3. Export the sanitized current tree from the final cleanup commit.
4. Initialize a fresh local Git repository from that exported tree.
5. Make one initial commit, such as `Initial clean import of Delphi Commons`.
6. Add the private GitHub repository as `origin`.
7. Push only the clean-import repository.
8. Run the documented build/test checks from the new clone.

Do not copy `.git`, local runtime directories, backups, audit logs, databases, private exports, or ignored artifacts into the clean-import repository.

## Local Runtime Data Cleanup

Before repository migration:

1. Confirm `server/data/`, `server/audit/`, and `server/backups/` contain no real or sensitive data.
2. Confirm they are not tracked by git.
3. Remove or archive local runtime artifacts outside the public repo if needed.
4. Re-run `git status --short`.

Open-source code does not mean open study data.
