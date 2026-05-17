#!/usr/bin/env bash
set -euo pipefail

COMMAND="${1:-start}"
case "$COMMAND" in
  start|stop|restart|status|smoke|backup|restore|reset|uninstall) ;;
  *) echo "Unsupported command: $COMMAND" >&2; exit 2 ;;
esac

PACKAGE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUNTIME_ROOT="${EDELPHI_RUNTIME_ROOT:-$HOME/Library/Application Support/DelphiCommons/macos-operator-portable-candidate}"
STATE_DIR="$RUNTIME_ROOT/state"
LOGS_DIR="$RUNTIME_ROOT/logs"
EVIDENCE_DIR="$RUNTIME_ROOT/evidence"
DB_DIR="$RUNTIME_ROOT/db"
AUDIT_DIR="$RUNTIME_ROOT/audit"
EXPORTS_DIR="$RUNTIME_ROOT/exports"
BACKUPS_DIR="$RUNTIME_ROOT/backups"
SERVER_RUNTIME_DIR="$RUNTIME_ROOT/server-runtime"
LOCK_FILE="$STATE_DIR/instance.lock"
BACKEND_PID_FILE="$STATE_DIR/backend.pid"
UI_PID_FILE="$STATE_DIR/ui.pid"
API_HOST="127.0.0.1"
API_PORT="3001"
UI_HOST="127.0.0.1"
UI_PORT="4173"
HEALTH_URL="http://$API_HOST:$API_PORT/health"
UI_URL="http://$UI_HOST:$UI_PORT"
SERVER_ENTRY="$SERVER_RUNTIME_DIR/dist/index.js"
STATIC_SERVER="$PACKAGE_ROOT/tools/static-file-server.mjs"
UI_ROOT="$PACKAGE_ROOT/app/dist"

NODE_COMMAND_DEFAULT="${EDELPHI_PORTABLE_NODE_EXE:-node}"
NodeCommand="$NODE_COMMAND_DEFAULT"
SERVER_NODE_MODULES_SOURCE="${EDELPHI_SERVER_NODE_MODULES_SOURCE:-}"
SKIP_RUNTIME_NPM_INSTALL="${EDELPHI_SKIP_RUNTIME_NPM_INSTALL:-0}"
LAN_PARTICIPANT_MODE="${EDELPHI_ENABLE_LAN_PARTICIPANT_URL:-0}"
LAN_ACKNOWLEDGED="${EDELPHI_ACK_LAN_SYNTHETIC_ONLY:-0}"
TUNNEL_MODE="${EDELPHI_ENABLE_TUNNEL_URL:-0}"
PARTICIPANT_PATH="${EDELPHI_PARTICIPANT_PATH:-/participant}"

ensure_dirs() {
  mkdir -p "$RUNTIME_ROOT" "$STATE_DIR" "$LOGS_DIR" "$EVIDENCE_DIR" "$DB_DIR" "$AUDIT_DIR" "$EXPORTS_DIR" "$BACKUPS_DIR" "$SERVER_RUNTIME_DIR"
}

write_evidence() {
  printf '[%s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$1" >> "$EVIDENCE_DIR/portable-operator-events.log"
}

get_primary_lan_ip() {
  if command -v ipconfig >/dev/null 2>&1; then
    ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true
    return 0
  fi
  true
}

