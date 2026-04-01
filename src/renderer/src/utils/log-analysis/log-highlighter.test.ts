import { describe, expect, it } from 'vitest';
import type { LogEntry } from '@shared/types';
import { enrichLog } from '@renderer/utils/log-analysis/log-highlighter';

const makeLog = (overrides: Partial<LogEntry>): LogEntry => ({
  id: 'log-1',
  sequence: 1,
  deviceId: 'device-1',
  raw: '03-27 10:00:00.000  100  200 I TestTag: sample',
  level: 'I',
  tag: 'TestTag',
  message: 'sample',
  emphasis: 'normal',
  receivedAt: '2026-04-01T17:00:00.000Z',
  ...overrides
});

describe('log highlighter', () => {
  it('classifies known critical patterns as error and highlights them', () => {
    const enriched = enrichLog(
      makeLog({
        level: 'I',
        message: 'java.lang.NullPointerException at com.example.MainActivity'
      })
    );

    expect(enriched.severity).toBe('error');
    expect(enriched.highlight).toBe(true);
    expect(enriched.category).toBe('NullPointerException');
  });

  it('classifies timeout patterns as warning', () => {
    const enriched = enrichLog(makeLog({ message: 'Request timeout after 3000ms' }));

    expect(enriched.severity).toBe('warning');
    expect(enriched.highlight).toBe(true);
    expect(enriched.category).toBe('Timeout');
  });

  it('falls back to log level and emphasis when no category matches', () => {
    const enriched = enrichLog(makeLog({ level: 'D', message: 'Rendering started' }));

    expect(enriched.severity).toBe('info');
    expect(enriched.highlight).toBe(false);
    expect(enriched.category).toBeUndefined();
  });
});
