import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { verifyPackageEvidence } from '../core/verification.mjs';

function makePkg(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pkg-verify-'));
  for (const [rel, content] of Object.entries(files)) {
    const p = path.join(root, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content, 'utf8');
  }
  return root;
}

test('package verification passes for coherent manifest/inventory/checksums', async () => {
  const root = makePkg({
    'README.txt': 'internal package',
    'evidence-template.md': 'NOT RUN\nHUMAN_REQUIRED\nSIGNOFF_REQUIRED\nDEPLOYMENT_REQUIRED',
    'server/dist/routes/sms.js': 'export const route = true;',
    'server/dist/exports/exportPrivacy.js': 'export const renderer = true;',
    'server/node_modules/ret/dist/tokenizer.js': 'export const tokenizer = true;'
  });
  const { buildChecksums } = await import('../core/index.mjs');
  const inventory = [
    'README.txt',
    'evidence-template.md',
    'server/dist/routes/sms.js',
    'server/dist/exports/exportPrivacy.js',
    'server/node_modules/ret/dist/tokenizer.js'
  ].sort();
  const checksums = buildChecksums(root, inventory);
  fs.writeFileSync(path.join(root, 'package-manifest.json'), JSON.stringify({
    manifestSchemaVersion: '1.0.0', packageLabel: 'x', packageName: 'y', packageVersion: '0', track: 'internal', platform: 'windows',
    commitHash: 'abc', networkBindAddress: '127.0.0.1', runtimeRootConvention: '%LOCALAPPDATA%/Delphi', runtimeMetadata: {},
    inventory, checksums, limitations: [], nonClaims: []
  }));
  const res = verifyPackageEvidence({ packageRoot: root, runtimeRoot: path.join(root, '..', 'runtime') });
  assert.equal(res.ok, true);
});

test('package verification fails for forbidden material and mismatched checksums', () => {
  const root = makePkg({ 'README.txt': 'internal package', '.env': 'secret=1' });
  fs.writeFileSync(path.join(root, 'package-manifest.json'), JSON.stringify({ manifestSchemaVersion: '1.0.0', inventory: ['README.txt'], checksums: {'README.txt':'bad'} }));
  const res = verifyPackageEvidence({ packageRoot: root, runtimeRoot: path.join(root, 'runtime') });
  assert.equal(res.ok, false);
  assert.ok(res.failures.some((f) => f.includes('Forbidden material')));
  assert.ok(res.failures.some((f) => f.includes('Runtime path policy violation')));
});
