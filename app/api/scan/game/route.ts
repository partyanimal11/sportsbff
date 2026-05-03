/**
 * POST /api/scan/game
 *
 * Game-scan / scoreboard recognition. User points their phone at a TV
 * scorebug; we extract team codes + scores + clock, then return everything
 * needed to watch this game like an informed fan: matchup, both rosters with
 * per-player tea, plain-English game state explainer, and the top tea cards
 * for the matchup overall.
 *
 * THIS IS THE V1 HERO ENDPOINT. After legal review of face-recognition
 * exposure (see TEA_APP_TECHNICAL_HANDOFF.md), scoreboard scan replaces
 * face scan as the primary scan flow — it sidesteps biometric law entirely
 * (it's just OCR on a graphic), is more reliable, and gives a richer answer.
 *
 * Request: multipart/form-data with field `image` = JPEG/PNG bytes.
 *
 * Response shape (matched / happy path):
 * {
 *   "league": "nba" | "nfl" | "wnba",
 *   "matchup": {
 *     "home": { "team": "PHI", "name": "Philadelphia 76ers", "score": 102 },
 *     "away": { "team": "MIA", "name": "Miami Heat",        "score": 98 },
 *     "clock": "2:14", "period": 4, "period_label": "4Q"
 *   },
 *   "rosters": {
 *     "home": [{ id, name, jersey, pos, headshot, tea: [...], hasTea }],
 *     "away": [ ... ]
 *   },
 *   "blurb": "Sixers up 4 in the closing minutes — Embiid + Maxey carrying.",
 *   "explainer": {
 *     "whats_happening": "Sixers up 4, 4Q · 2:14 left.",
 *     "rules_explainer": "Basketball games are 4 quarters... Under 3 minutes left — crunch time...",
 *     "close_game": true
 *   },
 *   "matchup_tea": [   // top 5 tier-sorted tea cards across both rosters
 *     { player_id, player_name, team, headshot, tier, category, headline, summary, source }
 *   ],
 *   "stats": { home_roster_size, away_roster_size, total_tea_items, ... }
 * }
 *
 * Error shapes (all 200 OK with error field for graceful client handling):
 *   { "error": "no_scoreboard" | "unknown_teams" | "vision_error" | "no_key", "message": "..." }
 *
 * 2026-05-04: scaffolded as the "I'm at the bar, what's the lineup" feature.
 * 2026-05-05: extended with per-player tea + rules explainer + matchup_tea
 *             after pivoting away from face scan to scoreboard-first.
 */
import { NextRequest } from 'next/server';
import { getOpenAI, MODELS, hasOpenAIKey } from '@/lib/openai';
import rostersData from '@/data/rosters.json';
import gossipData from '@/data/players-gossip.json';
import { getFaceEntry } from '@/lib/face-match';

export const runtime = 'nodejs';
// Vision call + roster lookup. Keep budget below Vercel ceiling.
export const maxDuration = 25;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

type RosterPlayer = { id: string; jersey: string; pos: string };
type RostersFile = { rosters: Record<string, RosterPlayer[]> };
const ROSTERS = (rostersData as RostersFile).rosters;

type GossipSource = { name: string; url: string; date: string };
type GossipItem = {
  id: string;
  tier: 'confirmed' | 'reported' | 'speculation' | 'rumor';
  category: string;
  headline: string;
  summary: string;
  sources: GossipSource[];
};
type GossipPlayer = {
  player_id: string;
  name: string;
  team: string;
  league: string;
  items: GossipItem[];
};
const GOSSIP: Record<string, GossipPlayer> = gossipData as Record<string, GossipPlayer>;

/**
 * Pick the top N tea items for a player, preferring higher-tier (confirmed >
 * reported > speculation > rumor). Used to surface the most-defensible
 * drama on each roster card.
 */
const TIER_RANK: Record<string, number> = { confirmed: 4, reported: 3, speculation: 2, rumor: 1 };
function pickTopTea(items: GossipItem[], n: number): GossipItem[] {
  return [...items]
    .sort((a, b) => (TIER_RANK[b.tier] || 0) - (TIER_RANK[a.tier] || 0))
    .slice(0, n);
}

