import { beforeEach, describe, expect, it, vi } from 'vitest';

const { runCommandMock } = vi.hoisted(() => ({
  runCommandMock: vi.fn()
}));

vi.mock('@main/services/adb/adb-command', () => ({
  runCommand: runCommandMock
}));

import { clearLogcatBuffer, listDevices } from '@main/services/adb/device-service';

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
});
