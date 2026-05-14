import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const RUNTIME_METADATA_SCHEMA_VERSION = '1.0.0';
export const MANIFEST_SCHEMA_VERSION = '1.0.0';

function filesystemPathFromFileReference(fileReference) {
  if (fileReference instanceof URL) return fileURLToPath(fileReference);
  if (typeof fileReference === 'string' && fileReference.startsWith('file:')) {
    return fileURLToPath(fileReference);
  }
  return path.resolve(String(fileReference));
}

function normalizeForPathComparison(filePath) {
  const resolved = path.resolve(filePath);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function isSameOrInside(childPath, rootPath) {
  const child = normalizeForPathComparison(childPath);
  const root = normalizeForPathComparison(rootPath);
  const rootWithSeparator = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  return child === root || child.startsWith(rootWithSeparator);
}

export function resolveRepoRoot(fromFile = import.meta.url) {
  return path.resolve(path.dirname(filesystemPathFromFileReference(fromFile)), '../../..');
}

export function resolveUnderRoot(rootPath, ...segments) {
  const resolved = path.resolve(rootPath, ...segments);
  if (!isSameOrInside(resolved, rootPath)) {
    throw new Error(`Path escapes root: ${resolved}`);
  }
  return resolved;
}

export function validatePackageConfig(config) {
  const required = ['label', 'track', 'platform', 'runtimeRootConvention'];
  for (const key of required) {
    if (!config[key] || typeof config[key] !== 'string') {
      throw new Error(`Invalid package config: ${key} is required string.`);
    }
  }
  if (config.networkBindAddress && config.networkBindAddress !== '127.0.0.1') {
    throw new Error('Only 127.0.0.1 network binding is allowed in Phase 2 packaging hardening.');
  }
  return Object.freeze({ networkBindAddress: '127.0.0.1', ...config });
}

export function buildRuntimeMetadata({ nodeVersion, npmVersion, source, sourceSha256, sourceLicense, bundled = true }) {
  if (!nodeVersion || !npmVersion || !source) {
    throw new Error('Runtime metadata requires nodeVersion, npmVersion, and source.');
  }
  return {
    schemaVersion: RUNTIME_METADATA_SCHEMA_VERSION,
    nodeVersion,
    npmVersion,
    source,
    sourceSha256,
    sourceLicense,
    bundled
  };
}

export function generateInventory(rootDir) {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath).split(path.sep).join('/');
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(relPath);
      }
    }
  };
  walk(rootDir);
  return files.sort();
}

export function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

export function buildChecksums(root, inventory) {
  return Object.fromEntries(inventory.map((rel) => [rel, sha256File(path.join(root, rel))]));
}

export function scanForbiddenMaterial(
  inventory,
  forbiddenPatterns = [/\.git(\/|$)/i, /\.env/i, /secret/i, /id_rsa/i, /\/db\//i, /\/logs\//i, /\/backups\//i, /\/evidence\//i]
) {
  return inventory.filter((item) => forbiddenPatterns.some((p) => p.test(item)));
}

export function scanOverclaimText(text) {
  const patterns = [
    /production[- ]ready/i,
    /pilot[- ]ready/i,
    /ready for human testing/i,
    /support readiness/i
  ];
  return patterns.filter((p) => p.test(text)).map((p) => p.source);
}

export function enforceRuntimePathPolicy({ packageRoot, runtimeRoot }) {
  const packageAbs = path.resolve(packageRoot);
  const runtimeAbs = path.resolve(runtimeRoot);
  if (isSameOrInside(runtimeAbs, packageAbs)) {
    throw new Error('Runtime root cannot live inside immutable package root.');
  }
  return true;
}

export function generateEvidenceTemplate({ platform, outputPath }) {
  fs.writeFileSync(
    outputPath,
    `# ${platform} Portable Bundled Runtime Evidence Template\n\n- Date:\n- Commit:\n- Package label:\n- Runtime metadata schema version: ${RUNTIME_METADATA_SCHEMA_VERSION}\n- Manifest schema version: ${MANIFEST_SCHEMA_VERSION}\n- Lifecycle execution: NOT RUN\n- Reason (if NOT RUN):\n`,
    'utf8'
  );
}

export function buildManifest({ config, inventory, checksums, runtimeMetadata, packageName, packageVersion, commitHash, limitations = [], nonClaims = [] }) {
  return {
    manifestSchemaVersion: MANIFEST_SCHEMA_VERSION,
    packageLabel: config.label,
    packageName,
    packageVersion,
    track: config.track,
    platform: config.platform,
    arch: config.arch,
    commitHash,
    networkBindAddress: '127.0.0.1',
    runtimeRootConvention: config.runtimeRootConvention,
    runtimeMetadata,
    inventory,
    checksums,
    limitations,
    nonClaims
  };
}
