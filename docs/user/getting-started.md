# Quick Start

Logcat Desk is a desktop app to stream and inspect Android `adb logcat` output with filters and analysis tools.

## Prerequisites

- macOS
- Android device connected by USB or network debugging
- `adb` available from one of these sources:
  - system `PATH`
  - `ANDROID_HOME`
  - `ANDROID_SDK_ROOT`
  - manually configured path in app settings

## First run

1. Open the app.
2. Click `Device` and select a connected device.
3. Click `Start Live Tail`.
4. Confirm logs are arriving in the console.

## Basic controls

- `Start Live Tail`: starts streaming logs from the selected device.
- `Pause` / `Resume`: toggles capture state.
- `Stop`: ends the current logcat session.
- `Clear logs`: clears only the current visible console list (does not clear device buffer).

## First useful filter

Set minimum level to `W` or `E` in the level selector to focus on warnings/errors quickly.

## Where to go next

- For complete workflows: [Usage workflows](./workflows.md)
- For preferences and AI setup: [Settings reference](./settings.md)
- For provider keys and models: [AI analysis and providers](./ai-analysis.md)

