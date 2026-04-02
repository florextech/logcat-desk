import { describe, expect, it } from 'vitest';
import type { EnrichedLog } from '@renderer/utils/log-analysis/types';
import { maybeEnhanceLogAnalysis, runLogAnalysis, type LogAnalysisResult } from '@renderer/utils/intelligent-analysis/log-analysis-engine';

const makeLog = (overrides: Partial<EnrichedLog>): EnrichedLog => ({
  id: 'log-1',
  sequence: 1,
  deviceId: 'device-1',
  raw: '04-02 09:00:00.000  100  200 I ActivityManager: ready',
  monthDay: '04-02',
  time: '09:00:00.000',
  pid: 100,
  tid: 200,
  level: 'I',
  tag: 'ActivityManager',
  message: 'ready',
  emphasis: 'normal',
  receivedAt: '2026-04-02T09:00:00.000Z',
  severity: 'info',
  highlight: false,
  ...overrides
});

describe('intelligent log analysis engine', () => {
  it('detects known rule signatures and builds structured diagnostics', () => {
    const result = runLogAnalysis([
      makeLog({
        level: 'E',
        severity: 'error',
        highlight: true,
        tag: 'AndroidRuntime',
        message: 'FATAL EXCEPTION: main java.lang.NullPointerException'
      }),
      makeLog({
        id: 'log-2',
        sequence: 2,
        level: 'E',
        severity: 'error',
        highlight: true,
        tag: 'ScannerModule',
        message: 'NullPointerException at ScannerModule.java:42'
      })
    ]);

    expect(result.severity).toBe('critical');
    expect(result.probableCauses).toEqual(
      expect.arrayContaining([
        'A fatal runtime exception is crashing the app process.',
        'A null reference is being used before required initialization.'
      ])
    );
    expect(result.evidence[0]).toContain('04-02 09:00:00.000');
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('escalates repeated unmatched errors to high severity', () => {
    const result = runLogAnalysis([
      makeLog({ id: 'log-1', sequence: 1, level: 'E', severity: 'error', message: 'Unknown issue 1' }),
      makeLog({ id: 'log-2', sequence: 2, level: 'E', severity: 'error', message: 'Unknown issue 2' }),
      makeLog({ id: 'log-3', sequence: 3, level: 'E', severity: 'error', message: 'Unknown issue 3' })
    ]);

    expect(result.severity).toBe('high');
    expect(result.probableCauses[0]).toContain('No matching rule signatures');
  });

  it('keeps deterministic result when AI enhancement is disabled or incomplete', async () => {
    const base: LogAnalysisResult = {
      summary: 'Base summary',
      probableCauses: ['Cause A'],
      evidence: ['Evidence A'],
      recommendations: ['Recommendation A'],
      severity: 'medium'
    };

    await expect(
      maybeEnhanceLogAnalysis(base, {
        enableAnalysis: true,
        enableAIEnhancement: false,
        ai: {
          provider: 'openai',
          apiKey: 'ignored',
          model: 'gpt-4o-mini'
        }
      })
    ).resolves.toEqual(base);

    await expect(
      maybeEnhanceLogAnalysis(base, {
        enableAnalysis: true,
        enableAIEnhancement: true,
        ai: {
          provider: 'openai',
          apiKey: '',
          model: 'gpt-4o-mini'
        }
      })
    ).resolves.toEqual(base);
  });
});
