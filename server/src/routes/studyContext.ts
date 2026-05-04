/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { writeAuditEvent } from "../core/audit.js";
import { getActor, requireRole } from "../middleware/auth.js";
import { getStudy, getStudyVersion } from "../studies/store.js";
import {
  createLocalProposalImportSuggestions,
  decideStudyContextSuggestion,
  generateParticipantDisclosure,
  getStudyContextDisclosure,
  normalizeStudyContextDisclosure,
  saveStudyContextDisclosure,
  validateStudyContextDisclosure,
} from "../stores/studyContextStore.js";

function ids(params: unknown) {
  const p = (params ?? {}) as Record<string, unknown>;
  return { studyId: String(p.studyId ?? ""), versionId: String(p.versionId ?? "") };
}

async function assertStudyVersion(studyId: string, versionId: string) {
  const study = await getStudy(studyId);
  if (!study) return null;
  const version = await getStudyVersion(versionId);
  if (!version || version.study_id !== studyId) return null;
  return { study, version };
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export async function studyContextRoutes(app: FastifyInstance) {
  const view = requireRole(["owner", "methods_steward", "privacy_lead", "data_custodian", "admin", "maintainer"]);
  const manage = requireRole(["owner", "methods_steward", "admin", "maintainer"]);

  for (const prefix of ["", "/api"]) {
    app.get(`${prefix}/studies/:studyId/versions/:versionId/context-disclosure`, { preHandler: view }, async (req, reply) => {
      const { studyId, versionId } = ids(req.params);
      const found = await assertStudyVersion(studyId, versionId);
      if (!found) return reply.code(404).send({ error: "study_version_not_found" });
      const actor = getActor(req);
      const context = getStudyContextDisclosure({
        study_id: studyId,
        version_id: versionId,
        actor_user_id: actor.userId,
        study_title: found.study.title,
      });
      return reply.send({ context, validation: validateStudyContextDisclosure(context) });
    });

    app.put(`${prefix}/studies/:studyId/versions/:versionId/context-disclosure`, { preHandler: manage }, async (req, reply) => {
      const { studyId, versionId } = ids(req.params);
      const found = await assertStudyVersion(studyId, versionId);
      if (!found) return reply.code(404).send({ error: "study_version_not_found" });
      const actor = getActor(req);
      const current = getStudyContextDisclosure({
        study_id: studyId,
        version_id: versionId,
        actor_user_id: actor.userId,
        study_title: found.study.title,
      });
      const context = saveStudyContextDisclosure(
        normalizeStudyContextDisclosure(current, (req.body ?? {}) as Record<string, unknown>, actor.userId),
      );
      await writeAuditEvent({
        actor,
        action: current.status === "optional" && context.status !== "optional"
          ? "study_context.metadata_created"
          : "study_context.metadata_updated",
        object: { type: "study_context_disclosure", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          funding_status: context.funding.funding_status,
          material_conditions: validateStudyContextDisclosure(context).material_conditions,
        },
      });
      return reply.send({ context, validation: validateStudyContextDisclosure(context) });
    });

    app.post(`${prefix}/studies/:studyId/versions/:versionId/context-disclosure/generate-participant-disclosure`, { preHandler: manage }, async (req, reply) => {
      const { studyId, versionId } = ids(req.params);
      const found = await assertStudyVersion(studyId, versionId);
      if (!found) return reply.code(404).send({ error: "study_version_not_found" });
      const actor = getActor(req);
      const current = getStudyContextDisclosure({
        study_id: studyId,
        version_id: versionId,
        actor_user_id: actor.userId,
        study_title: found.study.title,
      });
      const context = saveStudyContextDisclosure(generateParticipantDisclosure(current));
      await writeAuditEvent({
        actor,
        action: "study_context.participant_disclosure_generated",
        object: { type: "study_context_disclosure", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          review_recommended: context.participant_disclosure.requires_review,
          review_reasons: context.participant_disclosure.review_reasons,
        },
      });
      return reply.send({ context, validation: validateStudyContextDisclosure(context) });
    });

    app.post(`${prefix}/studies/:studyId/versions/:versionId/context-disclosure/proposal-import`, { preHandler: manage }, async (req, reply) => {
      const { studyId, versionId } = ids(req.params);
      const found = await assertStudyVersion(studyId, versionId);
      if (!found) return reply.code(404).send({ error: "study_version_not_found" });
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const sourceText = typeof body.source_text === "string" ? body.source_text.trim() : "";
      if (!sourceText) return reply.code(400).send({ error: "source_text_required" });
      const sourceName = typeof body.source_document_name === "string" && body.source_document_name.trim()
        ? body.source_document_name.trim()
        : "pasted proposal text";
      const current = getStudyContextDisclosure({
        study_id: studyId,
        version_id: versionId,
        actor_user_id: actor.userId,
        study_title: found.study.title,
      });
      const context = saveStudyContextDisclosure(
        createLocalProposalImportSuggestions({
          record: current,
          source_name: sourceName,
          source_text: sourceText,
          source_text_hash: sha256(sourceText),
        }),
      );
      await writeAuditEvent({
        actor,
        action: "study_context.ai_extraction_invoked",
        object: { type: "study_context_disclosure", id: `${studyId}:${versionId}` },
        details: {
          studyId,
          versionId,
          extraction_mode: context.proposal_import.extraction_mode,
          source_text_hash: context.proposal_import.source_text_hash,
          suggestion_count: context.proposal_import.suggestions.length,
          participant_facing: false,
        },
      });
      return reply.send({ context, validation: validateStudyContextDisclosure(context) });
    });

    app.post(`${prefix}/studies/:studyId/versions/:versionId/context-disclosure/proposal-suggestions/:suggestionId/decision`, { preHandler: manage }, async (req, reply) => {
      const { studyId, versionId } = ids(req.params);
      const suggestionId = String(((req.params ?? {}) as Record<string, unknown>).suggestionId ?? "");
      const found = await assertStudyVersion(studyId, versionId);
      if (!found) return reply.code(404).send({ error: "study_version_not_found" });
      const actor = getActor(req);
      const body = (req.body ?? {}) as Record<string, unknown>;
      const action = body.action === "accept" || body.action === "edit" || body.action === "reject" ? body.action : null;
      if (!action) return reply.code(400).send({ error: "valid_suggestion_action_required" });
      const current = getStudyContextDisclosure({
        study_id: studyId,
        version_id: versionId,
        actor_user_id: actor.userId,
        study_title: found.study.title,
      });
      const decisionInput: Parameters<typeof decideStudyContextSuggestion>[0] = {
        record: current,
        suggestion_id: suggestionId,
        action,
        actor_user_id: actor.userId,
      };
      if (Object.hasOwn(body, "edited_value")) {
        decisionInput.edited_value = body.edited_value as string | boolean | null;
      }
      const context = saveStudyContextDisclosure(decideStudyContextSuggestion(decisionInput));
      await writeAuditEvent({
        actor,
        action: `study_context.ai_suggestion_${action}`,
        object: { type: "study_context_ai_suggestion", id: suggestionId },
        details: {
          studyId,
          versionId,
          suggestion_id: suggestionId,
          participant_disclosure_uses_only_accepted_metadata: true,
        },
      });
      return reply.send({ context, validation: validateStudyContextDisclosure(context) });
    });
  }
}
