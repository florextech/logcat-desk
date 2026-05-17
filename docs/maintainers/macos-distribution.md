# macOS Distribution Setup

This project uses Electron + `electron-builder` and supports full macOS Developer ID signing, notarization, and stapling.

## What you need

- An Apple Developer account
- A `Developer ID Application` certificate exported as `.p12`
- Apple ID credentials with an app-specific password
- Apple Team ID
- A GitHub `production` environment, or repository secrets with the names below

## Required GitHub secrets

- `CSC_LINK`
  Use the base64-encoded contents of the exported `.p12` certificate.
- `CSC_KEY_PASSWORD`
  Password used when exporting the `.p12`.
- `APPLE_ID`
  Apple ID email used for notarization.
- `APPLE_APP_SPECIFIC_PASSWORD`
  App-specific password generated for the Apple ID.
- `APPLE_TEAM_ID`
  Team ID from Apple Developer account.

The release workflow will:

- sign the app when `CSC_LINK` and `CSC_KEY_PASSWORD` are present
- notarize the app when `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` are present
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

## Create an app-specific password

1. Sign in to [appleid.apple.com](https://appleid.apple.com).
2. Open **Sign-In and Security**.
3. Create an **App-Specific Password** (for example `logcat-desk-notarize`).
4. Save it in `APPLE_APP_SPECIFIC_PASSWORD`.

## Find your Team ID

1. Sign in to [developer.apple.com/account](https://developer.apple.com/account).
2. Open Membership details.
3. Copy the Team ID and save it in `APPLE_TEAM_ID`.

## Local signed build

Set environment variables without hardcoding credentials:

```bash
export CSC_LINK="<base64-p12>"
export CSC_KEY_PASSWORD="<p12-password>"
export APPLE_ID="<apple-id-email>"
export APPLE_APP_SPECIFIC_PASSWORD="<app-specific-password>"
export APPLE_TEAM_ID="<team-id>"
npm run dist:mac
```

## Verification commands

Use these commands to verify a signed app extracted from the built artifact:

```bash
codesign --verify --deep --strict --verbose=2 "/Applications/Logcat Desk.app"
spctl --assess --type execute --verbose=4 "/Applications/Logcat Desk.app"
xcrun stapler validate "release/Logcat Desk-<version>-arm64.dmg"
```

## Recommended GitHub setup

- create a `production` environment in GitHub
- add the secrets there instead of at repository scope
- optionally require approval before the `Release` workflow can use that environment

## Release behavior

- When secrets are configured, the `Release` workflow builds signed and notarized `.zip` and `.dmg` artifacts, then staples the `.dmg`.
- When secrets are missing, the same workflow still produces unsigned artifacts so releases are not blocked during setup.

## Temporary testing workaround for unsigned builds

If you need to test an unsigned build locally before signing and notarization are in place, macOS quarantine can be removed for a trusted app bundle:

```bash
xattr -dr com.apple.quarantine "/Applications/Logcat Desk.app"
```

Use this only for trusted local testing. Do not treat it as a substitute for proper Apple signing and notarization.

## First signed release checklist

1. Configure the secrets.
2. Run `Prepare Release PR`.
3. Merge after `Validate` and `macOS Package Smoke` pass.
4. Tag the release, for example `v0.2.0`.
5. Confirm the `Release` workflow completed without notarization errors.
