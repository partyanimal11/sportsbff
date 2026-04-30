/**
 * Live context layer — keeps the AI grounded in TODAY, not its training cutoff.
 *
 * GPT-4o's knowledge ends ~April 2024. Without a live context injection, the
 * model thinks it's 2023, hedges every recent question, and outright invents
 * stale storylines. This module pulls fresh headlines + active games from
 * ESPN's free public API and formats them into a compact block we paste into
 * the system prompt.
 *
 * Caching: we use Next.js's built-in fetch revalidation (`next.revalidate`).
 * Vercel's data-cache layer keeps responses fresh for 1 hour with zero infra.
 *
 * Failure mode: if ESPN is down, we silently return null and the chat still
 * works — just without the live block. Never throw.
 */

const ESPN_NBA_NEWS = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=10';
const ESPN_NFL_NEWS = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=10';
const ESPN_WNBA_NEWS = 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/news?limit=10';
const ESPN_NBA_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';
const ESPN_NFL_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const ESPN_WNBA_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard';

/** Cache freshness — 1 hour for headlines, 5 minutes for live scores. */
const HEADLINE_TTL = 60 * 60;
const SCORE_TTL = 60 * 5;

type ESPNArticle = {
  headline?: string;
  description?: string;
  published?: string;
  links?: { web?: { href?: string } };
};
type ESPNNewsResponse = { articles?: ESPNArticle[] };

type ESPNCompetitor = {
  team?: { abbreviation?: string; displayName?: string };
  score?: string;
};
type ESPNEvent = {
  name?: string;
  shortName?: string;
  status?: {
    type?: { shortDetail?: string; completed?: boolean; state?: string };
  };
  competitions?: { competitors?: ESPNCompetitor[] }[];
};
type ESPNScoreboardResponse = { events?: ESPNEvent[]; season?: { year?: number; type?: number } };

/* ──────────────────────────────────────────────────────────────────────── */

/** Today in YYYY-MM-DD (UTC) plus the day-of-week in plain English. */
export function getTodayContext(): string {
  const now = new Date();
  const iso = now.toISOString().slice(0, 10);
  const dow = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/New_York' });
  const longDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
  return `Today is ${longDate} (${iso}). Day of week: ${dow}.`;
}

/** Determine the active NBA + NFL + WNBA season phase based on calendar month. */
export function getSeasonPhase(): { nba: string; nfl: string; wnba: string } {
  const month = new Date().getUTCMonth() + 1; // 1-12
  let nba: string;
  if (month >= 4 && month <= 6) nba = '2025-26 NBA Playoffs underway (Conference Finals through Finals)';
  else if (month >= 10 && month <= 12) nba = '2025-26 NBA regular season — early/mid year';
  else if (month >= 1 && month <= 3) nba = '2025-26 NBA regular season — stretch run, All-Star break around mid-Feb';
  else nba = '2025-26 NBA offseason — Free agency, summer league, draft just behind';

  let nfl: string;
  if (month === 1 || month === 2) nfl = '2025 NFL playoffs / Super Bowl LX in early Feb';
  else if (month >= 3 && month <= 7) nfl = 'NFL offseason — free agency, draft (April), OTAs, training camp';
  else if (month === 8) nfl = 'NFL preseason / training camps wrapping up';
  else if (month >= 9 && month <= 12) nfl = '2025 NFL regular season in full swing';
  else nfl = 'NFL season transition';

  // WNBA season runs ~mid-May through October. Playoffs Sept-Oct.
  let wnba: string;
  if (month === 4) wnba = '2026 WNBA preseason / season opener May 16. Trade season just wrapped.';
  else if (month >= 5 && month <= 7) wnba = '2026 WNBA regular season — All-Star break in mid-July';
  else if (month === 8) wnba = '2026 WNBA regular season stretch run — playoff race tightening';
  else if (month === 9) wnba = '2026 WNBA Playoffs underway';
  else if (month === 10) wnba = '2026 WNBA Finals (early Oct)';
  else wnba = '2026 WNBA offseason — players overseas (Unrivaled league, EuroLeague), free agency, draft April';

  return { nba, nfl, wnba };
}

