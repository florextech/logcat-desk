import { describe, expect, it } from 'vitest';
import type { AnalysisLog } from '@renderer/utils/intelligent-analysis/log-analysis-engine';
import { aggregateLogAnalysis } from '@renderer/utils/intelligent-analysis/log-analysis-aggregator';
import { applyAnalysisRules } from '@renderer/utils/intelligent-analysis/log-analysis-rules';

const makeLog = (overrides: Partial<AnalysisLog>): AnalysisLog => ({
  id: 'log-1',
  sequence: 1,
  deviceId: 'device-1',
  raw: '04-05 12:00:00.000  100  200 I ActivityManager: ready',
  monthDay: '04-05',
  time: '12:00:00.000',
  pid: 100,
  tid: 200,
  level: 'I',
  tag: 'ActivityManager',
  message: 'ready',
  emphasis: 'normal',
  receivedAt: '2026-04-05T12:00:00.000Z',
  severity: 'info',
  highlight: false,
  ...overrides
});

describe('aggregateLogAnalysis', () => {
  it('returns no-logs summary when input is empty', () => {
    const result = aggregateLogAnalysis([], [], 'en');

    expect(result).toEqual({
      summary: 'No logs available to analyze.',
      probableCauses: [],
      evidence: [],
      recommendations: ['Start a logcat session and collect logs before running analysis.'],
      severity: 'low'
    });
  });

  it('builds heuristic diagnostics without rule matches in Spanish', () => {
    const logs: AnalysisLog[] = [
      makeLog({
        id: '1',
        severity: 'warning',
        message: 'Caused by: Parse Proto Exception with response code 400',
        tag: 'GLSUser'
      }),
      makeLog({
        id: '2',
        sequence: 2,
        severity: 'warning',
        message: 'socket failed with errno=-9',
        tag: ''
      })
    ];

    const result = aggregateLogAnalysis(logs, [], 'es');

    expect(result.severity).toBe('medium');
    expect(result.probableCauses.join(' ')).toContain('carga o parametros');
    expect(result.probableCauses.join(' ')).toContain('inestabilidad de transporte');
    expect(result.recommendations.length).toBeGreaterThanOrEqual(2);
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.summary).toContain('Causa posible');
  });

  it('falls back to generic no-pattern cause when heuristics do not match', () => {
    const logs = [
      makeLog({
        id: '1',
        severity: 'info',
        message: 'plain info line',
        tag: ''
      })
    ];

    const result = aggregateLogAnalysis(logs, [], 'en');

    expect(result.probableCauses).toEqual([
      'No matching rule signatures found in the current log set.'
    ]);
    expect(result.recommendations).toEqual([
      'Review highlighted logs manually for project-specific failures.',
      'Add a custom rule for repeated patterns in your domain.'
    ]);
    expect(result.evidence).toHaveLength(1);
    expect(result.summary).toContain('No known critical patterns detected');
  });

  it('aggregates matched rules, deduplicates recommendations/evidence, and limits evidence to 20', () => {
    const logs: AnalysisLog[] = Array.from({ length: 26 }, (_, index) =>
      makeLog({
        id: `fatal-${index + 1}`,
        sequence: index + 1,
        severity: 'error',
        level: 'E',
        tag: 'AndroidRuntime',
        message: 'FATAL EXCEPTION: main',
        monthDay: undefined,
        time: undefined,
        receivedAt: `2026-04-05T12:${String(index).padStart(2, '0')}:00.000Z`,
        raw: `04-05 12:00:${String(index).padStart(2, '0')}.000  100  200 E AndroidRuntime: FATAL EXCEPTION: main`
      })
    );

    const matches = applyAnalysisRules(logs, 'en');
    const result = aggregateLogAnalysis(logs, matches, 'en');

    expect(result.severity).toBe('critical');
    expect(result.probableCauses[0]).toBe('A fatal runtime exception is crashing the app process.');
    expect(result.recommendations).toEqual([
      'Inspect the stack trace and fix the top failing frame first.'
    ]);
    expect(result.evidence.length).toBe(20);
    expect(new Set(result.evidence).size).toBe(result.evidence.length);
  });

  it('escalates severity to high for repeated unmatched errors and to medium for warnings', () => {
    const repeatedErrors = [
      makeLog({ id: 'e1', sequence: 1, severity: 'error', level: 'E', message: 'err one' }),
      makeLog({ id: 'e2', sequence: 2, severity: 'error', level: 'E', message: 'err two' }),
      makeLog({ id: 'e3', sequence: 3, severity: 'error', level: 'E', message: 'err three' })
    ];

    const warningsOnly = [
      makeLog({ id: 'w1', sequence: 1, severity: 'warning', level: 'W', message: 'warn one' })
    ];

    expect(aggregateLogAnalysis(repeatedErrors, [], 'en').severity).toBe('high');
    expect(aggregateLogAnalysis(warningsOnly, [], 'en').severity).toBe('medium');
  });

  it('forces critical severity when crash signals appear even with lower rule severity', () => {
    const logs = [
      makeLog({
        id: '1',
        severity: 'warning',
        level: 'W',
        message: 'timeout waiting response',
        raw: 'crash detected in native layer'
      })
    ];

    const matches = applyAnalysisRules(logs, 'en');
    const result = aggregateLogAnalysis(logs, matches, 'en');

    expect(matches.some((entry) => entry.rule.cause.includes('timeout'))).toBe(true);
    expect(result.severity).toBe('critical');
  });
});
