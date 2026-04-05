import { describe, expect, it, vi } from 'vitest';
import type { EnrichedLog } from '@renderer/utils/log-analysis/types';
import { groupLogs } from '@renderer/utils/log-analysis/log-grouping';

const makeLog = (
  id: string,
  message: string,
  receivedAt: string,
  overrides: Partial<EnrichedLog> = {}
): EnrichedLog => ({
  id,
  sequence: Number(id.replace('log-', '')),
  deviceId: 'device-1',
  raw: message,
  level: 'E',
  tag: 'AndroidRuntime',
  message,
  emphasis: 'critical',
  receivedAt,
  severity: 'error',
  highlight: true,
  ...overrides
});

describe('log grouping', () => {
  it('groups similar logs even when volatile numbers differ', () => {
    const groups = groupLogs([
      makeLog('log-1', 'Request failed for userId=1001 after 1200ms', '2026-04-01T17:00:00.000Z'),
      makeLog('log-2', 'Request failed for userId=1002 after 8999ms', '2026-04-01T17:00:02.000Z')
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      count: 2,
      message: 'Request failed for userId=1001 after 1200ms'
    });
    expect(groups[0]?.logs).toHaveLength(2);
  });

  it('keeps firstSeen/lastSeen and separates different error families', () => {
    const groups = groupLogs([
      makeLog('log-1', 'NullPointerException at MainActivity:42', '2026-04-01T17:00:00.000Z'),
      makeLog('log-2', 'IllegalStateException in FragmentManager', '2026-04-01T17:00:01.000Z'),
      makeLog('log-3', 'NullPointerException at MainActivity:87', '2026-04-01T17:00:05.000Z')
    ]);

    expect(groups).toHaveLength(2);

    const npeGroup = groups.find((group) => group.message.includes('NullPointerException'));
    expect(npeGroup).toBeDefined();
    expect(npeGroup?.count).toBe(2);
    expect(npeGroup?.firstSeen).toBe(Date.parse('2026-04-01T17:00:00.000Z'));
    expect(npeGroup?.lastSeen).toBe(Date.parse('2026-04-01T17:00:05.000Z'));
  });

  it('falls back to raw content and current time when message/timestamp are invalid', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_717_171_717_000);

    try {
      const groups = groupLogs([
        makeLog('log-9', 'raw-only', 'invalid-date', {
          message: '',
          raw: 'raw-only'
        })
      ]);

      expect(groups).toHaveLength(1);
      expect(groups[0]?.message).toBe('raw-only');
      expect(groups[0]?.firstSeen).toBe(1_717_171_717_000);
      expect(groups[0]?.lastSeen).toBe(1_717_171_717_000);
    } finally {
      nowSpy.mockRestore();
    }
  });
});
