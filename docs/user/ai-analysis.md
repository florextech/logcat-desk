# Intelligent Analysis and AI Providers

Logcat Desk runs deterministic analysis first. AI is optional and only improves wording and follow-up answers.

## How AI is used

1. `Analyze logs` runs deterministic analysis from visible/selected logs.
2. `Generate AI response` sends the deterministic result to the selected provider to improve the summary text.
3. `Open AI chat` asks follow-up questions grounded on the same deterministic analysis context.

If AI is disabled, missing config, or provider request fails, Logcat Desk keeps and shows deterministic results.

## Configure provider and API key

1. Open `Settings` -> `Analysis & AI`.
2. Enable `Intelligent analysis`.
3. (Optional) Enable `AI summary enhancement`.
4. Choose provider: `OpenAI`, `Gemini`, `OpenRouter`, or `Claude`.
5. Paste your API key.
6. (Optional) Set a model override. Leave blank to use defaults.

Default models when `model` is empty:

- OpenAI: `gpt-4.1-mini`
- Gemini: `gemini-1.5-flash`
- OpenRouter: `openai/gpt-4.1-mini`
- Claude: `claude-3-5-haiku-latest`

## API key handling and safety

- API keys are never hardcoded in the repository.
- The key field is masked in the UI (`type="password"`).
- API keys are not persisted in plain text in Electron `userData/settings.json`.
- After restart you may need to re-enter your key unless a secure storage mechanism is added.
- Provider error details are sanitized before being surfaced to renderer UI.
- Logcat data is not sent automatically. Provider requests happen only when users trigger AI actions.

## Troubleshooting

- `HTTP 401` usually means invalid key, wrong provider selected, revoked key, or wrong project/account scope.
- Ensure key and provider match (for example, OpenRouter key with OpenRouter provider).
- If custom model is invalid for your account, clear model and retry with provider default.
- Check outbound network/proxy/firewall access to provider endpoints.
- If AI fails, deterministic analysis still works (rule-based fallback).
