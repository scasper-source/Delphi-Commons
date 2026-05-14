import fs from 'node:fs';
import path from 'node:path';
import {
  MANIFEST_SCHEMA_VERSION,
  buildChecksums,
  enforceRuntimePathPolicy,
  scanForbiddenMaterial,
  scanOverclaimText
} from './index.mjs';

const DEFAULT_REQUIRED_MANIFEST_FIELDS = [
  'manifestSchemaVersion',
  'packageLabel',
  'packageName',
  'packageVersion',
  'track',
  'platform',
  'commitHash',
  'networkBindAddress',
  'runtimeRootConvention',
  'runtimeMetadata',
  'inventory',
  'checksums',
  'limitations',
  'nonClaims'
];

const DEFAULT_FORBIDDEN_PATTERNS = [
  /(^|\/)\.git(\/|$)/i,
  /(^|\/)\.env(\.|$)/i,
  /(^|\/)(id_rsa|id_dsa|\.ssh|\.pem|\.p12|\.key)(\/|$)/i,
  /(^|\/)(secrets?|credentials?)(\/|\.|$)/i,
  /(^|\/)(raw-)?(tokens?|otps?|sms-outbox|phone-content)(\.json|\.csv|\.txt|\/|$)/i,
  /\.(sqlite|db|log|bak|backup)$/i
];

const RUNTIME_ARTIFACT_DIR_NAMES = new Set(['db', 'logs', 'backups', 'evidence', 'exports', 'state', 'server-runtime']);

const RUNTIME_ARTIFACT_ALLOWLIST_PATTERNS = [
  /^server\/dist\/exports(\/|$)/i
];

function hasRuntimeArtifactDirectoryBeforeDependencies(item) {
  const segments = item.split('/');
  const dependencyIndex = segments.findIndex((segment) => segment.toLowerCase() === 'node_modules');
  const guardedSegments = dependencyIndex === -1 ? segments : segments.slice(0, dependencyIndex);
  return guardedSegments.some((segment) => RUNTIME_ARTIFACT_DIR_NAMES.has(segment.toLowerCase()));
}

function findRuntimeArtifactDirectories(inventory) {
  return inventory.filter((item) => {
    if (RUNTIME_ARTIFACT_ALLOWLIST_PATTERNS.some((pattern) => pattern.test(item))) return false;
    return hasRuntimeArtifactDirectoryBeforeDependencies(item);
  });
}

export function verifyPackageEvidence({ packageRoot, runtimeRoot, lifecycleChecks = {}, overclaimFiles = [] }) {
  const failures = [];
  const manifestPath = path.join(packageRoot, 'package-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing package manifest: ${manifestPath}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const field of DEFAULT_REQUIRED_MANIFEST_FIELDS) {
    if (!(field in manifest)) failures.push(`Missing manifest field: ${field}`);
  }
  if (manifest.manifestSchemaVersion !== MANIFEST_SCHEMA_VERSION) {
    failures.push(`Unsupported manifest schema version: ${manifest.manifestSchemaVersion}`);
  }
  if (!Array.isArray(manifest.inventory)) failures.push('Manifest inventory must be an array.');
  if (!manifest.checksums || typeof manifest.checksums !== 'object') failures.push('Manifest checksums must be an object.');

  const inventory = (manifest.inventory ?? []).slice().sort();
  const expectedChecksums = buildChecksums(packageRoot, inventory);
  const checksumKeys = Object.keys(manifest.checksums ?? {}).sort();
  if (JSON.stringify(checksumKeys) !== JSON.stringify(inventory)) {
    failures.push('Checksum inventory keys are incomplete or contain extras.');
  }
  if (JSON.stringify(manifest.checksums ?? {}) !== JSON.stringify(expectedChecksums)) {
    failures.push('Checksums do not match package contents.');
  }

  const actualInventory = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(packageRoot, full).split(path.sep).join('/');
      if (entry.isDirectory()) walk(full);
      else if (rel !== 'package-manifest.json') actualInventory.push(rel);
    }
  };
  walk(packageRoot);
  actualInventory.sort();
  if (JSON.stringify(actualInventory) !== JSON.stringify(inventory)) {
    failures.push('Package contents do not match manifest inventory.');
  }

  const forbiddenHits = [
    ...scanForbiddenMaterial(actualInventory, DEFAULT_FORBIDDEN_PATTERNS),
    ...findRuntimeArtifactDirectories(actualInventory)
  ];
  if (forbiddenHits.length) failures.push(`Forbidden material detected: ${forbiddenHits.join(', ')}`);

  try {
    enforceRuntimePathPolicy({ packageRoot, runtimeRoot });
  } catch (error) {
    failures.push(`Runtime path policy violation: ${error.message}`);
  }

  const defaultOverclaimFiles = ['README.txt', 'package-manifest.json', 'runbook.md', 'evidence-template.md'];
  for (const rel of [...new Set([...defaultOverclaimFiles, ...overclaimFiles])]) {
    const target = path.join(packageRoot, rel);
    if (!fs.existsSync(target)) continue;
    const hits = scanOverclaimText(fs.readFileSync(target, 'utf8'));
    if (hits.length) failures.push(`Overclaim text detected in ${rel}: ${hits.join(', ')}`);
  }

  for (const [name, result] of Object.entries(lifecycleChecks)) {
    if (!['NOT RUN', 'PASS', 'FAIL', 'HUMAN_REQUIRED', 'SIGNOFF_REQUIRED', 'DEPLOYMENT_REQUIRED'].includes(result.status)) {
      failures.push(`Invalid lifecycle status for ${name}: ${result.status}`);
    }
    if (result.status === 'FAIL') failures.push(`Lifecycle check failed: ${name} (${result.reason ?? 'no reason'})`);
  }

  return { ok: failures.length === 0, failures };
}

export function buildLifecycleEvidenceTemplate(platformLabel) {
  return `## Lifecycle Verification Hooks\n\n| Check | Status | Notes |\n| --- | --- | --- |\n| start | NOT RUN | DEPLOYMENT_REQUIRED |\n| health | NOT RUN | DEPLOYMENT_REQUIRED |\n| smoke | NOT RUN | HUMAN_REQUIRED |\n| status | NOT RUN | DEPLOYMENT_REQUIRED |\n| stop | NOT RUN | DEPLOYMENT_REQUIRED |\n\nInternal engineering evidence only. Preserve NOT RUN/HUMAN_REQUIRED/SIGNOFF_REQUIRED/DEPLOYMENT_REQUIRED until real execution artifacts are attached for ${platformLabel}.\n`;
}
