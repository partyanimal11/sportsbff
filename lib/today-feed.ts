/**
 * Today Feed pipeline — generates the daily Tea cards.
 *
 * Flow:
 *   1. Pull last-24h headlines from ESPN (NBA + NFL + WNBA news)
 *   2. Cross-reference each headline against the 519-player gossip DB
 *      to find a "primary player" — drama is more compelling when
 *      there's a face attached.
 *   3. Single LLM call: filter drama-vs-stats, rewrite winners in
 *      sportsBFF voice, classify tier/category, return 8-12 cards.
 *   4. Validate, dedupe, return.
 *
 * Caching: caller wraps with unstable_cache; we don't cache here.
 *
 * Failure mode: if any step fails we return whatever we have. The
 * /api/today endpoint has its own evergreen fallback.
 */
import { getOpenAI, MODELS, hasOpenAIKey } from '@/lib/openai';
import gossipData from '@/data/players-gossip.json';

const ESPN_NBA_NEWS = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news?limit=20';
const ESPN_NFL_NEWS = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?limit=20';
const ESPN_WNBA_NEWS = 'https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/news?limit=20';

export type TeaCard = {
  id: string;
  tier: 'confirmed' | 'reported' | 'speculation';
  category: 'romance' | 'family' | 'legal' | 'culture' | 'off_field' | 'beef';
  league: 'nba' | 'wnba' | 'nfl';
  headline: string;       // sportsBFF-voiced, ~6-12 words
  preview: string;        // 2-line teaser, ~25 words
  body: string;           // full deep-dive, ~80 words
  primaryPlayer: {
    id: string;
    name: string;
    team: string;
    initials: string;
  } | null;
  source: { name: string; url: string; publishedAt: string };
  generatedAt: string;
};

type ESPNArticle = {
  headline?: string;
  description?: string;
  published?: string;
  type?: string;
  links?: { web?: { href?: string } };
};

type GossipPlayer = {
  player_id: string;
  name: string;
  team: string;
  league: string;
  items: { headline: string }[];
};

const GOSSIP: Record<string, GossipPlayer> = gossipData as Record<string, GossipPlayer>;

/* ────────────────────────────────────────────────────────────────────────── */

