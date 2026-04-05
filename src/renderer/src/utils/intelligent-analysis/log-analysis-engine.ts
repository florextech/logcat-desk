import type { AIProvider, AnalysisConfig, Locale } from '@shared/types';
import { electronApi, hasElectronApi } from '@renderer/services/electron-api';
import type { EnrichedLog } from '@renderer/utils/log-analysis/types';
import { aggregateLogAnalysis } from '@renderer/utils/intelligent-analysis/log-analysis-aggregator';
import { applyAnalysisRules } from '@renderer/utils/intelligent-analysis/log-analysis-rules';

export type LogAnalysisSeverity = 'low' | 'medium' | 'high' | 'critical';

export type LogAnalysisResult = {
  summary: string;
  probableCauses: string[];
  evidence: string[];
  recommendations: string[];
  severity: LogAnalysisSeverity;
};

export type AIEnhancementMetaReason =
  | 'success'
  | 'disabled'
  | 'missing_api_key'
  | 'empty_response'
  | 'request_failed';

export type AIEnhancementMeta = {
  attempted: boolean;
  used: boolean;
  provider?: AIProvider;
  reason: AIEnhancementMetaReason;
  detail?: string;
};

export type AnalysisLog = EnrichedLog;

export type AnalysisRule = {
  match: (log: AnalysisLog) => boolean;
  cause: string;
  recommendation: string;
  severity?: LogAnalysisSeverity;
};

const unwrapIpcErrorEnvelope = (message: string): string => {
  const match = message.match(
    /^Error invoking remote method 'analysis:enhance-summary': Error: (.+)$/s
  );
  return match?.[1]?.trim() || message.trim();
};

const normalizeAIErrorDetail = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : String(error);
  const unwrapped = unwrapIpcErrorEnvelope(raw);

  if (/analysis request failed\./i.test(unwrapped)) {
    return `${unwrapped} Check API key, selected model, and network access.`;
  }

  return unwrapped;
};

export const runLogAnalysis = (logs: AnalysisLog[], locale: Locale = 'en'): LogAnalysisResult => {
  const matches = applyAnalysisRules(logs, locale);
  return aggregateLogAnalysis(logs, matches, locale);
};

export const maybeEnhanceLogAnalysis = async (
  base: LogAnalysisResult,
  config: AnalysisConfig,
  locale: Locale = 'en'
): Promise<LogAnalysisResult> => {
  const detailed = await maybeEnhanceLogAnalysisDetailed(base, config, locale);
  return detailed.result;
};

export const maybeEnhanceLogAnalysisDetailed = async (
  base: LogAnalysisResult,
  config: AnalysisConfig,
  locale: Locale = 'en'
): Promise<{ result: LogAnalysisResult; meta: AIEnhancementMeta }> => {
  if (!config.enableAIEnhancement) {
    return {
      result: base,
      meta: {
        attempted: false,
        used: false,
        reason: 'disabled',
        detail: 'AI enhancement is disabled.'
      }
    };
  }

  const ai = config.ai;
  if (!ai || !ai.apiKey.trim()) {
    return {
      result: base,
      meta: {
        attempted: false,
        used: false,
        provider: ai?.provider,
        reason: 'missing_api_key',
        detail: 'AI API key is missing.'
      }
    };
  }

  try {
    if (!hasElectronApi) {
      throw new Error(
        'Desktop preload API unavailable for AI enhancement. Restart the desktop app to enable provider requests.'
      );
    }

    const enhancedSummary = await electronApi.enhanceAnalysisSummary({
      base,
      config,
      locale
    });
    const nextSummary = enhancedSummary.trim();

    if (!nextSummary) {
      return {
        result: base,
        meta: {
          attempted: true,
          used: false,
          provider: ai.provider,
          reason: 'empty_response',
          detail: 'Provider returned an empty summary.'
        }
      };
    }

    return {
      result: {
        ...base,
        summary: nextSummary
      },
      meta: {
        attempted: true,
        used: true,
        provider: ai.provider,
        reason: 'success'
      }
    };
  } catch (error_) {
    const detail = normalizeAIErrorDetail(error_);
    return {
      result: base,
      meta: {
        attempted: true,
        used: false,
        provider: ai.provider,
        reason: 'request_failed',
        detail
      }
    };
  }
};
