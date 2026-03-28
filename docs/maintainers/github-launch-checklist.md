# GitHub Launch Checklist

Use this checklist before making the repository public or announcing a major release.

## Repository profile

- Set the repository description
- Add topics such as `electron`, `android`, `adb`, `logcat`, `macos`, `react`, and `typescript`
- Upload a social preview image
- Point the repository website to the README or release page

## Community health

- Confirm `README.md` is current
- Confirm `LICENSE` is present
- Confirm `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and `SUPPORT.md` are current
- Review `.github/CODEOWNERS` and confirm the listed owners are correct

## Pull request and issue hygiene

- Ensure issue templates match your support policy
- Ensure the PR template reflects the current review expectations
- Create the recommended labels from `repository-governance.md`
- Confirm `Pull Request Labeler` is enabled
- Confirm `Stale Issues and Pull Requests` matches the maintenance policy you want

## Branch protection

- Apply the branch protection settings from `repository-governance.md`
- Require these checks on `main`:
  - `Validate`
  - `macOS Package Smoke`

## Dependency and release maintenance

- Enable Dependabot and review its first PRs
- Confirm GitHub-generated release notes are grouping changes correctly from labels
- Test `Prepare Release PR` once before the first public release
- Review signing and notarization setup in `macos-distribution.md`

## Release readiness

- Package and test the app locally
- Verify the app icon and branding assets are correct
- Confirm the changelog entry is complete
- Create a tag and inspect the generated GitHub Release artifacts
