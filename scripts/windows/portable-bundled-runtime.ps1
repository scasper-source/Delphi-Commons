param(
  [ValidateSet('build','start','stop','status','restart','backup','reset','smoke','verify')]
  [string]$Command = 'status'
)
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $RepoRoot
try {
  if ($Command -eq 'build' -or $Command -eq 'verify') {
    node .\scripts\packaging\windows-portable.mjs $Command
    exit $LASTEXITCODE
  }
  powershell -ExecutionPolicy Bypass -File .\scripts\windows\portable-operator-candidate.ps1 $Command
  exit $LASTEXITCODE
}
finally { Pop-Location }
