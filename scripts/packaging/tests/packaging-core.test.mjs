import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  resolveRepoRoot,
  resolveUnderRoot,
  validatePackageConfig,
  buildManifest,
  buildRuntimeMetadata,
  generateInventory,
  scanForbiddenMaterial,
  scanOverclaimText,
  enforceRuntimePathPolicy,
  sha256File
} from '../core/index.mjs';

test('repo root resolution decodes file URL paths', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'packaging core space-'));
  const repoRoot = path.join(temp, 'repo root');
  const coreFile = path.join(repoRoot, 'scripts', 'packaging', 'core', 'index.mjs');
  fs.mkdirSync(path.dirname(coreFile), { recursive: true });
  fs.writeFileSync(coreFile, '', 'utf8');

  assert.equal(resolveRepoRoot(pathToFileURL(coreFile).href), repoRoot);
});

test('config validation enforces 127.0.0.1', () => {
  assert.throws(() => validatePackageConfig({ label: 'a', track: 'b', platform: 'c', runtimeRootConvention: '/tmp', networkBindAddress: '0.0.0.0' }));
});

test('manifest includes required shape', () => {
  const config = validatePackageConfig({ label: 'l', track: 't', platform: 'windows', runtimeRootConvention: 'x' });
  const runtimeMetadata = buildRuntimeMetadata({
    nodeVersion: '20.0.0',
    npmVersion: null,
    platform: 'windows',
    arch: 'x64',
    source: 'https://example.test/node.zip',
    sourceSha256: 'a'.repeat(64),
    sourceLicense: 'MIT',
    bundledRuntimeRelativePath: 'runtime/node',
    nodeExecutableRelativePath: 'runtime/node/node.exe',
    npmIncluded: false,
    npmUsedAtRuntime: false
  });
  const manifest = buildManifest({ config, inventory: ['README.txt'], checksums: { 'README.txt': 'abc' }, runtimeMetadata });
  assert.equal(manifest.networkBindAddress, '127.0.0.1');
  assert.equal(manifest.runtimeMetadata.bundled, true);
  assert.equal(manifest.runtimeMetadata.nodeExecutableRelativePath, 'runtime/node/node.exe');
  assert.equal(manifest.runtimeMetadata.npmUsedAtRuntime, false);
});

test('forbidden-material scan detects blocked names', () => {
  const hits = scanForbiddenMaterial(['server/.env', 'docs/readme.md']);
  assert.deepEqual(hits, ['server/.env']);
});

test('overclaim scan detects readiness overclaims', () => {
  const hits = scanOverclaimText('This is production-ready, ready for human testing, and claims real SMS readiness and PWA readiness.');
  assert.ok(hits.length >= 4);
});

test('overclaim scan detects standalone IRB approval claims', () => {
  assert.ok(scanOverclaimText('This package has IRB approval.').length >= 1);
  assert.ok(scanOverclaimText('This package has IRB/ethics approval.').length >= 1);
  assert.ok(scanOverclaimText('This package has ethics approval.').length >= 1);
});

test('runtime path policy forbids runtime under package root', () => {
  assert.throws(() => enforceRuntimePathPolicy({ packageRoot: '/tmp/pkg', runtimeRoot: '/tmp/pkg/runtime' }));
});

test('runtime path policy normalizes Windows path case', { skip: process.platform !== 'win32' }, () => {
  assert.throws(() => enforceRuntimePathPolicy({
    packageRoot: 'C:\\PackageRoot',
    runtimeRoot: 'c:\\packageroot\\runtime'
  }));
});

test('root path resolution normalizes Windows path case', { skip: process.platform !== 'win32' }, () => {
  assert.equal(resolveUnderRoot('C:\\PackageRoot', 'c:\\packageroot\\child'), path.resolve('c:\\packageroot\\child'));
});

test('inventory + checksum generation works', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'packaging-core-'));
  const file = path.join(temp, 'a.txt');
  fs.writeFileSync(file, 'hello', 'utf8');
  const inventory = generateInventory(temp);
  assert.deepEqual(inventory, ['a.txt']);
  assert.equal(sha256File(file).length, 64);
});
