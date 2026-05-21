import path from 'node:path';
import { buildChecksums, generateInventory } from './index.mjs';
import { verifyPackageEvidence } from './verification.mjs';

export function stageServerProductionDependencies({
  repoRoot,
  productionDepsRoot,
  npmCommand,
  run,
  copyPath
}) {
  copyPath(path.join(repoRoot, 'server/package.json'), path.join(productionDepsRoot, 'package.json'));
  copyPath(path.join(repoRoot, 'server/package-lock.json'), path.join(productionDepsRoot, 'package-lock.json'));
  run(npmCommand, ['--prefix', productionDepsRoot, 'ci', '--omit=dev'], repoRoot);
  return path.join(productionDepsRoot, 'node_modules');
}

export function copyCommonPortablePayload({ repoRoot, packageRoot, productionNodeModules, copyPath }) {
  copyPath(path.join(repoRoot, 'app/dist'), path.join(packageRoot, 'app/dist'));
  copyPath(path.join(repoRoot, 'server/dist'), path.join(packageRoot, 'server/dist'));
  copyPath(path.join(repoRoot, 'server/package.json'), path.join(packageRoot, 'server/package.json'));
  copyPath(path.join(repoRoot, 'server/package-lock.json'), path.join(packageRoot, 'server/package-lock.json'));
  copyPath(productionNodeModules, path.join(packageRoot, 'server/node_modules'));
  copyPath(path.join(repoRoot, 'scripts/windows/static-file-server.mjs'), path.join(packageRoot, 'tools/static-file-server.mjs'));
  copyPath(path.join(repoRoot, 'LICENSE'), path.join(packageRoot, 'LICENSE'));
  copyPath(path.join(repoRoot, 'NOTICE'), path.join(packageRoot, 'NOTICE'));
}

export function buildInventoryAndChecksums(packageRoot) {
  const inventory = generateInventory(packageRoot).filter((item) => item !== 'package-manifest.json');
  const checksums = buildChecksums(packageRoot, inventory);
  return { inventory, checksums };
}

export function verifyPortablePackage({ packageRoot, runtimeRoot, overclaimFiles = ['README.txt', 'evidence-template.md', 'package-manifest.json'] }) {
  return verifyPackageEvidence({ packageRoot, runtimeRoot, overclaimFiles });
}
