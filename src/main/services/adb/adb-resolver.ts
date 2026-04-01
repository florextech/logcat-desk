import { constants } from 'node:fs';
import { access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { runCommand } from '@main/services/adb/adb-command';
import type { AdbStatus } from '@shared/types';

const uniqueCandidates = (candidates: string[]): string[] =>
  [...new Set(candidates.map((candidate) => candidate.trim()).filter(Boolean))];

const executableCandidatesFromEnv = (): string[] => {
  const envRoots = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT].filter(
    Boolean
  ) as string[];

  return uniqueCandidates(envRoots.map((root) =>
    process.platform === 'win32' ? join(root, 'platform-tools', 'adb.exe') : join(root, 'platform-tools', 'adb')
  ));
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

const executableCandidatesFromCommonLocations = (): string[] => {
  const home = homedir();

  if (process.platform === 'darwin') {
    return uniqueCandidates([
      '/opt/homebrew/bin/adb',
      '/usr/local/bin/adb',
      join(home, 'Library', 'Android', 'sdk', 'platform-tools', 'adb'),
      join(home, 'Android', 'Sdk', 'platform-tools', 'adb')
    ]);
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA ?? join(home, 'AppData', 'Local');
    const userProfile = process.env.USERPROFILE ?? home;

    return uniqueCandidates([
      join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
      join(userProfile, 'AppData', 'Local', 'Android', 'Sdk', 'platform-tools', 'adb.exe'),
      String.raw`C:\Android\platform-tools\adb.exe`
    ]);
  }

  return uniqueCandidates([
    '/usr/local/bin/adb',
    '/usr/bin/adb',
    join(home, 'Android', 'Sdk', 'platform-tools', 'adb'),
    join(home, '.local', 'android-sdk', 'platform-tools', 'adb')
  ]);
};

interface ResolveAdbStatusOptions {
  commonCandidates?: string[];
  envCandidates?: string[];
  isExecutableFn?: (candidate: string) => Promise<boolean>;
  resolveFromPathFn?: () => Promise<string | null>;
}

export const resolveAdbStatus = async (
  preferredPath?: string,
  options: ResolveAdbStatusOptions = {}
): Promise<AdbStatus> => {
  const isExecutableCheck = options.isExecutableFn ?? isExecutable;
  const resolvePath = options.resolveFromPathFn ?? resolveFromPath;
  const envCandidates = uniqueCandidates(options.envCandidates ?? executableCandidatesFromEnv());
  const commonCandidates = uniqueCandidates(options.commonCandidates ?? executableCandidatesFromCommonLocations());

  if (preferredPath?.trim()) {
    const explicitPath = preferredPath.trim();

    if (await isExecutableCheck(explicitPath)) {
      return {
        available: true,
        resolvedPath: explicitPath,
        source: 'settings'
      };
    }
  }

  const pathCandidate = await resolvePath();
  if (pathCandidate && (await isExecutableCheck(pathCandidate))) {
    return {
      available: true,
      resolvedPath: pathCandidate,
      source: 'path'
    };
  }

  for (const envCandidate of envCandidates) {
    if (await isExecutableCheck(envCandidate)) {
      return {
        available: true,
        resolvedPath: envCandidate,
        source: 'env'
      };
    }
  }

  for (const commonCandidate of commonCandidates) {
    if (await isExecutableCheck(commonCandidate)) {
      return {
        available: true,
        resolvedPath: commonCandidate,
        source: 'common'
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
      'ADB was not found in PATH, Android SDK env vars, or common install locations. Install Android platform-tools or configure the binary path manually.'
  };
};
