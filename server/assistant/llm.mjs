function parseJson(text) {
  const cleaned = String(text || '')
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('LLM did not return JSON.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

export function createLlm(config) {
  const { apiKey, baseUrl } = config.llm;

  async function chat({ messages, model = config.llm.model, json = false, maxTokens = 600, temperature = 0.4 }) {
    if (!apiKey) throw new Error('LLM_API_KEY is not set.');
    const body = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      ...(json ? { response_format: { type: 'json_object' } } : {})
    };
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000)
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const reason = payload?.error?.message || `HTTP ${res.status}`;
      throw new Error(`LLM request failed: ${reason}`);
    }
    const content = payload?.choices?.[0]?.message?.content || '';
    return {
      content: json ? parseJson(content) : content.trim(),
      usage: payload.usage || null,
      model: payload.model || model
    };
  }

  return { enabled: Boolean(apiKey), chat };
}
