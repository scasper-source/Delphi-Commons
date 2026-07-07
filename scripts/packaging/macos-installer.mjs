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
const latestPackageRootFile = path.join(outRoot, 'latest-package-root.txt');
const command = process.argv[2] ?? 'build';
const packageRoot = command === 'build'
  ? path.join(outRoot, 'staging', buildId, packageName)
  : fs.existsSync(latestPackageRootFile)
    ? fs.readFileSync(latestPackageRootFile, 'utf8').trim()
    : path.join(outRoot, 'staging', packageName);

const run = (file, args, cwd = repoRoot) => execFileSync(file, args, { stdio: 'inherit', cwd });
const copyPath = (src, dst) => {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true, force: true });
};
const installerRuntimeRoot = '~/Library/Application Support/DelphiCommons/macos-installer-candidate';
const installLocation = '/Applications/Delphi Commons/package';
const appBundleName = 'Delphi Commons.app';
const appIconFileName = 'DelphiCommons.icns';

function writeInstallerWrapper(destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(
    destination,
    `#!/usr/bin/env bash
set -euo pipefail
if [[ "$#" -eq 0 ]]; then
  set -- start
fi
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
export EDELPHI_RUNTIME_ROOT="$HOME/Library/Application Support/DelphiCommons/macos-installer-candidate"
export EDELPHI_PORTABLE_NODE_EXE="$PACKAGE_ROOT/runtime/node/bin/node"
export EDELPHI_SERVER_NODE_MODULES_SOURCE="$PACKAGE_ROOT/server/node_modules"
export EDELPHI_SKIP_RUNTIME_NPM_INSTALL=1
exec "$PACKAGE_ROOT/scripts/macos/portable-operator-candidate.sh" "$@"
`,
    'utf8'
  );
  fs.chmodSync(destination, 0o755);
}

function buildInstallerReadme() {
  return `macOS Apple Silicon installer internal package

Status: INTERNAL PACKAGE CANDIDATE / NOT READY FOR HUMAN TESTING

Boundary:
- Use synthetic or low-risk test data only.
- This package is not production-ready, not pilot-ready, not public-release-ready, and not ready for real human-subjects data.
- Signing, notarization, Gatekeeper/quarantine behavior, clean-profile Mac execution, second-machine execution, and phone/operator walkthrough evidence are NOT RUN unless separate evidence is attached.

Normal launch path:
1. Install the release PKG.
2. Open /Applications/Delphi Commons/Delphi Commons.app.
3. The launcher starts local services and attempts to open http://127.0.0.1:4173 in the default browser.
4. If the browser does not show Delphi Commons, open http://127.0.0.1:4173 manually while the supervised run is active.
5. If Delphi Commons is already running, opening /Applications/Delphi Commons/Delphi Commons.app again reopens the operator browser against the existing runtime.

Ending the run:
- macOS app-window-close lifecycle is IMPLEMENTATION_REQUIRED / HUMAN_REQUIRED: closing the visible browser/app window has NOT been proven to stop the local runtime.
- For supervised internal runs, stop the runtime with: /Applications/Delphi\\ Commons/package/scripts/macos/delphi-commons stop

Admin/debug commands:
- status, stop, restart, smoke, backup, restore, reset, and uninstall are lifecycle/admin commands, not separate normal-user launch shortcuts.
- Do not present Stop or Status as ordinary operator shortcuts in package instructions.
`;
}

function buildMacosAppIcon(destination) {
  const iconBuildRoot = path.join(outRoot, 'app-icon');
  run('bash', ['scripts/macos/generate-app-icon.sh', path.join(repoRoot, 'assets/macos/DelphiCommonsAppIcon.svg'), iconBuildRoot]);
  copyPath(path.join(iconBuildRoot, appIconFileName), destination);
}

