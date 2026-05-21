import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { buildMacosAdapterConfig } from './adapters/macos.mjs';
import { buildRuntimeMetadata, scanForbiddenMaterial, scanOverclaimText, buildManifest, generateEvidenceTemplate, sha256File } from './core/index.mjs';
import { stageServerProductionDependencies, copyCommonPortablePayload, buildInventoryAndChecksums, verifyPortablePackage } from './core/portable-shared.mjs';

const repoRoot = process.cwd();
const command = process.argv[2] ?? 'build';
const packageName = 'macos-portable-bundled-runtime-internal';
const outRoot = path.join(repoRoot, 'build/macos-portable-bundled-runtime-internal');
const buildRunId = `run-${Date.now()}-${process.pid}`;
const stagingRoot = path.join(outRoot, 'staging');
const latestPackageRootFile = path.join(outRoot, 'latest-package-root.txt');
const runtimeCache = path.join(outRoot, 'runtime-cache');
const productionDepsRoot = path.join(outRoot, 'server-production-deps', buildRunId);
const runtimeMetaPath = path.join(repoRoot, 'docs/adr/runtime/node-macos-arm64.json');

const npmCommand = 'npm';
const packageRoot = command === 'build' ? path.join(stagingRoot, buildRunId, packageName) : fs.existsSync(latestPackageRootFile) ? fs.readFileSync(latestPackageRootFile, 'utf8').trim() : path.join(stagingRoot, packageName);
const run = (file, args, cwd = repoRoot) => execFileSync(file, args, { stdio: 'inherit', cwd });
const copyPath = (src, dst) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.cpSync(src, dst, { recursive: true, force: true }); };
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

function buildMacosRuntimeMetadata(raw) {
  if (raw.platform !== 'macos' || raw.arch !== 'arm64') throw new Error(`Requires macos/arm64 metadata, got ${raw.platform}/${raw.arch}`);
  if (!raw.sha256 || raw.sha256 === 'PINNED_AT_BUILD_TIME') throw new Error('macOS runtime metadata must contain pinned SHA256 before build.');
  return buildRuntimeMetadata({ nodeVersion: raw.nodeVersion, npmVersion: raw.npmIncluded ? raw.npmVersion : null, platform: raw.platform, arch: raw.arch, source: raw.source, sourceSha256: raw.sha256, sourceLicense: raw.license, bundled: true, bundledRuntimeRelativePath: raw.bundledRuntimeLocation, nodeExecutableRelativePath: raw.nodeExecutable, npmIncluded: !!raw.npmIncluded, npmUsedAtRuntime: !!raw.npmUsedAtRuntime });
}

async function downloadFile(url, destination) { await fs.promises.mkdir(path.dirname(destination), { recursive: true }); await new Promise((resolve, reject) => { https.get(url, (response) => { if (response.statusCode !== 200) { response.resume(); reject(new Error(`Download failed: HTTP ${response.statusCode}`)); return; } const output = fs.createWriteStream(destination); response.pipe(output); output.on('finish', () => output.close(resolve)); output.on('error', reject); }).on('error', reject); }); }
async function stageRuntime(meta) { const archive = process.env.EDELPHI_MACOS_NODE_RUNTIME_ARCHIVE || path.join(runtimeCache, path.basename(new URL(meta.source).pathname)); if (!fs.existsSync(archive)) await downloadFile(meta.source, archive); if (sha256File(archive) !== meta.sha256) throw new Error('Runtime sha mismatch'); const extractRoot = path.join(runtimeCache, 'extracted', buildRunId); fs.rmSync(extractRoot, { recursive: true, force: true }); fs.mkdirSync(extractRoot, { recursive: true }); run('tar', ['-xzf', archive, '-C', extractRoot]); const root = path.join(extractRoot, `node-v${meta.nodeVersion}-darwin-arm64`); copyPath(path.join(root, 'bin/node'), path.join(packageRoot, meta.nodeExecutable)); copyPath(path.join(root, 'LICENSE'), path.join(packageRoot, meta.bundledRuntimeLocation, 'LICENSE')); }

