import { validatePackageConfig } from '../core/index.mjs';

export function buildWindowsAdapterConfig(label = 'windows-portable-candidate') {
  return validatePackageConfig({
    label,
    track: 'human_testing_candidate',
    platform: 'windows',
    archiveFormat: 'zip',
    runtimeRootConvention: '%LOCALAPPDATA%/DelphiCommons/windows-operator-portable-candidate',
    processControl: 'powershell start/stop script wrapper',
    shellErgonomics: 'PowerShell',
    networkBindAddress: '127.0.0.1'
  });
}
