import type { ModuleDefinition, ModuleId, OutputModelDefinition, UserRole } from "./types";

export const roleLabels: Record<UserRole, string> = {
  study_owner: "Study Owner / PI",
  ethics_methods_steward: "Ethics & Methods Steward",
  security_privacy_lead: "Security & Privacy Lead",
  data_custodian: "Data Custodian",
  open_source_admin: "Open Source Maintainer / Admin",
  study_coordinator: "Study Coordinator",
  panelist: "Panelist / Participant",
};

export function canAccessModule(role: UserRole, module: ModuleDefinition): boolean {
  return module.allowedRoles.includes(role);
}

export function canOpenModule(role: UserRole, moduleId: ModuleId): boolean {
  if (role === "panelist") {
    return moduleId === "participant" || moduleId === "feedback";
  }

  return true;
}

export function canAccessIdentityMap(role: UserRole): boolean {
  return role === "data_custodian" || role === "security_privacy_lead";
}

export function canExportOutput(role: UserRole, outputModel: OutputModelDefinition): boolean {
  return outputModel.requiredRoles.includes(role);
}
