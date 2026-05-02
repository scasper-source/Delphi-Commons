import { getDatabase } from "./database.js";
import { listExportManifests } from "../stores/exportManifestStore.js";

const identityLikeKeys = new Set([
  "name",
  "full_name",
  "email",
  "email_address",
  "phone",
  "phone_number",
  "address",
  "home_address",
]);

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== "object") return keys;
  if (Array.isArray(value)) {
    for (const entry of value) collectObjectKeys(entry, keys);
    return keys;
  }

  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key.toLowerCase());
    collectObjectKeys(entryValue, keys);
  }

  return keys;
}

function documentCollectionCount(collection: string): number {
  const row = getDatabase()
    .prepare("SELECT COUNT(*) AS count FROM documents WHERE collection = ?")
    .get(collection) as { count: number };
  return row.count;
}

export function inspectDataIntegrity() {
  const responseRows = getDatabase()
    .prepare(
      `SELECT document_key, document_json
       FROM documents
       WHERE collection = 'responses'
       ORDER BY document_key ASC`,
    )
    .all() as Array<{ document_key: string; document_json: string }>;

  const identityFieldFindings = responseRows.flatMap((row) => {
    const parsed = JSON.parse(row.document_json) as { response_json?: unknown };
    const keys = collectObjectKeys(parsed.response_json);
    const directIdentityKeys = [...keys].filter((key) => identityLikeKeys.has(key));
    return directIdentityKeys.length > 0
      ? [{ response_id: row.document_key, direct_identity_keys: directIdentityKeys }]
      : [];
  });

  return {
    ok: identityFieldFindings.length === 0,
    separation_model: {
      identity_collection: "identity_participants",
      response_collection: "responses",
      shared_linkage_key: "participant_id",
      direct_identity_fields_allowed_in_responses: false,
    },
    counts: {
      identity_participants: documentCollectionCount("identity_participants"),
      responses: responseRows.length,
      export_manifests: listExportManifests().length,
    },
    findings: identityFieldFindings,
  };
}
