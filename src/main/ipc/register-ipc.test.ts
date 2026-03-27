import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '@shared/types';
import { ipcChannels } from '@shared/ipc';

const { clipboardWriteTextMock, dialogObject, handleMock, removeHandlerMock } = vi.hoisted(() => ({
  clipboardWriteTextMock: vi.fn(),
  dialogObject: {},
  handleMock: vi.fn(),
  removeHandlerMock: vi.fn()
}));

const {
  clearLogcatBufferMock,
  listDevicesMock,
  resolveAdbStatusMock
} = vi.hoisted(() => ({
  clearLogcatBufferMock: vi.fn(),
  listDevicesMock: vi.fn(),
  resolveAdbStatusMock: vi.fn()
}));

vi.mock('electron', () => ({
  clipboard: {
    writeText: clipboardWriteTextMock
  },
  dialog: dialogObject,
  ipcMain: {
    handle: handleMock,
    removeHandler: removeHandlerMock
  }
}));

vi.mock('@main/services/adb/device-service', () => ({
  clearLogcatBuffer: clearLogcatBufferMock,
  listDevices: listDevicesMock
}));

vi.mock('@main/services/adb/adb-resolver', () => ({
  resolveAdbStatus: resolveAdbStatusMock
}));

import { registerIpc } from '@main/ipc/register-ipc';

describe('registerIpc', () => {
  beforeEach(() => {
    clipboardWriteTextMock.mockReset();
    clearLogcatBufferMock.mockReset();
    listDevicesMock.mockReset();
    resolveAdbStatusMock.mockReset();
    handleMock.mockReset();
    removeHandlerMock.mockReset();
  });

  it('registers ipc handlers and forwards session events', async () => {
    const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
    handleMock.mockImplementation((channel: string, fn: (...args: unknown[]) => Promise<unknown>) => {
      handlers.set(channel, fn);
    });

    const listeners: Record<string, (payload: unknown) => void> = {};
    const mainWindow = {
      webContents: {
        send: vi.fn()
      }
    };
    const settingsStore = {
      getSettings: vi.fn().mockResolvedValue({
        ...defaultSettings,
        adbPath: '/custom/adb'
      }),
      update: vi.fn().mockImplementation(async (partial) => ({
        ...defaultSettings,
        adbPath: '/custom/adb',
        lastDeviceId: partial.lastDeviceId ?? null
      }))
    };
    const sessionManager = {
      on: vi.fn((event: string, listener: (payload: unknown) => void) => {
        listeners[event] = listener;
      }),
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getState: vi.fn().mockReturnValue({ status: 'idle', deviceId: null })
    };
    const exportService = {
      exportWithDialog: vi.fn().mockResolvedValue({ canceled: false, filePath: '/tmp/logs.txt' })
    };

    resolveAdbStatusMock.mockResolvedValue({
      available: true,
      resolvedPath: '/resolved/adb',
      source: 'settings'
    });
    listDevicesMock.mockResolvedValue([{ id: 'device-1', state: 'device' }]);

    registerIpc({
      mainWindow: mainWindow as never,
      settingsStore: settingsStore as never,
      sessionManager: sessionManager as never,
      exportService: exportService as never
    });

    expect(removeHandlerMock).toHaveBeenCalled();
    expect(handlers.has(ipcChannels.settingsGet)).toBe(true);
    expect(handlers.has(ipcChannels.logcatStart)).toBe(true);

    listeners['log-batch']?.({ entries: [{ id: '1' }] });
    listeners['session-state']?.({ status: 'streaming' });

    expect(mainWindow.webContents.send).toHaveBeenCalledWith(ipcChannels.events.logBatch, { entries: [{ id: '1' }] });
    expect(mainWindow.webContents.send).toHaveBeenCalledWith(ipcChannels.events.sessionState, { status: 'streaming' });

    await expect(handlers.get(ipcChannels.settingsGet)?.({})).resolves.toEqual(
      await settingsStore.getSettings()
    );
    await expect(handlers.get(ipcChannels.adbStatusGet)?.({})).resolves.toEqual({
      available: true,
      resolvedPath: '/resolved/adb',
      source: 'settings'
    });
    await expect(handlers.get(ipcChannels.devicesList)?.({})).resolves.toEqual({
      devices: [{ id: 'device-1', state: 'device' }],
      adbStatus: {
        available: true,
        resolvedPath: '/resolved/adb',
        source: 'settings'
      }
    });

    await handlers.get(ipcChannels.logcatStart)?.({}, { deviceId: 'device-1' });
    expect(settingsStore.update).toHaveBeenCalledWith({ lastDeviceId: 'device-1' });
    expect(sessionManager.start).toHaveBeenCalledWith({
      adbPath: '/resolved/adb',
      deviceId: 'device-1'
    });

    await handlers.get(ipcChannels.logcatPause)?.({});
    expect(sessionManager.pause).toHaveBeenCalled();
    await handlers.get(ipcChannels.logcatResume)?.({});
    expect(sessionManager.resume).toHaveBeenCalled();
    await handlers.get(ipcChannels.logcatStop)?.({});
    expect(sessionManager.stop).toHaveBeenCalled();

    await handlers.get(ipcChannels.logcatClearBuffer)?.({}, { deviceId: 'device-1' });
    expect(clearLogcatBufferMock).toHaveBeenCalledWith('/resolved/adb', 'device-1');

    await expect(
      handlers.get(ipcChannels.exportLogs)?.({}, { scope: 'visible', format: 'txt', suggestedName: 'demo' })
    ).resolves.toEqual({ canceled: false, filePath: '/tmp/logs.txt' });

    await handlers.get(ipcChannels.clipboardCopy)?.({}, 'copied text');
    expect(clipboardWriteTextMock).toHaveBeenCalledWith('copied text');
  });

  it('returns no devices when adb is unavailable', async () => {
    const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
    handleMock.mockImplementation((channel: string, fn: (...args: unknown[]) => Promise<unknown>) => {
      handlers.set(channel, fn);
    });

    const settingsStore = {
      getSettings: vi.fn().mockResolvedValue(defaultSettings)
    };

    resolveAdbStatusMock.mockResolvedValue({
      available: false,
      resolvedPath: null,
      source: 'missing',
      error: 'ADB missing'
    });

    registerIpc({
      mainWindow: { webContents: { send: vi.fn() } } as never,
      settingsStore: settingsStore as never,
      sessionManager: { on: vi.fn() } as never,
      exportService: { exportWithDialog: vi.fn() } as never
    });

    await expect(handlers.get(ipcChannels.devicesList)?.({})).resolves.toEqual({
      devices: [],
      adbStatus: {
        available: false,
        resolvedPath: null,
        source: 'missing',
        error: 'ADB missing'
      }
    });
    expect(listDevicesMock).not.toHaveBeenCalled();
  });
});
