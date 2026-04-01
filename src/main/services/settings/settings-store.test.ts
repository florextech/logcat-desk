import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '@shared/types';

const { getPathMock } = vi.hoisted(() => ({
  getPathMock: vi.fn()
}));

vi.mock('electron', () => ({
  app: {
    getPath: getPathMock
  }
}));

import { SettingsStore } from '@main/services/settings/settings-store';

describe('SettingsStore', () => {
  let tempDir = '';

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'logcat-desk-settings-'));
    getPathMock.mockReset();
    getPathMock.mockReturnValue(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('persists defaults when the settings file does not exist', async () => {
    const store = new SettingsStore();

    await expect(store.getSettings()).resolves.toEqual(defaultSettings);
    await expect(readFile(join(tempDir, 'settings.json'), 'utf8')).resolves.toBe(
      JSON.stringify(defaultSettings, null, 2)
    );
  });

  it('merges persisted values with defaults and caches the result', async () => {
    await writeFile(
      join(tempDir, 'settings.json'),
      JSON.stringify({
        adbPath: '/custom/adb',
        locale: 'en',
        filters: {
          text: 'crash'
        },
        logAnalysis: {
          enableGrouping: true
        }
      }),
      'utf8'
    );

    const store = new SettingsStore();
    const first = await store.getSettings();
    const second = await store.getSettings();

    expect(first).toEqual({
      ...defaultSettings,
      adbPath: '/custom/adb',
      locale: 'en',
      filters: {
        ...defaultSettings.filters,
        text: 'crash'
      },
      logAnalysis: {
        ...defaultSettings.logAnalysis,
        enableGrouping: true
      }
    });
    expect(second).toBe(first);
  });

  it('updates nested filters while preserving other settings', async () => {
    const store = new SettingsStore();
    await store.getSettings();

    const updated = await store.update({
      locale: 'en',
      filters: {
        ...defaultSettings.filters,
        minLevel: 'E'
      }
    });

    expect(updated).toEqual({
      ...defaultSettings,
      locale: 'en',
      filters: {
        ...defaultSettings.filters,
        minLevel: 'E'
      }
    });

    await expect(readFile(join(tempDir, 'settings.json'), 'utf8')).resolves.toBe(
      JSON.stringify(updated, null, 2)
    );
  });

  it('updates nested log-analysis settings while preserving other flags', async () => {
    const store = new SettingsStore();
    await store.getSettings();

    const updated = await store.update({
      logAnalysis: {
        ...defaultSettings.logAnalysis,
        enableGrouping: true
      }
    });

    expect(updated).toEqual({
      ...defaultSettings,
      logAnalysis: {
        ...defaultSettings.logAnalysis,
        enableGrouping: true
      }
    });
  });
});
