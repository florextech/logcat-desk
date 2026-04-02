import type { AIConfig } from '@shared/types';
import type { AIClient } from '@renderer/utils/intelligent-analysis/ai/ai-client.interface';
import { ClaudeClient } from '@renderer/utils/intelligent-analysis/ai/claude.client';
import { GeminiClient } from '@renderer/utils/intelligent-analysis/ai/gemini.client';
import { OpenAIClient } from '@renderer/utils/intelligent-analysis/ai/openai.client';
import { OpenRouterClient } from '@renderer/utils/intelligent-analysis/ai/openrouter.client';

export const createAIClient = (config: AIConfig): AIClient => {
  if (config.provider === 'openai') {
    return new OpenAIClient(config);
  }

  if (config.provider === 'gemini') {
    return new GeminiClient(config);
  }

  if (config.provider === 'openrouter') {
    return new OpenRouterClient(config);
  }

  return new ClaudeClient(config);
};
