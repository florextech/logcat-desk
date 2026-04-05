import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AnalysisConfig } from '@shared/types';
import type { LogAnalysisResult } from '@renderer/utils/intelligent-analysis/log-analysis-engine';

const baseResult: LogAnalysisResult = {
  summary: 'Deterministic summary',
  probableCauses: ['Cause A'],
  evidence: ['Evidence A'],
  recommendations: ['Recommendation A'],
  severity: 'high'
};

const aiConfig: AnalysisConfig = {
  enableAnalysis: true,
  enableAIEnhancement: true,
  ai: {
    provider: 'openai',
    apiKey: 'sk-test-12345678901234',
    model: 'gpt-4.1-mini'
  }
};

afterEach(() => {
  vi.clearAllMocks();
  vi.doUnmock('@renderer/services/electron-api');
  vi.resetModules();
});

describe('maybeEnhanceLogAnalysisDetailed AI paths', () => {
  it('uses provider summary when Electron API is available', async () => {
    const enhanceAnalysisSummary = vi.fn().mockResolvedValue('  Enhanced summary from AI  ');

    vi.doMock('@renderer/services/electron-api', () => ({
      hasElectronApi: true,
      electronApi: {
        enhanceAnalysisSummary
      }
    }));

    const { maybeEnhanceLogAnalysisDetailed, maybeEnhanceLogAnalysis } = await import(
      '@renderer/utils/intelligent-analysis/log-analysis-engine'
    );

    const detailed = await maybeEnhanceLogAnalysisDetailed(baseResult, aiConfig, 'es');
    expect(detailed).toMatchObject({
      result: {
        ...baseResult,
        summary: 'Enhanced summary from AI'
      },
      meta: {
        attempted: true,
        used: true,
        reason: 'success',
        provider: 'openai'
      }
    });

    const plain = await maybeEnhanceLogAnalysis(baseResult, aiConfig, 'en');
    expect(plain.summary).toBe('Enhanced summary from AI');
    expect(enhanceAnalysisSummary).toHaveBeenCalledWith({
      base: baseResult,
      config: aiConfig,
      locale: 'es'
    });
  });

  it('returns empty_response metadata when provider responds with blank content', async () => {
    vi.doMock('@renderer/services/electron-api', () => ({
      hasElectronApi: true,
      electronApi: {
        enhanceAnalysisSummary: vi.fn().mockResolvedValue('   ')
      }
    }));

    const { maybeEnhanceLogAnalysisDetailed } = await import(
      '@renderer/utils/intelligent-analysis/log-analysis-engine'
    );

    const result = await maybeEnhanceLogAnalysisDetailed(baseResult, aiConfig, 'en');

    expect(result).toMatchObject({
      result: baseResult,
      meta: {
        attempted: true,
        used: false,
        reason: 'empty_response',
        provider: 'openai'
      }
    });
  });

  it('normalizes wrapped IPC failures and includes remediation hint', async () => {
    vi.doMock('@renderer/services/electron-api', () => ({
      hasElectronApi: true,
      electronApi: {
        enhanceAnalysisSummary: vi
          .fn()
          .mockRejectedValue(
            new Error("Error invoking remote method 'analysis:enhance-summary': Error: OpenAI analysis request failed.")
          )
      }
    }));

    const { maybeEnhanceLogAnalysisDetailed } = await import(
      '@renderer/utils/intelligent-analysis/log-analysis-engine'
    );

    const result = await maybeEnhanceLogAnalysisDetailed(baseResult, aiConfig, 'en');

    expect(result.meta).toMatchObject({
      attempted: true,
      used: false,
      reason: 'request_failed'
    });
    expect(result.meta.detail).toContain('OpenAI analysis request failed. Check API key, selected model, and network access.');
  });

  it('fails gracefully when preload API is unavailable', async () => {
    const enhanceAnalysisSummary = vi.fn();

    vi.doMock('@renderer/services/electron-api', () => ({
      hasElectronApi: false,
      electronApi: {
        enhanceAnalysisSummary
      }
    }));

    const { maybeEnhanceLogAnalysisDetailed } = await import(
      '@renderer/utils/intelligent-analysis/log-analysis-engine'
    );

    const result = await maybeEnhanceLogAnalysisDetailed(baseResult, aiConfig, 'en');

    expect(result.meta).toMatchObject({
      attempted: true,
      used: false,
      reason: 'request_failed',
      provider: 'openai'
    });
    expect(result.meta.detail).toContain('Desktop preload API unavailable');
    expect(enhanceAnalysisSummary).not.toHaveBeenCalled();
  });
});