/**
 * Slug → display name fallback when the player isn't in the gossip DB.
 * Roster has e.g. id "patrick-mahomes" but no full-name field; capitalize
 * each token. Suffixes like "ii"/"iii"/"jr" get uppercased properly.
 */
function nameFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((s) => {
      if (s === 'ii' || s === 'iii' || s === 'iv') return s.toUpperCase();
      if (s === 'jr' || s === 'sr') return s.charAt(0).toUpperCase() + s.slice(1) + '.';
      return s.charAt(0).toUpperCase() + s.slice(1);
    })
    .join(' ');
}

/**
 * Map the team name + 3-letter abbrev that vision returns to our short
 * roster code. Vision outputs vary: "PHI", "76ers", "Sixers", "Philadelphia",
 * "Philadelphia 76ers", or even broadcast scorebug forms like "PHILA".
 */
const NAME_TO_CODE: Record<string, { league: string; code: string; full: string }> = {};
function reg(league: string, code: string, full: string, ...aliases: string[]) {
  for (const a of [code, full, ...aliases]) {
    NAME_TO_CODE[a.toLowerCase()] = { league, code, full };
  }
}
// NBA 30
reg('nba', 'atl', 'Atlanta Hawks', 'hawks');
reg('nba', 'bos', 'Boston Celtics', 'celtics', 'bos celtics');
reg('nba', 'bkn', 'Brooklyn Nets', 'brk', 'nets', 'brooklyn');
reg('nba', 'cha', 'Charlotte Hornets', 'hornets');
reg('nba', 'chi', 'Chicago Bulls', 'bulls');
reg('nba', 'cle', 'Cleveland Cavaliers', 'cavs', 'cavaliers');
reg('nba', 'dal', 'Dallas Mavericks', 'mavs', 'mavericks');
reg('nba', 'den', 'Denver Nuggets', 'nuggets');
reg('nba', 'det', 'Detroit Pistons', 'pistons');
reg('nba', 'gs', 'Golden State Warriors', 'gsw', 'warriors');
reg('nba', 'hou', 'Houston Rockets', 'rockets');
reg('nba', 'ind', 'Indiana Pacers', 'pacers');
reg('nba', 'lac', 'LA Clippers', 'la clippers', 'clippers', 'los angeles clippers');
reg('nba', 'lal', 'LA Lakers', 'la lakers', 'lakers', 'los angeles lakers');
reg('nba', 'mem', 'Memphis Grizzlies', 'grizzlies');
reg('nba', 'mia', 'Miami Heat', 'heat');
reg('nba', 'mil', 'Milwaukee Bucks', 'bucks');
reg('nba', 'min', 'Minnesota Timberwolves', 'wolves', 'timberwolves');
reg('nba', 'no', 'New Orleans Pelicans', 'nop', 'pelicans');
reg('nba', 'ny', 'New York Knicks', 'nyk', 'knicks');
reg('nba', 'okc', 'Oklahoma City Thunder', 'thunder', 'oklahoma city');
reg('nba', 'orl', 'Orlando Magic', 'magic');
reg('nba', 'phi', 'Philadelphia 76ers', '76ers', 'sixers', 'philly', 'phila');
reg('nba', 'phx', 'Phoenix Suns', 'phoenix', 'suns');
reg('nba', 'por', 'Portland Trail Blazers', 'blazers', 'trail blazers');
reg('nba', 'sa', 'San Antonio Spurs', 'sas', 'spurs');
reg('nba', 'sac', 'Sacramento Kings', 'kings');
reg('nba', 'tor', 'Toronto Raptors', 'raptors');
reg('nba', 'utah', 'Utah Jazz', 'uta', 'jazz');
reg('nba', 'wsh', 'Washington Wizards', 'was', 'wizards');
// NFL 32
reg('nfl', 'ari', 'Arizona Cardinals', 'cardinals');
reg('nfl', 'atl', 'Atlanta Falcons', 'falcons');
reg('nfl', 'bal', 'Baltimore Ravens', 'ravens');
reg('nfl', 'buf', 'Buffalo Bills', 'bills');
reg('nfl', 'car', 'Carolina Panthers', 'panthers');
reg('nfl', 'chi', 'Chicago Bears', 'bears');
reg('nfl', 'cin', 'Cincinnati Bengals', 'bengals');
reg('nfl', 'cle', 'Cleveland Browns', 'browns');
reg('nfl', 'dal', 'Dallas Cowboys', 'cowboys');
reg('nfl', 'den', 'Denver Broncos', 'broncos');
reg('nfl', 'det', 'Detroit Lions', 'lions');
reg('nfl', 'gb', 'Green Bay Packers', 'packers');
reg('nfl', 'hou', 'Houston Texans', 'texans');
reg('nfl', 'ind', 'Indianapolis Colts', 'colts');
reg('nfl', 'jax', 'Jacksonville Jaguars', 'jaguars', 'jags');
reg('nfl', 'kc', 'Kansas City Chiefs', 'chiefs');
reg('nfl', 'lv', 'Las Vegas Raiders', 'raiders');
reg('nfl', 'lac', 'Los Angeles Chargers', 'chargers');
reg('nfl', 'lar', 'Los Angeles Rams', 'rams');
reg('nfl', 'mia', 'Miami Dolphins', 'dolphins');
reg('nfl', 'min', 'Minnesota Vikings', 'vikings');
reg('nfl', 'ne', 'New England Patriots', 'patriots', 'pats');
reg('nfl', 'no', 'New Orleans Saints', 'saints');
reg('nfl', 'nyg', 'New York Giants', 'giants');
reg('nfl', 'nyj', 'New York Jets', 'jets');
reg('nfl', 'phi', 'Philadelphia Eagles', 'eagles');
reg('nfl', 'pit', 'Pittsburgh Steelers', 'steelers');
reg('nfl', 'sf', 'San Francisco 49ers', '49ers', 'niners');
reg('nfl', 'sea', 'Seattle Seahawks', 'seahawks');
reg('nfl', 'tb', 'Tampa Bay Buccaneers', 'bucs', 'buccaneers');
reg('nfl', 'ten', 'Tennessee Titans', 'titans');
reg('nfl', 'wsh', 'Washington Commanders', 'commanders');
// WNBA 15
reg('wnba', 'atl', 'Atlanta Dream', 'dream');
reg('wnba', 'chi', 'Chicago Sky', 'sky');
reg('wnba', 'con', 'Connecticut Sun', 'sun', 'conn');
reg('wnba', 'dal', 'Dallas Wings', 'wings');
reg('wnba', 'gs', 'Golden State Valkyries', 'valkyries');
reg('wnba', 'ind', 'Indiana Fever', 'fever');
reg('wnba', 'la', 'Los Angeles Sparks', 'sparks', 'la sparks');
reg('wnba', 'lv', 'Las Vegas Aces', 'aces');
reg('wnba', 'min', 'Minnesota Lynx', 'lynx');
reg('wnba', 'ny', 'New York Liberty', 'liberty');
reg('wnba', 'phx', 'Phoenix Mercury', 'mercury');
reg('wnba', 'por', 'Portland Fire', 'fire');
reg('wnba', 'sea', 'Seattle Storm', 'storm');
reg('wnba', 'tor', 'Toronto Tempo', 'tempo');
reg('wnba', 'wsh', 'Washington Mystics', 'mystics');

