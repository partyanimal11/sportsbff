/**
 * lib/live-games.ts — ESPN live scoreboard helper.
 *
 * Fetches today's games from ESPN's public site API. Used by /api/scan/game
 * to ground the OCR'd scoreboard in real, authoritative live-game data.
 *
 * Why this exists: vision OCR on a TV scorebug can be fuzzy (digits mis-read,
 * wrong period, sloppy team abbrev). ESPN knows for a fact what's playing
 * right now. By cross-referencing, we can:
 *   1. Confirm the scan matches a real live game (instead of trusting vision)
 *   2. Override vision's score/clock with ESPN's correct values
 *   3. Surface the broadcast network ("on NBC tonight") in the result
 *   4. Get the ESPN game ID for future enrichment (boxscore, leaders, plays)
 *
 * Caches responses for 30s in-memory to avoid hammering ESPN per scan.
 */

const ESPN_ENDPOINTS = {
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  wnba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard',
} as const;

export type League = 'nba' | 'nfl' | 'wnba';

export type LiveGame = {
  espnId: string;
  league: League;
  status: 'scheduled' | 'in_progress' | 'final' | 'postponed' | 'unknown';
  statusLabel: string; // ESPN's human-readable e.g. "In Progress", "Final"
  period: number;
  periodLabel: string; // "Q3", "1st Half", "Final"
  clock: string; // "9:39"
  home: { code: string; name: string; abbreviation: string; score: number; logo?: string };
  away: { code: string; name: string; abbreviation: string; score: number; logo?: string };
  broadcasts: string[]; // ["NBC", "Peacock"]
  startTime?: string; // ISO date
};

type CacheEntry = { fetchedAt: number; games: LiveGame[] };
const CACHE_TTL_MS = 30_000;
const CACHE: Partial<Record<League, CacheEntry>> = {};

/**
 * Fetch today's games for a league. Returns normalized LiveGame objects.
 * Uses an in-memory 30-second cache. Returns [] on any error (caller should
 * gracefully degrade — never let live-game lookup hard-fail a scan).
 */
