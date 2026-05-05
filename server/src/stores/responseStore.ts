/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "node:crypto";
import { JsonCollection } from "../core/jsonCollection.js";

export type ResponseRecord = {
  response_id: string;
  study_id: string;
  version_id: string;
  participant_id: string;
  response_json: unknown;
  created_at: string;
};

const responses = new JsonCollection<ResponseRecord>("responses");

export function createResponse(input: {
  study_id: string;
  version_id: string;
  participant_id: string;
  response_json: unknown;
}): ResponseRecord {
  const rec: ResponseRecord = {
    response_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    participant_id: input.participant_id,
    response_json: input.response_json,
    created_at: new Date().toISOString(),
  };

  return responses.insert(rec.response_id, rec);
}

export function listResponses(filter: { study_id: string; version_id: string }): ResponseRecord[] {
  return responses
    .all()
    .filter((response) => response.study_id === filter.study_id && response.version_id === filter.version_id)
    .sort((a, b) => {
      const byCreated = a.created_at.localeCompare(b.created_at);
      if (byCreated !== 0) return byCreated;
      return a.response_id.localeCompare(b.response_id);
    });
}

