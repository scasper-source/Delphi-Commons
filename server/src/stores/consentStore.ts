import crypto from "node:crypto";
import { JsonCollection } from "../core/jsonCollection.js";
import { withDatabaseTransaction } from "../core/database.js";

export type ConsentVersion = {
  consent_version_id: string;
  study_id: string;
  version_id: string;
  text_md: string;
  created_at: string;
  is_active: boolean;
};

export type ConsentRecord = {
  participant_id: string;
  study_id: string;
  version_id: string;
  consent_version_id: string;
  consented_at: string;
  withdrew_at: string | null;
};

const consentVersions = new JsonCollection<ConsentVersion>("consent_versions");
const consentRecords = new JsonCollection<ConsentRecord>("consent_records");

function consentRecordKey(input: Pick<ConsentRecord, "participant_id" | "study_id" | "version_id">): string {
  return `${input.study_id}:${input.version_id}:${input.participant_id}`;
}

export function createConsentVersion(input: {
  study_id: string;
  version_id: string;
  text_md: string;
}): ConsentVersion {
  const rec: ConsentVersion = {
    consent_version_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    text_md: input.text_md,
    created_at: new Date().toISOString(),
    is_active: false,
  };

  return consentVersions.insert(rec.consent_version_id, rec);
}

export function listConsentVersions(filter: {
  study_id: string;
  version_id: string;
}): ConsentVersion[] {
  return consentVersions
    .all()
    .filter((version) => version.study_id === filter.study_id && version.version_id === filter.version_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function activateConsentVersion(input: {
  study_id: string;
  version_id: string;
  consent_version_id: string;
}): ConsentVersion | null {
  const versions = listConsentVersions(input);
  const target = versions.find((version) => version.consent_version_id === input.consent_version_id);
  if (!target) return null;

  withDatabaseTransaction(() => {
    for (const version of versions) {
      consentVersions.set(version.consent_version_id, {
        ...version,
        is_active: version.consent_version_id === input.consent_version_id,
      });
    }
  });

  return consentVersions.get(input.consent_version_id);
}

export function getActiveConsentVersion(filter: {
  study_id: string;
  version_id: string;
}): ConsentVersion | null {
  return (
    listConsentVersions(filter).find((version) => version.is_active === true) ?? null
  );
}

export function recordConsent(input: {
  participant_id: string;
  study_id: string;
  version_id: string;
  consent_version_id: string;
}): ConsentRecord {
  const rec: ConsentRecord = {
    participant_id: input.participant_id,
    study_id: input.study_id,
    version_id: input.version_id,
    consent_version_id: input.consent_version_id,
    consented_at: new Date().toISOString(),
    withdrew_at: null,
  };

  return consentRecords.set(consentRecordKey(rec), rec);
}

export function getConsentRecord(filter: {
  participant_id: string;
  study_id: string;
  version_id: string;
}): ConsentRecord | null {
  return consentRecords.get(consentRecordKey(filter));
}

export function withdrawConsent(input: {
  participant_id: string;
  study_id: string;
  version_id: string;
}): ConsentRecord | null {
  return consentRecords.update(consentRecordKey(input), (record) => ({
    ...record,
    withdrew_at: new Date().toISOString(),
  }));
}

export function hasActiveConsent(input: {
  participant_id: string;
  study_id: string;
  version_id: string;
}): boolean {
  const activeVersion = getActiveConsentVersion({
    study_id: input.study_id,
    version_id: input.version_id,
  });
  if (!activeVersion) return false;

  const record = getConsentRecord(input);
  if (!record || record.withdrew_at) return false;

  return record.consent_version_id === activeVersion.consent_version_id;
}
