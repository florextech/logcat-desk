# Settings Reference

Open settings from the top-right `Settings` button. Configuration is persisted automatically in local app settings.

## Tabs

## `ADB`

- **ADB status**: shows whether ADB is currently available and resolved path.
- **Custom ADB path**: manual path override to adb binary.
- **Save ADB path**: persists the typed path.

## `General`

- **Language**: switch UI language (English/Spanish).
- **Auto-scroll**: follow incoming logs automatically.
- **Smart highlight**: classify and emphasize important errors/warnings.
- **Group errors**: group similar logs and allow group expansion.

## `Analysis & AI`

- **Intelligent analysis**: enables deterministic rule-based diagnostics.
- **AI summary enhancement**: optional provider-based improvement of the generated summary.
- **AI provider**: OpenAI, Gemini, OpenRouter, Claude.
- **API key**: provider key (masked input).
- **Model**: optional override model; leave blank for default provider model.

See [AI analysis and providers](./ai-analysis.md) for provider-specific details.

## Defaults

- Auto-scroll: enabled
- Smart highlight: enabled
- Group errors: disabled
- Intelligent analysis: enabled
- AI enhancement: disabled

