import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const runtimeRoot = path.join(
  serverRoot,
  "data",
  "test-runtime",
  `road-${Date.now()}-${Math.random().toString(16).slice(2)}`
);

process.env.EDELPHI_DATA_DIR = path.join(runtimeRoot, "data");
process.env.EDELPHI_AUDIT_DIR = path.join(runtimeRoot, "audit");

const Fastify = (await import("fastify")).default;
const { adminRoutes } = await import("../dist/routes/admin.js");
const { studiesRoutes } = await import("../dist/studies/routes.js");
const { participantsRoutes } = await import("../dist/routes/participants.js");
const { responsesRoutes } = await import("../dist/routes/responses.js");
const { consentRoutes } = await import("../dist/routes/consent.js");
const { itemsRoutes } = await import("../dist/routes/items.js");
const { reportsRoutes } = await import("../dist/routes/reports.js");
const { aiRoutes } = await import("../dist/routes/ai.js");

const owner = { "x-user-id": "owner-1", "x-user-role": "owner" };
const steward = { "x-user-id": "steward-1", "x-user-role": "methods_steward" };
const participant = { "x-user-id": "participant-user", "x-user-role": "participant" };

async function buildApp() {
  const app = Fastify({ logger: false });

  app.get("/health", async () => ({ status: "ok", service: "edelphi-server" }));
  await app.register(adminRoutes);
  await studiesRoutes(app);
  await app.register(participantsRoutes);
  await app.register(responsesRoutes);
  await app.register(consentRoutes);
  await app.register(itemsRoutes);
  await app.register(reportsRoutes);
  await app.register(aiRoutes);

  return app;
}

async function injectJson(app, options) {
  const response = await app.inject({
    ...options,
    payload: options.body,
  });

  const body = response.body ? response.json() : null;
  return { response, body };
}

async function expectStatus(app, options, statusCode) {
  const result = await injectJson(app, options);
  assert.equal(
    result.response.statusCode,
    statusCode,
    `${options.method} ${options.url} returned ${result.response.statusCode}: ${result.response.body}`
  );
  return result.body;
}

function uniqueParticipantId(index) {
  return `participant-${index}-${Date.now()}`;
}

