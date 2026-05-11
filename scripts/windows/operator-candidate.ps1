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

function Read-State {
  if (Test-Path -LiteralPath $LockFile) {
    return Get-Content -LiteralPath $LockFile -Raw | ConvertFrom-Json
  }
  return $null
}

function Save-State($state) {
  $state | ConvertTo-Json | Set-Content -LiteralPath $LockFile -Encoding UTF8
}

function Is-Running([int]$pid) {
  try { Get-Process -Id $pid -ErrorAction Stop | Out-Null; return $true } catch { return $false }
}

function Stop-ProcessTree([int]$pid, [string]$name) {
  if (!(Is-Running $pid)) { return }
  try {
    Stop-Process -Id $pid -ErrorAction Stop
    Start-Sleep -Seconds 2
  } catch {}
  if (Is-Running $pid) {
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
  }
  Write-Evidence "Stopped $name pid=$pid"
}

function Stop-IfRunning {
  $state = Read-State
  if ($null -eq $state) { return }
  Stop-ProcessTree -pid $state.backendPid -name 'backend'
  Stop-ProcessTree -pid $state.uiPid -name 'ui-preview'
  Remove-Item -LiteralPath $LockFile -Force -ErrorAction SilentlyContinue
}

function Assert-PortFree([int]$port) {
  $taken = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($taken) { throw "Port $port already in use. Stop conflicting process and retry." }
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
    npm --prefix app run build
    npm --prefix server run build

    $backendLog = Join-Path $LogsDir ('backend-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')
    $uiLog = Join-Path $LogsDir ('ui-preview-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.log')

    $backendEnv = @{
      HOST = $ApiHost
      PORT = "$ApiPort"
      EDELPHI_DATA_DIR = $DbDir
      EDELPHI_AUDIT_DIR = $AuditDir
      EDELPHI_BACKUP_DIR = $BackupsDir
      EDELPHI_ALLOWED_ORIGINS = $UiUrl
      NODE_ENV = 'production'
    }

    $backend = Start-Process -FilePath 'node' -ArgumentList @('server/dist/index.js') -PassThru -NoNewWindow -RedirectStandardOutput $backendLog -RedirectStandardError $backendLog -WorkingDirectory $RepoRoot -Environment $backendEnv
    $ui = Start-Process -FilePath 'npm' -ArgumentList @('--prefix','app','run','preview','--','--host','127.0.0.1','--port',"$UiPort",'--strictPort') -PassThru -NoNewWindow -RedirectStandardOutput $uiLog -RedirectStandardError $uiLog -WorkingDirectory $RepoRoot

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
      Stop-ProcessTree -pid $backend.Id -name 'backend'
      Stop-ProcessTree -pid $ui.Id -name 'ui-preview'
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
