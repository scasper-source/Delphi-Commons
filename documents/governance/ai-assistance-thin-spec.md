AI Assistance Thin Spec
Document name: AI Governance & Human in the Loop Contract (Thin Spec)
Version: 0.1
Status: Normative requirements (“MUST/SHALL”) + implementation guidance (“SHOULD/MAY”)
Applies to: All AI-assisted features in the Delphi Commons platform (study design, round operations, analysis, reporting, participant experience).
Authority: This spec is subordinate to (and must be interpreted through) the Ethical Governance Charter for Delphi Commons; where this spec is silent, the Charter governs.
Ethical Governance Charter for …
________________________________________
1. Purpose
The purpose of AI Assistance is to reduce administrative burden and accelerate Delphi rounds while preserving methodological integrity, participant safety, and epistemic humility.
AI is a drafting + organizing assistant. It must never function as:
•	a decision-maker,
•	a persuasion engine,
•	a “consensus optimizer,” or
•	a substitute for human ethical judgment.
________________________________________
2. Core Principle
2.1 Proposal–Decision Separation
•	AI MAY propose: drafts, groupings, summaries, wording options, report text, checklist completions, reminders.
•	Humans MUST decide: what is included, what is shown to panelists, what becomes part of the instrument, what is exported, and what constitutes final reporting.
This applies to both:
•	Study Designers (Study Owner / Methods Steward decisions), and
•	Panelists (participants decide their own responses and whether to use any AI helper tools).
________________________________________
3. Human in the Loop Requirements
3.1 Study Designer Human-in-the-Loop
The platform MUST enforce these gates:
1.	AI suggestions are always non-binding.
o	AI output must be labeled “AI Suggestion (Not Final)”.
2.	Explicit acceptance required to publish.
o	Nothing AI-generated may reach panelists unless a human performs an explicit action: Accept / Edit / Reject.
3.	Two-person release gate for participant-facing content (recommended default).
o	Any of the following MUST require explicit signoff by Study Owner AND Ethics & Methods Steward before it is shown to panelists:
	Round 2+ item set (statements/questions)
	changes to item wording
	feedback format configuration
	consent / participant information materials
	IRB pack export
