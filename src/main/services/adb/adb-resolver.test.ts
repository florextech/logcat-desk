import { chmod, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { runCommandMock } = vi.hoisted(() => ({
  runCommandMock: vi.fn()
}));

vi.mock('@main/services/adb/adb-command', () => ({
  runCommand: runCommandMock
}));

import { resolveAdbStatus } from '@main/services/adb/adb-resolver';

describe('resolveAdbStatus', () => {
  const originalEnv = { ...process.env };
  let tempDir = '';

  const createExecutable = async (filePath: string): Promise<string> => {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, '#!/bin/sh\nexit 0\n', 'utf8');
    await chmod(filePath, 0o755);
    return filePath;
  };

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      PATH: '/usr/bin:/bin'
    };
    delete process.env.ANDROID_HOME;
    delete process.env.ANDROID_SDK_ROOT;
    runCommandMock.mockReset();
    runCommandMock.mockResolvedValue({
      code: 1,
      stderr: '',
      stdout: ''
    });
    tempDir = await mkdtemp(join(tmpdir(), 'logcat-desk-adb-'));
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    await rm(tempDir, { recursive: true, force: true });
  });

  it('prefers a configured adb path when executable', async () => {
    const preferred = await createExecutable(join(tempDir, 'preferred-adb'));

    await expect(resolveAdbStatus(preferred)).resolves.toEqual({
      available: true,
      resolvedPath: preferred,
      source: 'settings'
    });

    expect(runCommandMock).not.toHaveBeenCalled();
  });

  it('resolves adb from PATH when the configured path is invalid', async () => {
    const pathAdb = join(tempDir, 'bin', 'adb');
    runCommandMock.mockResolvedValue({
      code: 0,
      stderr: '',
      stdout: `${pathAdb}\n`
    });
    await createExecutable(pathAdb);

    await expect(resolveAdbStatus('/bad/adb', { commonCandidates: [] })).resolves.toEqual({
      available: true,
      resolvedPath: pathAdb,
      source: 'path'
    });
  });

  it('resolves adb from ANDROID_HOME when PATH does not contain adb', async () => {
    const sdkRoot = join(tempDir, 'sdk');
    const envAdb = await createExecutable(join(sdkRoot, 'platform-tools', 'adb'));
    process.env.ANDROID_HOME = sdkRoot;

    await expect(resolveAdbStatus(undefined, { commonCandidates: [] })).resolves.toEqual({
      available: true,
      resolvedPath: envAdb,
      source: 'env'
    });
  });

  it('resolves adb from common locations when PATH and env are unavailable', async () => {
    process.env.HOME = tempDir;
    const commonAdb = await createExecutable(
      join(tempDir, 'Library', 'Android', 'sdk', 'platform-tools', 'adb')
    );

    await expect(resolveAdbStatus(undefined, { commonCandidates: [commonAdb], envCandidates: [] })).resolves.toEqual({
      available: true,
      resolvedPath: commonAdb,
      source: 'common'
    });
  });

  it('returns a configured-path error when the explicit adb path is missing', async () => {
    const status = await resolveAdbStatus('/missing/adb', { commonCandidates: [], envCandidates: [] });

    expect(status).toEqual({
      available: false,
      resolvedPath: null,
      source: 'missing',
      error: 'ADB was not found at /missing/adb.'
    });
  });

  it('returns a generic error when no adb candidate is found', async () => {
    const status = await resolveAdbStatus(undefined, { commonCandidates: [], envCandidates: [] });

    expect(status.available).toBe(false);
    expect(status.source).toBe('missing');
    expect(status.error).toContain('common install locations');
  });
});
