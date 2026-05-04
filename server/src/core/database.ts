import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getDataDir } from "./paths.js";

type Migration = {
  id: string;
  sql: string;
};

const migrations: Migration[] = [
  {
    id: "001_core_document_store",
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS documents (
        collection TEXT NOT NULL,
        document_key TEXT NOT NULL,
        document_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (collection, document_key)
      );

      CREATE INDEX IF NOT EXISTS idx_documents_collection_updated
        ON documents(collection, updated_at);
    `,
  },
  {
    id: "002_audit_events",
    sql: `
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        event_json TEXT NOT NULL,
        ts TEXT NOT NULL,
        actor_user_id TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        action TEXT NOT NULL,
        object_type TEXT,
        object_id TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_audit_events_ts
        ON audit_events(ts);

      CREATE INDEX IF NOT EXISTS idx_audit_events_action
        ON audit_events(action);
    `,
  },
  {
    id: "003_integrity_audit_exports",
    sql: `
      ALTER TABLE audit_events ADD COLUMN sequence INTEGER;
      ALTER TABLE audit_events ADD COLUMN previous_hash TEXT;
      ALTER TABLE audit_events ADD COLUMN event_hash TEXT;

      CREATE UNIQUE INDEX IF NOT EXISTS idx_audit_events_sequence
        ON audit_events(sequence)
        WHERE sequence IS NOT NULL;

      CREATE TRIGGER IF NOT EXISTS audit_events_append_only_update
      BEFORE UPDATE ON audit_events
      BEGIN
        SELECT RAISE(ABORT, 'audit_events_append_only');
      END;

      CREATE TRIGGER IF NOT EXISTS audit_events_append_only_delete
      BEFORE DELETE ON audit_events
      BEGIN
        SELECT RAISE(ABORT, 'audit_events_append_only');
      END;

      CREATE TABLE IF NOT EXISTS export_manifests (
        export_id TEXT PRIMARY KEY,
        study_id TEXT NOT NULL,
        version_id TEXT NOT NULL,
        package_type TEXT NOT NULL,
        generated_at TEXT NOT NULL,
        generated_by_user_id TEXT NOT NULL,
        generated_by_role TEXT NOT NULL,
        audit_event_id TEXT NOT NULL,
        config_hash TEXT,
        dataset_hash TEXT,
        content_hash TEXT NOT NULL,
        data_scope_json TEXT NOT NULL,
        redaction_profile_json TEXT NOT NULL,
        manifest_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_export_manifests_study_version
        ON export_manifests(study_id, version_id, generated_at);

      CREATE TRIGGER IF NOT EXISTS export_manifests_append_only_update
      BEFORE UPDATE ON export_manifests
      BEGIN
        SELECT RAISE(ABORT, 'export_manifests_append_only');
      END;

      CREATE TRIGGER IF NOT EXISTS export_manifests_append_only_delete
      BEFORE DELETE ON export_manifests
      BEGIN
        SELECT RAISE(ABORT, 'export_manifests_append_only');
      END;
    `,
  },
  {
    id: "004_export_package_schema_v1",
    sql: `
      CREATE TABLE IF NOT EXISTS export_packages (
        export_package_id TEXT PRIMARY KEY,
        study_id TEXT NOT NULL,
        study_version_id TEXT NOT NULL,
        export_type TEXT NOT NULL,
        export_created_at TEXT NOT NULL,
        export_created_by_user_id TEXT NOT NULL,
        export_created_by_role TEXT NOT NULL,
        export_format_set_json TEXT NOT NULL,
        data_cutoff_at TEXT NOT NULL,
        consensus_rule_version_id TEXT,
        feedback_config_version_id TEXT,
        instrument_version_ids_json TEXT NOT NULL,
        contains_identifiable_data INTEGER NOT NULL,
        anonymization_level TEXT NOT NULL,
        external_ai_used INTEGER NOT NULL,
        human_review_required INTEGER NOT NULL,
        human_review_status TEXT NOT NULL,
        release_status TEXT NOT NULL,
        released_at TEXT,
        released_by_user_id TEXT,
        release_signoff_ids_json TEXT NOT NULL,
        supersedes_export_package_id TEXT,
        limitations_text_version_id TEXT NOT NULL,
        manifest_hash TEXT NOT NULL,
        package_hash TEXT NOT NULL,
        audit_event_id TEXT NOT NULL,
        manifest_json TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_export_packages_study_version
        ON export_packages(study_id, study_version_id, export_created_at);

      CREATE TABLE IF NOT EXISTS export_files (
        export_file_id TEXT PRIMARY KEY,
        export_package_id TEXT NOT NULL,
        path TEXT NOT NULL,
        format TEXT NOT NULL,
        media_type TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        record_count INTEGER,
        contains_identifiable_data INTEGER NOT NULL,
        redaction_profile_json TEXT NOT NULL,
        content_text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(export_package_id) REFERENCES export_packages(export_package_id)
      );

      CREATE INDEX IF NOT EXISTS idx_export_files_package
        ON export_files(export_package_id, path);

      CREATE TRIGGER IF NOT EXISTS export_packages_append_only_update
      BEFORE UPDATE ON export_packages
      BEGIN
        SELECT RAISE(ABORT, 'export_packages_append_only');
      END;

      CREATE TRIGGER IF NOT EXISTS export_packages_append_only_delete
      BEFORE DELETE ON export_packages
      BEGIN
        SELECT RAISE(ABORT, 'export_packages_append_only');
      END;

      CREATE TRIGGER IF NOT EXISTS export_files_append_only_update
      BEFORE UPDATE ON export_files
      BEGIN
        SELECT RAISE(ABORT, 'export_files_append_only');
      END;

      CREATE TRIGGER IF NOT EXISTS export_files_append_only_delete
      BEFORE DELETE ON export_files
      BEGIN
        SELECT RAISE(ABORT, 'export_files_append_only');
      END;
    `,
  },
  {
    id: "005_export_file_content_encoding",
    sql: `
      ALTER TABLE export_files ADD COLUMN content_encoding TEXT NOT NULL DEFAULT 'utf8';
    `,
  },
  {
    id: "006_export_package_reviews",
    sql: `
      CREATE TABLE IF NOT EXISTS export_package_reviews (
        review_id TEXT PRIMARY KEY,
        export_package_id TEXT NOT NULL,
        study_id TEXT NOT NULL,
        study_version_id TEXT NOT NULL,
        reviewed_at TEXT NOT NULL,
        reviewed_by_user_id TEXT NOT NULL,
        reviewed_by_role TEXT NOT NULL,
        review_status TEXT NOT NULL,
        note TEXT NOT NULL,
        audit_event_id TEXT NOT NULL,
        review_json TEXT NOT NULL,
        FOREIGN KEY(export_package_id) REFERENCES export_packages(export_package_id)
      );

      CREATE INDEX IF NOT EXISTS idx_export_package_reviews_package
        ON export_package_reviews(export_package_id, reviewed_at);

      CREATE TRIGGER IF NOT EXISTS export_package_reviews_append_only_update
      BEFORE UPDATE ON export_package_reviews
      BEGIN
        SELECT RAISE(ABORT, 'export_package_reviews_append_only');
      END;

      CREATE TRIGGER IF NOT EXISTS export_package_reviews_append_only_delete
      BEFORE DELETE ON export_package_reviews
      BEGIN
        SELECT RAISE(ABORT, 'export_package_reviews_append_only');
      END;
    `,
  },
  {
    id: "007_study_ai_configs",
    sql: `
      CREATE TABLE IF NOT EXISTS study_ai_configs (
        study_id TEXT PRIMARY KEY,
        external_ai_enabled INTEGER NOT NULL,
        no_external_ai_mode INTEGER NOT NULL,
        provider_name TEXT,
        model_name TEXT,
        api_key_encrypted TEXT,
        api_key_last_four TEXT,
        api_key_fingerprint_hash TEXT,
        api_key_created_at TEXT,
        api_key_rotated_at TEXT,
        api_key_deleted_at TEXT,
        feature_permissions_json TEXT NOT NULL,
        disclosure_json TEXT NOT NULL,
        created_by_user_id TEXT NOT NULL,
        updated_by_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_study_ai_configs_updated
        ON study_ai_configs(updated_at);
    `,
  },
];

let db: DatabaseSync | null = null;
let dbPath: string | null = null;

function readJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return null;
  }
}

function insertLegacyDocument(database: DatabaseSync, collection: string, key: string, document: unknown): void {
  const now = new Date().toISOString();
  database
    .prepare(
      `INSERT OR IGNORE INTO documents (collection, document_key, document_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(collection, key, JSON.stringify(document), now, now);
}

function documentCount(database: DatabaseSync, collection: string): number {
  const row = database
    .prepare("SELECT COUNT(*) AS count FROM documents WHERE collection = ?")
    .get(collection) as { count: number };
  return row.count;
}

function runLegacyJsonImport(database: DatabaseSync): void {
  if (process.env.EDELPHI_SKIP_LEGACY_IMPORT === "true") return;

  const existing = database
    .prepare("SELECT id FROM schema_migrations WHERE id = ?")
    .get("legacy_json_import_v1") as { id: string } | undefined;
  if (existing) return;

  const dataDir = getDataDir();

  try {
    database.exec("BEGIN IMMEDIATE;");

    const studiesDb = readJsonFile<{
      studies?: Array<Record<string, unknown>>;
      studyVersions?: Array<Record<string, unknown>>;
      assignments?: Array<Record<string, unknown>>;
      signoffs?: Array<Record<string, unknown>>;
    }>(path.join(dataDir, "studies.db.json"));

    if (studiesDb && documentCount(database, "studies") === 0) {
      for (const study of studiesDb.studies ?? []) {
        if (typeof study.id === "string") insertLegacyDocument(database, "studies", study.id, study);
      }
      for (const version of studiesDb.studyVersions ?? []) {
        if (typeof version.id === "string") insertLegacyDocument(database, "study_versions", version.id, version);
      }
      for (const assignment of studiesDb.assignments ?? []) {
        if (
          typeof assignment.study_id === "string" &&
          typeof assignment.user_id === "string" &&
          typeof assignment.role === "string"
        ) {
          insertLegacyDocument(
            database,
            "study_assignments",
            `${assignment.study_id}:${assignment.user_id}:${assignment.role}`,
            assignment,
          );
        }
      }
      for (const signoff of studiesDb.signoffs ?? []) {
        if (typeof signoff.study_version_id === "string" && typeof signoff.required_role === "string") {
          insertLegacyDocument(
            database,
            "study_version_signoffs",
            `${signoff.study_version_id}:${signoff.required_role}`,
            signoff,
          );
        }
      }
    }

    const participantDb = readJsonFile<{ participants?: Record<string, Record<string, unknown>> }>(
      path.join(dataDir, "identity", "participant_master.json"),
    );
    if (participantDb && documentCount(database, "identity_participants") === 0) {
      for (const [key, participant] of Object.entries(participantDb.participants ?? {})) {
        insertLegacyDocument(database, "identity_participants", key, participant);
      }
    }

    const responseDb = readJsonFile<{ responses?: Array<Record<string, unknown>> }>(
      path.join(dataDir, "responses", "responses.json"),
    );
    if (responseDb && documentCount(database, "responses") === 0) {
      for (const response of responseDb.responses ?? []) {
        if (typeof response.response_id === "string") {
          insertLegacyDocument(database, "responses", response.response_id, response);
        }
      }
    }

    const consentDb = readJsonFile<{
      consent_versions?: Array<Record<string, unknown>>;
      consent_records?: Array<Record<string, unknown>>;
    }>(path.join(dataDir, "consent", "consent.json"));
    if (consentDb && documentCount(database, "consent_versions") === 0) {
      for (const version of consentDb.consent_versions ?? []) {
        if (typeof version.consent_version_id === "string") {
          insertLegacyDocument(database, "consent_versions", version.consent_version_id, version);
        }
      }
      for (const record of consentDb.consent_records ?? []) {
        if (
          typeof record.study_id === "string" &&
          typeof record.version_id === "string" &&
          typeof record.participant_id === "string"
        ) {
          insertLegacyDocument(
            database,
            "consent_records",
            `${record.study_id}:${record.version_id}:${record.participant_id}`,
            record,
          );
        }
      }
    }

    const roundDb = readJsonFile<{ roundConfigs?: Array<Record<string, unknown>> }>(
      path.join(dataDir, "rounds", "round-configs.json"),
    );
    if (roundDb && documentCount(database, "round_configs") === 0) {
      for (const config of roundDb.roundConfigs ?? []) {
        if (
          typeof config.study_id === "string" &&
          typeof config.version_id === "string" &&
          typeof config.round_number === "number"
        ) {
          insertLegacyDocument(
            database,
            "round_configs",
            `${config.study_id}:${config.version_id}:${config.round_number}`,
            config,
          );
        }
      }
    }

    const itemDb = readJsonFile<{ items?: Array<Record<string, unknown>> }>(
      path.join(dataDir, "items", "items.json"),
    );
    if (itemDb && documentCount(database, "items") === 0) {
      for (const item of itemDb.items ?? []) {
        if (typeof item.item_id === "string") insertLegacyDocument(database, "items", item.item_id, item);
      }
    }

    const mergeDb = readJsonFile<{
      merges?: Array<Record<string, unknown>>;
      splits?: Array<Record<string, unknown>>;
    }>(path.join(dataDir, "items", "merge_actions.json"));
    if (mergeDb && documentCount(database, "item_merges") === 0) {
      for (const merge of mergeDb.merges ?? []) {
        if (typeof merge.merge_id === "string") insertLegacyDocument(database, "item_merges", merge.merge_id, merge);
      }
      for (const split of mergeDb.splits ?? []) {
        if (typeof split.split_id === "string") insertLegacyDocument(database, "item_splits", split.split_id, split);
      }
    }

    const aiDb = readJsonFile<{
      suggestions?: Array<Record<string, unknown>>;
      release_signoffs?: Array<Record<string, unknown>>;
    }>(path.join(dataDir, "ai", "ai_suggestions.json"));
    if (aiDb && documentCount(database, "ai_suggestions") === 0) {
      for (const suggestion of aiDb.suggestions ?? []) {
        if (typeof suggestion.suggestion_id === "string") {
          insertLegacyDocument(database, "ai_suggestions", suggestion.suggestion_id, suggestion);
        }
      }
      for (const signoff of aiDb.release_signoffs ?? []) {
        if (typeof signoff.suggestion_id === "string" && typeof signoff.required_role === "string") {
          insertLegacyDocument(
            database,
            "ai_release_signoffs",
            `${signoff.suggestion_id}:${signoff.required_role}`,
            signoff,
          );
        }
      }
    }

    database
      .prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)")
      .run("legacy_json_import_v1", new Date().toISOString());
    database.exec("COMMIT;");
  } catch (error) {
    if (database.isTransaction) database.exec("ROLLBACK;");
    throw error;
  }
}

export function getDatabasePath(): string {
  return path.resolve(process.env.EDELPHI_DATABASE_PATH ?? path.join(getDataDir(), "edelphi.sqlite"));
}

function runMigrations(database: DatabaseSync): void {
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA synchronous = NORMAL;");
  database.exec("PRAGMA busy_timeout = 5000;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  for (const migration of migrations) {
    const existing = database
      .prepare("SELECT id FROM schema_migrations WHERE id = ?")
      .get(migration.id) as { id: string } | undefined;

    if (existing) continue;

    try {
      database.exec("BEGIN IMMEDIATE;");
      database.exec(migration.sql);
      database
        .prepare("INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)")
        .run(migration.id, new Date().toISOString());
      database.exec("COMMIT;");
    } catch (error) {
      if (database.isTransaction) database.exec("ROLLBACK;");
      throw error;
    }
  }
}

export function getDatabase(): DatabaseSync {
  const nextPath = getDatabasePath();
  if (db && dbPath === nextPath) return db;

  if (db) {
    db.close();
    db = null;
  }

  fs.mkdirSync(path.dirname(nextPath), { recursive: true });
  const database = new DatabaseSync(nextPath);
  runMigrations(database);
  runLegacyJsonImport(database);
  db = database;
  dbPath = nextPath;
  return database;
}

export function closeDatabase(): void {
  if (!db) return;
  db.close();
  db = null;
  dbPath = null;
}

export function withDatabaseTransaction<T>(operation: () => T): T {
  const database = getDatabase();

  if (database.isTransaction) {
    return operation();
  }

  try {
    database.exec("BEGIN IMMEDIATE;");
    const result = operation();
    database.exec("COMMIT;");
    return result;
  } catch (error) {
    if (database.isTransaction) database.exec("ROLLBACK;");
    throw error;
  }
}

export function listAppliedMigrations(): Array<{ id: string; applied_at: string }> {
  return getDatabase()
    .prepare(
      `SELECT id, applied_at
       FROM schema_migrations
       ORDER BY applied_at ASC, id ASC`,
    )
    .all() as Array<{ id: string; applied_at: string }>;
}

export function getStorageStatus() {
  const database = getDatabase();
  const documentCount = database
    .prepare("SELECT COUNT(*) AS count FROM documents")
    .get() as { count: number };
  const auditCount = database
    .prepare("SELECT COUNT(*) AS count FROM audit_events")
    .get() as { count: number };
  const exportManifestCount = database
    .prepare("SELECT COUNT(*) AS count FROM export_manifests")
    .get() as { count: number };
  const exportPackageCount = database
    .prepare("SELECT COUNT(*) AS count FROM export_packages")
    .get() as { count: number };

  return {
    driver: "sqlite",
    database_path: getDatabasePath(),
    migration_count: listAppliedMigrations().length,
    document_count: documentCount.count,
    audit_event_count: auditCount.count,
    export_manifest_count: exportManifestCount.count,
    export_package_count: exportPackageCount.count,
    journal_mode: (database.prepare("PRAGMA journal_mode").get() as { journal_mode: string }).journal_mode,
    foreign_keys: (database.prepare("PRAGMA foreign_keys").get() as { foreign_keys: number }).foreign_keys === 1,
  };
}
