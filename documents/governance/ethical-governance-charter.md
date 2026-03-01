Ethical Governance Charter for an Open-Source e Delphi Platform
Version 1.0 (development-governing document)
Status: Normative requirements (“MUST/SHALL”) + implementation guidance (“SHOULD/MAY”)
Evidence base: This charter operationalizes Delphi standards and ethical considerations drawn from your notes on the Delphi technique. 
________________________________________
1. Purpose and Scope
This document governs the design, development, deployment, and maintenance of a software platform that implements Delphi studies (“e Delphi”). It is intended to ensure:
1.	Maximal protection of human participants (including experts and stakeholders),
2.	Highest methodological integrity for Delphi practice, and
3.	Ethical sustainability and public accountability, including an open-source architecture.
The platform is built to support Delphi’s purpose: a multi staged survey intended to achieve structured agreement among experts on an issue. 

Because Delphi yields valid expert opinion rather than definitive right/wrong answers, platform outputs MUST never be framed as “the truth.” 
________________________________________
2. Foundational Commitments
2.1 Human Subjects First
The platform SHALL be designed to reduce psychological, professional, reputational, and privacy harms—especially where feedback and convergence dynamics can create pressure. Delphi can expose participants to group pressure even when anonymity is intended; the platform MUST design against coercive convergence. 
2.2 Epistemic Integrity
Delphi consensus does not mean the correct answer has been found. 

Therefore, the platform MUST preserve uncertainty, dissent, and methodological limits in both internal dashboards and exported reports.
2.3 Transparency + Accountability via Open Source
The platform SHALL be open-source to enable independent audit of:
•	consensus calculations,
•	feedback generation,
•	item inclusion/exclusion logic,
•	and reporting.
This is an ethical requirement to prevent hidden manipulation of a process that shapes collective judgment.
2.4 Sustainability as Ethics
Ethics includes long-term maintainability and environmental responsibility. The platform SHALL be engineered for durability (maintainable modules, documentation, community governance) and low-waste operation (efficient compute, data minimization, low-carbon hosting preferences).
________________________________________
3. Governance Structure and Decision Rights
3.1 Required Roles
Every deployment MUST assign distinct accountable roles:
•	Study Owner (PI/Lead): Accountable for study purpose, suitability, panel criteria, consent content, reporting integrity.
•	Ethics & Methods Steward: Independent reviewer with authority to block releases/studies that violate this charter.
•	Security & Privacy Lead: Accountable for encryption, access controls, incident response.
•	Open Source Maintainers: Accountable for repo health, review, releases, dependency controls.
•	Data Custodian: Accountable for data retention, deletion, export controls, and audit logs.
3.2 Ethics & Methods Oversight Gate
Before a study can be launched, the platform MUST require a “Governance Checklist Sign off” by the Study Owner and Ethics & Methods Steward confirming:
•	expert inclusion criteria are documented, 
•	consensus thresholds are predefined (not adjustable midstream), 
•	confidentiality/anonymity mechanics are configured and communicated accurately, 
•	and participant information and consent are complete. 
________________________________________
4. Human Subjects Protection Requirements
4.1 Participant Information and Consent
Minimum content (MUST)
The platform MUST support a Participant Information Sheet containing (at minimum) the elements reflected in your notes, including: study title; invitation; purpose; why chosen; voluntariness; what participation involves; what if something goes wrong; confidentiality; what happens when study stops; organizer/funder; benefits; review/approval; contact for more information. 
Decision time (MUST)
Participants MUST be given adequate time to decide whether to participate; your notes specify at least two weeks as a standard. 
Consent capture (MUST)
The software MUST:
•	capture explicit consent (not implied),
•	version and timestamp consent language,
•	provide printable/exportable consent records,
•	and allow withdrawal.
4.2 Voluntariness and Withdrawal
The platform MUST allow participants to:
•	withdraw at any time without penalty (unless a specific compensated agreement states otherwise),
•	request deletion of identifiable data when feasible and consistent with the consented protocol,
•	and receive a clear explanation of what withdrawal does/does not delete (e.g., already-aggregated statistics).
4.3 Anonymity, Confidentiality, and Identity Management
Delphi anonymity reality (MUST communicate truthfully)
While anonymity among panelists is a defining feature, complete anonymity cannot be guaranteed because the researcher must link each participant to their responses across rounds to provide individualized feedback. 

