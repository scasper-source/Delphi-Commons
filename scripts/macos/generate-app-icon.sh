#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SRC="${1:-$REPO_ROOT/assets/macos/DelphiCommonsAppIcon.svg}"
OUT_DIR="${2:-$REPO_ROOT/build/macos-icon}"
ICONSET="$OUT_DIR/DelphiCommons.iconset"
ICNS="$OUT_DIR/DelphiCommons.icns"

if [[ ! -f "$SRC" ]]; then
  echo "Icon source not found: $SRC" >&2
  exit 1
fi

if ! command -v qlmanage >/dev/null 2>&1; then
  echo "qlmanage is required to render the SVG preview on macOS." >&2
  exit 1
fi

if ! command -v sips >/dev/null 2>&1; then
  echo "sips is required to resize icon PNGs on macOS." >&2
  exit 1
fi

if ! command -v iconutil >/dev/null 2>&1; then
  echo "iconutil is required to build the final .icns file on macOS." >&2
  exit 1
fi

rm -rf "$OUT_DIR"
mkdir -p "$ICONSET"

qlmanage -t -s 1024 -o "$OUT_DIR" "$SRC" >/dev/null 2>&1
RENDERED="$(find "$OUT_DIR" -maxdepth 1 -type f -name '*.png' | head -n 1)"
if [[ -z "$RENDERED" || ! -f "$RENDERED" ]]; then
  echo "SVG render failed; no PNG thumbnail was produced." >&2
  exit 1
fi

BASE_PNG="$OUT_DIR/DelphiCommonsAppIcon-1024.png"
cp "$RENDERED" "$BASE_PNG"

make_icon() {
  local size="$1"
  local name="$2"
  sips -z "$size" "$size" "$BASE_PNG" --out "$ICONSET/$name" >/dev/null
}

make_icon 16 "icon_16x16.png"
make_icon 32 "icon_16x16@2x.png"
make_icon 32 "icon_32x32.png"
make_icon 64 "icon_32x32@2x.png"
make_icon 128 "icon_128x128.png"
make_icon 256 "icon_128x128@2x.png"
make_icon 256 "icon_256x256.png"
make_icon 512 "icon_256x256@2x.png"
make_icon 512 "icon_512x512.png"
make_icon 1024 "icon_512x512@2x.png"

iconutil -c icns "$ICONSET" -o "$ICNS"
echo "Wrote $ICNS"
