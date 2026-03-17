Ticket 1b: React app scaffold (Vite)

Ticket 2: RBAC scaffolding + append-only audit log + admin/audit-test route

Ticket 3: Study + StudyVersion + dual signoff activation gate (Owner + MethodsSteward), with audit events

Ticket 4: Consensus rule required + locked on Round 1 open (audited)

Ticket 5: Identity store + Response store separation (ParticipantMaster vs Responses; RBAC-gated master list + audited; responses contain participant_id only)

Ticket 6: Consent versioning + consent capture + withdrawal (active consent required for response submission; withdrawal blocks future submissions; consent actions audited)

Ticket 7: Round 1 open-ended collection (submission tied to open Round 1 StudyVersion; owner-only response summary; reminder logging audited)

Ticket 8: Manual Curation Desk (manual draft item creation/list/publish; merge and split require rationale; curation actions audited)

Ticket 9: Round 2 rating + neutral feedback (participants can rate published Round 2 items; neutral feedback shows median, dispersion, distribution, and prior response; "keep" and "revise" supported)

Ticket 10: Export report (reproducible) incl. non-consensus (staff-only export-report endpoint added; report includes StudyVersion, config_hash, dataset_hash, methods, limitations, published Round 2 item summaries, and consensus classification; export action audited)

Ticket 11: Study design declaration (study_format, planned_round_count, terminal_round_number, method_rationale, and consensus_rule_json required before submit-for-signoff/open Round 1; design settings locked outside Draft; design-setting actions audited; design fields included in export/report output)

Ticket 12: Generalize the round model beyond Round 2 (generic later-round item listing, rating, feedback, and round summary endpoints added; rating rounds are gated by declared study design; Modified Delphi allows through Round 3 and blocks Round 4; round-aware summary generation added for later rating rounds)

Ticket 13: Round-aware post-round reporting (Round 3 support completed via generic later-round infrastructure from Ticket 12; added staff-only GET /studies/:studyId/versions/:versionId/rounds/:roundNumber/report; report computes interim vs final from terminal_round_number, includes methods/config snapshot, limitations, consensus caution, round summaries, item-level summaries, and audit event round.report_get)

Next up:

Ticket 14: Round 4 support for Classic Delphi


