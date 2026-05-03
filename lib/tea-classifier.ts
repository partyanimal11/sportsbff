/**
 * tea-classifier — turn an RSS headline into a sportsBFF tea item.
 *
 * Uses GPT-4o-mini for cost (~$0.0003/article). Per-call output is constrained
 * by JSON schema so downstream code can rely on shape.
 *
 * Branches on source tier:
 *   - news-tier: classifier doesn't try to identify a player (it's not relevant —
 *     news goes to Tea tab feed only). Decides only: is this useful? confidence?
 *   - gossip-tier: classifier ALSO picks a player_id from a known list, or
 *     returns "none" if no clear match.
 *
 * Auto-publish threshold: confidence >= 0.85
 * Below threshold → tea-pending.json (Aaron reviews via /admin/tea-review)
 */

import OpenAI from 'openai';
import gossipData from '@/data/players-gossip.json';
import { hasOpenAIKey } from './openai';
import type { RawFeedItem } from './rss-feeds';
import type { LiveTeaItem, PendingItem } from './tea-types';

/** Reusable hash function for stable item IDs — based on source URL. */
function hashId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  }
  return 'live-' + Math.abs(hash).toString(36);
}

/** Lazy-built lookup of known player_ids and their names. */
type KnownPlayer = { player_id: string; name: string; team: string; league: string };
// players-gossip.json is keyed by player_id at the top level (a Record, not an array).
// Convert to a flat array for surname-matching loops below.
const KNOWN_PLAYERS: KnownPlayer[] = Object.values(
  gossipData as unknown as Record<string, KnownPlayer>,
).map((p) => ({
  player_id: p.player_id,
  name: p.name,
  team: p.team,
  league: p.league,
}));

/**
 * Lightweight name → player_id lookup. Tries exact match first, then
 * "starts with last name" — handles "Mahomes" → "patrick-mahomes" without
 * sending the whole roster to the LLM.
 */
function findPlayerByName(name: string): string | null {
  if (!name) return null;
  const norm = name.trim().toLowerCase();
  // exact match (case-insensitive)
  const exact = KNOWN_PLAYERS.find((p) => p.name.toLowerCase() === norm);
  if (exact) return exact.player_id;
  // "last name only" match — only succeed if exactly one player has that surname
  const surname = norm.split(/\s+/).pop() ?? '';
  if (surname.length < 4) return null; // avoid "Lee" / "Lin" false positives
  const lastNameMatches = KNOWN_PLAYERS.filter((p) =>
    p.name.toLowerCase().endsWith(' ' + surname),
  );
  if (lastNameMatches.length === 1) return lastNameMatches[0].player_id;
  return null;
}

/**
 * Detect league from item content. Pure heuristics — no LLM call. The
 * classifier prompt also asks for league but this is the cheap fallback.
 */
function guessLeague(item: RawFeedItem): 'nba' | 'nfl' | 'wnba' | 'general' {
  const text = (item.title + ' ' + item.contentSnippet).toLowerCase();
  if (/\bwnba\b|\bcaitlin clark\b|\bangel reese\b|\ba'ja wilson\b|\bsabrina ionescu\b/.test(text)) {
    return 'wnba';
  }
  if (/\bnfl\b|\bquarterback\b|\btouchdown\b|\bpatriots\b|\bchiefs\b|\beagles\b|\bcowboys\b|\b49ers\b/.test(text)) {
    return 'nfl';
  }
  if (/\bnba\b|\blakers\b|\bceltics\b|\bwarriors\b|\bdunk\b|\b3-pointer\b|\blebron\b/.test(text)) {
    return 'nba';
  }
  return 'general';
}

/* ───────────── classifier output schema ───────────── */

type ClassifierOutput = {
  is_tea: boolean;             // Is this story useful for sportsBFF readers?
  confidence: number;          // 0-1
  tier: 'confirmed' | 'reported' | 'speculation' | 'rumor';
  category: string;
  headline: string;            // Punchy, under 80 chars
  summary: string;             // 2-3 sentences, plain language
  player_name?: string;        // Gossip tier only — full name, used for player_id lookup
  league?: 'nba' | 'nfl' | 'wnba' | 'general';
  reject_reason?: string;      // Why is_tea=false (for debugging)
};

/**
 * Two prompts — one for news-tier, one for gossip-tier. The fetch layer already
 * tagged each source, so we route to the right prompt deterministically.
 *
 * V1 LEAGUE FILTER (HARD): both prompts MUST reject anything that isn't NBA, NFL,
 * or WNBA. Soccer, MLB, NHL, college, tennis, golf, F1, etc — all rejected.
 * Daily Mail Sport in particular is mostly Premier League → most items get cut.
 */
