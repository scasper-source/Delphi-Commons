import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const portableWrapperPath = path.join(repoRoot, 'scripts/macos/portable-bundled-runtime.sh');
const lifecyclePath = path.join(repoRoot, 'scripts/macos/portable-operator-candidate.sh');
const installerPackagerPath = path.join(repoRoot, 'scripts/packaging/macos-installer.mjs');
const portablePackagerPath = path.join(repoRoot, 'scripts/packaging/macos-portable.mjs');

const read = (file) => fs.readFileSync(file, 'utf8');

test('macOS normal wrappers default to start, not status', () => {
  assert.match(read(portableWrapperPath), /set -- start/);
  assert.doesNotMatch(read(portableWrapperPath), /set -- status/);
  assert.match(read(installerPackagerPath), /set -- start/);
  assert.doesNotMatch(read(installerPackagerPath), /set -- status/);
});

test('macOS lifecycle cleans up if browser open fails after services start', () => {
  const lifecycle = read(lifecyclePath);
  assert.match(lifecycle, /open_operator_browser\(\)/);
  assert.match(lifecycle, /if ! open_operator_browser; then\n\s*stop_if_running/);
  assert.match(lifecycle, /not left running invisibly/);
});

test('macOS bundled README keeps browser fallback before shutdown limitation and avoids normal Stop\/Status shortcuts', () => {
  const packager = read(portablePackagerPath);
  const fallback = packager.indexOf('If the browser does not show Delphi Commons, open http://127.0.0.1:4173 manually');
  const ending = packager.indexOf('Ending the run:');
  assert.notEqual(fallback, -1);
  assert.notEqual(ending, -1);
  assert.ok(fallback < ending, 'browser fallback must appear before final shutdown instructions');
  assert.match(packager, /NOT READY FOR HUMAN TESTING/);
  assert.match(packager, /not production-ready, not pilot-ready, not public-release-ready/);
  assert.doesNotMatch(packager, /not production-ready, pilot-ready/);
  assert.match(packager, /IMPLEMENTATION_REQUIRED \/ HUMAN_REQUIRED/);
  assert.match(packager, /Do not present Stop or Status as ordinary operator shortcuts/);
});
