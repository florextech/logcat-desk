import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , versionArg, dateArg] = process.argv;

if (!versionArg) {
  console.error('Usage: npm run release:prepare -- <version> [release-date]');
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+$/.test(versionArg)) {
  console.error(`Invalid version "${versionArg}". Expected SemVer format like 0.2.0.`);
  process.exit(1);
}

const releaseDate = dateArg && dateArg.trim() ? dateArg.trim() : new Date().toISOString().slice(0, 10);
const rootDir = process.cwd();
const packageJsonPath = resolve(rootDir, 'package.json');
const changelogPath = resolve(rootDir, 'CHANGELOG.md');

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
packageJson.version = versionArg;
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

const changelog = readFileSync(changelogPath, 'utf8');
const heading = `## [${versionArg}] - ${releaseDate}`;

if (changelog.includes(heading)) {
  console.error(`Changelog entry for ${versionArg} already exists.`);
  process.exit(1);
}

const changelogTemplate = `${heading}

### Added

- Pending

### Changed

- Pending

### Fixed

- Pending

### Documentation

- Pending

### CI

- Pending

### Notes

- Replace placeholders with the final release notes before merging.

`;

const marker = 'The format is based on Keep a Changelog, and versioning is intended to follow Semantic Versioning.';

if (!changelog.includes(marker)) {
  console.error('Could not find changelog insertion point.');
  process.exit(1);
}

const nextChangelog = changelog.replace(marker, `${marker}\n\n${changelogTemplate}`.trimEnd());
writeFileSync(changelogPath, `${nextChangelog}\n`);

console.log(`Prepared release ${versionArg} with changelog date ${releaseDate}.`);