The platform MUST state this plainly in participant materials.
Technical safeguards (MUST)
The platform MUST implement:
•	Unique participant IDs for round-linkage, 
•	strict separation of identity data from response data (separate stores/keys),
•	encryption at rest + in transit,
•	least-privilege access controls,
•	immutable audit logs for identity access,
•	and secure “master list” handling (the notes emphasize maintaining a master list of ID ↔ identity and contact preferences, but limiting access). 
Accountability vs. anonymity risk (MUST address)
Your notes warn that complete anonymity may reduce accountability and encourage ill-considered judgments.
Therefore the platform MUST offer ethically compatible mitigations, such as:
•	“confidential to the research team” identity (not to other panelists),
•	optional structured justification fields (private or aggregated),
•	and clear conduct expectations—without revealing identities to the panel.
4.4 Minimizing Pressure, Harm, and Manipulation
Because Delphi has been criticized as forcing consensus and because feedback can influence responses, procedures must be carefully designed. 

Therefore the platform MUST:
•	Avoid language like “you should align with the group.”
•	Present feedback neutrally (distributions, medians) rather than normatively.
•	Support “retain my response” with equal dignity to “revise my response.”
•	Never label individuals as “outliers,” “deviant,” or similar stigmatizing terms.
•	Prevent social comparison features that would create shame or coercion.
________________________________________
5. Methodological Standards the Software MUST Enforce
5.1 Suitability of Delphi
Delphi is not a replacement for rigorous scientific reviews or original research.  
The platform MUST include a pre-launch “method suitability” prompt requiring the Study Owner to document why Delphi is appropriate (e.g., dispersed experts, subjective judgments, difficulty meeting frequently).  
5.2 Expert Panel Definition and Selection
Not random sampling (MUST disclose)
Delphi does not employ a random representative sample; it uses a panel of experts. 

The platform MUST require documentation of:
•	expert inclusion criteria (clear boundaries around “expert”),  
•	recruitment methods,
•	and justification of expertise (including allowance for nontraditional expertise; your notes specify expertise need not require formal degrees). 
Panel size and manageability (MUST design for attrition)
Your notes describe wide variation and note that large panels can be hard to manage and increase attrition, with limited benefit beyond certain sizes. 
 
The platform MUST:
•	track attrition across rounds,
•	compute and report response rates per round,
•	and support adaptive reminder workflows.
5.3 Round Structure Fidelity
Classical structure (MUST support)
In classical Delphi, Round 1 is open-ended and later rounds are structured questionnaires based on analyzed responses, with expert ratings/rankings and iterative feedback. 
 
The platform MUST support at least:
•	Round 1: open-ended elicitation,
•	Round 2: structured rating/ranking,
•	Round 3 (optional): refined rating with controlled feedback.
Modification safeguards (MUST)
Your notes describe modified approaches (e.g., starting with literature-derived statements) that can improve efficiency but risk biasing responses. 
Therefore the platform MUST:
•	require explicit documentation if Round 1 is replaced,
•	record the provenance of each statement (panel-generated vs. literature/other),
•	and include a bias warning in the researcher workflow.
5.4 Content Analysis Integrity and Bias Controls
Because Delphi lacks opportunities for participants to elaborate interactively, content analysis can introduce researcher bias. 

Therefore the platform MUST include:
•	an audit trail for statement “collapsing”/merging decisions,
•	preservation of unique statements (kept as worded where appropriate), 
•	support for dual-coder workflows (two researchers independently generating categories and reconciling),
•	and the ability to export raw anonymized data for internal methodological checks.
5.5 Feedback Mechanics and Statistical Reporting
Your notes indicate Delphi commonly uses measures of central tendency and dispersion (e.g., median and standard deviation / IQR) for group judgments. 
 
Thus the platform MUST:
•	compute and display median and dispersion metrics for each item,
•	show each participant their prior response alongside group summaries (without revealing others’ identities),
•	and preserve feedback format configuration (since feedback format affects responses). 
5.6 Consensus Threshold Governance
Your notes emphasize:
•	consensus thresholds are often selected at the outset (e.g., 70%), 
•	there is no universal agreement on what the threshold should be, 
•	and consensus does not mean correctness. 
Therefore the platform MUST:
•	require a predefined consensus rule before Round 1 begins,
•	lock the rule against mid-study changes (changes require a new study version),
•	and ensure reports include: threshold used, justification, and limitations text.
5.7 Reporting MUST Include Non Consensus
At the end of the process, items that do not gain consensus can reveal important findings and SHOULD be examined and reported. 
 

