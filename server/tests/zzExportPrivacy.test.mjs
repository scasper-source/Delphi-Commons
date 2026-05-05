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
  `export-privacy-${Date.now()}-${Math.random().toString(16).slice(2)}`,
);

const owner = { "x-user-id": "owner-export-privacy", "x-user-role": "owner" };
const dataCustodian = { "x-user-id": "custodian-export-privacy", "x-user-role": "data_custodian" };

const participantIds = [
  "11111111-1111-4111-8111-111111111111",
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
  "55555555-5555-4555-8555-555555555555",
  "66666666-6666-4666-8666-666666666666",
  "77777777-7777-4777-8777-777777777777",
  "88888888-8888-4888-8888-888888888888",
];

const syntheticLabels = participantIds.map((_, index) => `SYN-P${String(index + 1).padStart(3, "0")}`);
const syntheticEmails = participantIds.map((_, index) => `syn-p${String(index + 1).padStart(3, "0")}@example.test`);

async function loadModules() {
  if (!process.env.EDELPHI_DATA_DIR) {
    process.env.EDELPHI_DATA_DIR = path.join(runtimeRoot, "data");
    process.env.EDELPHI_AUDIT_DIR = path.join(runtimeRoot, "audit");
    process.env.EDELPHI_BACKUP_DIR = path.join(runtimeRoot, "backups");
  }
  return {
    Fastify: (await import("fastify")).default,
    ...(await import("../dist/studies/store.js")),
    ...(await import("../dist/stores/responseStore.js")),
    ...(await import("../dist/stores/itemStore.js")),
    ...(await import("../dist/stores/participantStatusStore.js")),
    ...(await import("../dist/core/audit.js")),
    ...(await import("../dist/routes/reports.js")),
    ...(await import("../dist/exports/exportPrivacy.js")),
  };
}

