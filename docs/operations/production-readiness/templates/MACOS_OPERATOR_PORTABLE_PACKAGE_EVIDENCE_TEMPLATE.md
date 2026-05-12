# macOS Portable/Internal Package Evidence Template (Future Execution)

> Status: **macOS evidence remains NOT RUN until completed**
>
> Phase: **Phase 2 remains IN PROGRESS**
>
> Readiness: **Product remains NOT READY FOR HUMAN TESTING**

## Usage notes
- This is a documentation template for a future macOS tester.
- Complete all fields with concrete evidence once testing is executed.
- Do **not** infer successful outcomes without captured command output.

## Evidence metadata
- Tester:
- Date/time (UTC):
- Mac model:
- macOS version:
- CPU architecture (Intel or Apple Silicon):
- Branch:
- Commit hash:

## Package details
- Package archive path:
- Extracted package path:
- Manifest summary:
- README exists (path + brief confirmation):
- Launcher exists (path + executable check):
- Static UI server exists (path + brief confirmation):
- Dependency posture (lockfiles/vendor state/warnings):

## Pre-run package-root exclusion checks
> Confirm the extracted package root does **not** contain excluded material.

- `.git` absent:
- `.env` absent:
- Secrets/provider credentials absent:
- Runtime data absent:
- Logs absent:
- Exports absent:
- Backups absent:
- Evidence artifacts absent:
- Package-root `node_modules` absent:
- Commands used + output excerpts:
- Notes:

## Lifecycle results (capture command + output)
> Record every command and its output exactly as run.

1. `status`
   - Command:
   - Output:
2. `start`
   - Command:
   - Output:
3. `status` (post-start)
   - Command:
   - Output:
4. `backend health`
   - Command:
   - Output:
5. `UI HEAD`
   - Command:
   - Output:
6. `smoke`
   - Command:
   - Output:
7. `backup`
   - Command:
   - Output:
8. `reset while running`
   - Command:
   - Output:
9. `restart`
   - Command:
   - Output:
10. `status` (post-restart)
    - Command:
    - Output:
11. `backend health` (post-restart)
    - Command:
    - Output:
12. `UI HEAD` (post-restart)
    - Command:
    - Output:
13. `stop`
    - Command:
    - Output:
14. `reset after stop`
    - Command:
    - Output:
15. `final status`
    - Command:
    - Output:

## Post-run package-root cleanliness
- Package-root cleanliness check command(s):
- Unexpected files detected:
- Unexpected permission/ownership drift:
- Cleanup performed (if any):

## Runtime path evidence
- Required runtime path:
  - `~/Library/Application Support/DelphiCommons/macos-operator-portable-candidate`
- Runtime directories observed:
- Runtime files observed:
- Runtime logs/artifacts captured:

## Gatekeeper/quarantine observations (if encountered)
- Prompt/error observed:
- Related file/path:
- Execution impact:
- Approved remediation used (if any):

## npm warnings (if observed)
- Command context:
- Warning text:
- Impact assessment:

## Limitations
- 

## Remaining blockers
- 

## Explicit non-claims
- No claim of executed macOS evidence unless this template is fully completed with command outputs.
- No claim of macOS support/compliance.
- No claim that Phase 2 is complete.
- No claim that the product is ready for human testing.
- No production readiness claim.
- No security/legal/regulatory certification claim.
