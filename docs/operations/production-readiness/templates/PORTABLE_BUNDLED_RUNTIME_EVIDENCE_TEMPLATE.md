# Portable Bundled Runtime Evidence Template (Internal Human-Testing Candidate)

Status: template only; does not claim bundled runtime readiness by itself.

- Date:
- Platform:
- Package label:
- Commit hash:
- Build host:

## Required Evidence

- Runtime metadata generated from pinned schema (`scripts/packaging/core`).
- Manifest generated and validated.
- Inventory + SHA256 checksums attached.
- Forbidden-material scan output attached.
- Overclaim scan output attached.
- Runtime path policy verification attached (runtime root external to package root).
- Build-time Node/npm requirement recorded.
- Packaged runtime executable path recorded.
- Runtime no-local-Node expectation recorded.
- npm included / npm used-at-runtime fields recorded.
- Lifecycle table preserved as `NOT RUN` until executed from the package.

## Windows Bundled-Runtime Fields

- Node version:
- npm version if included:
- Platform/arch:
- Runtime source:
- Runtime SHA256:
- Runtime license:
- Bundled runtime location:
- npm included:
- npm used at runtime:
- Production server dependencies staged during build:

## Explicit Boundaries

- Until this template is executed with attached artifacts, package lifecycle evidence remains `NOT RUN`.
- Build-time local Node/npm requirements are separate from runtime package behavior.
- No installer/signing/notarization/platform support claim is made.
- Local phone/SMS testing posture is synthetic/internal only; no real SMS provider readiness is claimed.
- Default network posture remains localhost-only (`127.0.0.1`) unless an explicit LAN test mode flag is enabled.
- If LAN participant URL mode is used, record operator acknowledgement evidence and avoid storing LAN/tunnel endpoints in retained artifacts.
- Tunnel/public internet exposure must remain disabled by default and is not packaged as a production-ready feature.
