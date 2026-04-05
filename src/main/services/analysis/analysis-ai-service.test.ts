import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  AIConfig,
  AnalysisConfig,
  AskAnalysisAssistantInput,
  EnhanceAnalysisSummaryInput,
  LogAnalysisPayload
} from '@shared/types';
import { askAnalysisAssistant, enhanceAnalysisSummary } from '@main/services/analysis/analysis-ai-service';

const baseAnalysis: LogAnalysisPayload = {
  summary: 'Base summary',
  probableCauses: ['Cause A'],
  evidence: ['Evidence A'],
  recommendations: ['Recommendation A'],
  severity: 'medium'
};

const makeConfig = (ai: Partial<AIConfig>, enableAIEnhancement = true): AnalysisConfig => ({
  enableAnalysis: true,
  enableAIEnhancement,
  ai: {
    provider: 'openai',
    apiKey: 'sk-test-12345678901234',
    ...ai
  }
});

const makeEnhanceInput = (config: AnalysisConfig): EnhanceAnalysisSummaryInput => ({
  base: baseAnalysis,
  config,
  locale: 'en'
});

const makeAskInput = (config: AnalysisConfig): AskAnalysisAssistantInput => ({
  analysis: baseAnalysis,
  config,
  locale: 'es',
  question: 'How can I fix this issue?',
  history: [
    {
      role: 'assistant',
      content: 'Initial deterministic summary.'
    },
    {
      role: 'user',
      content: 'Can you provide more details?'
    }
  ]
});