function buildBundledReadme() {
  return `macOS Apple Silicon portable bundled-runtime internal package

Status: INTERNAL PACKAGE CANDIDATE / NOT READY FOR HUMAN TESTING

Boundary:
- Use synthetic or low-risk test data only.
- This package is not production-ready, not pilot-ready, not public-release-ready, and not ready for real human-subjects data.
- Signing, notarization, Gatekeeper/quarantine behavior, clean-profile Mac execution, second-machine execution, and phone/operator walkthrough evidence are NOT RUN unless separate evidence is attached.

Normal launch path:
1. Extract the ZIP into a clean, user-controlled folder.
2. Open Terminal in the extracted package root.
3. Run: ./scripts/macos/portable-bundled-runtime.sh
4. The launcher starts local services and attempts to open http://127.0.0.1:4173 in the default browser.
5. If the browser does not show Delphi Commons, open http://127.0.0.1:4173 manually while the supervised run is active.

Ending the run:
- macOS app-window-close lifecycle is IMPLEMENTATION_REQUIRED / HUMAN_REQUIRED: closing the visible browser/app window has NOT been proven to stop the local runtime.
- For supervised internal runs, stop the runtime with: ./scripts/macos/portable-bundled-runtime.sh stop

Admin/debug commands:
- status, stop, restart, smoke, backup, restore, reset, and uninstall are lifecycle/admin commands, not separate normal-user launch shortcuts.
- Do not present Stop or Status as ordinary operator shortcuts in package instructions.
`;
}

function assertNoAmbient(root = packageRoot) { const wrapper = fs.readFileSync(path.join(root, 'scripts/macos/portable-bundled-runtime.sh'), 'utf8'); const lifecycle = fs.readFileSync(path.join(root, 'scripts/macos/portable-operator-candidate.sh'), 'utf8'); for (const bad of [/(^|[\s;&|])node($|[\s;&|])/, /(^|[\s;&|])npm($|[\s;&|])/, /(^|[\s;&|])npx($|[\s;&|])/]) { if (bad.test(wrapper)) throw new Error('Wrapper uses ambient runtime commands.'); } if (!lifecycle.includes('"$NodeCommand"')) throw new Error('Lifecycle missing NodeCommand runtime execution marker.'); }

async function buildPackage() { const config = buildMacosAdapterConfig(); const raw = readJson(runtimeMetaPath); const runtimeMetadata = buildMacosRuntimeMetadata(raw); fs.mkdirSync(packageRoot, { recursive: true }); run(npmCommand, ['--prefix', 'app', 'run', 'build']); run(npmCommand, ['--prefix', 'server', 'run', 'build']); fs.rmSync(productionDepsRoot, { recursive: true, force: true }); fs.mkdirSync(productionDepsRoot, { recursive: true }); const prod = stageServerProductionDependencies({ repoRoot, productionDepsRoot, npmCommand, run, copyPath }); copyCommonPortablePayload({ repoRoot, packageRoot, productionNodeModules: prod, copyPath }); copyPath(path.join(repoRoot, 'scripts/macos/portable-bundled-runtime.sh'), path.join(packageRoot, 'scripts/macos/portable-bundled-runtime.sh')); copyPath(path.join(repoRoot, 'scripts/macos/portable-operator-candidate.sh'), path.join(packageRoot, 'scripts/macos/portable-operator-candidate.sh')); await stageRuntime(raw); fs.writeFileSync(path.join(packageRoot, 'README.txt'), buildBundledReadme(), 'utf8'); generateEvidenceTemplate({ platform: 'macOS', outputPath: path.join(packageRoot, 'evidence-template.md') }); assertNoAmbient(packageRoot); const { inventory, checksums } = buildInventoryAndChecksums(packageRoot); const manifest = buildManifest({ config, inventory, checksums, runtimeMetadata, packageName, packageVersion: '0.0.0-internal', commitHash: execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim(), limitations: ['Internal synthetic testing only.', 'Intel Mac x64 runtime metadata/package deferred in this change.', 'Local Node/npm required at build time.'], nonClaims: ['No signing/notarization/Gatekeeper readiness claim.', 'No macOS support-readiness claim.', 'No pilot/production/human-testing readiness claim.'] }); if (scanForbiddenMaterial(inventory).length) throw new Error('Forbidden material present.'); if (scanOverclaimText(JSON.stringify(manifest)).length) throw new Error('Overclaim scan failed.'); fs.writeFileSync(path.join(packageRoot, 'package-manifest.json'), JSON.stringify(manifest, null, 2)); fs.mkdirSync(outRoot, { recursive: true }); fs.writeFileSync(latestPackageRootFile, packageRoot); }
function verifyPackage() { const runtimeRoot = process.env.EDELPHI_RUNTIME_ROOT || path.resolve(packageRoot, '..', 'runtime-state'); const result = verifyPortablePackage({ packageRoot, runtimeRoot }); if (!result.ok) throw new Error(`Package verification failed:\n- ${result.failures.join('\n- ')}`); }
if (command === 'build') await buildPackage(); else if (command === 'verify') verifyPackage();
