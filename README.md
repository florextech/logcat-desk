# Logcat Desk

![CI](https://github.com/florextech/logcat-desk/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/florextech/logcat-desk/actions/workflows/release.yml/badge.svg)
![License](https://img.shields.io/github/license/florextech/logcat-desk)
![Latest release](https://img.shields.io/github/v/release/florextech/logcat-desk)

<p align="center">
  <img src="./docs/assets/logcat-desk-wordmark.svg" alt="Logcat Desk logo" width="720" />
</p>

Logcat Desk is a desktop app for macOS focused on Android developers who want a fast `adb logcat` workflow without opening Android Studio.

## Stack

- Electron
- TypeScript
- React
- Tailwind CSS
- Secure preload + `contextBridge`
- Native `adb` execution through `child_process.spawn`

## MVP included

- Detect connected devices with `adb devices -l`
- Select a device
- Start a real-time `adb -s <deviceId> logcat -v threadtime` session
- Filter logs by free text, tag, package text, and minimum level
- Search-highlight matches in the console
- Pause and resume capture
- Clear the local console view
- Clear the device log buffer with `adb logcat -c`
- Export visible logs to `.txt`
- Export the full captured session to `.log`
- Copy visible logs or single rows to the clipboard
- Persist ADB path, auto-scroll, selected device, and filters

## Project structure

```text
src/
  main/
    ipc/
    services/
      adb/
      export/
      logcat/
      settings/
  preload/
  renderer/
    src/
      components/
      hooks/
      services/
      store/
      utils/
  shared/
```

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Start the development app:

```bash
npm run dev
```

3. Build production assets:

```bash
npm run build
```

4. Package a local macOS app bundle:

```bash
npm run pack:mac
```

5. Create macOS release artifacts (`.zip` + `.dmg`):

```bash
npm run dist:mac
```

## Temporary macOS workaround for unsigned builds

Until signed and notarized releases are fully configured, macOS may block builds downloaded from the internet.

If you trust the app and need to open an unsigned build locally, you can remove the quarantine attribute:

```bash
xattr -dr com.apple.quarantine "/Applications/Logcat Desk.app"
```

You can also point the command at a build in `Downloads` or any other folder.

This is only a temporary local workaround for trusted builds. It does not replace proper Apple signing and notarization.

## Notes

- The app does not depend on Android Studio at runtime.
- `adb` can be discovered from `PATH`, `ANDROID_HOME`, `ANDROID_SDK_ROOT`, or configured manually in the sidebar.
- Renderer code does not use `nodeIntegration`.
- The main process batches log events before sending them to the renderer to keep the UI responsive.

## GitHub workflows

- `CI`: runs lint, coverage, build, and a macOS packaging smoke check.
- `Pull Request Labeler`: applies labels automatically from changed file paths.
- `Prepare Release PR`: opens a release pull request with a version bump and detailed changelog scaffold.
- `Release`: builds signed-or-unsigned macOS artifacts on tags like `v0.1.0` and attaches them to a GitHub Release.
- `Stale Issues and Pull Requests`: keeps inactive issues and PRs under control.

GitHub-generated release notes are configured through [.github/release.yml](./.github/release.yml).

## Open source

- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Security policy: [SECURITY.md](./SECURITY.md)
- Support guide: [SUPPORT.md](./SUPPORT.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)
- Roadmap: [ROADMAP.md](./ROADMAP.md)
- Repository governance: [docs/maintainers/repository-governance.md](./docs/maintainers/repository-governance.md)
- GitHub launch checklist: [docs/maintainers/github-launch-checklist.md](./docs/maintainers/github-launch-checklist.md)
- macOS distribution setup: [docs/maintainers/macos-distribution.md](./docs/maintainers/macos-distribution.md)

## License

This project is released under the [MIT License](./LICENSE).

## Recommended next steps

- Add structured presets for tag/package filters.
- Add multi-device tabs.
- Add log bookmarks and saved sessions.
- Add disk-backed persistence for long-running captures.
- Add package-aware filtering by resolving app PID mappings through ADB.
