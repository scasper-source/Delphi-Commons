July MVP: what “done” means



By July you need a system where you can:



Create a study, with roles assigned and auditable governance controls.



Require the study designer, before Round 1 begins, to declare:



whether the study is Modified Delphi or Classic Delphi



the planned number of rounds



the rationale for choosing that method



the consensus threshold and rule to be used across later rounds



Generate participant information and consent materials with truthful anonymity language.



Invite panelists using unique participant IDs.



Run Round 1 open-ended.



Use human curation to review and refine candidate Round 2 statements.



Run Round 2 rating with neutral feedback.



Run later rating rounds according to the study design chosen at the beginning:



Round 3 for Modified Delphi



Round 3 and Round 4 for Classic Delphi



Produce interim reports between later rounds.



Export a final reproducible report that includes:



consensus and non-consensus items



“consensus ≠ correctness” language



full method and configuration details



interim/final round context



hashes for reproducibility



audit trail support



That is the revised MVP.



The platform should accelerate Delphi work, but it must not silently choose the method. The human study designer must decide whether the study is modified or classic, and the software must record and enforce that choice.



The build order (do not deviate)

Milestone 0 — Repo skeleton + build/run



Goal: you can run the app locally in dev mode.



Milestone 1 — Rails foundation (must come before AI)



Goal: the platform is incapable of unethical shortcuts.



This milestone establishes:



roles and permissions



StudyVersion + configuration locking



identity vs responses separation



append-only audit log



consent versioning + withdrawal



method declaration and rationale as locked design choices



Milestone 2 — Delphi without AI



Goal: you can run a real Delphi end-to-end manually, under human control.



This milestone establishes:



Round 1 collection



manual curation desk



Round 2 rating + neutral feedback



later rating rounds



interim reports



final reproducible report with non-consensus



Milestone 3 — AI safely



Goal: AI accelerates inter-round work, but humans remain in control.



This milestone establishes:



AISuggestion store + AI audit events



provenance-linked clustering and candidate statement drafting



accept/edit/reject gating enforced server-side



required human signoff for participant-facing publishing



optional AI support for neutrality checking and IRB draft materials



Recommended architecture for July (keep it simple)



Choose: Web app



Reason: easiest for panelists and a conference pilot. Desktop introduces unnecessary distribution friction.



Minimal stack (suggested)



Backend: one service (REST) + DB



DB: Postgres or SQLite

(Postgres preferred, SQLite acceptable for pilot)



AI: local model or local-network inference for July

(avoid external connector complexity during MVP)



Frontend: basic web UI

(it does not need to be pretty)



If you already have a preferred stack, this plan can align with almost any modern web backend.



Data model (the spine)



You need these entities, minimum.



Study



id



title



description



created\_by



created\_at



StudyVersion



id



study\_id



version\_number



status: Draft | ReadyForSignoff | Active | Paused | Closed



Locked design configuration



study\_format: ModifiedDelphi | ClassicDelphi



planned\_round\_count



terminal\_round\_number



method\_rationale



consensus\_rule\_json



feedback\_config\_json



retention\_policy\_json



Reproducibility / lifecycle



config\_hash



opened\_round1\_at



created\_by



created\_at



Notes:



The study designer must set study format, planned rounds, rationale, and consensus rule before Round 1 opens.



These values are locked once Round 1 opens or once the version leaves Draft, consistent with the governance model.



Roles / Assignments



user\_id



study\_id



role

(Owner, MethodsSteward, PrivacyLead, DataCustodian, Maintainer)



created\_at



ParticipantMaster (identity store)



participant\_id



study\_id



email / name (optional)



invite\_status



created\_at



ResponseStore (separate schema or separate DB)



response\_id



study\_version\_id



participant\_id



round\_number



payload\_json



submitted\_at



Notes:



This store contains linkage only, not identity fields.



Payload may represent Round 1 open text or later rating-round responses.



ConsentVersion



consent\_version\_id



study\_version\_id



text\_md



created\_at



