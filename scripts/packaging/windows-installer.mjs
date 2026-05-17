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
import { buildWindowsAdapterConfig } from './adapters/windows.mjs';

const repoRoot = process.cwd();
const outRoot = path.join(repoRoot, 'build/windows-installer');
const buildId = `run-${Date.now()}-${process.pid}`;
const packageName = 'delphi-commons-windows-installer-candidate-internal';
const latestPackageRootFile = path.join(outRoot, 'latest-package-root.txt');
const command = process.argv[2] ?? 'build';
const packageRoot = command === 'build'
  ? path.join(outRoot, 'staging', buildId, packageName)
  : fs.existsSync(latestPackageRootFile)
    ? fs.readFileSync(latestPackageRootFile, 'utf8').trim()
    : path.join(outRoot, 'staging', packageName);

const runtimeRootConvention = '%LOCALAPPDATA%/DelphiCommons/windows-installer-candidate';
const runtimeRootForVerification = path.join(process.env.HOME || '/tmp', 'AppData', 'Local', 'DelphiCommons', 'windows-installer-candidate');

const run = (file, args, cwd = repoRoot) => execFileSync(file, args, { stdio: 'inherit', cwd });
const copyPath = (src, dst) => {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.cpSync(src, dst, { recursive: true, force: true });
};

