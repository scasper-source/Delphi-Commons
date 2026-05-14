import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { buildWindowsAdapterConfig } from './adapters/windows.mjs';
import {
  buildRuntimeMetadata,
  generateInventory,
  buildChecksums,
  scanForbiddenMaterial,
  scanOverclaimText,
  buildManifest,
  generateEvidenceTemplate,
  sha256File
} from './core/index.mjs';

const repoRoot = process.cwd();
const command = process.argv[2] ?? 'build';
const packageName = 'windows-portable-bundled-runtime-internal';
const outRoot = path.join(repoRoot, 'build/windows-portable-bundled-runtime-internal');
const buildRunId = `run-${Date.now()}-${process.pid}`;
const stagingRoot = path.join(outRoot, 'staging');
const latestPackageRootFile = path.join(outRoot, 'latest-package-root.txt');
const runtimeCache = path.join(outRoot, 'runtime-cache');
const productionDepsRoot = path.join(outRoot, 'server-production-deps', buildRunId);
const runtimeMetaPath = path.join(repoRoot, 'docs/adr/runtime/node-windows-x64.json');
const npmCommand = process.platform === 'win32' ? execSync('where.exe npm.cmd').toString().split(/\r?\n/)[0].trim() : 'npm';

function resolvePackageRoot() {
  if (command === 'build') {
    return path.join(stagingRoot, buildRunId, packageName);
  }
  if (process.env.EDELPHI_WINDOWS_PACKAGE_ROOT) {
    return path.resolve(process.env.EDELPHI_WINDOWS_PACKAGE_ROOT);
  }
  if (fs.existsSync(latestPackageRootFile)) {
    return fs.readFileSync(latestPackageRootFile, 'utf8').trim();
  }
  return path.join(stagingRoot, packageName);
}

const packageRoot = resolvePackageRoot();

function run(filePath, args, cwd = repoRoot) {
  if (process.platform === 'win32' && /\.(cmd|bat)$/i.test(filePath)) {
    const quoteCmdArgument = (value) => `"${String(value).replaceAll('"', '""')}"`;
    execSync([filePath, ...args].map(quoteCmdArgument).join(' '), { stdio: 'inherit', cwd });
    return;
  }
  execFileSync(filePath, args, { stdio: 'inherit', cwd });
}

function copyPath(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true, force: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function packageInventory(root) {
  return generateInventory(root).filter((item) => item !== 'package-manifest.json');
}

function buildWindowsRuntimeMetadata(raw) {
  if (raw.platform !== 'windows' || raw.arch !== 'x64') {
    throw new Error(`Windows bundled-runtime package requires windows/x64 runtime metadata, got ${raw.platform}/${raw.arch}.`);
  }
  if (!raw.sha256 || raw.sha256 === 'PINNED_AT_BUILD_TIME') {
    throw new Error('Windows runtime metadata must contain a pinned SHA256 before building.');
  }
  return buildRuntimeMetadata({
    nodeVersion: raw.nodeVersion,
    npmVersion: raw.npmIncluded ? raw.npmVersion : null,
    platform: raw.platform,
    arch: raw.arch,
    source: raw.source,
    sourceSha256: raw.sha256,
    sourceLicense: raw.license,
    bundled: true,
    bundledRuntimeRelativePath: raw.bundledRuntimeLocation,
    nodeExecutableRelativePath: raw.nodeExecutable,
    npmIncluded: Boolean(raw.npmIncluded),
    npmUsedAtRuntime: Boolean(raw.npmUsedAtRuntime)
  });
}

async function downloadFile(url, destination, redirectsRemaining = 3) {
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  await new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location && redirectsRemaining > 0) {
        response.resume();
        downloadFile(new URL(response.headers.location, url).toString(), destination, redirectsRemaining - 1)
          .then(resolve)
          .catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Download failed for ${url}: HTTP ${response.statusCode}`));
        return;
      }
      const output = fs.createWriteStream(destination);
      response.pipe(output);
      output.on('finish', () => output.close(resolve));
      output.on('error', reject);
    });
    request.on('error', reject);
  });
}

async function ensureRuntimeArchive(runtimeMetaJson) {
  const archiveFromEnv = process.env.EDELPHI_WINDOWS_NODE_RUNTIME_ARCHIVE;
  const archiveName = path.basename(new URL(runtimeMetaJson.source).pathname);
  const archivePath = archiveFromEnv || path.join(runtimeCache, archiveName);

  if (!fs.existsSync(archivePath)) {
    if (archiveFromEnv) {
      throw new Error(`Configured runtime archive does not exist: ${archivePath}`);
    }
    console.log(`Downloading pinned Windows Node runtime: ${runtimeMetaJson.source}`);
    await downloadFile(runtimeMetaJson.source, archivePath);
  }

  const digest = sha256File(archivePath);
  if (digest !== runtimeMetaJson.sha256) {
    throw new Error(`Runtime archive SHA256 mismatch for ${archivePath}. Expected ${runtimeMetaJson.sha256}, got ${digest}.`);
  }
  return archivePath;
}

function extractRuntimeArchive(archivePath, destination) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });
  if (process.platform === 'win32') {
    const quotePowerShellString = (value) => `'${String(value).replaceAll("'", "''")}'`;
    run(
      'powershell',
      [
        '-NoProfile',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        `Expand-Archive -LiteralPath ${quotePowerShellString(archivePath)} -DestinationPath ${quotePowerShellString(destination)} -Force`
      ],
      repoRoot
    );
    return;
  }
  run('unzip', ['-q', archivePath, '-d', destination], repoRoot);
}

