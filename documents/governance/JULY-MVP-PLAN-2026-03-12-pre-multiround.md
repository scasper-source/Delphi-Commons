July MVP: what “done” means

By July you need a system where you can:

Create a study (with roles assigned)

Generate participant info + consent (truthful anonymity language)

Invite panelists (unique participant IDs)

Run Round 1 open-ended

Use AI to propose clusters + candidate Round 2 statements

Human reviews in a Curation Desk (Accept/Edit/Reject, with provenance + merge rationale)

Lock and publish Round 2 rating (neutral feedback)

Export a report that includes non-consensus + “consensus ≠ correctness” + full method/config + audit trail

That’s the MVP.

The build order (don’t deviate)
Milestone 0 — Repo skeleton + build/run (1 day)

Goal: you can run the app locally in dev mode.

Milestone 1 — Rails foundation (must come before AI) (1–2 weeks)

Goal: the platform is incapable of unethical “shortcuts.”

Roles + permissions

StudyVersion + consensus-locking

Identity vs responses separation

Append-only audit log

Consent versioning + withdrawal

Milestone 2 — Delphi without AI (1–2 weeks)

Goal: you can run a real Delphi end-to-end manually.

Round 1 collect

Manual curation desk

Round 2 rating + neutral feedback

Export with non-consensus

Milestone 3 — AI safely (1–2 weeks)

Goal: AI accelerates R1→R2, but humans control everything.

AISuggestion store + AI audit events

clustering + candidate statements with provenance links

accept/edit/reject gating enforced server-side

dual signoff gate for participant-facing publishing

Recommended architecture for July (keep it simple)
Choose: Web app

Reason: easiest for panelists + conference pilot. Desktop introduces distribution friction.

Minimal stack (suggested)

Backend: one service (REST) + DB

DB: Postgres or SQLite (Postgres preferred, SQLite ok for pilot)

AI: local model or “local network” inference for July (avoid external connector complexity)

Frontend: basic web UI (doesn’t need to be pretty)

If you already have a preferred stack, we can align; but this plan works with almost any modern web backend.

Data model (the “spine”)

You need these entities, minimum:

Study

id, title, description

created_by, created_at

StudyVersion

id, study_id, version_number

status: Draft | ReadyForSignoff | Active | Paused | Closed

consensus_rule_json (required before R1 opens)

feedback_config_json

retention_policy_json

config_hash (for reproducible exports)

opened_round1_at (null until opened)

Roles / Assignments

user_id, study_id, role (Owner, MethodsSteward, PrivacyLead, DataCustodian, Maintainer)

ParticipantMaster (identity store)

participant_id (random UUID)

study_id

email / name (optional)

invite_status

created_at

ResponseStore (separate schema or separate DB)

response_id

study_version_id

participant_id

round_id

payload_json (text or rating)

submitted_at

ConsentVersion

consent_version_id

study_version_id

text_md

created_at

is_active

ConsentRecord

participant_id

consent_version_id

consented_at

withdrew_at (nullable)

Round

round_id

study_version_id

round_number

type: OpenEnded | Rating

opens_at, closes_at

status

Item

item_id

study_version_id

round_number (where used)

text

provenance_type: PanelDerived | LiteratureDerived

created_from (manual|ai)

status: Draft | Published

MergeAction

merge_id

study_version_id

from_item_ids

to_item_id

rationale

actor_user_id

created_at

AISuggestion

suggestion_id

study_version_id

feature (cluster_r1, draft_items, lint_wording, irb_pack)

model_id/version

prompt_template_version

input_scope_ids (hash or list)

output_json

output_hash

created_by

created_at

decision: Accepted|Edited|Rejected|None

decided_by/at

resulting_object_ids (items created)

AuditEvent (append-only)

event_id, timestamp

actor_user_id + role

study_id + study_version_id

event_type

object_type/object_id

details_json

This structure directly supports: identity separation, locking, auditability, provenance, and AI HITL gating.

The first 10 tickets (exactly what to build next)
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

Cannot “Activate” study unless Owner + MethodsSteward sign off

AuditEvent created for signoff + activation

Ticket 4 — Consensus rule required + locked on R1 open

Acceptance

Cannot open Round 1 unless consensus rule set

After R1 opens, edits to consensus rule are rejected or force creation of new StudyVersion

Tested

Ticket 5 — Identity store + Response store separation

Acceptance

ParticipantMaster data is not accessible from response endpoints

Response records contain participant_id but no identity fields

Access to master list is role-gated + audited

Ticket 6 — Consent versioning + consent capture + withdrawal

Acceptance

ConsentVersion created + marked active

Participant cannot submit responses without consent record

Withdrawal blocks future submissions and is logged

Ticket 7 — Round 1 open-ended collection

Acceptance

Participants can submit open-ended responses during window

Response rates available to Owner (not to panelists)

Reminder action logged (content can be manual for MVP)

Ticket 8 — Manual Curation Desk (no AI yet)

Acceptance

Owner/Steward can create candidate Items for Round 2

Merge/split requires rationale

All edits logged

Nothing becomes “Published” without explicit action

Ticket 9 — Round 2 rating + neutral feedback

Acceptance

Participants rate items

Feedback shows median + dispersion + distribution + “your prior response”

“Keep my response” and “Revise” are equal primary actions

Ticket 10 — Export report (reproducible) incl. non-consensus

Acceptance

Export includes consensus + non-consensus items, distributions, consensus definition, methods, limitations text

Includes StudyVersion + config hash + dataset hash

Export action audited

Then we add AI.

AI for July: minimal and safe (Milestone 3)
AI Ticket A — AISuggestion + AI audit events + decision gating

Acceptance

Every AI call produces AISuggestion + AuditEvent

Nothing AI produces can be published without Accept/Edit/Reject AND Owner+Steward signoff (for participant-facing publication)

AI Ticket B — R1 clustering + candidate statement drafting with provenance

Acceptance

AI proposes clusters and draft items

Each draft item shows provenance links to underlying anonymized R1 responses

Human acceptance required; merge rationale required

AI Ticket C — Neutrality linter

Acceptance

Flags coercive language / double-barreled items

Suggestions are optional; edits logged

AI Ticket D — IRB pack generator

Acceptance

Generates draft protocol from StudyVersion config

Clearly labeled draft; requires signoff before “official export”