function lookupTeam(input?: string | null): { league: string; code: string; full: string } | null {
  if (!input) return null;
  const k = input.toLowerCase().trim();
  if (NAME_TO_CODE[k]) return NAME_TO_CODE[k];
  // Substring fallback
  for (const [name, info] of Object.entries(NAME_TO_CODE)) {
    if (name.length >= 3 && (k.includes(name) || name.includes(k))) return info;
  }
  return null;
}

/**
 * Enrich a roster with face headshots + per-player tea snippets. Each player
 * comes back with up to 2 top-tier tea items pulled from the gossip DB so the
 * client can render drama-tagged player cards directly without a follow-up
 * API call. Players not in the gossip DB just get an empty `tea` array.
 */
function enrichRoster(league: string, teamCode: string) {
  const key = `${league}/${teamCode}`;
  const players = ROSTERS[key] ?? [];
  return players.map((p) => {
    const face = getFaceEntry(p.id);
    const gossip = GOSSIP[p.id];
    const teaItems = gossip ? pickTopTea(gossip.items, 2) : [];
    return {
      id: p.id,
      name: gossip?.name || nameFromSlug(p.id),
      jersey: p.jersey,
      pos: p.pos,
      headshot: face?.headshot ?? null,
      tea: teaItems.map((it) => ({
        tier: it.tier,
        category: it.category,
        headline: it.headline,
        summary: it.summary.length > 200 ? it.summary.slice(0, 197) + '...' : it.summary,
        // Truncate sources to first one for compactness; client can fetch full /api/player/[id] for more
        source: it.sources[0]
          ? { name: it.sources[0].name, url: it.sources[0].url, date: it.sources[0].date }
          : null,
      })),
      hasTea: teaItems.length > 0,
    };
  });
}