const SYSTEM_PROMPT_NEWS = `You are sportsBFF's news editor for NBA, NFL, and WNBA fans.

You read RSS headlines from sports outlets (ESPN, CBS, Yahoo) and decide which become "Tea tab" feed items.

OUR VOICE: confident, plain-language, conversational. Like a friend who texts you what happened.

V1 SCOPE — HARD FILTER:
- Only NBA, NFL, or WNBA stories. League MUST be one of those three.
- Reject ANYTHING else: soccer, MLB, NHL, college (NCAA), tennis, golf, F1, boxing, MMA, Olympics, esports.
- If league is unclear, look at the source URL/title. If still unclear, reject.

KEEP these (broad — most sports news qualifies):
- Trades, contracts, free agency
- Suspensions, fines, legal news
- Coaching changes, firings, hires
- Injuries with playoff/season impact (not minor day-to-day)
- Off-field stories, lifestyle, drama
- Awards, milestones, records
- Front-office moves
- Player/coach quotes that drive a storyline

REJECT these:
- Pure boxscore recaps with no story angle ("Lakers 102, Celtics 98")
- Generic preview articles ("How to watch tonight's game")
- Power rankings, mock drafts, listicles, "things to watch"
- Highlights / Top 10 plays / "Did you see this?"
- Items without a named athlete, coach, or front-office figure

TIERS (most news = "reported"):
- confirmed: official announcement, athlete confirmed, court records
- reported: published by reputable outlet
- speculation: educated guess from credible voice
- rumor: unverified buzz

CATEGORIES: romance, family, trade, drama, business, injury, career, legal, feud, coaching, legacy, endorsement, media

NEWS-TIER ITEMS ARE NOT PLAYER-INDEXED. Leave player_name as null.

Output JSON only:
{
  "is_tea": boolean,
  "confidence": 0.0-1.0,
  "tier": "confirmed" | "reported" | "speculation" | "rumor",
  "category": one of the categories above,
  "headline": "Punchy under 80 chars",
  "summary": "2-3 sentences, plain language, concrete details",
  "player_name": null,
  "league": "nba" | "nfl" | "wnba",
  "reject_reason": "string" or null
}`;

const SYSTEM_PROMPT_GOSSIP = `You are sportsBFF's gossip editor. You read tabloid/lifestyle RSS headlines (People, Page Six, TMZ, Daily Mail Sport, Us Weekly) and decide which become per-player tea items.

OUR VOICE: gossip-aware, never preachy. Like the group chat after a game.

V1 SCOPE — HARD FILTER:
- Only stories about NBA, NFL, or WNBA athletes/coaches/owners. League MUST be one of those three.
- Reject ANYTHING else: soccer (yes including Messi/Ronaldo/Premier League — it's most of Daily Mail), MLB, NHL, college, tennis, golf, F1, Olympics-only athletes, non-sports celebrities.
- If a story is about Taylor Swift, Kim K, etc — only KEEP if it's about her relationship/connection to an NBA/NFL/WNBA athlete (e.g. Swift + Kelce). Otherwise reject.

KEEP these (gossip-toned):
- Relationships, weddings, breakups, engagements
- Family / pregnancy / baby news
- Lifestyle, fashion, parties, vacations
- Beefs, feuds, social media drama
- Off-field legal trouble
- Endorsements, brand deals
- WAG news (athlete partners with public profile)

REJECT these:
- Game-result coverage even if from these outlets
- Soccer stories (most of Daily Mail Sport)
- Non-NBA/NFL/WNBA athletes
- Generic celebrity news without sports connection

TIERS:
- confirmed: athlete confirmed, primary source, publication of record
- reported: People/Page Six published it, not athlete-confirmed
- speculation: educated guess from a credible source
- rumor: unverified buzz

CATEGORIES: romance, family, trade, drama, business, injury, career, legal, feud, coaching, legacy, endorsement, media

GOSSIP-TIER ITEMS MUST IDENTIFY THE SPECIFIC ATHLETE. Set player_name to the full name (e.g. "Patrick Mahomes", not "Mahomes"). If multiple athletes, pick the primary subject. If no athlete is named, set player_name to null AND set is_tea to false.

Output JSON only:
{
  "is_tea": boolean,
  "confidence": 0.0-1.0,
  "tier": "confirmed" | "reported" | "speculation" | "rumor",
  "category": one of the categories above,
  "headline": "Punchy under 80 chars",
  "summary": "2-3 sentences, plain language, concrete details",
  "player_name": "Full Name" or null,
  "league": "nba" | "nfl" | "wnba",
  "reject_reason": "string" or null
}`;

/* ───────────── classification ───────────── */

const CONFIDENCE_THRESHOLD = 0.85;

