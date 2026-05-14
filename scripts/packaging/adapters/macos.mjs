import { validatePackageConfig } from '../core/index.mjs';

export function buildMacosAdapterConfig(label = 'macos-portable-candidate') {
  return validatePackageConfig({
    label,
    track: 'human_testing_candidate',
    platform: 'macos',
    archiveFormat: 'tar.gz',
    runtimeRootConvention: '~/Library/Application Support/DelphiCommons/macos-operator-portable-candidate',
    processControl: 'bash start/stop script wrapper',
    shellErgonomics: 'bash',
    networkBindAddress: '127.0.0.1'
  });
}
