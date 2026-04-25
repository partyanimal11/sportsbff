import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getOpenAI, MODELS } from '@/lib/openai';
import { buildSystemPrompt } from '@/lib/context';
import { isValidLens, DEFAULT_LENS_ID } from '@/lib/lens';
import { findDemoAnswer, demoFallback, streamDemoAnswer } from '@/lib/demo-responses';

// Use Node runtime so we can read process.env reliably and short-circuit
// without an OpenAI key. Edge runtime works once the key is set.
export const runtime = 'nodejs';

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
  lens: z.string().optional(),
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
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const lensId = body.lens && isValidLens(body.lens) ? body.lens : DEFAULT_LENS_ID;
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
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // LIVE MODE — call OpenAI
  // ─────────────────────────────────────────────────────────
  const systemPrompt = buildSystemPrompt({ lensId, userMessage: last.content });

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
