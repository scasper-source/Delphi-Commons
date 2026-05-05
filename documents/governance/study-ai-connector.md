# Study AI Connector Setup

The Study AI Connector is configured per study from Admin / Security. The safe default is No External AI mode, with all external provider calls disabled.

## Security Model

- API keys are accepted only through the API-key endpoint.
- API keys are encrypted at rest with `EDELPHI_AI_KEY_ENCRYPTION_SECRET`.
- Plaintext keys are never returned to the frontend.
- The UI displays only the stored last four characters.
- Keys, encrypted key material, bearer tokens, and provider secrets are redacted from audit and export paths.
- Key rotation replaces encrypted material and records a non-secret audit event.
- Key deletion removes encrypted material and marks a deletion timestamp.

## Data Minimization

External AI payloads must exclude participant names, email addresses, contact details, identity-response mappings, identity tables, master lists, consent records containing identifiers, and API credentials.

Allowed payloads are limited to anonymized response text, item IDs, round IDs, aggregate statistics, approved prompt/template versions, and non-identifying methodological context.

## No External AI Mode

When No External AI mode is active, study data is not sent to external AI services by this platform configuration. Local deterministic drafting or linting helpers may still be used only if the study-level feature permission is enabled and the route is allowed for the user role.

## Human In The Loop

AI remains a drafting and organizing assistant only. AI Suggestion (Not Final) outputs require explicit human Accept/Edit/Reject action before they affect study content or reach panelists.

## Disclosure Behavior

IRB and governed export packages include:

- Whether external AI is enabled.
- Whether No External AI mode is active.
- Provider and model, when configured.
- Enabled AI-assisted features.
- Data that may be sent.
- Identifier and identity-response mapping exclusions.
- Opt-out or No External AI language.
- Human-in-the-loop controls.

Exports never include API keys, encrypted key material, secret fingerprints, bearer tokens, or internal provider secrets.

## Verification

Before use with human subjects:

- Confirm `EDELPHI_AI_KEY_ENCRYPTION_SECRET` is set in the deployment environment.
- Validate the study AI connector status in Admin / Security.
- Generate an IRB Pack and confirm the AI disclosure is accurate.
- Generate an Audit Package and confirm no key material appears.
- Run backend tests covering key encryption, redaction, policy gating, sanitization, audit logging, and export disclosure.
