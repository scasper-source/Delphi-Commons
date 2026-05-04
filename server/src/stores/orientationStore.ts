import { JsonCollection } from "../core/jsonCollection.js";

export const PARTICIPANT_ORIENTATION_VERSION = "participant-orientation-v1";

export type OrientationCompletion = {
  participant_id: string;
  study_id: string;
  version_id: string;
  orientation_version: string;
  completed_at: string;
};

const completions = new JsonCollection<OrientationCompletion>("participant_orientation_completions");

function completionKey(input: Pick<OrientationCompletion, "study_id" | "version_id" | "participant_id">): string {
  return `${input.study_id}:${input.version_id}:${input.participant_id}`;
}

export function getOrientationCompletion(filter: {
  participant_id: string;
  study_id: string;
  version_id: string;
}): OrientationCompletion | null {
  return completions.get(completionKey(filter));
}

export function hasOrientationCompletion(filter: {
  participant_id: string;
  study_id: string;
  version_id: string;
}): boolean {
  return Boolean(getOrientationCompletion(filter));
}

export function recordOrientationCompletion(input: {
  participant_id: string;
  study_id: string;
  version_id: string;
  orientation_version?: string;
}): OrientationCompletion {
  const existing = getOrientationCompletion(input);
  if (existing) return existing;
  const completion: OrientationCompletion = {
    participant_id: input.participant_id,
    study_id: input.study_id,
    version_id: input.version_id,
    orientation_version: input.orientation_version ?? PARTICIPANT_ORIENTATION_VERSION,
    completed_at: new Date().toISOString(),
  };
  return completions.set(completionKey(completion), completion);
}
