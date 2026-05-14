# ADR: Portable Bundled Runtime for Internal Human-Testing Candidate

- Date: 2026-05-14
- Status: Accepted (Phase 2 packaging hardening foundation)

## Context

Phase 2 currently supports internal engineering portable package prototypes that require local Node/npm. We need a modular packaging foundation for future portable bundled-runtime packages without claiming bundled-runtime readiness yet.

## Decision

Create shared packaging architecture under `scripts/packaging` with a strict boundary:

- **Shared core owns** typed/validated package config, pinned runtime metadata schema, manifest schema, centralized path handling, inventory generation, SHA256 checksums, forbidden-material scan, overclaim scan, runtime path policy enforcement, and evidence-template generation.
- **Platform adapters remain thin** and own only archive format, runtime-root convention, process start/stop mechanics, and shell ergonomics.

## Guardrails

- No Windows/macOS bundled runtime package builds in this phase.
- No runtime download behavior added.
- Local Node/npm prerequisite posture remains accepted until bundled-runtime evidence is recorded.
- Default bind remains `127.0.0.1`.
- Package root remains immutable; runtime data root remains external and mutable.
- No installer/Tauri/updater/signing/notarization/platform support claims.

## Consequences

- Enables deterministic manifest and evidence controls before platform packaging migration.
- Reduces duplication risk between Windows/macOS packaging scripts.
- Creates explicit evidence boundary: bundled runtime is deferred until future packet with real packaged runtime proof.
