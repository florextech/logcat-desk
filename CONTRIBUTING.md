# Contributing to Logcat Desk

Thanks for contributing.

## Before you start

- Search existing issues and pull requests first.
- Keep changes focused and easy to review.
- For larger changes, open an issue first so scope and direction are clear.

## Local setup

```bash
npm install
npm run dev
```

## Validation before opening a PR

Run these commands locally:

```bash
npm run lint
npm run test:coverage
npm run build
```

For packaging changes, also run:

```bash
npm run pack:mac
```

## Pull request expectations

- Explain the problem and the approach.
- Link the related issue when possible.
- Include screenshots or recordings for UI changes.
- Add or update tests when behavior changes.
- Update docs when user-facing behavior or setup changes.

## Coding expectations

- Follow the existing Electron security model.
- Keep `main`, `preload`, and `renderer` concerns separated.
- Prefer strongly typed code and small reusable units.
- Avoid adding runtime dependencies unless they clearly improve the product.

## Commit scope

- One pull request should solve one clear problem.
- Avoid mixing refactors, visual changes, and behavioral fixes unless they are tightly related.

## Review process

- Maintainers may request changes before merge.
- PRs should stay green in CI.
- Breaking changes need explicit explanation in the PR description.
