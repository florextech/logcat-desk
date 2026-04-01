# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and versioning is intended to follow Semantic Versioning.

## [0.1.1] - 2026-04-01

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