function buildRuntimeMetadataFromAdr() {
  const meta = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/adr/runtime/node-windows-x64.json'), 'utf8'));
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

function stagePortablePayload() {
  run('node', ['scripts/packaging/windows-portable.mjs', 'build']);
  const latestPortableRoot = fs.readFileSync(path.join(repoRoot, 'build/windows-portable-bundled-runtime-internal/latest-package-root.txt'), 'utf8').trim();
  fs.mkdirSync(packageRoot, { recursive: true });
  copyPath(latestPortableRoot, packageRoot);
}

function writeInnoFiles() {
  const launcherDir = path.join(packageRoot, 'scripts/windows/installer-candidate');
  fs.mkdirSync(launcherDir, { recursive: true });

  fs.writeFileSync(path.join(launcherDir, 'delphi-commons-launch.vbs'), `Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
packageRoot = fso.GetParentFolderName(fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName)))
psScript = Chr(34) & packageRoot & "\\scripts\\windows\\portable-bundled-runtime.ps1" & Chr(34)
cmd = "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File " & psScript & " start"
shell.Run cmd, 0, False
WScript.Sleep 400
shell.Run "http://127.0.0.1:4173", 0, False
`, 'utf8');

  fs.writeFileSync(path.join(launcherDir, 'delphi-commons-stop.vbs'), `Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
packageRoot = fso.GetParentFolderName(fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName)))
psScript = Chr(34) & packageRoot & "\\scripts\\windows\\portable-bundled-runtime.ps1" & Chr(34)
cmd = "powershell -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File " & psScript & " stop"
shell.Run cmd, 0, False
`, 'utf8');

  fs.writeFileSync(path.join(packageRoot, 'installer.iss'), `[Setup]
AppName=Delphi Commons
AppVersion=0.0.0-internal
DefaultDirName={localappdata}\\Programs\\DelphiCommons
DefaultGroupName=Delphi Commons
DisableProgramGroupPage=yes
PrivilegesRequired=lowest
OutputBaseFilename=delphi-commons-windows-installer-candidate-internal
Compression=lzma
SolidCompression=yes
UninstallDisplayIcon={app}\\scripts\\windows\\installer-candidate\\delphi-commons-launch.vbs

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; GroupDescription: "Additional shortcuts:";

[Files]
Source: "*"; DestDir: "{app}"; Flags: recursesubdirs ignoreversion

[Icons]
Name: "{group}\\Delphi Commons"; Filename: "{app}\\scripts\\windows\\installer-candidate\\delphi-commons-launch.vbs"
Name: "{group}\\Delphi Commons Stop"; Filename: "{app}\\scripts\\windows\\installer-candidate\\delphi-commons-stop.vbs"
Name: "{commondesktop}\\Delphi Commons"; Filename: "{app}\\scripts\\windows\\installer-candidate\\delphi-commons-launch.vbs"; Tasks: desktopicon

[Run]
Filename: "{app}\\scripts\\windows\\installer-candidate\\delphi-commons-launch.vbs"; Description: "Launch Delphi Commons"; Flags: postinstall nowait skipifsilent
`, 'utf8');
}

function buildMetadataAndVerify() {
  const config = buildWindowsAdapterConfig('windows-installer-candidate-internal');
  const inventory = generateInventory(packageRoot).filter((item) => item !== 'package-manifest.json');
  const checksums = buildChecksums(packageRoot, inventory);
  const manifest = buildManifest({
    config: { ...config, archiveFormat: 'exe', runtimeRootConvention },
    inventory,
    checksums,
    runtimeMetadata: buildRuntimeMetadataFromAdr(),
    packageName,
    packageVersion: '0.0.0-internal',
    commitHash: execSync('git rev-parse HEAD', { cwd: repoRoot }).toString().trim(),
    limitations: [
      'Internal engineering installer candidate only.',
      'This Linux run cannot execute or validate Inno Setup (ISCC); installer build can be NOT RUN with reason.',
      'Visible or hidden command-window behavior must be validated on real Windows hardware.'
    ],
    nonClaims: [
      'No production/pilot/human-subjects readiness claim.',
      'No code-signing/SmartScreen/Defender trust claim.',
      'No enterprise deployment readiness claim.'
    ]
  });
  manifest.installerTechnology = 'Inno Setup';
  manifest.installLocation = '%LOCALAPPDATA%/Programs/DelphiCommons';
  manifest.runtimeDataLocation = runtimeRootConvention;
  manifest.runtimeDependencies = 'No global Node/npm required at runtime; packaged node.exe is used';

  if (scanForbiddenMaterial(inventory).length) throw new Error('Forbidden material detected in staged installer payload.');
  if (scanOverclaimText(JSON.stringify(manifest)).length) throw new Error('Overclaim scan failed for installer manifest.');
  fs.writeFileSync(path.join(packageRoot, 'package-manifest.json'), JSON.stringify(manifest, null, 2));

  const verification = verifyPackageEvidence({
    packageRoot,
    runtimeRoot: runtimeRootForVerification,
    overclaimFiles: ['package-manifest.json', 'README.txt', 'evidence-template.md']
  });
  if (!verification.ok) throw new Error(verification.failures.join('\n'));
}

function buildInstallerArtifact() {
  fs.mkdirSync(outRoot, { recursive: true });
  const isWindows = process.platform === 'win32';
  if (!isWindows) {
    fs.writeFileSync(path.join(outRoot, 'INSTALLER_NOT_RUN.txt'), 'NOT RUN: Inno Setup build requires Windows host with ISCC.exe.');
    return;
  }

  let iscc = null;
  const common = [
    'C:/Program Files (x86)/Inno Setup 6/ISCC.exe',
    'C:/Program Files/Inno Setup 6/ISCC.exe'
  ];
  for (const candidate of common) {
    if (fs.existsSync(candidate)) { iscc = candidate; break; }
  }
  if (!iscc) {
    fs.writeFileSync(path.join(outRoot, 'INSTALLER_NOT_RUN.txt'), 'NOT RUN: ISCC.exe not found. Install Inno Setup 6 to build installer artifact.');
    return;
  }

  run(iscc, [path.join(packageRoot, 'installer.iss')], packageRoot);
  const outputExe = path.join(packageRoot, 'Output', 'delphi-commons-windows-installer-candidate-internal.exe');
  if (fs.existsSync(outputExe)) {
    copyPath(outputExe, path.join(outRoot, 'delphi-commons-windows-installer-candidate-internal.exe'));
    fs.writeFileSync(path.join(outRoot, 'installer-sha256.txt'), `${sha256File(path.join(outRoot, 'delphi-commons-windows-installer-candidate-internal.exe'))}  delphi-commons-windows-installer-candidate-internal.exe\n`);
  }
}

if (command === 'build') {
  stagePortablePayload();
  writeInnoFiles();
  buildMetadataAndVerify();
  buildInstallerArtifact();
  fs.writeFileSync(latestPackageRootFile, packageRoot);
} else if (command === 'verify') {
  buildMetadataAndVerify();
} else {
  throw new Error(`Unsupported command: ${command}`);
}
