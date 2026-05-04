/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Actor } from "../middleware/auth.js";
import { writeAuditEvent } from "./audit.js";
import { getStudy } from "../studies/store.js";
import {
  getStudyAIConfig,
  providerRequiresApiKey,
  type StudyAIFeature,
  validateStudyAIConfig,
} from "../stores/aiConfigStore.js";

const allowedInvokerRoles = new Set(["owner", "methods_steward", "privacy_lead", "admin", "maintainer"]);

const DIRECT_IDENTIFIER_KEYS = new Set([
  "name",
  "participant_name",
  "email",
  "phone",
  "address",
  "contact",
  "user_id",
  "participant_id",
  "identity_response_mapping",
  "master_list",
  "identity_table",
  "consent_record",
  "consent_records",
  "authorization",
  "apiKey",
  "api_key",
]);

export type AIGatewayMode = "local" | "external";

export type AIGatewayDecision =
  | { ok: true; statusCode: 200; providerName: string | null; modelName: string | null }
  | { ok: false; statusCode: 403 | 404 | 409; error: string; details?: Record<string, unknown> };

export function sanitizeExternalAIPayload(payload: unknown): { ok: true; value: unknown } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  function walk(value: unknown, path: string): unknown {
    if (typeof value === "string") {
      if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value)) {
        errors.push(`${path}:email_like_identifier`);
      }
      return value;
    }
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map((entry, index) => walk(entry, `${path}[${index}]`));

    const output: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
      if (DIRECT_IDENTIFIER_KEYS.has(key)) {
        errors.push(`${path}.${key}:direct_identifier_key`);
        continue;
      }
      output[key] = walk(entryValue, `${path}.${key}`);
    }
    return output;
  }

  const value = walk(payload, "$");
  return errors.length ? { ok: false, errors } : { ok: true, value };
}

export async function assertAIOperationAllowed(input: {
  studyId: string;
  actor: Actor;
  feature: StudyAIFeature;
  mode: AIGatewayMode;
  inputScopeIds?: string[];
  payload?: unknown;
}): Promise<AIGatewayDecision> {
  const study = await getStudy(input.studyId);
  if (!study) {
    return { ok: false, statusCode: 404, error: "study_not_found" };
  }

  const config = getStudyAIConfig(input.studyId);
  const configuredProvider = config.providerName;
  const configuredModel = config.modelName;

  const blocked = async (
    statusCode: 403 | 409,
    error: string,
    details: Record<string, unknown> = {},
  ): Promise<AIGatewayDecision> => {
    await writeAuditEvent({
      actor: input.actor,
      action: "ai.operation.blocked",
      object: { type: "study", id: input.studyId },
      details: {
        studyId: input.studyId,
        feature: input.feature,
        mode: input.mode,
        reason_blocked: error,
        provider_name: configuredProvider,
        model_name: configuredModel,
        input_scope_ids: input.inputScopeIds ?? [],
        ...details,
      },
    });
    return { ok: false, statusCode, error, details };
  };

  if (!allowedInvokerRoles.has(String(input.actor.role))) {
    return blocked(403, "ai_invocation_forbidden_for_role", { actor_role: input.actor.role });
  }

  if (!config.featurePermissions[input.feature]) {
    return blocked(403, "ai_feature_permission_disabled");
  }

  if (input.mode === "external") {
    if (config.noExternalAiMode) return blocked(409, "no_external_ai_mode_blocks_external_call");
    if (!config.externalAiEnabled) return blocked(409, "external_ai_disabled");

    const validation = validateStudyAIConfig(config);
    if (validation.errors.length > 0) {
      return blocked(409, "ai_config_incomplete", { validation_errors: validation.errors });
    }

    if (!config.providerName || !config.modelName) return blocked(409, "provider_model_required");
    if (providerRequiresApiKey(config.providerName) && !config.apiKeyEncrypted) {
      return blocked(409, "provider_api_key_required");
    }

    const sanitized = sanitizeExternalAIPayload(input.payload ?? {});
    if (!sanitized.ok) {
      return blocked(409, "ai_payload_direct_identifier_risk", { sanitizer_errors: sanitized.errors });
    }
  }

  await writeAuditEvent({
    actor: input.actor,
    action: "ai.operation.policy_allowed",
    object: { type: "study", id: input.studyId },
    details: {
      studyId: input.studyId,
      feature: input.feature,
      mode: input.mode,
      provider_name: configuredProvider,
      model_name: configuredModel,
      input_scope_ids: input.inputScopeIds ?? [],
      human_action: "pending",
    },
  });

  return { ok: true, statusCode: 200, providerName: configuredProvider, modelName: configuredModel };
}
