import { beforeEach, describe, expect, it, vi } from 'vitest';

const { runCommandMock } = vi.hoisted(() => ({
  runCommandMock: vi.fn()
}));

vi.mock('@main/services/adb/adb-command', () => ({
  runCommand: runCommandMock
}));

import { clearLogcatBuffer, getDevicePerformanceSnapshot, listDevices } from '@main/services/adb/device-service';

describe('device-service', () => {
  beforeEach(() => {
    runCommandMock.mockReset();
  });

  it('lists parsed devices sorted by id', async () => {
    runCommandMock.mockResolvedValue({
      code: 0,
      stderr: '',
      stdout: `List of devices attached
emulator-5556 device product:sdk_gphone64_arm64 model:sdk_gphone64_arm64 device:emu transport_id:2
emulator-5554 offline product:sdk model:Pixel_8 device:pixel transport_id:1
invalid-line
`
    });

    await expect(listDevices('/usr/bin/adb')).resolves.toEqual([
      {
        id: 'emulator-5554',
        state: 'offline',
        model: 'Pixel 8',
        product: 'sdk',
        transportId: '1',
        deviceName: 'pixel'
      },
      {
        id: 'emulator-5556',
        state: 'device',
        model: 'sdk gphone64 arm64',
        product: 'sdk gphone64 arm64',
        transportId: '2',
        deviceName: 'emu'
      }
    ]);
  });

  it('ignores malformed device rows with invalid states', async () => {
    runCommandMock.mockResolvedValue({
      code: 0,
      stderr: '',
      stdout: `List of devices attached
broken-device List transport_id:1
`
    });

    await expect(listDevices('/usr/bin/adb')).resolves.toEqual([]);
  });

  it('throws when device listing fails', async () => {
    runCommandMock.mockResolvedValue({
      code: 1,
      stderr: 'adb broken',
      stdout: ''
    });

    await expect(listDevices('/usr/bin/adb')).rejects.toThrow('adb broken');
  });

  it('clears the device logcat buffer', async () => {
    runCommandMock.mockResolvedValue({
      code: 0,
      stderr: '',
      stdout: ''
    });

    await clearLogcatBuffer('/usr/bin/adb', 'device-1');

    expect(runCommandMock).toHaveBeenCalledWith('/usr/bin/adb', ['-s', 'device-1', 'logcat', '-c']);
  });

  it('throws when clearing the buffer fails', async () => {
    runCommandMock.mockResolvedValue({
      code: 2,
      stderr: '',
      stdout: ''
    });

    await expect(clearLogcatBuffer('/usr/bin/adb', 'device-1')).rejects.toThrow(
      'Failed to clear the device logcat buffer.'
    );
  });

  it('parses performance snapshot from adb shell outputs', async () => {
    runCommandMock
      .mockResolvedValueOnce({
        code: 0,
        stderr: '',
        stdout: `Load: 1.23 / 0.98 / 0.72\nCPU usage from 10000ms to 0ms ago:\nTOTAL: 35% user + 12% kernel + 2.0% iowait + 1.0% irq\n22% 1000/system_server: 18% user + 4.0% kernel\n8.5% 2345/com.example.app: 6.5% user + 2.0% kernel\n`
      })
      .mockResolvedValueOnce({
        code: 0,
        stderr: '',
        stdout: `MemTotal:        4096000 kB\nMemFree:          512000 kB\nMemAvailable:    1024000 kB\nSwapTotal:        512000 kB\nSwapFree:         256000 kB\n`
      })
      .mockResolvedValueOnce({
        code: 0,
        stderr: '',
        stdout: '12345.67 54321.00\n'
      });

    await expect(getDevicePerformanceSnapshot('/usr/bin/adb', 'device-1')).resolves.toEqual({
      timestamp: expect.any(String),
      deviceId: 'device-1',
      cpuTotalPercent: 50,
      cpuUserPercent: 35,
      cpuKernelPercent: 12,
      cpuIoWaitPercent: 2,
      memoryUsedMb: 3500,
      memoryFreeMb: 500,
      memoryAvailableMb: 1000,
      memoryTotalMb: 4000,
      swapUsedMb: 250,
      swapTotalMb: 500,
      loadAverage1m: 1.23,
      loadAverage5m: 0.98,
      loadAverage15m: 0.72,
      uptimeSeconds: 12345,
      topProcesses: [
        { pid: 1000, name: 'system_server', cpuPercent: 22, rssKb: null },
        { pid: 2345, name: 'com.example.app', cpuPercent: 8.5, rssKb: null }
      ]
    });
  });

  it('falls back to zeroed metrics when adb output is incomplete', async () => {
    runCommandMock
      .mockResolvedValueOnce({
        code: 0,
        stderr: '',
        stdout: 'CPU usage from 5000ms to 0ms ago:\n9.0% 321/com.demo: 9.0% user\n'
      })
      .mockResolvedValueOnce({
        code: 0,
        stderr: '',
        stdout: 'MemTotal:        2048000 kB\n'
      })
      .mockResolvedValueOnce({
        code: 0,
        stderr: '',
        stdout: 'not-a-number\n'
      });

    await expect(getDevicePerformanceSnapshot('/usr/bin/adb', 'device-2')).resolves.toEqual({
      timestamp: expect.any(String),
      deviceId: 'device-2',
      cpuTotalPercent: 9,
      cpuUserPercent: 0,
      cpuKernelPercent: 0,
      cpuIoWaitPercent: 0,
      memoryUsedMb: 2000,
      memoryFreeMb: 0,
      memoryAvailableMb: 0,
      memoryTotalMb: 2000,
      swapUsedMb: 0,
      swapTotalMb: 0,
      loadAverage1m: 0,
      loadAverage5m: 0,
      loadAverage15m: 0,
      uptimeSeconds: 0,
      topProcesses: [{ pid: 321, name: 'com.demo', cpuPercent: 9, rssKb: null }]
    });
  });

  it('throws when adb shell command fails for performance snapshot', async () => {
    runCommandMock.mockResolvedValue({
      code: 1,
      stderr: 'permission denied',
      stdout: ''
    });

    await expect(getDevicePerformanceSnapshot('/usr/bin/adb', 'device-3')).rejects.toThrow('permission denied');
  });

  it('uses fallback adb shell error message when stderr is empty', async () => {
    runCommandMock.mockResolvedValue({
      code: 1,
      stderr: '',
      stdout: ''
    });

    await expect(getDevicePerformanceSnapshot('/usr/bin/adb', 'device-4')).rejects.toThrow(
      'Failed to run adb shell command: dumpsys cpuinfo'
    );
  });

  it('uses process sum when TOTAL line exists but has no percentages', async () => {
    runCommandMock
      .mockResolvedValueOnce({
        code: 0,
        stderr: '',
        stdout: `CPU usage from 10000ms to 0ms ago:\nTOTAL:\n11.0% 1000/system_server: 11.0% user\n`
      })
      .mockResolvedValueOnce({
        code: 0,
        stderr: '',
        stdout: `MemTotal:        1024000 kB\nMemFree:         256000 kB\nMemAvailable:    512000 kB\nSwapTotal:             0 kB\nSwapFree:              0 kB\n`
      })
      .mockResolvedValueOnce({
        code: 0,
        stderr: '',
        stdout: '600.0 0.0\n'
      });

    await expect(getDevicePerformanceSnapshot('/usr/bin/adb', 'device-5')).resolves.toEqual(
      expect.objectContaining({
        cpuTotalPercent: 11,
        topProcesses: [{ pid: 1000, name: 'system_server', cpuPercent: 11, rssKb: null }]
      })
    );
  });
});