assert_path_within_runtime() {
  local candidate root
  candidate="$(cd "$(dirname "$1")" && pwd -P)/$(basename "$1")"
  root="$(cd "$RUNTIME_ROOT" && pwd -P)"
  case "$candidate" in
    "$root"/*|"$root") ;;
    *) echo "Refusing unsafe runtime path operation outside runtime root. candidate=$candidate root=$root" >&2; exit 1 ;;
  esac
}

is_integer_pid() {
  case "${1:-}" in
    ''|*[!0-9]*) return 1 ;;
    *) return 0 ;;
  esac
}

is_pid_running() {
  is_integer_pid "${1:-}" && kill -0 "$1" 2>/dev/null
}

read_lock_value() {
  local key="$1"
  [[ -f "$LOCK_FILE" ]] && awk -F= -v key="$key" '$1 == key { print substr($0, index($0, "=") + 1); exit }' "$LOCK_FILE" || true
}

read_pid_file() {
  local file="$1" pid
  [[ -f "$file" ]] || return 0
  pid="$(tr -cd '0-9' < "$file")"
  is_integer_pid "$pid" && printf '%s\n' "$pid"
}

read_lock_pid() { read_lock_value "backend_pid"; }
read_lock_ui_pid() { read_lock_value "ui_pid"; }

process_command() {
  ps -p "$1" -o command= 2>/dev/null || true
}

command_contains() {
  local pid="$1" expected="$2" command_text
  command_text="$(process_command "$pid")"
  case "$command_text" in
    *"$expected"*) return 0 ;;
  esac
  return 1
}

port_listener_pids() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true
  fi
}

unique_pids() {
  awk 'NF && !seen[$0]++'
}

backend_candidate_pids() {
  read_lock_pid
  read_pid_file "$BACKEND_PID_FILE"
  port_listener_pids "$API_PORT"
}

ui_candidate_pids() {
  read_lock_ui_pid
  read_pid_file "$UI_PID_FILE"
  port_listener_pids "$UI_PORT"
}

is_expected_backend_pid() {
  local pid="$1"
  is_pid_running "$pid" && command_contains "$pid" "$SERVER_ENTRY"
}

is_expected_ui_pid() {
  local pid="$1"
  is_pid_running "$pid" && command_contains "$pid" "$STATIC_SERVER" && command_contains "$pid" "$UI_ROOT"
}

backend_running_pid() {
  local pid
  while IFS= read -r pid; do
    if is_expected_backend_pid "$pid"; then
      printf '%s\n' "$pid"
      return 0
    fi
  done < <(backend_candidate_pids | unique_pids)
  return 1
}

ui_running_pid() {
  local pid
  while IFS= read -r pid; do
    if is_expected_ui_pid "$pid"; then
      printf '%s\n' "$pid"
      return 0
    fi
  done < <(ui_candidate_pids | unique_pids)
  return 1
}

clear_state_files() {
  assert_path_within_runtime "$LOCK_FILE"
  assert_path_within_runtime "$BACKEND_PID_FILE"
  assert_path_within_runtime "$UI_PID_FILE"
  rm -f "$LOCK_FILE" "$BACKEND_PID_FILE" "$UI_PID_FILE"
}

terminate_pid() {
  local pid="$1" name="$2" deadline
  is_pid_running "$pid" || return 0
  kill "$pid" 2>/dev/null || true
  deadline=$((SECONDS + 15))
  while (( SECONDS < deadline )); do
    is_pid_running "$pid" || return 0
    sleep 1
  done
  if is_pid_running "$pid"; then
    kill -KILL "$pid" 2>/dev/null || true
  fi
  write_evidence "Stopped $name pid=$pid"
}

stop_if_running() {
  local pids pid
  pids="$(
    {
      backend_candidate_pids
      ui_candidate_pids
    } | unique_pids
  )"
  while IFS= read -r pid; do
    [[ -n "$pid" ]] || continue
    if is_expected_backend_pid "$pid"; then
      terminate_pid "$pid" "backend"
    elif is_expected_ui_pid "$pid"; then
      terminate_pid "$pid" "static-ui"
    fi
  done <<< "$pids"
  clear_state_files
}

assert_port_free() {
  local port="$1" pids
  pids="$(port_listener_pids "$port" | unique_pids)"
  if [[ -n "$pids" ]]; then
    echo "Port $port is already in use by pid(s): $(printf '%s' "$pids" | tr '\n' ' ')" >&2
    exit 1
  fi
}

assert_package_paths() {
  local path
  for path in \
    "$PACKAGE_ROOT/server/dist" \
    "$PACKAGE_ROOT/server/package.json" \
    "$PACKAGE_ROOT/server/package-lock.json" \
    "$STATIC_SERVER" \
    "$UI_ROOT"; do
    [[ -e "$path" ]] || { echo "Required package path missing: $path" >&2; exit 1; }
  done
}

sync_runtime_server() {
  assert_path_within_runtime "$SERVER_RUNTIME_DIR"
  assert_path_within_runtime "$SERVER_RUNTIME_DIR/dist"
  rm -rf "$SERVER_RUNTIME_DIR/dist"
  mkdir -p "$SERVER_RUNTIME_DIR"
  cp -R "$PACKAGE_ROOT/server/dist" "$SERVER_RUNTIME_DIR/dist"
  cp "$PACKAGE_ROOT/server/package.json" "$SERVER_RUNTIME_DIR/package.json"
  cp "$PACKAGE_ROOT/server/package-lock.json" "$SERVER_RUNTIME_DIR/package-lock.json"
}

ensure_server_dependencies() {
  if [[ -d "$SERVER_NODE_MODULES_SOURCE" ]]; then
    rm -rf "$SERVER_RUNTIME_DIR/node_modules"
    cp -R "$SERVER_NODE_MODULES_SOURCE" "$SERVER_RUNTIME_DIR/node_modules"
    return 0
  fi
  if [[ "$SKIP_RUNTIME_NPM_INSTALL" == "1" ]]; then
    echo "Packaged node_modules source missing and runtime npm install disabled." >&2
    exit 1
  fi
  if [[ ! -d "$SERVER_RUNTIME_DIR/node_modules" ]]; then
    npm --prefix "$SERVER_RUNTIME_DIR" ci --omit=dev
  fi
}

health_ok() {
  local body
  body="$(curl -fsS "$HEALTH_URL" 2>/dev/null || true)"
  [[ "$body" == *'"status":"ok"'* ]] || [[ "$body" == *'"status": "ok"'* ]]
}

ui_head_ok() {
  local code
  code="$(curl -sS -I -o /dev/null -w '%{http_code}' "$UI_URL/" 2>/dev/null || true)"
  [[ "$code" == "200" ]]
}

wait_for_backend_health() {
  local deadline
  deadline=$((SECONDS + 45))
  while (( SECONDS < deadline )); do
    health_ok && return 0
    sleep 1
  done
  return 1
}

wait_for_ui_head() {
  local deadline
  deadline=$((SECONDS + 45))
  while (( SECONDS < deadline )); do
    ui_head_ok && return 0
    sleep 1
  done
  return 1
}

write_lock() {
  local backend_pid="$1" ui_pid="$2"
  cat > "$LOCK_FILE" <<LOCK
backend_pid=$backend_pid
ui_pid=$ui_pid
ui_url=$UI_URL
health_url=$HEALTH_URL
runtime_root=$RUNTIME_ROOT
package_root=$PACKAGE_ROOT
LOCK
}

start_flow() {
  ensure_dirs
  assert_package_paths

  local existing_backend existing_ui
  existing_backend="$(backend_running_pid || true)"
  existing_ui="$(ui_running_pid || true)"
  if [[ -n "$existing_backend" || -n "$existing_ui" ]]; then
    echo "Prototype already running backend=${existing_backend:-unknown} ui=${existing_ui:-unknown}" >&2
    exit 1
  fi

  assert_port_free "$API_PORT"
  assert_port_free "$UI_PORT"
  clear_state_files
  sync_runtime_server
  ensure_server_dependencies

  local stamp backend_out backend_err ui_out ui_err backend_pid ui_pid
  stamp="$(date -u +%Y%m%d-%H%M%S)"
  backend_out="$LOGS_DIR/backend-$stamp-out.log"; backend_err="$LOGS_DIR/backend-$stamp-err.log"
  ui_out="$LOGS_DIR/static-ui-$stamp-out.log"; ui_err="$LOGS_DIR/static-ui-$stamp-err.log"

  (
    cd "$SERVER_RUNTIME_DIR"
    HOST="$API_HOST" PORT="$API_PORT" NODE_ENV=production \
      EDELPHI_DATA_DIR="$DB_DIR" EDELPHI_AUDIT_DIR="$AUDIT_DIR" EDELPHI_BACKUP_DIR="$BACKUPS_DIR" \
      EDELPHI_ALLOWED_ORIGINS="$UI_URL" \
      "$NodeCommand" "$SERVER_ENTRY" >>"$backend_out" 2>>"$backend_err" &
    child_pid=$!
    echo "$child_pid" > "$BACKEND_PID_FILE"
    disown "$child_pid" 2>/dev/null || true
  )
  backend_pid="$(read_pid_file "$BACKEND_PID_FILE")"

  (
    cd "$PACKAGE_ROOT"
    "$NodeCommand" "$STATIC_SERVER" --root "$UI_ROOT" --host "$UI_HOST" --port "$UI_PORT" >>"$ui_out" 2>>"$ui_err" &
    child_pid=$!
    echo "$child_pid" > "$UI_PID_FILE"
    disown "$child_pid" 2>/dev/null || true
  )
  ui_pid="$(read_pid_file "$UI_PID_FILE")"

  if [[ -z "$backend_pid" || -z "$ui_pid" ]]; then
    stop_if_running
    echo "Failed to capture backend or UI process pid." >&2
    exit 1
  fi

  write_lock "$backend_pid" "$ui_pid"

  if ! wait_for_backend_health; then
    stop_if_running
    echo "Backend did not become healthy at $HEALTH_URL" >&2
    exit 1
  fi

  if ! wait_for_ui_head; then
    stop_if_running
    echo "UI did not return HTTP 200 at $UI_URL/" >&2
    exit 1
  fi

  local verified_backend verified_ui
  verified_backend="$(backend_running_pid || true)"
  verified_ui="$(ui_running_pid || true)"
  if [[ -z "$verified_backend" || -z "$verified_ui" ]]; then
    stop_if_running
    echo "Started services did not match expected long-lived Node listener processes." >&2
    exit 1
  fi

  write_lock "$verified_backend" "$verified_ui"
  write_evidence "Started portable prototype backendPid=$verified_backend uiPid=$verified_ui"
  echo "Operator UI: $UI_URL"
  echo "Operator localhost URL (default, safe): $UI_URL"
  if [[ "$LAN_PARTICIPANT_MODE" == "1" ]]; then
    if [[ "$LAN_ACKNOWLEDGED" != "1" ]]; then
      stop_if_running
      echo "LAN participant mode requires explicit acknowledgement. Re-run with EDELPHI_ACK_LAN_SYNTHETIC_ONLY=1." >&2
      exit 1
    fi
    local lan_ip
    lan_ip="$(get_primary_lan_ip)"
    if [[ -n "$lan_ip" ]]; then
      echo "Participant LAN URL (synthetic/internal testing only): http://$lan_ip:$UI_PORT$PARTICIPANT_PATH"
      echo "WARNING: Internal synthetic testing only. Do not use for production, pilot, or human-subjects claims."
    else
      echo "LAN participant mode enabled but no LAN IP detected; participant LAN URL unavailable."
    fi
  fi
  if [[ "$TUNNEL_MODE" == "1" ]]; then
    echo "WARNING: Tunnel mode flag is ON, but tunnel support is intentionally not provisioned in package runtime."
    echo "WARNING: Keep tunnel OFF by default; do not expose participant traffic to public internet."
  fi
  echo "Health check: $HEALTH_URL"
}

status_flow() {
  ensure_dirs
  local bpid upid
  bpid="$(backend_running_pid || true)"
  upid="$(ui_running_pid || true)"
  if [[ -n "$bpid" && -n "$upid" ]] && health_ok && ui_head_ok; then
    echo "running backend=$bpid ui=$upid"
    return 0
  fi

  if [[ -z "$bpid" && -z "$upid" ]]; then
    echo "stopped"
    return 0
  fi

  echo "degraded backend=${bpid:-stopped} ui=${upid:-stopped}" >&2
  return 1
}

smoke_flow() {
  ensure_dirs
  if ! health_ok; then
    echo "smoke failed: backend health did not return ok at $HEALTH_URL" >&2
    exit 1
  fi
  if ! ui_head_ok; then
    echo "smoke failed: UI did not return HTTP 200 at $UI_URL/" >&2
    exit 1
  fi
  write_evidence "Smoke check passed for backend health and UI HTTP 200."
  echo "smoke ok: backend health ok; UI HTTP 200 (internal engineering evidence only)"
}

backup_flow() {
  ensure_dirs
  local dest
  dest="$BACKUPS_DIR/backup-$(date -u +%Y%m%d-%H%M%S)"
  assert_path_within_runtime "$dest"
  mkdir -p "$dest"
  cp -R "$DB_DIR" "$AUDIT_DIR" "$EXPORTS_DIR" "$dest/" 2>/dev/null || true
  write_evidence "Backup completed at $dest"
  echo "Backup: $dest"
}

clear_runtime_dir_contents() {
  local dir="$1"
  mkdir -p "$dir"
  assert_path_within_runtime "$dir"
  find "$dir" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
}

reset_flow() {
  ensure_dirs
  local bpid upid snapshot
  bpid="$(backend_running_pid || true)"
  upid="$(ui_running_pid || true)"
  if [[ -n "$bpid" || -n "$upid" ]]; then
    echo "Refusing reset while running. Run stop first." >&2
    exit 1
  fi

  snapshot="$BACKUPS_DIR/reset-snapshot-$(date -u +%Y%m%d-%H%M%S)"
  assert_path_within_runtime "$snapshot"
  mkdir -p "$snapshot"
  cp -R "$DB_DIR" "$AUDIT_DIR" "$EXPORTS_DIR" "$LOGS_DIR" "$EVIDENCE_DIR" "$snapshot/" 2>/dev/null || true
  clear_runtime_dir_contents "$DB_DIR"
  clear_runtime_dir_contents "$AUDIT_DIR"
  clear_runtime_dir_contents "$EXPORTS_DIR"
  clear_runtime_dir_contents "$LOGS_DIR"
  clear_runtime_dir_contents "$EVIDENCE_DIR"
  clear_state_files
  write_evidence "Reset completed with snapshot $snapshot"
  echo "Reset complete. Snapshot: $snapshot"
}

restore_flow() {
  ensure_dirs
  local src="${2:-}"
  if [[ -z "$src" ]]; then
    src="$(ls -1dt "$BACKUPS_DIR"/backup-* 2>/dev/null | head -n 1 || true)"
  fi
  [[ -n "$src" && -d "$src" ]] || { echo "No backup found to restore." >&2; exit 1; }
  clear_runtime_dir_contents "$DB_DIR"; clear_runtime_dir_contents "$AUDIT_DIR"; clear_runtime_dir_contents "$EXPORTS_DIR"
  cp -R "$src/"* "$RUNTIME_ROOT/" 2>/dev/null || true
  write_evidence "Restore completed from $src"
  echo "Restore complete: $src"
}

uninstall_flow() {
  ensure_dirs
  stop_if_running
  echo "Uninstall is manual for internal package candidates."
  echo "Remove /Applications/Delphi Commons and optionally remove runtime data at: $RUNTIME_ROOT"
  write_evidence "Uninstall guidance shown"
}

case "$COMMAND" in
  status) status_flow ;;
  start) start_flow ;;
  stop) ensure_dirs; stop_if_running; write_evidence "Stopped portable prototype"; echo "stopped" ;;
  restart) ensure_dirs; stop_if_running; start_flow ;;
  smoke) smoke_flow ;;
  backup) backup_flow ;;
  restore) restore_flow "$@" ;;
  reset) reset_flow ;;
  uninstall) uninstall_flow ;;
esac
