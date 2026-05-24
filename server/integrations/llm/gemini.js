// Gemini provider — adapter implementing the same surface as openai.js
// using the @google/genai SDK. Used when AI_LLM_PROVIDER=gemini.
//
// Note: Gemini's native embedding output dimensionality differs from OpenAI's
// 1536; if you switch providers you must run a migration that re-indexes
// the `KbDocumentChunk.embedding` column with the correct vector size.
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';
import { ExternalServiceError } from '../../shared/errors.js';

let client = null;
function clientOrThrow() {
  if (!env.GEMINI_API_KEY) throw new ExternalServiceError('gemini', 'GEMINI_API_KEY not configured');
  if (!client) client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  return client;
}

function toGeminiContents(messages) {
  // Gemini doesn't have a separate `system` role — fold system prompts into
  // a leading user turn prefixed with [SYSTEM].
  const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const turns = messages.filter((m) => m.role !== 'system');
  const text = (system ? `[SYSTEM]\n${system}\n\n[USER]\n` : '') + turns.map((m) => m.content).join('\n');
  return text;
}

export async function chat(messages, { model = 'gemini-1.5-flash', temperature = 0.2 } = {}) {
  const c = clientOrThrow();
  const genModel = c.getGenerativeModel({ model });
  const res = await genModel.generateContent(toGeminiContents(messages));
  return { content: res.response.text() ?? '', usage: null };
}

export async function* chatStream(messages, opts = {}) {
  const r = await chat(messages, opts);
  yield { delta: r.content, done: false };
  yield { delta: '', done: true };
}

export async function embed(texts, { model = 'text-embedding-004' } = {}) {
  const c = clientOrThrow();
  const embeddingModel = c.getGenerativeModel({ model });
  const embeddings = [];
  for (const text of texts) {
    const result = await embeddingModel.embedContent(text);
    embeddings.push(result.embedding.values);
  }
  return embeddings;
}
