import { upsertUser } from "./userStore.js";
import type { AuthRole } from "./types.js";

const demoUsers: Array<{
  email: string;
  display_name: string;
  password: string;
  system_roles: AuthRole[];
}> = [
  {
    email: "owner@example.test",
    display_name: "Demo Study Owner",
    password: "demo-owner",
    system_roles: ["owner"],
  },
  {
    email: "steward@example.test",
    display_name: "Demo Ethics & Methods Steward",
    password: "demo-steward",
    system_roles: ["methods_steward"],
  },
  {
    email: "privacy@example.test",
    display_name: "Demo Privacy Lead",
    password: "demo-privacy",
    system_roles: ["privacy_lead"],
  },
  {
    email: "custodian@example.test",
    display_name: "Demo Data Custodian",
    password: "demo-custodian",
    system_roles: ["data_custodian", "privacy_lead"],
  },
  {
    email: "admin@example.test",
    display_name: "Demo Maintainer",
    password: "demo-admin",
    system_roles: ["admin", "maintainer"],
  },
  {
    email: "participant@example.test",
    display_name: "Demo Participant",
    password: "demo-participant",
    system_roles: ["participant"],
  },
];

let seeded = false;

export function ensureDemoUsers(): void {
  if (seeded || process.env.NODE_ENV === "production" || process.env.EDELPHI_SEED_DEMO_USERS === "false") {
    return;
  }

  for (const user of demoUsers) {
    upsertUser(user);
  }

  seeded = true;
}

