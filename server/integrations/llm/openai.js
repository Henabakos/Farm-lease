// OpenAI provider. Implements both LlmPort (chat) and EmbeddingPort.
// Swap to another provider by replacing this module with a sibling that
// exposes the same `chat`, `chatStream`, `embed` surface.
import OpenAI from 'openai';
import { env } from '../../config/env.js';
import { ExternalServiceError } from '../../shared/errors.js';

let client = null;
function clientOrThrow() {
  if (!env.OPENAI_API_KEY) {
    throw new ExternalServiceError('openai', 'OPENAI_API_KEY is not configured');
  }
  if (!client) client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}

/**
 * One-shot chat completion. Returns `{ content, usage }`.
 * Messages: [{ role: 'system'|'user'|'assistant', content: string }]
 */
export async function chat(messages, { model, temperature = 0.2, maxTokens = 1024 } = {}) {
  const c = clientOrThrow();
  const res = await c.chat.completions.create({
    model: model ?? env.OPENAI_CHAT_MODEL,
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
    model: model ?? env.OPENAI_CHAT_MODEL,
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
 * (one per input). The chosen model dictates the dimensionality which
 * must match the `vector(N)` column in Prisma (1536 for text-embedding-3-small).
 */
export async function embed(texts, { model } = {}) {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  const c = clientOrThrow();
  const res = await c.embeddings.create({
    model: model ?? env.OPENAI_EMBEDDING_MODEL,
    input: texts,
  });
  return res.data.map((d) => d.embedding);
}
