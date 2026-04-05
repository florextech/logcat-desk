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
        },
        analysis: {
          enableAIEnhancement: true,
          ai: {
            provider: 'claude',
            apiKey: 'secret-key'
          }
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
      },
      analysis: {
        ...defaultSettings.analysis,
        enableAIEnhancement: true,
        ai: {
          ...defaultSettings.analysis.ai,
          provider: 'claude',
          apiKey: 'secret-key'
        }
      }
    });
    expect(second).toBe(first);
  });

  it('recovers from invalid JSON by restoring defaults', async () => {
    await writeFile(join(tempDir, 'settings.json'), '{ invalid-json', 'utf8');
    const store = new SettingsStore();

    const result = await store.getSettings();
    expect(result).toEqual(defaultSettings);

    const raw = await readFile(join(tempDir, 'settings.json'), 'utf8');
    expect(JSON.parse(raw)).toEqual(defaultSettings);
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

  it('updates nested AI analysis config while preserving provider defaults', async () => {
    const store = new SettingsStore();
    await store.getSettings();

    const updated = await store.update({
      analysis: {
        ...defaultSettings.analysis,
        enableAIEnhancement: true,
        ai: {
          ...defaultSettings.analysis.ai,
          provider: 'openrouter',
          apiKey: 'api-123',
          model: 'openai/gpt-4o-mini'
        }
      }
    });

    expect(updated.analysis).toEqual({
      ...defaultSettings.analysis,
      enableAIEnhancement: true,
      ai: {
        ...defaultSettings.analysis.ai,
        provider: 'openrouter',
        apiKey: 'api-123',
        model: 'openai/gpt-4o-mini'
      }
    });
  });

  it('preserves current AI provider/key when only model override is provided', async () => {
    const store = new SettingsStore();
    await store.getSettings();

    await store.update({
      analysis: {
        ...defaultSettings.analysis,
        ai: {
          ...defaultSettings.analysis.ai,
          provider: 'claude',
          apiKey: 'first-key',
          model: 'claude-3-5-haiku-latest'
        }
      }
    });

    const updated = await store.update({
      analysis: {
        ai: {
          model: 'claude-3-7-sonnet',
          provider: 'claude',
          apiKey: 'first-key'
        },
        enableAnalysis: false,
        enableAIEnhancement: false
      }
    });

    expect(updated.analysis.ai).toEqual({
      provider: 'claude',
      apiKey: 'first-key',
      model: 'claude-3-7-sonnet'
    });
  });

  it('does not persist AI apiKey to disk', async () => {
    const store = new SettingsStore();
    await store.getSettings();

    await store.update({
      analysis: {
        ...defaultSettings.analysis,
        enableAIEnhancement: true,
        ai: {
          ...defaultSettings.analysis.ai,
          provider: 'openai',
          apiKey: 'super-secret',
          model: 'gpt-4.1-mini'
        }
      }
    });

    const rawFile = await readFile(join(tempDir, 'settings.json'), 'utf8');
    const persisted = JSON.parse(rawFile) as typeof defaultSettings;

    expect(persisted.analysis.ai?.apiKey).toBe('');
    expect(persisted.analysis.ai?.provider).toBe('openai');
    expect(persisted.analysis.ai?.model).toBe('gpt-4.1-mini');
  });
});
