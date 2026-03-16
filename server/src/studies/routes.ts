// server/src/studies/routes.ts
// Ticket 3 routes: Study + StudyVersion + dual signoff gate (Owner + MethodsSteward)
// Ticket 4 (partial): set consensus rule (required before Round 1 opens; locked after Draft)
// Ticket 11: study design declaration (modified vs classic, planned rounds, terminal round, rationale)

import type { FastifyInstance, FastifyRequest } from "fastify";
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
  getStudy,
  createStudyVersion,
  getStudyVersion,
  listStudyVersions,
  updateStudyVersion,
  upsertSignoff,
  listSignoffs,
} from "./store.js";

import { writeAuditEvent } from "../core/audit.js";

function actorFromHeaders(req: FastifyRequest) {
  const userId = String(req.headers["x-user-id"] ?? "anonymous");
  const role = String(req.headers["x-user-role"] ?? "anonymous");
  return { userId, role };
}

function requireHeaderRole(role: string, allowed: string[]) {
  if (!allowed.includes(role)) {
    const err: any = new Error("forbidden");
    err.statusCode = 403;
    throw err;
  }
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

export async function studiesRoutes(app: FastifyInstance) {
  // POST /studies  (Owner/admin only)
  app.post("/studies", async (req, reply) => {
    const actor = actorFromHeaders(req);
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

    await writeAuditEvent({
      action: "study.create",
      actor,
      object: { type: "study", id: study.id },
      details: { title: study.title },
    });

    return reply.code(201).send({ study });
  });

  // PATCH /studies/:studyId/versions/:versionId/design
  // Ticket 11: study designer must declare method design before Round 1.
  // These settings are locked once the version leaves Draft.
  app.patch("/studies/:studyId/versions/:versionId/design", async (req, reply) => {
    const actor = actorFromHeaders(req);
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
    const actor = actorFromHeaders(req);
    requireHeaderRole(actor.role, ["owner", "admin"]);

    const { studyId, versionId } = req.params as any;
    const v = await getStudyVersion(versionId);

    if (!v || v.study_id !== studyId) return reply.code(404).send({ error: "study_version_not_found" });

    if (v.status !== "Draft") return reply.code(409).send({ error: "consensus_rule_locked" });

    const body = (req.body ?? {}) as { consensus_rule_json?: unknown };
    if (body.consensus_rule_json === undefined || body.consensus_rule_json === null) {
      return reply.code(400).send({ error: "consensus_rule_required" });
    }

    const updated = await updateStudyVersion(versionId, {
      consensus_rule_json: body.consensus_rule_json,
    });

    await writeAuditEvent({
      action: "study_version.set_consensus_rule",
      actor,
      object: { type: "study_version", id: versionId },
      details: { study_id: studyId },
    });

    return reply.send({ studyVersion: updated });
  });

  // POST /studies/:studyId/versions  (Owner/admin only)
  app.post("/studies/:studyId/versions", async (req, reply) => {
    const actor = actorFromHeaders(req);
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
    const actor = actorFromHeaders(req);
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
    const actor = actorFromHeaders(req);
    requireHeaderRole(actor.role, ["owner", "methods_steward", "admin"]);

    const { studyId, versionId } = req.params as any;
    const v = await getStudyVersion(versionId);

    if (!v || v.study_id !== studyId) return reply.code(404).send({ error: "study_version_not_found" });
    if (v.status !== "ReadyForSignoff") return reply.code(409).send({ error: "not_ready_for_signoff" });

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
    const actor = actorFromHeaders(req);
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
    const actor = actorFromHeaders(req);
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
