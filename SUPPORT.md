# Support

## Getting help

Use GitHub issues for:

- reproducible bugs
- feature requests
- documentation gaps

Before opening an issue:

- read the README
- check existing issues
- collect logs, screenshots, and reproduction steps

## Good support requests

A good report includes:

- app version
- macOS version
- `adb version`
- exact steps
- expected result
- actual result

## Unsigned macOS builds

Until signed and notarized releases are available, some macOS downloads may be blocked by Gatekeeper.

For trusted local testing only, you can remove the quarantine attribute:

```bash
xattr -dr com.apple.quarantine "/Applications/Logcat Desk.app"
```

This is a temporary workaround for local builds and trusted release artifacts. It is not a replacement for proper signing and notarization.

## AI provider troubleshooting

See [docs/user/troubleshooting.md](./docs/user/troubleshooting.md#ai-enhancement-fails) for quick fixes and [docs/user/ai-analysis.md](./docs/user/ai-analysis.md) for full provider setup.

## Not for public issues

Do not use public issues for security disclosures. Follow [SECURITY.md](./SECURITY.md) instead.
