import { beforeEach, describe, expect, it } from 'vitest';
import { defaultSettings, type LogEntry } from '@shared/types';
import { useAppStore } from '@renderer/store/app-store';

const makeLog = (sequence: number): LogEntry => ({
  id: `log-${sequence}`,
  sequence,
  deviceId: 'device-1',
  raw: `raw-${sequence}`,
  level: 'I',
  tag: 'Tag',
  message: `message-${sequence}`,
  emphasis: 'normal',
  receivedAt: new Date().toISOString()
});

describe('app store', () => {
  beforeEach(() => {
    useAppStore.setState({
      adbStatus: {
        available: false,
        resolvedPath: null,
        source: 'missing'
      },
      devices: [],
      logs: [],
      filters: defaultSettings.filters,
      settings: defaultSettings,
      selectedDeviceId: null,
      sessionState: {
        status: 'idle',
        deviceId: null
      },
      error: null
    });
  });

  it('selects a preferred device when the current one is unavailable', () => {
    useAppStore.getState().setDevices(
      [
        { id: 'b-device', state: 'device' },
        { id: 'a-device', state: 'device' }
      ],
      'a-device'
    );

    expect(useAppStore.getState().selectedDeviceId).toBe('a-device');
  });

  it('falls back to the first device when none is selected', () => {
    useAppStore.getState().setDevices([{ id: 'device-1', state: 'device' }]);

    expect(useAppStore.getState().selectedDeviceId).toBe('device-1');
  });

  it('keeps the current device when it still exists in the refreshed list', () => {
    useAppStore.setState({ selectedDeviceId: 'device-2' });

    useAppStore.getState().setDevices([
      { id: 'device-1', state: 'device' },
      { id: 'device-2', state: 'device' }
    ]);

    expect(useAppStore.getState().selectedDeviceId).toBe('device-2');
  });

  it('keeps only the most recent rendered logs', () => {
    useAppStore.getState().appendLogs(Array.from({ length: 5003 }, (_, index) => makeLog(index + 1)));

    const logs = useAppStore.getState().logs;
    expect(logs).toHaveLength(5000);
    expect(logs[0]?.id).toBe('log-4');
    expect(logs.at(-1)?.id).toBe('log-5003');
  });

  it('merges filters and updates auto-scroll', () => {
    useAppStore.getState().setFilters({ text: 'crash', minLevel: 'E' });
    useAppStore.getState().setAutoScroll(false);
    useAppStore.getState().setLogAnalysis({ enableGrouping: true });

    expect(useAppStore.getState().filters).toMatchObject({
      text: 'crash',
      minLevel: 'E'
    });
    expect(useAppStore.getState().settings.autoScroll).toBe(false);
    expect(useAppStore.getState().settings.logAnalysis).toEqual({
      ...defaultSettings.logAnalysis,
      enableGrouping: true
    });
  });

  it('updates adb status, session state, selected device and error state', () => {
    useAppStore.getState().setAdbStatus({
      available: true,
      resolvedPath: '/usr/bin/adb',
      source: 'path'
    });
    useAppStore.getState().setSessionState({
      status: 'streaming',
      deviceId: 'device-1',
      message: 'Streaming logcat'
    });
    useAppStore.getState().selectDevice('device-1');
    useAppStore.getState().setError('boom');

    expect(useAppStore.getState().adbStatus.available).toBe(true);
    expect(useAppStore.getState().sessionState.status).toBe('streaming');
    expect(useAppStore.getState().selectedDeviceId).toBe('device-1');
    expect(useAppStore.getState().error).toBe('boom');

    useAppStore.getState().clearError();
    expect(useAppStore.getState().error).toBeNull();
  });

  it('applies settings to filters and selected device', () => {
    useAppStore.getState().setSettings({
      ...defaultSettings,
      locale: 'en',
      lastDeviceId: 'device-9',
      filters: {
        ...defaultSettings.filters,
        tag: 'OkHttp'
      }
    });

    expect(useAppStore.getState().selectedDeviceId).toBe('device-9');
    expect(useAppStore.getState().filters.tag).toBe('OkHttp');
    expect(useAppStore.getState().settings.locale).toBe('en');
  });

  it('clears logs explicitly', () => {
    useAppStore.getState().appendLogs([makeLog(1), makeLog(2)]);
    expect(useAppStore.getState().logs).toHaveLength(2);

    useAppStore.getState().clearLogs();
    expect(useAppStore.getState().logs).toEqual([]);
  });
});
