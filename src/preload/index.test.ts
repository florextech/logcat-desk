import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ipcChannels } from '@shared/ipc';
import type { RendererApi } from '@shared/types';

const { exposeInMainWorldMock, invokeMock, onMock, removeListenerMock } = vi.hoisted(() => ({
  exposeInMainWorldMock: vi.fn(),
  invokeMock: vi.fn(),
  onMock: vi.fn(),
  removeListenerMock: vi.fn()
}));

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: exposeInMainWorldMock
  },
  ipcRenderer: {
    invoke: invokeMock,
    on: onMock,
    removeListener: removeListenerMock
  }
}));

describe('preload api exposure', () => {
  beforeEach(() => {
    exposeInMainWorldMock.mockReset();
    invokeMock.mockReset();
    onMock.mockReset();
    removeListenerMock.mockReset();
    vi.resetModules();
  });

  it('exposes the renderer api in the main world', async () => {
    await import('./index');

    expect(exposeInMainWorldMock).toHaveBeenCalledTimes(1);

    const [, api] = exposeInMainWorldMock.mock.calls[0] as [string, RendererApi];
    expect(exposeInMainWorldMock.mock.calls[0]?.[0]).toBe('logcatDesk');

    api.getSettings();
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.settingsGet);

    api.updateSettings({ locale: 'en' });
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.settingsUpdate, { locale: 'en' });

    api.getAdbStatus();
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.adbStatusGet);

    api.listDevices();
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.devicesList);

    api.startLogcat({ deviceId: 'device-1' });
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.logcatStart, { deviceId: 'device-1' });

    api.stopLogcat();
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.logcatStop);

    api.pauseLogcat();
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.logcatPause);

    api.resumeLogcat();
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.logcatResume);

    api.clearLogcatBuffer({ deviceId: 'device-1' });
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.logcatClearBuffer, { deviceId: 'device-1' });

    api.checkForUpdates();
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.updatesCheck);

    api.exportLogs({ scope: 'visible', format: 'txt', suggestedName: 'capture' });
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.exportLogs, {
      scope: 'visible',
      format: 'txt',
      suggestedName: 'capture'
    });

    api.enhanceAnalysisSummary({
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
    });
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.analysisEnhanceSummary, {
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
    });

    api.askAnalysisAssistant({
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
      question: 'Why is this failing?',
      history: [{ role: 'assistant', content: 'Previous response' }]
    });
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.analysisAskAssistant, {
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
      question: 'Why is this failing?',
      history: [{ role: 'assistant', content: 'Previous response' }]
    });

    api.copyToClipboard('copied');
    expect(invokeMock).toHaveBeenCalledWith(ipcChannels.clipboardCopy, 'copied');

    const logListener = vi.fn();
    const unsubscribeLogs: () => void = api.onLogBatch(logListener);
    const wrappedLogHandler = onMock.mock.calls[0]?.[1];
    wrappedLogHandler?.({}, { entries: [{ id: '1' }] });
    expect(logListener).toHaveBeenCalledWith({ entries: [{ id: '1' }] });
    unsubscribeLogs();
    expect(removeListenerMock).toHaveBeenCalledWith(ipcChannels.events.logBatch, wrappedLogHandler);

    const stateListener = vi.fn();
    const unsubscribeState: () => void = api.onSessionState(stateListener);
    const wrappedStateHandler = onMock.mock.calls[1]?.[1];
    wrappedStateHandler?.({}, { status: 'streaming' });
    expect(stateListener).toHaveBeenCalledWith({ status: 'streaming' });
    unsubscribeState();
    expect(removeListenerMock).toHaveBeenCalledWith(ipcChannels.events.sessionState, wrappedStateHandler);
  });
});
