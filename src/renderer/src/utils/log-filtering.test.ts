import { describe, expect, it } from 'vitest';
import type { FilterState, LogEntry } from '@shared/types';
import { filterLogs } from '@renderer/utils/log-filtering';

const baseFilters: FilterState = {
  text: '',
  tag: '',
  packageName: '',
  minLevel: 'ALL',
  search: ''
};

const logs: LogEntry[] = [
  {
    id: '1',
    sequence: 1,
    deviceId: 'device-1',
    raw: '03-27 13:00:00.123 100 200 E AndroidRuntime: fatal exception com.demo',
    level: 'E',
    tag: 'AndroidRuntime',
    message: 'fatal exception',
    emphasis: 'critical',
    receivedAt: '2026-03-27T13:00:00.000Z'
  },
  {
    id: '2',
    sequence: 2,
    deviceId: 'device-1',
    raw: '03-27 13:00:00.456 101 201 I OkHttp: request finished com.network',
    level: 'I',
    tag: 'OkHttp',
    message: 'request finished',
    emphasis: 'normal',
    receivedAt: '2026-03-27T13:00:00.000Z'
  }
];

describe('filterLogs', () => {
  it('returns all logs when no filters are active', () => {
    expect(filterLogs(logs, baseFilters)).toEqual(logs);
  });

  it('filters by exact severity', () => {
    expect(filterLogs(logs, { ...baseFilters, minLevel: 'E' })).toEqual([logs[0]]);
  });

  it('matches free text against raw line and message', () => {
    expect(filterLogs(logs, { ...baseFilters, text: 'request' })).toEqual([logs[1]]);
  });

  it('matches tag case-insensitively', () => {
    expect(filterLogs(logs, { ...baseFilters, tag: 'android' })).toEqual([logs[0]]);
  });

  it('matches package text against the raw log line', () => {
    expect(filterLogs(logs, { ...baseFilters, packageName: 'com.network' })).toEqual([logs[1]]);
  });
});
