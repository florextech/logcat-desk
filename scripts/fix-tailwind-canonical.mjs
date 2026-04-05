#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'coverage',
  'dist',
  'out',
  'release'
]);

const CANONICAL_VAR_CLASS_PATTERN = /([!a-zA-Z0-9_:/.-]+)-\[var\(--([a-zA-Z0-9_-]+)\)\]/g;

const args = process.argv.slice(2);
const writeMode = args.includes('--write');
const checkMode = args.includes('--check') || !writeMode;
const targets = args.filter((arg) => !arg.startsWith('--'));
const targetRoots = targets.length > 0 ? targets : ['src'];

const scanFiles = async (root) => {
  const absoluteRoot = resolve(root);
  const entries = await readdir(absoluteRoot, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(absoluteRoot, entry.name);

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }

      const nested = await scanFiles(absolutePath);
      files.push(...nested);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (SUPPORTED_EXTENSIONS.has(extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
};

const main = async () => {
  const allFiles = [];

  for (const root of targetRoots) {
    const absoluteRoot = resolve(root);
    const rootStats = await stat(absoluteRoot).catch(() => null);

    if (!rootStats || !rootStats.isDirectory()) {
      console.warn(`Skipping missing directory: ${root}`);
      continue;
    }

    const files = await scanFiles(absoluteRoot);
    allFiles.push(...files);
  }

  let replacements = 0;
  let changedFiles = 0;

  for (const filePath of allFiles) {
    const source = await readFile(filePath, 'utf8');
    const matches = [...source.matchAll(CANONICAL_VAR_CLASS_PATTERN)];

    if (matches.length === 0) {
      continue;
    }

    const updated = source.replaceAll(CANONICAL_VAR_CLASS_PATTERN, '$1-(--$2)');
    replacements += matches.length;
    changedFiles += 1;

    if (writeMode && updated !== source) {
      await writeFile(filePath, updated, 'utf8');
    }
  }

  const modeLabel = writeMode ? 'fix' : 'check';
  console.log(`[tailwind-canonical:${modeLabel}] scanned ${allFiles.length} files`);
  console.log(`[tailwind-canonical:${modeLabel}] matched ${replacements} class token(s) in ${changedFiles} file(s)`);

  if (checkMode && replacements > 0) {
    console.log('Run with --write to apply canonical Tailwind class fixes.');
    process.exitCode = 1;
  }
};

void main();
