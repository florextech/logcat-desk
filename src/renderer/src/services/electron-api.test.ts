import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '@shared/types';

describe('renderer electronApi service', () => {
  beforeEach(() => {
    vi.resetModules();
    Reflect.deleteProperty(globalThis as typeof globalThis & { logcatDesk?: unknown }, 'logcatDesk');
  });

  it('falls back to a safe api when preload is unavailable', async () => {
    const module = await import('@renderer/services/electron-api');

    expect(module.hasElectronApi).toBe(false);
    await expect(module.electronApi.getSettings()).resolves.toEqual(defaultSettings);
    await expect(module.electronApi.updateSettings({ locale: 'en' })).resolves.toEqual(defaultSettings);
    await expect(module.electronApi.getAdbStatus()).resolves.toMatchObject({
      available: false,
      source: 'missing'
    });
    await expect(module.electronApi.listDevices()).resolves.toMatchObject({
      devices: [],
      adbStatus: {
        available: false,
        source: 'missing'
      }
    });
    await expect(module.electronApi.startLogcat({ deviceId: 'device-1' })).rejects.toThrow(
      'The Electron preload API is unavailable.'
    );
    await expect(module.electronApi.stopLogcat()).rejects.toThrow(
      'The Electron preload API is unavailable.'
    );
    await expect(module.electronApi.pauseLogcat()).rejects.toThrow(
      'The Electron preload API is unavailable.'
    );
    await expect(module.electronApi.resumeLogcat()).rejects.toThrow(
      'The Electron preload API is unavailable.'
    );
    await expect(module.electronApi.clearLogcatBuffer({ deviceId: 'device-1' })).rejects.toThrow(
      'The Electron preload API is unavailable.'
    );
    await expect(
      module.electronApi.exportLogs({ scope: 'visible', format: 'txt', suggestedName: 'capture' })
    ).rejects.toThrow('The Electron preload API is unavailable.');
    await expect(module.electronApi.copyToClipboard('copied')).rejects.toThrow(
      'The Electron preload API is unavailable.'
    );
    expect(module.electronApi.onLogBatch(() => undefined)).toBeTypeOf('function');
    expect(module.electronApi.onSessionState(() => undefined)).toBeTypeOf('function');
  });

  it('uses the exposed preload api when present', async () => {
    const exposedApi = {
      getSettings: vi.fn().mockResolvedValue(defaultSettings)
    } as unknown as Window['logcatDesk'];
    (globalThis as typeof globalThis & { logcatDesk?: unknown }).logcatDesk = exposedApi;

    const module = await import('@renderer/services/electron-api');

    expect(module.hasElectronApi).toBe(true);
    expect(module.electronApi).toBe(exposedApi);
  });
});
