import fs from 'node:fs';
import path from 'node:path';

export const installerRuntimeSubdir = 'windows-installer-candidate';
export const installerWrapperRelativePath = 'scripts/windows/installer-candidate-bundled-runtime.ps1';

export function renderInstallerLauncherVbs(command) {
  return `Option Explicit
Dim fso, scriptPath, packageRoot, psScript, shell, command
Set fso = CreateObject("Scripting.FileSystemObject")
scriptPath = WScript.ScriptFullName
packageRoot = fso.GetParentFolderName(fso.GetParentFolderName(fso.GetParentFolderName(fso.GetParentFolderName(scriptPath))))
psScript = fso.BuildPath(packageRoot, "${installerWrapperRelativePath.replaceAll('/', '\\\\')}")
command = "${command}"
Set shell = CreateObject("WScript.Shell")
shell.Run "powershell -NoProfile -ExecutionPolicy Bypass -File """ & psScript & """ " & command, 0, False
`;
}

export function writeInstallerCandidateLaunchers(packageRoot) {
  const launcherDir = path.join(packageRoot, 'scripts/windows/installer-candidate');
  fs.mkdirSync(launcherDir, { recursive: true });
  for (const command of ['start', 'stop', 'status']) {
    fs.writeFileSync(path.join(launcherDir, `${command}.vbs`), renderInstallerLauncherVbs(command), 'utf8');
  }
}

if (process.argv[2] === 'generate-launchers') {
  writeInstallerCandidateLaunchers(process.cwd());
}
