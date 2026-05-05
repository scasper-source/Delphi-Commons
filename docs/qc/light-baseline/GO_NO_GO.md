# GO / NO-GO Decision

Decision: GO WITH CONDITIONS

This decision applies only to controlled mock-participant MVP testing with synthetic or low-risk data. It is not approval for real human-subjects launch, production deployment, IRB study launch, or use with sensitive participant data.

## Rationale

The app and server start locally, migrations are applied, tests/builds pass, dependency security audit reports 0 high vulnerabilities, audit/data-integrity endpoints report healthy status, and the backend road-test completes a synthetic Delphi lifecycle from study creation through final report/export/audit checks.

No P0 or P1 mock-trial blocker was found in this light baseline.

## Conditions For Mock Trial

- Use synthetic or low-risk mock participant data only.
- Do not use real participant identifiers, real consent records, real institutional records, or sensitive study exports.
- Keep Codex/developer support available during the mock trial for broken button/textbox reports.
- Treat the Participant Issue Notes inbox as a live triage channel during the mock trial.
- Do not migrate or publish local `server/data/` runtime artifacts.
- Do not represent this as production-ready or real human-subjects-ready.
- Document all participant-facing friction, broken controls, confusing text, and support-note loops as defects.
- Before any real study, replace participant-ID query URLs with session-bound or opaque-token participant context.

## Must Fix Before Real Human-Subjects Use

- Remove participant identifiers from URL/query-string routes and browser-visible request paths.
- Clean/review all local runtime database artifacts before repository migration.
- Complete a full multi-participant browser trial, including mobile viewports.
- Verify backup/restore, retention, deletion request handling, incident response, accessibility, and security review in a production-like environment.
- Replace development-header/demo auth assumptions with production authentication and authorization.

## Final Statement

GO WITH CONDITIONS means the platform may be used for a controlled mock trial only. It does not mean the platform is approved for real participants, production deployment, or human-subjects research operations.

