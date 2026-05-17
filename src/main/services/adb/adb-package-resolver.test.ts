import { beforeEach, describe, expect, it, vi } from 'vitest';

const { runCommandMock } = vi.hoisted(() => ({
  runCommandMock: vi.fn()
}));

vi.mock('@main/services/adb/adb-command', () => ({
  runCommand: runCommandMock
}));

import { AdbPackageResolver } from '@main/services/adb/adb-package-resolver';

describe('AdbPackageResolver', () => {
  beforeEach(() => {
    runCommandMock.mockReset();
  });

  it('parses PID->package map from modern ps output', async () => {
    runCommandMock.mockResolvedValueOnce({
      stdout: ['PID NAME', '123 com.demo.app', '456 com.example.feature'].join('\n'),
      stderr: '',
      code: 0
    });

    const resolver = new AdbPackageResolver('/usr/bin/adb', 'device-1');
    const result = await resolver.resolvePidMap();

    expect(runCommandMock).toHaveBeenCalledWith('/usr/bin/adb', [
      '-s',
      'device-1',
      'shell',
      'ps',
      '-A',
      '-o',
      'PID,NAME'
    ]);
    expect(result.get(123)).toBe('com.demo.app');
    expect(result.get(456)).toBe('com.example.feature');
  });

  it('falls back to legacy ps output when modern format fails', async () => {
    runCommandMock
      .mockResolvedValueOnce({
        stdout: '',
        stderr: 'unsupported option',
        code: 1
      })
      .mockResolvedValueOnce({
        stdout: ['USER PID PPID VSIZE RSS WCHAN ADDR S NAME', 'u0_a111 789 1 0 0 0 0 0 com.legacy.app'].join('\n'),
        stderr: '',
        code: 0
      });

    const resolver = new AdbPackageResolver('/usr/bin/adb', 'device-2');
    const result = await resolver.resolvePidMap();

    expect(runCommandMock).toHaveBeenNthCalledWith(2, '/usr/bin/adb', ['-s', 'device-2', 'shell', 'ps']);
    expect(result.get(789)).toBe('com.legacy.app');
  });

  it('returns an empty map when both commands fail', async () => {
    runCommandMock
      .mockResolvedValueOnce({ stdout: '', stderr: 'fail', code: 1 })
      .mockResolvedValueOnce({ stdout: '', stderr: 'fail', code: 1 });

    const resolver = new AdbPackageResolver('/usr/bin/adb', 'device-3');
    const result = await resolver.resolvePidMap();

    expect(result.size).toBe(0);
  });

  it('ignores malformed and non-package rows', async () => {
    runCommandMock.mockResolvedValueOnce({
      stdout: [
        'PID NAME',
        'not-a-row',
        '100 system_server',
        '200 com.valid.one',
        '300',
        'USER PID PPID VSIZE RSS WCHAN ADDR S NAME',
        'u0_a112 400 1 0 0 0 0 0 com.valid.two'
      ].join('\n'),
      stderr: '',
      code: 0
    });

    const resolver = new AdbPackageResolver('/usr/bin/adb', 'device-4');
    const result = await resolver.resolvePidMap();

    expect(result.size).toBe(2);
    expect(result.get(200)).toBe('com.valid.one');
    expect(result.get(400)).toBe('com.valid.two');
  });
});
