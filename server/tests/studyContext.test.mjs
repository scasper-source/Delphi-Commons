/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const runtimeRoot = path.join(
  serverRoot,
  "data",
  "test-runtime",
  `context-${Date.now()}-${Math.random().toString(16).slice(2)}`,
);

process.env.EDELPHI_DATA_DIR ??= path.join(runtimeRoot, "data");
process.env.EDELPHI_AUDIT_DIR ??= path.join(runtimeRoot, "audit");
process.env.EDELPHI_BACKUP_DIR ??= path.join(runtimeRoot, "backups");

const {
  blankStudyContextDisclosure,
  createLocalProposalImportSuggestions,
  decideStudyContextSuggestion,
  generateParticipantDisclosure,
  normalizeStudyContextDisclosure,
  validateStudyContextDisclosure,
} = await import("../dist/stores/studyContextStore.js");
const { sha256Json } = await import("../dist/studies/hash.js");

test("study context disclosure remains optional but reflects supplied sponsor access", () => {
  const blank = blankStudyContextDisclosure({
    study_id: "study-context-1",
    version_id: "version-context-1",
    actor_user_id: "owner-1",
    study_title: "Context Trial",
  });
  assert.equal(blank.status, "optional");
  assert.equal(validateStudyContextDisclosure(blank).status, "optional");

  const supplied = normalizeStudyContextDisclosure(blank, {
    basic_context: {
      pi_or_study_owner: "Stephen T. Casper",
      institution_or_organization: "Example University",
    },
    funding: {
      funding_status: "sponsor_corporate_partner_involved",
      sponsor_name: "Example Sponsor",
      role_details: "aggregate report review",
    },
    data_access: {
      sponsor_can_access_raw_responses: "yes",
      sponsor_can_access_identifiable_data: "no",
      sponsor_can_access_aggregate_results: "yes",
    },
  }, "owner-1");

  const generated = generateParticipantDisclosure(supplied);
  assert.equal(generated.status, "supplied");
  assert.match(generated.participant_disclosure.generated_text, /Example Sponsor/);
  assert.match(generated.participant_disclosure.generated_text, /may access individual responses/);
  assert.equal(validateStudyContextDisclosure(generated).status, "review_recommended");
});

test("proposal import suggestions are non-final until human accepted or edited", () => {
  const blank = blankStudyContextDisclosure({
    study_id: "study-context-2",
    version_id: "version-context-2",
    actor_user_id: "owner-1",
  });
  const imported = createLocalProposalImportSuggestions({
    record: blank,
    source_name: "award summary",
    source_text: "Funded by Example Foundation. Publication approval is required before dissemination.",
    source_text_hash: sha256Json({ source: "award summary" }),
  });

  const funderSuggestion = imported.proposal_import.suggestions.find((suggestion) => suggestion.field_path === "funding.funder_name");
  assert.ok(funderSuggestion);
  assert.equal(funderSuggestion.label, "AI Suggestion — Not Final");
  assert.equal(funderSuggestion.status, "pending");
  assert.equal(imported.funding.funder_name, "");

  const accepted = decideStudyContextSuggestion({
    record: imported,
    suggestion_id: funderSuggestion.suggestion_id,
    action: "accept",
    actor_user_id: "owner-1",
  });
  assert.equal(accepted.funding.funder_name, "Example Foundation");
  assert.equal(
    accepted.proposal_import.suggestions.find((suggestion) => suggestion.suggestion_id === funderSuggestion.suggestion_id)?.status,
    "accepted",
  );
});
