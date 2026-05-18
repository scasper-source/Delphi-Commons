param(
  [ValidateSet('start','stop','restart','status','reset','backup','smoke')]
  [string]$Command = 'start'
)

$ErrorActionPreference = 'Stop'

function Get-PackageRoot { Split-Path -Parent (Split-Path -Parent $PSScriptRoot) }
$PackageRoot = Get-PackageRoot
$RuntimeSubdir = if ($env:EDELPHI_RUNTIME_SUBDIR) { $env:EDELPHI_RUNTIME_SUBDIR } else { 'windows-operator-portable-candidate' }
$RuntimeRoot = if ($env:EDELPHI_RUNTIME_ROOT) { $env:EDELPHI_RUNTIME_ROOT } else { Join-Path $env:LOCALAPPDATA "DelphiCommons\$RuntimeSubdir" }
$StateDir = Join-Path $RuntimeRoot 'state'
$LogsDir = Join-Path $RuntimeRoot 'logs'
$EvidenceDir = Join-Path $RuntimeRoot 'evidence'
$DbDir = Join-Path $RuntimeRoot 'db'
$AuditDir = Join-Path $RuntimeRoot 'audit'
$ExportsDir = Join-Path $RuntimeRoot 'exports'
$BackupsDir = Join-Path $RuntimeRoot 'backups'
$RuntimeServerDir = Join-Path $RuntimeRoot 'server-runtime'
$UiPort = 4173
$ApiPort = 3001
$ApiHost = '127.0.0.1'
$UiUrl = "http://127.0.0.1:$UiPort"
$HealthUrl = "http://127.0.0.1:$ApiPort/health"
$LockFile = Join-Path $StateDir 'instance.lock.json'
$NpmCommand = 'npm.cmd'
$NodeCommand = if ($env:EDELPHI_PORTABLE_NODE_EXE) { $env:EDELPHI_PORTABLE_NODE_EXE } else { 'node' }
$ServerNodeModulesSource = $env:EDELPHI_SERVER_NODE_MODULES_SOURCE
$SkipRuntimeNpmInstall = $env:EDELPHI_SKIP_RUNTIME_NPM_INSTALL -eq '1'
$LanParticipantMode = $env:EDELPHI_ENABLE_LAN_PARTICIPANT_URL -eq '1'
$LanAcknowledged = $env:EDELPHI_ACK_LAN_SYNTHETIC_ONLY -eq '1'
$TunnelMode = $env:EDELPHI_ENABLE_TUNNEL_URL -eq '1'
$ParticipantPath = if ($env:EDELPHI_PARTICIPANT_PATH) { $env:EDELPHI_PARTICIPANT_PATH } else { '/participant' }

function Ensure-Dirs {
  foreach ($path in @($RuntimeRoot,$StateDir,$LogsDir,$EvidenceDir,$DbDir,$AuditDir,$ExportsDir,$BackupsDir)) {
    if (!(Test-Path -LiteralPath $path)) { New-Item -ItemType Directory -Path $path | Out-Null }
  }
}

function Get-PrimaryLanIPv4 {
  $candidate = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -ne '127.0.0.1' -and
      $_.IPAddress -notlike '169.254.*' -and
      $_.PrefixOrigin -ne 'WellKnown'
    } |
    Select-Object -First 1
  if ($candidate) { return $candidate.IPAddress }
  return $null
}

