import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveRepoRoot, generateInventory, buildChecksums } from '../core/index.mjs';

const repoRoot = resolveRepoRoot(import.meta.url);
const packageOutRoot = path.join(repoRoot, 'build/windows-portable-bundled-runtime-internal');
const latestPackageRootFile = path.join(packageOutRoot, 'latest-package-root.txt');
const pkgRoot = fs.existsSync(latestPackageRootFile)
  ? fs.readFileSync(latestPackageRootFile, 'utf8').trim()
  : path.join(packageOutRoot, 'staging/windows-portable-bundled-runtime-internal');
const manifestForPkgRoot = path.join(pkgRoot, 'package-manifest.json');
const runtimeMetaPath = path.join(repoRoot, 'docs/adr/runtime/node-windows-x64.json');
const wrapperPath = path.join(repoRoot, 'scripts/windows/portable-bundled-runtime.ps1');
const lifecyclePath = path.join(repoRoot, 'scripts/windows/portable-operator-candidate.ps1');

function packageInventory(root) {
  return generateInventory(root).filter((item) => item !== 'package-manifest.json');
}

test('Windows runtime metadata is pinned for the bundled-runtime package', () => {
  const metadata = JSON.parse(fs.readFileSync(runtimeMetaPath, 'utf8'));
  assert.equal(metadata.platform, 'windows');
  assert.equal(metadata.arch, 'x64');
  assert.match(metadata.source, /^https:\/\/nodejs\.org\/dist\//);
  assert.match(metadata.sha256, /^[a-f0-9]{64}$/);
  assert.notEqual(metadata.sha256, 'PINNED_AT_BUILD_TIME');
  assert.equal(metadata.bundledRuntimeLocation, 'runtime/node');
  assert.equal(metadata.nodeExecutable, 'runtime/node/node.exe');
  assert.equal(metadata.npmIncluded, false);
  assert.equal(metadata.npmUsedAtRuntime, false);
});

test('bundled-runtime wrapper delegates lifecycle to packaged Node and packaged dependencies', () => {
  const wrapper = fs.readFileSync(wrapperPath, 'utf8');
  assert.match(wrapper, /runtime\\node\\node\.exe/);
  assert.match(wrapper, /EDELPHI_PORTABLE_NODE_EXE/);
  assert.match(wrapper, /EDELPHI_SERVER_NODE_MODULES_SOURCE/);
  assert.match(wrapper, /EDELPHI_SKIP_RUNTIME_NPM_INSTALL\s*=\s*'1'/);
  assert.match(wrapper, /EDELPHI_RUNTIME_SUBDIR\s*=\s*'windows-portable-bundled-runtime-internal'/);
});

test('portable lifecycle script does not launch ambient node/npm/npx for runtime processes', () => {
  const lifecycle = fs.readFileSync(lifecyclePath, 'utf8');
  assert.match(lifecycle, /\$NodeCommand/);
  assert.match(lifecycle, /EDELPHI_SERVER_NODE_MODULES_SOURCE/);
  assert.match(lifecycle, /EDELPHI_SKIP_RUNTIME_NPM_INSTALL/);
  assert.doesNotMatch(lifecycle, /Set-ProcessEnvAndStart\s+-filePath\s+['"]?(node|npm|npx|npm\.cmd)/i);
  assert.doesNotMatch(lifecycle, /Start-Process\s+-FilePath\s+['"]?(node|npm|npx|npm\.cmd)/i);
});

test('portable lifecycle script quotes Start-Process arguments for paths with spaces', () => {
  const lifecycle = fs.readFileSync(lifecyclePath, 'utf8');
  assert.match(lifecycle, /function ConvertTo-ProcessArgument/);
  assert.match(lifecycle, /function ConvertTo-ProcessArgumentList/);
  assert.match(lifecycle, /Set-ProcessEnvAndStart[\s\S]*Start-Process[\s\S]*-ArgumentList \(ConvertTo-ProcessArgumentList \$arguments\)/);
  assert.match(lifecycle, /\$ui = Start-Process[\s\S]*-ArgumentList \(ConvertTo-ProcessArgumentList @\(\$staticServer,'--root',\$uiRoot/);
});

test('portable lifecycle start reopens browser when already running', () => {
  const lifecycle = fs.readFileSync(lifecyclePath, 'utf8');
  assert.match(lifecycle, /function Open-OperatorUi/);
  assert.match(lifecycle, /if \(\$backendRunning -and \$uiRunning\) \{[\s\S]*Open-OperatorUi \$existingUrl[\s\S]*return/);
  assert.doesNotMatch(lifecycle, /Prototype already running with backend pid/);
});

test('portable lifecycle can stop when an attached browser closes', () => {
  const lifecycle = fs.readFileSync(lifecyclePath, 'utf8');
  assert.match(lifecycle, /EDELPHI_STOP_ON_BROWSER_CLOSE/);
  assert.match(lifecycle, /function Get-AttachedBrowserPath/);
  assert.match(lifecycle, /Microsoft Edge or Google Chrome/);
  assert.match(lifecycle, /--app=\$url/);
  assert.match(lifecycle, /function Wait-ForAttachedBrowserClose/);
  assert.match(lifecycle, /function Assert-AttachedLifecycleBrowserAvailable/);
  assert.match(lifecycle, /Attached browser window closed; stopping Delphi Commons runtime/);
  assert.match(lifecycle, /Wait-ForAttachedBrowserClose -profileDir \$attachedBrowser\.ProfileDir -starterProcessId \$attachedBrowser\.StarterProcessId/);
  assert.match(lifecycle, /Assert-AttachedLifecycleBrowserAvailable[\s\S]*Assert-NodeRuntime/);
  assert.match(lifecycle, /Attached lifecycle browser launch failed; stopping runtime before surfacing error/);
});

test('manifest and checksums integrity when package exists', { skip: !fs.existsSync(manifestForPkgRoot) }, () => {
  const manifestPath = manifestForPkgRoot;
  assert.ok(fs.existsSync(manifestPath));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const inventory = packageInventory(pkgRoot);
  assert.deepEqual(manifest.inventory, inventory);
  assert.deepEqual(manifest.checksums, buildChecksums(pkgRoot, inventory));
  assert.equal(manifest.runtimeMetadata.nodeExecutableRelativePath, 'runtime/node/node.exe');
  assert.equal(manifest.runtimeMetadata.npmIncluded, false);
  assert.equal(manifest.runtimeMetadata.npmUsedAtRuntime, false);
  assert.ok(fs.existsSync(path.join(pkgRoot, manifest.runtimeMetadata.nodeExecutableRelativePath)));
  assert.ok(fs.existsSync(path.join(pkgRoot, 'server/node_modules')));
});
