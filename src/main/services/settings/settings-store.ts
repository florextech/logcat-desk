import { app } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { defaultSettings, type AppSettings } from '@shared/types';

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
    const next = this.mergeWithDefaults({
      ...current,
      ...partial,
      filters: {
        ...current.filters,
        ...partial.filters
      }
    });

    this.cachedSettings = next;
    await this.persist(next);
    return next;
  }

  private mergeWithDefaults(partial: Partial<AppSettings>): AppSettings {
    return {
      ...defaultSettings,
      ...partial,
      filters: {
        ...defaultSettings.filters,
        ...partial.filters
      }
    };
  }

  private async persist(settings: AppSettings): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(settings, null, 2), 'utf8');
  }
}
