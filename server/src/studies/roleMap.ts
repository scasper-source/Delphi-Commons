/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

// server/src/studies/roleMap.ts
import type { StudyRole } from "./types.js";

export function roleFromHeader(headerRole?: string | null): StudyRole | null {
  switch ((headerRole ?? "").toLowerCase()) {
    case "owner":
      return "Owner";
    case "methods_steward":
      return "MethodsSteward";
    case "privacy_lead":
      return "PrivacyLead";
    case "data_custodian":
      return "DataCustodian";
    case "maintainer":
      return "Maintainer";
    default:
      return null;
  }
}

