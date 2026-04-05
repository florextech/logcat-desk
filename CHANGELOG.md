# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and versioning is intended to follow Semantic Versioning.

## [0.2.0] - 2026-04-05

### Added

- Added `GroupedLogConsole` component that visually groups consecutive logs by tag/severity for easier reading.
- Added log highlighting in `LogConsole` based on severity level (error, warning, info, debug, verbose).
- Added intelligent log analysis engine with deterministic rules (`log-analysis-engine`, `log-analysis-aggregator`, `log-analysis-rules`) that aggregates patterns and produces structured diagnostics.
- Added AI-powered analysis with multi-provider support: OpenAI, Anthropic Claude, Google Gemini, and OpenRouter.
- Added `Analysis` modal to display analysis results and AI-generated summaries.
- Added `Analysis Options` modal to configure analysis behavior before running.
- Added AI chat interface (`analysis-chat-modal`) for interactive follow-up questions about the analyzed logs.
- Added `AnalysisConfig` and `AIConfig` types in shared types for managing analysis and AI configuration.
- Added new Settings section for log analysis: enable/disable grouping, highlighting, select AI provider, model, and API key.
- Added `FloatingSelect` component for provider and model selection dropdowns.
- Added new IPC channels to bridge AI analysis requests and responses between main and renderer processes.
- Added `analysis-ai-service` in the main process to handle AI provider calls securely.
- Added user documentation: `ai-analysis.md`, `getting-started.md`, `settings.md`, `troubleshooting.md`, and `workflows.md`.
- Added comprehensive unit tests for log analysis engine, aggregator, rules, normalizer, grouping, highlighter, AI service, session manager lifecycle, and app/settings store.

### Changed

- Changed `LogConsole` to delegate grouped rendering to `GroupedLogConsole` when log grouping is enabled.
- Changed `CommandBar` to expose the analysis trigger action.
- Changed app store to manage `analysisConfig` and `aiConfig` state slices.
- Changed settings store to persist and restore AI and log analysis configuration across sessions.
- Changed `logcat-session-manager` to improve state transitions and expose lifecycle events.
- Changed log processing utilities to streamline enrichment and grouping pipeline.
- Changed Tailwind CSS class names across all components to use the new CSS variable parentheses syntax (`var(--color)` → `(--color)`) for compatibility with Tailwind v4.
- Changed Vitest configuration to add proper coverage thresholds and exclude generated/mock files.

### Fixed

- Fixed OpenAI chat button visibility so it only appears when a valid API key is configured.
- Fixed log normalizer edge cases that caused inconsistent message normalization.

### Documentation

- Added full user guide under `docs/user/` covering getting started, AI analysis, settings reference, troubleshooting, and common workflows.
- Updated `README.md` and `SUPPORT.md` with links to the new user guide.

### CI

- Updated `version-bump` workflow to use the latest action versions.

### Notes

- AI analysis requires a valid API key for the selected provider (OpenAI, Anthropic, Gemini, or OpenRouter). Keys are stored locally and never transmitted elsewhere.
- Log grouping and highlighting can be toggled independently from the Settings modal.

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

