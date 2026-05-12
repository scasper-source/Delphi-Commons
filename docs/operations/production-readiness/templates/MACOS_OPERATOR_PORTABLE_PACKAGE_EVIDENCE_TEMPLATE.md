# macOS Portable/Internal Operator Package Evidence Template (Future Execution)

> Status: **macOS evidence NOT RUN until performed**
>
> Phase: **Phase 2 IN PROGRESS**
>
> Readiness: **NOT READY FOR HUMAN TESTING**

## Evidence metadata
- Tester name/initials:
- Date/time (UTC):
- Mac model:
- macOS version:
- CPU architecture (Intel or Apple Silicon):
- Branch:
- Commit hash:

## Package artifact details
- Package artifact path:
- Extracted package path:
- Manifest summary:
- README check (present + reviewed):

## Required script checks
- Required scripts discovered:
- Script executability check results:
- Script invocation help/usage checks:
- Notes:

## Pre-run package-root exclusion checks
- Package-root exclusion checks run:
- Evidence/results:
- Notes:

## Lifecycle command evidence (capture command + output)
> Record each command and output exactly as run.

1. `status`
   - Command:
   - Output:
2. `start`
   - Command:
   - Output:
3. `status` (post-start)
   - Command:
   - Output:
4. `health`
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
11. `health` (post-restart)
    - Command:
    - Output:
12. `UI HEAD` (post-restart)
    - Command:
    - Output:
13. `stop`
    - Command:
    - Output:
14. `reset`
    - Command:
    - Output:
15. `final status`
    - Command:
    - Output:

## Runtime root evidence
- Required runtime root:
  - `~/Library/Application Support/DelphiCommons/macos-operator-portable-candidate`
- Runtime directories/files observed:
- Runtime logs captured:
- Runtime artifacts captured:

## Package-root cleanliness after lifecycle
- Post-lifecycle package-root listing/check:
- Unexpected file/permission drift:
- Cleanup required:

## Gatekeeper/quarantine observations
- Any Gatekeeper/quarantine prompts/errors encountered:
- Observable impact on execution:
- Approved remediation path used (if any):
- **Do not add bypass instructions unless already approved in project policy.**

## Limitations
- 

## Remaining blockers
- 

## Explicit non-claims
- No claim of macOS support.
- No claim that macOS evidence has been executed.
- No production readiness claim.
- No human-subjects readiness claim.
- No security/legal/regulatory certification claim.
