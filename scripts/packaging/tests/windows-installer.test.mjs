import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..');
const installerPackagerPath = path.join(repoRoot, 'scripts/packaging/windows-installer.mjs');
const wrapperPath = path.join(repoRoot, 'scripts/windows/installer-candidate-bundled-runtime.ps1');

function readPackager() {
  return fs.readFileSync(installerPackagerPath, 'utf8');
}

test('installer launcher template resolves package root from four parent levels and avoids scripts\\scripts', () => {
  const source = readPackager();
  assert.match(source, /GetParentFolderName\(fso\.GetParentFolderName\(fso\.GetParentFolderName\(fso\.GetParentFolderName\(WScript\.ScriptFullName\)\)\)\)/);
  assert.match(source, /installer-candidate-bundled-runtime\.ps1/);
  assert.doesNotMatch(source, /scripts\\\\scripts/i);
});

test('installer launch/stop/status VBS and installer wrapper targets are all generated', () => {
  const source = readPackager();
  assert.match(source, /delphi-commons-launch\.vbs/);
  assert.match(source, /delphi-commons-stop\.vbs/);
  assert.match(source, /delphi-commons-status\.vbs/);
  assert.match(source, /installer-candidate-bundled-runtime\.ps1/);
  assert.doesNotMatch(source, /portable-bundled-runtime\.ps1" \& Chr\(34\)/);
});

test('installer wrapper preserves thin-adapter routing to installer runtime root/subdir', () => {
  const wrapper = fs.readFileSync(wrapperPath, 'utf8');
  assert.match(wrapper, /InstallerRuntimeSubdir\s*=\s*'windows-installer-candidate'/);
  assert.match(wrapper, /DelphiCommons\\\$InstallerRuntimeSubdir/);
  assert.match(wrapper, /portable-bundled-runtime\.ps1/);
  assert.doesNotMatch(wrapper, /windows-portable-bundled-runtime-internal/);
});
