import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '@shared/types';
import { ipcChannels } from '@shared/ipc';

const { clipboardWriteTextMock, dialogObject, handleMock, removeHandlerMock, openExternalMock, getVersionMock } = vi.hoisted(() => ({
  clipboardWriteTextMock: vi.fn(),
  dialogObject: {
    showMessageBox: vi.fn()
  },
  handleMock: vi.fn(),
  removeHandlerMock: vi.fn(),
  openExternalMock: vi.fn(),
  getVersionMock: vi.fn(() => '0.1.0')
}));

const {
  clearLogcatBufferMock,
  listDevicesMock,
  resolveAdbStatusMock,
  enhanceAnalysisSummaryMock,
  askAnalysisAssistantMock
} = vi.hoisted(() => ({
  clearLogcatBufferMock: vi.fn(),
  listDevicesMock: vi.fn(),
  resolveAdbStatusMock: vi.fn(),
  enhanceAnalysisSummaryMock: vi.fn(),
  askAnalysisAssistantMock: vi.fn()
}));

vi.mock('electron', () => ({
  app: {
    getVersion: getVersionMock
  },
  clipboard: {
    writeText: clipboardWriteTextMock
  },
  dialog: dialogObject,
  shell: {
    openExternal: openExternalMock
  },
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

vi.mock('@main/services/analysis/analysis-ai-service', () => ({
  enhanceAnalysisSummary: enhanceAnalysisSummaryMock,
  askAnalysisAssistant: askAnalysisAssistantMock
}));

import { registerIpc } from '@main/ipc/register-ipc';

describe('registerIpc', () => {
  beforeEach(() => {
    clipboardWriteTextMock.mockReset();
    clearLogcatBufferMock.mockReset();
    listDevicesMock.mockReset();
    resolveAdbStatusMock.mockReset();
    enhanceAnalysisSummaryMock.mockReset();
    askAnalysisAssistantMock.mockReset();
    handleMock.mockReset();
    removeHandlerMock.mockReset();
    dialogObject.showMessageBox.mockReset();
    openExternalMock.mockReset();
    getVersionMock.mockReset();
    getVersionMock.mockReturnValue('0.1.0');
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
    const updateService = {
      checkLatestRelease: vi.fn().mockResolvedValue({
        currentVersion: '0.1.0',
        latestVersion: '0.1.0',
        hasUpdate: false,
        releaseUrl: 'https://github.com/florextech/logcat-desk/releases/latest'
      })
    };

    resolveAdbStatusMock.mockResolvedValue({
      available: true,
      resolvedPath: '/resolved/adb',
      source: 'settings'
    });
    listDevicesMock.mockResolvedValue([{ id: 'device-1', state: 'device' }]);
    enhanceAnalysisSummaryMock.mockResolvedValue('enhanced summary');
    askAnalysisAssistantMock.mockResolvedValue('assistant answer');

    registerIpc({
      mainWindow: mainWindow as never,
      settingsStore: settingsStore as never,
      sessionManager: sessionManager as never,
      exportService: exportService as never,
      updateService: updateService as never
    });

    expect(removeHandlerMock).toHaveBeenCalled();
    expect(handlers.has(ipcChannels.settingsGet)).toBe(true);
    expect(handlers.has(ipcChannels.logcatStart)).toBe(true);
    expect(handlers.has(ipcChannels.analysisEnhanceSummary)).toBe(true);
    expect(handlers.has(ipcChannels.analysisAskAssistant)).toBe(true);
    expect(handlers.has(ipcChannels.updatesCheck)).toBe(true);

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

    await expect(handlers.get(ipcChannels.updatesCheck)?.({})).resolves.toEqual({
      currentVersion: '0.1.0',
      latestVersion: '0.1.0',
      hasUpdate: false,
      releaseUrl: 'https://github.com/florextech/logcat-desk/releases/latest'
    });
    expect(updateService.checkLatestRelease).toHaveBeenCalledWith('0.1.0');
    expect(dialogObject.showMessageBox).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'Sin actualizaciones',
        buttons: ['Cerrar']
      })
    );

    await expect(
      handlers.get(ipcChannels.exportLogs)?.({}, { scope: 'visible', format: 'txt', suggestedName: 'demo' })
    ).resolves.toEqual({ canceled: false, filePath: '/tmp/logs.txt' });

    await expect(
      handlers.get(ipcChannels.analysisEnhanceSummary)?.({}, {
        base: {
          summary: 'summary',
          probableCauses: [],
          evidence: [],
          recommendations: [],
          severity: 'low'
        },
        config: {
          enableAnalysis: true,
          enableAIEnhancement: true,
          ai: { provider: 'openai', apiKey: 'key' }
        },
        locale: 'en'
      })
    ).resolves.toBe('enhanced summary');
    expect(enhanceAnalysisSummaryMock).toHaveBeenCalledTimes(1);

    await expect(
      handlers.get(ipcChannels.analysisAskAssistant)?.({}, {
        analysis: {
          summary: 'summary',
          probableCauses: [],
          evidence: [],
          recommendations: [],
          severity: 'low'
        },
        config: {
          enableAnalysis: true,
          enableAIEnhancement: true,
          ai: { provider: 'openai', apiKey: 'key' }
        },
        locale: 'en',
        question: 'What should I do next?',
        history: [{ role: 'assistant', content: 'Previous answer' }]
      })
    ).resolves.toBe('assistant answer');
    expect(askAnalysisAssistantMock).toHaveBeenCalledTimes(1);

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
      exportService: { exportWithDialog: vi.fn() } as never,
      updateService: { checkLatestRelease: vi.fn() } as never
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

  it('opens the release URL when an update is available and the user confirms', async () => {
    const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
    handleMock.mockImplementation((channel: string, fn: (...args: unknown[]) => Promise<unknown>) => {
      handlers.set(channel, fn);
    });
    dialogObject.showMessageBox.mockResolvedValue({ response: 0 });

    registerIpc({
      mainWindow: { webContents: { send: vi.fn() } } as never,
      settingsStore: { getSettings: vi.fn().mockResolvedValue({ ...defaultSettings, locale: 'es' }) } as never,
      sessionManager: { on: vi.fn() } as never,
      exportService: { exportWithDialog: vi.fn() } as never,
      updateService: {
        checkLatestRelease: vi.fn().mockResolvedValue({
          currentVersion: '0.1.0',
          latestVersion: '0.2.0',
          hasUpdate: true,
          releaseUrl: 'https://github.com/florextech/logcat-desk/releases/tag/v0.2.0'
        })
      } as never
    });

    await expect(handlers.get(ipcChannels.updatesCheck)?.({})).resolves.toMatchObject({
      hasUpdate: true,
      latestVersion: '0.2.0'
    });
    expect(dialogObject.showMessageBox).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        title: 'Actualizacion disponible'
      })
    );
    expect(openExternalMock).toHaveBeenCalledWith(
      'https://github.com/florextech/logcat-desk/releases/tag/v0.2.0'
    );
  });

  it('does not open release URL when update dialog is canceled', async () => {
    const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
    handleMock.mockImplementation((channel: string, fn: (...args: unknown[]) => Promise<unknown>) => {
      handlers.set(channel, fn);
    });
    dialogObject.showMessageBox.mockResolvedValue({ response: 1 });

    registerIpc({
      mainWindow: { webContents: { send: vi.fn() } } as never,
      settingsStore: { getSettings: vi.fn().mockResolvedValue({ ...defaultSettings, locale: 'en' }) } as never,
      sessionManager: { on: vi.fn() } as never,
      exportService: { exportWithDialog: vi.fn() } as never,
      updateService: {
        checkLatestRelease: vi.fn().mockResolvedValue({
          currentVersion: '0.1.0',
          latestVersion: '0.2.0',
          hasUpdate: true,
          releaseUrl: 'https://github.com/florextech/logcat-desk/releases/tag/v0.2.0'
        })
      } as never
    });

    await handlers.get(ipcChannels.updatesCheck)?.({});
    expect(openExternalMock).not.toHaveBeenCalled();
  });

  it('shows error dialog and rethrows when update check fails with an Error', async () => {
    const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
    handleMock.mockImplementation((channel: string, fn: (...args: unknown[]) => Promise<unknown>) => {
      handlers.set(channel, fn);
    });
    dialogObject.showMessageBox.mockResolvedValue({ response: 0 });

    registerIpc({
      mainWindow: { webContents: { send: vi.fn() } } as never,
      settingsStore: { getSettings: vi.fn().mockResolvedValue({ ...defaultSettings, locale: 'en' }) } as never,
      sessionManager: { on: vi.fn() } as never,
      exportService: { exportWithDialog: vi.fn() } as never,
      updateService: { checkLatestRelease: vi.fn().mockRejectedValue(new Error('network down')) } as never
    });

    await expect(handlers.get(ipcChannels.updatesCheck)?.({})).rejects.toThrow('network down');
    expect(dialogObject.showMessageBox).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'error',
        title: 'Failed to check for updates',
        message: 'network down',
        buttons: ['Close']
      })
    );
  });

  it('uses localized fallback message when update check fails with a non-Error value', async () => {
    const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
    handleMock.mockImplementation((channel: string, fn: (...args: unknown[]) => Promise<unknown>) => {
      handlers.set(channel, fn);
    });
    dialogObject.showMessageBox.mockResolvedValue({ response: 0 });

    registerIpc({
      mainWindow: { webContents: { send: vi.fn() } } as never,
      settingsStore: { getSettings: vi.fn().mockResolvedValue({ ...defaultSettings, locale: 'es' }) } as never,
      sessionManager: { on: vi.fn() } as never,
      exportService: { exportWithDialog: vi.fn() } as never,
      updateService: { checkLatestRelease: vi.fn().mockRejectedValue('boom') } as never
    });

    await expect(handlers.get(ipcChannels.updatesCheck)?.({})).rejects.toBe('boom');
    expect(dialogObject.showMessageBox).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'error',
        title: 'Error al buscar actualizaciones',
        message: 'No se pudo completar la verificacion de actualizaciones.',
        buttons: ['Cerrar']
      })
    );
  });

  it('throws when starting logcat without a valid adb binary', async () => {
    const handlers = new Map<string, (...args: unknown[]) => Promise<unknown>>();
    handleMock.mockImplementation((channel: string, fn: (...args: unknown[]) => Promise<unknown>) => {
      handlers.set(channel, fn);
    });

    resolveAdbStatusMock.mockResolvedValue({
      available: false,
      resolvedPath: null,
      source: 'missing',
      error: 'ADB missing'
    });

    const sessionManager = {
      on: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getState: vi.fn().mockReturnValue({ status: 'idle', deviceId: null })
    };

    registerIpc({
      mainWindow: { webContents: { send: vi.fn() } } as never,
      settingsStore: { getSettings: vi.fn().mockResolvedValue(defaultSettings), update: vi.fn() } as never,
      sessionManager: sessionManager as never,
      exportService: { exportWithDialog: vi.fn() } as never,
      updateService: { checkLatestRelease: vi.fn() } as never
    });

    await expect(handlers.get(ipcChannels.logcatStart)?.({}, { deviceId: 'device-1' })).rejects.toThrow(
      'ADB missing'
    );
    expect(sessionManager.start).not.toHaveBeenCalled();
  });
});
