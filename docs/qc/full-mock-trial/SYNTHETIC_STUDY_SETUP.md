# Synthetic Study Setup

Live execution status: API-DRIVEN LOCAL RUN COMPLETED; FULL BROWSER/MOBILE RUN NOT COMPLETED.

## Study Scenario

Title:

Prioritizing features for a fictional community garden scheduling app

Purpose:

Identify which scheduling-app features a synthetic panel would prioritize for a fictional community garden coordination tool, while preserving uncertainty, disagreement, and non-consensus.

Study type:

Classical Delphi.

Planned round count:

4.

Terminal round:

4.

Method rationale:

The fictional topic is harmless and suitable for rehearsal because it requires structured prioritization, multiple rounds of judgment, and controlled feedback without involving real people, institutions, private facts, health information, or sensitive data.

Consensus rule:

80% agreement at rating 7 or higher on a 1 to 9 scale.

Consensus source:

PI-defined before Round 1, with governance signoff before launch.

Required report/export limitation:

"Consensus indicates agreement among this panel; it does not establish correctness."

## Hard Data Boundary

Use only the IDs and email-shaped values below. Do not add real names, real organizations, real contact details, real institutions, real workplace facts, or sensitive facts.

| Synthetic participant | Email-shaped identifier if required | Notes |
| --- | --- | --- |
| SYN-P001 | syn-p001@example.test | Synthetic only |
| SYN-P002 | syn-p002@example.test | Synthetic only |
| SYN-P003 | syn-p003@example.test | Synthetic only; support-loop participant |
| SYN-P004 | syn-p004@example.test | Synthetic only |
| SYN-P005 | syn-p005@example.test | Synthetic only |
| SYN-P006 | syn-p006@example.test | Synthetic only |
| SYN-P007 | syn-p007@example.test | Synthetic only |
| SYN-P008 | syn-p008@example.test | Synthetic only |

## Mock Roles

| Role | Purpose | Live assignment |
| --- | --- | --- |
| Study Owner / PI | Create study, configure governance, curate items, open/close rounds, review support notes, generate exports | PASS through API-driven run |
| Ethics & Methods Steward | Review method, consensus, consent, AI/HITL, and release gates | PASS through API-driven run |
| PI/admin support role | Respond to participant issue note | PASS through API-driven run |
| Optional observer/test recorder | Capture evidence, defects, screenshots, and export/privacy checks | PASS through API-driven run |

## Study Builder Fields

| Field | Planned value |
| --- | --- |
| Study title | Prioritizing features for a fictional community garden scheduling app |
| Research question | Which scheduling-app features should be prioritized for a fictional community garden coordination tool? |
| Objective | Identify consensus, near-consensus, and non-consensus priorities while preserving dissent and uncertainty. |
| Delphi suitability | The question involves structured judgment and prioritization where multiple perspectives should be visible. |
| Study format | Classic Delphi |
| Round 1 mode | Open-ended elicitation |
| Panel criteria | Synthetic participants representing fictional scheduling preferences only |
| Recruitment plan | Synthetic invitation links created for mock participants only |
| Target panel size | 8 |
| Consent version | Synthetic Consent v1.0 |
| Confidentiality statement | Responses are confidential to the study team and linked across rounds through participant IDs. No real anonymity is promised. |
| Withdrawal process | Synthetic participants may withdraw from future participation; prior synthetic submissions remain governed by the mock retention policy. |
| Planned rounds | 4 |
| Terminal round | 4 |
| Consensus threshold | 80% at rating 7+ |
| Feedback | Median, distribution, IQR/dispersion where available, and participant prior response where implemented |
| AI | Existing deterministic local AI helpers with No External AI mode; no live external AI |
| Retention | Retain only synthetic test records for QC evidence; do not publish local runtime data |

## Round 1 Synthetic Responses

| Participant | Open-ended response |
| --- | --- |
| SYN-P001 | The app should show a simple shared calendar with available garden plots, tool checkout times, and watering shifts. |
| SYN-P002 | I would prioritize reminder notifications because missed watering times create avoidable coordination problems. |
| SYN-P003 | The app should include a way to ask for help when a shift cannot be covered. |
| SYN-P004 | I think accessibility matters most: large text, clear contrast, and a low-data mode for older phones. |
| SYN-P005 | The app should avoid too many notifications and should let people choose quiet hours. |
| SYN-P006 | I would like weather-aware scheduling so watering reminders adjust after rain. |
| SYN-P007 | Shared equipment checkout should be prominent so tools do not disappear or get double-booked. |
| SYN-P008 | I prefer a printable weekly schedule because not everyone wants to use an app every day. |

## Candidate Structured Items

These are planned deterministic fixture items for curation rehearsal. During a live run, they must become participant-facing only after human review and any required governance gates.

| Candidate item | Source participants | Minority or dissent preserved |
| --- | --- | --- |
| The app should provide a shared calendar for plots, watering shifts, and shared equipment. | SYN-P001, SYN-P007 | No |
| The app should send configurable reminders for watering and shift coverage. | SYN-P002, SYN-P003, SYN-P005 | Yes, quiet-hours concern retained |
| The app should support accessible, low-data, and printable scheduling views. | SYN-P004, SYN-P008 | Yes, printable schedule retained |
| The app should incorporate weather-aware scheduling adjustments. | SYN-P006 | Yes, singleton preserved |

## Planned Rating Fixtures

These planned fixture patterns were used as deterministic synthetic input during the API-driven run. They remain suitable for a future browser/mobile rerun after export privacy remediation.

| Item | SYN-P001 | SYN-P002 | SYN-P003 | SYN-P004 | SYN-P005 | SYN-P006 | SYN-P007 | SYN-P008 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Shared calendar | 9 | 8 | 8 | 7 | 7 | 8 | 9 | 6 |
| Configurable reminders | 7 | 9 | 8 | 6 | 5 | 8 | 7 | 6 |
| Accessible/printable views | 7 | 6 | 7 | 9 | 8 | 6 | 6 | 9 |
| Weather-aware scheduling | 6 | 7 | 6 | 5 | 5 | 9 | 6 | 5 |

Round 3 and Round 4 may reuse these patterns with small deterministic changes that preserve at least two participants' disagreement. Do not force convergence.

## Evidence Status

| Evidence item | Status |
| --- | --- |
| Study created | PASS |
| Consent gate verified | PASS through API payload; browser gate NOT RUN |
| Consensus lock verified | PASS |
| Round 1 completed by all 8 | PASS |
| Round 2 completed by all 8 | PASS |
| Round 3 completed by all 8 | PASS |
| Round 4 completed by all 8 | PASS |
| Export generated | PASS |
| Export privacy checked | PASS after focused remediation regression; full browser rerun NOT RUN |
| AI governance checked | PASS through API-driven local helper path |
