# Phase 1 Test Run Results

- Date/time (UTC): 2026-05-13T19:13:32Z
- Commit under test: `127443e`
- Branch: `work`
- Environment: local Codex container

## Commands and results

1. **Server build**
   - Command: `npm --prefix server run build`
   - Result: **PASS**

2. **Targeted backup/restore rehearsal test**
   - Command: `npm --prefix server run test:backup-restore-rehearsal`
   - Result: **PASS**

3. **Targeted incident workflow test**
   - Command: `npm --prefix server run test:incident-workflow`
   - Result: **PASS**

4. **Deployment security verification script (local profile)**
   - Command: `npm --prefix server run security:verify:deployment`
   - Result: **FAIL (expected for unconfigured local environment)**
   - Details: script reported missing required deployment configuration (`NODE_ENV`, `EDELPHI_ALLOWED_ORIGINS`, `EDELPHI_AI_KEY_ENCRYPTION_SECRET`, `EDELPHI_AUTH_REQUIRE_SESSION`).
   - Interpretation: useful negative evidence only; this run does not satisfy named deployment security evidence.

5. **NPM high-severity audit**
   - Command: `npm --prefix server run security:audit`
   - Result: **FAIL (external registry access limitation)**
   - Details: `npm audit` returned `403 Forbidden` from `https://registry.npmjs.org/-/npm/v1/security/advisories/bulk`.

## Notes

- `npm` emitted non-fatal warnings: `Unknown env config "http-proxy"`.
- No production-readiness, pilot-readiness, or human-subjects-readiness claim is made from this evidence.
