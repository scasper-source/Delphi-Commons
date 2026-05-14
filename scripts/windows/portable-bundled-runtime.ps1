param(
  [ValidateSet('build','start','stop','status','restart','backup','reset','smoke','verify')]
  [string]$Command = 'status'
)
$ErrorActionPreference = 'Stop'

$PackageRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$PackagingScript = Join-Path $PackageRoot 'scripts\packaging\windows-portable.mjs'
$LifecycleScript = Join-Path $PackageRoot 'scripts\windows\portable-operator-candidate.ps1'
$NodeExe = Join-Path $PackageRoot 'runtime\node\node.exe'
$ServerNodeModules = Join-Path $PackageRoot 'server\node_modules'

function Set-ScopedEnv([hashtable]$Values) {
  $previous = @{}
  foreach ($key in $Values.Keys) {
    $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
    [Environment]::SetEnvironmentVariable($key, $Values[$key], 'Process')
  }
  return $previous
}

function Restore-ScopedEnv([hashtable]$Previous) {
  foreach ($key in $Previous.Keys) {
    [Environment]::SetEnvironmentVariable($key, $Previous[$key], 'Process')
  }
}

Push-Location $PackageRoot
try {
  if ($Command -eq 'build' -or $Command -eq 'verify') {
    if (!(Test-Path -LiteralPath $PackagingScript)) {
      throw "Build/verify commands must be run from the source checkout containing $PackagingScript"
    }
    node $PackagingScript $Command
    exit $LASTEXITCODE
  }

  foreach ($path in @($LifecycleScript,$NodeExe,$ServerNodeModules)) {
    if (!(Test-Path -LiteralPath $path)) { throw "Required packaged runtime path missing: $path" }
  }

  $previousEnv = Set-ScopedEnv @{
    EDELPHI_PORTABLE_NODE_EXE = $NodeExe
    EDELPHI_SERVER_NODE_MODULES_SOURCE = $ServerNodeModules
    EDELPHI_SKIP_RUNTIME_NPM_INSTALL = '1'
    EDELPHI_RUNTIME_SUBDIR = 'windows-portable-bundled-runtime-internal'
  }
  try {
    powershell -ExecutionPolicy Bypass -File $LifecycleScript $Command
    exit $LASTEXITCODE
  }
  finally {
    Restore-ScopedEnv $previousEnv
  }
}
finally { Pop-Location }
