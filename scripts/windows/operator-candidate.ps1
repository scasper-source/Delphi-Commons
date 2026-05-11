param(
  [ValidateSet('start','stop','restart','status','reset','backup','smoke')]
  [string]$Command = 'start'
)

$ErrorActionPreference = 'Stop'

function Get-RepoRoot { Split-Path -Parent (Split-Path -Parent $PSScriptRoot) }
$RepoRoot = Get-RepoRoot
$RuntimeRoot = Join-Path $env:LOCALAPPDATA 'DelphiCommons\windows-operator-candidate'
$StateDir = Join-Path $RuntimeRoot 'state'
$LogsDir = Join-Path $RuntimeRoot 'logs'
$EvidenceDir = Join-Path $RuntimeRoot 'evidence'
$DbDir = Join-Path $RuntimeRoot 'db'
$AuditDir = Join-Path $RuntimeRoot 'audit'
$ExportsDir = Join-Path $RuntimeRoot 'exports'
$BackupsDir = Join-Path $RuntimeRoot 'backups'
$UiPort = 4173
$ApiPort = 3001
$ApiHost = '127.0.0.1'
$UiUrl = "http://127.0.0.1:$UiPort"
$HealthUrl = "http://127.0.0.1:$ApiPort/health"
$LockFile = Join-Path $StateDir 'instance.lock.json'
$NpmCommand = 'npm.cmd'

function Ensure-Dirs {
  foreach ($path in @($RuntimeRoot,$StateDir,$LogsDir,$EvidenceDir,$DbDir,$AuditDir,$ExportsDir,$BackupsDir)) {
    if (!(Test-Path -LiteralPath $path)) { New-Item -ItemType Directory -Path $path | Out-Null }
  }
}

function Assert-PathWithinRuntime([string]$path) {
  $resolved = [System.IO.Path]::GetFullPath($path)
  $runtime = [System.IO.Path]::GetFullPath($RuntimeRoot)
  if (!$resolved.StartsWith($runtime, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Unsafe path outside runtime root: $resolved"
  }
}

function Write-Evidence([string]$message) {
  $stamp = (Get-Date).ToString('s')
  Add-Content -Path (Join-Path $EvidenceDir 'operator-events.log') -Value "[$stamp] $message"
}

function Invoke-Checked([string]$filePath, [string[]]$arguments) {
  & $filePath @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $filePath $($arguments -join ' ')"
  }
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
  Stop-ProcessTree -processId $state.uiPid -name 'ui-preview'
  Remove-Item -LiteralPath $LockFile -Force -ErrorAction SilentlyContinue
}

function Assert-PortFree([int]$port) {
  $taken = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($taken) { throw "Port $port already in use. Stop conflicting process and retry." }
}

function Start-BackendProcess([string]$stdoutLog, [string]$stderrLog) {
  $backendEnv = @{
    HOST = $ApiHost
    PORT = "$ApiPort"
    EDELPHI_DATA_DIR = $DbDir
    EDELPHI_AUDIT_DIR = $AuditDir
    EDELPHI_BACKUP_DIR = $BackupsDir
    EDELPHI_ALLOWED_ORIGINS = $UiUrl
    NODE_ENV = 'production'
  }

  $previous = @{}
  foreach ($key in $backendEnv.Keys) {
    $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
    [Environment]::SetEnvironmentVariable($key, $backendEnv[$key], 'Process')
  }

  try {
    return Start-Process -FilePath 'node' -ArgumentList @('server/dist/index.js') -PassThru -NoNewWindow -RedirectStandardOutput $stdoutLog -RedirectStandardError $stderrLog -WorkingDirectory $RepoRoot
  }
  finally {
    foreach ($key in $backendEnv.Keys) {
      [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process')
    }
  }
}

function Start-Prototype {
  Ensure-Dirs
  $existing = Read-State
  if ($existing -and (Is-Running $existing.backendPid)) {
    throw "Prototype already running with backend pid $($existing.backendPid)."
  }
  if ($existing) {
    Write-Evidence 'Detected stale lock; cleaning stale state.'
    Stop-IfRunning
  }

  Assert-PortFree -port $ApiPort
  Assert-PortFree -port $UiPort

  Push-Location $RepoRoot
  try {
    Invoke-Checked $NpmCommand @('--prefix','app','run','build')
    Invoke-Checked $NpmCommand @('--prefix','server','run','build')

    $logStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backendOutLog = Join-Path $LogsDir ('backend-' + $logStamp + '-out.log')
    $backendErrLog = Join-Path $LogsDir ('backend-' + $logStamp + '-err.log')
    $uiOutLog = Join-Path $LogsDir ('ui-preview-' + $logStamp + '-out.log')
    $uiErrLog = Join-Path $LogsDir ('ui-preview-' + $logStamp + '-err.log')

    $backend = Start-BackendProcess -stdoutLog $backendOutLog -stderrLog $backendErrLog
    $ui = Start-Process -FilePath $NpmCommand -ArgumentList @('--prefix','app','run','preview','--','--host','127.0.0.1','--port',"$UiPort",'--strictPort') -PassThru -NoNewWindow -RedirectStandardOutput $uiOutLog -RedirectStandardError $uiErrLog -WorkingDirectory $RepoRoot

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
      Stop-ProcessTree -processId $ui.Id -name 'ui-preview'
      throw "Backend did not become healthy at $HealthUrl"
    }

    Save-State @{
      startedAt = (Get-Date).ToString('o')
      backendPid = $backend.Id
      uiPid = $ui.Id
      uiUrl = $UiUrl
      healthUrl = $HealthUrl
      runtimeRoot = $RuntimeRoot
    }
    Write-Evidence "Started prototype backendPid=$($backend.Id) uiPid=$($ui.Id) url=$UiUrl"
    Start-Process $UiUrl
    Write-Host "Operator UI: $UiUrl"
    Write-Host "Health check: $HealthUrl"
  }
  finally { Pop-Location }
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
