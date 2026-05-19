// Voyage AI provider — adapter implementing the same surface as openai.js
// using direct HTTP API calls to avoid SDK import issues. Used when AI_LLM_PROVIDER=voyage.
//
// Note: Voyage AI specializes in embeddings and offers high-quality models.
// For chat functionality, Voyage AI can be combined with other providers, or
// you can use Voyage for embeddings only and OpenAI/Gemini for chat.
//
// Voyage AI embedding models output different dimensions than OpenAI's 1536;
// if you switch providers you must run a migration that re-indexes the
// `KbChunk.embedding` column with the correct vector size.
import { env } from '../../config/env.js';
import { ExternalServiceError } from '../../shared/errors.js';

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';

async function voyageEmbed(texts, { model = 'voyage-3' } = {}) {
  if (!env.VOYAGE_API_KEY) throw new ExternalServiceError('voyage', 'VOYAGE_API_KEY not configured');

  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: texts,
      model,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new ExternalServiceError('voyage', `Voyage API error: ${error}`);
  }

  const data = await response.json();
  return data.data.map((item) => item.embedding);
}

// Voyage AI is primarily an embedding provider. For chat, we'll use OpenAI as fallback
// or you can implement a separate chat provider.
export async function chat(messages, { model = 'gpt-4o-mini', temperature = 0.2 } = {}) {
  throw new ExternalServiceError('voyage', 'Voyage AI is an embedding-only provider. Use openai or gemini for chat.');
}

export async function* chatStream(messages, opts = {}) {
  throw new ExternalServiceError('voyage', 'Voyage AI is an embedding-only provider. Use openai or gemini for chat.');
}

export async function embed(texts, { model = 'voyage-3' } = {}) {
  return voyageEmbed(texts, { model });
}
