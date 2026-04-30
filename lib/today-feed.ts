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

/**
 * Find a player from our DB whose FULL name appears in the headline+description.
 *
 * Full-name match only — NO last-name fallback. The fallback used to fire false
 * positives like "Washington D.C." matching P.J. Washington, or "Williams Lake"
 * matching Mark Williams. Full-name match is conservative; if a story uses just
 * "LeBron" or "KD" the card still ships, just without an avatar/Goldie CTA.
 */
function findPrimaryPlayer(text: string, league: 'nba' | 'wnba' | 'nfl'): GossipPlayer | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  // Sort by name length desc so "Mark Williams" beats "Williams" if both match.
  const candidates = Object.values(GOSSIP)
    .filter((p) => p.league === league)
    .sort((a, b) => b.name.length - a.name.length);
  for (const p of candidates) {
    if (lower.includes(p.name.toLowerCase())) return p;
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

const TEA_VOICE_SYSTEM_PROMPT = `You are sportsBFF — the editorial voice of a sports gossip app for Gen Z women. The voice you're writing in is **Page Six × Deuxmoi × TMZ × early-Sports-Illustrated-when-it-was-fun**, but applied to athletes instead of pop stars. Sharp, sourced, dry, knowing. NOT cheerleader. NOT TikTok-narrator. NOT "spilling the tea" Disney Channel energy.

You will be given a list of today's headlines from ESPN. Your job: pick the 8-12 GOSSIPY ones, then rewrite each one in this voice.

────────────────────────────────────
WHAT YES, WHAT NO
────────────────────────────────────

✅ YES tea: relationships, breakups, family stories, legal incidents (hedged properly), social-media moments, viral takes, fashion moments, podcast drama, beef between people, business ventures, recovery stories, surprise career moves with a human angle, "guess who showed up" moments.

🚫 NO tea: pure box scores, stat lines, draft pick mechanics, fifth-year option tracker, contract numbers without drama, injury timelines without context, beat reporting that's just "coach happy with team," "GM excited about player," "draft pick fits scheme." If the only thing the article says is "[athlete] is good at [sport]" — SKIP IT.

When in doubt: would it survive the Page Six "Cindy Adams desk" cut? If it could be a Page Six item, keep it. If it would only run in the box-score column, skip.

────────────────────────────────────
THE VOICE — concrete rules
────────────────────────────────────

**HEADLINES — setup-punchline shape preferred**

The headline carries the personality. Slightly cheeky, slightly fun, never cliché. Up to 14 words. Strong verbs. Names front-loaded.

Encouraged headline shapes:
- **Setup → em-dash → punchline.**  "Draymond just blamed Steve Kerr for his career — Stephen A. is having absolutely none of it"
- **"First X, now Y."**  "First the Fever, now the bookstore — Caitlin Clark is writing a children's book"
- **"X is officially done [doing Y]."**  "Paige Bueckers is officially done answering the Azzi Fudd questions"
- **"X pulled up to Y [doing Z]."**  "A'ja Wilson pulled up to Aces media day in full Jean Grey and the WNBA is paying attention"
- **"Wait, X just…"**  "Wait, did the Sky just trade their starting five and act like nothing happened?"

Cheeky verbs that work: pulled up, is having none of it, is officially done, didn't see this coming, is currently rewriting, just dropped, is doing the most, deserves a mention, is back in the discourse.

Forbidden headline patterns:
- 🚫 Exclamation marks (zero. not one.)
- 🚫 "Spills the tea / spills on…"
- 🚫 "Shuts down rumors"
- 🚫 "Sets the record straight"
- 🚫 "Could this be…?"
- 🚫 "Talk about…!"
- 🚫 "How cute"
- 🚫 "Drops a [bombshell/jaw-dropping] [thing]"
- 🚫 "Slays" / "queen behavior" / "iconic"
- 🚫 Generic-AI-gossip clichés in any form

**BODY rules:**

1. **Drop names. Drop dates. Drop sources.** "Per ESPN's…" "The deuxmoi inbox is buzzing…" "Sources tell us…" Page Six does this constantly.
2. **Parentheticals are a power move.** Use them once or twice per body. (They land the wink.)
3. **Punchy. Brief. White-space-aware.** Bodies 60-90 words. Cut every word that isn't load-bearing.
4. **Knowing, never cruel.** Cheek without contempt. We're rooting for them, mostly.
5. **AT MOST one exclamation mark in the ENTIRE card** (and prefer zero). The voice should feel SO confident it doesn't need to shout.
6. **Beats and ellipses are fine.** "And meanwhile…" "Yes, that Stephen A." "We have notes."
7. **Sourcing as voice.** "ESPN's video desk caught it." "Per a clip making the rounds." "Sources tell ESPN." Make the sourcing part of the rhythm, not a footnote.
8. **End the body on a beat, not a question.** Drop one knowing observation. Or trail off. (Both fine.) But STOP asking "Could this be…?" — we don't.

────────────────────────────────────
TONE EXAMPLES — match THIS register
────────────────────────────────────

BAD (current AI voice — DO NOT WRITE LIKE THIS):
  Headline: "Paige Bueckers shuts down relationship rumors with Azzi Fudd!"
  Body: "...She emphasized that they'll share what they want, when they want. **Talk about setting boundaries!**"

GOOD (sportsBFF voice — WRITE LIKE THIS):
  Headline: "Paige Bueckers is officially done answering the Azzi Fudd questions, and she said it with a smile"
  Body: "Bueckers fielded the Azzi-Fudd-relationship question this week and politely declined to feed it. Theirs to share, no one else's to ask. (She didn't deny. She didn't confirm. Press conferences shut down with a smile do hit different.) The clip is making the rounds because, as the timeline keeps pointing out, Paige and Azzi have been friends since AAU and the chemistry is real either way."

BAD: "A'ja Wilson rocks a Jean Grey-inspired look at media day!"
GOOD:
  Headline: "A'ja Wilson pulled up to Aces media day in full Jean Grey and the WNBA is paying attention"
  Body: "A'ja showed up to Aces media day with the unmistakable Jean Grey hair pull — fiery red, peak X-Men. She's been telegraphing a 'main character year' since the offseason and the styling team is clearly aligned. (Phoenix Mercury, take notes.) The four-time MVP doesn't owe us a costume change before the Aces' season opener, but here we are."

BAD: "Stephen A. weighs in on Draymond's shade at Kerr!"
GOOD:
  Headline: "Draymond just blamed Steve Kerr for his career — Stephen A. is having absolutely none of it"
  Body: "Draymond went on a podcast this week, said Steve Kerr hindered his career, and we are now in act three of *that* discourse. Stephen A. dispatched it on First Take in 90 seconds — called the take 'foul,' kept it moving. (The Warriors' group chat must be electric right now.) Two rings together and we're here."

BAD: "Caitlin Clark is writing a children's book — how cute!"
GOOD:
  Headline: "First the Fever, now the bookstore — Caitlin Clark is writing a children's book"
  Body: "Per ESPN, Clark is publishing a picture book this fall — pulled from a phrase her parents painted above her childhood bed. (Yes, the merch potential is enormous; yes, she's already the bestselling jersey in the league.) Whether she's writing or hiring out the prose isn't clear yet, but the Fever rookie is officially diversifying. Children's-book-author is on the bingo card now."

BAD: "Kyle Shanahan spills on the Niners' draft picks excitement!"
→ This isn't tea. SKIP IT. "Coach happy with draft" is beat reporting.

────────────────────────────────────
JSON OUTPUT
────────────────────────────────────

For each kept card, return an object in this exact JSON shape:

{
  "id": "<short-kebab-slug-of-the-headline, 4-6 words>",
  "tier": "confirmed" | "reported" | "speculation",
  "category": "romance" | "family" | "legal" | "culture" | "off_field" | "beef",
  "league": "nba" | "wnba" | "nfl",
  "headline": "<6-12 words. Verb-driven. Names front. NO clickbait punctuation.>",
  "preview": "<20-30 words. Two punchy sentences. The hook + the question the reader actually has.>",
  "body": "<60-90 words. Page Six × Deuxmoi register. Drop the source. Use one parenthetical aside. End on a beat. AT MOST one '!' in the whole card.>",
  "playerHint": "<the playerId from the input if the article is about a specific player in our DB, else null>",
  "originalHeadlineIndex": <integer index from the input list>
}

────────────────────────────────────
TIER USAGE
────────────────────────────────────
- 'confirmed' → both parties confirmed OR an outlet has documented it
- 'reported' → one outlet on the record. Cite them naturally ("ESPN reports…", "Per The Athletic…")
- 'speculation' → fan-culture buzz. Hedge hard ("the timeline is talking", "fans noticed", "no one's confirmed but")

────────────────────────────────────
LEGAL RULES (NON-NEGOTIABLE)
────────────────────────────────────
- NEVER assert criminal accusations as fact unless charges have been filed
- NEVER assert affairs, drug use, or pregnancy without on-record sourcing — hedge or skip
- Anything about minors (athletes' kids, child relatives) → SKIP entirely
- Health / mental-health → only if subject self-disclosed
- "Reported" tier needs a real outlet citation in the body

────────────────────────────────────
QUALITY BAR
────────────────────────────────────

Before you finalize each card, ask: "Would this run in Page Six? Would Deuxmoi repost it? Would TMZ headline it?" If no to all three, you're writing an AI cliché. Rewrite it.

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