/* ──────────────────────────────────────────────────────────────────────── */

/** Fetch top news headlines from ESPN. Returns null on failure (never throws). */
async function fetchNews(url: string): Promise<ESPNArticle[]> {
  try {
    const res = await fetch(url, { next: { revalidate: HEADLINE_TTL } });
    if (!res.ok) return [];
    const data = (await res.json()) as ESPNNewsResponse;
    return data.articles ?? [];
  } catch {
    return [];
  }
}

/** Fetch today's scoreboard. Returns null on failure. */
async function fetchScoreboard(url: string): Promise<ESPNEvent[]> {
  try {
    const res = await fetch(url, { next: { revalidate: SCORE_TTL } });
    if (!res.ok) return [];
    const data = (await res.json()) as ESPNScoreboardResponse;
    return data.events ?? [];
  } catch {
    return [];
  }
}

/* ──────────────────────────────────────────────────────────────────────── */

/**
 * Build the live-context block to inject into the system prompt.
 * Returns a multi-line string with: today's date, season phase, top NBA + NFL
 * headlines, and any games happening today/in-progress.
 *
 * Designed to be ~250-400 tokens — small enough to inject on every chat
 * call without blowing up cost.
 */
export async function buildLiveContext({ league = 'all' }: { league?: 'nfl' | 'nba' | 'wnba' | 'both' | 'all' } = {}): Promise<string> {
  const today = getTodayContext();
  const phase = getSeasonPhase();

  // 'both' is a legacy value for NBA + NFL only (no WNBA). 'all' includes WNBA.
  const wantNba = league === 'nba' || league === 'both' || league === 'all';
  const wantNfl = league === 'nfl' || league === 'both' || league === 'all';
  const wantWnba = league === 'wnba' || league === 'all';

  // Parallel fetch — headlines + scores for whichever league(s) the user cares about
  const fetches: Promise<{ key: string; data: ESPNArticle[] | ESPNEvent[] }>[] = [];
  if (wantNba) {
    fetches.push(fetchNews(ESPN_NBA_NEWS).then((d) => ({ key: 'nbaNews', data: d })));
    fetches.push(fetchScoreboard(ESPN_NBA_SCOREBOARD).then((d) => ({ key: 'nbaGames', data: d })));
  }
  if (wantNfl) {
    fetches.push(fetchNews(ESPN_NFL_NEWS).then((d) => ({ key: 'nflNews', data: d })));
    fetches.push(fetchScoreboard(ESPN_NFL_SCOREBOARD).then((d) => ({ key: 'nflGames', data: d })));
  }
  if (wantWnba) {
    fetches.push(fetchNews(ESPN_WNBA_NEWS).then((d) => ({ key: 'wnbaNews', data: d })));
    fetches.push(fetchScoreboard(ESPN_WNBA_SCOREBOARD).then((d) => ({ key: 'wnbaGames', data: d })));
  }

  const results = await Promise.all(fetches);
  const lookup = Object.fromEntries(results.map((r) => [r.key, r.data]));

  const lines: string[] = [
    `🗓 ${today}`,
    '',
    'CURRENT SEASON STATUS:',
  ];
  if (wantNba) lines.push(`  • NBA: ${phase.nba}`);
  if (wantNfl) lines.push(`  • NFL: ${phase.nfl}`);
  if (wantWnba) lines.push(`  • WNBA: ${phase.wnba}`);

  // ── NBA HEADLINES ────────────────────────────────────────────────────────
  if ((league === 'nba' || league === 'both') && lookup.nbaNews) {
    const articles = (lookup.nbaNews as ESPNArticle[]).slice(0, 8);
    if (articles.length) {
      lines.push('', 'TOP NBA HEADLINES (live, today):');
      for (const a of articles) {
        const head = a.headline?.trim();
        if (!head) continue;
        const date = a.published ? a.published.slice(0, 10) : '';
        lines.push(`  • ${head}${date ? ` (${date})` : ''}`);
      }
    }
  }

  // ── NFL HEADLINES ────────────────────────────────────────────────────────
  if (wantNfl && lookup.nflNews) {
    const articles = (lookup.nflNews as ESPNArticle[]).slice(0, 8);
    if (articles.length) {
      lines.push('', 'TOP NFL HEADLINES (live, today):');
      for (const a of articles) {
        const head = a.headline?.trim();
        if (!head) continue;
        const date = a.published ? a.published.slice(0, 10) : '';
        lines.push(`  • ${head}${date ? ` (${date})` : ''}`);
      }
    }
  }

  // ── WNBA HEADLINES ───────────────────────────────────────────────────────
  if (wantWnba && lookup.wnbaNews) {
    const articles = (lookup.wnbaNews as ESPNArticle[]).slice(0, 8);
    if (articles.length) {
      lines.push('', 'TOP WNBA HEADLINES (live, today):');
      for (const a of articles) {
        const head = a.headline?.trim();
        if (!head) continue;
        const date = a.published ? a.published.slice(0, 10) : '';
        lines.push(`  • ${head}${date ? ` (${date})` : ''}`);
      }
    }
  }

  // ── TODAY'S GAMES (NBA) ──────────────────────────────────────────────────
  if (wantNba && lookup.nbaGames) {
    const events = lookup.nbaGames as ESPNEvent[];
    if (events.length) {
      lines.push('', "TODAY'S NBA GAMES:");
      for (const e of events.slice(0, 8)) {
        const matchup = e.shortName ?? e.name ?? '';
        const status = e.status?.type?.shortDetail ?? '';
        const comps = e.competitions?.[0]?.competitors ?? [];
        const scoreStr = comps.length === 2 && (comps[0].score || comps[1].score)
          ? ` (${comps[0].team?.abbreviation} ${comps[0].score} – ${comps[1].team?.abbreviation} ${comps[1].score})`
          : '';
        lines.push(`  • ${matchup}${scoreStr} — ${status}`);
      }
    }
  }

  // ── TODAY'S GAMES (NFL) ──────────────────────────────────────────────────
  if (wantNfl && lookup.nflGames) {
    const events = lookup.nflGames as ESPNEvent[];
    if (events.length) {
      lines.push('', "TODAY'S NFL GAMES:");
      for (const e of events.slice(0, 8)) {
        const matchup = e.shortName ?? e.name ?? '';
        const status = e.status?.type?.shortDetail ?? '';
        const comps = e.competitions?.[0]?.competitors ?? [];
        const scoreStr = comps.length === 2 && (comps[0].score || comps[1].score)
          ? ` (${comps[0].team?.abbreviation} ${comps[0].score} – ${comps[1].team?.abbreviation} ${comps[1].score})`
          : '';
        lines.push(`  • ${matchup}${scoreStr} — ${status}`);
      }
    }
  }

  // ── TODAY'S GAMES (WNBA) ─────────────────────────────────────────────────
  if (wantWnba && lookup.wnbaGames) {
    const events = lookup.wnbaGames as ESPNEvent[];
    if (events.length) {
      lines.push('', "TODAY'S WNBA GAMES:");
      for (const e of events.slice(0, 8)) {
        const matchup = e.shortName ?? e.name ?? '';
        const status = e.status?.type?.shortDetail ?? '';
        const comps = e.competitions?.[0]?.competitors ?? [];
        const scoreStr = comps.length === 2 && (comps[0].score || comps[1].score)
          ? ` (${comps[0].team?.abbreviation} ${comps[0].score} – ${comps[1].team?.abbreviation} ${comps[1].score})`
          : '';
        lines.push(`  • ${matchup}${scoreStr} — ${status}`);
      }
    }
  }

  lines.push(
    '',
    'USE THESE LIVE FACTS:',
    '  • You ARE current. Today\'s date is above. Do NOT say "as of my last update" or "as of 2023/2024".',
    '  • If asked about a game, headline, or trade above, treat it as current and reference it directly.',
    '  • If asked about something NOT covered above, say "I don\'t have today\'s number on that — wanna check ESPN, or want me to pull what we know?" — never invent specific stats or quotes.',
    '  • For drama/gossip, the curated database (already in your context) is the source of truth, not the headlines feed.',
  );

  return lines.join('\n');
}
