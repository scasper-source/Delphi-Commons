import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import {
  buildChecksums,
  buildManifest,
  buildRuntimeMetadata,
  generateInventory,
  scanForbiddenMaterial,
  scanOverclaimText,
  sha256File
} from './core/index.mjs';
import { verifyPackageEvidence } from './core/verification.mjs';
import { buildMacosAdapterConfig } from './adapters/macos.mjs';

const repoRoot = process.cwd();
const outRoot = path.join(repoRoot, 'build/macos-installer');
const buildId = `run-${Date.now()}-${process.pid}`;
const packageName = 'delphi-commons-macos-installer-internal';
const packageRoot = path.join(outRoot, 'staging', buildId, packageName);
const command = process.argv[2] ?? 'build';

const run = (file, args, cwd = repoRoot) => execFileSync(file, args, { stdio: 'inherit', cwd });
const copyPath = (src, dst) => {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true, force: true });
};

function buildRuntimeMetadataFromAdr() {
  const meta = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/adr/runtime/node-macos-arm64.json'), 'utf8'));
  return buildRuntimeMetadata({
    nodeVersion: meta.nodeVersion,
    npmVersion: meta.npmIncluded ? meta.npmVersion : null,
    platform: meta.platform,
    arch: meta.arch,
    source: meta.source,
    sourceSha256: meta.sha256,
    sourceLicense: meta.license,
    bundled: true,
    bundledRuntimeRelativePath: meta.bundledRuntimeLocation,
    nodeExecutableRelativePath: meta.nodeExecutable,
    npmIncluded: !!meta.npmIncluded,
    npmUsedAtRuntime: !!meta.npmUsedAtRuntime
  });
}

function stagePackage() {
  run('node', ['scripts/packaging/macos-portable.mjs', 'build']);
  const latestPortableRoot = fs.readFileSync(path.join(repoRoot, 'build/macos-portable-bundled-runtime-internal/latest-package-root.txt'), 'utf8').trim();
  fs.mkdirSync(packageRoot, { recursive: true });
  copyPath(latestPortableRoot, packageRoot);
  copyPath(path.join(repoRoot, 'scripts/macos/portable-bundled-runtime.sh'), path.join(packageRoot, 'scripts/macos/delphi-commons'));
  fs.chmodSync(path.join(packageRoot, 'scripts/macos/delphi-commons'), 0o755);

  const installerRuntimeRoot = '~/Library/Application Support/DelphiCommons/macos-installer-candidate';
  const config = buildMacosAdapterConfig('macos-installer-candidate-internal');
  const inventory = generateInventory(packageRoot).filter((item) => item !== 'package-manifest.json');
  const checksums = buildChecksums(packageRoot, inventory);
  const manifest = buildManifest({
    config: { ...config, runtimeRootConvention: installerRuntimeRoot },
    inventory,
    checksums,
    runtimeMetadata: buildRuntimeMetadataFromAdr(),
    packageName,
    packageVersion: '0.0.0-internal',
    commitHash: execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim(),
    limitations: [
      'Internal synthetic/low-risk operator testing only.',
      'pkgbuild/productbuild and install lifecycle require a real macOS host.',
      'Signing/notarization/Gatekeeper checks are NOT RUN unless credentials + Mac execution evidence exist.'
    ],
    nonClaims: [
      'No production/pilot/human-subjects readiness claim.',
      'No broad macOS support claim.',
      'No App Store/notarization/public distribution claim.'
    ]
  });
  manifest.buildTimestampUtc = new Date().toISOString();
  manifest.buildTimeDependencies = 'Node/npm required at build time';
  manifest.runtimeDependencies = 'No local Node/npm required at runtime; packaged runtime used';
  manifest.signingStatus = 'NOT RUN / CREDENTIALS UNAVAILABLE';
  manifest.notarizationStatus = 'NOT RUN / CREDENTIALS UNAVAILABLE';
  manifest.gatekeeperStatus = 'NOT RUN';

  if (scanForbiddenMaterial(inventory).length) throw new Error('Forbidden material detected in staged package.');
  if (scanOverclaimText(JSON.stringify(manifest)).length) throw new Error('Overclaim scan failed for installer manifest.');
  fs.writeFileSync(path.join(packageRoot, 'package-manifest.json'), JSON.stringify(manifest, null, 2));
}

function buildInstallerArtifact() {
  const pkgPath = path.join(outRoot, `${packageName}.pkg`);
  const payloadRoot = path.join(outRoot, 'pkgroot');
  fs.rmSync(payloadRoot, { recursive: true, force: true });
  fs.mkdirSync(path.join(payloadRoot, 'Applications', 'Delphi Commons'), { recursive: true });
  copyPath(packageRoot, path.join(payloadRoot, 'Applications', 'Delphi Commons', 'package'));

  const isMac = process.platform === 'darwin';
  const hasPkgbuild = isMac && fs.existsSync('/usr/bin/pkgbuild');
  if (hasPkgbuild) {
    run('/usr/bin/pkgbuild', ['--root', payloadRoot, '--identifier', 'org.delphi.commons.internal', '--version', '0.0.0', pkgPath]);
  } else {
    fs.writeFileSync(path.join(outRoot, 'PKG_NOT_RUN.txt'), 'NOT RUN: pkgbuild unavailable because this build did not run on macOS with pkgbuild.');
  }

  const inventory = generateInventory(outRoot);
  const checksums = Object.fromEntries(inventory.map((rel) => [rel, sha256File(path.join(outRoot, rel))]));
  fs.writeFileSync(path.join(outRoot, 'checksums.json'), JSON.stringify(checksums, null, 2));
}

function verify() {
  const runtimeRoot = path.join(process.env.HOME || '/tmp', 'Library/Application Support/DelphiCommons/macos-installer-candidate');
  const result = verifyPackageEvidence({ packageRoot, runtimeRoot, overclaimFiles: ['package-manifest.json', 'README.txt'] });
  if (!result.ok) throw new Error(result.failures.join('\n'));
}

if (command === 'build') {
  stagePackage();
  buildInstallerArtifact();
} else if (command === 'verify') {
  verify();
} else {
  throw new Error(`Unsupported command: ${command}`);
}
