# Usage Workflows

This guide describes the main day-to-day workflows in Logcat Desk.

## 1. Device and session flow

1. Open `Device`.
2. Select a connected device from the list.
3. Click `Start Live Tail`.
4. Use `Pause` if you want to inspect static output.
5. Use `Stop` to end capture.

Notes:

- `Clear logs` clears only the local visible list.
- `Clear buffer` (in `Actions` -> `Cleanup`) clears the real device log buffer.

## 2. Filtering flow

Use the filter bar fields together:

- `Free text or stack trace`: broad message matching.
- `Tag`: component/tag filter.
- `Package name`: package/process text filter.
- `Search and highlight`: in-message visual highlight.
- `Level`: minimum severity level.

Filters are combined, so restrictive combinations can result in zero visible logs.

## 3. Export and copy flow

Open `Actions` -> `Export`:

- `Export visible .txt`: exports only currently visible logs.
- `Export full .log`: exports full captured session.
- `Copy visible`: copies visible logs to clipboard.

In the console, each row also has a copy action for single-line copy.

## 4. Grouping and highlighting flow

Enable from `Settings` -> `General`:

- `Smart highlight`: classifies severity and highlights important patterns.
- `Group errors`: groups similar logs by normalized fingerprint.

When grouping is enabled:

- each group shows representative message, occurrence count, and time range
- you can expand/collapse groups
- group rows include quick actions (analyze + expand)

## 5. Analysis flow

### Analyze visible logs

1. Click `Analyze` from the top toolbar (or `Actions` -> `Maintenance` -> `Analyze logs`).
2. In the options modal, choose how many latest visible logs to analyze.
3. Click `Run`.

The result includes:

- summary
- probable causes
- evidence
- recommendations
- severity (`low`, `medium`, `high`, `critical`)

### Analyze a single grouped log

When grouping is enabled, use the AI/analyze icon on a group row (or child row) to analyze that specific log context only.

### Optional AI enhancement

If AI enhancement is enabled and configured:

- `Generate AI response` improves summary wording
- `Open AI chat` allows follow-up questions based on the analysis context

If provider call fails, deterministic analysis remains available.

