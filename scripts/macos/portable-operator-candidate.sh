#!/usr/bin/env bash
set -euo pipefail

COMMAND="${1:-start}"
case "$COMMAND" in
  start|stop|restart|status|smoke|backup|reset) ;;
  *) echo "Unsupported command: $COMMAND" >&2; exit 2 ;;
esac

PACKAGE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUNTIME_ROOT="$HOME/Library/Application Support/DelphiCommons/macos-operator-portable-candidate"
STATE_DIR="$RUNTIME_ROOT/state"
LOGS_DIR="$RUNTIME_ROOT/logs"
EVIDENCE_DIR="$RUNTIME_ROOT/evidence"
DB_DIR="$RUNTIME_ROOT/db"
AUDIT_DIR="$RUNTIME_ROOT/audit"
EXPORTS_DIR="$RUNTIME_ROOT/exports"
BACKUPS_DIR="$RUNTIME_ROOT/backups"
SERVER_RUNTIME_DIR="$RUNTIME_ROOT/server-runtime"
LOCK_FILE="$STATE_DIR/instance.lock"
API_HOST="127.0.0.1"
API_PORT="3001"
UI_HOST="127.0.0.1"
UI_PORT="4173"
HEALTH_URL="http://$API_HOST:$API_PORT/health"
UI_URL="http://$UI_HOST:$UI_PORT"

ensure_dirs() { mkdir -p "$RUNTIME_ROOT" "$STATE_DIR" "$LOGS_DIR" "$EVIDENCE_DIR" "$DB_DIR" "$AUDIT_DIR" "$EXPORTS_DIR" "$BACKUPS_DIR"; }
write_evidence() { printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" >> "$EVIDENCE_DIR/portable-operator-events.log"; }
is_pid_running() { kill -0 "$1" 2>/dev/null; }

read_lock_pid() { [[ -f "$LOCK_FILE" ]] && awk -F= '/^backend_pid=/{print $2}' "$LOCK_FILE" || true; }
read_lock_ui_pid() { [[ -f "$LOCK_FILE" ]] && awk -F= '/^ui_pid=/{print $2}' "$LOCK_FILE" || true; }

stop_if_running() {
  local bpid upid
  bpid="$(read_lock_pid)"; upid="$(read_lock_ui_pid)"
  if [[ -n "$bpid" ]] && is_pid_running "$bpid"; then kill "$bpid" || true; fi
  if [[ -n "$upid" ]] && is_pid_running "$upid"; then kill "$upid" || true; fi
  rm -f "$LOCK_FILE"
}

start_flow() {
  ensure_dirs
  local existing
  existing="$(read_lock_pid)"
  if [[ -n "$existing" ]] && is_pid_running "$existing"; then
    echo "Prototype already running with backend pid $existing" >&2
    exit 1
  fi

  rm -rf "$SERVER_RUNTIME_DIR/dist"
  mkdir -p "$SERVER_RUNTIME_DIR"
  cp -R "$PACKAGE_ROOT/server/dist" "$SERVER_RUNTIME_DIR/dist"
  cp "$PACKAGE_ROOT/server/package.json" "$SERVER_RUNTIME_DIR/package.json"
  cp "$PACKAGE_ROOT/server/package-lock.json" "$SERVER_RUNTIME_DIR/package-lock.json"

  if [[ ! -d "$SERVER_RUNTIME_DIR/node_modules" ]]; then
    npm --prefix "$SERVER_RUNTIME_DIR" ci --omit=dev
  fi

  local stamp backend_out backend_err ui_out ui_err
  stamp="$(date -u +%Y%m%d-%H%M%S)"
  backend_out="$LOGS_DIR/backend-$stamp-out.log"; backend_err="$LOGS_DIR/backend-$stamp-err.log"
  ui_out="$LOGS_DIR/static-ui-$stamp-out.log"; ui_err="$LOGS_DIR/static-ui-$stamp-err.log"

  (
    export HOST="$API_HOST" PORT="$API_PORT" NODE_ENV=production
    export EDELPHI_DATA_DIR="$DB_DIR" EDELPHI_AUDIT_DIR="$AUDIT_DIR" EDELPHI_BACKUP_DIR="$BACKUPS_DIR"
    export EDELPHI_ALLOWED_ORIGINS="$UI_URL"
    cd "$SERVER_RUNTIME_DIR" && nohup node dist/index.js >>"$backend_out" 2>>"$backend_err" & echo $! > "$STATE_DIR/backend.pid"
  )
  backend_pid="$(cat "$STATE_DIR/backend.pid")"

  (cd "$PACKAGE_ROOT" && nohup node tools/static-file-server.mjs --root "$PACKAGE_ROOT/app/dist" --host "$UI_HOST" --port "$UI_PORT" >>"$ui_out" 2>>"$ui_err" & echo $! > "$STATE_DIR/ui.pid")
  ui_pid="$(cat "$STATE_DIR/ui.pid")"

  cat > "$LOCK_FILE" <<LOCK
backend_pid=$backend_pid
ui_pid=$ui_pid
ui_url=$UI_URL
health_url=$HEALTH_URL
runtime_root=$RUNTIME_ROOT
package_root=$PACKAGE_ROOT
LOCK
  write_evidence "Started portable prototype backendPid=$backend_pid uiPid=$ui_pid"
  echo "Operator UI: $UI_URL"
  echo "Health check: $HEALTH_URL"
}

case "$COMMAND" in
  status)
    ensure_dirs
    bpid="$(read_lock_pid)"; upid="$(read_lock_ui_pid)"
    if [[ -n "$bpid" ]] && is_pid_running "$bpid"; then echo "running backend=$bpid ui=${upid:-unknown}"; else echo "stopped"; fi
    ;;
  start) start_flow ;;
  stop) ensure_dirs; stop_if_running; write_evidence "Stopped portable prototype"; echo "stopped" ;;
  restart) ensure_dirs; stop_if_running; start_flow ;;
  smoke) echo "smoke: NOT RUN in non-macOS CI environment" ;;
  backup)
    ensure_dirs
    dest="$BACKUPS_DIR/backup-$(date -u +%Y%m%d-%H%M%S)"
    mkdir -p "$dest"
    cp -R "$DB_DIR" "$AUDIT_DIR" "$EXPORTS_DIR" "$dest/" 2>/dev/null || true
    echo "Backup: $dest"
    ;;
  reset)
    ensure_dirs
    bpid="$(read_lock_pid)"
    if [[ -n "$bpid" ]] && is_pid_running "$bpid"; then
      echo "Refusing reset while running. Run stop first." >&2
      exit 1
    fi
    snapshot="$BACKUPS_DIR/reset-snapshot-$(date -u +%Y%m%d-%H%M%S)"
    mkdir -p "$snapshot"
    cp -R "$DB_DIR" "$AUDIT_DIR" "$EXPORTS_DIR" "$LOGS_DIR" "$EVIDENCE_DIR" "$snapshot/" 2>/dev/null || true
    rm -rf "$DB_DIR"/* "$AUDIT_DIR"/* "$EXPORTS_DIR"/* "$LOGS_DIR"/* "$EVIDENCE_DIR"/*
    echo "Reset complete. Snapshot: $snapshot"
    ;;
esac
