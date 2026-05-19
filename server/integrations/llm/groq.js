// Groq provider — adapter implementing the same surface as openai.js
// using the Groq SDK. Used when AI_LLM_PROVIDER=groq.
//
// Note: Groq offers very fast inference on open-source models like Llama, Mixtral, etc.
// They have a generous free tier but DO NOT support embeddings natively.
//
// Groq is a chat-only provider. For embeddings, you must use OpenAI, Gemini, or Voyage AI.
// You can use Groq for chat and another provider for embeddings in a hybrid setup.
import Groq from 'groq-sdk';
import { env } from '../../config/env.js';
import { ExternalServiceError } from '../../shared/errors.js';

let client = null;
function clientOrThrow() {
  if (!env.GROQ_API_KEY) throw new ExternalServiceError('groq', 'GROQ_API_KEY not configured');
  if (!client) client = new Groq({ apiKey: env.GROQ_API_KEY });
  return client;
}

export async function chat(messages, { model = 'llama-3.3-70b-versatile', temperature = 0.2 } = {}) {
  const c = clientOrThrow();
  const completion = await c.chat.completions.create({
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature,
  });
  return { content: completion.choices[0]?.message?.content ?? '', usage: completion.usage };
}

export async function* chatStream(messages, opts = {}) {
  const r = await chat(messages, opts);
  yield { delta: r.content, done: false };
  yield { delta: '', done: true };
}

export async function embed(texts, { model = 'nomic-embed-text-v1.5' } = {}) {
  throw new ExternalServiceError('groq', 'Groq does not support embeddings. Use openai, gemini, or voyage for embeddings. Groq is chat-only.');
}
