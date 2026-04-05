import { describe, expect, it } from 'vitest';
import type { AnalysisLog } from '@renderer/utils/intelligent-analysis/log-analysis-engine';
import { applyAnalysisRules } from '@renderer/utils/intelligent-analysis/log-analysis-rules';

const makeLog = (overrides: Partial<AnalysisLog>): AnalysisLog => ({
  id: 'log-1',
  sequence: 1,
  deviceId: 'device-1',
  raw: '04-05 11:00:00.000  100  200 I ActivityManager: ready',
  monthDay: '04-05',
  time: '11:00:00.000',
  pid: 100,
  tid: 200,
  level: 'I',
  tag: 'ActivityManager',
  message: 'ready',
  emphasis: 'normal',
  receivedAt: '2026-04-05T11:00:00.000Z',
  severity: 'info',
  highlight: false,
  ...overrides
});

describe('applyAnalysisRules', () => {
  it('detects all configured rule families in English', () => {
    const logs: AnalysisLog[] = [
      makeLog({ id: '1', message: 'java.lang.NullPointerException at Scanner.java:42', severity: 'error' }),
      makeLog({ id: '2', message: 'FATAL EXCEPTION: main', severity: 'error' }),
      makeLog({ id: '3', message: 'ANR in com.example.app', severity: 'error' }),
      makeLog({ id: '4', message: 'Request timed out after 15000ms', severity: 'warning' }),
      makeLog({ id: '5', message: 'Permission denied for camera', severity: 'error' }),
      makeLog({ id: '6', message: 'Fatal signal 11 (SIGSEGV)', severity: 'error' }),
      makeLog({ id: '7', message: 'IllegalStateException: already started', severity: 'error' }),
      makeLog({ id: '8', message: 'network error: failed to connect host unreachable', severity: 'warning' })
    ];

    const matches = applyAnalysisRules(logs, 'en');

    expect(matches.length).toBeGreaterThanOrEqual(8);
    expect(matches.map((item) => item.rule.cause)).toEqual(
      expect.arrayContaining([
        'A null reference is being used before required initialization.',
        'A fatal runtime exception is crashing the app process.',
        'Main thread appears blocked, causing an ANR condition.',
        'An operation exceeded its expected timeout window.',
        'The operation failed due to missing or denied permissions.',
        'Native layer segmentation fault detected.',
        'Code is executing in an invalid lifecycle or state context.',
        'Network communication is failing or unstable.'
      ])
    );
  });

  it('localizes output in Spanish and builds evidence with unknown tag/raw fallback', () => {
    const matches = applyAnalysisRules(
      [
        makeLog({
          tag: '',
          message: '',
          raw: 'socket closed by remote peer',
          receivedAt: '2026-04-05T11:10:00.000Z',
          severity: 'warning'
        })
      ],
      'es'
    );

    expect(matches).toHaveLength(1);
    expect(matches[0]?.rule.cause).toBe('La comunicacion de red esta fallando o es inestable.');
    expect(matches[0]?.rule.recommendation).toContain('reintentos/backoff');
    expect(matches[0]?.evidence).toContain('desconocido');
    expect(matches[0]?.evidence).toContain('socket closed by remote peer');
  });

  it('returns multiple matches for a single log when several patterns match', () => {
    const log = makeLog({
      message: 'ANR detected and timeout while network error with failed to connect',
      severity: 'error'
    });

    const matches = applyAnalysisRules([log], 'en');

    expect(matches.length).toBeGreaterThanOrEqual(3);
    expect(matches.some((item) => item.rule.cause.includes('ANR condition'))).toBe(true);
    expect(matches.some((item) => item.rule.cause.includes('timeout window'))).toBe(true);
    expect(matches.some((item) => item.rule.cause.includes('Network communication'))).toBe(true);
  });
});