describe('analysis-ai-service', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws when AI enhancement is disabled', async () => {
    await expect(
      enhanceAnalysisSummary(makeEnhanceInput(makeConfig({ provider: 'openai' }, false)))
    ).rejects.toThrow('AI enhancement is disabled.');
  });

  it('throws when API key is missing', async () => {
    await expect(
      enhanceAnalysisSummary(makeEnhanceInput(makeConfig({ provider: 'openai', apiKey: '   ' })))
    ).rejects.toThrow('AI API key is missing.');
  });

  it('calls OpenAI provider with default model and returns trimmed summary', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '  Enhanced OpenAI summary  ' } }]
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json'
          }
        }
      )
    );

    const summary = await enhanceAnalysisSummary(
      makeEnhanceInput(makeConfig({ provider: 'openai', model: '   ' }))
    );

    expect(summary).toBe('Enhanced OpenAI summary');

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect(init.method).toBe('POST');

    const requestBody = JSON.parse(String(init.body)) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
    };

    expect(requestBody.model).toBe('gpt-4.1-mini');
    expect(requestBody.messages[1]?.content).toContain('Current summary: Base summary');
  });

  it('calls Gemini provider endpoint and uses default model', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: 'Gemini summary' }]
              }
            }
          ]
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json'
          }
        }
      )
    );

    const summary = await enhanceAnalysisSummary(
      makeEnhanceInput(
        makeConfig({
          provider: 'gemini',
          apiKey: 'gemini-key-123456789012'
        })
      )
    );

    expect(summary).toBe('Gemini summary');

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent');
    expect(url).toContain('key=gemini-key-123456789012');
  });

  it('calls OpenRouter and Claude providers', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: 'OpenRouter summary' } }]
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json'
            }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            content: [{ type: 'text', text: 'Claude summary' }]
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json'
            }
          }
        )
      );

    await expect(
      enhanceAnalysisSummary(
        makeEnhanceInput(makeConfig({ provider: 'openrouter', apiKey: 'or-key-123456789012' }))
      )
    ).resolves.toBe('OpenRouter summary');

    await expect(
      enhanceAnalysisSummary(makeEnhanceInput(makeConfig({ provider: 'claude', apiKey: 'claude-key-123456789012' })))
    ).resolves.toBe('Claude summary');

    const [firstUrl, firstInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(firstUrl).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect((firstInit.headers as Record<string, string>).Authorization).toContain('Bearer');

    const [secondUrl, secondInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(secondUrl).toBe('https://api.anthropic.com/v1/messages');
    expect((secondInit.headers as Record<string, string>)['x-api-key']).toBe('claude-key-123456789012');
  });

  it('sanitizes provider error details from JSON responses', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            message: 'Incorrect API key provided: k-proj-abcdefghijklmnopqrstuvwxyz1234567890'
          }
        }),
        {
          status: 401,
          headers: {
            'content-type': 'application/json'
          }
        }
      )
    );

    await expect(
      enhanceAnalysisSummary(makeEnhanceInput(makeConfig({ provider: 'openai' })))
    ).rejects.toThrow(/OpenAI request failed \(HTTP 401\): .*api key: \*\*\*/i);
  });

  it('surfaces compact text error details for non-json provider failures', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('gateway timeout from provider edge', {
        status: 504,
        headers: {
          'content-type': 'text/plain'
        }
      })
    );

    await expect(
      enhanceAnalysisSummary(makeEnhanceInput(makeConfig({ provider: 'openrouter' })))
    ).rejects.toThrow('OpenRouter request failed (HTTP 504): gateway timeout from provider edge');
  });

  it('handles provider errors when payload uses top-level message field', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          message: 'rate limit reached for current tier'
        }),
        {
          status: 429,
          headers: {
            'content-type': 'application/json'
          }
        }
      )
    );

    await expect(
      enhanceAnalysisSummary(makeEnhanceInput(makeConfig({ provider: 'openai' })))
    ).rejects.toThrow('OpenAI request failed (HTTP 429): rate limit reached for current tier');
  });

  it('handles provider errors when payload.error is a string', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: 'service overloaded'
        }),
        {
          status: 503,
          headers: {
            'content-type': 'application/json'
          }
        }
      )
    );

    await expect(
      enhanceAnalysisSummary(makeEnhanceInput(makeConfig({ provider: 'gemini' })))
    ).rejects.toThrow('Gemini request failed (HTTP 503): service overloaded');
  });

  it('handles malformed JSON error payloads safely', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('not-json', {
        status: 500,
        headers: {
          'content-type': 'application/json'
        }
      })
    );

    await expect(
      enhanceAnalysisSummary(makeEnhanceInput(makeConfig({ provider: 'claude' })))
    ).rejects.toThrow('Claude request failed (HTTP 500)');
  });

  it('throws when provider returns empty content', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '   ' } }]
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json'
          }
        }
      )
    );

    await expect(
      enhanceAnalysisSummary(makeEnhanceInput(makeConfig({ provider: 'openai' })))
    ).rejects.toThrow('OpenAI response was empty.');
  });

  it('builds a chat prompt with history and locale for askAnalysisAssistant', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Respuesta asistente' } }]
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json'
          }
        }
      )
    );

    const result = await askAnalysisAssistant(makeAskInput(makeConfig({ provider: 'openai' })));

    expect(result).toBe('Respuesta asistente');

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      messages: Array<{ role: string; content: string }>;
    };
    const prompt = body.messages[1]?.content ?? '';

    expect(prompt).toContain('Respond in Spanish.');
    expect(prompt).toContain('Conversation:\nAssistant: Initial deterministic summary.');
    expect(prompt).toContain('User question: How can I fix this issue?');
  });

  it('builds chat prompt without history using Conversation: none', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Assistant answer without history' } }]
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json'
          }
        }
      )
    );

    const input = makeAskInput(makeConfig({ provider: 'openai' }));
    input.history = undefined;

    await askAnalysisAssistant(input);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as {
      messages: Array<{ role: string; content: string }>;
    };
    const prompt = body.messages[1]?.content ?? '';

    expect(prompt).toContain('Conversation: none');
  });

  it('rejects empty chat questions', async () => {
    await expect(
      askAnalysisAssistant({
        ...makeAskInput(makeConfig({ provider: 'openai' })),
        question: '   '
      })
    ).rejects.toThrow('Question is empty.');
  });
});