export async function getTodaysGames(league: League): Promise<LiveGame[]> {
  const cached = CACHE[league];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.games;
  }

  // Fetch with abort guard so a slow ESPN doesn't hang the scan request
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4_000);
  try {
    const res = await fetch(ESPN_ENDPOINTS[league], {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'sportsbff/1.0' },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { events?: unknown[] };
    const events = Array.isArray(data.events) ? data.events : [];
    const games = events
      .map((e) => normalizeEvent(e, league))
      .filter((g): g is LiveGame => g !== null);
    CACHE[league] = { fetchedAt: Date.now(), games };
    return games;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Find a live game matching a vision-OCR'd team pair. Returns the best
 * match by status priority: in_progress > scheduled > final.
 *
 * Lenient string matching — vision might return "Sixers", "76ers", "PHI",
 * or "Philadelphia". We compare against ESPN's abbreviation, displayName,
 * shortDisplayName, and our internal team code.
 */
export function findGameByTeams(
  games: LiveGame[],
  homeHint: string | null | undefined,
  awayHint: string | null | undefined,
): LiveGame | null {
  if (!homeHint || !awayHint) return null;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const h = norm(homeHint);
  const a = norm(awayHint);

  const matches: LiveGame[] = [];
  for (const g of games) {
    const hh = norm(g.home.abbreviation) + ' ' + norm(g.home.name) + ' ' + norm(g.home.code);
    const aa = norm(g.away.abbreviation) + ' ' + norm(g.away.name) + ' ' + norm(g.away.code);

    const homeMatchesHome = hh.includes(h) || h.includes(norm(g.home.abbreviation)) || h.includes(norm(g.home.code));
    const awayMatchesAway = aa.includes(a) || a.includes(norm(g.away.abbreviation)) || a.includes(norm(g.away.code));

    // Vision sometimes swaps home/away (depends on scorebug layout)
    const homeMatchesAway = aa.includes(h) || h.includes(norm(g.away.abbreviation));
    const awayMatchesHome = hh.includes(a) || a.includes(norm(g.home.abbreviation));

    if ((homeMatchesHome && awayMatchesAway) || (homeMatchesAway && awayMatchesHome)) {
      matches.push(g);
    }
  }

  if (matches.length === 0) return null;

  // Prefer in-progress games over scheduled / final
  const order = { in_progress: 0, scheduled: 1, final: 2, postponed: 3, unknown: 4 } as const;
  matches.sort((x, y) => order[x.status] - order[y.status]);
  return matches[0];
}

/* ─────────────────────── internals ─────────────────────── */

function normalizeEvent(raw: unknown, league: League): LiveGame | null {
  try {
    const e = raw as Record<string, unknown>;
    const id = String(e.id ?? '');
    const competitions = Array.isArray(e.competitions) ? (e.competitions as Record<string, unknown>[]) : [];
    if (competitions.length === 0) return null;
    const comp = competitions[0];
    const competitors = Array.isArray(comp.competitors) ? (comp.competitors as Record<string, unknown>[]) : [];
    if (competitors.length !== 2) return null;

    // ESPN labels home/away via homeAway field
    const homeRaw = competitors.find((c) => c.homeAway === 'home') ?? competitors[0];
    const awayRaw = competitors.find((c) => c.homeAway === 'away') ?? competitors[1];
    const home = normalizeCompetitor(homeRaw);
    const away = normalizeCompetitor(awayRaw);
    if (!home || !away) return null;

    const status = (e.status as Record<string, unknown> | undefined) ?? {};
    const statusType = (status.type as Record<string, unknown> | undefined) ?? {};
    const statusLabel = String(statusType.description ?? statusType.shortDetail ?? 'Unknown');
    const period = Number(status.period ?? 0);
    const clock = String(status.displayClock ?? '');

    let normalizedStatus: LiveGame['status'] = 'unknown';
    const stateLower = String(statusType.state ?? '').toLowerCase();
    if (stateLower === 'in') normalizedStatus = 'in_progress';
    else if (stateLower === 'pre') normalizedStatus = 'scheduled';
    else if (stateLower === 'post') normalizedStatus = 'final';
    else if (statusLabel.toLowerCase().includes('postpone')) normalizedStatus = 'postponed';

    // Period label: prefer ESPN's display, fall back to "QN"
    const periodLabel =
      String(statusType.detail ?? '').match(/Q\d|OT|Half|Final|\d(?:st|nd|rd|th)/i)?.[0] ||
      (period > 0 ? `Q${period}` : '');

    // Broadcasts
    const broadcasts: string[] = [];
    const bcastRaw = comp.broadcasts;
    if (Array.isArray(bcastRaw)) {
      for (const b of bcastRaw as Record<string, unknown>[]) {
        if (Array.isArray(b.names)) {
          for (const n of b.names as string[]) {
            if (typeof n === 'string') broadcasts.push(n);
          }
        }
      }
    }

    return {
      espnId: id,
      league,
      status: normalizedStatus,
      statusLabel,
      period,
      periodLabel,
      clock,
      home,
      away,
      broadcasts,
      startTime: typeof e.date === 'string' ? e.date : undefined,
    };
  } catch {
    return null;
  }
}

function normalizeCompetitor(raw: Record<string, unknown> | undefined): LiveGame['home'] | null {
  if (!raw) return null;
  const team = (raw.team as Record<string, unknown> | undefined) ?? {};
  const abbreviation = String(team.abbreviation ?? '').toUpperCase();
  if (!abbreviation) return null;
  return {
    code: abbreviation.toLowerCase(), // matches our internal team codes
    name: String(team.displayName ?? team.name ?? abbreviation),
    abbreviation,
    score: Number(raw.score ?? 0),
    logo: typeof team.logo === 'string' ? team.logo : undefined,
  };
}
