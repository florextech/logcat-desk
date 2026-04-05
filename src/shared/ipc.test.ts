import { describe, expect, it } from 'vitest';
import { ipcChannels } from '@shared/ipc';

describe('ipcChannels', () => {
  it('defines stable invoke channels and event channels', () => {
    expect(ipcChannels.settingsGet).toBe('settings:get');
    expect(ipcChannels.logcatStart).toBe('logcat:start');
    expect(ipcChannels.analysisEnhanceSummary).toBe('analysis:enhance-summary');
    expect(ipcChannels.analysisAskAssistant).toBe('analysis:ask-assistant');
    expect(ipcChannels.events.logBatch).toBe('events:log-batch');
    expect(ipcChannels.events.sessionState).toBe('events:session-state');
  });
});