is\_active



ConsentRecord



participant\_id



consent\_version\_id



consented\_at



withdrew\_at (nullable)



Round



round\_id



study\_version\_id



round\_number



type: OpenEnded | Rating



opens\_at



closes\_at



status



Notes:



The system must support at least:



Round 1 open-ended



Round 2 rating



Round 3 rating



Round 4 rating when Classic Delphi is selected



Item



item\_id



study\_version\_id



round\_number (where used)



text



provenance\_type: PanelDerived | LiteratureDerived



created\_from: manual | ai



status: Draft | Published



Notes:



Items may be carried forward into later rounds.



Publishing remains explicit and auditable.



MergeAction



merge\_id



study\_version\_id



from\_item\_ids



to\_item\_id



rationale



actor\_user\_id



created\_at



AISuggestion



suggestion\_id



study\_version\_id



feature

(cluster\_r1, draft\_items, inter\_round\_synthesis, lint\_wording, irb\_pack)



model\_id/version



prompt\_template\_version



input\_scope\_ids (hash or list)



output\_json



output\_hash



created\_by



created\_at



decision: Accepted | Edited | Rejected | None



decided\_by



decided\_at



resulting\_object\_ids



AuditEvent (append-only)



event\_id



timestamp



actor\_user\_id + role



study\_id + study\_version\_id



event\_type



object\_type/object\_id



details\_json



This structure supports:



identity separation



locking



auditability



provenance



reproducibility



human-in-the-loop AI gating



explicit method declaration



Tickets for the revised MVP

Ticket 1 — Repo skeleton + run script (Milestone 0)

Acceptance



README explains how to run locally



App starts with one command



Health check endpoint returns OK



Ticket 2 — Roles + RBAC scaffolding (Milestone 1)

Acceptance



Roles exist: Owner, MethodsSteward, PrivacyLead, DataCustodian



API blocks privileged actions by non-privileged roles



AuditEvent logs role-protected accesses



Ticket 3 — Study + StudyVersion + signoff gate

Acceptance



Can create Study + Draft StudyVersion



Cannot activate study unless Owner + MethodsSteward sign off



AuditEvent created for signoff + activation



Ticket 4 — Consensus rule required + locked on Round 1 open

Acceptance



Cannot open Round 1 unless consensus rule set



After Round 1 opens, edits to consensus rule are rejected or force creation of new StudyVersion



Tested



Ticket 5 — Identity store + Response store separation

Acceptance



ParticipantMaster data is not accessible from response endpoints



Response records contain participant\_id but no identity fields



Access to master list is role-gated + audited



Ticket 6 — Consent versioning + consent capture + withdrawal

Acceptance



ConsentVersion created + marked active



Participant cannot submit responses without consent record



Withdrawal blocks future submissions and is logged



Ticket 7 — Round 1 open-ended collection

Acceptance



Participants can submit open-ended responses during the Round 1 window



Response rates available to Owner, not to panelists



Reminder action logged (manual content acceptable for MVP)



Ticket 8 — Manual Curation Desk (no AI yet)

Acceptance



Owner/Steward can create candidate Items for Round 2



Merge/split requires rationale



All edits logged



Nothing becomes Published without explicit action



Ticket 9 — Round 2 rating + neutral feedback

Acceptance



Participants rate items



Feedback shows median + dispersion + distribution + your prior response



Keep my response and Revise are equal primary actions



Ticket 10 — Export/report framework (reproducible) incl. non-consensus

Acceptance



Export endpoint exists and is reproducible



Export includes:



consensus and non-consensus support



distributions



consensus definition



methods text



limitations text



Includes StudyVersion + config hash + dataset hash



Export action audited



Notes



This ticket creates the report/output framework. It is not yet the full final-round-aware reporting layer for modified and classic study paths.



Ticket 11 — Study design declaration: modified vs classic, planned rounds, rationale

Acceptance



Study designer must set before Round 1:



study\_format



planned\_round\_count



terminal\_round\_number



method\_rationale



