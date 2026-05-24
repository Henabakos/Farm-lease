// Provider switch — selects the active LLM implementation based on env.
// Modules elsewhere should import from this file, never directly from a
// vendor adapter, so swapping providers is a single env change.
import { env } from '../../config/env.js';
import * as openai from './openai.js';
import * as gemini from './gemini.js';
import * as voyage from './voyage.js';
import * as groq from './groq.js';
import * as ollama from './ollama.js';
import * as lmstudio from './lmstudio.js';

const impl = env.AI_LLM_PROVIDER === 'gemini' ? gemini : env.AI_LLM_PROVIDER === 'voyage' ? voyage : env.AI_LLM_PROVIDER === 'groq' ? groq : env.AI_LLM_PROVIDER === 'ollama' ? ollama : env.AI_LLM_PROVIDER === 'lmstudio' ? lmstudio : openai;

export const chat       = (...args) => impl.chat(...args);
export const chatStream = (...args) => impl.chatStream(...args);
export const embed      = (...args) => impl.embed(...args);
