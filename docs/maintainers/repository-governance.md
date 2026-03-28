# Repository Governance

This document covers the GitHub settings that should be enabled manually for a production-grade open source workflow.

## Branch protection

Create a branch protection rule, or repository ruleset, for `main` with these settings:

- Require a pull request before merging
- Require at least 1 approving review
- Dismiss stale approvals when new commits are pushed
- Require review from code owners if you later add `CODEOWNERS`
- Require conversation resolution before merging
- Require branches to be up to date before merging
- Block force pushes
- Block branch deletion

## Required status checks

Mark these checks as required for pull requests into `main`:

- `Validate`
- `macOS Package Smoke`

These names come from the jobs defined in [ci.yml](../../.github/workflows/ci.yml).

## Recommended merge policy

- Allow squash merge
- Allow rebase merge only if you want to preserve commit series
- Disable direct pushes to `main`
- Keep linear history enabled if your team prefers a clean main branch

## Suggested labels

Create these repository labels so release drafts group changes correctly:

- `feature`
- `enhancement`
- `bug`
- `fix`
- `docs`
- `ci`
- `maintenance`
- `breaking`
- `release`

## Release maintainers checklist

1. Run the `Prepare Release PR` workflow with the target version.
2. Replace all `Pending` sections in `CHANGELOG.md` with final notes.
3. Merge the release PR after the required checks pass.
4. Create and push a tag like `v0.2.0`.
5. Let the `Release` workflow publish the macOS artifacts.
