import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { runCommand } from '@main/services/adb/adb-command';
import type { AdbStatus } from '@shared/types';

const executableCandidatesFromEnv = (): string[] => {
  const envRoots = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT].filter(
    Boolean
  ) as string[];

  return envRoots.map((root) =>
    process.platform === 'win32' ? join(root, 'platform-tools', 'adb.exe') : join(root, 'platform-tools', 'adb')
  );
};

const isExecutable = async (candidate: string): Promise<boolean> => {
  try {
    await access(candidate, constants.X_OK);
    return true;
  } catch {
    return false;
  }
};

const resolveFromPath = async (): Promise<string | null> => {
  const command = process.platform === 'win32' ? 'where' : 'which';
  const result = await runCommand(command, ['adb']);

  if (result.code !== 0) {
    return null;
  }

  const candidate = result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
  return candidate ?? null;
};

export const resolveAdbStatus = async (preferredPath?: string): Promise<AdbStatus> => {
  if (preferredPath?.trim()) {
    const explicitPath = preferredPath.trim();

    if (await isExecutable(explicitPath)) {
      return {
        available: true,
        resolvedPath: explicitPath,
        source: 'settings'
      };
    }
  }

  const pathCandidate = await resolveFromPath();
  if (pathCandidate && (await isExecutable(pathCandidate))) {
    return {
      available: true,
      resolvedPath: pathCandidate,
      source: 'path'
    };
  }

  for (const envCandidate of executableCandidatesFromEnv()) {
    if (await isExecutable(envCandidate)) {
      return {
        available: true,
        resolvedPath: envCandidate,
        source: 'env'
      };
    }
  }

  const preferredError = preferredPath?.trim()
    ? `ADB was not found at ${preferredPath.trim()}.`
    : undefined;

  return {
    available: false,
    resolvedPath: null,
    source: 'missing',
    error:
      preferredError ??
      'ADB was not found in PATH. Install Android platform-tools or configure the binary path manually.'
  };
};
