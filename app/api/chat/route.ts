import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getOpenAI, MODELS } from '@/lib/openai';
import { buildSystemPrompt, buildModesSystemPrompt, buildModesSystemPromptWithLive, type Mode } from '@/lib/context';
import { isValidLens, DEFAULT_LENS_ID } from '@/lib/lens';
import { findDemoAnswer, demoFallback, streamDemoAnswer } from '@/lib/demo-responses';
import { getLessonChatContext } from '@/lib/learn-content';

// Use Node runtime so we can read process.env reliably and short-circuit
// without an OpenAI key. Edge runtime works once the key is set.
export const runtime = 'nodejs';

// CORS headers — required for the iOS app (Rork build) to call this from
// a different origin. Lock down later if needed.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Preflight handler — Safari/iOS sends OPTIONS before POST when the body type
// is JSON or when custom headers are present.
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

const Schema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(40),
  // Master toggle: Tea'd Up. When true, responses get drama + tier pills.
  // When false, clean sports info only. Default: false.
  teadUp: z.boolean().optional(),
  // Context for personalization
  league: z.enum(['nfl', 'nba', 'both']).optional(),
  displayName: z.string().max(60).optional(),
  euphoriaLensEnabled: z.boolean().optional(),
  // Legacy fields — accepted for back-compat, but teadUp is the new master
  lens: z.string().optional(),
  dramaMode: z.boolean().optional(),
  modes: z.array(z.enum(['drama', 'on_field', 'learn'])).optional(),
  // Learn tab — when the user opens chat from inside a lesson, pass the lesson
  // slug so Goldie can answer questions grounded in that specific lesson's content.
  lessonContext: z.object({
    lessonSlug: z.string(),
  }).optional(),
});

/**
 * Streaming chat endpoint.
 *
 * If OPENAI_API_KEY is missing or starts with 'sk-...' (the placeholder),
 * we run in DEMO MODE — pattern-match against the canned response library.
 *
 * Once a real key is set, the real OpenAI streaming kicks in.
 */
export async function POST(req: NextRequest) {
  let body: z.infer<typeof Schema>;
  try {
    body = Schema.parse(await req.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  const lensId = body.lens && isValidLens(body.lens) ? body.lens : DEFAULT_LENS_ID;
  const dramaMode = !!body.dramaMode;
  const last = body.messages[body.messages.length - 1];

  const apiKey = process.env.OPENAI_API_KEY ?? '';
  const isDemoMode = !apiKey || apiKey === 'sk-...' || apiKey.length < 20;

  // ─────────────────────────────────────────────────────────
  // DEMO MODE — no API key, use canned answers
  // ─────────────────────────────────────────────────────────
  if (isDemoMode) {
    const matched = findDemoAnswer(last.content, lensId);
    const answer = matched ?? demoFallback(lensId);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Header so the client knows we're in demo mode (optional UX hint)
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ meta: { demo: true } })}\n\n`)
        );
        try {
          for await (const chunk of streamDemoAnswer(answer)) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta: chunk })}\n\n`)
            );
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        ...CORS_HEADERS,
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // LIVE MODE — call OpenAI
  // ─────────────────────────────────────────────────────────
  // Resolve the Tea'd Up master state. Priority:
  //   1. Explicit body.teadUp (new system)
  //   2. body.modes including 'drama' (legacy modes payload)
  //   3. body.dramaMode (oldest sportsBFF flag)
  const teadUp = body.teadUp ?? (body.modes?.includes('drama') ?? body.dramaMode ?? false);

  // For the sportsBFF voice, we always use the modes-based prompt now.
  // teadUp=true → ['drama', 'on_field', 'learn'] gets the full spicy treatment.
  // teadUp=false → ['on_field', 'learn'] only — clean sports, no gossip.
  const activeModes: Mode[] = teadUp
    ? ['drama', 'on_field', 'learn']
    : ['on_field', 'learn'];

  // Live-aware variant prepends today's date + ESPN headlines + active games so
  // the model isn't stuck in 2023. ESPN-fetch failures fall back to the sync
  // version automatically — chat never breaks if ESPN is down.
  let systemPrompt = await buildModesSystemPromptWithLive({
    modes: activeModes,
    userMessage: last.content,
    league: body.league ?? 'both',
    displayName: body.displayName,
    euphoriaLensEnabled: !!body.euphoriaLensEnabled,
  });

  // If the user is asking from inside a Learn lesson, append the lesson's full
  // content to the system prompt so Goldie can answer with confidence about
  // anything in that lesson. Falls through silently if slug doesn't match.
  if (body.lessonContext?.lessonSlug) {
    const lessonCtx = getLessonChatContext(body.lessonContext.lessonSlug);
    if (lessonCtx) {
      systemPrompt = `${systemPrompt}\n\n────────────────────────────────────\n${lessonCtx}`;
    }
  }

  const completion = await getOpenAI().chat.completions.create({
    model: MODELS.CHAT,
    stream: true,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      ...body.messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of completion) {
          const delta = part.choices[0]?.delta?.content ?? '';
          if (delta) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
