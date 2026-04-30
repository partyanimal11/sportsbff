/**
 * GET /api/learn/lesson?slug=nfl/01-the-rules
 *
 * Returns the full lesson body (all sections) + the associated flashcard deck.
 * Used by the iOS lesson reader.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLesson, getFlashcards } from '@/lib/learn-content';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  const lesson = getLesson(slug);
  if (!lesson) {
    return NextResponse.json(
      { error: `Lesson not found: ${slug}` },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const flashcards = getFlashcards(slug);

  return NextResponse.json(
    {
      lesson,
      flashcards: flashcards?.cards ?? [],
    },
    { headers: CORS_HEADERS }
  );
}
