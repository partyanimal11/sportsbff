/**
 * GET /api/admin/players-search?t=TOKEN&q=mahomes
 *
 * Lightweight player lookup for the tea-review UI. Returns up to 10 players
 * whose name fuzzy-matches the query. Used by Aaron when approving a gossip
 * item — he types a few letters of the player name, picks from dropdown.
 */

import { NextRequest, NextResponse } from 'next/server';
import gossipData from '@/data/players-gossip.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CuratedPlayer = {
  player_id: string;
  name: string;
  team: string;
  league: string;
};

// players-gossip.json is keyed by player_id (Record<string, Player>) — flatten to array
const ALL_PLAYERS: CuratedPlayer[] = Object.values(
  gossipData as unknown as Record<string, CuratedPlayer>,
).map((p) => ({
  player_id: p.player_id,
  name: p.name,
  team: p.team,
  league: p.league,
}));

function checkAuth(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false;
  return new URL(req.url).searchParams.get('t') === token;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const q = (new URL(req.url).searchParams.get('q') || '').trim().toLowerCase();
  if (q.length < 2) {
    return NextResponse.json({ ok: true, players: [] });
  }

  const matches = ALL_PLAYERS.filter((p) => p.name.toLowerCase().includes(q))
    .slice(0, 10)
    .map((p) => ({
      player_id: p.player_id,
      name: p.name,
      team: p.team.toUpperCase(),
      league: p.league,
    }));

  return NextResponse.json({ ok: true, players: matches });
}
