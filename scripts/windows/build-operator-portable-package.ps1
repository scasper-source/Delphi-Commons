param(
  [string]$Label = 'windows-operator-portable-prototype',
  [string]$OutputRoot = ''
)

$ErrorActionPreference = 'Stop'

function Get-RepoRoot { Split-Path -Parent (Split-Path -Parent $PSScriptRoot) }
$RepoRoot = Get-RepoRoot
$NpmCommand = 'npm.cmd'

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
  $OutputRoot = Join-Path $RepoRoot 'build/windows-operator-portable'
}

$OutputRoot = [System.IO.Path]::GetFullPath($OutputRoot)
$OutputRootParent = Split-Path -Parent $OutputRoot
if (!(Test-Path -LiteralPath $OutputRootParent)) {
  New-Item -ItemType Directory -Path $OutputRootParent -Force | Out-Null
}

if (!(Test-Path -LiteralPath $OutputRoot)) {
  New-Item -ItemType Directory -Path $OutputRoot -Force | Out-Null
}

function Assert-Within([string]$candidatePath, [string]$rootPath) {
  $candidate = [System.IO.Path]::GetFullPath($candidatePath)
  $root = [System.IO.Path]::GetFullPath($rootPath)
  if (!$candidate.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing unsafe path operation outside output root. candidate=$candidate root=$root"
  }
}

function Invoke-Checked([string]$filePath, [string[]]$arguments) {
  & $filePath @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $filePath $($arguments -join ' ')"
  }
}

Push-Location $RepoRoot
try {
  Invoke-Checked $NpmCommand @('--prefix','app','run','build')
  Invoke-Checked $NpmCommand @('--prefix','server','run','build')

  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  $commit = (git rev-parse HEAD).Trim()
  $buildStamp = (Get-Date).ToUniversalTime().ToString('o')
  $packageName = "$Label-$($buildStamp.Replace(':','').Replace('-','').Replace('T','-').Substring(0,15))"

  $stageRoot = Join-Path $OutputRoot 'staging'
  Assert-Within $stageRoot $OutputRoot
  if (Test-Path -LiteralPath $stageRoot) {
    Remove-Item -LiteralPath $stageRoot -Recurse -Force
  }
  New-Item -ItemType Directory -Path $stageRoot | Out-Null

  $packageRoot = Join-Path $stageRoot $packageName
  New-Item -ItemType Directory -Path $packageRoot | Out-Null

  foreach ($relativePath in @('app/dist','server/dist','scripts/windows/operator-candidate.ps1','LICENSE','NOTICE')) {
    $sourcePath = Join-Path $RepoRoot $relativePath
    if (!(Test-Path -LiteralPath $sourcePath)) {
      throw "Required path missing for packaging: $relativePath"
    }
  }

  New-Item -ItemType Directory -Path (Join-Path $packageRoot 'app') | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $packageRoot 'server') | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $packageRoot 'scripts/windows') -Force | Out-Null

  Copy-Item -LiteralPath (Join-Path $RepoRoot 'app/dist') -Destination (Join-Path $packageRoot 'app') -Recurse -Force
  Copy-Item -LiteralPath (Join-Path $RepoRoot 'server/dist') -Destination (Join-Path $packageRoot 'server') -Recurse -Force
  Copy-Item -LiteralPath (Join-Path $RepoRoot 'scripts/windows/operator-candidate.ps1') -Destination (Join-Path $packageRoot 'scripts/windows/operator-candidate.ps1') -Force
  Copy-Item -LiteralPath (Join-Path $RepoRoot 'LICENSE') -Destination (Join-Path $packageRoot 'LICENSE') -Force
  Copy-Item -LiteralPath (Join-Path $RepoRoot 'NOTICE') -Destination (Join-Path $packageRoot 'NOTICE') -Force

  $packageReadme = @"
# Windows Operator Portable Package Prototype

Status: PORTABLE PACKAGE PROTOTYPE
Decision label: NOT READY FOR HUMAN TESTING

This package is an internal Stage 1 prototype for the `human_testing_candidate` track.

## Run

1. Install local Node.js + npm on Windows.
2. Open PowerShell in repository root.
3. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\operator-candidate.ps1 start
```

## Runtime and data policy

- Runtime data root: `%LOCALAPPDATA%\DelphiCommons\windows-operator-candidate`
- Runtime data is intentionally outside the package and outside source tree.

## Limitations

- This package does **not** include a bundled portable Node runtime.
- This package still requires local Node/npm and is not standalone.
- No installer, signing, updater, PWA/service-worker, native mobile app, real SMS provider delivery, or external AI behavior is included.

## Non-claims

This package does **not** claim production readiness, pilot readiness, real human-subjects readiness, IRB/legal/security/accessibility certification, installer readiness, Windows support readiness, macOS support readiness, real SMS readiness, PWA readiness, native mobile readiness, or external AI readiness.
"@
  Set-Content -LiteralPath (Join-Path $packageRoot 'README.txt') -Value $packageReadme -Encoding UTF8

  $included = Get-ChildItem -LiteralPath $packageRoot -Recurse -Force | ForEach-Object {
    [System.IO.Path]::GetRelativePath($packageRoot, $_.FullName)
  }

  $manifest = [ordered]@{
    packageLabel = $Label
    packageName = $packageName
    track = 'human_testing_candidate'
    buildTimestampUtc = $buildStamp
    branch = $branch
    commitHash = $commit
    buildMachine = $env:COMPUTERNAME
    buildOs = [System.Environment]::OSVersion.VersionString
    packageRoot = $packageRoot
    runtimeDataPath = '%LOCALAPPDATA%\DelphiCommons\windows-operator-candidate'
    requiredExternalDependencies = @(
      'Node.js + npm on local Windows machine',
      'PowerShell 5.1+ or PowerShell 7+'
    )
    explicitLimitations = @(
      'Portable Node runtime not bundled in Stage 1 package prototype.',
      'Local Node/npm dependency remains required.',
      'No installer, signing, updater, or service install behavior.',
      'No real SMS provider delivery, PWA/service-worker, native mobile app, or external AI behavior.'
    )
    explicitNonClaims = @(
      'Not production-ready.',
      'Not pilot-ready.',
      'Not real human-subjects ready.',
      'No IRB/legal/security/accessibility certification claims.',
      'No installer or platform support readiness claims.'
    )
    includedFilesAndDirectories = $included
  }

  $manifestPath = Join-Path $packageRoot 'package-manifest.json'
  $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding UTF8

  $zipPath = Join-Path $OutputRoot ($packageName + '.zip')
  Assert-Within $zipPath $OutputRoot
  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }
  Compress-Archive -Path (Join-Path $packageRoot '*') -DestinationPath $zipPath -Force

  Write-Host "Package root: $packageRoot"
  Write-Host "Package zip: $zipPath"
  Write-Host "Manifest: $manifestPath"
}
finally {
  Pop-Location
}
