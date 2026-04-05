import type { Locale } from '@shared/types';
import type { LogAnalysisResult } from '@renderer/utils/intelligent-analysis/log-analysis-engine';
import { BaseAIClient, buildSummaryEnhancementPrompt } from '@renderer/utils/intelligent-analysis/ai/ai-client.interface';

interface OpenAIResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class OpenAIClient extends BaseAIClient {
  async generateAnalysis(input: LogAnalysisResult, locale: Locale): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model ?? 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'You refine technical summaries while preserving factual content.'
          },
          {
            role: 'user',
            content: buildSummaryEnhancementPrompt(input, locale)
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI analysis request failed.');
    }

    const data = (await response.json()) as OpenAIResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('OpenAI analysis response was empty.');
    }

    return content;
  }
}
