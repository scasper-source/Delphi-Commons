# ADR: Portable Bundled Runtime for Internal Human-Testing Candidate

- Date: 2026-05-14
- Status: Accepted; Windows implementation hardening in progress

## Context

Phase 2 supports internal engineering portable package prototypes that initially required local Node/npm at runtime. The shared packaging foundation now supports the next Windows hardening step: stage a pinned Windows Node executable and build-time production dependencies so lifecycle commands can run without ambient Node/npm after the package is built. This remains implementation hardening until package build, verification, and lifecycle evidence exist.

## Decision

Create shared packaging architecture under `scripts/packaging` with a strict boundary:

- **Shared core owns** typed/validated package config, pinned runtime metadata schema, manifest schema, centralized path handling, inventory generation, SHA256 checksums, forbidden-material scan, overclaim scan, runtime path policy enforcement, and evidence-template generation.
- **Platform adapters remain thin** and own only archive format, runtime-root convention, process start/stop mechanics, and shell ergonomics.
- **Windows bundled-runtime hardening** may download or consume an ADR-pinned Node archive, verify its SHA256, stage only the runtime executable/license needed by the package, and stage production server dependencies created during package build.

## Guardrails

- Local Node/npm remain build-time prerequisites.
- Runtime no-local-Node behavior is not evidence until a named package is built, verified, and run from the extracted package or clean profile.
- npm is not staged into the Windows runtime and is not used by lifecycle commands unless a later ADR changes that decision.
- Default bind remains `127.0.0.1`.
- Package root remains immutable; runtime data root remains external and mutable.
- No installer/Tauri/updater/signing/notarization/platform support claims.

## Consequences

- Enables deterministic manifest and evidence controls before platform packaging migration.
- Reduces duplication risk between Windows/macOS packaging scripts.
- Creates explicit evidence boundary: bundled runtime implementation may proceed, but gate closure still depends on real packaged-runtime proof.
