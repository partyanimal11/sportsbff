/**
 * GET /api/learn/lessons
 *
 * Returns the list of all lessons (summary form — no full body).
 *
 * Query params:
 *   ?lens=euphoria,bachelor   — comma-separated list of lenses the user has
 *                              unlocked. Locked lessons are hidden unless their
 *                              lens is in this list.
 *   ?league=nfl|nba|wnba      — filter by league (optional)
 *
 * iOS calls this on Learn-tab open. Server is fast (pure data lookup, ~5ms).
 */
import { NextRequest, NextResponse } from 'next/server';
import { listLessons } from '@/lib/learn-content';

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
  const lensParam = url.searchParams.get('lens') || '';
  const leagueParam = url.searchParams.get('league');

  const lensesUnlocked = lensParam
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const league =
    leagueParam === 'nfl' || leagueParam === 'nba' || leagueParam === 'wnba'
      ? leagueParam
      : undefined;

  const lessons = listLessons({ lensesUnlocked, league });

  return NextResponse.json(
    { lessons, count: lessons.length },
    { headers: CORS_HEADERS }
  );
}