Therefore the platform MUST support reporting that includes:
•	items reaching consensus,
•	items near consensus,
•	and items failing consensus,
with distributions and dispersion—so disagreement is preserved as data.
________________________________________
6. Attrition, Workload, and Participant Care
Delphi is time-consuming and requires sustained participation; decline in response rate threatens the process. 
To protect participants and method quality, the platform MUST provide:
•	clear upfront statement of number of rounds and time commitment, 
•	configurable deadlines per round (your notes cite commonly ~2 weeks as a recommendation for responding), 
•	reminder and follow-up tooling (since follow-up of non-respondents is essential), 
•	“personal touch” options compatible with confidentiality (e.g., individualized reminders that do not reveal panel membership), 
•	and round-limiting defaults (commonly 2–3 rounds to reduce fatigue). 
________________________________________
7. Data Governance, Security, and Participant Rights
7.1 Data Minimization (MUST)
Collect only what is necessary for:
•	eligibility screening,
•	round management,
•	and analysis.
7.2 Retention and Deletion (MUST)
The platform MUST implement:
•	configurable retention schedules per study,
•	secure deletion procedures,
•	and clear participant-facing explanations of retention.
7.3 Access Control and Logging (MUST)
All accesses to:
•	identity mappings,
•	raw responses,
•	exports,
MUST be logged immutably, with periodic review by the Security & Privacy Lead.
7.4 No Secondary Use Without Consent (MUST)
Any reuse (e.g., training models, secondary analysis, public datasets) MUST require explicit consent and governance review.
________________________________________
8. Transparency, Auditability, and Anti Manipulation
Because Delphi outcomes can influence policy, priorities, or guidelines, the platform MUST prevent subtle manipulation:
•	Version control for study instruments, statements, consensus rules, and feedback format.
•	Immutable audit log for any changes to items, wording, or inclusion/exclusion.
•	Reproducible exports: a report must be regenerable from the archived dataset and archived configuration.
•	Explicit limitations in every export: Delphi yields expert agreement and can be influenced by feedback; consensus ≠ correctness. 
________________________________________
9. Open Source Architecture Requirements
9.1 Licensing (MUST)
The core platform MUST be released under an OSI approved license (e.g., Apache 2.0, MIT, GPL 3.0). The license choice MUST be documented with rationale (e.g., permissive vs. copyleft goals).
9.2 Public Repository and Reproducible Builds (MUST)
•	Public repo with tagged releases.
•	Reproducible build process (so deployed binaries can be verified against source).
•	Security policy, issue tracker, and responsible disclosure pathway.
9.3 Transparent Algorithms (MUST)
Any algorithm used for:
•	consensus determination,
•	feedback computation,
•	item reduction/elimination,
•	or text clustering,
MUST be documented and auditable.
9.4 Data Protection Compatibility (MUST)
Open source code does not mean open data. The architecture MUST ensure:
•	data remains private by default,
•	secure defaults,
•	and study-level control over exports and sharing.
________________________________________
10. Sustainability and Ethical Quality Engineering
10.1 Environmental Sustainability (SHALL)
The platform SHALL:
•	minimize compute intensity (avoid unnecessary heavy processing),
•	support low-carbon hosting choices,
•	and minimize data duplication and retention.
10.2 Maintenance Sustainability (MUST)
To prevent ethical decay (abandonware risks):
•	modular architecture,
•	comprehensive documentation,
•	automated tests,
•	dependency governance (SBOM, pinning, vulnerability scanning),
•	and maintainer succession planning.
10.3 Accessibility and Inclusion (MUST)
Ethical quality includes the ability for diverse experts to participate:
•	WCAG-aligned UI,
•	device-agnostic participation,
•	time-zone and scheduling sensitivity,
•	and support for plain-language participant materials.
________________________________________
11. Required Study Outputs and Disclosures
Every study export MUST include:
•	study purpose and why Delphi was appropriate, 
•	expert inclusion criteria and recruitment description, 
•	number of rounds and round dates,
•	response rates per round + attrition, 
•	consensus definition and justification (locked), 
•	statistics used (median + dispersion), 
•	results including non-consensus items, 
•	and explicit statement: “Consensus indicates agreement among this panel; it does not establish correctness.” 
________________________________________
12. Compliance and Enforcement
12.1 Non-Compliance Handling (MUST)
The platform MUST support:
•	pausing a study if a governance violation is detected,
•	documenting the violation and remediation steps,
•	and notifying participants if their rights or confidentiality may have been affected.
12.2 Periodic Audits (SHALL)
At minimum annually (or per major release), maintainers SHALL conduct:
•	privacy/security audit,
•	methodological integrity audit (consensus rule locking, audit trails),
•	sustainability audit (dependencies, hosting guidance, compute footprint).
________________________________________
Appendix A: Delphi-Method “Non-Negotiables” Checklist (Software-Enforced)
The platform MUST enforce or strongly gate:
•	✅ Multi-round design (≥2 rounds). 
•	✅ Round 1 open-ended OR documented replacement with bias warning. 
•	✅ Controlled feedback with neutral presentation. 
•	✅ Expert inclusion criteria documented; not random sampling. 
•	✅ Consensus definition fixed at outset; no midstream edits. 
•	✅ Reporting includes dissent/non-consensus items. 
•	✅ Confidentiality/anonymity managed honestly (ID linkage required). 
•	✅ Attrition management: reminders, deadlines, transparent response rates. 