async function stageNodeRuntime(runtimeMetaJson) {
  const archivePath = await ensureRuntimeArchive(runtimeMetaJson);
  const extractRoot = path.join(runtimeCache, 'extracted', buildRunId);
  extractRuntimeArchive(archivePath, extractRoot);

  const expectedRoot = path.join(extractRoot, `node-v${runtimeMetaJson.nodeVersion}-win-x64`);
  const nodeSource = path.join(expectedRoot, 'node.exe');
  const licenseSource = path.join(expectedRoot, 'LICENSE');
  if (!fs.existsSync(nodeSource)) {
    throw new Error(`Pinned runtime archive did not contain expected node.exe: ${nodeSource}`);
  }

  const runtimeDestination = path.join(packageRoot, runtimeMetaJson.bundledRuntimeLocation);
  fs.mkdirSync(runtimeDestination, { recursive: true });
  copyPath(nodeSource, path.join(packageRoot, runtimeMetaJson.nodeExecutable));
  if (fs.existsSync(licenseSource)) {
    copyPath(licenseSource, path.join(runtimeDestination, 'LICENSE'));
  }
}

function stageServerProductionDependencies() {
  fs.rmSync(productionDepsRoot, { recursive: true, force: true });
  fs.mkdirSync(productionDepsRoot, { recursive: true });
  copyPath(path.join(repoRoot, 'server/package.json'), path.join(productionDepsRoot, 'package.json'));
  copyPath(path.join(repoRoot, 'server/package-lock.json'), path.join(productionDepsRoot, 'package-lock.json'));
  run(npmCommand, ['--prefix', productionDepsRoot, 'ci', '--omit=dev'], repoRoot);
  return path.join(productionDepsRoot, 'node_modules');
}

function writePackageReadme(runtimeMetadata) {
  fs.writeFileSync(
    path.join(packageRoot, 'README.txt'),
    `Windows portable bundled-runtime internal package

Boundary:
- Internal synthetic testing package only.
- No installer, updater, Tauri shell, signing, SmartScreen approval, Defender approval, platform-support approval, pilot approval, or production approval is claimed.
- Do not use with real participant data unless separately approved through the governing review process.

Build-time tooling:
- Building this package still requires local Node and npm in the source checkout.
- Production server dependencies are installed during package build and staged into server/node_modules.

Runtime behavior after package build:
- Use scripts/windows/portable-bundled-runtime.ps1 for lifecycle commands.
- Lifecycle commands use the packaged Node executable at ${runtimeMetadata.nodeExecutableRelativePath}.
- Local Node, npm, and npx are not expected for start, stop, status, restart, backup, reset, or smoke.
- npm is not included in the staged runtime and is not used by lifecycle commands.

Runtime data:
- Runtime data lives under %LOCALAPPDATA%\\DelphiCommons\\windows-portable-bundled-runtime-internal.
- Runtime data, logs, evidence, backups, exports, and databases must remain outside the package root.
- Network binding remains 127.0.0.1 by default.
`,
    'utf8'
  );
}

