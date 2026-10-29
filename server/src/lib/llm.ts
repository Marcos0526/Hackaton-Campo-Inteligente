export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface Provider {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

/**
 * Resolves the LLM provider from environment variables.
 * Any OpenAI-compatible endpoint works (Groq, OpenAI, Gemini, OpenRouter, local servers...).
 * If nothing is configured we fall back to a free public demo endpoint so the
 * assistant still works out of the box.
 */
function resolveProvider(): Provider {
  const customBase = process.env.LLM_BASE_URL;
  const customModel = process.env.LLM_MODEL;

  if (customBase && customModel) {
    return {
      name: 'custom',
      baseUrl: customBase.replace(/\/$/, ''),
      apiKey: process.env.LLM_API_KEY || '',
      model: customModel,
    };
  }

  if (process.env.GROQ_API_KEY) {
    return {
      name: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      name: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.LLM_MODEL || 'gpt-4o-mini',
    };
  }

  if (process.env.GEMINI_API_KEY) {
    return {
      name: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.LLM_MODEL || 'gemini-2.0-flash',
    };
  }

  if (process.env.OPENROUTER_API_KEY) {
    return {
      name: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.LLM_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
    };
  }

  // Free public demo endpoint (no API key required).
  return {
    name: 'demo',
    baseUrl: 'https://text.pollinations.ai/openai',
    apiKey: '',
    model: process.env.LLM_MODEL || 'openai',
  };
}

export function currentProviderName(): string {
  return resolveProvider().name;
}

export async function chatComplete(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number; timeoutMs?: number } = {}
): Promise<{ content: string; provider: string }> {
  const provider = resolveProvider();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 45000);

  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 700,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`LLM ${response.status}: ${detail.slice(0, 200)}`);
    }

    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('El LLM devolvió una respuesta vacía');
    }

    return { content, provider: provider.name };
  } finally {
    clearTimeout(timeout);
  }
}
