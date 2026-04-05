import type { Locale } from '@shared/types';
import type { LogAnalysisResult } from '@renderer/utils/intelligent-analysis/log-analysis-engine';
import { BaseAIClient, buildSummaryEnhancementPrompt } from '@renderer/utils/intelligent-analysis/ai/ai-client.interface';

interface ClaudeResponse {
  content?: Array<{
    type?: string;
    text?: string;
  }>;
}

export class ClaudeClient extends BaseAIClient {
  async generateAnalysis(input: LogAnalysisResult, locale: Locale): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model ?? 'claude-3-5-haiku-latest',
        max_tokens: 180,
        temperature: 0.2,
        system: 'You refine concise diagnostics while preserving deterministic facts.',
        messages: [
          {
            role: 'user',
            content: buildSummaryEnhancementPrompt(input, locale)
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Claude analysis request failed.');
    }

    const data = (await response.json()) as ClaudeResponse;
    const content = data.content?.find((item) => item.type === 'text')?.text?.trim();

    if (!content) {
      throw new Error('Claude analysis response was empty.');
    }

    return content;
  }
}
