import { validatePackageConfig } from '../core/index.mjs';

export function buildMacosAdapterConfig(label = 'macos-portable-bundled-runtime-internal') {
  return validatePackageConfig({
    label,
    track: 'internal_testing',
    platform: 'macos',
    arch: 'arm64',
    archiveFormat: 'tar.gz',
    runtimeRootConvention: '~/Library/Application Support/DelphiCommons/macos-portable-bundled-runtime-internal',
    processControl: 'bash thin adapter over node packaging core',
    shellErgonomics: 'bash',
    networkBindAddress: '127.0.0.1'
  });
}
