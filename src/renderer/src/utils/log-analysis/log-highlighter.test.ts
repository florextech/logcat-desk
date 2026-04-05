import { describe, expect, it } from 'vitest';
import type { LogEntry } from '@shared/types';
import { enrichLog, enrichLogs } from '@renderer/utils/log-analysis/log-highlighter';

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

  it('maps warning level to warning severity when no category is detected', () => {
    const enriched = enrichLog(makeLog({ level: 'W', message: 'Slow response from service' }));

    expect(enriched.severity).toBe('warning');
    expect(enriched.highlight).toBe(true);
    expect(enriched.category).toBeUndefined();
  });

  it('maps error and fatal levels to error severity when no category is detected', () => {
    const errorLog = enrichLog(makeLog({ level: 'E', message: 'Operation failed due to status code' }));
    const fatalLog = enrichLog(makeLog({ level: 'F', message: 'Process exited unexpectedly' }));

    expect(errorLog.severity).toBe('error');
    expect(fatalLog.severity).toBe('error');
    expect(errorLog.highlight).toBe(true);
    expect(fatalLog.highlight).toBe(true);
  });

  it('prioritizes emphasis mapping when no category matches', () => {
    const warningEmphasis = enrichLog(
      makeLog({ level: 'I', emphasis: 'warning', message: 'Slow branch completed' })
    );
    const criticalEmphasis = enrichLog(
      makeLog({ level: 'I', emphasis: 'critical', message: 'Critical branch completed' })
    );

    expect(warningEmphasis.severity).toBe('warning');
    expect(criticalEmphasis.severity).toBe('error');
  });

  it('uses raw text when message is empty and supports list enrichment', () => {
    const [first, second] = enrichLogs([
      makeLog({ message: '', raw: 'FATAL signal from raw payload' }),
      makeLog({ message: '', raw: 'normal raw payload without category', level: 'D' })
    ]);

    expect(first?.category).toBe('FATAL');
    expect(first?.severity).toBe('error');
    expect(second?.severity).toBe('info');
    expect(second?.highlight).toBe(false);
  });
});
