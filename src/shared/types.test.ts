import { describe, expect, it } from 'vitest';
import {
  LOG_LEVELS,
  defaultAnalysisConfig,
  defaultFilters,
  defaultLogAnalysisConfig,
  defaultSettings
} from '@shared/types';

describe('shared types defaults', () => {
  it('exposes the supported log levels', () => {
    expect(LOG_LEVELS).toEqual(['V', 'D', 'I', 'W', 'E', 'F']);
  });

  it('defines empty default filters', () => {
    expect(defaultFilters).toEqual({
      text: '',
      tag: '',
      packageName: '',
      minLevel: 'ALL',
      search: ''
    });
  });

  it('defines default app settings with spanish locale', () => {
    expect(defaultSettings).toEqual({
      adbPath: '',
      autoScroll: true,
      lastDeviceId: null,
      locale: 'es',
      filters: defaultFilters,
      logAnalysis: defaultLogAnalysisConfig,
      analysis: defaultAnalysisConfig
    });
  });
});
