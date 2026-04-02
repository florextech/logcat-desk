import type { LogAnalysisResult } from '@renderer/utils/intelligent-analysis/log-analysis-engine';
import { BaseAIClient, buildSummaryEnhancementPrompt } from '@renderer/utils/intelligent-analysis/ai/ai-client.interface';

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export class OpenRouterClient extends BaseAIClient {
  async generateAnalysis(input: LogAnalysisResult): Promise<string> {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model ?? 'openai/gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'Improve technical summaries without adding unsupported claims.'
          },
          {
            role: 'user',
            content: buildSummaryEnhancementPrompt(input)
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('OpenRouter analysis request failed.');
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('OpenRouter analysis response was empty.');
    }

    return content;
  }
}
