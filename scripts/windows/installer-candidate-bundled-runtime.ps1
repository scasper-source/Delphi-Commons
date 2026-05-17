param(
  [ValidateSet('build','start','stop','status','restart','backup','reset','smoke','verify')]
  [string]$Command = 'status'
)
$ErrorActionPreference = 'Stop'

$PackageRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$PortableWrapper = Join-Path $PackageRoot 'scripts\windows\portable-bundled-runtime.ps1'
$InstallerRuntimeSubdir = 'windows-installer-candidate'
$InstallerRuntimeRoot = Join-Path $env:LOCALAPPDATA 'DelphiCommons\windows-installer-candidate'
if (!(Test-Path -LiteralPath $PortableWrapper)) {
  throw "Portable bundled runtime wrapper missing: $PortableWrapper"
}

$previousSubdir = [Environment]::GetEnvironmentVariable('EDELPHI_RUNTIME_SUBDIR', 'Process')
$previousRoot = [Environment]::GetEnvironmentVariable('EDELPHI_RUNTIME_ROOT', 'Process')
try {
  [Environment]::SetEnvironmentVariable('EDELPHI_RUNTIME_SUBDIR', $InstallerRuntimeSubdir, 'Process')
  [Environment]::SetEnvironmentVariable('EDELPHI_RUNTIME_ROOT', $InstallerRuntimeRoot, 'Process')
  powershell -NoProfile -ExecutionPolicy Bypass -File $PortableWrapper $Command
  exit $LASTEXITCODE
}
finally {
  [Environment]::SetEnvironmentVariable('EDELPHI_RUNTIME_SUBDIR', $previousSubdir, 'Process')
  [Environment]::SetEnvironmentVariable('EDELPHI_RUNTIME_ROOT', $previousRoot, 'Process')
}
