# Code Signing Policy

eDelphi (Delphi Commons) release artifacts are signed to ensure authenticity and integrity. This document describes the signing process and roles.

## Signing Authority

All release signing is performed by the project maintainer:

- **Author, Reviewer, Approver:** Stephen T. Casper

## Security Controls

- Multi-factor authentication is required on all accounts with commit or signing access (GitHub, SignPath).
- Only tagged releases from the `main` branch are eligible for signing.
- Signed artifacts are produced through CI automation; no local signing occurs.

## Certificate Provider

Release binaries are signed using a certificate provided by [SignPath Foundation](https://signpath.org), a free code signing service for open-source projects.

## Scope

The following artifacts are signed when produced:

- Windows installer (`.exe` / `.msi`)
- Portable Windows executable (`.exe`)

## Verification

Users can verify signatures using Windows' built-in properties dialog (right-click the file, select Properties, then the Digital Signatures tab).

## Contact

For questions about code signing or release integrity, open an issue on the [GitHub repository](https://github.com/scasper-source/Delphi-Commons).