/**
 * Decode the current game state ("4Q 2:14", "Q3 8:45", etc.) into a plain-
 * English description. Pure function — no LLM, no cost, no latency.
 */
function explainGameState(
  league: string,
  period: number,
  periodLabel: string,
  clock: string,
  homeScore: number,
  awayScore: number,
  homeName: string,
  awayName: string,
): { whats_happening: string; rules_explainer: string; close_game: boolean } {
  const gap = Math.abs(homeScore - awayScore);
  const closeGame = gap <= 5;
  const winning = homeScore > awayScore ? homeName : awayName;
  const losing = homeScore > awayScore ? awayName : homeName;

  // Period semantics differ by league
  const isFinalQuarter =
    (league === 'nba' && period >= 4) ||
    (league === 'wnba' && period >= 4) ||
    (league === 'nfl' && period >= 4);

  // Build "what's happening" — short narrative
  const periodPretty = periodLabel || (period > 0 ? `Q${period}` : '');
  let happening: string;
  if (gap === 0) {
    happening = `Tied at ${homeScore}, ${periodPretty}${clock ? ` · ${clock} left` : ''}.`;
  } else {
    happening = `${winning} up ${gap}, ${periodPretty}${clock ? ` · ${clock} left` : ''}.`;
  }

  // Build rules explainer — what does this state actually mean?
  const ex: string[] = [];
  if (league === 'nba' || league === 'wnba') {
    const totalQ = 4;
    if (period && period <= totalQ) {
      ex.push(`Basketball games are ${totalQ} quarters of ${league === 'nba' ? '12' : '10'} minutes each.`);
    }
    if (isFinalQuarter && clock) {
      const [m] = clock.split(':');
      const minLeft = parseInt(m, 10);
      if (!isNaN(minLeft)) {
        if (minLeft <= 2) ex.push(`Under ${minLeft + 1} minutes left — this is "crunch time," every possession matters.`);
        else if (minLeft <= 6) ex.push(`Final stretch of the game. Coaches start managing fouls + timeouts.`);
      }
    }
    if (closeGame && isFinalQuarter) {
      ex.push(`Within ${gap} points in the 4th quarter — one good run can flip it.`);
    } else if (gap >= 20) {
      ex.push(`${gap}-point gap. Likely a "garbage time" stretch — bench players in.`);
    }
  } else if (league === 'nfl') {
    if (period && period <= 4) {
      ex.push(`Football is 4 quarters of 15 minutes each. Halftime is between Q2 and Q3.`);
    }
    if (period === 4 && clock) {
      const [m] = clock.split(':');
      const minLeft = parseInt(m, 10);
      if (!isNaN(minLeft) && minLeft <= 2) {
        ex.push(`Under 2 minutes left — the "two-minute warning" stops the clock automatically.`);
      } else if (!isNaN(minLeft) && minLeft <= 5) {
        ex.push(`Under 5 minutes — leading team will try to "run out the clock" with running plays.`);
      }
    }
    if (closeGame && period >= 4) {
      ex.push(`${gap}-point gap in the 4th — one touchdown drive can change everything.`);
    }
    if (period >= 5) {
      ex.push(`Overtime. NFL OT rules: 10 minutes, both teams get a possession unless first team scores TD.`);
    }
  }

  return {
    whats_happening: happening,
    rules_explainer: ex.join(' ') || `${periodPretty}${clock ? `, ${clock} left` : ''} in ${league.toUpperCase()} action.`,
    close_game: closeGame,
  };
}

