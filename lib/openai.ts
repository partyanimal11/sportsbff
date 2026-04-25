import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  // Don't throw at import time during build; throw at first use.
  console.warn('[sportsBFF] OPENAI_API_KEY is not set. Chat endpoint will fail until you set it in .env.local.');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const MODELS = {
  /** Primary chat model — best quality voice. */
  CHAT: 'gpt-4o',
  /** Cheap mini for low-stakes content gen. */
  MINI: 'gpt-4o-mini',
  /** Vision model for /scan. */
  VISION: 'gpt-4o',
} as const;
