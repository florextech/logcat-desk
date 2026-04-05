# Troubleshooting

## Device does not appear

- Open `Device` and click `Refresh`.
- Check connection with `adb devices -l`.
- Make sure USB debugging is enabled on the device.
- If ADB is missing, set path manually in `Settings` -> `ADB`.

## Session starts but no logs appear

- Confirm selected device is online (`device` state).
- Relax filters (text/tag/package/level).
- Set level to `All levels` temporarily.
- Try stopping and starting capture again.

## Pause/Stop feels delayed

- A short delay can happen while the current buffered log lines finish processing.
- Avoid clicking multiple times; wait for state transition (`streaming`, `paused`, `stopped`).

## No results from analysis

- Ensure there are visible logs first.
- Open `Analyze` and verify the selected count is greater than 0.
- If no known rule matches, result can stay low severity with generic recommendations.

## AI enhancement fails

- Verify `Analysis & AI` settings:
  - `Intelligent analysis` enabled
  - `AI summary enhancement` enabled
  - correct provider selected
  - valid API key
- Remove custom model and retry with default model.
- Check network/firewall/proxy access.

Common case:

- `HTTP 401`: wrong key, wrong provider, revoked key, or invalid account scope.

If AI fails, deterministic analysis still works by design.

## Export does not save file

- Confirm you did not cancel the save dialog.
- Ensure destination folder has write permissions.
- Retry with a different destination path.

