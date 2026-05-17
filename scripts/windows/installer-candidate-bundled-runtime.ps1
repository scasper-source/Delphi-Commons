param(
  [ValidateSet('start','stop','status','restart','backup','reset','smoke')]
  [string]$Command = 'status'
)
$ErrorActionPreference = 'Stop'

$PackageRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$LifecycleWrapper = Join-Path $PackageRoot 'scripts\windows\portable-bundled-runtime.ps1'
$InstallerRuntimeSubdir = 'windows-installer-candidate'
$InstallerRuntimeRoot = Join-Path $env:LOCALAPPDATA "DelphiCommons\$InstallerRuntimeSubdir"

if (!(Test-Path -LiteralPath $LifecycleWrapper)) {
  throw "Required lifecycle wrapper missing: $LifecycleWrapper"
}

$previousSubdir = [Environment]::GetEnvironmentVariable('EDELPHI_RUNTIME_SUBDIR', 'Process')
$previousRoot = [Environment]::GetEnvironmentVariable('EDELPHI_RUNTIME_ROOT', 'Process')
try {
  [Environment]::SetEnvironmentVariable('EDELPHI_RUNTIME_SUBDIR', $InstallerRuntimeSubdir, 'Process')
  [Environment]::SetEnvironmentVariable('EDELPHI_RUNTIME_ROOT', $InstallerRuntimeRoot, 'Process')
  powershell -ExecutionPolicy Bypass -File $LifecycleWrapper $Command
  exit $LASTEXITCODE
}
finally {
  [Environment]::SetEnvironmentVariable('EDELPHI_RUNTIME_SUBDIR', $previousSubdir, 'Process')
  [Environment]::SetEnvironmentVariable('EDELPHI_RUNTIME_ROOT', $previousRoot, 'Process')
}
