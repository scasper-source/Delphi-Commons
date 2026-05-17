param(
  [ValidateSet('build','start','stop','status','restart','backup','reset','smoke','verify')]
  [string]$Command = 'status'
)
$ErrorActionPreference = 'Stop'

$PackageRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$PortableWrapper = Join-Path $PackageRoot 'scripts\windows\portable-bundled-runtime.ps1'
if (!(Test-Path -LiteralPath $PortableWrapper)) {
  throw "Portable bundled runtime wrapper missing: $PortableWrapper"
}

$previousSubdir = [Environment]::GetEnvironmentVariable('EDELPHI_RUNTIME_SUBDIR', 'Process')
$previousRoot = [Environment]::GetEnvironmentVariable('EDELPHI_RUNTIME_ROOT', 'Process')
try {
  [Environment]::SetEnvironmentVariable('EDELPHI_RUNTIME_SUBDIR', 'windows-installer-candidate', 'Process')
  if (-not $env:EDELPHI_RUNTIME_ROOT) {
    [Environment]::SetEnvironmentVariable('EDELPHI_RUNTIME_ROOT', (Join-Path $env:LOCALAPPDATA 'DelphiCommons\windows-installer-candidate'), 'Process')
  }
  powershell -ExecutionPolicy Bypass -File $PortableWrapper $Command
  exit $LASTEXITCODE
}
finally {
  [Environment]::SetEnvironmentVariable('EDELPHI_RUNTIME_SUBDIR', $previousSubdir, 'Process')
  [Environment]::SetEnvironmentVariable('EDELPHI_RUNTIME_ROOT', $previousRoot, 'Process')
}
