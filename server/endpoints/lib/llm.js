/**
 * OmniRoute & LLM Gateway Client
 * Provides a unified abstraction layer connecting to OmniRoute's OpenAI-compatible API.
 * Supports streaming, non-streaming, multi-model fallback, and robust error management.
 */

const DEFAULT_OMNIROUTE_URL = 'http://localhost:20128';
const DEFAULT_PRIMARY_MODEL = 'auto/best-chat';
const DEFAULT_REASONING_MODEL = 'auto/best-reasoning';
const DEFAULT_FALLBACK_MODELS = ['auto/pro-chat', 'auto/fast', 'auto/chat'];

/**
 * Returns OmniRoute server configuration from environment variables
 */
export function getLLMConfig() {
  const url = (process.env.OMNIROUTE_URL || DEFAULT_OMNIROUTE_URL).trim().replace(/\/+$/, '');
  let apiKey = process.env.OMNIROUTE_API_KEY || '';
  if (apiKey) apiKey = apiKey.trim().replace(/^["']|["']$/g, '');

  const primaryModel = (process.env.OMNIROUTE_MODEL || process.env.LLM_MODEL || DEFAULT_PRIMARY_MODEL)
    .trim()
    .replace(/^["']|["']$/g, '');

  const reasoningModel = (process.env.OMNIROUTE_REASONING_MODEL || DEFAULT_REASONING_MODEL)
    .trim()
    .replace(/^["']|["']$/g, '');

  return {
    url,
    apiKey,
    primaryModel,
    reasoningModel,
    hasApiKey: Boolean(
      apiKey &&
        apiKey !== 'your_api_key_here' &&
        apiKey !== 'YOUR_OMNIROUTE_API_KEY' &&
        apiKey !== 'invalid_mock_key'
    ),
  };
}

/**
 * Sanitizes raw LLM output, stripping internal reasoning, thinking tags, or leaked draft tokens
 */
export function cleanAssistantOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let cleaned = rawText.trim();

  // Strip xml thinking tags: <thought>...</thought> or <thinking>...</thinking>
  cleaned = cleaned.replace(/<(thought|thinking|internal)>[\s\S]*?<\/\1>/gi, '').trim();

  // Strip scratchpad or drafting tokens if leaked in response
  if (/(\bDraft \d+:|\bDrafting response:|\bCurrent Identity Rules:|\bSelf-Correction:|\bPrevious turn:|\bUser asks:|\bDirectly address the question)/i.test(cleaned)) {
    const lines = cleaned.split('\n');
    const filteredLines = [];
    let skipping = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        /^\*?\s*(Question:|Context:|Directly address|Draft \d+:|Draft:|Refinement:|Self-Correction:|Check:|Current Identity Rules:|User asks:)/i.test(trimmed)
      ) {
        skipping = true;
        continue;
      }
      if (skipping && /^[A-Z][a-zA-Z0-9\s"']{10,}/.test(trimmed) && !trimmed.startsWith('*')) {
        skipping = false;
      }
      if (!skipping) {
        filteredLines.push(line);
      }
    }
    const candidateCleaned = filteredLines.join('\n').trim();
    if (candidateCleaned.length > 5) {
      cleaned = candidateCleaned;
    }
  }

  // Strip leading headers like "Answer:" or "Response:"
  cleaned = cleaned.replace(/^(?:\*\*|\*|#+\s*)?(?:Answer|Response|Assistant|Final Answer):\s*/i, '').trim();

  return cleaned;
}

/**
 * Sends a non-streaming chat completion request with automatic model fallback
 */
export async function sendChatCompletion({
  messages,
  reasoningMode = false,
  temperature = 0.4,
  maxTokens,
  signal,
}) {
  const config = getLLMConfig();
  if (!config.hasApiKey) {
    throw new Error('OMNIROUTE_API_KEY is not configured in server environment variables.');
  }

  const candidateModels = [
    reasoningMode ? config.reasoningModel : config.primaryModel,
    ...(reasoningMode ? [config.primaryModel] : []),
    ...DEFAULT_FALLBACK_MODELS,
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const res = await fetch(`${config.url}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          ...(maxTokens ? { max_tokens: maxTokens } : {}),
          stream: false,
        }),
        signal,
      });

      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        throw new Error(`OmniRoute error (${res.status}): ${errorBody}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return cleanAssistantOutput(content);
      }
    } catch (err) {
      lastError = err;
      console.warn(`[LLM Gateway] Model "${model}" failed:`, err.message);
      if (err.name === 'AbortError') throw err;
    }
  }

  throw lastError || new Error('All model candidates failed to generate a response.');
}

/**
 * Handles streaming chat completion from OmniRoute, piping chunks to Express res
 * Uses OpenAI-compatible SSE parser. Falls back to next candidate model if stream has not started.
 */
export async function streamChatCompletion({
  messages,
  reasoningMode = false,
  temperature = 0.4,
  maxTokens,
  res,
  signal,
  onComplete,
}) {
  const config = getLLMConfig();
  if (!config.hasApiKey) {
    throw new Error('OMNIROUTE_API_KEY is not configured in server environment variables.');
  }

  const candidateModels = [
    reasoningMode ? config.reasoningModel : config.primaryModel,
    ...(reasoningMode ? [config.primaryModel] : []),
    ...DEFAULT_FALLBACK_MODELS,
  ].filter((m, idx, arr) => m && arr.indexOf(m) === idx);

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const upstreamRes = await fetch(`${config.url}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          ...(maxTokens ? { max_tokens: maxTokens } : {}),
          stream: true,
        }),
        signal,
      });

      if (!upstreamRes.ok) {
        const errorBody = await upstreamRes.text().catch(() => '');
        throw new Error(`OmniRoute stream error (${upstreamRes.status}): ${errorBody}`);
      }

      if (!upstreamRes.body) {
        throw new Error('OmniRoute returned empty response stream.');
      }

      const reader = upstreamRes.body.getReader();
      const decoder = new TextDecoder();
      let streamStarted = false;
      let fullAccumulatedText = '';
      let sseBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        // Keep the last partial line in the buffer
        sseBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith(':')) continue; // Skip comments/keepalive
          if (trimmedLine === 'data: [DONE]') continue;

          if (trimmedLine.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmedLine.slice(6));
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                fullAccumulatedText += deltaContent;

                if (!streamStarted) {
                  if (typeof res.writeHead === 'function') {
                    res.writeHead(200, {
                      'Content-Type': 'text/plain; charset=utf-8',
                      'Transfer-Encoding': 'chunked',
                      'Cache-Control': 'no-cache, no-transform',
                      'X-Accel-Buffering': 'no',
                    });
                  }
                  streamStarted = true;
                }

                if (typeof res.write === 'function') {
                  res.write(deltaContent);
                }
              }
            } catch {
              // Non-JSON SSE chunk ignored safely
            }
          }
        }
      }

      if (streamStarted) {
        if (typeof res.end === 'function') {
          res.end();
        }
        if (typeof onComplete === 'function') {
          onComplete(cleanAssistantOutput(fullAccumulatedText));
        }
        return fullAccumulatedText;
      }

      // If upstream ended without emitting content, try next candidate
      throw new Error(`Model ${model} completed stream with no text.`);
    } catch (err) {
      lastError = err;
      console.warn(`[LLM Gateway Stream] Model "${model}" failed:`, err.message);

      // If headers were already written, cannot fallback to another model
      if (res.headersSent) {
        if (typeof res.end === 'function') res.end();
        return;
      }

      if (err.name === 'AbortError') throw err;
    }
  }

  throw lastError || new Error('All model candidates failed during streaming.');
}
