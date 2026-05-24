// LM Studio provider — adapter implementing the same surface as openai.js
// using the OpenAI SDK with a custom base URL for local inference.
// Used when AI_LLM_PROVIDER=lmstudio.
//
// LM Studio provides an OpenAI-compatible API, so we can use the OpenAI SDK
// by simply changing the baseURL to point to the local LM Studio server.
//
// Note: LM Studio embedding models output different dimensions than OpenAI's 1536;
// nomic-embed-text-v1.5 outputs 768 dimensions. If you switch providers you must
// run a migration that re-indexes the `KbDocumentChunk.embedding` column with the correct
// vector size.
import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { ExternalServiceError } from '../../shared/errors.js';

let client = null;
function clientOrThrow() {
  if (!client) {
    client = new OpenAI({
      baseURL: env.LMSTUDIO_HOST,
      apiKey: 'not-needed', // LM Studio doesn't require an API key
    });
  }
  return client;
}

/**
 * One-shot chat completion. Returns `{ content, usage }`.
 * Messages: [{ role: 'system'|'user'|'assistant', content: string }]
 */
export async function chat(messages, { model, temperature = 0.2, maxTokens = 1024 } = {}) {
  const c = clientOrThrow();
  const res = await c.chat.completions.create({
    model: model ?? env.LMSTUDIO_CHAT_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  });
  return {
    content: res.choices?.[0]?.message?.content ?? '',
    usage: res.usage,
  };
}

/**
 * Streaming chat completion. Returns an async iterator of `{ delta, done }`
 * objects. Consumers wire it to SSE.
 */
export async function* chatStream(messages, { model, temperature = 0.2, maxTokens = 1024 } = {}) {
  const c = clientOrThrow();
  const stream = await c.chat.completions.create({
    model: model ?? env.LMSTUDIO_CHAT_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });
  for await (const chunk of stream) {
    const delta = chunk.choices?.[0]?.delta?.content ?? '';
    if (delta) yield { delta, done: false };
  }
  yield { delta: '', done: true };
}

/**
 * Batch-embed an array of strings. Returns an array of Float32 vectors
 * (one per input). nomic-embed-text-v1.5 outputs 768 dimensions.
 */
export async function embed(texts, { model } = {}) {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  const c = clientOrThrow();
  const res = await c.embeddings.create({
    model: model ?? env.LMSTUDIO_EMBEDDING_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}
