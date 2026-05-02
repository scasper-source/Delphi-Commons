import crypto from "node:crypto";
import { JsonCollection } from "../core/jsonCollection.js";

export type ParticipantMaster = {
  participant_id: string;
  name?: string;
  email?: string;
  created_at: string;
  created_by_user_id: string;
};

const participants = new JsonCollection<ParticipantMaster>("identity_participants");

export function createParticipantMaster(input: {
  name?: string;
  email?: string;
  created_by_user_id: string;
}): ParticipantMaster {
  const base: ParticipantMaster = {
    participant_id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    created_by_user_id: input.created_by_user_id,
  };

  const participant: ParticipantMaster = {
    ...base,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.email !== undefined ? { email: input.email } : {}),
  };

  return participants.insert(participant.participant_id, participant);
}

export function listParticipantMasters(): ParticipantMaster[] {
  return participants.all();
}

export function getParticipantMaster(participant_id: string): ParticipantMaster | null {
  return participants.get(participant_id);
}

export function updateParticipantMaster(
  participant_id: string,
  patch: { name?: string; email?: string },
): ParticipantMaster | null {
  return participants.update(participant_id, (existing) => ({
    ...existing,
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.email !== undefined ? { email: patch.email } : {}),
  }));
}

