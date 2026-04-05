import type { AIConfig } from '@shared/types';
import type { Locale } from '@shared/types';
import type { LogAnalysisResult } from '@renderer/utils/intelligent-analysis/log-analysis-engine';

export interface AIClient {
  generateAnalysis(input: LogAnalysisResult, locale: Locale): Promise<string>;
}

export abstract class BaseAIClient implements AIClient {
  protected readonly config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  abstract generateAnalysis(input: LogAnalysisResult, locale: Locale): Promise<string>;

  protected get apiKey(): string {
    return this.config.apiKey.trim();
  }

  protected get model(): string | undefined {
    const model = this.config.model?.trim();
    return model ? model : undefined;
  }
}

export const buildSummaryEnhancementPrompt = (input: LogAnalysisResult, locale: Locale): string =>
  [
    'You are improving a deterministic Android log diagnostic summary.',
    'Keep output under 45 words, one concise paragraph, no markdown, no bullet points.',
    'Do not invent new causes. Use only the provided diagnostics.',
    `Write the final summary in ${locale === 'es' ? 'Spanish' : 'English'}.`,
    `Severity: ${input.severity}`,
    `Causes: ${input.probableCauses.join(' | ') || 'None'}`,
    `Evidence: ${input.evidence.slice(0, 5).join(' | ') || 'None'}`,
    `Recommendations: ${input.recommendations.join(' | ') || 'None'}`,
    `Current summary: ${input.summary}`
  ].join('\n');
