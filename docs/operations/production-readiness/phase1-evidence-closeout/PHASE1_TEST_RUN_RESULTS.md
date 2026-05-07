# Phase 1 Test Run Results

- Date/time (UTC): 2026-05-07T20:18:45Z
- Commit under test: `487c18b`
- Branch: `codex/phase1-evidence-closeout`
- Environment: local Codex container

## Commands and results

1. **Server build**
   - Command: `npm run build` (in `server/`)
   - Result: **PASS**

2. **Server tests (full)**
   - Command: `npm test` (in `server/`)
   - Result: **PASS**

3. **Targeted auth/session hardening test**
   - Command: `node ../scripts/run-tests.mjs "tests/authPhase1Hardening.test.mjs"` (in `server/`)
   - Result: **PASS**

4. **Targeted deletion/Data Custodian workflow test**
   - Command: `node ../scripts/run-tests.mjs "tests/deletionRequestCustodianWorkflow.test.mjs"` (in `server/`)
   - Result: **PASS**

5. **Security audit script (if present)**
   - Command: `npm run security:audit` (in `server/`)
   - Result: **FAIL (environment/network limitation)**
   - Details: `npm audit` returned `403 Forbidden` from npm advisory API endpoint.

## Notes

- `npm` emitted non-fatal warnings: `Unknown env config "http-proxy"`.
- Security audit evidence is incomplete due to external registry access denial in this run.