consensus\_rule\_json



Modified Delphi requires a rationale explaining why modified was chosen over classic



These settings are locked when Round 1 opens or the version leaves Draft



These settings appear in export/report output



Design-setting actions are audited



Notes



This ticket is essential for human-in-the-loop governance. The software speeds the work; it does not silently choose the method.



Ticket 12 — Generalize the round model beyond Round 2

Acceptance



The backend no longer assumes the study ends at Round 2



Later rating rounds are represented explicitly and compatibly with the chosen study design



Workflow state determines the active/next round



Published items can be carried forward into later rounds



Round-aware summaries can be generated per rating round using:



median



dispersion



distribution



latest response per participant



Round-state transitions are audited



Notes



This ticket reduces hard-coded Round 2 assumptions before later round logic is added.



Ticket 13 — Round 3 rating + neutral feedback + interim reporting

Acceptance



If the study design requires Round 3, participants can:



list Round 3 items



submit Round 3 ratings



see neutral feedback



keep or revise responses



Neutral feedback uses the same equal-primary-action pattern



Interim report can be produced after Round 2 and after Round 3



Interim reports include:



current round summaries



current consensus/non-consensus status



methods/config snapshot



limitations text



explicit statement that the report is interim, not final



All Round 3 actions are audited



Notes



This ticket gets the platform to a genuine Modified Delphi-capable state.



Ticket 14 — Round 4 support for Classic Delphi

Acceptance



If study\_format is ClassicDelphi, the platform supports a Round 4 rating cycle



Round 4 uses the same neutral-feedback and rating logic unless later design changes are explicitly introduced



Round 4 items and responses are included in interim/final reporting as appropriate



If study\_format is ModifiedDelphi, Round 4 transitions or routes are blocked/unavailable



All Round 4 actions are audited



Notes



This ticket provides classic Delphi capability while preserving the human-chosen method boundary.



Ticket 15 — Final round-aware export/report

Acceptance



Final export/report reflects the terminal round defined by the study design:



Round 3 for Modified Delphi



Round 4 for Classic Delphi



Final report includes:



study format



planned round count



terminal round



method rationale



consensus rule



final-round item summaries



non-consensus items



limitations text including “consensus ≠ correctness”



config hash



dataset hash



auditability metadata



Interim reports remain available for earlier stages



Export action audited



Notes



This is the full final reporting layer for the expanded round engine.



Then we add AI



AI should come after the multi-round engine exists.



Reason: AI should operate across the full human-chosen study design, not a prematurely truncated two-round workflow.



AI for July: minimal and safe (Milestone 3)

AI Ticket A — AISuggestion + AI audit events + decision gating

Acceptance



Every AI call produces AISuggestion + AuditEvent



Nothing AI produces can be published without Accept/Edit/Reject and required human gating



Nothing participant-facing derived from AI can be published without Owner + MethodsSteward signoff



AI operates within the locked human-declared study design:



modified vs classic



planned rounds



terminal round



consensus rule



AI Ticket B — Inter-round synthesis + candidate statement drafting with provenance

Acceptance



AI proposes clusters, draft items, or carry-forward materials for the next round



Each draft item shows provenance links to underlying anonymized prior-round responses



Human acceptance required before anything becomes participant-facing



Merge rationale required where relevant



AI assistance may be used across the full round sequence, not only R1→R2



Notes



This ticket supports transition between rounds; it does not replace human methodological control.



AI Ticket C — Neutrality linter

Acceptance



Flags coercive language / double-barreled items



Suggestions are optional



Edits logged



AI Ticket D — IRB pack generator

Acceptance



Generates draft protocol from StudyVersion config



Includes study format, planned rounds, and method rationale



Clearly labeled draft



Requires signoff before official export



Practical interpretation of the revised roadmap



A minimal but methodologically serious July target is now:



through Ticket 13 for a strong Modified Delphi MVP



through Ticket 14 for Classic + Modified Delphi support in the same MVP



then AI



That means:



Modified Delphi MVP = through Ticket 13



