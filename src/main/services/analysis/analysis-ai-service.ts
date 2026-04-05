import type {
  AIConfig,
  AskAnalysisAssistantInput,
  EnhanceAnalysisSummaryInput,
  LogAnalysisPayload,
  Locale
} from '@shared/types';

const buildSummaryEnhancementPrompt = (input: LogAnalysisPayload, locale: Locale): string =>
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

const buildAnalysisChatPrompt = (input: AskAnalysisAssistantInput): string => {
  const historyLines = (input.history ?? [])
    .slice(-12)
    .map((entry) => `${entry.role === 'assistant' ? 'Assistant' : 'User'}: ${entry.content.trim()}`)
    .join('\n');

  return [
    'You are an Android log analysis assistant.',
    `Respond in ${input.locale === 'es' ? 'Spanish' : 'English'}.`,
    'Base your answer only on the deterministic analysis context provided below and user question.',
    'Be concrete and actionable, max 140 words.',
    '',
    `Summary: ${input.analysis.summary}`,
    `Severity: ${input.analysis.severity}`,
    `Probable causes: ${input.analysis.probableCauses.join(' | ') || 'None'}`,
    `Evidence: ${input.analysis.evidence.slice(0, 8).join(' | ') || 'None'}`,
    `Recommendations: ${input.analysis.recommendations.join(' | ') || 'None'}`,
    historyLines ? `Conversation:\n${historyLines}` : 'Conversation: none',
    `User question: ${input.question.trim()}`
  ].join('\n');
};

const ensureSummary = (summary: string | undefined, provider: string): string => {
  const normalized = summary?.trim();
  if (!normalized) {
    throw new Error(`${provider} response was empty.`);
  }

  return normalized;
};

const redactSecrets = (value: string): string =>
  value
    .replace(/sk-[a-zA-Z0-9_-]{12,}/g, 'sk-***')
    .replace(/k-proj-[a-zA-Z0-9_-]{12,}/g, 'k-proj-***')
    .replace(/api key[^\n:.]*[:=]\s*[^\s,;]+/gi, 'api key: ***');

const parseProviderError = async (response: Response, provider: string): Promise<never> => {
  let detail = '';

  try {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as {
        error?: string | { message?: string };
        message?: string;
      };
      if (typeof payload.error === 'string') {
        detail = payload.error;
      } else if (payload.error?.message) {
        detail = payload.error.message;
      } else if (payload.message) {
        detail = payload.message;
      }
    } else {
      detail = (await response.text()).trim();
    }
  } catch {
    detail = '';
  }

  const compactDetail = redactSecrets(detail.replace(/\s+/g, ' ').trim());
  const suffix = compactDetail ? `: ${compactDetail.slice(0, 220)}` : '';
  throw new Error(`${provider} request failed (HTTP ${response.status})${suffix}`);
};

const requestOpenAI = async (ai: AIConfig, prompt: string): Promise<string> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ai.apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: ai.model?.trim() || 'gpt-4.1-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You provide precise diagnostics without unsupported claims.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    await parseProviderError(response, 'OpenAI');
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  return ensureSummary(data.choices?.[0]?.message?.content, 'OpenAI');
};

const requestGemini = async (ai: AIConfig, prompt: string): Promise<string> => {
  const model = ai.model?.trim() || 'gemini-1.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    ai.apiKey.trim()
  )}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    await parseProviderError(response, 'Gemini');
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  return ensureSummary(data.candidates?.[0]?.content?.parts?.[0]?.text, 'Gemini');
};

const requestOpenRouter = async (ai: AIConfig, prompt: string): Promise<string> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ai.apiKey.trim()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: ai.model?.trim() || 'openai/gpt-4.1-mini',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'Improve diagnostics without adding unsupported claims.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    await parseProviderError(response, 'OpenRouter');
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string;
      };
    }>;
  };

  return ensureSummary(data.choices?.[0]?.message?.content, 'OpenRouter');
};

const requestClaude = async (ai: AIConfig, prompt: string): Promise<string> => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ai.apiKey.trim(),
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: ai.model?.trim() || 'claude-3-5-haiku-latest',
      max_tokens: 260,
      temperature: 0.2,
      system: 'You refine concise diagnostics while preserving deterministic facts.',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    await parseProviderError(response, 'Claude');
  }

  const data = (await response.json()) as {
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  };

  const content = data.content?.find((item) => item.type === 'text')?.text;
  return ensureSummary(content, 'Claude');
};

const requestProvider = async (ai: AIConfig, prompt: string): Promise<string> => {
  if (ai.provider === 'openai') {
    return requestOpenAI(ai, prompt);
  }

  if (ai.provider === 'gemini') {
    return requestGemini(ai, prompt);
  }

  if (ai.provider === 'openrouter') {
    return requestOpenRouter(ai, prompt);
  }

  return requestClaude(ai, prompt);
};

const assertAIEnabled = (config: EnhanceAnalysisSummaryInput['config']): AIConfig => {
  if (!config.enableAIEnhancement) {
    throw new Error('AI enhancement is disabled.');
  }

  const ai = config.ai;
  if (!ai || !ai.apiKey.trim()) {
    throw new Error('AI API key is missing.');
  }

  return ai;
};

export const enhanceAnalysisSummary = async (input: EnhanceAnalysisSummaryInput): Promise<string> => {
  const ai = assertAIEnabled(input.config);
  const prompt = buildSummaryEnhancementPrompt(input.base, input.locale);
  return requestProvider(ai, prompt);
};

export const askAnalysisAssistant = async (input: AskAnalysisAssistantInput): Promise<string> => {
  const ai = assertAIEnabled(input.config);
  if (!input.question.trim()) {
    throw new Error('Question is empty.');
  }

  const prompt = buildAnalysisChatPrompt(input);
  return requestProvider(ai, prompt);
};
