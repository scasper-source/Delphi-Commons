import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveRepoRoot, generateInventory, buildChecksums } from '../core/index.mjs';

const repoRoot = resolveRepoRoot(import.meta.url);
const pkgRoot = path.join(repoRoot, 'build/windows-portable-bundled-runtime-internal/staging/windows-portable-bundled-runtime-internal');

test('manifest and checksums integrity when package exists', { skip: !fs.existsSync(pkgRoot) }, () => {
  const manifestPath = path.join(pkgRoot, 'package-manifest.json');
  assert.ok(fs.existsSync(manifestPath));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const inventory = generateInventory(pkgRoot);
  assert.deepEqual(manifest.inventory, inventory);
  assert.deepEqual(manifest.checksums, buildChecksums(pkgRoot, inventory));
});
