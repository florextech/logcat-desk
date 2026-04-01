import { describe, expect, it, vi } from 'vitest';
import { compareSemver, normalizeVersion, UpdateService } from '@main/services/update/update-service';

describe('update service', () => {
  it('normalizes versions with a leading v', () => {
    expect(normalizeVersion('v1.2.3')).toBe('1.2.3');
    expect(normalizeVersion(' v1.2.3+build.7 ')).toBe('1.2.3');
  });

  it('compares semantic versions correctly', () => {
    expect(compareSemver('1.2.3', '1.2.2')).toBeGreaterThan(0);
    expect(compareSemver('1.2.3', '1.2.3')).toBe(0);
    expect(compareSemver('2.0.0', '1.9.9')).toBeGreaterThan(0);
    expect(compareSemver('1.2.3-beta.1', '1.2.3-beta.2')).toBeLessThan(0);
    expect(compareSemver('1.2.3-alpha.1', '1.2.3-alpha')).toBeGreaterThan(0);
    expect(compareSemver('1.2.3-alpha.1', '1.2.3-alpha.1')).toBe(0);
    expect(compareSemver('1.2.3', '1.2.3-beta.2')).toBeGreaterThan(0);
    expect(compareSemver('1.2.3-1', '1.2.3-alpha')).toBeLessThan(0);
    expect(compareSemver('1.2.3-alpha', '1.2.3-1')).toBeGreaterThan(0);
  });

  it('throws when semantic versions are invalid', () => {
    expect(() => compareSemver('1.2', '1.2.0')).toThrow('Invalid semantic version: 1.2');
  });

  it('reports update availability from latest GitHub release', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v0.2.0',
        html_url: 'https://github.com/florextech/logcat-desk/releases/tag/v0.2.0'
      })
    } as Response);
    const service = new UpdateService('florextech/logcat-desk', fetchMock as typeof fetch);

    await expect(service.checkLatestRelease('0.1.0')).resolves.toMatchObject({
      currentVersion: '0.1.0',
      latestVersion: '0.2.0',
      hasUpdate: true
    });
  });

  it('reports up-to-date when latest release equals current version', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        tag_name: 'v0.1.0',
        html_url: 'https://github.com/florextech/logcat-desk/releases/tag/v0.1.0'
      })
    } as Response);
    const service = new UpdateService('florextech/logcat-desk', fetchMock as typeof fetch);

    await expect(service.checkLatestRelease('0.1.0')).resolves.toMatchObject({
      hasUpdate: false
    });
  });

  it('throws an error if GitHub latest release request fails', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503
    } as Response);
    const service = new UpdateService('florextech/logcat-desk', fetchMock as typeof fetch);

    await expect(service.checkLatestRelease('0.1.0')).rejects.toThrow(
      'Unable to check updates right now (HTTP 503).'
    );
  });

  it('throws if latest release payload is incomplete', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        html_url: 'https://github.com/florextech/logcat-desk/releases/latest'
      })
    } as Response);
    const service = new UpdateService('florextech/logcat-desk', fetchMock as typeof fetch);

    await expect(service.checkLatestRelease('0.1.0')).rejects.toThrow(
      'The release feed did not include a valid version payload.'
    );
  });
});