o	Deployments MAY allow a single-person gate only if explicitly configured and disclosed as a governance choice, but the default SHOULD be dual signoff.
4.	No silent transformation.
o	If AI clusters, merges, rewords, or summarizes participant-generated content, the tool MUST expose the transformation for human review and preserve traceability (see §7).
3.2 Panelist Human-in-the-Loop
AI assistance for panelists MUST be optional, non-coercive, and non-directive:
1.	Opt-in (or study-level enablement) + per-use consent.
o	If panelist AI tools are enabled, panelists MUST be able to use them or not without penalty, loss of access, or degraded participation.
2.	AI must not tell panelists what to answer.
o	Panelist-facing AI MUST NOT recommend “correct” ratings, advocate alignment, or frame deviation as error.
3.	Panelists retain full authorship and responsibility.
o	Panelist submissions MUST be authored/confirmed by the panelist.
o	If AI offers drafting help (e.g., clarifying a rationale), panelists MUST confirm final text before submission.
4.	Panelists can submit without AI at any time.
o	No workflow step may require AI use to proceed.
________________________________________
4. Allowed AI Capabilities
4.1 Study Design Assistant
AI MAY:
•	propose a round structure (2–3 rounds default) and timeline drafts,
•	explain pros/cons of design options in balanced terms,
•	draft neutral study descriptions based on designer inputs,
•	draft the IRB pack narrative from structured fields (purpose, panel criteria, procedures, risks, confidentiality, withdrawal, retention),
•	generate checklists and highlight missing fields.
Constraint: Explanations must be informational, not persuasive. It can surface tradeoffs, not “best choices.”
4.2 Round 1 → Round 2 Acceleration
AI MAY:
•	cluster Round 1 responses into themes,
•	propose candidate statements/items,
•	flag duplicates or near-duplicates,
•	suggest neutral wording alternatives,
•	propose a “merge/split” plan.
Hard requirement: Humans finalize the item set and wording, and unique/minority statements must not be automatically erased via clustering.
4.3 Neutrality Linting
AI MAY function as a “method integrity linter” that flags:
•	leading language (“should,” “must,” “obviously”),
•	double-barreled items,
•	stigmatizing or coercive terms,
•	ambiguity, unclear definitions, inconsistent scales.
Constraint: The linter may propose alternatives, but the Study Designer chooses.
4.4 Controlled Feedback Narratives (Optional)
AI MAY draft neutral statistical narratives (e.g., median/IQR changes) only from approved templates.
Constraint: Narratives must not instruct panelists to move toward the group or portray consensus as truth.
4.5 Operational Assistance
AI MAY:
•	draft reminder messages (for human approval),
•	suggest reminder schedules based on response rates (not identity-based pressure),
•	draft administrative summaries for study staff.
________________________________________
5. Forbidden AI Capabilities
AI MUST NOT:
1.	Drive convergence
•	generate persuasive prompts like “align with the group,”
•	nudge panelists toward consensus,
•	rank panelists by conformity,
•	label people “outliers,” “deviant,” or similar.
2.	Alter governance or lock rules midstream
•	change consensus thresholds,
•	recommend changing thresholds after seeing interim results,
•	modify feedback formats mid-round without versioning and re-consent where applicable.
3.	Auto-drop dissent
•	eliminate items solely because they are minority views,
•	compress distinct statements into one without human signoff and traceability.
4.	Create deceptive anonymity
•	imply full anonymity when round linkage exists,
•	reveal or infer identities,
•	use identity data to personalize feedback beyond legitimate operational contact.
5.	Perform undisclosed secondary use
•	train models on study data,
•	reuse data for other studies,
•	create public datasets without explicit, study-specific consent and governance review.
________________________________________
6. AI Modes and Data Boundaries
6.1 Default Mode: Privacy-Preserving Inference
The platform SHOULD default to AI processing that keeps data inside the deployment boundary (self-hosted or tenant-isolated cloud).
6.2 External AI Connectors (If Enabled)
If a deployment enables external AI services, the platform MUST:
•	require explicit administrator configuration,
•	require study-level disclosure for participant materials,
•	support disabling external processing per study and per feature,
•	document the data sent (fields, transformations/redactions),
•	support a “no external AI” compliance mode.
6.3 Data Minimization
AI input MUST be minimized:
•	do not include direct identifiers,
•	do not include identity↔response mapping,
•	prefer anonymized response text + item IDs + aggregate statistics.
________________________________________
7. Traceability, Provenance, and Auditability
7.1 Provenance Links for Item Generation
When AI proposes Round 2 items from Round 1 responses, the interface MUST display:
•	which anonymized responses contributed to each candidate item,
•	the transformation history (cluster → draft statement → human edits),
•	whether the item is panel-derived vs literature-derived (if relevant).
7.2 Immutable Audit Log Entries
For every AI-assisted operation that affects study content, the audit log MUST include:
•	feature invoked (e.g., “Cluster R1,” “Draft R2 items,” “Neutrality lint”),
•	timestamp,
•	user role and user ID who invoked it,
•	model identifier/version (or local model build hash),
•	prompt/template version (not necessarily the full prompt text shown to panelists),
•	input scope identifiers (e.g., which round/item IDs),
•	AI output hash + stored output,
•	human action: Accept / Edit / Reject,
•	final resulting content version IDs.
________________________________________
8. UI/UX Rules for Safe Human-in-the-Loop
8.1 “Curation Desk” Pattern (Study Designer)
The platform SHOULD present a three-part workflow:
•	raw anonymized responses,
•	AI clustering/themes,
•	candidate statements with Accept/Edit/Reject + provenance links.
8.2 Panelist AI Tools Must Be Non-Directive
If panelist AI tools exist, they SHOULD be limited to:
•	clarifying the meaning of a question (without recommending answers),
•	checking a drafted rationale for clarity/tone,
•	summarizing the panelist’s own prior response,
•	translation/accessibility aids.
________________________________________
9. Compliance Tests
The platform MUST include automated checks that verify:
•	AI suggestions cannot be published without human acceptance,
•	participant-facing AI content requires required signoffs (where configured),
•	non-consensus items remain reportable regardless of AI,
•	audit logs are created for AI-assisted changes,
•	external AI connectors cannot be used without explicit enablement and disclosure configuration.
________________________________________
10. Non-Negotiable Summary
AI Assistance exists to speed work, not steer outcomes.
•	Study Designers remain accountable for the study instrument and reporting.
•	Panelists remain sovereign over their responses and may use AI help only if it is optional and non-directive.
•	The system must preserve neutrality, dissent, truthfulness, auditability, and consent as inviolable constraints.
