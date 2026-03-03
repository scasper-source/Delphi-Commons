// server/src/studies/types.ts
// Ticket 3 models (July MVP plan)

export type StudyVersionStatus =
  | "Draft"
  | "ReadyForSignoff"
  | "Active"
  | "Paused"
  | "Closed";

export type StudyRole =
  | "Owner"
  | "MethodsSteward"
  | "PrivacyLead"
  | "DataCustodian"
  | "Maintainer";

export interface Study {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string; // ISO timestamp
}

export interface StudyVersion {
  id: string;
  study_id: string;
  version_number: number;

  status: StudyVersionStatus;

  consensus_rule_json: unknown | null;
  feedback_config_json: unknown | null;
  retention_policy_json: unknown | null;

  config_hash: string | null;
  opened_round1_at: string | null;

  created_by: string;
  created_at: string; // ISO timestamp
}

export interface StudyAssignment {
  user_id: string;
  study_id: string;
  role: StudyRole;
  created_at: string; // ISO timestamp
}

export interface StudyVersionSignoff {
  study_version_id: string;
  required_role: "Owner" | "MethodsSteward";
  signed_by_user_id: string;
  signed_at: string; // ISO timestamp
  note?: string;
}