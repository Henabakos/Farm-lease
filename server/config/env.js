// ============================================================================
// Environment validation. Boot fails fast if required vars are missing or
// malformed — no silent defaults in production. Use this module everywhere
// instead of reading `process.env` directly.
// ============================================================================

import { z } from 'zod';

const bool = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  CLIENT_URL: z.string().url().default('http://localhost:3000'),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  PASSWORD_RESET_TTL: z.string().default('30m'),
  EMAIL_VERIFY_TTL: z.string().default('24h'),
  REQUIRE_ADMIN_APPROVAL: bool.default('false'),

  STORAGE_DRIVER: z.enum(['minio', 's3']).default('minio'),
  S3_ENDPOINT: z.string().url().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().default('farm-lease'),
  S3_FORCE_PATH_STYLE: bool.default('true'),

  MAIL_DRIVER: z.enum(['smtp', 'resend']).default('smtp'),
  MAIL_FROM: z.string().default('Farm Lease <no-reply@farmlease.local>'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  DEV_LOG_EMAIL_TOKENS: bool.default('true'),

  AI_LLM_PROVIDER: z.enum(['openai', 'gemini', 'voyage', 'groq', 'ollama', 'lmstudio']).default('openai'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  GEMINI_API_KEY: z.string().optional(),
  VOYAGE_API_KEY: z.string().optional(),
  VOYAGE_EMBEDDING_MODEL: z.string().default('voyage-3'),
  GROQ_API_KEY: z.string().optional(),
  GROQ_CHAT_MODEL: z.string().default('llama-3.3-70b-versatile'),
  GROQ_EMBEDDING_MODEL: z.string().default('nomic-embed-text-v1.5'),
  OLLAMA_HOST: z.string().default('http://localhost:11434'),
  OLLAMA_CHAT_MODEL: z.string().default('llama3'),
  OLLAMA_EMBEDDING_MODEL: z.string().default('nomic-embed-text'),
  LMSTUDIO_HOST: z.string().default('http://localhost:1234/v1'),
  LMSTUDIO_CHAT_MODEL: z.string().default('Meta-Llama-3.1-8B-Instruct'),
  LMSTUDIO_EMBEDDING_MODEL: z.string().default('nomic-embed-text-v1.5'),

  ZOOM_ACCOUNT_ID: z.string().optional(),
  ZOOM_CLIENT_ID: z.string().optional(),
  ZOOM_CLIENT_SECRET: z.string().optional(),
  ZOOM_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),

  RATE_LIMIT_GLOBAL_RPM: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_AUTH_RPM: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_AI_RPM: z.coerce.number().int().positive().default(30),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Pretty-print all issues, then crash. Never start with a half-configured app.
  console.error('[env] Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDev = env.NODE_ENV === 'development';
