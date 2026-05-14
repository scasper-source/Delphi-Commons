import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const RUNTIME_METADATA_SCHEMA_VERSION = '1.0.0';
export const MANIFEST_SCHEMA_VERSION = '1.0.0';

export function resolveRepoRoot(fromFile = import.meta.url) {
  return path.resolve(path.dirname(new URL(fromFile).pathname), '../../..');
}

export function resolveUnderRoot(rootPath, ...segments) {
  const resolved = path.resolve(rootPath, ...segments);
  const normalizedRoot = path.resolve(rootPath) + path.sep;
  if (!(resolved + path.sep).startsWith(normalizedRoot) && resolved !== path.resolve(rootPath)) {
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

export function buildRuntimeMetadata({ nodeVersion, npmVersion, source }) {
  if (!nodeVersion || !npmVersion || !source) {
    throw new Error('Runtime metadata requires nodeVersion, npmVersion, and source.');
  }
  return {
    schemaVersion: RUNTIME_METADATA_SCHEMA_VERSION,
    nodeVersion,
    npmVersion,
    source,
    bundled: false
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
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

export function scanForbiddenMaterial(inventory, forbiddenPatterns = [/\.env$/i, /id_rsa/i, /secret/i]) {
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
  if ((runtimeAbs + path.sep).startsWith(packageAbs + path.sep) || runtimeAbs === packageAbs) {
    throw new Error('Runtime root cannot live inside immutable package root.');
  }
  return true;
}

export function generateEvidenceTemplate({ platform, outputPath }) {
  const template = `# ${platform} Portable Bundled Runtime Evidence Template\n\n- Date:\n- Commit:\n- Package label:\n- Runtime metadata schema version: ${RUNTIME_METADATA_SCHEMA_VERSION}\n- Manifest schema version: ${MANIFEST_SCHEMA_VERSION}\n- Non-claim check: local Node/npm prerequisite remains until bundled runtime evidence exists.\n`;
  fs.writeFileSync(outputPath, template, 'utf8');
}

export function buildManifest({ config, inventory, checksums, runtimeMetadata }) {
  return {
    manifestSchemaVersion: MANIFEST_SCHEMA_VERSION,
    packageLabel: config.label,
    track: config.track,
    platform: config.platform,
    networkBindAddress: '127.0.0.1',
    runtimeRootConvention: config.runtimeRootConvention,
    runtimeMetadata,
    inventory,
    checksums
  };
}
