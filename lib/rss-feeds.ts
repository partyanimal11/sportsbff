/**
 * RSS feed registry for the daily tea-ingest cron.
 *
 * Two source tiers:
 *   - 'news'   → headlines flow into the Tea tab feed only (NOT player-indexed)
 *               ESPN, AP, Athletic, SI, USA Today, Yahoo Sports
 *   - 'gossip' → player-indexed, surface in Tea tab feed AND in scan/scout
 *               per-player tea section. People, Page Six, TMZ, Daily Mail Sport, etc.
 *
 * Routing decision is made at fetch time based on the source — the LLM
 * classifier never has to guess; it only decides confidence + tier + which
 * player_id (for gossip).
 *
 * Why dual-tier: ESPN feels like CNN ticker, gossip sites feel like the group
 * chat. Mixing them would dilute the per-player voice. Aaron set this constraint
 * explicitly — see HANDOFF_LIVE_TEA_*.md for the full reasoning.
 */

import Parser from 'rss-parser';

export type SourceTier = 'news' | 'gossip';

export type FeedSource = {
  name: string;          // Display name — surfaced in `source.name` field on tea items
  url: string;           // RSS feed URL
  tier: SourceTier;
  enabled: boolean;      // Easy kill switch if a source goes bad
  notes?: string;
};

/**
 * Source list. Curated to publications that have RELIABLE RSS + are
 * already accepted citations in our existing tea database.
 *
 * Add new sources here — they'll be picked up automatically by the next
 * cron run. Set `enabled: false` to mute a source without removing it.
 */
export const FEED_SOURCES: FeedSource[] = [
  // ─── NEWS TIER (Tea tab only — never player-indexed) ───
  {
    name: 'ESPN',
    url: 'https://www.espn.com/espn/rss/news',
    tier: 'news',
    enabled: true,
    notes: 'Mixed-sport headlines. Filter for nba/nfl/wnba in classifier.',
  },
  {
    name: 'ESPN NBA',
    url: 'https://www.espn.com/espn/rss/nba/news',
    tier: 'news',
    enabled: true,
  },
  {
    name: 'ESPN NFL',
    url: 'https://www.espn.com/espn/rss/nfl/news',
    tier: 'news',
    enabled: true,
  },
  {
    name: 'ESPN WNBA',
    url: 'https://www.espn.com/wnba/rss.xml',
    tier: 'news',
    enabled: true,
    notes: 'Updated 2026-05-03 — old /espn/rss/wnba/news URL returns 404 now',
  },
  {
    name: 'CBS Sports NBA',
    url: 'https://www.cbssports.com/rss/headlines/nba/',
    tier: 'news',
    enabled: true,
  },
  {
    name: 'CBS Sports NFL',
    url: 'https://www.cbssports.com/rss/headlines/nfl/',
    tier: 'news',
    enabled: true,
  },
  {
    name: 'Yahoo Sports',
    url: 'https://sports.yahoo.com/rss/',
    tier: 'news',
    enabled: true,
  },

  // ─── GOSSIP TIER (player-indexed — Tea tab + per-player) ───
  {
    name: 'Page Six',
    url: 'https://pagesix.com/feed/',
    tier: 'gossip',
    enabled: true,
    notes: 'Premier athlete gossip — relationships, parties, beef',
  },
  {
    name: 'TMZ',
    url: 'https://www.tmz.com/rss.xml',
    tier: 'gossip',
    enabled: true,
    notes: 'TMZ main feed — sports-specific endpoint returns 404 as of 2026-05. Mixed content (~70% celebrity, ~30% athlete gossip) but classifier filters down to NBA/NFL/WNBA only.',
  },
  {
    name: 'People Sports',
    url: 'https://people.com/feeds/sports.rss',
    tier: 'gossip',
    enabled: false,
    notes: 'DISABLED 2026-05 — People killed sports-specific RSS. No working replacement. Re-enable if they restore the feed or we add an HTML-scrape fallback.',
  },
  {
    name: 'Us Weekly',
    url: 'https://www.usmagazine.com/feed/',
    tier: 'gossip',
    enabled: true,
    notes: 'Filter for sports figures in classifier',
  },
  {
    name: 'NY Post Sports',
    url: 'https://nypost.com/sports/feed/',
    tier: 'gossip',
    enabled: true,
    notes: 'Tabloid-leaning sports coverage — mix of news and athlete gossip. MLB-heavy in summer, will get filtered to NBA/NFL/WNBA only by classifier.',
  },
  {
    name: 'Daily Mail Sport',
    url: 'https://www.dailymail.co.uk/sport/index.rss',
    tier: 'gossip',
    enabled: false,
    notes: 'DISABLED for v1 — feed is 80%+ Premier League content, fails our NBA/NFL/WNBA filter and drowns out US gossip sources. Re-enable in v1.1 if/when soccer is in scope.',
  },
];

/* ───────────── parser ───────────── */

export type RawFeedItem = {
  source: FeedSource;
  title: string;
  link: string;
  contentSnippet: string;  // 1-2 sentence summary from the feed
  isoDate: string;         // ISO 8601 — falls back to current time if missing
  guid: string;            // Stable unique ID — usually the URL
};

const parser: Parser = new Parser({
  timeout: 10_000,         // 10s per feed — bail fast if a source is slow
  headers: {
    'User-Agent': 'sportsBFF-tea-bot/1.0 (+https://sportsbff.app)',
  },
});

/**
 * Pull a single RSS feed. Returns [] on any failure (network, malformed XML,
 * timeout) — never throws. The cron runs all sources in parallel; one bad
 * source must not poison the batch.
 */
export async function fetchFeed(source: FeedSource): Promise<RawFeedItem[]> {
  if (!source.enabled) return [];
  try {
    const feed = await parser.parseURL(source.url);
    return (feed.items ?? [])
      .map((item): RawFeedItem | null => {
        const link = item.link || item.guid || '';
        const title = (item.title ?? '').trim();
        if (!link || !title) return null;
        return {
          source,
          title,
          link,
          contentSnippet: (item.contentSnippet ?? item.content ?? '').slice(0, 600),
          isoDate: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
          guid: item.guid || link,
        };
      })
      .filter((x): x is RawFeedItem => x !== null);
  } catch {
    // Silently swallow — one bad feed shouldn't kill the batch
    return [];
  }
}

/**
 * Pull all enabled feeds in parallel. Filters items older than `maxAgeHours`
 * to avoid re-classifying stale content from feeds with long backlogs.
 *
 * Default 26h window catches everything from the previous day plus a small
 * cushion in case the cron runs late.
 */
export async function fetchAllFeeds(opts: {
  maxAgeHours?: number;
} = {}): Promise<RawFeedItem[]> {
  const maxAge = (opts.maxAgeHours ?? 26) * 60 * 60 * 1000;
  const cutoff = Date.now() - maxAge;

  const results = await Promise.all(
    FEED_SOURCES.filter((s) => s.enabled).map((s) => fetchFeed(s)),
  );

  const all = results.flat();
  return all.filter((item) => {
    const ts = Date.parse(item.isoDate);
    return Number.isFinite(ts) && ts >= cutoff;
  });
}
