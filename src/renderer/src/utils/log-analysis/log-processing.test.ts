import { describe, expect, it } from 'vitest';
import type { LogEntry } from '@shared/types';
import { processLogsForRender } from '@renderer/utils/log-analysis/log-processing';

const makeLog = (overrides: Partial<LogEntry>): LogEntry => ({
  id: 'log-1',
  sequence: 1,
  deviceId: 'device-1',
  raw: '04-05 09:00:00.000  100  200 I ActivityManager: ready',
  monthDay: '04-05',
  time: '09:00:00.000',
  pid: 100,
  tid: 200,
  level: 'I',
  tag: 'ActivityManager',
  message: 'ready',
  emphasis: 'normal',
  receivedAt: '2026-04-05T09:00:00.000Z',
  ...overrides
});

describe('processLogsForRender', () => {
  it('always enriches logs even when grouping is disabled', () => {
    const result = processLogsForRender(
      [
        makeLog({
          level: 'E',
          message: 'FATAL EXCEPTION: main java.lang.NullPointerException'
        })
      ],
      {
        enableGrouping: false,
        enableHighlight: false
      }
    );

    expect(result.groupedLogs).toEqual([]);
    expect(result.enrichedLogs).toHaveLength(1);
    expect(result.enrichedLogs[0]).toMatchObject({
      severity: 'error',
      highlight: true,
      category: 'NullPointerException'
    });
  });

  it('returns grouped logs when grouping is enabled', () => {
    const result = processLogsForRender(
      [
        makeLog({
          id: 'log-1',
          sequence: 1,
          message: 'Timeout after 1200ms',
          level: 'W',
          receivedAt: '2026-04-05T09:00:00.000Z'
        }),
        makeLog({
          id: 'log-2',
          sequence: 2,
          message: 'Timeout after 980ms',
          level: 'W',
          receivedAt: '2026-04-05T09:00:01.000Z'
        })
      ],
      {
        enableGrouping: true,
        enableHighlight: true
      }
    );

    expect(result.groupedLogs).toHaveLength(1);
    expect(result.groupedLogs[0]).toMatchObject({
      count: 2
    });
    expect(result.enrichedLogs).toHaveLength(2);
  });
});