async function buildApp() {
  const { Fastify, reportsRoutes } = await loadModules();
  const app = Fastify({ logger: false });
  await reportsRoutes(app);
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

async function seedSyntheticStudy() {
  const {
    createStudy,
    createStudyVersion,
    createResponse,
    createItem,
    updateItem,
    ensureParticipantEnrollment,
    writeAuditEvent,
  } = await loadModules();

  const now = new Date().toISOString();
  const studyId = "export-privacy-study";
  const versionId = "export-privacy-version";

  await createStudy(
    {
      id: studyId,
      title: "Export Privacy Synthetic Study",
      description: "Synthetic export privacy regression fixture.",
      created_by: owner["x-user-id"],
      created_at: now,
    },
    {
      user_id: owner["x-user-id"],
      study_id: studyId,
      role: "Owner",
      created_at: now,
    },
  );

  await createStudyVersion({
    id: versionId,
    study_id: studyId,
    version_number: 1,
    status: "Active",
    study_format: "ClassicDelphi",
    planned_round_count: 4,
    terminal_round_number: 4,
    method_rationale: "Synthetic Classical Delphi export privacy regression.",
    consensus_rule_json: {
      type: "percent_agreement",
      threshold: 80,
      agreement_min_rating: 7,
      source: "pi_defined",
      setting_process: "PI-defined before launch for synthetic regression testing.",
    },
    feedback_config_json: null,
    retention_policy_json: null,
    study_design_packet_json: null,
    config_hash: "export-privacy-config-hash",
    opened_round1_at: now,
    created_by: owner["x-user-id"],
    created_at: now,
  });

  const openResponses = [];
  for (const [index, participantId] of participantIds.entries()) {
    ensureParticipantEnrollment({
      study_id: studyId,
      version_id: versionId,
      participant_id: participantId,
      created_by_user_id: owner["x-user-id"],
    });
    openResponses.push(createResponse({
      study_id: studyId,
      version_id: versionId,
      participant_id: participantId,
      response_json: {
        text:
          `${syntheticLabels[index]} says use a shared calendar. Contact ${syntheticEmails[index]} or 555-010-${String(index + 1).padStart(4, "0")}. Internal ID ${participantId}.`,
      },
    }));
  }

  const item = createItem({
    study_id: studyId,
    version_id: versionId,
    round_number: 4,
    text: "The app should provide a shared calendar and configurable reminders.",
    provenance_type: "PanelDerived",
    created_from: "ai",
    created_by_user_id: owner["x-user-id"],
    ai_provenance_links: [
      {
        source_type: "response",
        source_id: openResponses[0].response_id,
        source_round_number: 1,
        excerpt: `${syntheticLabels[0]} source excerpt with ${syntheticEmails[0]} and ${participantIds[0]}.`,
      },
    ],
    ai_provenance_rationale: `Synthetic provenance rationale mentions ${syntheticLabels[1]} and ${participantIds[1]}.`,
  });
  updateItem(item.item_id, { status: "Published" });

  for (const [index, participantId] of participantIds.entries()) {
    createResponse({
      study_id: studyId,
      version_id: versionId,
      participant_id: participantId,
      response_json: {
        round_number: 4,
        item_id: item.item_id,
        rating: index < 7 ? 8 : 5,
        action: "keep",
        rationale_text:
          `${syntheticLabels[index]} final rationale includes ${syntheticEmails[index]}, 555-010-${String(index + 1).padStart(4, "0")}, and ${participantId}.`,
      },
    });
  }

  await writeAuditEvent({
    actor: {
      userId: participantIds[0],
      role: "participant",
      systemRoles: ["participant"],
      authSource: "invitation",
    },
    action: "response.submit",
    object: { type: "participant", id: participantIds[0] },
    details: {
      studyId,
      versionId,
      participant_id: participantIds[0],
      label: syntheticLabels[0],
    },
  });

  return { studyId, versionId };
}

test("standard export packages redact participant-linkable identifiers and classify restricted packages", async (t) => {
  const { scanExportPrivacy } = await loadModules();
  const app = await buildApp();
  t.after(async () => {
    await app.close();
  });

  const { studyId, versionId } = await seedSyntheticStudy();
  const exportTypes = [
    "final-delphi-report",
    "anonymized-response-dataset",
    "audit-package",
    "provenance-bundle",
    "complete-archive",
  ];

  const scanResults = [];
  const createdPackages = [];
  for (const exportType of exportTypes) {
    const created = await expectStatus(app, {
      method: "POST",
      url: `/studies/${studyId}/versions/${versionId}/export-packages`,
      headers: dataCustodian,
      body: { export_type: exportType },
    }, 201);

    const files = await expectStatus(app, {
      method: "GET",
      url: `/studies/${studyId}/versions/${versionId}/export-packages/${created.export_package.export_package_id}/files`,
      headers: dataCustodian,
    }, 200);

    createdPackages.push({ exportType, created, files });

    const scan = scanExportPrivacy({
      exportPackage: files.export_package,
      files: files.files,
      knownParticipantIds: participantIds,
      knownSyntheticLabels: syntheticLabels,
      knownEmailIdentifiers: syntheticEmails,
    });
    scanResults.push(scan);
  }

  const failures = scanResults.flatMap((scan) => scan.failures);
  assert.deepEqual(failures, []);

  for (const { exportType, created, files } of createdPackages) {
    assert.ok(created.export_package.privacy_metadata, `${exportType} missing privacy metadata`);
    assert.equal(files.export_package.privacy_metadata.export_name, created.export_package.privacy_metadata.export_name);
  }

  const finalScan = scanResults.find((scan) => scan.package_type === "final-delphi-report");
  assert.equal(finalScan.data_classification, "deidentified_research_report");

  const auditScan = scanResults.find((scan) => scan.package_type === "audit-package");
  assert.equal(auditScan.data_classification, "restricted_internal_admin_audit");
  assert.ok(auditScan.warnings.length > 0, "restricted audit package should warn, not fail, when raw IDs are clearly labeled");

  const archiveScan = scanResults.find((scan) => scan.package_type === "complete-archive");
  assert.equal(archiveScan.data_classification, "complete_restricted_archive");
  assert.ok(archiveScan.warnings.length > 0, "complete restricted archive should warn, not fail, when raw IDs are clearly labeled");
});