const SYSTEM_PROMPT = `You are sportsBFF's scoreboard analyst. Read the on-screen scorebug and return a structured matchup.

A "scorebug" is the small overlay graphic that broadcasts use to display the current score, team logos, time/clock, and quarter/period of a live game. They appear on the corner of TV broadcasts of NFL, NBA, and WNBA games.

Return JSON with this exact shape:
{
  "is_scoreboard": true | false,        // true if you can read a scorebug, false otherwise
  "league": "nba" | "nfl" | "wnba" | "unknown",
  "home_team": "<team abbrev or full name as shown on scorebug>",
  "away_team": "<team abbrev or full name as shown on scorebug>",
  "home_score": <integer>,
  "away_score": <integer>,
  "clock": "<remaining time as shown, e.g. '2:14'>",
  "period": <integer quarter or half number>,
  "period_label": "<exact label as shown, e.g. '4Q', 'Q3', '2nd', 'Half', 'OT'>",
  "blurb": "<1 sentence sportsBFF voice describing the current state of the game — who's winning, the vibe, any notable score gap or storyline you can infer>"
}

If you can't see a scoreboard at all (this is a regular photo, not a TV broadcast), return:
{ "is_scoreboard": false, "league": "unknown", "home_team": "", "away_team": "", "home_score": 0, "away_score": 0, "clock": "", "period": 0, "period_label": "", "blurb": "" }

Voice for blurb: warm, knowing, gossipy-but-clean. Examples:
- "Sixers up 4 with under 3 to go — Embiid + Maxey holding on tight."
- "Chiefs trail by 3 in the 4th. Mahomes magic time."
- "Fever-Sky tied at 60 in the third. Caitlin's in foul trouble."
PG-13 always. NEVER race / body / political humor.

If you can read MOST of the scoreboard but not all (e.g. score is clear but clock isn't readable), still return is_scoreboard: true and fill in what you can. Use 0 for missing scores, "" for missing clock.`;

type VisionScore = {
  is_scoreboard: boolean;
  league: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  clock: string;
  period: number;
  period_label: string;
  blurb: string;
};