function getInitials(name: string): string {
  const parts = name.replace(/['.]/g, '').split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function fetchArticles(url: string): Promise<ESPNArticle[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { articles?: ESPNArticle[] };
    return data.articles ?? [];
  } catch {
    return [];
  }
}

/** Find a player from our DB whose name appears in the headline+description. */
function findPrimaryPlayer(text: string, league: 'nba' | 'wnba' | 'nfl'): GossipPlayer | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  // Sort players by name length desc — longer names more specific (avoid matching "Williams" before "Mark Williams")
  const candidates = Object.values(GOSSIP)
    .filter((p) => p.league === league)
    .sort((a, b) => b.name.length - a.name.length);
  for (const p of candidates) {
    if (lower.includes(p.name.toLowerCase())) return p;
    // Try last-name-only match for first-name-rare players (avoid common surnames)
    const last = p.name.split(/\s+/).pop()?.toLowerCase() ?? '';
    if (last.length >= 6 && lower.includes(last)) return p;
  }
  return null;
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Build a structured input list for the LLM: each candidate headline tagged
 * with its league + a primary-player hint (if found in our DB).
 */
async function gatherCandidates(): Promise<
  Array<{
    league: 'nba' | 'wnba' | 'nfl';
    headline: string;
    description: string;
    sourceUrl: string;
    sourceName: string;
    publishedAt: string;
    type: string;
    playerId: string | null;
    playerName: string | null;
    playerTeam: string | null;
  }>
> {
  const [nba, nfl, wnba] = await Promise.all([
    fetchArticles(ESPN_NBA_NEWS),
    fetchArticles(ESPN_NFL_NEWS),
    fetchArticles(ESPN_WNBA_NEWS),
  ]);

  const candidates = [];
  for (const [league, articles] of [
    ['nba', nba],
    ['nfl', nfl],
    ['wnba', wnba],
  ] as const) {
    for (const a of articles) {
      const headline = (a.headline || '').trim();
      const description = (a.description || '').trim();
      if (!headline) continue;
      const text = `${headline} ${description}`;
      const player = findPrimaryPlayer(text, league);
      candidates.push({
        league,
        headline,
        description,
        sourceUrl: a.links?.web?.href || '',
        sourceName: 'ESPN',
        publishedAt: a.published?.slice(0, 10) || '',
        type: a.type || 'article',
        playerId: player?.player_id ?? null,
        playerName: player?.name ?? null,
        playerTeam: player?.team ?? null,
      });
    }
  }
  return candidates;
}

/* ────────────────────────────────────────────────────────────────────────── */

const TEA_VOICE_SYSTEM_PROMPT = `You are sportsBFF, the voice of a sports gossip app for Gen Z women. You speak like a knowing friend texting tea — warm, witty, never mean. PG-13 always.

You will be given a list of today's headlines from ESPN. Your job: pick 8-12 of the MOST GOSSIPY ones — drama, off-court life, beef, fashion, romance, family stories, legal incidents, viral cultural moments — and rewrite each as a sportsBFF Tea Card.

🚫 NEVER pick: pure box scores, stat lines, draft analysis, X's-and-O's tactics, injury reports without drama, contract negotiations without a juicy angle, or trade-deadline mechanics.

✅ DO pick: relationships, breakups, fashion moments, podcast drama, family stories, legal stuff (with hedging), beef between players, social-media moments, viral takes, parenting stories, business ventures gone wrong.

For each card you keep, return an object in this exact JSON shape:

{
  "id": "<short-kebab-slug-of-the-headline>",
  "tier": "confirmed" | "reported" | "speculation",
  "category": "romance" | "family" | "legal" | "culture" | "off_field" | "beef",
  "league": "nba" | "wnba" | "nfl",
  "headline": "<sportsBFF voice — 6-12 words. NOT the original ESPN headline. Rewrite it as if you're texting your group chat. e.g. 'Wait, are Brittany and Patrick really fighting again?'>",
  "preview": "<25-word teaser that hooks them in. Lands the drama in two sentences.>",
  "body": "<80-word body — the full tea. Tell the story like you're at brunch. End with a *curious-but-not-mean* observation. Use markdown bold for emphasis sparingly.>",
  "playerHint": "<the playerId from the input if it's about a specific player, else null>",
  "originalHeadlineIndex": <integer index from the input list>
}

VOICE RULES:
- "Bestie" energy without overdoing it. Never use "bestie" more than once total across all cards.
- Use second person sparingly. Mostly third person.
- It's okay to be a little cheeky, never cruel.
- For tier 'speculation', hedge ("rumored to…", "fans are saying…", "no confirmation yet")
- For tier 'reported', cite who reported it ("Per ESPN's…", "[Reporter] said…")
- For tier 'confirmed', state plainly.

LEGAL RULES (CRITICAL):
- Never assert criminal accusations as fact unless a charge has been filed
- Never assert affairs, drug use, or pregnancy without on-record sourcing
- Anything about minors → SKIP entirely
- Health/mental-health → only if subject self-disclosed

Return ONLY a JSON object: { "cards": [ ...8-12 card objects... ] }
No commentary outside the JSON.`;

async function rewriteWithLLM(
  candidates: Awaited<ReturnType<typeof gatherCandidates>>
): Promise<TeaCard[]> {
  if (!hasOpenAIKey()) return [];
  if (candidates.length === 0) return [];

  // Compact each candidate to keep prompt small
  const compact = candidates.map((c, i) => ({
    i,
    league: c.league,
    headline: c.headline,
    description: c.description.slice(0, 200),
    playerId: c.playerId,
    playerName: c.playerName,
  }));

  const userMessage = `Here are today's candidate headlines (with player hints where we matched them to our DB):\n\n${JSON.stringify(compact, null, 2)}\n\nPick the 8-12 gossipiest, return as JSON.`;

  const completion = await getOpenAI().chat.completions.create({
    model: MODELS.MINI,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: TEA_VOICE_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 3000,
    temperature: 0.6,
  });

  const raw = completion.choices[0]?.message?.content ?? '{}';
  let parsed: { cards?: Array<Record<string, unknown>> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const out: TeaCard[] = [];
  const generatedAt = new Date().toISOString();

  for (const c of parsed.cards ?? []) {
    const idx = typeof c.originalHeadlineIndex === 'number' ? c.originalHeadlineIndex : -1;
    const orig = idx >= 0 && idx < candidates.length ? candidates[idx] : null;
    if (!orig) continue;

    const tier = (c.tier as TeaCard['tier']) || 'reported';
    if (!['confirmed', 'reported', 'speculation'].includes(tier)) continue;
    const category = (c.category as TeaCard['category']) || 'culture';
    if (!['romance', 'family', 'legal', 'culture', 'off_field', 'beef'].includes(category)) continue;
    const league = (c.league as TeaCard['league']) || orig.league;
    if (!['nba', 'wnba', 'nfl'].includes(league)) continue;

    const headline = String(c.headline || '').trim();
    const preview = String(c.preview || '').trim();
    const body = String(c.body || '').trim();
    if (!headline || !preview || !body) continue;

    // Resolve primaryPlayer (LLM hint OR our pre-match)
    const playerHint = (c.playerHint as string) || orig.playerId;
    let primaryPlayer: TeaCard['primaryPlayer'] = null;
    if (playerHint && GOSSIP[playerHint]) {
      const p = GOSSIP[playerHint];
      primaryPlayer = {
        id: p.player_id,
        name: p.name,
        team: p.team,
        initials: getInitials(p.name),
      };
    }

    const id = String(c.id || '').replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 60) ||
      `card-${out.length + 1}`;

    out.push({
      id,
      tier,
      category,
      league,
      headline,
      preview,
      body,
      primaryPlayer,
      source: {
        name: orig.sourceName,
        url: orig.sourceUrl,
        publishedAt: orig.publishedAt,
      },
      generatedAt,
    });
  }

  // Dedupe by id
  const seen = new Set<string>();
  return out.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true))).slice(0, 12);
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Main entry point. Caller should wrap with unstable_cache for daily caching.
 */
export async function buildTodayFeed(): Promise<TeaCard[]> {
  const candidates = await gatherCandidates();
  if (candidates.length === 0) return [];

  // Try LLM rewrite. If it fails or returns nothing, return empty (fallback to evergreen).
  try {
    return await rewriteWithLLM(candidates);
  } catch {
    return [];
  }
}
