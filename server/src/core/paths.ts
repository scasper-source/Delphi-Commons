/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, "..", "..");

export function getDataDir(): string {
  return path.resolve(process.env.EDELPHI_DATA_DIR ?? path.join(SERVER_ROOT, "data"));
}

export function getAuditDir(): string {
  return path.resolve(process.env.EDELPHI_AUDIT_DIR ?? path.join(SERVER_ROOT, "audit"));
}

export function getBackupDir(): string {
  return path.resolve(process.env.EDELPHI_BACKUP_DIR ?? path.join(SERVER_ROOT, "backups"));
}
