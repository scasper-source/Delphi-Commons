export type AuthRole =
  | "owner"
  | "methods_steward"
  | "privacy_lead"
  | "data_custodian"
  | "maintainer"
  | "admin"
  | "participant";

export type UserRecord = {
  user_id: string;
  email: string;
  display_name: string;
  password_hash: string;
  password_salt: string;
  password_kdf: "scrypt";
  system_roles: AuthRole[];
  created_at: string;
  disabled_at: string | null;
};

export type SessionRecord = {
  session_id: string;
  user_id: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
};

