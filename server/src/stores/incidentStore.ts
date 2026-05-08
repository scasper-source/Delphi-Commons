import { randomUUID } from "node:crypto";
import { JsonCollection } from "../core/jsonCollection.js";

export type IncidentSeverity = "low" | "moderate" | "high" | "critical";
export type IncidentStatus = "open" | "contained" | "monitoring" | "resolved";

export type IncidentNotificationDecision = {
  decision: "pending" | "not_required" | "required";
  rationale: string;
  decided_by: string;
  decided_at: string;
  channels: string[];
};

export type IncidentTimelineEntry = {
  entry_id: string;
  category: "remediation" | "recovery" | "note";
  note: string;
  actor_user_id: string;
  created_at: string;
};

export type IncidentRecord = {
  incident_id: string;
  study_id: string;
  study_version_id: string | null;
  title: string;
  summary: string;
  severity: IncidentSeverity;
  severity_rationale: string;
  status: IncidentStatus;
  pause_applied: boolean;
  pause_applied_at: string | null;
  pause_applied_by: string | null;
  notification: IncidentNotificationDecision;
  timeline: IncidentTimelineEntry[];
  created_at: string;
  created_by: string;
  updated_at: string;
};

const incidents = new JsonCollection<IncidentRecord>("incidents");

export function createIncident(input: {
  study_id: string;
  study_version_id?: string | null;
  title: string;
  summary: string;
  severity: IncidentSeverity;
  severity_rationale: string;
  created_by: string;
}): IncidentRecord {
  const now = new Date().toISOString();
  const record: IncidentRecord = {
    incident_id: randomUUID(),
    study_id: input.study_id,
    study_version_id: input.study_version_id ?? null,
    title: input.title,
    summary: input.summary,
    severity: input.severity,
    severity_rationale: input.severity_rationale,
    status: "open",
    pause_applied: false,
    pause_applied_at: null,
    pause_applied_by: null,
    notification: {
      decision: "pending",
      rationale: "",
      decided_by: input.created_by,
      decided_at: now,
      channels: [],
    },
    timeline: [],
    created_at: now,
    created_by: input.created_by,
    updated_at: now,
  };
  incidents.insert(record.incident_id, record);
  return record;
}

export function listIncidents(): IncidentRecord[] {
  return incidents.all().sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function getIncident(incidentId: string): IncidentRecord | null {
  return incidents.get(incidentId);
}

export function updateIncident(incidentId: string, patch: Partial<IncidentRecord>): IncidentRecord {
  const updated = incidents.update(incidentId, (existing) => ({ ...existing, ...patch, updated_at: new Date().toISOString() }));
  if (!updated) throw new Error("incident_not_found");
  return updated;
}

export function addIncidentTimelineEntry(input: {
  incident_id: string;
  category: IncidentTimelineEntry["category"];
  note: string;
  actor_user_id: string;
}): IncidentRecord {
  const incident = getIncident(input.incident_id);
  if (!incident) throw new Error("incident_not_found");
  const entry: IncidentTimelineEntry = {
    entry_id: randomUUID(),
    category: input.category,
    note: input.note,
    actor_user_id: input.actor_user_id,
    created_at: new Date().toISOString(),
  };
  return updateIncident(input.incident_id, { timeline: [...incident.timeline, entry] });
}
