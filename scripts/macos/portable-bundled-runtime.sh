#!/usr/bin/env bash
set -euo pipefail
if [[ "$#" -eq 0 ]]; then
  set -- start
fi
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
export EDELPHI_PORTABLE_NODE_EXE="$PACKAGE_ROOT/runtime/node/bin/node"
export EDELPHI_SERVER_NODE_MODULES_SOURCE="$PACKAGE_ROOT/server/node_modules"
export EDELPHI_SKIP_RUNTIME_NPM_INSTALL=1
exec "$PACKAGE_ROOT/scripts/macos/portable-operator-candidate.sh" "$@"
