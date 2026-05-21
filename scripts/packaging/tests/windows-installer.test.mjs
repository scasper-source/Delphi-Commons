import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  renderInnoSetupScript,
  renderInstallerLauncherVbs,
  writeInstallerCandidateLaunchers,
  installerWrapperRelativePath
} from '../windows-installer.mjs';

const installerWrapper = path.join(process.cwd(), installerWrapperRelativePath);
const releaseWorkflow = path.join(process.cwd(), '.github/workflows/windows-internal-installer-release.yml');
const portableLifecycle = path.join(process.cwd(), 'scripts/windows/portable-operator-candidate.ps1');

test('installer launcher resolves package root from four parent levels', () => {
  const vbs = renderInstallerLauncherVbs('start');
  assert.match(vbs, /GetParentFolderName\(fso\.GetParentFolderName\(fso\.GetParentFolderName\(fso\.GetParentFolderName\(scriptPath\)\)\)\)/);
});

test('installer launcher points to installer-specific wrapper and avoids scripts\\scripts path', () => {
  const vbs = renderInstallerLauncherVbs('status');
  assert.match(vbs, /scripts\\+windows\\+installer-candidate-bundled-runtime\.ps1/);
  assert.doesNotMatch(vbs, /scripts\\scripts/i);
  assert.doesNotMatch(vbs, /WScript\.Sleep/);
});

test('installer candidate wrapper enforces installer runtime subdir and not portable runtime subdir', () => {
  const content = fs.readFileSync(installerWrapper, 'utf8');
  assert.match(content, /ValidateSet\('build','start','launch','stop','status','restart','backup','reset','smoke','verify'\)/);
  assert.match(content, /InstallerRuntimeSubdir\s*=\s*'windows-installer-candidate'/);
  assert.match(content, /SetEnvironmentVariable\('EDELPHI_RUNTIME_SUBDIR', \$InstallerRuntimeSubdir/);
  assert.match(content, /InstallerRuntimeRoot\s*=\s*Join-Path \$env:LOCALAPPDATA 'DelphiCommons\\windows-installer-candidate'/);
  assert.match(content, /SetEnvironmentVariable\('EDELPHI_RUNTIME_ROOT', \$InstallerRuntimeRoot/);
  assert.match(content, /EDELPHI_STOP_ON_BROWSER_CLOSE', '1'/);
  assert.match(content, /\$portableCommand = 'start'/);
  assert.doesNotMatch(content, /windows-portable-bundled-runtime-internal/);
});

test('installer package backend runtime inherits internal synthetic auth bootstrap launcher env', () => {
  const wrapper = fs.readFileSync(installerWrapper, 'utf8');
  const lifecycle = fs.readFileSync(portableLifecycle, 'utf8');
  assert.match(wrapper, /\$PortableWrapper/);
  assert.match(wrapper, /powershell -NoProfile -ExecutionPolicy Bypass -File \$PortableWrapper \$portableCommand/);
  assert.match(lifecycle, /\$backendEnv\s*=\s*@\{[\s\S]*EDELPHI_ENABLE_INTERNAL_SYNTHETIC_AUTH_BOOTSTRAP\s*=\s*'1'/);
  assert.match(lifecycle, /\$backendEnv\s*=\s*@\{[\s\S]*EDELPHI_INTERNAL_SYNTHETIC_AUTH_ACK\s*=\s*'INTERNAL_SYNTHETIC_ONLY'/);
});

test('generated launchers target existing lifecycle wrapper in package layout', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'win-installer-launchers-'));
  fs.mkdirSync(path.join(temp, 'scripts/windows'), { recursive: true });
  fs.writeFileSync(path.join(temp, installerWrapperRelativePath), '# wrapper', 'utf8');
  writeInstallerCandidateLaunchers(temp);
  for (const name of ['delphi-commons-launch.vbs', 'delphi-commons-stop.vbs', 'delphi-commons-status.vbs']) {
    const launcherPath = path.join(temp, 'scripts/windows/installer-candidate', name);
    assert.ok(fs.existsSync(launcherPath));
    const launcher = fs.readFileSync(launcherPath, 'utf8');
    assert.match(launcher, /installer-candidate-bundled-runtime\.ps1/);
  }
  const launch = fs.readFileSync(path.join(temp, 'scripts/windows/installer-candidate/delphi-commons-launch.vbs'), 'utf8');
  assert.match(launch, /lifecycleCommand = "launch"/);
});

test('Inno setup script launches VBS files through Windows Script Host', () => {
  const script = renderInnoSetupScript();
  assert.match(script, /\[Icons\]/);
  assert.match(script, /\[Run\]/);
  assert.match(script, /Filename: "\{sys\}\\wscript\.exe"; Parameters: """\{app\}\\scripts\\windows\\installer-candidate\\delphi-commons-launch\.vbs"""/);
  assert.doesNotMatch(script, /Filename: "\{app\}\\scripts\\windows\\installer-candidate\\delphi-commons-[^"]+\.vbs"/);
});

test('Inno setup script exposes only the main user launcher shortcut', () => {
  const script = renderInnoSetupScript();
  assert.match(script, /Name: "\{group\}\\Delphi Commons"; Filename: "\{sys\}\\wscript\.exe"/);
  assert.match(script, /Name: "\{userdesktop\}\\Delphi Commons"; Filename: "\{sys\}\\wscript\.exe"/);
  assert.doesNotMatch(script, /Name: "\{group\}\\Delphi Commons Stop"/);
  assert.doesNotMatch(script, /Name: "\{group\}\\Delphi Commons Status"/);
  assert.doesNotMatch(script, /\[Tasks\]/);
  assert.doesNotMatch(script, /Tasks: desktopicon/);
});

test('release ZIP README keeps browser fallback before shutdown instruction', () => {
  const workflow = fs.readFileSync(releaseWorkflow, 'utf8');
  const fallback = workflow.indexOf('If the browser does not open, open http://127.0.0.1:4173 while the app is running.');
  const shutdown = workflow.indexOf('When finished, close the Delphi Commons browser app window; this stops the local runtime.');
  assert.ok(fallback > -1, 'browser fallback instruction is present');
  assert.ok(shutdown > -1, 'shutdown instruction is present');
  assert.ok(fallback < shutdown, 'fallback appears before shutdown');
  assert.doesNotMatch(workflow, /Use Delphi Commons Stop/);
});
