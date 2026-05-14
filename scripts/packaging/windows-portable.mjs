import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { buildWindowsAdapterConfig } from './adapters/windows.mjs';
import { buildRuntimeMetadata, generateInventory, buildChecksums, scanForbiddenMaterial, scanOverclaimText, buildManifest, generateEvidenceTemplate } from './core/index.mjs';

const repoRoot = process.cwd();
const cmd = process.argv[2] ?? 'build';
const outRoot = path.join(repoRoot, 'build/windows-portable-bundled-runtime-internal');
const stage = path.join(outRoot, 'staging');
const pkg = path.join(stage, 'windows-portable-bundled-runtime-internal');
const runtimeMetaPath = path.join(repoRoot, 'docs/adr/runtime/node-windows-x64.json');

function sh(c){ execSync(c,{stdio:'inherit',cwd:repoRoot}); }
function cp(src,dst){ fs.mkdirSync(path.dirname(dst),{recursive:true}); fs.cpSync(src,dst,{recursive:true,force:true}); }

if (cmd === 'build') {
  const cfg = buildWindowsAdapterConfig();
  fs.rmSync(stage,{recursive:true,force:true}); fs.mkdirSync(pkg,{recursive:true});
  sh('npm --prefix app run build'); sh('npm --prefix server run build'); sh('npm --prefix server ci --omit=dev');
  const runtimeMetaJson = JSON.parse(fs.readFileSync(runtimeMetaPath,'utf8'));
  const runtimeMetadata = buildRuntimeMetadata({ nodeVersion: runtimeMetaJson.nodeVersion, npmVersion: runtimeMetaJson.npmVersion, source: runtimeMetaJson.source, sourceSha256: runtimeMetaJson.sha256, sourceLicense: runtimeMetaJson.license, bundled: true });
  ['app/dist','server/dist','server/package.json','server/package-lock.json','server/node_modules','scripts/windows/portable-operator-candidate.ps1','scripts/windows/static-file-server.mjs','LICENSE','NOTICE'].forEach((rel)=>cp(path.join(repoRoot,rel),path.join(pkg,rel)));
  generateEvidenceTemplate({ platform: 'Windows', outputPath: path.join(pkg,'evidence-template.md') });
  const commitHash = execSync('git rev-parse HEAD',{cwd:repoRoot}).toString().trim();
  const inventory = generateInventory(pkg);
  const forbiddenHits = scanForbiddenMaterial(inventory);
  if (forbiddenHits.length) throw new Error(`Forbidden material in package: ${forbiddenHits.join(', ')}`);
  const checksums = buildChecksums(pkg, inventory);
  const nonClaims = ['No installer/updater/signing/Tauri.', 'No SmartScreen/Defender readiness claim.', 'No Windows support-readiness claim.', 'No human-testing readiness claim from packaging alone.'];
  const limitations = ['Portable internal testing package only.'];
  const manifest = buildManifest({ config: cfg, inventory, checksums, runtimeMetadata, packageName: 'windows-portable-bundled-runtime-internal', packageVersion: '0.0.0-internal', commitHash, limitations, nonClaims });
  fs.writeFileSync(path.join(pkg,'package-manifest.json'), JSON.stringify(manifest,null,2));
  const overclaimHits = scanOverclaimText(JSON.stringify(manifest)); if (overclaimHits.length) throw new Error(`Overclaim scan failed: ${overclaimHits.join(',')}`);
  console.log('Build complete:', pkg);
} else if (cmd === 'verify') {
  const manifest = JSON.parse(fs.readFileSync(path.join(pkg,'package-manifest.json'),'utf8'));
  const inv = generateInventory(pkg);
  for (const rel of inv) { const digest = buildChecksums(pkg,[rel])[rel]; if (manifest.checksums[rel] !== digest) throw new Error(`Checksum mismatch ${rel}`); }
  console.log('Verification passed.');
} else {
  console.log(`Command ${cmd} delegated to PowerShell lifecycle wrapper.`);
}
