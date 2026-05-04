/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "node:crypto";
import { JsonCollection } from "../core/jsonCollection.js";

export type ParticipantInvitation = {
  invitation_id: string;
  study_id: string;
  version_id: string;
  participant_id: string;
  token_hash: string;
  created_at: string;
  created_by_user_id: string;
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
};

const invitations = new JsonCollection<ParticipantInvitation>("participant_invitations");
const DEFAULT_INVITE_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export function hashInvitationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("base64url");
}

export function createParticipantInvitation(input: {
  study_id: string;
  version_id: string;
  participant_id: string;
  created_by_user_id: string;
  expires_at?: string;
}): { invitation: ParticipantInvitation; token: string } {
  const token = crypto.randomBytes(32).toString("base64url");
  const now = Date.now();
  const invitation: ParticipantInvitation = {
    invitation_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    participant_id: input.participant_id,
    token_hash: hashInvitationToken(token),
    created_at: new Date(now).toISOString(),
    created_by_user_id: input.created_by_user_id,
    expires_at: input.expires_at ?? new Date(now + DEFAULT_INVITE_TTL_MS).toISOString(),
    revoked_at: null,
    last_used_at: null,
  };

  invitations.insert(invitation.invitation_id, invitation);
  return { invitation, token };
}

export function getInvitationByToken(token: string): ParticipantInvitation | null {
  const tokenHash = hashInvitationToken(token);
  const now = new Date().toISOString();
  return (
    invitations
      .all()
      .find((invitation) => invitation.token_hash === tokenHash && !invitation.revoked_at && invitation.expires_at > now) ??
    null
  );
}

export function markInvitationUsed(invitationId: string): ParticipantInvitation | null {
  return invitations.update(invitationId, (invitation) => ({
    ...invitation,
    last_used_at: new Date().toISOString(),
  }));
}

export function revokeInvitation(invitationId: string): ParticipantInvitation | null {
  return invitations.update(invitationId, (invitation) => ({
    ...invitation,
    revoked_at: new Date().toISOString(),
  }));
}

export function listParticipantInvitations(filter: {
  study_id: string;
  version_id: string;
  participant_id?: string;
}): ParticipantInvitation[] {
  return invitations
    .all()
    .filter(
      (invitation) =>
        invitation.study_id === filter.study_id &&
        invitation.version_id === filter.version_id &&
        (!filter.participant_id || invitation.participant_id === filter.participant_id),
    )
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

