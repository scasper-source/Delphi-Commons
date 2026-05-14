import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  validatePackageConfig,
  buildManifest,
  buildRuntimeMetadata,
  generateInventory,
  scanForbiddenMaterial,
  scanOverclaimText,
  enforceRuntimePathPolicy,
  sha256File
} from '../core/index.mjs';

test('config validation enforces 127.0.0.1', () => {
  assert.throws(() => validatePackageConfig({ label: 'a', track: 'b', platform: 'c', runtimeRootConvention: '/tmp', networkBindAddress: '0.0.0.0' }));
});

test('manifest includes required shape', () => {
  const config = validatePackageConfig({ label: 'l', track: 't', platform: 'windows', runtimeRootConvention: 'x' });
  const runtimeMetadata = buildRuntimeMetadata({ nodeVersion: '20.0.0', npmVersion: '10.0.0', source: 'local prerequisite' });
  const manifest = buildManifest({ config, inventory: ['README.txt'], checksums: { 'README.txt': 'abc' }, runtimeMetadata });
  assert.equal(manifest.networkBindAddress, '127.0.0.1');
  assert.equal(manifest.runtimeMetadata.bundled, true);
});

test('forbidden-material scan detects blocked names', () => {
  const hits = scanForbiddenMaterial(['server/.env', 'docs/readme.md']);
  assert.deepEqual(hits, ['server/.env']);
});

test('overclaim scan detects readiness overclaims', () => {
  const hits = scanOverclaimText('This is production-ready and ready for human testing.');
  assert.ok(hits.length >= 2);
});

test('runtime path policy forbids runtime under package root', () => {
  assert.throws(() => enforceRuntimePathPolicy({ packageRoot: '/tmp/pkg', runtimeRoot: '/tmp/pkg/runtime' }));
});

test('inventory + checksum generation works', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'packaging-core-'));
  const file = path.join(temp, 'a.txt');
  fs.writeFileSync(file, 'hello', 'utf8');
  const inventory = generateInventory(temp);
  assert.deepEqual(inventory, ['a.txt']);
  assert.equal(sha256File(file).length, 64);
});