function writeAppLauncherBundle(destination) {
  const contents = path.join(destination, 'Contents');
  const macos = path.join(contents, 'MacOS');
  const resources = path.join(contents, 'Resources');
  fs.mkdirSync(macos, { recursive: true });
  fs.mkdirSync(resources, { recursive: true });
  buildMacosAppIcon(path.join(resources, appIconFileName));
  fs.writeFileSync(
    path.join(contents, 'Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleDisplayName</key>
  <string>Delphi Commons</string>
  <key>CFBundleExecutable</key>
  <string>Delphi Commons</string>
  <key>CFBundleIconFile</key>
  <string>DelphiCommons</string>
  <key>CFBundleIdentifier</key>
  <string>org.delphi.commons.internal</string>
  <key>CFBundleName</key>
  <string>Delphi Commons</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>0.0.0-internal</string>
  <key>CFBundleVersion</key>
  <string>0.0.0</string>
  <key>LSMinimumSystemVersion</key>
  <string>13.0</string>
</dict>
</plist>
`,
    'utf8'
  );
  fs.writeFileSync(
    path.join(macos, 'Delphi Commons'),
    `#!/usr/bin/env bash
set -euo pipefail
APP_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")/../.." && pwd)"
INSTALL_ROOT="$(cd "$APP_DIR/.." && pwd)"
exec "$INSTALL_ROOT/package/scripts/macos/delphi-commons"
`,
    'utf8'
  );
  fs.chmodSync(path.join(macos, 'Delphi Commons'), 0o755);
}

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
  writeInstallerWrapper(path.join(packageRoot, 'scripts/macos/delphi-commons'));
  fs.writeFileSync(path.join(packageRoot, 'README.txt'), buildInstallerReadme(), 'utf8');

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
  manifest.installLocation = installLocation;
  manifest.runtimeDataLocation = installerRuntimeRoot;
  manifest.pkgbuildAvailable = process.platform === 'darwin' && fs.existsSync('/usr/bin/pkgbuild');
  manifest.productbuildAvailable = process.platform === 'darwin' && fs.existsSync('/usr/bin/productbuild');
  manifest.signingStatus = 'NOT RUN / CREDENTIALS UNAVAILABLE';
  manifest.notarizationStatus = 'NOT RUN / CREDENTIALS UNAVAILABLE';
  manifest.gatekeeperStatus = 'NOT RUN';

  if (scanForbiddenMaterial(inventory).length) throw new Error('Forbidden material detected in staged package.');
  if (scanOverclaimText(JSON.stringify(manifest)).length) throw new Error('Overclaim scan failed for installer manifest.');
  fs.writeFileSync(path.join(packageRoot, 'package-manifest.json'), JSON.stringify(manifest, null, 2));
  const verification = verifyPackageEvidence({
    packageRoot,
    runtimeRoot: path.join(process.env.HOME || '/tmp', 'Library/Application Support/DelphiCommons/macos-installer-candidate'),
    overclaimFiles: ['package-manifest.json', 'README.txt', 'evidence-template.md']
  });
  fs.mkdirSync(outRoot, { recursive: true });
  fs.writeFileSync(path.join(outRoot, 'package-verification.json'), JSON.stringify(verification, null, 2));
  if (!verification.ok) throw new Error(verification.failures.join('\n'));
  fs.writeFileSync(latestPackageRootFile, packageRoot);
}

function buildInstallerArtifact() {
  const pkgPath = path.join(outRoot, `${packageName}.pkg`);
  const payloadRoot = path.join(outRoot, 'pkgroot');
  fs.rmSync(payloadRoot, { recursive: true, force: true });
  fs.mkdirSync(path.join(payloadRoot, 'Applications', 'Delphi Commons'), { recursive: true });
  copyPath(packageRoot, path.join(payloadRoot, 'Applications', 'Delphi Commons', 'package'));
  writeAppLauncherBundle(path.join(payloadRoot, 'Applications', 'Delphi Commons', appBundleName));

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
  const result = verifyPackageEvidence({ packageRoot, runtimeRoot, overclaimFiles: ['package-manifest.json', 'README.txt', 'evidence-template.md'] });
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
