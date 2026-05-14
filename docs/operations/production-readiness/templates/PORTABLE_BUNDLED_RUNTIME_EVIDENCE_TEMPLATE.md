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

## Explicit Boundaries

- Until this template is executed with attached artifacts, local Node/npm prerequisite posture remains in effect.
- No installer/signing/notarization/platform support claim is made.
