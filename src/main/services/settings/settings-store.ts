import { app } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { defaultSettings, type AppSettings } from '@shared/types';

const DEFAULT_AI_CONFIG = defaultSettings.analysis.ai ?? {
  provider: 'openai',
  apiKey: '',
  model: ''
};

export class SettingsStore {
  private readonly filePath = join(app.getPath('userData'), 'settings.json');
  private cachedSettings: AppSettings | null = null;

  async getSettings(): Promise<AppSettings> {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    try {
      const content = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(content) as Partial<AppSettings>;
      this.cachedSettings = this.mergeWithDefaults(parsed);
    } catch {
      this.cachedSettings = defaultSettings;
      await this.persist(this.cachedSettings);
    }

    return this.cachedSettings;
  }

  async update(partial: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const currentAi = current.analysis.ai ?? DEFAULT_AI_CONFIG;
    const nextAiPartial = partial.analysis?.ai;
    const next = this.mergeWithDefaults({
      ...current,
      ...partial,
      filters: {
        ...current.filters,
        ...partial.filters
      },
      logAnalysis: {
        ...current.logAnalysis,
        ...partial.logAnalysis
      },
      analysis: {
        ...current.analysis,
        ...partial.analysis,
        ai: {
          provider: nextAiPartial?.provider ?? currentAi.provider,
          apiKey: nextAiPartial?.apiKey ?? currentAi.apiKey,
          model: nextAiPartial?.model ?? currentAi.model
        }
      }
    });

    this.cachedSettings = next;
    await this.persist(next);
    return next;
  }

  private mergeWithDefaults(partial: Partial<AppSettings>): AppSettings {
    const defaultAi = DEFAULT_AI_CONFIG;
    const partialAi = partial.analysis?.ai;

    return {
      ...defaultSettings,
      ...partial,
      filters: {
        ...defaultSettings.filters,
        ...partial.filters
      },
      logAnalysis: {
        ...defaultSettings.logAnalysis,
        ...partial.logAnalysis
      },
      analysis: {
        ...defaultSettings.analysis,
        ...partial.analysis,
        ai: {
          provider: partialAi?.provider ?? defaultAi.provider,
          apiKey: partialAi?.apiKey ?? defaultAi.apiKey,
          model: partialAi?.model ?? defaultAi.model
        }
      }
    };
  }

  private async persist(settings: AppSettings): Promise<void> {
    const persistedAi = settings.analysis.ai ?? DEFAULT_AI_CONFIG;
    const serialized: AppSettings = {
      ...settings,
      analysis: {
        ...settings.analysis,
        ai: {
          provider: persistedAi.provider,
          apiKey: '',
          model: persistedAi.model ?? ''
        }
      }
    };

    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(serialized, null, 2), 'utf8');
  }
}