export async function POST(req: NextRequest) {
  if (!hasOpenAIKey()) {
    return new Response(
      JSON.stringify({ error: 'no_key', message: 'Scan is offline right now.' }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    );
  }

  // Parse multipart image
  let imageBase64: string | null = null;
  try {
    const form = await req.formData();
    const file = form.get('image');
    if (!(file instanceof Blob)) throw new Error('no image');
    const bytes = new Uint8Array(await file.arrayBuffer());
    imageBase64 = Buffer.from(bytes).toString('base64');
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_image' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Vision call to read scoreboard
  let parsed: VisionScore;
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: MODELS.VISION,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Read this scoreboard.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
      max_tokens: 400,
      temperature: 0.1,
      seed: 42,
    });
    const raw = completion.choices[0]?.message?.content ?? '{}';
    parsed = JSON.parse(raw) as VisionScore;
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'vision_error', message: String(err).slice(0, 100) }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    );
  }

  if (!parsed.is_scoreboard) {
    return new Response(
      JSON.stringify({
        error: 'no_scoreboard',
        message: "Couldn't read a scoreboard in this image — try framing the corner scorebug more squarely.",
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'X-Game-Mode': 'no_scoreboard', ...CORS_HEADERS } },
    );
  }

  // Resolve teams
  const home = lookupTeam(parsed.home_team);
  const away = lookupTeam(parsed.away_team);

  if (!home || !away) {
    return new Response(
      JSON.stringify({
        error: 'unknown_teams',
        message: "Read the scoreboard but couldn't match the teams to a known roster. Try a clearer angle.",
        debug: { home_raw: parsed.home_team, away_raw: parsed.away_team, league_raw: parsed.league },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'X-Game-Mode': 'unknown_teams', ...CORS_HEADERS } },
    );
  }

  // Both teams should be in the same league
  const league = home.league;
  if (away.league !== league) {
    return new Response(
      JSON.stringify({
        error: 'cross_league',
        message: `Scoreboard read as ${home.league} vs ${away.league}, which is impossible. Try a clearer scan.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } },
    );
  }

  // Pull rosters with per-player tea snippets
  const homeRoster = enrichRoster(league, home.code);
  const awayRoster = enrichRoster(league, away.code);

  // Decode current game state into plain English
  const explainer = explainGameState(
    league,
    parsed.period,
    parsed.period_label,
    parsed.clock,
    parsed.home_score,
    parsed.away_score,
    home.full,
    away.full,
  );

  // Surface "the tea" for THIS matchup — collect all players with tea, sort
  // by tier rank, take the top N. This is what the watch-along result card
  // headlines: "what should I know about this game right now."
  type TeaCard = {
    player_id: string;
    player_name: string;
    team: string;
    headshot: string | null;
    tier: string;
    category: string;
    headline: string;
    summary: string;
    source: { name: string; url: string; date: string } | null;
  };
  const matchupTea: TeaCard[] = [];
  for (const side of ['home', 'away'] as const) {
    const roster = side === 'home' ? homeRoster : awayRoster;
    const teamCode = side === 'home' ? home.code.toUpperCase() : away.code.toUpperCase();
    for (const p of roster) {
      for (const t of p.tea) {
        matchupTea.push({
          player_id: p.id,
          player_name: p.name,
          team: teamCode,
          headshot: p.headshot,
          tier: t.tier,
          category: t.category,
          headline: t.headline,
          summary: t.summary,
          source: t.source,
        });
      }
    }
  }
  matchupTea.sort((a, b) => (TIER_RANK[b.tier] || 0) - (TIER_RANK[a.tier] || 0));
  const topMatchupTea = matchupTea.slice(0, 5);

  return new Response(
    JSON.stringify({
      league,
      matchup: {
        home: { team: home.code.toUpperCase(), name: home.full, score: parsed.home_score },
        away: { team: away.code.toUpperCase(), name: away.full, score: parsed.away_score },
        clock: parsed.clock,
        period: parsed.period,
        period_label: parsed.period_label,
      },
      rosters: { home: homeRoster, away: awayRoster },
      // What's happening, in 1-2 sentences (vision-generated)
      blurb: parsed.blurb,
      // Plain-English game state explainer (deterministic, no LLM cost)
      explainer: {
        whats_happening: explainer.whats_happening,
        rules_explainer: explainer.rules_explainer,
        close_game: explainer.close_game,
      },
      // Top 5 tea cards for this matchup — "what to talk about while watching"
      matchup_tea: topMatchupTea,
      // Counts for client decisions
      stats: {
        home_roster_size: homeRoster.length,
        away_roster_size: awayRoster.length,
        home_players_with_tea: homeRoster.filter((p) => p.hasTea).length,
        away_players_with_tea: awayRoster.filter((p) => p.hasTea).length,
        total_tea_items: matchupTea.length,
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Game-Mode': 'matched',
        'X-Game-League': league,
        'X-Game-Home': home.code,
        'X-Game-Away': away.code,
        ...CORS_HEADERS,
      },
    },
  );
}
