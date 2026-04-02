import type { LogAnalysisResult } from '@renderer/utils/intelligent-analysis/log-analysis-engine';
import { BaseAIClient, buildSummaryEnhancementPrompt } from '@renderer/utils/intelligent-analysis/ai/ai-client.interface';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

export class GeminiClient extends BaseAIClient {
  async generateAnalysis(input: LogAnalysisResult): Promise<string> {
    const model = this.model ?? 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      this.apiKey
    )}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: buildSummaryEnhancementPrompt(input) }]
          }
        ],
        generationConfig: {
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      throw new Error('Gemini analysis request failed.');
    }

    const data = (await response.json()) as GeminiResponse;
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!content) {
      throw new Error('Gemini analysis response was empty.');
    }

    return content;
  }
}
