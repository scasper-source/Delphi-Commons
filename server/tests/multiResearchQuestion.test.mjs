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
  `multi-rq-${Date.now()}-${Math.random().toString(16).slice(2)}`,
);

const owner = { "x-user-id": "owner-multi-rq", "x-user-role": "owner" };

async function loadModules() {
  if (!process.env.EDELPHI_DATA_DIR) {
    process.env.EDELPHI_DATA_DIR = path.join(runtimeRoot, "data");
    process.env.EDELPHI_AUDIT_DIR = path.join(runtimeRoot, "audit");
    process.env.EDELPHI_BACKUP_DIR = path.join(runtimeRoot, "backups");
  }
  return {
    Fastify: (await import("fastify")).default,
    ...(await import("../dist/studies/routes.js")),
    ...(await import("../dist/studies/researchQuestions.js")),
  };
}

async function buildApp() {
  const { Fastify, studiesRoutes } = await loadModules();
  const app = Fastify({ logger: false });
  await studiesRoutes(app);
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
  assert.equal(result.response.statusCode, statusCode, `${options.method} ${options.url}: ${result.response.body}`);
  return result.body;
}

function fixturePacket() {
  return {
    title: "Synthetic Multi-question Study",
    description: "Synthetic local test only.",
    researchQuestion: "Legacy first question value.",
    researchQuestions: [
      {
        id: "rq-access",
        displayOrder: 1,
        text: "Which fictional garden scheduling features improve access?",
        shortLabel: "Access",
        description: "Neutral access prompt.",
        requiredForRound1Response: true,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "rq-reminders",
        displayOrder: 2,
        text: "Which fictional reminder features should be considered?",
        shortLabel: "Reminders",
        description: "",
        requiredForRound1Response: true,
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  };
}

test("study packet normalizes multi research questions and rejects locked or zero-active edits", async (t) => {
  const app = await buildApp();
  t.after(async () => {
    await app.close();
  });

  const created = await expectStatus(app, {
    method: "POST",
    url: "/studies",
    headers: owner,
    body: { title: "Synthetic Multi-question Study", description: "Synthetic local test only." },
  }, 201);
  const studyId = created.study.id;
  const version = await expectStatus(app, {
    method: "POST",
    url: `/studies/${studyId}/versions`,
    headers: owner,
    body: {},
  }, 201);
  const versionId = version.studyVersion.id;

  const saved = await expectStatus(app, {
    method: "PATCH",
    url: `/studies/${studyId}/versions/${versionId}/wizard-packet`,
    headers: owner,
    body: { study_design_packet_json: fixturePacket() },
  }, 200);
  assert.equal(saved.studyVersion.study_design_packet_json.researchQuestion, "Which fictional garden scheduling features improve access?");
  assert.equal(saved.studyVersion.study_design_packet_json.researchQuestions.length, 2);

  await expectStatus(app, {
    method: "PATCH",
    url: `/studies/${studyId}/versions/${versionId}/wizard-packet`,
    headers: owner,
    body: {
      study_design_packet_json: {
        ...fixturePacket(),
        researchQuestions: fixturePacket().researchQuestions.map((question) => ({ ...question, active: false })),
      },
    },
  }, 400);

  await expectStatus(app, {
    method: "PATCH",
    url: `/studies/${studyId}/versions/${versionId}/design`,
    headers: owner,
    body: {
      study_format: "ClassicDelphi",
      planned_round_count: 4,
      terminal_round_number: 4,
      method_rationale: "Synthetic Classical Delphi local test.",
    },
  }, 200);
  await expectStatus(app, {
    method: "PATCH",
    url: `/studies/${studyId}/versions/${versionId}/consensus-rule`,
    headers: owner,
    body: {
      consensus_rule_json: {
        type: "percent_agreement",
        threshold: 80,
        agreement_min_rating: 7,
        source: "pi_defined",
        setting_process: "PI-defined before launch for synthetic test.",
      },
    },
  }, 200);
  await expectStatus(app, {
    method: "POST",
    url: `/studies/${studyId}/versions/${versionId}/submit-for-signoff`,
    headers: owner,
    body: {},
  }, 200);
  await expectStatus(app, {
    method: "PATCH",
    url: `/studies/${studyId}/versions/${versionId}/wizard-packet`,
    headers: owner,
    body: { study_design_packet_json: fixturePacket() },
  }, 409);
});

test("Round 1 payload helper preserves separate answers and legacy submissions", async () => {
  const {
    normalizeRoundOneResponsePayload,
    normalizeResearchQuestionsFromPacket,
    roundOneResponseEntries,
  } = await loadModules();
  const packet = fixturePacket();
  const questions = normalizeResearchQuestionsFromPacket(packet);

  const structured = normalizeRoundOneResponsePayload({
    responses: [
      { researchQuestionId: "rq-access", text: "Access answer" },
      { researchQuestionId: "rq-reminders", text: "Reminder answer" },
    ],
  }, packet);
  assert.equal(structured.ok, true);
  assert.deepEqual(
    roundOneResponseEntries(structured.payload, questions).map((entry) => [entry.researchQuestionId, entry.text]),
    [["rq-access", "Access answer"], ["rq-reminders", "Reminder answer"]],
  );

  const missingRequired = normalizeRoundOneResponsePayload({
    responses: [{ researchQuestionId: "rq-access", text: "Access answer" }],
  }, packet);
  assert.equal(missingRequired.ok, false);
  assert.equal(missingRequired.error, "required_research_question_response_missing");

  const legacyMultiQuestion = normalizeRoundOneResponsePayload({ text: "Legacy answer" }, packet);
  assert.equal(legacyMultiQuestion.ok, false, "legacy single-text payload should fail when a second required question is missing");

  const legacyOneQuestion = normalizeRoundOneResponsePayload(
    { text: "Legacy answer" },
    { researchQuestion: "Which single question should be answered?" },
  );
  assert.equal(legacyOneQuestion.ok, true);
  assert.equal(legacyOneQuestion.payload.responses[0].researchQuestionId, "rq-1");
});
