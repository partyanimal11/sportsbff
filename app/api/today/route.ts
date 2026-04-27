import { NextRequest } from 'next/server';
import { getOpenAI, MODELS, hasOpenAIKey } from '@/lib/openai';
import { pickFallbackTea, type TeaCard } from '@/lib/tea-fallback';
import { getLens } from '@/lib/lens';
import players from '@/data/players-sample.json';

/**
 * POST /api/today
 *
 * Generates the daily 3-card "Tea" payload for the mobile app's Tea tab AND
 * the post-paywall magic moment. Each call returns:
 *   - drama: a personalized lens-voiced 100-word response
 *   - players: 4 player thumbnails for "players to know this week"
 *   - lesson: a 60-second crash course
 *
 * Caches per (lens, league, ISO date) for 6 hours in memory to keep OpenAI
 * costs reasonable when many users share the same lens.
 *
 * Falls back to evergreen Tea pack if OPENAI_API_KEY missing OR generation fails.
 */

export const runtime = 'nodejs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

type RequestBody = {
  lens?: string;
  league?: 'nfl' | 'nba' | 'both';
  displayName?: string;
  vibeLevel?: 'clueless' | 'basics' | 'curious' | 'fan';
  lastSeenAt?: string;
};

type TodayResponse = {
  date: string; // YYYY-MM-DD
  drama: { prompt: string; response: string };
  players: { id: string; name: string; team: string; league: 'nfl' | 'nba'; number: number }[];
  lesson: { title: string; body: string };
  cached?: boolean;
  fallback?: boolean;
};

// In-memory cache. Key: `${lens}|${league}|${YYYY-MM-DD}`. Value: TodayResponse.
// 6-hour TTL.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const _cache = new Map<string, { value: TodayResponse; expires: number }>();

function cacheKey(lens: string, league: string, date: string): string {
  return `${lens}|${league}|${date}`;
}

function isoDateUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

// Pick 4 most-relevant players for the league + lens. Prefer high-drama ones.
function pickFeaturedPlayers(league: 'nfl' | 'nba' | 'both'): TodayResponse['players'] {
  const drama_priority_ids = [
    'luka-doncic',
    'shai-gilgeous-alexander',
    'victor-wembanyama',
    'lebron-james',
    'kevin-durant',
    'anthony-edwards',
    'patrick-mahomes',
    'josh-allen',
    'lamar-jackson',
    'travis-kelce',
    'caleb-williams',
    'joe-burrow',
  ];
  const sample = players as Array<{ id: string; name: string; team: string; league: 'nfl' | 'nba'; number?: number }>;

  // Filter by league
  const filtered =
    league === 'both'
      ? sample
      : sample.filter((p) => p.league === league);

  // Score: drama priority first, then by number presence
  const scored = filtered
    .map((p) => ({
      ...p,
      score:
        (drama_priority_ids.includes(p.id) ? 1000 : 0) +
        (p.number ? 1 : 0) +
        Math.random() * 50,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return scored.map((p) => ({
    id: p.id,
    name: p.name,
    team: p.team,
    league: p.league,
    number: p.number ?? 0,
  }));
}

async function generateTea(
  lens: string,
  league: 'nfl' | 'nba' | 'both',
  displayName?: string,
  vibeLevel?: string
): Promise<TeaCard> {
  const lensInfo = getLens(lens);
  const featured = pickFeaturedPlayers(league);
  const playerNames = featured.map((p) => p.name).join(', ');

  const SYSTEM = `You are sportsBFF generating today's daily "Tea" for a Gen Z user.

The user has selected the lens: **${lensInfo.name}**
Voice: ${lensInfo.voice_profile}
Their league preference: ${league.toUpperCase()}
${displayName ? `Their name: ${displayName}` : ''}
${vibeLevel ? `Their sports knowledge: ${vibeLevel}` : ''}

You will return a SINGLE JSON object with three fields: drama, players, lesson.

GUARDRAILS:
- PG-13 always. No race jokes, no body shaming, no political/religious humor, no sexuality jokes, no unverified accusations. Keep it warm-friend energy, never mean.

Return JSON in this EXACT shape:

{
  "drama": {
    "prompt": "<a single short user-style question that this drama would answer, ~6-8 words>",
    "response": "<a 100-word lens-voiced response in the ${lensInfo.name} voice covering today's biggest ${league.toUpperCase()} storyline. END with a bolded character comparison line like '**[Player] is the [Character] of the [LEAGUE]**' if the lens has show characters; otherwise end naturally. Use markdown bold for emphasis.>"
  },
  "lesson": {
    "title": "<a 5-8 word title for a 60-second crash course on a sports concept relevant to today's storyline>",
    "body": "<a 2-3 paragraph mini-lesson, ~120 words total, in the ${lensInfo.name} voice. Explain a sports concept clearly (rules, mechanics, recent news context). Use natural language, not bullet points.>"
  }
}

Featured players this week (the mobile app will surface these): ${playerNames}.

Pick the most newsworthy storyline from the past month for the user's league. Be specific about names, scores, dates. Don't invent stats.`;

  const completion = await getOpenAI().chat.completions.create({
    model: MODELS.MINI,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: 'Generate today\'s Tea.' },
    ],
    max_tokens: 800,
    temperature: 0.85,
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(raw);

  return {
    drama: parsed.drama,
    players: featured,
    lesson: parsed.lesson,
  };
}

export async function POST(req: NextRequest) {
  let body: RequestBody = {};
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    // Empty body is OK — use defaults
  }

  const lens = body.lens || 'plain';
  const league = body.league || 'both';
  const displayName = body.displayName;
  const vibeLevel = body.vibeLevel;
  const today = isoDateUTC();

  // Cache check
  const key = cacheKey(lens, league, today);
  const cached = _cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return new Response(
      JSON.stringify({ ...cached.value, cached: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  // No API key → fallback
  if (!hasOpenAIKey()) {
    const fallback = pickFallbackTea(lens, league);
    const response: TodayResponse = {
      date: today,
      ...fallback,
      fallback: true,
    };
    _cache.set(key, { value: response, expires: Date.now() + CACHE_TTL_MS });
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // Generate fresh Tea
  try {
    const card = await generateTea(lens, league, displayName, vibeLevel);
    const response: TodayResponse = {
      date: today,
      drama: card.drama,
      players: card.players,
      lesson: card.lesson,
    };
    _cache.set(key, { value: response, expires: Date.now() + CACHE_TTL_MS });
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err) {
    // Generation failed — graceful fallback to evergreen pack
    const fallback = pickFallbackTea(lens, league);
    const response: TodayResponse = {
      date: today,
      ...fallback,
      fallback: true,
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Today-Error': String(err).slice(0, 100),
        ...CORS_HEADERS,
      },
    });
  }
}