export type ClassificationResult =
  | { kind: 'live'; item: LiveTeaItem }
  | { kind: 'pending'; item: PendingItem }
  | { kind: 'reject'; reason: string };

/**
 * Classify a single RSS item. Returns one of three outcomes:
 *   - 'live': auto-publishable (high confidence + valid)
 *   - 'pending': worth a human review (uncertain or missing player match)
 *   - 'reject': not useful (boxscore, generic, off-topic)
 */
export async function classifyItem(item: RawFeedItem): Promise<ClassificationResult> {
  if (!hasOpenAIKey()) {
    return { kind: 'reject', reason: 'no_openai_key' };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  const userPrompt = `Source: ${item.source.name} (tier: ${item.source.tier})
Title: ${item.title}
Snippet: ${item.contentSnippet || '(no snippet)'}
URL: ${item.link}
Published: ${item.isoDate}`;

  // Pick prompt based on source tier — news vs gossip have different rules
  const systemPrompt = item.source.tier === 'news' ? SYSTEM_PROMPT_NEWS : SYSTEM_PROMPT_GOSSIP;

  let parsed: ClassifierOutput;
  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 400,
    });
    const raw = completion.choices[0]?.message?.content ?? '{}';
    parsed = JSON.parse(raw) as ClassifierOutput;
  } catch (err) {
    return { kind: 'reject', reason: 'classifier_error: ' + String(err).slice(0, 80) };
  }

  if (!parsed.is_tea) {
    return { kind: 'reject', reason: parsed.reject_reason || 'not_tea' };
  }

  // V1 HARD LEAGUE FILTER: only NBA, NFL, WNBA. Reject anything else (soccer,
  // MLB, NHL, college, etc). The classifier is asked to filter at its level
  // too — but defense in depth.
  const VALID_LEAGUES_V1 = ['nba', 'nfl', 'wnba'] as const;
  type V1League = (typeof VALID_LEAGUES_V1)[number];
  if (!parsed.league || !VALID_LEAGUES_V1.includes(parsed.league as V1League)) {
    return { kind: 'reject', reason: `out_of_scope_league_${parsed.league || 'unknown'}` };
  }

  // Validate tier + category — fall back to safe defaults if model returns garbage
  const tier: 'confirmed' | 'reported' | 'speculation' | 'rumor' =
    ['confirmed', 'reported', 'speculation', 'rumor'].includes(parsed.tier)
      ? parsed.tier
      : 'reported';
  const category = parsed.category || 'media';
  const league: V1League = parsed.league as V1League;

  const guessedPlayerId =
    item.source.tier === 'gossip' && parsed.player_name
      ? findPlayerByName(parsed.player_name)
      : null;

  // Build the candidate item
  const id = hashId(item.link);
  const ingestedAt = new Date().toISOString();
  const sourceDate = item.isoDate.slice(0, 10);

  const baseItem: LiveTeaItem = {
    id,
    tier,
    category,
    headline: (parsed.headline || item.title).slice(0, 200),
    summary: (parsed.summary || item.contentSnippet || item.title).slice(0, 600),
    sources: [
      {
        name: item.source.name,
        url: item.link,
        date: sourceDate,
      },
    ],
    ingested_at: ingestedAt,
    player_id: item.source.tier === 'gossip' ? guessedPlayerId : null,
    confidence: parsed.confidence ?? 0.5,
    source_url: item.link,
    league,
  };

  // Decision tree
  if (parsed.confidence < CONFIDENCE_THRESHOLD) {
    return {
      kind: 'pending',
      item: {
        ...baseItem,
        pending_reason: `low_confidence_${parsed.confidence.toFixed(2)}`,
        guessed_player_id: guessedPlayerId,
      },
    };
  }

  // Gossip tier with high confidence but no player match → pending (Aaron picks the player)
  if (item.source.tier === 'gossip' && !guessedPlayerId) {
    return {
      kind: 'pending',
      item: {
        ...baseItem,
        pending_reason: parsed.player_name
          ? `unknown_player_${parsed.player_name.slice(0, 40)}`
          : 'no_player_named',
        guessed_player_id: null,
      },
    };
  }

  return { kind: 'live', item: baseItem };
}

/**
 * Classify a batch of items in parallel with concurrency limiting.
 * Default: 5 concurrent calls — keeps OpenAI happy under TPM limits while
 * processing ~50 items/day in well under a minute.
 */
export async function classifyBatch(
  items: RawFeedItem[],
  opts: { concurrency?: number } = {},
): Promise<ClassificationResult[]> {
  const concurrency = opts.concurrency ?? 5;
  const results: ClassificationResult[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map((it) => classifyItem(it)));
    results.push(...chunkResults);
  }
  return results;
}
