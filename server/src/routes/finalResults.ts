/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FastifyInstance } from "fastify";
import { getActor, requireRole } from "../middleware/auth.js";
import { writeAuditEvent } from "../core/audit.js";
import { createFinalResultSnapshot } from "../core/finalResults.js";
import {
  FINAL_RESULT_REQUIRED_STATEMENT,
  getFinalResultSnapshot,
  updateFinalResultSnapshot,
} from "../stores/finalResultStore.js";
import { getStudyVersion } from "../studies/store.js";

function getStudyAndVersion(params: unknown): { studyId: string; versionId: string } {
  const p = (params ?? {}) as Record<string, unknown>;
  return {
    studyId: String(p.studyId ?? p.study_id ?? ""),
    versionId: String(p.versionId ?? p.version_id ?? ""),
  };
}

function requiredRoleForActor(role: string): "Owner" | "MethodsSteward" | null {
  if (role === "owner") return "Owner";
  if (role === "methods_steward") return "MethodsSteward";
  return null;
}

function releaseBlockers(snapshot: NonNullable<ReturnType<typeof getFinalResultSnapshot>>): string[] {
  const signoffRoles = new Set(snapshot.releaseSignoffs.map((signoff) => signoff.requiredRole));
  return [
    ...(snapshot.requiredStatement === FINAL_RESULT_REQUIRED_STATEMENT ? [] : ["required_statement_missing"]),
    ...(snapshot.consensusRule.lockStatus === "locked" ? [] : ["locked_consensus_rule_missing"]),
    ...(snapshot.itemOutcomes.some((item) => item.summaryReview.aiSuggestionStatus === "pending_review")
      ? ["ai_summary_pending_human_review"]
      : []),
    ...(signoffRoles.has("Owner") ? [] : ["study_owner_closeout_signoff_missing"]),
    ...(signoffRoles.has("MethodsSteward") ? [] : ["ethics_methods_closeout_signoff_missing"]),
    ...(snapshot.methodWarnings.some((warning) => warning.severity === "blocking")
      ? ["blocking_method_warning_present"]
      : []),
  ];
}

export async function finalResultsRoutes(app: FastifyInstance) {
  const allowStaff = requireRole(["owner", "methods_steward", "data_custodian", "privacy_lead"]);
  const allowSignoff = requireRole(["owner", "methods_steward"]);

  app.get(
    "/studies/:studyId/versions/:versionId/final-results",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);
      const snapshot = getFinalResultSnapshot(studyId, versionId);

      await writeAuditEvent({
        actor,
        action: "final_results.snapshot.get",
        object: { type: "study_version", id: `${studyId}:${versionId}` },
        details: { studyId, versionId, found: Boolean(snapshot) },
      });

      return reply.send({
        snapshot,
        release_blockers: snapshot ? releaseBlockers(snapshot) : ["final_result_snapshot_missing"],
      });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/final-results",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);
      const studyVersion = await getStudyVersion(versionId);
      if (!studyVersion || studyVersion.study_id !== studyId) {
        return reply.code(404).send({ error: "study_version_not_found" });
      }
      if (!studyVersion.terminal_round_number) {
        return reply.code(409).send({ error: "terminal_round_not_configured" });
      }

      try {
        const snapshot = await createFinalResultSnapshot({
          studyId,
          versionId,
          terminalRoundNumber: studyVersion.terminal_round_number,
          createdByUserId: actor.userId,
        });

        await writeAuditEvent({
          actor,
          action: "final_results.snapshot.create",
          object: { type: "final_result_snapshot", id: snapshot.snapshotId },
          details: {
            studyId,
            versionId,
            terminal_round_number: snapshot.terminalRoundNumber,
            export_hash: snapshot.exportHash,
          },
        });

        return reply.code(201).send({ snapshot, release_blockers: releaseBlockers(snapshot) });
      } catch (error) {
        const message = error instanceof Error ? error.message : "final_result_snapshot_failed";
        return reply.code(409).send({ error: message });
      }
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/final-results/signoff",
    { preHandler: allowSignoff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);
      const requiredRole = requiredRoleForActor(String(actor.role));
      if (!requiredRole) return reply.code(403).send({ error: "final_results_signoff_role_required" });

      const updated = updateFinalResultSnapshot(studyId, versionId, (snapshot) => {
        const existing = snapshot.releaseSignoffs.filter((signoff) => signoff.requiredRole !== requiredRole);
        const releaseSignoffs = [
          ...existing,
          { requiredRole, signedByUserId: actor.userId, signedAt: new Date().toISOString() },
        ].sort((a, b) => a.requiredRole.localeCompare(b.requiredRole));
        return {
          ...snapshot,
          releaseSignoffs,
          status: releaseSignoffs.length >= 2 ? "signed_off" : snapshot.status,
        };
      });
      if (!updated) return reply.code(404).send({ error: "final_result_snapshot_not_found" });

      await writeAuditEvent({
        actor,
        action: "final_results.release_signoff",
        object: { type: "final_result_snapshot", id: updated.snapshotId },
        details: { studyId, versionId, requiredRole },
      });

      return reply.send({ snapshot: updated, release_blockers: releaseBlockers(updated) });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/final-results/release",
    { preHandler: allowSignoff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);
      const snapshot = getFinalResultSnapshot(studyId, versionId);
      if (!snapshot) return reply.code(404).send({ error: "final_result_snapshot_not_found" });
      const blockers = releaseBlockers(snapshot);
      if (blockers.length > 0) return reply.code(409).send({ error: "final_results_release_blocked", blockers });

      const released = updateFinalResultSnapshot(studyId, versionId, (current) => ({
        ...current,
        status: "released",
        participantReleasedAt: current.participantReleasedAt ?? new Date().toISOString(),
      }));
      if (!released) return reply.code(404).send({ error: "final_result_snapshot_not_found" });

      await writeAuditEvent({
        actor,
        action: "final_results.release_to_participants",
        object: { type: "final_result_snapshot", id: released.snapshotId },
        details: { studyId, versionId, export_hash: released.exportHash },
      });

      return reply.send({ snapshot: released, release_blockers: [] });
    },
  );

  app.post(
    "/studies/:studyId/versions/:versionId/final-results/archive",
    { preHandler: allowStaff },
    async (req, reply) => {
      const { studyId, versionId } = getStudyAndVersion(req.params);
      const actor = getActor(req);
      const snapshot = getFinalResultSnapshot(studyId, versionId);
      if (!snapshot) return reply.code(404).send({ error: "final_result_snapshot_not_found" });
      if (!snapshot.exportHash || !snapshot.provenanceHash) {
        return reply.code(409).send({ error: "final_results_archive_blocked_missing_hashes" });
      }

      const archived = updateFinalResultSnapshot(studyId, versionId, (current) => ({
        ...current,
        status: "archived",
        archivedAt: current.archivedAt ?? new Date().toISOString(),
      }));
      if (!archived) return reply.code(404).send({ error: "final_result_snapshot_not_found" });

      await writeAuditEvent({
        actor,
        action: "final_results.archive",
        object: { type: "final_result_snapshot", id: archived.snapshotId },
        details: { studyId, versionId, export_hash: archived.exportHash },
      });

      return reply.send({ snapshot: archived, release_blockers: releaseBlockers(archived) });
    },
  );
}