function assertNoAmbientRuntimeCommands(root = packageRoot) {
  const wrapperPath = path.join(root, 'scripts/windows/portable-bundled-runtime.ps1');
  const lifecyclePath = path.join(root, 'scripts/windows/portable-operator-candidate.ps1');
  const wrapper = fs.readFileSync(wrapperPath, 'utf8');
  const lifecycle = fs.readFileSync(lifecyclePath, 'utf8');

  const requiredWrapperMarkers = [
    'EDELPHI_PORTABLE_NODE_EXE',
    'EDELPHI_SERVER_NODE_MODULES_SOURCE',
    'EDELPHI_SKIP_RUNTIME_NPM_INSTALL',
    'runtime\\node\\node.exe'
  ];
  for (const marker of requiredWrapperMarkers) {
    if (!wrapper.includes(marker)) {
      throw new Error(`Packaged lifecycle wrapper is missing required runtime marker: ${marker}`);
    }
  }

  const requiredLifecycleMarkers = [
    '$NodeCommand',
    'EDELPHI_SERVER_NODE_MODULES_SOURCE',
    'EDELPHI_SKIP_RUNTIME_NPM_INSTALL'
  ];
  for (const marker of requiredLifecycleMarkers) {
    if (!lifecycle.includes(marker)) {
      throw new Error(`Packaged lifecycle script is missing required runtime marker: ${marker}`);
    }
  }

  const ambientStartPatterns = [
    /Set-ProcessEnvAndStart\s+-filePath\s+['"]?(node|npm|npx|npm\.cmd)/i,
    /Start-Process\s+-FilePath\s+['"]?(node|npm|npx|npm\.cmd)/i
  ];
  for (const pattern of ambientStartPatterns) {
    if (pattern.test(lifecycle)) {
      throw new Error(`Packaged lifecycle script contains ambient runtime process launch: ${pattern.source}`);
    }
  }
}

function forbiddenPackageMaterial(inventory) {
  return scanForbiddenMaterial(inventory, [
    /(^|\/)\.git(\/|$)/i,
    /(^|\/)\.env(\.|$)/i,
    /(^|\/)(id_rsa|id_dsa|\.ssh)(\/|$)/i,
    /^(db|logs|backups|evidence|exports|state|server-runtime)(\/|$)/i
  ]);
}

async function buildPackage() {
  const config = buildWindowsAdapterConfig();
  const runtimeMetaJson = readJson(runtimeMetaPath);
  const runtimeMetadata = buildWindowsRuntimeMetadata(runtimeMetaJson);

  fs.mkdirSync(packageRoot, { recursive: true });

  run(npmCommand, ['--prefix', 'app', 'run', 'build']);
  run(npmCommand, ['--prefix', 'server', 'run', 'build']);
  const productionNodeModules = stageServerProductionDependencies();

  copyPath(path.join(repoRoot, 'app/dist'), path.join(packageRoot, 'app/dist'));
  copyPath(path.join(repoRoot, 'server/dist'), path.join(packageRoot, 'server/dist'));
  copyPath(path.join(repoRoot, 'server/package.json'), path.join(packageRoot, 'server/package.json'));
  copyPath(path.join(repoRoot, 'server/package-lock.json'), path.join(packageRoot, 'server/package-lock.json'));
  copyPath(productionNodeModules, path.join(packageRoot, 'server/node_modules'));
  copyPath(path.join(repoRoot, 'scripts/windows/portable-bundled-runtime.ps1'), path.join(packageRoot, 'scripts/windows/portable-bundled-runtime.ps1'));
  copyPath(path.join(repoRoot, 'scripts/windows/portable-operator-candidate.ps1'), path.join(packageRoot, 'scripts/windows/portable-operator-candidate.ps1'));
  copyPath(path.join(repoRoot, 'scripts/windows/static-file-server.mjs'), path.join(packageRoot, 'tools/static-file-server.mjs'));
  copyPath(path.join(repoRoot, 'LICENSE'), path.join(packageRoot, 'LICENSE'));
  copyPath(path.join(repoRoot, 'NOTICE'), path.join(packageRoot, 'NOTICE'));
  await stageNodeRuntime(runtimeMetaJson);
  writePackageReadme(runtimeMetadata);
  generateEvidenceTemplate({ platform: 'Windows', outputPath: path.join(packageRoot, 'evidence-template.md') });
  assertNoAmbientRuntimeCommands(packageRoot);

  const commitHash = execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim();
  const inventory = packageInventory(packageRoot);
  const forbiddenHits = forbiddenPackageMaterial(inventory);
  if (forbiddenHits.length) {
    throw new Error(`Forbidden material in package: ${forbiddenHits.join(', ')}`);
  }
  const checksums = buildChecksums(packageRoot, inventory);
  const nonClaims = [
    'No installer, updater, signing, or Tauri shell.',
    'No SmartScreen or Defender approval claim.',
    'No Windows platform-support approval claim.',
    'No pilot or production approval claim.'
  ];
  const limitations = [
    'Internal synthetic testing package only.',
    'Local Node/npm remain required to build the package.',
    'Clean-machine lifecycle evidence remains required before closing the Phase 2 laptop package gate.'
  ];
  const manifest = buildManifest({
    config,
    inventory,
    checksums,
    runtimeMetadata,
    packageName,
    packageVersion: '0.0.0-internal',
    commitHash,
    limitations,
    nonClaims
  });
  const overclaimHits = scanOverclaimText(JSON.stringify(manifest));
  if (overclaimHits.length) {
    throw new Error(`Overclaim scan failed: ${overclaimHits.join(', ')}`);
  }
  fs.writeFileSync(path.join(packageRoot, 'package-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  fs.mkdirSync(outRoot, { recursive: true });
  fs.writeFileSync(latestPackageRootFile, packageRoot, 'utf8');
  console.log(`Build complete: ${packageRoot}`);
}

function verifyPackage() {
  const manifestPath = path.join(packageRoot, 'package-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Package manifest missing. Build package first: ${manifestPath}`);
  }
  const manifest = readJson(manifestPath);
  const inventory = packageInventory(packageRoot);
  const checksums = buildChecksums(packageRoot, inventory);
  if (JSON.stringify(manifest.inventory) !== JSON.stringify(inventory)) {
    throw new Error('Package inventory does not match manifest inventory.');
  }
  if (JSON.stringify(manifest.checksums) !== JSON.stringify(checksums)) {
    throw new Error('Package checksums do not match manifest checksums.');
  }

  const runtime = manifest.runtimeMetadata;
  const requiredRuntimeFields = [
    'nodeVersion',
    'platform',
    'arch',
    'runtimeSource',
    'runtimeSha256',
    'runtimeLicense',
    'bundledRuntimeRelativePath',
    'nodeExecutableRelativePath',
    'npmIncluded',
    'npmUsedAtRuntime'
  ];
  for (const field of requiredRuntimeFields) {
    if (!(field in runtime)) {
      throw new Error(`Runtime metadata missing field: ${field}`);
    }
  }
  if (runtime.npmIncluded !== false || runtime.npmUsedAtRuntime !== false) {
    throw new Error('Windows internal package must not include or use npm at runtime.');
  }
  if (!fs.existsSync(path.join(packageRoot, runtime.nodeExecutableRelativePath))) {
    throw new Error(`Packaged Node executable missing: ${runtime.nodeExecutableRelativePath}`);
  }
  if (!fs.existsSync(path.join(packageRoot, 'server/node_modules'))) {
    throw new Error('Production server dependencies missing from package: server/node_modules');
  }
  assertNoAmbientRuntimeCommands(packageRoot);
  console.log('Verification passed.');
}

if (command === 'build') {
  await buildPackage();
} else if (command === 'verify') {
  verifyPackage();
} else {
  console.log(`Command ${command} is handled by scripts/windows/portable-bundled-runtime.ps1.`);
}
