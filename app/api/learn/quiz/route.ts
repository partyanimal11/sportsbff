/**
 * GET  /api/learn/quiz?slug=nfl/01-the-rules
 *   → returns the quiz questions (without correct answers — those stay server-side)
 *
 * POST /api/learn/quiz?slug=nfl/01-the-rules
 *   body: { answers: [0, 2, 1, 3, 0] }   — index per question
 *   → returns per-question correctness + total score + pass/fail
 *
 * iOS uses GET to render the quiz, then POSTs the answers and shows results.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getQuiz, gradeQuiz } from '@/lib/learn-content';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return NextResponse.json(
      { error: 'Missing slug query param' },
      { status: 400, headers: CORS_HEADERS }
    );
  }
  const quiz = getQuiz(slug);
  if (!quiz) {
    return NextResponse.json(
      { error: `Quiz not found for ${slug}` },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  // Strip correctIndex + explanation from outbound questions — server keeps those private
  const sanitized = {
    lessonSlug: quiz.lessonSlug,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
    })),
  };

  return NextResponse.json(sanitized, { headers: CORS_HEADERS });
}

type GradeBody = { answers?: number[] };

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return NextResponse.json(
      { error: 'Missing slug query param' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  let body: GradeBody = {};
  try {
    body = (await req.json()) as GradeBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const answers = Array.isArray(body.answers) ? body.answers : [];
  const result = gradeQuiz(slug, answers);

  if (!result.found) {
    return NextResponse.json(
      { error: `Quiz not found for ${slug}` },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(result, { headers: CORS_HEADERS });
}
