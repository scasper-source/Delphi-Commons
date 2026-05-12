#!/usr/bin/env bash
set -euo pipefail

LABEL="${1:-macos-operator-portable-prototype}"
OUTPUT_ROOT="${2:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [[ -z "$OUTPUT_ROOT" ]]; then
  OUTPUT_ROOT="$REPO_ROOT/build/macos-operator-portable"
fi

OUTPUT_ROOT="$(cd "$(dirname "$OUTPUT_ROOT")" && pwd)/$(basename "$OUTPUT_ROOT")"
mkdir -p "$OUTPUT_ROOT"

assert_within() {
  local candidate root
  candidate="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"
  root="$(cd "$2" && pwd)"
  case "$candidate" in
    "$root"/*|"$root") ;;
    *) echo "Refusing unsafe path operation outside output root. candidate=$candidate root=$root" >&2; exit 1 ;;
  esac
}

pushd "$REPO_ROOT" >/dev/null
npm --prefix app run build
npm --prefix server run build

branch="$(git rev-parse --abbrev-ref HEAD)"
commit_hash="$(git rev-parse HEAD)"
build_stamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
package_stamp="$(date -u +%Y%m%d-%H%M%S)"
package_name="${LABEL}-${package_stamp}"

stage_root="$OUTPUT_ROOT/staging"
assert_within "$stage_root" "$OUTPUT_ROOT"
rm -rf "$stage_root"
mkdir -p "$stage_root"

package_root="$stage_root/$package_name"
mkdir -p "$package_root/app" "$package_root/server" "$package_root/scripts/macos" "$package_root/tools"

required_paths=(
  "app/dist"
  "server/dist"
  "server/package.json"
  "server/package-lock.json"
  "scripts/macos/portable-operator-candidate.sh"
  "scripts/windows/static-file-server.mjs"
  "LICENSE"
  "NOTICE"
)
for relative_path in "${required_paths[@]}"; do
  [[ -e "$REPO_ROOT/$relative_path" ]] || { echo "Required path missing for packaging: $relative_path" >&2; exit 1; }
done

cp -R "$REPO_ROOT/app/dist" "$package_root/app/"
cp -R "$REPO_ROOT/server/dist" "$package_root/server/"
cp "$REPO_ROOT/server/package.json" "$package_root/server/package.json"
cp "$REPO_ROOT/server/package-lock.json" "$package_root/server/package-lock.json"
cp "$REPO_ROOT/scripts/macos/portable-operator-candidate.sh" "$package_root/scripts/macos/portable-operator-candidate.sh"
chmod +x "$package_root/scripts/macos/portable-operator-candidate.sh"
cp "$REPO_ROOT/scripts/windows/static-file-server.mjs" "$package_root/tools/static-file-server.mjs"
cp "$REPO_ROOT/LICENSE" "$package_root/LICENSE"
cp "$REPO_ROOT/NOTICE" "$package_root/NOTICE"

cat > "$package_root/README.txt" <<'README_EOF'
# macOS Operator Portable Package Prototype

Status: MACOS PORTABLE PACKAGE PROTOTYPE / NOT RUN
Decision label: NOT READY FOR HUMAN TESTING

This package is an internal Phase 2 prototype for the `human_testing_candidate` track.

## Run (on macOS)

1. Install local Node.js + npm.
2. Extract this archive.
3. In Terminal from package root:

```bash
./scripts/macos/portable-operator-candidate.sh start
```

## Runtime and data policy

- Runtime data root: `~/Library/Application Support/DelphiCommons/macos-operator-portable-candidate`
- Runtime state remains outside the package root.

## Limitations

- No `.app`, `.pkg`, `.dmg`, signing, notarization, updater, or enterprise distribution.
- No production/pilot/human-subject readiness.
- macOS evidence is NOT RUN until tested on a real Mac.
- Local Node/npm prerequisite currently remains.
README_EOF

included_list="$(cd "$package_root" && find . -mindepth 1 | sed 's#^./##' | sort)"
manifest_path="$package_root/package-manifest.json"
cat > "$manifest_path" <<MANIFEST_EOF
{
  "packageLabel": "$LABEL",
  "packageName": "$package_name",
  "track": "human_testing_candidate",
  "buildTimestampUtc": "$build_stamp",
  "branch": "$branch",
  "commitHash": "$commit_hash",
  "buildMachine": "$(hostname)",
  "buildOs": "$(uname -srm)",
  "runtimeDataPath": "~/Library/Application Support/DelphiCommons/macos-operator-portable-candidate",
  "requiredExternalDependencies": [
    "Node.js + npm on local macOS machine",
    "bash"
  ],
  "explicitLimitations": [
    "Portable Node runtime not bundled in this macOS prototype package.",
    "No .app/.pkg/.dmg, signing, notarization, updater, or enterprise distribution.",
    "macOS evidence remains NOT RUN until tested on real Mac hardware."
  ],
  "explicitNonClaims": [
    "Not production-ready.",
    "Not pilot-ready.",
    "Not real human-subjects ready.",
    "No macOS support readiness claim."
  ],
  "includedFilesAndDirectories": [
$(printf '%s
' "$included_list" | sed 's#^#    "#; s#$#",#' | sed '$ s/,$//')
  ]
}
MANIFEST_EOF

archive_path="$OUTPUT_ROOT/${package_name}.tar.gz"
assert_within "$archive_path" "$OUTPUT_ROOT"
rm -f "$archive_path"

tar -C "$stage_root" -czf "$archive_path" "$package_name"

echo "Package root: $package_root"
echo "Package archive: $archive_path"
echo "Manifest: $manifest_path"
popd >/dev/null
