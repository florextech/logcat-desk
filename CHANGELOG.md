# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and versioning is intended to follow Semantic Versioning.

## [0.2.0] - 2026-04-05

### Added

- Pending

### Changed

- Pending

### Fixed

- Pending

### Documentation

- Pending

### CI

- Pending

### Notes

- Replace placeholders with the final release notes before merging.

## [0.1.1] - 2026-04-01

### Added

- Added `Clear logs` action next to `Stop` / `Pause` to wipe the visible console output instantly.
- Added smart log navigation with a floating `Jump to latest log` action when the user is not at the bottom.
- Added update-check flow from the app (`Actions` modal) with GitHub latest-release lookup and direct release-page open.
- Added automatic ADB discovery in common install paths (including Homebrew and Android SDK defaults), beyond PATH/env lookup.
- Added auto-persist of detected ADB binary path so users do not need to configure it manually on first run.

### Changed

- Changed auto-scroll behavior to follow new logs only when the user is already at the bottom.
- Changed update dialogs to use fully localized labels/messages for available, up-to-date, and failure states.
- Changed update-check timeout behavior to fail fast with an explicit user-facing message when the network hangs.
- Changed semantic-version parsing in update checks to strictly require `major.minor.patch`.

### Fixed

- Fixed log browsing UX regression where auto-scroll forced users back to the latest line while reviewing old logs.
- Fixed duplicate update-check error surfaces by keeping update failure feedback in a single native dialog path.
- Fixed semantic-version edge cases (for example `1.2.3.4` and empty segments like `1..3`) that could produce invalid comparisons.
- Fixed coverage regressions by adding tests for update-dialog branches, timeout/error flows, and semver validation.

### Documentation

- Added README app preview section and screenshots for live log view and empty state.
- Updated maintainer-facing release/distribution documentation and CI/CD process notes.

### CI

- Updated GitHub Actions dependencies (`actions/labeler`, `create-pull-request`, `upload-artifact`, `checkout`, `stale`).
- Improved release/CI workflows for packaging and distribution checks.

### Notes

- Update checks require internet access to GitHub Releases API.
- Auto-detected ADB path can still be overridden manually from Settings if needed.

## Release entry template

Each release should document changes with the sections below:

- `Added`
- `Changed`
- `Fixed`
- `Documentation`
- `CI`
- `Notes`

## [0.1.0] - 2026-03-27

### Added

- Electron + TypeScript desktop app structure
- Secure `main` / `preload` / `renderer` split
- Real-time `adb logcat` streaming without Android Studio dependency
- Device discovery via `adb devices -l`
- Device selection, pause/resume, clear view, and clear logcat buffer
- Text, tag, package-text, search-highlight, and level filters
- Export visible logs to `.txt` and full captured logs to `.log`
- Local settings persistence for adb path, filters, locale, and selected device
- English and Spanish UI support
- Test suite with coverage thresholds and CI workflows
- Open source contribution, support, security, and issue/PR templates
- Branding assets, release workflows, and repository governance docs

### Documentation

- Added contributor-facing documentation for support, security, roadmap, and release process

### CI

- Added CI validation, macOS packaging smoke checks, release drafting, and release PR preparation workflows

### Notes

- macOS packaging is configured through `electron-builder`
- release artifacts currently support unsigned macOS packaging out of the box