Classic/Modified dual-mode MVP = through Ticket 14



AI-assisted platform = after that



Core governance sentence



The platform accelerates Delphi workflow, but the study designer must declare the method design in advance. The software does not decide whether a study is modified or classic; it records, locks, and enforces the human choice.



Charter Compliance Addendum



This MVP roadmap is governed by the Ethical Governance Charter for an Open-Source e Delphi Platform and the AI Governance \& Human in the Loop Contract (Thin Spec). The tickets above define the core build order, but the following compliance obligations also apply.



1\. Method suitability and study justification



Before Round 1 opens, the platform should support documentation of:



why Delphi is an appropriate method for the study



why a Modified Delphi or Classic Delphi design was chosen



the planned number of rounds



the rationale for selecting that format



the consensus rule and threshold to be used across rounds



These design choices should be stored as part of the StudyVersion configuration, locked before Round 1, and included in export/report output.



2\. Expert panel definition and recruitment transparency



Before study launch, the platform should support documentation of:



inclusion criteria for panelists



the basis on which expertise is defined



recruitment strategy



any relevant balance/diversity considerations in panel construction



These may initially be stored as structured text/config fields rather than a full workflow, but they should be treated as part of study governance and be available for export.



3\. Participant burden and process disclosure



Consent and participant-facing study materials should disclose, as applicable:



the planned number of rounds



whether the study is modified or classic Delphi



expected time commitment



expected response windows and deadlines



the possibility of attrition across rounds



how reminders will be handled



what kinds of feedback will be shown between rounds



These disclosures should be aligned with truthful anonymity language and should be reviewed as part of consent/version control.



4\. Anonymity-risk mitigation



The platform should not overstate anonymity. It should support truthful disclosure that:



participant identities may be separated from responses in system architecture



responses may still be inferable in small or specialized expert panels



anonymization reduces but does not eliminate re-identification risk



The platform should also support mitigation features such as:



optional conduct expectations for panelists/staff



optional structured justification fields where appropriate



careful handling of participant-facing summaries to reduce inadvertent identification risk



5\. Retention, deletion, and access logging



The platform should support explicit retention governance, including:



retention policy configuration at the StudyVersion level



withdrawal handling for future participation



logging of access to raw responses



logging of export/report generation



traceable access to sensitive study materials where feasible



A later phase may add more detailed retention enforcement, but the governance expectation should be recorded now.



6\. Interim and final reporting obligations



Interim and final reports should preserve methodological transparency by including, where applicable:



study format and planned rounds



method rationale



consensus rule and threshold



interim vs final status



consensus and non-consensus items



explicit statement that consensus does not imply correctness



hashes or equivalent reproducibility metadata



auditability metadata



7\. Human-in-the-loop AI governance



All AI features remain subordinate to human judgment.



For any AI-assisted workflow, the platform must preserve:



proposal vs decision separation



provenance links



append-only audit events



accept/edit/reject gating



human signoff before participant-facing publication



clear labeling of AI-generated draft material



AI should not silently determine study method, consensus thresholds, or publication decisions.



8\. Dual-review / methodological quality safeguards



Where the platform supports content analysis, clustering, or statement drafting, future phases should support stronger methodological quality controls such as:



dual-review or dual-coder workflows



export of anonymized raw material for internal methodological checking



explicit rationale logging for merges, splits, edits, and publication decisions



The MVP may implement simplified versions first, but the roadmap should preserve this direction.



9\. Open-source and release-readiness obligations



Before broader public release, the project should also address:



open-source license choice and rationale



security policy and responsible disclosure path



issue tracking and contribution norms



transparent algorithm and AI documentation



accessibility review and usability improvements



maintenance and sustainability planning



These items may be completed after core workflow tickets, but they remain part of charter compliance.



10\. Priority rule



If there is any conflict between convenience, speed, and governance requirements, the governance requirements control. The platform is intended to accelerate Delphi work without bypassing methodological transparency, participant protections, or human accountability.

