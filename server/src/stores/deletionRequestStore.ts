import crypto from "node:crypto";
import { JsonCollection } from "../core/jsonCollection.js";

export type DeletionRequestStatus = "Requested" | "UnderReview" | "Approved" | "Rejected" | "Completed";

export type DeletionRequest = {
  deletion_request_id: string;
  study_id: string;
  version_id: string;
  participant_id: string;
  requested_at: string;
  requested_by: "participant" | "staff";
  request_text: string;
  status: DeletionRequestStatus;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  review_note: string | null;
};

const deletionRequests = new JsonCollection<DeletionRequest>("deletion_requests");

export function createDeletionRequest(input: {
  study_id: string;
  version_id: string;
  participant_id: string;
  requested_by: "participant" | "staff";
  request_text: string;
}): DeletionRequest {
  const request: DeletionRequest = {
    deletion_request_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    participant_id: input.participant_id,
    requested_at: new Date().toISOString(),
    requested_by: input.requested_by,
    request_text: input.request_text.trim(),
    status: "Requested",
    reviewed_by_user_id: null,
    reviewed_at: null,
    review_note: null,
  };

  return deletionRequests.insert(request.deletion_request_id, request);
}

export function listDeletionRequests(filter: {
  study_id: string;
  version_id: string;
  participant_id?: string;
}): DeletionRequest[] {
  return deletionRequests
    .all()
    .filter(
      (request) =>
        request.study_id === filter.study_id &&
        request.version_id === filter.version_id &&
        (!filter.participant_id || request.participant_id === filter.participant_id),
    )
    .sort((a, b) => b.requested_at.localeCompare(a.requested_at));
}

export function updateDeletionRequest(input: {
  deletion_request_id: string;
  reviewed_by_user_id: string;
  status: DeletionRequestStatus;
  review_note: string;
}): DeletionRequest | null {
  return deletionRequests.update(input.deletion_request_id, (request) => ({
    ...request,
    status: input.status,
    reviewed_by_user_id: input.reviewed_by_user_id,
    reviewed_at: new Date().toISOString(),
    review_note: input.review_note.trim(),
  }));
}
