import type { AnalysisConfig } from '@shared/types';
import type { EnrichedLog } from '@renderer/utils/log-analysis/types';
import { createAIClient } from '@renderer/utils/intelligent-analysis/ai/ai-client-factory';
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

export type AnalysisLog = EnrichedLog;

export type AnalysisRule = {
  match: (log: AnalysisLog) => boolean;
  cause: string;
  recommendation: string;
  severity?: LogAnalysisSeverity;
};

export const runLogAnalysis = (logs: AnalysisLog[]): LogAnalysisResult => {
  const matches = applyAnalysisRules(logs);
  return aggregateLogAnalysis(logs, matches);
};

export const maybeEnhanceLogAnalysis = async (
  base: LogAnalysisResult,
  config: AnalysisConfig
): Promise<LogAnalysisResult> => {
  if (!config.enableAIEnhancement) {
    return base;
  }

  const ai = config.ai;
  if (!ai || !ai.apiKey.trim()) {
    return base;
  }

  try {
    const client = createAIClient(ai);
    const enhancedSummary = await client.generateAnalysis(base);
    const nextSummary = enhancedSummary.trim();

    if (!nextSummary) {
      return base;
    }

    return {
      ...base,
      summary: nextSummary
    };
  } catch {
    return base;
  }
};
