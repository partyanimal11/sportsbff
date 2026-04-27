import { NextRequest } from 'next/server';
import { getOpenAI, MODELS, hasOpenAIKey } from '@/lib/openai';
import { getVoiceForLens, isValidVoice, type OpenAIVoice } from '@/lib/lens';

/**
 * POST /api/voice
 *
 * Body: { text: string, lens?: string, voice?: OpenAIVoice }
 *
 * Returns audio/mpeg stream from OpenAI TTS.
 *
 * Voice selection priority:
 *   1. Explicit `voice` field (if valid OpenAI voice ID)
 *   2. Lens-mapped default voice (via getVoiceForLens)
 *   3. 'nova' fallback
 *
 * Returns 503 with explanation when no API key (demo mode).
 */

export const runtime = 'nodejs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

const MAX_TEXT_LENGTH = 4096;

type RequestBody = {
  text?: string;
  lens?: string;
  voice?: string;
  model?: 'tts-1' | 'tts-1-hd';
};

export async function POST(req: NextRequest) {
  let body: RequestBody = {};
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const text = (body.text ?? '').trim();
  if (!text) {
    return new Response(JSON.stringify({ error: 'text field is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return new Response(
      JSON.stringify({ error: `text exceeds ${MAX_TEXT_LENGTH} chars` }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  // Demo mode — no API key, no audio
  if (!hasOpenAIKey()) {
    return new Response(
      JSON.stringify({
        error: 'Voice mode requires OPENAI_API_KEY',
        demo: true,
        hint: 'Set OPENAI_API_KEY in your Vercel environment to enable voice playback.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }

  // Pick the voice
  let voice: OpenAIVoice;
  if (body.voice && isValidVoice(body.voice)) {
    voice = body.voice;
  } else if (body.lens) {
    voice = getVoiceForLens(body.lens);
  } else {
    voice = 'nova';
  }

  const model = body.model === 'tts-1-hd' ? MODELS.TTS_HD : MODELS.TTS;

  try {
    // Strip markdown markers (asterisks, underscores, links) before TTS so the
    // voice doesn't read literal asterisks aloud.
    const cleaned = text
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1')     // italic
      .replace(/__([^_]+)__/g, '$1')     // bold underscore
      .replace(/_([^_]+)_/g, '$1')       // italic underscore
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links
      .replace(/`([^`]+)`/g, '$1')       // inline code
      .replace(/^#+\s+/gm, '')           // heading hashes
      .replace(/\n{2,}/g, '. ')          // paragraph breaks → sentence pause
      .replace(/\n/g, ' ')               // single newlines → space
      .trim();

    const audio = await getOpenAI().audio.speech.create({
      model,
      voice,
      input: cleaned,
      response_format: 'mp3',
      // speed: 1.0 (default — TTS slightly slower than human cadence sounds great)
    });

    // openai SDK returns a Response — stream the body straight through to the client
    const audioBuffer = Buffer.from(await audio.arrayBuffer());

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.length),
        'Cache-Control': 'public, max-age=86400, immutable', // 24h cache (text is content-addressable in practice)
        'X-Voice': voice,
        'X-Model': model,
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'TTS generation failed', detail: String(err).slice(0, 200) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      }
    );
  }
}
