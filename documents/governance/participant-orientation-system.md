# Participant Orientation System

The participant orientation system is a required pre-Round 1 understanding gate. It supplements consent; it does not replace consent, withdrawal rights, or study-specific ethics language.

## Content Location

Shared orientation, glossary, inline help, round reminders, and AI disclosure copy live in:

- `app/src/content/orientation.ts`

The content module exposes:

- global About page sections
- glossary terms
- inline help snippets
- tutorial steps
- round reminder text
- AI enabled / disabled disclosure variants
- study-specific orientation facts generated from the study wizard state

This keeps participant-facing definitions from being scattered across screens and prepares the app for future localization or study-specific content editing.

## Participant Flow

Before a participant can submit Round 1:

1. The participant opens the invitation or participant portal.
2. Consent remains visible and separate.
3. The study-specific orientation explains Delphi, the planned study flow, participant role, consensus limits, confidentiality limits, voluntariness, and AI use.
4. The participant completes the short tutorial.
5. The backend records orientation completion with the study, version, participant, content version, and timestamp.
6. Round 1 submission is allowed only after active consent and orientation completion.

Round 1 and later rounds also display light-touch reminders. Round 2+ screens remind participants that they may keep or revise their response and that there is no correct answer.

## Backend Persistence

Orientation completion records are stored in the `participant_orientation_completions` document collection through:

- `server/src/stores/orientationStore.ts`

The record includes:

- participant ID
- study ID
- version ID
- orientation content version
- completion timestamp

Invitation participants use:

- `POST /participant/invitation/orientation/complete`

The local/staff demo path uses:

- `POST /studies/:studyId/versions/:versionId/participants/:participantId/orientation/complete`

Both paths write the `participant.orientation.complete` audit event without storing sensitive response content.

## AI Disclosure Behavior

If AI is enabled for a study, participant orientation states that AI may assist researchers in organizing, grouping, summarizing, or drafting materials, but does not decide outcomes, determine consensus, or tell participants what to answer. Humans review participant-facing study content before use.

If AI is not enabled, orientation states that AI assistance is not being used for the study's participant-facing process based on the current study configuration.

Future work should connect this wording directly to the full per-study AI connector state when that state is included in the participant invitation context.

## Charter Alignment

The orientation system supports the Charter by:

- reducing conformity pressure before the first response
- explaining that consensus is agreement, not correctness
- preserving dissent and non-consensus as meaningful data
- explaining confidentiality rather than promising absolute anonymity
- reinforcing voluntary participation and withdrawal rights
- making AI boundaries clear before participant content is submitted

## Adding Terms Or Help

Add glossary terms and inline help snippets in `app/src/content/orientation.ts`. Use plain language first and a short technical note second. Avoid participant-facing language that implies correctness, conformity, or pressure to change views.