function Assert-PathWithinRuntime([string]$path) {
  $resolved = [System.IO.Path]::GetFullPath($path)
  $runtime = [System.IO.Path]::GetFullPath($RuntimeRoot)
  if (!$resolved.StartsWith($runtime, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Unsafe path outside runtime root: $resolved"
  }
}

function Invoke-Checked([string]$filePath, [string[]]$arguments, [string]$workingDirectory = $PackageRoot) {
  Push-Location $workingDirectory
  try {
    & $filePath @arguments
    if ($LASTEXITCODE -ne 0) {
      throw "Command failed with exit code ${LASTEXITCODE}: $filePath $($arguments -join ' ')"
    }
  }
  finally {
    Pop-Location
  }
}

function Assert-NodeRuntime {
  if ($env:EDELPHI_PORTABLE_NODE_EXE -and !(Test-Path -LiteralPath $NodeCommand)) {
    throw "Packaged Node executable missing: $NodeCommand"
  }
}

function Write-Evidence([string]$message) {
  $stamp = (Get-Date).ToString('s')
  Add-Content -Path (Join-Path $EvidenceDir 'portable-operator-events.log') -Value "[$stamp] $message"
}

function Read-State {
  if (Test-Path -LiteralPath $LockFile) {
    return Get-Content -LiteralPath $LockFile -Raw | ConvertFrom-Json
  }
  return $null
}

function Save-State($state) {
  $state | ConvertTo-Json | Set-Content -LiteralPath $LockFile -Encoding UTF8
}

function Is-Running([int]$processId) {
  try { Get-Process -Id $processId -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

function Stop-ProcessTree([int]$processId, [string]$name) {
  if (!(Is-Running $processId)) { return }
  $children = Get-CimInstance Win32_Process -Filter "ParentProcessId=$processId" -ErrorAction SilentlyContinue
  foreach ($child in $children) {
    Stop-ProcessTree -processId $child.ProcessId -name "$name-child"
  }
  try {
    Stop-Process -Id $processId -ErrorAction Stop
    Start-Sleep -Seconds 2
  } catch {}
  if (Is-Running $processId) {
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  }
  Write-Evidence "Stopped $name pid=$processId"
}

function Stop-IfRunning {
  $state = Read-State
  if ($null -eq $state) { return }
  Stop-ProcessTree -processId $state.backendPid -name 'backend'
  Stop-ProcessTree -processId $state.uiPid -name 'static-ui'
  Remove-Item -LiteralPath $LockFile -Force -ErrorAction SilentlyContinue
}

function Open-OperatorUi([string]$url = $UiUrl) {
  if ([string]::IsNullOrWhiteSpace($url)) { $url = $UiUrl }
  if ($env:EDELPHI_SKIP_OPEN_BROWSER -ne '1') {
    Start-Process $url
  }
  Write-Host "Operator UI: $url"
  Write-Host "Operator localhost URL (default, safe): $url"
}

function Assert-PortFree([int]$port) {
  $taken = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($taken) { throw "Port $port already in use. Stop conflicting process and retry." }
}

function Set-ProcessEnvAndStart([string]$filePath, [string[]]$arguments, [string]$workingDirectory, [string]$stdoutLog, [string]$stderrLog, [hashtable]$envVars) {
  $previous = @{}
  foreach ($key in $envVars.Keys) {
    $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
    [Environment]::SetEnvironmentVariable($key, $envVars[$key], 'Process')
  }
  try {
    return Start-Process -FilePath $filePath -ArgumentList (ConvertTo-ProcessArgumentList $arguments) -PassThru -NoNewWindow -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -WorkingDirectory $workingDirectory
  }
  finally {
    foreach ($key in $envVars.Keys) {
      [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process')
    }
  }
}

function ConvertTo-ProcessArgument([string]$argument) {
  if ($null -eq $argument) { return '""' }
  if ($argument -notmatch '[\s"]') { return $argument }
  return '"' + ($argument -replace '"', '\"') + '"'
}

function ConvertTo-ProcessArgumentList([string[]]$arguments) {
  return ($arguments | ForEach-Object { ConvertTo-ProcessArgument $_ }) -join ' '
}

function Ensure-ServerDependencies {
  $serverNodeModules = Join-Path $RuntimeServerDir 'node_modules'
  $fastifyPackage = Join-Path $serverNodeModules 'fastify\package.json'
  if (Test-Path -LiteralPath $fastifyPackage) { return }

  if ($ServerNodeModulesSource) {
    $sourceFastifyPackage = Join-Path $ServerNodeModulesSource 'fastify\package.json'
    if (!(Test-Path -LiteralPath $sourceFastifyPackage)) {
      throw "Packaged server production dependencies missing or incomplete: $ServerNodeModulesSource"
    }
    Write-Host 'Copying packaged server production dependencies into runtime root...'
    Assert-PathWithinRuntime $serverNodeModules
    if (Test-Path -LiteralPath $serverNodeModules) {
      Remove-Item -LiteralPath $serverNodeModules -Recurse -Force
    }
    Copy-Item -LiteralPath $ServerNodeModulesSource -Destination $RuntimeServerDir -Recurse -Force
    return
  }

  if ($SkipRuntimeNpmInstall) {
    throw 'Runtime npm install is disabled for this package and no packaged server dependencies were supplied.'
  }

  Write-Host 'Installing runtime server production dependencies outside package root...'
  Invoke-Checked $NpmCommand @('--prefix',$RuntimeServerDir,'ci','--omit=dev') $PackageRoot
}

function Sync-RuntimeServer {
  $sourceServer = Join-Path $PackageRoot 'server'
  $sourceDist = Join-Path $sourceServer 'dist'
  $sourcePackageJson = Join-Path $sourceServer 'package.json'
  $sourcePackageLock = Join-Path $sourceServer 'package-lock.json'
  foreach ($path in @($sourceDist,$sourcePackageJson,$sourcePackageLock)) {
    if (!(Test-Path -LiteralPath $path)) { throw "Required package server path missing: $path" }
  }

  if (!(Test-Path -LiteralPath $RuntimeServerDir)) {
    New-Item -ItemType Directory -Path $RuntimeServerDir | Out-Null
  }
  $runtimeDist = Join-Path $RuntimeServerDir 'dist'
  Assert-PathWithinRuntime $runtimeDist
  if (Test-Path -LiteralPath $runtimeDist) {
    Remove-Item -LiteralPath $runtimeDist -Recurse -Force
  }
  Copy-Item -LiteralPath $sourceDist -Destination $RuntimeServerDir -Recurse -Force
  Copy-Item -LiteralPath $sourcePackageJson -Destination (Join-Path $RuntimeServerDir 'package.json') -Force
  Copy-Item -LiteralPath $sourcePackageLock -Destination (Join-Path $RuntimeServerDir 'package-lock.json') -Force

  if ($ServerNodeModulesSource) {
    $runtimeNodeModules = Join-Path $RuntimeServerDir 'node_modules'
    Assert-PathWithinRuntime $runtimeNodeModules
    if (Test-Path -LiteralPath $runtimeNodeModules) {
      Remove-Item -LiteralPath $runtimeNodeModules -Recurse -Force
    }
  }
}

function Start-Prototype {
  Ensure-Dirs
  $existing = Read-State
  if ($existing) {
    $backendRunning = Is-Running $existing.backendPid
    $uiRunning = Is-Running $existing.uiPid
    if ($backendRunning -and $uiRunning) {
      $existingUrl = if ($existing.uiUrl) { $existing.uiUrl } else { $UiUrl }
      Write-Evidence "Start requested while already running; reopening browser url=$existingUrl"
      Open-OperatorUi $existingUrl
      Write-Host "Health check: $($existing.healthUrl)"
      return
    }
    Write-Evidence 'Detected stale or partial lock; cleaning stale state before start.'
    Stop-IfRunning
  }

  Assert-PortFree -port $ApiPort
  Assert-PortFree -port $UiPort
  Assert-NodeRuntime
  Sync-RuntimeServer
  Ensure-ServerDependencies

  $serverEntry = Join-Path $RuntimeServerDir 'dist\index.js'
  $uiRoot = Join-Path $PackageRoot 'app\dist'
  $staticServer = Join-Path $PackageRoot 'tools\static-file-server.mjs'
  foreach ($path in @($serverEntry,$uiRoot,$staticServer)) {
    if (!(Test-Path -LiteralPath $path)) { throw "Required package path missing: $path" }
  }

  $logStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backendOutLog = Join-Path $LogsDir ('backend-' + $logStamp + '-out.log')
  $backendErrLog = Join-Path $LogsDir ('backend-' + $logStamp + '-err.log')
  $uiOutLog = Join-Path $LogsDir ('static-ui-' + $logStamp + '-out.log')
  $uiErrLog = Join-Path $LogsDir ('static-ui-' + $logStamp + '-err.log')

  $backendEnv = @{
    HOST = $ApiHost
    PORT = "$ApiPort"
    EDELPHI_DATA_DIR = $DbDir
    EDELPHI_AUDIT_DIR = $AuditDir
    EDELPHI_BACKUP_DIR = $BackupsDir
    EDELPHI_ALLOWED_ORIGINS = $UiUrl
    NODE_ENV = 'production'
  }

  $backend = Set-ProcessEnvAndStart -filePath $NodeCommand -arguments @($serverEntry) -workingDirectory $RuntimeServerDir -stdoutLog $backendOutLog -stderrLog $backendErrLog -envVars $backendEnv
  $ui = Start-Process -FilePath $NodeCommand -ArgumentList (ConvertTo-ProcessArgumentList @($staticServer,'--root',$uiRoot,'--host','127.0.0.1','--port',"$UiPort")) -PassThru -NoNewWindow -RedirectStandardOutput $uiOutLog -RedirectStandardError $uiErrLog -WorkingDirectory $PackageRoot

  $deadline = (Get-Date).AddSeconds(45)
  $ready = $false
  while ((Get-Date) -lt $deadline) {
    try {
      $health = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 2
      if ($health.status -eq 'ok') { $ready = $true; break }
    } catch {}
    Start-Sleep -Milliseconds 800
  }

  if (!$ready) {
    Stop-ProcessTree -processId $backend.Id -name 'backend'
    Stop-ProcessTree -processId $ui.Id -name 'static-ui'
    throw "Backend did not become healthy at $HealthUrl"
  }

  Save-State @{
    startedAt = (Get-Date).ToString('o')
    backendPid = $backend.Id
    uiPid = $ui.Id
    uiUrl = $UiUrl
    healthUrl = $HealthUrl
    runtimeRoot = $RuntimeRoot
    packageRoot = $PackageRoot
    nodeExecutable = $NodeCommand
  }
  Write-Evidence "Started portable prototype backendPid=$($backend.Id) uiPid=$($ui.Id) url=$UiUrl"
  Open-OperatorUi $UiUrl
  if ($LanParticipantMode) {
    if (!$LanAcknowledged) {
      Stop-ProcessTree -processId $backend.Id -name 'backend'
      Stop-ProcessTree -processId $ui.Id -name 'static-ui'
      Remove-Item -LiteralPath $LockFile -Force -ErrorAction SilentlyContinue
      throw 'LAN participant mode requires explicit acknowledgement. Re-run with EDELPHI_ACK_LAN_SYNTHETIC_ONLY=1.'
    }
    $lanIp = Get-PrimaryLanIPv4
    if ($lanIp) {
      Write-Host "Participant LAN URL (synthetic/internal testing only): http://${lanIp}:$UiPort$ParticipantPath"
      Write-Host 'WARNING: Internal synthetic testing only. Do not use for production, pilot, or human-subjects claims.'
    } else {
      Write-Host 'LAN participant mode enabled but no LAN IP detected; participant LAN URL unavailable.'
    }
  }
  if ($TunnelMode) {
    Write-Host 'WARNING: Tunnel mode flag is ON, but tunnel support is intentionally not provisioned in package runtime.'
    Write-Host 'WARNING: Keep tunnel OFF by default; do not expose participant traffic to public internet.'
  }
  Write-Host "Health check: $HealthUrl"
}

function Reset-Prototype {
  Ensure-Dirs
  $state = Read-State
  if ($state -and (Is-Running $state.backendPid)) {
    throw 'Stop prototype before reset.'
  }
  $snapshot = Join-Path $BackupsDir ('reset-snapshot-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
  New-Item -ItemType Directory -Path $snapshot | Out-Null
  foreach ($dir in @($DbDir,$AuditDir,$ExportsDir,$LogsDir,$EvidenceDir)) {
    Assert-PathWithinRuntime $dir
    if (Test-Path $dir) {
      Copy-Item -Path (Join-Path $dir '*') -Destination $snapshot -Recurse -Force -ErrorAction SilentlyContinue
      Get-ChildItem -Path $dir -Force | Remove-Item -Recurse -Force
    }
  }
  Write-Evidence "Reset completed with snapshot $snapshot"
  Write-Host "Reset complete. Snapshot: $snapshot"
}

function Backup-Prototype {
  Ensure-Dirs
  $dest = Join-Path $BackupsDir ('backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
  New-Item -ItemType Directory -Path $dest | Out-Null
  foreach ($dir in @($DbDir,$AuditDir,$ExportsDir)) {
    Assert-PathWithinRuntime $dir
    Copy-Item -Path $dir -Destination $dest -Recurse -Force
  }
  $manifest = @{
    createdAt = (Get-Date).ToString('o')
    source = $RuntimeRoot
    includes = @('db','audit','exports')
  }
  $manifest | ConvertTo-Json | Set-Content -Path (Join-Path $dest 'manifest.json')
  Write-Evidence "Backup completed at $dest"
  Write-Host "Backup: $dest"
}

switch ($Command) {
  'start' { Start-Prototype }
  'stop' { Stop-IfRunning; Write-Host 'Prototype stopped.' }
  'restart' { Stop-IfRunning; Start-Prototype }
  'status' {
    $state = Read-State
    if ($null -eq $state) { Write-Host 'Not running.'; break }
    $backendRunning = Is-Running $state.backendPid
    $uiRunning = Is-Running $state.uiPid
    Write-Host "Backend pid: $($state.backendPid) running=$backendRunning"
    Write-Host "UI pid: $($state.uiPid) running=$uiRunning"
    Write-Host "UI URL: $($state.uiUrl)"
    Write-Host "Health: $($state.healthUrl)"
    Write-Host "Runtime root: $($state.runtimeRoot)"
    Write-Host "Package root: $($state.packageRoot)"
  }
  'reset' { Reset-Prototype }
  'backup' { Backup-Prototype }
  'smoke' {
    $health = Invoke-RestMethod -Uri $HealthUrl -Method Get -TimeoutSec 5
    if ($health.status -ne 'ok') { throw 'Health failed' }
    Write-Evidence 'Smoke check passed.'
    Write-Host "Smoke ok: $HealthUrl"
  }
}
