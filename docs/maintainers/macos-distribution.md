# macOS Distribution Setup

This project can build unsigned macOS artifacts out of the box. For serious distribution, configure code signing and notarization in GitHub Actions.

## What you need

- An Apple Developer account
- A `Developer ID Application` certificate exported as `.p12`
- An App Store Connect API key (`.p8`) for notarization
- A GitHub `production` environment, or repository secrets with the names below

## Required GitHub secrets

- `CSC_LINK`
  Use the base64-encoded contents of the exported `.p12` certificate.
- `CSC_KEY_PASSWORD`
  Password used when exporting the `.p12`.
- `APPLE_API_KEY_ID`
  Key ID from App Store Connect.
- `APPLE_API_ISSUER`
  Issuer ID from App Store Connect.
- `APPLE_API_KEY_CONTENT`
  Full contents of the `.p8` file.

The release workflow will:

- sign the app when `CSC_LINK` and `CSC_KEY_PASSWORD` are present
- notarize the app when all `APPLE_API_*` secrets are present
- fall back to unsigned artifacts if any required secret is missing

## Export the certificate

1. Open Keychain Access on macOS.
2. Find your `Developer ID Application` certificate.
3. Export it as `.p12`.
4. Convert it to base64:

```bash
base64 -i "Developer ID Application.p12" | pbcopy
```

Paste the copied value into the `CSC_LINK` secret.

## Create the App Store Connect API key

1. In App Store Connect, create an API key with access suitable for notarization.
2. Download the `.p8` once and store it safely.
3. Save:
   - the key id into `APPLE_API_KEY_ID`
   - the issuer id into `APPLE_API_ISSUER`
   - the full file contents into `APPLE_API_KEY_CONTENT`

## Recommended GitHub setup

- create a `production` environment in GitHub
- add the secrets there instead of at repository scope
- optionally require approval before the `Release` workflow can use that environment

## Release behavior

- When secrets are configured, the `Release` workflow builds signed and notarized `.zip` and `.dmg` artifacts.
- When secrets are missing, the same workflow still produces unsigned artifacts so releases are not blocked during setup.

## First signed release checklist

1. Configure the secrets.
2. Run `Prepare Release PR`.
3. Merge after `Validate` and `macOS Package Smoke` pass.
4. Tag the release, for example `v0.2.0`.
5. Confirm the `Release` workflow completed without notarization errors.
