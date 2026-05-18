# GitHub Cleanup Handoff

Boundary statement: Delphi Commons is suitable only for controlled mock-trial use with synthetic or low-risk test data in local, development, or staging environments. It is not approved or ready for production deployment or real human-subjects research.

Status: CLEAN-HISTORY PRIVATE IMPORT COMPLETE; GITHUB HOUSEKEEPING CURRENT AS OF 2026-05-18.

The selected clean-history migration strategy has been executed for the private GitHub repository `scasper-source/Delphi-Commons`. This handoff now records the current GitHub state, the post-cleanup verification, and the remaining non-production limitations.

## Current GitHub State

| Item | Status |
| --- | --- |
| Private clean-history repository | COMPLETE |
| Default branch | `main` |
| Verified application-code snapshot before documentation refresh | `61f9506 Remove SMS setup browser storage` |
| Open pull requests | NONE at this snapshot |
| Remote branches | `main` only at this snapshot |
| Stale `codex/*` branches | REMOVED after review of merged, superseded, and closed-PR branches |
| Public release | NOT CREATED |
| DOI/archive release | NOT CREATED |

## Post-Cleanup Validation

The following repository-verifiable checks passed after the final cleanup merge:

- `npm --prefix app test`
- `npm --prefix app run lint`
- `npm --prefix app run build`
- `npm --prefix app run security:audit`
- `npm --prefix server test`
- `npm --prefix server run security:audit`
- `git diff --check`

The final cleanup PR removed SMS setup browser-storage persistence so the frontend policy gate no longer detects `localStorage` or `sessionStorage` use in `app/src`.

## Remaining GitHub/Open-Source Work

- Add `CODEOWNERS` if maintainers want required review routing.
- Select an initial public release version.
- Decide whether and when to make the repository public.
- Update `CITATION.cff` after the final public repository URL and archive/DOI are known.
- Create a public release only after the release boundary and non-claims are re-reviewed.
- Keep GitHub Security Advisories/private reporting enabled before broad visibility.

## Historical Repository Boundary

The older local development repository and its full Git history should not be pushed to GitHub unless maintainers approve a separate private archival plan. The private GitHub repository should remain the clean-history source of truth for collaborative work.

Do not copy local runtime directories, backups, audit logs, databases, private exports, ignored artifacts, or old `.git` history into the clean-history repository.

## Local Runtime Data Reminder

Before any future release or visibility change:

1. Confirm `server/data/`, `server/audit/`, and `server/backups/` contain no real or sensitive data.
2. Confirm runtime artifacts remain untracked.
3. Remove or archive local runtime artifacts outside the repository if needed.
4. Re-run `git status --short`.

Open-source code does not mean open study data.
