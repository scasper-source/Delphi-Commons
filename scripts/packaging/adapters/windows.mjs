import { validatePackageConfig } from '../core/index.mjs';

export function buildWindowsAdapterConfig(label = 'windows-portable-bundled-runtime-internal') {
  return validatePackageConfig({
    label,
    track: 'internal_testing',
    platform: 'windows',
    arch: 'x64',
    archiveFormat: 'zip',
    runtimeRootConvention: '%LOCALAPPDATA%/DelphiCommons/windows-portable-bundled-runtime-internal',
    processControl: 'powershell thin adapter over node packaging core',
    shellErgonomics: 'PowerShell',
    networkBindAddress: '127.0.0.1'
  });
}
