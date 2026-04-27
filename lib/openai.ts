import OpenAI from 'openai';

/**
 * Lazy OpenAI client — only instantiated on first use.
 *
 * The OpenAI SDK throws at construction time if no API key is set, which
 * crashes the build on Vercel even when we're in demo mode (no key).
 * This getter defers instantiation until an actual call is made.
 */

let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('[sportsBFF] OPENAI_API_KEY is not set');
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

export const MODELS = {
  /** Primary chat model — best quality voice. */
  CHAT: 'gpt-4o',
  /** Cheap mini for low-stakes content gen + Today's Tea. */
  MINI: 'gpt-4o-mini',
  /** Vision model for /scan. */
  VISION: 'gpt-4o',
  /** Text-to-speech model for /voice. */
  TTS: 'tts-1',
  /** Higher-quality TTS (more expensive) — use for premium voice mode. */
  TTS_HD: 'tts-1-hd',
} as const;

/**
 * True if a usable OpenAI key is set. Use to short-circuit endpoints into
 * demo mode without throwing.
 */
export function hasOpenAIKey(): boolean {
  const k = process.env.OPENAI_API_KEY ?? '';
  return k.length >= 20 && k !== 'sk-...';
}
