/**
 * POST /api/roster-lookup
 *
 * Backend endpoint for the iOS Phase 2 OCR-first scan flow.
 *
 * The iOS client reads jersey text + number on-device with Apple Vision
 * (VNRecognizeTextRequest), then POSTs whatever it found here. We narrow
 * the candidate pool to (ideally) one player so the app can show a
 * confirmation card before spending a GPT-4o vision call.
 *
 * Request:
 *   { teamHint?: string, number?: string, league?: 'nba'|'wnba'|'nfl' }
 *
 * Response:
 *   {
 *     resolvedTeams: [{ league, team }] | null,
 *     candidates: [{
 *       playerId, name, team, league,
 *       jerseyNumber, position,
 *       initials, instagram?
 *     }],
 *     count: number
 *   }
 *
 * Examples:
 *   { teamHint: "LAKERS", number: "23" }
 *     → 1 candidate (LeBron) → iOS shows "Looks like LeBron James?"
 *
 *   { teamHint: "FEVER", number: "22" }
 *     → 1 candidate (Caitlin Clark) → confirmation card
 *
 *   { teamHint: "WARRIORS", number: "11" }
 *     → 1 candidate (Klay) → confirmation card
 *
 *   { teamHint: "ATLANTA", number: "5" }
 *     → multiple candidates (Hawks #5, Dream #5, Falcons #5) → small picker
 *
 *   { number: "23" } (no teamHint)
 *     → 0 candidates → iOS falls through to GPT-4o vision
 */
import { NextRequest, NextResponse } from 'next/server';
import { rosterLookup, type League } from '@/lib/roster-lookup';

export const runtime = 'nodejs';

type RequestBody = {
  teamHint?: string | null;
  number?: string | null;
  league?: string | null;
};

const VALID_LEAGUES = new Set<League>(['nba', 'wnba', 'nfl']);

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const teamHint = (body.teamHint || '').trim() || null;
  const number = (body.number || '').trim() || null;
  const leagueRaw = (body.league || '').trim().toLowerCase() || null;
  const league =
    leagueRaw && VALID_LEAGUES.has(leagueRaw as League)
      ? (leagueRaw as League)
      : undefined;

  // Need at least one signal
  if (!teamHint && !number) {
    return NextResponse.json(
      {
        resolvedTeams: null,
        candidates: [],
        count: 0,
        message: 'Send at least teamHint or number',
      },
      { status: 200 }
    );
  }

  const { resolvedTeams, candidates } = rosterLookup({
    teamHint,
    number,
    league,
  });

  return NextResponse.json({
    resolvedTeams,
    candidates,
    count: candidates.length,
  });
}

// Allow GET for quick browser/curl smoke-testing
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const teamHint = url.searchParams.get('teamHint');
  const number = url.searchParams.get('number');
  const leagueRaw = url.searchParams.get('league');
  const league =
    leagueRaw && VALID_LEAGUES.has(leagueRaw as League)
      ? (leagueRaw as League)
      : undefined;

  if (!teamHint && !number) {
    return NextResponse.json({
      ok: true,
      message:
        'GET ?teamHint=LAKERS&number=23 (or POST { teamHint, number, league? })',
    });
  }

  const { resolvedTeams, candidates } = rosterLookup({
    teamHint,
    number,
    league,
  });

  return NextResponse.json({
    resolvedTeams,
    candidates,
    count: candidates.length,
  });
}
