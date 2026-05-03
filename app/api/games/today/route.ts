/**
 * GET /api/games/today?league=nba|nfl|wnba
 *
 * Returns today's games for a league, sorted by status (in-progress first,
 * then scheduled, then final). Powers SCOUT mode in the scan tab — the
 * "what game?" picker that bypasses vision when the user isn't watching on
 * a TV (or the camera scan failed).
 *
 * The response is the LiveGame normalized shape from lib/live-games.ts —
 * already cached server-side at 30s TTL, so this endpoint is essentially free.
 *
 * Response:
 * {
 *   "league": "nba",
 *   "games": [
 *     {
 *       "espn_id": "401869412",
 *       "status": "in_progress",
 *       "status_label": "In Progress",
 *       "home": { "team": "BOS", "name": "Boston Celtics", "score": 98 },
 *       "away": { "team": "PHI", "name": "Philadelphia 76ers", "score": 102 },
 *       "clock": "4:21",
 *       "period": 3,
 *       "period_label": "Q3",
 *       "broadcasts": ["NBC", "Peacock"],
 *       "start_time": "2026-05-02T19:30:00Z"
 *     }
 *   ]
 * }
 *
 * 2026-05-05: built for the SCOUT mode pivot.
 */
import { NextRequest } from 'next/server';
import { getTodaysGames, type League, type LiveGame } from '@/lib/live-games';

export const runtime = 'nodejs';
export const maxDuration = 10;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

const VALID_LEAGUES = new Set<League>(['nba', 'nfl', 'wnba']);
// Status sort order — in-progress first (most urgent), then scheduled, then final
const STATUS_ORDER: Record<LiveGame['status'], number> = {
  in_progress: 0,
  scheduled: 1,
  final: 2,
  postponed: 3,
  unknown: 4,
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const leagueParam = (url.searchParams.get('league') || '').toLowerCase();

  if (!VALID_LEAGUES.has(leagueParam as League)) {
    return new Response(
      JSON.stringify({
        error: 'invalid_league',
        message: 'league must be one of: nba, nfl, wnba',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    );
  }

  const league = leagueParam as League;
  const games = await getTodaysGames(league);
  const sorted = [...games].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );

  // Reshape into the public response format (snake_case matches /api/scan/game)
  const payload = sorted.map((g) => ({
    espn_id: g.espnId,
    status: g.status,
    status_label: g.statusLabel,
    home: {
      team: g.home.abbreviation,
      name: g.home.name,
      score: g.home.score,
    },
    away: {
      team: g.away.abbreviation,
      name: g.away.name,
      score: g.away.score,
    },
    clock: g.clock,
    period: g.period,
    period_label: g.periodLabel,
    broadcasts: g.broadcasts,
    start_time: g.startTime ?? null,
  }));

  return new Response(
    JSON.stringify({ league, games: payload, count: payload.length }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
        ...CORS_HEADERS,
      },
    },
  );
}
