/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

// server/src/studies/routes.ts
// Ticket 3 routes: Study + StudyVersion + dual signoff gate (Owner + MethodsSteward)
// Ticket 4 (partial): set consensus rule (required before Round 1 opens; locked after Draft)
// Ticket 11: study design declaration (modified vs classic, planned rounds, terminal round, rationale)

import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";

import { roleFromHeader } from "./roleMap.js";
import { sha256Json } from "./hash.js";

import type {
  Study,
  StudyAssignment,
  StudyFormat,
  StudyVersion,
  StudyVersionSignoff,
} from "./types.js";
import {
  createStudy,
  listStudies,
  getStudy,
  createStudyVersion,
  getStudyVersion,
  listStudyVersions,
  updateStudy,
  updateStudyVersion,
  upsertSignoff,
  listSignoffs,
  addAssignment,
  removeAssignment,
  listAssignments,
} from "./store.js";

import { writeAuditEvent } from "../core/audit.js";
import { resolveActor } from "../middleware/auth.js";
import { getUser, getUserByEmail } from "../auth/userStore.js";
import {
  activeResearchQuestionsFromPacket,
  normalizeResearchQuestionsInPacket,
  researchQuestionAuditChanges,
} from "./researchQuestions.js";

async function actorFromRequest(req: Parameters<typeof resolveActor>[0]) {
  const actor = await resolveActor(req);
  if (process.env.EDELPHI_AUTH_REQUIRE_SESSION === "true" && actor.authSource !== "session") {
    const err: any = new Error("session_required");
    err.statusCode = 401;
    throw err;
  }
  return actor;
}

function requireHeaderRole(role: string, allowed: string[]) {
  if (!allowed.includes(role)) {
    const err: any = new Error("forbidden");
    err.statusCode = 403;
    throw err;
  }
}

function demoGovernanceAssignmentsEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.EDELPHI_DEMO_GOVERNANCE_ASSIGNMENTS !== "false";
}

function demoGovernanceUser(email: string) {
  return process.env.EDELPHI_DEMO_GOVERNANCE_ASSIGNMENTS === "true" ? getUserByEmail(email) : null;
}

function isStudyFormat(value: unknown): value is StudyFormat {
  return value === "ModifiedDelphi" || value === "ClassicDelphi";
}

function expectedRoundPlan(studyFormat: StudyFormat): {
  planned_round_count: number;
  terminal_round_number: number;
} {
  if (studyFormat === "ModifiedDelphi") {
    return { planned_round_count: 3, terminal_round_number: 3 };
  }

  return { planned_round_count: 4, terminal_round_number: 4 };
}

function hasNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const consensusRuleSources = [
  "pi_defined",
  "governance_team_defined",
  "panel_informed_pre_round",
  "stakeholder_informed_pre_round",
  "protocol_irb_defined",
] as const;

const preRoundConsensusStatuses = [
  "not_required",
  "planned",
  "collected",
  "reviewed",
  "finalized",
] as const;

const allowedConsensusThresholds = [60, 70, 80, 90] as const;

function consensusSourceRequiresPreRoundInput(source: string): boolean {
  return source === "panel_informed_pre_round" || source === "stakeholder_informed_pre_round";
}

function normalizeConsensusRule(rule: unknown): { rule?: Record<string, unknown>; error?: string } {
  if (!isRecord(rule)) return { error: "consensus_rule_required" };

  if (rule.type !== "percent_agreement") return { error: "unsupported_consensus_rule_type" };
  if (
    typeof rule.threshold !== "number" ||
    !Number.isFinite(rule.threshold) ||
    !allowedConsensusThresholds.includes(rule.threshold as any)
  ) {
    return { error: "invalid_consensus_threshold" };
  }
  if (
    typeof rule.agreement_min_rating !== "number" ||
    !Number.isFinite(rule.agreement_min_rating) ||
    rule.agreement_min_rating < 1 ||
    rule.agreement_min_rating > 9
  ) {
    return { error: "invalid_agreement_min_rating" };
  }

  if (rule.source !== undefined && (typeof rule.source !== "string" || !consensusRuleSources.includes(rule.source as any))) {
    return { error: "invalid_consensus_rule_source" };
  }
  const source = typeof rule.source === "string" ? rule.source : "pi_defined";
  const settingProcess = hasNonEmptyText(rule.setting_process)
    ? rule.setting_process.trim()
    : "The Study Owner defines the consensus threshold before Round 1 and submits it for governance signoff.";
  const rawInput = isRecord(rule.pre_round_consensus_input) ? rule.pre_round_consensus_input : {};
  const inputRequired = consensusSourceRequiresPreRoundInput(source);
  if (
    rawInput.status !== undefined &&
    (typeof rawInput.status !== "string" || !preRoundConsensusStatuses.includes(rawInput.status as any))
  ) {
    return { error: "invalid_pre_round_consensus_status" };
  }
  const status = typeof rawInput.status === "string"
    ? rawInput.status
    : inputRequired
      ? "planned"
      : "not_required";
  const prompt = hasNonEmptyText(rawInput.prompt) ? rawInput.prompt.trim() : "";
  const summary = hasNonEmptyText(rawInput.summary) ? rawInput.summary.trim() : "";

  return {
    rule: {
      ...rule,
      source,
      setting_process: settingProcess,
      pre_round_consensus_input: {
        enabled: inputRequired,
        status,
        prompt,
        summary,
        counts_as_delphi_round: false,
      },
      finalized_before_round_1: true,
    },
  };
}

