import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildChecksums } from '../core/index.mjs';
import {
  stageServerProductionDependencies,
  copyCommonPortablePayload,
  buildInventoryAndChecksums,
  verifyPortablePackage
} from '../core/portable-shared.mjs';

function copyPath(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
}

test('stageServerProductionDependencies uses provided runner and staging root', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'portable-shared-stage-'));
  const repoRoot = path.join(temp, 'repo');
  const productionDepsRoot = path.join(temp, 'deps');
  fs.mkdirSync(path.join(repoRoot, 'server'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'server/package.json'), '{"name":"srv"}', 'utf8');
  fs.writeFileSync(path.join(repoRoot, 'server/package-lock.json'), '{"lockfileVersion":3}', 'utf8');

  const calls = [];
  const run = (cmd, args, cwd) => calls.push({ cmd, args, cwd });

  const nodeModules = stageServerProductionDependencies({
    repoRoot,
    productionDepsRoot,
    npmCommand: 'npm',
    run,
    copyPath
  });

  assert.equal(nodeModules, path.join(productionDepsRoot, 'node_modules'));
  assert.equal(fs.existsSync(path.join(productionDepsRoot, 'package.json')), true);
  assert.equal(fs.existsSync(path.join(productionDepsRoot, 'package-lock.json')), true);
  assert.deepEqual(calls, [{ cmd: 'npm', args: ['--prefix', productionDepsRoot, 'ci', '--omit=dev'], cwd: repoRoot }]);
});

test('copyCommonPortablePayload copies invariant files', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'portable-shared-copy-'));
  const repoRoot = path.join(temp, 'repo');
  const packageRoot = path.join(temp, 'pkg');
  const productionNodeModules = path.join(temp, 'prod/node_modules');

  fs.mkdirSync(path.join(repoRoot, 'app/dist'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'app/dist/index.html'), 'app', 'utf8');
  fs.mkdirSync(path.join(repoRoot, 'server/dist'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'server/dist/index.js'), 'server', 'utf8');
  fs.mkdirSync(path.join(repoRoot, 'server'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'server/package.json'), '{}', 'utf8');
  fs.writeFileSync(path.join(repoRoot, 'server/package-lock.json'), '{}', 'utf8');
  fs.mkdirSync(path.join(repoRoot, 'scripts/windows'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, 'scripts/windows/static-file-server.mjs'), 'export{}', 'utf8');
  fs.writeFileSync(path.join(repoRoot, 'LICENSE'), 'license', 'utf8');
  fs.writeFileSync(path.join(repoRoot, 'NOTICE'), 'notice', 'utf8');
  fs.mkdirSync(productionNodeModules, { recursive: true });
  fs.writeFileSync(path.join(productionNodeModules, 'x.js'), 'mod', 'utf8');

  copyCommonPortablePayload({ repoRoot, packageRoot, productionNodeModules, copyPath });

  for (const rel of ['app/dist/index.html', 'server/dist/index.js', 'server/package.json', 'server/package-lock.json', 'server/node_modules/x.js', 'tools/static-file-server.mjs', 'LICENSE', 'NOTICE']) {
    assert.equal(fs.existsSync(path.join(packageRoot, rel)), true, rel);
  }
});

test('buildInventoryAndChecksums excludes package-manifest.json', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'portable-shared-manifest-'));
  fs.mkdirSync(path.join(temp, 'nested'), { recursive: true });
  fs.writeFileSync(path.join(temp, 'a.txt'), 'a', 'utf8');
  fs.writeFileSync(path.join(temp, 'nested/b.txt'), 'b', 'utf8');
  fs.writeFileSync(path.join(temp, 'package-manifest.json'), '{}', 'utf8');

  const { inventory, checksums } = buildInventoryAndChecksums(temp);
  assert.deepEqual(inventory, ['a.txt', 'nested/b.txt']);
  assert.deepEqual(checksums, buildChecksums(temp, inventory));
  assert.equal(checksums['package-manifest.json'], undefined);
});

test('verifyPortablePackage delegates to verification with defaults', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'portable-shared-verify-'));
  const packageRoot = path.join(temp, 'pkg');
  const runtimeRoot = path.join(temp, 'runtime');
  fs.mkdirSync(path.join(packageRoot, 'server/dist'), { recursive: true });
  fs.mkdirSync(runtimeRoot, { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'README.txt'), 'Internal synthetic testing package only.', 'utf8');
  fs.writeFileSync(path.join(packageRoot, 'evidence-template.md'), '# Evidence\n\nNOT RUN', 'utf8');
  fs.writeFileSync(path.join(packageRoot, 'package-manifest.json'), JSON.stringify({ runtimeRootConvention: '/tmp/runtime', networkBindAddress: '127.0.0.1' }), 'utf8');

  const result = verifyPortablePackage({ packageRoot, runtimeRoot });
  assert.equal(typeof result.ok, 'boolean');
});
