// Ollama provider — adapter implementing the same surface as openai.js
// using the Ollama SDK for local inference. Used when AI_LLM_PROVIDER=ollama.
//
// Note: Ollama runs locally on your machine and provides free embeddings and chat.
// It's perfect for RAG systems and development without API costs.
//
// Ollama embedding models output different dimensions than OpenAI's 1536;
// if you switch providers you must run a migration that re-indexes the
// `KbDocumentChunk.embedding` column with the correct vector size.
import ollama from 'ollama';
import { env } from '../../config/env.js';
import { ExternalServiceError } from '../../shared/errors.js';

export async function chat(messages, { model = 'llama3', temperature = 0.2 } = {}) {
  const response = await ollama.chat({
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    options: { temperature },
    host: env.OLLAMA_HOST,
  });
  return { content: response.message.content, usage: null };
}

export async function* chatStream(messages, opts = {}) {
  const r = await chat(messages, opts);
  yield { delta: r.content, done: false };
  yield { delta: '', done: true };
}

export async function embed(texts, { model = 'nomic-embed-text' } = {}) {
  const embeddings = [];
  for (const text of texts) {
    const response = await ollama.embeddings({
      model,
      prompt: text,
      host: env.OLLAMA_HOST,
    });
    embeddings.push(response.embedding);
  }
  return embeddings;
}
