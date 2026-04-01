import type { UpdateCheckResult } from '@shared/types';

interface GitHubLatestReleaseResponse {
  tag_name?: string;
  html_url?: string;
}

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  preRelease: string[];
}

const numericIdentifierPattern = /^\d+$/;

export const normalizeVersion = (value: string): string =>
  value.trim().replace(/^v/i, '').split('+')[0] ?? value;

const parseSemver = (value: string): ParsedVersion => {
  const normalized = normalizeVersion(value);
  const [core, preReleaseRaw] = normalized.split('-', 2);
  const coreSegments = core.split('.');

  if (coreSegments.length !== 3 || coreSegments.some((segment) => segment.length === 0)) {
    throw new Error(`Invalid semantic version: ${value}`);
  }

  const [majorRaw, minorRaw, patchRaw] = coreSegments;
  const major = Number(majorRaw);
  const minor = Number(minorRaw);
  const patch = Number(patchRaw);

  if (![major, minor, patch].every((segment) => Number.isInteger(segment) && segment >= 0)) {
    throw new Error(`Invalid semantic version: ${value}`);
  }

  return {
    major,
    minor,
    patch,
    preRelease: preReleaseRaw ? preReleaseRaw.split('.') : []
  };
};

const compareIdentifier = (left: string, right: string): number => {
  const leftIsNumeric = numericIdentifierPattern.test(left);
  const rightIsNumeric = numericIdentifierPattern.test(right);

  if (leftIsNumeric && rightIsNumeric) {
    return Number(left) - Number(right);
  }

  if (leftIsNumeric && !rightIsNumeric) {
    return -1;
  }

  if (!leftIsNumeric && rightIsNumeric) {
    return 1;
  }

  return left.localeCompare(right);
};

const comparePreRelease = (left: string[], right: string[]): number => {
  if (left.length === 0 && right.length === 0) {
    return 0;
  }

  if (left.length === 0) {
    return 1;
  }

  if (right.length === 0) {
    return -1;
  }

  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftIdentifier = left[index];
    const rightIdentifier = right[index];

    if (leftIdentifier === undefined) {
      return -1;
    }

    if (rightIdentifier === undefined) {
      return 1;
    }

    const comparison = compareIdentifier(leftIdentifier, rightIdentifier);
    if (comparison !== 0) {
      return comparison;
    }
  }

  return 0;
};

export const compareSemver = (leftVersion: string, rightVersion: string): number => {
  const left = parseSemver(leftVersion);
  const right = parseSemver(rightVersion);

  if (left.major !== right.major) {
    return left.major - right.major;
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }

  if (left.patch !== right.patch) {
    return left.patch - right.patch;
  }

  return comparePreRelease(left.preRelease, right.preRelease);
};

export class UpdateService {
  constructor(
    private readonly repository = 'florextech/logcat-desk',
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs = 8000
  ) {}

  async checkLatestRelease(currentVersion: string): Promise<UpdateCheckResult> {
    const current = normalizeVersion(currentVersion);
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), this.timeoutMs);
    let response: Response;

    try {
      response = await this.fetchImpl(
        `https://api.github.com/repos/${this.repository}/releases/latest`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'logcat-desk'
          },
          signal: timeoutController.signal
        }
      );
    } catch (error_) {
      if (
        timeoutController.signal.aborted ||
        (error_ instanceof Error && error_.name === 'AbortError')
      ) {
        throw new Error('Update check timed out. Please try again.');
      }

      throw error_;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Unable to check updates right now (HTTP ${response.status}).`);
    }

    const payload = (await response.json()) as GitHubLatestReleaseResponse;
    if (!payload.tag_name || !payload.html_url) {
      throw new Error('The release feed did not include a valid version payload.');
    }

    const latest = normalizeVersion(payload.tag_name);

    return {
      currentVersion: current,
      latestVersion: latest,
      hasUpdate: compareSemver(latest, current) > 0,
      releaseUrl: payload.html_url
    };
  }
}