function validateConsensusRuleForSignoff(rule: unknown): string | null {
  const normalized = normalizeConsensusRule(rule);
  if (!normalized.rule) return normalized.error ?? "consensus_rule_invalid";

  const source = String(normalized.rule.source);
  if (!hasNonEmptyText(normalized.rule.setting_process)) return "consensus_setting_process_missing";
  if (!consensusSourceRequiresPreRoundInput(source)) return null;

  const input = isRecord(normalized.rule.pre_round_consensus_input)
    ? normalized.rule.pre_round_consensus_input
    : {};
  if (!hasNonEmptyText(input.prompt)) return "pre_round_consensus_prompt_missing";
  if (!hasNonEmptyText(input.summary)) return "pre_round_consensus_summary_missing";
  if (input.status !== "reviewed" && input.status !== "finalized") {
    return "pre_round_consensus_input_not_reviewed";
  }

  return null;
}

function isStudyRole(value: unknown): value is StudyAssignment["role"] {
  return (
    value === "Owner" ||
    value === "MethodsSteward" ||
    value === "PrivacyLead" ||
    value === "DataCustodian" ||
    value === "Maintainer"
  );
}

export async function studiesRoutes(app: FastifyInstance) {
  // GET /studies  (staff roles only)
  app.get("/studies", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "methods_steward", "privacy_lead", "data_custodian", "admin"]);

    const query = (req.query ?? {}) as { include_archived?: string };
    const includeArchived = query.include_archived === "true";
    const allStudies = await listStudies({ includeArchived });
    const canSeeAll =
      actor.role === "admin" ||
      actor.role === "maintainer" ||
      actor.role === "privacy_lead" ||
      actor.role === "data_custodian";
    const studies = canSeeAll
      ? allStudies
      : (
          await Promise.all(
            allStudies.map(async (study) => ({
              study,
              assignments: await listAssignments(study.id),
            })),
          )
        )
          .filter((entry) => entry.assignments.some((assignment) => assignment.user_id === actor.userId))
          .map((entry) => entry.study);

    await writeAuditEvent({
      action: "study.list",
      actor,
      object: { type: "study" },
      details: { count: studies.length, include_archived: includeArchived },
    });

    return reply.send({ studies });
  });

  // GET /studies/:studyId
  app.get("/studies/:studyId", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "methods_steward", "privacy_lead", "data_custodian", "admin"]);

    const { studyId } = req.params as any;
    const study = await getStudy(studyId);
    if (!study) return reply.code(404).send({ error: "study_not_found" });

    await writeAuditEvent({
      action: "study.get",
      actor,
      object: { type: "study", id: studyId },
      details: { study_id: studyId },
    });

    return reply.send({ study });
  });

  // GET /studies/:studyId/versions
  app.get("/studies/:studyId/versions", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "methods_steward", "privacy_lead", "data_custodian", "admin"]);

    const { studyId } = req.params as any;
    const study = await getStudy(studyId);
    if (!study) return reply.code(404).send({ error: "study_not_found" });

    const studyVersions = await listStudyVersions(studyId);

    await writeAuditEvent({
      action: "study_version.list",
      actor,
      object: { type: "study", id: studyId },
      details: { study_id: studyId, count: studyVersions.length },
    });

    return reply.send({ studyVersions });
  });

  // GET /studies/:studyId/versions/:versionId
  app.get("/studies/:studyId/versions/:versionId", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "methods_steward", "privacy_lead", "data_custodian", "admin"]);

    const { studyId, versionId } = req.params as any;
    const studyVersion = await getStudyVersion(versionId);
    if (!studyVersion || studyVersion.study_id !== studyId) {
      return reply.code(404).send({ error: "study_version_not_found" });
    }

    await writeAuditEvent({
      action: "study_version.get",
      actor,
      object: { type: "study_version", id: versionId },
      details: { study_id: studyId },
    });

    return reply.send({ studyVersion });
  });

  // GET /studies/:studyId/versions/:versionId/signoffs
  app.get("/studies/:studyId/versions/:versionId/signoffs", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "methods_steward", "privacy_lead", "data_custodian", "admin"]);

    const { studyId, versionId } = req.params as any;
    const studyVersion = await getStudyVersion(versionId);
    if (!studyVersion || studyVersion.study_id !== studyId) {
      return reply.code(404).send({ error: "study_version_not_found" });
    }

    const signoffs = await listSignoffs(versionId);

    await writeAuditEvent({
      action: "study_version.signoff_list",
      actor,
      object: { type: "study_version", id: versionId },
      details: { study_id: studyId, count: signoffs.length },
    });

    return reply.send({ signoffs });
  });

  app.get("/studies/:studyId/assignments", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "privacy_lead", "admin", "maintainer"]);

    const { studyId } = req.params as any;
    const study = await getStudy(studyId);
    if (!study) return reply.code(404).send({ error: "study_not_found" });

    const assignments = await listAssignments(studyId);

    await writeAuditEvent({
      action: "study.assignment.list",
      actor,
      object: { type: "study", id: studyId },
      details: { count: assignments.length },
    });

    return reply.send({ assignments });
  });

  app.post("/studies/:studyId/assignments", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "admin", "maintainer"]);

    const { studyId } = req.params as any;
    const study = await getStudy(studyId);
    if (!study) return reply.code(404).send({ error: "study_not_found" });

    const body = (req.body ?? {}) as { user_id?: string; role?: unknown };
    if (!body.user_id || !isStudyRole(body.role)) {
      return reply.code(400).send({ error: "user_id_and_valid_study_role_required" });
    }

    const assignedUser = getUser(body.user_id);
    if (!assignedUser || assignedUser.disabled_at) {
      return reply.code(404).send({ error: "active_user_not_found" });
    }

    const assignment: StudyAssignment = {
      user_id: body.user_id,
      study_id: studyId,
      role: body.role,
      created_at: new Date().toISOString(),
    };
    await addAssignment(assignment);

    await writeAuditEvent({
      action: "study.assignment.upsert",
      actor,
      object: { type: "study", id: studyId },
      details: { assigned_user_id: assignment.user_id, role: assignment.role },
    });

    return reply.code(201).send({ assignment });
  });

  app.delete("/studies/:studyId/assignments/:userId", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "admin", "maintainer"]);

    const { studyId, userId } = req.params as any;
    const study = await getStudy(studyId);
    if (!study) return reply.code(404).send({ error: "study_not_found" });

    if (actor.role === "owner" && actor.userId === userId) {
      return reply.code(409).send({ error: "owner_cannot_remove_own_assignment" });
    }

    const removed = await removeAssignment(studyId, userId);
    if (!removed) return reply.code(404).send({ error: "assignment_not_found" });

    await writeAuditEvent({
      action: "study.assignment.remove",
      actor,
      object: { type: "study", id: studyId },
      details: { removed_user_id: userId },
    });

    return reply.send({ ok: true });
  });

  // POST /studies  (Owner/admin only)
  app.post("/studies", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "admin"]);

    const body = (req.body ?? {}) as { title?: string; description?: string };
    const now = new Date().toISOString();

    const study: Study = {
      id: randomUUID(),
      title: (body.title ?? "Untitled Study").trim(),
      description: (body.description ?? "").trim(),
      created_by: actor.userId,
      created_at: now,
    };

    const ownerAssignment: StudyAssignment = {
      user_id: actor.userId,
      study_id: study.id,
      role: "Owner",
      created_at: now,
    };

    await createStudy(study, ownerAssignment);

    const demoSteward = demoGovernanceUser("steward@example.test");
    if (demoSteward && demoSteward.user_id !== actor.userId) {
      await addAssignment({
        user_id: demoSteward.user_id,
        study_id: study.id,
        role: "MethodsSteward",
        created_at: now,
      });
    }

    const demoPrivacyLead = demoGovernanceUser("privacy@example.test");
    if (demoPrivacyLead && demoPrivacyLead.user_id !== actor.userId) {
      await addAssignment({
        user_id: demoPrivacyLead.user_id,
        study_id: study.id,
        role: "PrivacyLead",
        created_at: now,
      });
    }

    const demoCustodian = demoGovernanceUser("custodian@example.test");
    if (demoCustodian && demoCustodian.user_id !== actor.userId) {
      await addAssignment({
        user_id: demoCustodian.user_id,
        study_id: study.id,
        role: "DataCustodian",
        created_at: now,
      });
    }

    await writeAuditEvent({
      action: "study.create",
      actor,
      object: { type: "study", id: study.id },
      details: { title: study.title },
    });

    return reply.code(201).send({ study });
  });

  // PATCH /studies/:studyId/archive
  // Hides a study from default saved-study lists while preserving records and audit history.
  app.patch("/studies/:studyId/archive", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "admin"]);

    const { studyId } = req.params as any;
    const study = await getStudy(studyId);
    if (!study) return reply.code(404).send({ error: "study_not_found" });

    if (study.archived_at) {
      return reply.code(409).send({ error: "study_already_archived" });
    }

    const archivedAt = new Date().toISOString();
    const updated = await updateStudy(studyId, {
      archived_at: archivedAt,
      archived_by: actor.userId,
    });

    await writeAuditEvent({
      action: "study.archive",
      actor,
      object: { type: "study", id: studyId },
      details: { study_id: studyId, archived_at: archivedAt },
    });

    return reply.send({ study: updated });
  });

  // PATCH /studies/:studyId/versions/:versionId/design
  // Ticket 11: study designer must declare method design before Round 1.
  // These settings are locked once the version leaves Draft.
  app.patch("/studies/:studyId/versions/:versionId/design", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "admin"]);

    const { studyId, versionId } = req.params as any;
    const v = await getStudyVersion(versionId);

    if (!v || v.study_id !== studyId) {
      return reply.code(404).send({ error: "study_version_not_found" });
    }

    if (v.status !== "Draft") {
      return reply.code(409).send({ error: "study_design_locked" });
    }

    const body = (req.body ?? {}) as {
      study_format?: unknown;
      planned_round_count?: unknown;
      terminal_round_number?: unknown;
      method_rationale?: unknown;
    };

    if (!isStudyFormat(body.study_format)) {
      return reply.code(400).send({ error: "invalid_study_format" });
    }

    const expected = expectedRoundPlan(body.study_format);

    if (body.planned_round_count !== expected.planned_round_count) {
      return reply.code(400).send({
        error: "invalid_planned_round_count",
        expected: expected.planned_round_count,
      });
    }

    if (body.terminal_round_number !== expected.terminal_round_number) {
      return reply.code(400).send({
        error: "invalid_terminal_round_number",
        expected: expected.terminal_round_number,
      });
    }

    if (!hasNonEmptyText(body.method_rationale)) {
      return reply.code(400).send({ error: "method_rationale_required" });
    }

    const updated = await updateStudyVersion(versionId, {
      study_format: body.study_format,
      planned_round_count: expected.planned_round_count,
      terminal_round_number: expected.terminal_round_number,
      method_rationale: body.method_rationale.trim(),
    });

    await writeAuditEvent({
      action: "study_version.set_design",
      actor,
      object: { type: "study_version", id: versionId },
      details: {
        study_id: studyId,
        study_format: updated.study_format,
        planned_round_count: updated.planned_round_count,
        terminal_round_number: updated.terminal_round_number,
      },
    });

    return reply.send({ studyVersion: updated });
  });

  // PATCH /studies/:studyId/versions/:versionId/consensus-rule
  // Ticket 4: consensus rule must be set before Round 1 opens.
  // We only allow setting it while Draft so it becomes part of the signed-off config.
  app.patch("/studies/:studyId/versions/:versionId/consensus-rule", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "admin"]);

    const { studyId, versionId } = req.params as any;
    const v = await getStudyVersion(versionId);

    if (!v || v.study_id !== studyId) return reply.code(404).send({ error: "study_version_not_found" });

    if (v.status !== "Draft") return reply.code(409).send({ error: "consensus_rule_locked" });

    const body = (req.body ?? {}) as { consensus_rule_json?: unknown };
    if (body.consensus_rule_json === undefined || body.consensus_rule_json === null) {
      return reply.code(400).send({ error: "consensus_rule_required" });
    }

    const normalized = normalizeConsensusRule(body.consensus_rule_json);
    if (!normalized.rule) {
      return reply.code(400).send({ error: normalized.error ?? "consensus_rule_invalid" });
    }

    const updated = await updateStudyVersion(versionId, {
      consensus_rule_json: normalized.rule,
    });

    await writeAuditEvent({
      action: "study_version.set_consensus_rule",
      actor,
      object: { type: "study_version", id: versionId },
      details: {
        study_id: studyId,
        source: normalized.rule.source,
        pre_round_consensus_input_status:
          isRecord(normalized.rule.pre_round_consensus_input)
            ? normalized.rule.pre_round_consensus_input.status
            : null,
      },
    });

    return reply.send({ studyVersion: updated });
  });

  // PATCH /studies/:studyId/versions/:versionId/wizard-packet
  // Stores the full Study Builder packet while the version is still draft.
  app.patch("/studies/:studyId/versions/:versionId/wizard-packet", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "admin"]);

    const { studyId, versionId } = req.params as any;
    const v = await getStudyVersion(versionId);

    if (!v || v.study_id !== studyId) return reply.code(404).send({ error: "study_version_not_found" });

    if (v.status !== "Draft") return reply.code(409).send({ error: "study_design_packet_locked" });

    const body = (req.body ?? {}) as { study_design_packet_json?: unknown };
    const rawPacket = body.study_design_packet_json;
    const normalizedPacket = isRecord(rawPacket) ? normalizeResearchQuestionsInPacket(rawPacket) : null;
    if (normalizedPacket && "error" in normalizedPacket) {
      return reply.code(400).send({ error: normalizedPacket.error });
    }
    const packet = normalizedPacket && "packet" in normalizedPacket ? normalizedPacket.packet : rawPacket;
    if (!isRecord(packet)) {
      return reply.code(400).send({ error: "study_design_packet_required" });
    }

    const title = typeof packet.title === "string" ? packet.title.trim() : "";
    const description = typeof packet.description === "string" ? packet.description.trim() : "";
    const roundOneMode = typeof packet.roundOneMode === "string" ? packet.roundOneMode : null;
    const modifiedDesignAcknowledged = packet.modifiedDesignAcknowledged === true;
    const modifiedDesignRationale =
      typeof packet.modifiedDesignRationale === "string" ? packet.modifiedDesignRationale.trim() : "";

    if (roundOneMode !== null && roundOneMode !== "open-ended" && roundOneMode !== "structured") {
      return reply.code(400).send({ error: "invalid_round1_mode" });
    }

    if (roundOneMode === "structured") {
      if (!modifiedDesignAcknowledged) {
        return reply.code(400).send({ error: "modified_delphi_bias_warning_acknowledgement_required" });
      }

      if (!hasNonEmptyText(modifiedDesignRationale)) {
        return reply.code(400).send({ error: "modified_delphi_rationale_required" });
      }
    }

    if (title) {
      await updateStudy(studyId, {
        title,
        ...(description ? { description } : {}),
      });
    }

    const updated = await updateStudyVersion(versionId, {
      study_design_packet_json: packet,
    });

    const researchQuestionChanges = researchQuestionAuditChanges(v.study_design_packet_json, packet);
    for (const change of researchQuestionChanges) {
      await writeAuditEvent({
        action: `study_version.research_question.${change.action}`,
        actor,
        object: { type: "study_version", id: versionId },
        details: {
          study_id: studyId,
          study_version_id: versionId,
          research_question_id: change.researchQuestionId,
          previous_value: change.previousValue,
          new_value: change.newValue,
        },
      });
    }

    await writeAuditEvent({
      action: "study_version.save_wizard_packet",
      actor,
      object: { type: "study_version", id: versionId },
      details: {
        study_id: studyId,
        synced_study_title: Boolean(title),
        round1_mode: roundOneMode,
        active_research_question_count: activeResearchQuestionsFromPacket(packet).length,
        modified_delphi_bias_warning_acknowledged:
          roundOneMode === "structured" ? modifiedDesignAcknowledged : null,
      },
    });

    return reply.send({ studyVersion: updated });
  });

  // POST /studies/:studyId/versions  (Owner/admin only)
  app.post("/studies/:studyId/versions", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "admin"]);

    const { studyId } = req.params as any;

    const study = await getStudy(studyId);
    if (!study) return reply.code(404).send({ error: "study_not_found" });

    const versions = await listStudyVersions(studyId);
    const nextVersion = (versions.at(-1)?.version_number ?? 0) + 1;

    const now = new Date().toISOString();

    const v: StudyVersion = {
      id: randomUUID(),
      study_id: studyId,
      version_number: nextVersion,
      status: "Draft",

      study_format: null,
      planned_round_count: null,
      terminal_round_number: null,
      method_rationale: null,

      consensus_rule_json: null,
      feedback_config_json: null,
      retention_policy_json: null,
      study_design_packet_json: null,

      config_hash: null,
      opened_round1_at: null,

      created_by: actor.userId,
      created_at: now,
    };

    await createStudyVersion(v);

    await writeAuditEvent({
      action: "study_version.create",
      actor,
      object: { type: "study_version", id: v.id },
      details: { study_id: studyId, version_number: nextVersion },
    });

    return reply.code(201).send({ studyVersion: v });
  });

  // POST /studies/:studyId/versions/:versionId/submit-for-signoff  (Owner/admin only)
  app.post("/studies/:studyId/versions/:versionId/submit-for-signoff", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "admin"]);

    const { studyId, versionId } = req.params as any;
    const v = await getStudyVersion(versionId);

    if (!v || v.study_id !== studyId) return reply.code(404).send({ error: "study_version_not_found" });
    if (v.status !== "Draft") return reply.code(409).send({ error: "not_draft" });

    if (!v.study_format) {
      return reply.code(409).send({ error: "study_format_missing" });
    }

    if (v.planned_round_count === null) {
      return reply.code(409).send({ error: "planned_round_count_missing" });
    }

    if (v.terminal_round_number === null) {
      return reply.code(409).send({ error: "terminal_round_number_missing" });
    }

    if (!hasNonEmptyText(v.method_rationale)) {
      return reply.code(409).send({ error: "method_rationale_missing" });
    }

    if (v.consensus_rule_json === null) {
      return reply.code(409).send({ error: "consensus_rule_missing" });
    }

    const consensusRuleBlocker = validateConsensusRuleForSignoff(v.consensus_rule_json);
    if (consensusRuleBlocker) {
      return reply.code(409).send({ error: consensusRuleBlocker });
    }

    if (v.study_design_packet_json === null) {
      return reply.code(409).send({ error: "study_design_packet_missing" });
    }
    if (activeResearchQuestionsFromPacket(v.study_design_packet_json).length === 0) {
      return reply.code(409).send({ error: "active_research_question_required" });
    }

    const configHash = sha256Json({
      study_id: v.study_id,
      version_number: v.version_number,
      study_format: v.study_format,
      planned_round_count: v.planned_round_count,
      terminal_round_number: v.terminal_round_number,
      method_rationale: v.method_rationale,
      consensus_rule_json: v.consensus_rule_json,
      feedback_config_json: v.feedback_config_json,
      retention_policy_json: v.retention_policy_json,
      study_design_packet_json: v.study_design_packet_json,
    });

    const updated = await updateStudyVersion(versionId, {
      status: "ReadyForSignoff",
      config_hash: configHash,
    });

    await writeAuditEvent({
      action: "study_version.submit_for_signoff",
      actor,
      object: { type: "study_version", id: versionId },
      details: { study_id: studyId, config_hash: configHash },
    });

    return reply.send({ studyVersion: updated });
  });

  // POST /studies/:studyId/versions/:versionId/signoff  (Owner or MethodsSteward; admin allowed)
  app.post("/studies/:studyId/versions/:versionId/signoff", async (req, reply) => {
    const actor = await actorFromRequest(req);
    const { studyId, versionId } = req.params as any;
    const v = await getStudyVersion(versionId);

    if (!v || v.study_id !== studyId) return reply.code(404).send({ error: "study_version_not_found" });
    if (v.status !== "ReadyForSignoff") return reply.code(409).send({ error: "not_ready_for_signoff" });

    if (
      actor.role === "unassigned" &&
      actor.email === "steward@example.test" &&
      actor.systemRoles.includes("methods_steward") &&
      demoGovernanceAssignmentsEnabled()
    ) {
      await addAssignment({
        user_id: actor.userId,
        study_id: studyId,
        role: "MethodsSteward",
        created_at: new Date().toISOString(),
      });
      actor.role = "methods_steward";
    }

    requireHeaderRole(actor.role, ["owner", "methods_steward", "admin"]);

    const canonical = roleFromHeader(actor.role);

    let required_role: "Owner" | "MethodsSteward";
    if (actor.role === "admin") required_role = "Owner";
    else if (canonical === "Owner") required_role = "Owner";
    else if (canonical === "MethodsSteward") required_role = "MethodsSteward";
    else return reply.code(403).send({ error: "forbidden" });

    const now = new Date().toISOString();
    const body = (req.body ?? {}) as { note?: string };

    const signoff: StudyVersionSignoff = {
      study_version_id: versionId,
      required_role,
      signed_by_user_id: actor.userId,
      signed_at: now,
      ...(body.note ? { note: body.note } : {}),
    };

    await upsertSignoff(signoff);

    await writeAuditEvent({
      action: "study_version.signoff",
      actor,
      object: { type: "study_version", id: versionId },
      details: { study_id: studyId, required_role },
    });

    return reply.send({ signoff });
  });

  // POST /studies/:studyId/versions/:versionId/open-round-1
  // Ticket 4 + Ticket 11:
  // cannot open Round 1 unless consensus rule and declared study design are present.
  app.post("/studies/:studyId/versions/:versionId/open-round-1", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "admin"]);

    const { studyId, versionId } = req.params as any;
    const v = await getStudyVersion(versionId);

    if (!v || v.study_id !== studyId) return reply.code(404).send({ error: "study_version_not_found" });

    if (v.status !== "Active") return reply.code(409).send({ error: "study_version_not_active" });

    if (!v.study_format) return reply.code(409).send({ error: "study_format_missing" });
    if (v.planned_round_count === null) return reply.code(409).send({ error: "planned_round_count_missing" });
    if (v.terminal_round_number === null) {
      return reply.code(409).send({ error: "terminal_round_number_missing" });
    }
    if (!hasNonEmptyText(v.method_rationale)) {
      return reply.code(409).send({ error: "method_rationale_missing" });
    }

    if (v.consensus_rule_json === null) return reply.code(409).send({ error: "consensus_rule_missing" });
    if (activeResearchQuestionsFromPacket(v.study_design_packet_json).length === 0) {
      return reply.code(409).send({ error: "active_research_question_required" });
    }

    if (v.opened_round1_at !== null) return reply.code(409).send({ error: "round1_already_opened" });

    const openedAt = new Date().toISOString();
    const updated = await updateStudyVersion(versionId, { opened_round1_at: openedAt });

    await writeAuditEvent({
      action: "study_version.open_round1",
      actor,
      object: { type: "study_version", id: versionId },
      details: { study_id: studyId, opened_round1_at: openedAt },
    });

    return reply.send({ studyVersion: updated });
  });

  // POST /studies/:studyId/versions/:versionId/activate  (Owner/admin only)
  app.post("/studies/:studyId/versions/:versionId/activate", async (req, reply) => {
    const actor = await actorFromRequest(req);
    requireHeaderRole(actor.role, ["owner", "admin"]);

    const { studyId, versionId } = req.params as any;
    const v = await getStudyVersion(versionId);

    if (!v || v.study_id !== studyId) return reply.code(404).send({ error: "study_version_not_found" });
    if (v.status !== "ReadyForSignoff") return reply.code(409).send({ error: "not_ready_for_signoff" });

    const signoffs = await listSignoffs(versionId);
    const hasOwner = signoffs.some((s: any) => s.required_role === "Owner");
    const hasSteward = signoffs.some((s: any) => s.required_role === "MethodsSteward");

    if (!hasOwner || !hasSteward) {
      return reply.code(409).send({ error: "missing_required_signoffs", hasOwner, hasSteward });
    }

    const updated = await updateStudyVersion(versionId, { status: "Active" });

    await writeAuditEvent({
      action: "study_version.activate",
      actor,
      object: { type: "study_version", id: versionId },
      details: { study_id: studyId, config_hash: updated.config_hash },
    });

    return reply.send({ studyVersion: updated });
  });
}
