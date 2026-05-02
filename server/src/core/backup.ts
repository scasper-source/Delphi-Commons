import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { getAuditDir, getBackupDir } from "./paths.js";
import { closeDatabase, getDatabase, getDatabasePath, listAppliedMigrations } from "./database.js";
import { verifyAuditIntegrity } from "./audit.js";
import { inspectDataIntegrity } from "./dataIntegrity.js";

export type BackupManifest = {
  backup_id: string;
  created_at: string;
  reason: string;
  database_path: string;
  audit_path: string;
  files: Array<{
    label: "database" | "audit_log";
    path: string;
    sha256: string;
    bytes: number;
  }>;
  migrations: Array<{ id: string; applied_at: string }>;
  audit_integrity: ReturnType<typeof verifyAuditIntegrity>;
  data_integrity: ReturnType<typeof inspectDataIntegrity>;
};

function sha256File(filePath: string): string {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function copyIfExists(input: {
  label: "database" | "audit_log";
  source: string;
  destination: string;
}): BackupManifest["files"][number] | null {
  if (!fs.existsSync(input.source)) return null;
  fs.mkdirSync(path.dirname(input.destination), { recursive: true });
  fs.copyFileSync(input.source, input.destination);
  const stat = fs.statSync(input.destination);
  return {
    label: input.label,
    path: input.destination,
    sha256: sha256File(input.destination),
    bytes: stat.size,
  };
}

export function createBackup(reason = "manual"): BackupManifest {
  const database = getDatabase();
  database.exec("PRAGMA wal_checkpoint(FULL);");

  const backupId = randomUUID();
  const createdAt = new Date().toISOString();
  const backupRoot = path.join(getBackupDir(), backupId);
  fs.mkdirSync(backupRoot, { recursive: true });

  const databasePath = getDatabasePath();
  const auditPath = path.join(getAuditDir(), "audit.log");
  const files = [
    copyIfExists({
      label: "database",
      source: databasePath,
      destination: path.join(backupRoot, "edelphi.sqlite"),
    }),
    copyIfExists({
      label: "audit_log",
      source: auditPath,
      destination: path.join(backupRoot, "audit.log"),
    }),
  ].filter((file): file is BackupManifest["files"][number] => Boolean(file));

  const manifest: BackupManifest = {
    backup_id: backupId,
    created_at: createdAt,
    reason,
    database_path: path.join(backupRoot, "edelphi.sqlite"),
    audit_path: path.join(backupRoot, "audit.log"),
    files,
    migrations: listAppliedMigrations(),
    audit_integrity: verifyAuditIntegrity(),
    data_integrity: inspectDataIntegrity(),
  };

  fs.writeFileSync(path.join(backupRoot, "manifest.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}

export function listBackups(): BackupManifest[] {
  const root = getBackupDir();
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const manifestPath = path.join(root, entry.name, "manifest.json");
      if (!fs.existsSync(manifestPath)) return [];
      return [JSON.parse(fs.readFileSync(manifestPath, "utf8")) as BackupManifest];
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function restoreBackup(backupId: string): BackupManifest {
  const manifestPath = path.join(getBackupDir(), backupId, "manifest.json");
  if (!fs.existsSync(manifestPath)) throw new Error("backup_not_found");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as BackupManifest;

  const databaseBackup = manifest.files.find((file) => file.label === "database");
  if (!databaseBackup || !fs.existsSync(databaseBackup.path)) throw new Error("backup_database_missing");

  closeDatabase();
  const targetDatabasePath = getDatabasePath();
  fs.mkdirSync(path.dirname(targetDatabasePath), { recursive: true });
  fs.copyFileSync(databaseBackup.path, targetDatabasePath);

  const auditBackup = manifest.files.find((file) => file.label === "audit_log");
  if (auditBackup && fs.existsSync(auditBackup.path)) {
    const targetAuditPath = path.join(getAuditDir(), "audit.log");
    fs.mkdirSync(path.dirname(targetAuditPath), { recursive: true });
    fs.copyFileSync(auditBackup.path, targetAuditPath);
  }

  getDatabase();
  return manifest;
}