test("backend road test covers study, consent, AI, reporting, and audit flows", async (t) => {
  const app = await buildApp();
  t.after(async () => {
    await app.close();
  });

  const health = await expectStatus(app, { method: "GET", url: "/health" }, 200);
  assert.equal(health.status, "ok");

  await expectStatus(
    app,
    {
      method: "POST",
      url: "/studies",
      headers: participant,
      body: { title: "Forbidden Study" },
    },
    403
  );

  const createdStudy = await expectStatus(
    app,
    {
      method: "POST",
      url: "/studies",
      headers: owner,
      body: {
        title: "Road Test Delphi",
        description: "End-to-end backend road test for the MVP workflow.",
      },
    },
    201
  );

  const studyId = createdStudy.study.id;

  const createdVersion = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions`,
      headers: owner,
      body: {},
    },
    201
  );

  const versionId = createdVersion.studyVersion.id;

  const wizardPacket = {
    title: "Road Test Delphi Protocol Title",
    description: "End-to-end backend road test for the MVP workflow.",
    researchQuestion: "Which care transition practices should be prioritized by this expert panel?",
    panelCriteria: "Licensed clinicians with care transition expertise.",
    consentVersion: "Consent v1.0",
    confidentialityStatement:
      "Responses are confidential to the research team and linked across rounds through participant IDs.",
    consensusThreshold: 80,
    agreementMinRating: 7,
    retentionSchedule: "Retained according to approved protocol.",
  };

  const savedWizard = await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/wizard-packet`,
      headers: owner,
      body: { study_design_packet_json: wizardPacket },
    },
    200
  );
  assert.equal(savedWizard.studyVersion.study_design_packet_json.title, "Road Test Delphi Protocol Title");

  const renamedStudy = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}`,
      headers: owner,
    },
    200
  );
  assert.equal(renamedStudy.study.title, "Road Test Delphi Protocol Title");

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/submit-for-signoff`,
      headers: owner,
      body: {},
    },
    409
  );

  const design = await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/design`,
      headers: owner,
      body: {
        study_format: "ModifiedDelphi",
        planned_round_count: 3,
        terminal_round_number: 3,
        method_rationale:
          "A modified Delphi design fits this panel because Round 1 will gather open statements before two structured rating rounds.",
      },
    },
    200
  );
  assert.equal(design.studyVersion.study_format, "ModifiedDelphi");

  const consensusRule = {
    type: "percent_agreement",
    threshold: 80,
    agreement_min_rating: 7,
  };

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/consensus-rule`,
      headers: owner,
      body: { consensus_rule_json: consensusRule },
    },
    200
  );

  const submitted = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/submit-for-signoff`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.equal(submitted.studyVersion.status, "ReadyForSignoff");
  assert.equal(typeof submitted.studyVersion.config_hash, "string");

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/consensus-rule`,
      headers: owner,
      body: { consensus_rule_json: consensusRule },
    },
    409
  );

  const blockedActivation = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/activate`,
      headers: owner,
      body: {},
    },
    409
  );
  assert.equal(blockedActivation.error, "missing_required_signoffs");

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/signoff`,
      headers: owner,
      body: { note: "Owner signoff for test." },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/signoff`,
      headers: steward,
      body: { note: "Methods signoff for test." },
    },
    200
  );

  const activated = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/activate`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.equal(activated.studyVersion.status, "Active");

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/open-round-1`,
      headers: owner,
      body: {},
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/rounds/1/config`,
      headers: owner,
      body: {
        task_type: "open_text",
        title: "Round 1 open-ended elicitation",
        prompt: "What care transition practices should this panel consider for later rating rounds?",
        participant_instructions:
          "Please provide one or more practices or concerns in your own words. Disagreement and uncertainty are useful to the study.",
        response_window_days: 7,
        reminder_subject: "Round 1 response window is open",
        reminder_body:
          "This is a neutral reminder that Round 1 is open. Participation is voluntary.",
        controlled_feedback_enabled: false,
        ai_curation_enabled: true,
        status: "Open",
      },
    },
    200
  );

  const participantIds = [uniqueParticipantId(1), uniqueParticipantId(2), uniqueParticipantId(3)];
  for (const [index, participantId] of participantIds.entries()) {
    const created = await expectStatus(
      app,
      {
        method: "POST",
        url: `/studies/${studyId}/versions/${versionId}/participants`,
        headers: owner,
        body: {
          name: `Panelist ${index + 1}`,
          email: `panelist-${index + 1}@example.test`,
        },
      },
      201
    );
    assert.equal(typeof created.participant_id, "string");
  }

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/responses`,
      headers: participant,
      body: {
        participant_id: participantIds[0],
        response_json: { text: "This should be blocked until consent is active." },
      },
    },
    403
  );

  const consentVersion = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/consent-versions`,
      headers: owner,
      body: { text_md: "# Consent\nParticipation is voluntary." },
    },
    201
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/consent-versions/${consentVersion.consent_version.consent_version_id}/activate`,
      headers: owner,
      body: {},
    },
    200
  );

  for (const participantId of participantIds) {
    await expectStatus(
      app,
      {
        method: "POST",
        url: `/studies/${studyId}/versions/${versionId}/consent`,
        headers: participant,
        body: { participant_id: participantId },
      },
      201
    );
  }

  const roundOneResponses = [
    "Clinicians must always receive timely follow up and adequate staffing.",
    "Clinicians must always receive timely follow up and adequate staffing.",
    "Patients benefit when discharge instructions are written in plain language.",
  ];

  for (const [index, text] of roundOneResponses.entries()) {
    await expectStatus(
      app,
      {
        method: "POST",
        url: `/studies/${studyId}/versions/${versionId}/responses`,
        headers: participant,
        body: {
          participant_id: participantIds[index],
          response_json: { text },
        },
      },
      201
    );
  }

  const summary = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/response-summary`,
      headers: owner,
    },
    200
  );
  assert.equal(summary.response_count, 3);
  assert.equal(summary.unique_participant_count, 3);

  const roundTwoSynthesis = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/synthesize-inter-round`,
      headers: owner,
      body: { target_round_number: 2 },
    },
    201
  );

  const roundTwoSuggestion = roundTwoSynthesis.suggestion;
  const roundTwoCandidates = roundTwoSuggestion.output_json.candidates;
  assert.equal(roundTwoSuggestion.feature, "inter_round_synthesis");
  assert.equal(roundTwoCandidates.length, 2);
  const clusteredCandidate = roundTwoCandidates.find(
    (candidate) => candidate.synthesis_kind === "cluster"
  );
  assert.ok(clusteredCandidate);
  assert.equal(clusteredCandidate.requires_human_rationale, true);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundTwoSuggestion.suggestion_id}/items`,
      headers: owner,
      body: { candidate_ids: roundTwoCandidates.map((candidate) => candidate.candidate_id) },
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundTwoSuggestion.suggestion_id}/decision`,
      headers: owner,
      body: { decision: "Accepted", note: "Round 2 candidates accepted for test." },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundTwoSuggestion.suggestion_id}/items`,
      headers: owner,
      body: { candidate_ids: roundTwoCandidates.map((candidate) => candidate.candidate_id) },
    },
    400
  );

  const materializedRoundTwo = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundTwoSuggestion.suggestion_id}/items`,
      headers: owner,
      body: {
        candidate_ids: roundTwoCandidates.map((candidate) => candidate.candidate_id),
        rationales: {
          [clusteredCandidate.candidate_id]:
            "The duplicate Round 1 responses use identical wording and preserve the same meaning.",
        },
      },
    },
    201
  );

  const roundTwoItems = materializedRoundTwo.items;
  assert.equal(roundTwoItems.length, 2);
  assert.equal(roundTwoItems[0].created_from, "ai");
  assert.equal(roundTwoItems[0].source_ai_suggestion_id, roundTwoSuggestion.suggestion_id);
  assert.ok(roundTwoItems[0].ai_provenance_links.length >= 1);

  const lint = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/lint-wording`,
      headers: owner,
      body: { item_ids: [roundTwoItems[0].item_id] },
    },
    201
  );
  const lintSuggestion = lint.suggestion;
  assert.equal(lintSuggestion.feature, "lint_wording");
  assert.equal(lintSuggestion.output_json.summary.target_count, 1);
  assert.ok(lintSuggestion.output_json.summary.flagged_count >= 1);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${lintSuggestion.suggestion_id}/decision`,
      headers: owner,
      body: { decision: "Accepted", note: "Lint suggestion accepted." },
    },
    200
  );

  const suggestedText =
    lintSuggestion.output_json.findings[0].suggested_text ??
    "Clinicians may need to receive timely follow up and adequate staffing.";

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${lintSuggestion.suggestion_id}/apply-wording`,
      headers: owner,
      body: {
        changes: [
          {
            item_id: roundTwoItems[0].item_id,
            text: suggestedText,
            rationale: "Human review accepted the neutralized wording.",
          },
        ],
      },
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${lintSuggestion.suggestion_id}/release-signoff`,
      headers: owner,
      body: { note: "Owner release signoff." },
    },
    200
  );
  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${lintSuggestion.suggestion_id}/release-signoff`,
      headers: steward,
      body: { note: "Methods release signoff." },
    },
    200
  );

  const revised = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${lintSuggestion.suggestion_id}/apply-wording`,
      headers: owner,
      body: {
        changes: [
          {
            item_id: roundTwoItems[0].item_id,
            text: suggestedText,
            rationale: "Human review accepted the neutralized wording.",
          },
        ],
      },
    },
    200
  );
  assert.equal(revised.items[0].text, suggestedText);
  assert.equal(revised.items[0].ai_assisted_revisions.length, 1);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/items/${roundTwoItems[0].item_id}/publish`,
      headers: owner,
      body: {},
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundTwoSuggestion.suggestion_id}/release-signoff`,
      headers: owner,
      body: { note: "Owner release signoff." },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/items/${roundTwoItems[0].item_id}/publish`,
      headers: owner,
      body: {},
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundTwoSuggestion.suggestion_id}/release-signoff`,
      headers: steward,
      body: { note: "Methods release signoff." },
    },
    200
  );

  for (const item of roundTwoItems) {
    const published = await expectStatus(
      app,
      {
        method: "POST",
        url: `/studies/${studyId}/versions/${versionId}/items/${item.item_id}/publish`,
        headers: owner,
        body: {},
      },
      200
    );
    assert.equal(published.item.status, "Published");
  }

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/1/close`,
      headers: owner,
      body: {},
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/config`,
      headers: owner,
      body: {
        task_type: "rating",
        title: "Round 2 structured rating",
        prompt: "Please rate each candidate statement.",
        participant_instructions:
          "Review each statement independently. Ratings should reflect your judgment for this study.",
        response_window_days: 7,
        reminder_subject: "Round 2 rating is open",
        reminder_body: "This is a neutral reminder that Round 2 is open.",
        controlled_feedback_enabled: true,
        ai_curation_enabled: false,
        status: "Ready",
      },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/open`,
      headers: owner,
      body: {},
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/ratings`,
      headers: participant,
      body: {
        participant_id: participantIds[0],
        item_id: roundTwoItems[0].item_id,
        action: "keep",
      },
    },
    400
  );

  const roundTwoRatings = [
    [8, 8, 6],
    [9, 9, 9],
  ];

  for (const [itemIndex, item] of roundTwoItems.entries()) {
    for (const [participantIndex, participantId] of participantIds.entries()) {
      await expectStatus(
        app,
        {
          method: "POST",
          url: `/studies/${studyId}/versions/${versionId}/rounds/2/ratings`,
          headers: participant,
          body: {
            participant_id: participantId,
            item_id: item.item_id,
            rating: roundTwoRatings[itemIndex][participantIndex],
            action: "revise",
          },
        },
        201
      );
    }
  }

  const feedback = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/items/${roundTwoItems[0].item_id}/feedback?participant_id=${participantIds[0]}`,
      headers: participant,
    },
    200
  );
  assert.equal(feedback.feedback.response_count, 3);
  assert.equal(feedback.feedback.median, 8);

  const roundTwoReport = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/report`,
      headers: owner,
    },
    200
  );
  assert.equal(roundTwoReport.report.report_stage, "interim");
  assert.equal(roundTwoReport.report.summary.published_item_count, 2);

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/2/close`,
      headers: owner,
      body: {},
    },
    200
  );

  const roundThreeSynthesis = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/synthesize-inter-round`,
      headers: owner,
      body: { target_round_number: 3 },
    },
    201
  );

  const roundThreeSuggestion = roundThreeSynthesis.suggestion;
  const roundThreeCandidates = roundThreeSuggestion.output_json.candidates;
  assert.equal(roundThreeCandidates.length, 2);
  assert.ok(roundThreeCandidates.every((candidate) => candidate.synthesis_kind === "carry_forward"));

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundThreeSuggestion.suggestion_id}/decision`,
      headers: owner,
      body: { decision: "Accepted", note: "Round 3 carry-forward accepted." },
    },
    200
  );

  const materializedRoundThree = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundThreeSuggestion.suggestion_id}/items`,
      headers: owner,
      body: {
        candidate_ids: roundThreeCandidates.map((candidate) => candidate.candidate_id),
      },
    },
    201
  );

  const roundThreeItems = materializedRoundThree.items;
  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundThreeSuggestion.suggestion_id}/release-signoff`,
      headers: owner,
      body: { note: "Owner release signoff." },
    },
    200
  );
  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${roundThreeSuggestion.suggestion_id}/release-signoff`,
      headers: steward,
      body: { note: "Methods release signoff." },
    },
    200
  );

  for (const item of roundThreeItems) {
    const published = await expectStatus(
      app,
      {
        method: "POST",
        url: `/studies/${studyId}/versions/${versionId}/items/${item.item_id}/publish`,
        headers: owner,
        body: {},
      },
      200
    );
    assert.equal(published.item.status, "Published");
  }

  await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/versions/${versionId}/rounds/3/config`,
      headers: owner,
      body: {
        task_type: "rating",
        title: "Round 3 terminal rating",
        prompt: "Please rate each carried-forward statement.",
        participant_instructions:
          "Review the controlled feedback neutrally and rate each statement using your judgment.",
        response_window_days: 7,
        reminder_subject: "Round 3 rating is open",
        reminder_body: "This is a neutral reminder that Round 3 is open.",
        controlled_feedback_enabled: true,
        ai_curation_enabled: false,
        status: "Ready",
      },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/rounds/3/open`,
      headers: owner,
      body: {},
    },
    200
  );

  const roundThreeRatings = [
    [8, 6, 6],
    [9, 9, 9],
  ];

  for (const [itemIndex, item] of roundThreeItems.entries()) {
    for (const [participantIndex, participantId] of participantIds.entries()) {
      await expectStatus(
        app,
        {
          method: "POST",
          url: `/studies/${studyId}/versions/${versionId}/rounds/3/ratings`,
          headers: participant,
          body: {
            participant_id: participantId,
            item_id: item.item_id,
            rating: roundThreeRatings[itemIndex][participantIndex],
            action: "revise",
          },
        },
        201
      );
    }
  }

  const roundThreeReport = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/rounds/3/report`,
      headers: owner,
    },
    200
  );
  assert.equal(roundThreeReport.report.report_stage, "final");
  assert.equal(roundThreeReport.report.is_final_for_declared_design, true);

  await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/rounds/4/report`,
      headers: owner,
    },
    409
  );

  const finalExport = await expectStatus(
    app,
    {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/export-report`,
      headers: owner,
    },
    200
  );
  assert.equal(finalExport.report.final_round_number, 3);
  assert.equal(finalExport.report.report_stage, "final");
  assert.ok(finalExport.report.summary.non_consensus_item_count >= 1);
  assert.equal(typeof finalExport.report.hashes.dataset_hash, "string");

  const irbDraft = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/generate-irb-pack`,
      headers: owner,
      body: {
        panel_description: "Licensed clinicians with care transition expertise.",
        inclusion_criteria: "Adults with professional experience in care transitions.",
        recruitment_strategy: "Email invitations from the study team.",
        expected_time_commitment: "Three rounds, about 15 minutes per round.",
        response_window: "One week per round with neutral reminders.",
        contact_information: "study-team@example.test",
        retention_summary: "Retained according to approved protocol.",
      },
    },
    201
  );

  const irbSuggestion = irbDraft.suggestion;
  assert.equal(irbSuggestion.feature, "irb_pack");
  assert.equal(irbSuggestion.output_json.draft_status, "draft_requires_human_review");

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${irbSuggestion.suggestion_id}/decision`,
      headers: owner,
      body: { decision: "Accepted", note: "IRB draft accepted for release test." },
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${irbSuggestion.suggestion_id}/export-irb-pack`,
      headers: owner,
      body: {},
    },
    409
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${irbSuggestion.suggestion_id}/release-signoff`,
      headers: owner,
      body: { note: "Owner release signoff." },
    },
    200
  );
  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${irbSuggestion.suggestion_id}/release-signoff`,
      headers: steward,
      body: { note: "Methods release signoff." },
    },
    200
  );

  const officialIrb = await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/ai/suggestions/${irbSuggestion.suggestion_id}/export-irb-pack`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.equal(officialIrb.irb_pack_export.official_status, "released_for_official_use");

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/consent/${participantIds[0]}/withdraw`,
      headers: participant,
      body: {},
    },
    200
  );

  await expectStatus(
    app,
    {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/responses`,
      headers: participant,
      body: {
        participant_id: participantIds[0],
        response_json: { text: "A future response after withdrawal should be blocked." },
      },
    },
    409
  );

  const archived = await expectStatus(
    app,
    {
      method: "PATCH",
      url: `/studies/${studyId}/archive`,
      headers: owner,
      body: {},
    },
    200
  );
  assert.equal(typeof archived.study.archived_at, "string");

  const visibleStudies = await expectStatus(
    app,
    {
      method: "GET",
      url: "/studies",
      headers: owner,
    },
    200
  );
  assert.equal(
    visibleStudies.studies.some((study) => study.id === studyId),
    false
  );

  const allStudies = await expectStatus(
    app,
    {
      method: "GET",
      url: "/studies?include_archived=true",
      headers: owner,
    },
    200
  );
  assert.equal(
    allStudies.studies.some((study) => study.id === studyId && study.archived_at),
    true
  );

  const auditPath = path.join(process.env.EDELPHI_AUDIT_DIR, "audit.log");
  const auditRaw = await fs.readFile(auditPath, "utf8");
  const auditEvents = auditRaw
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));

  const actions = new Set(auditEvents.map((event) => event.action));
  for (const action of [
    "study_version.open_round1",
    "round.config.upsert",
    "study_version.save_wizard_packet",
    "response.submit",
    "ai.suggestion.synthesize_inter_round",
    "ai.suggestion.lint_wording",
    "ai.suggestion.generate_irb_pack",
    "ai.suggestion.export_irb_pack",
    "report.export",
    "study.archive",
  ]) {
    assert.ok(actions.has(action), `missing audit action: ${action}`);
  }

  assert.ok(
    auditEvents.some(
      (event) =>
        event.action === "report.export" &&
        event.details.studyId === studyId &&
        event.details.versionId === versionId &&
        event.details.final_round_number === 3
    )
  );
});
