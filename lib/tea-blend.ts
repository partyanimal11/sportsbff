/**
 * tea-blend — single read path for "all tea about player X."
 *
 * Merges two sources:
 *   1. Curated `players-gossip.json` (hand-edited, slow-growing, 1,257+ items)
 *   2. Live gossip blob `tea-live-gossip.json` (auto-ingested daily, capped at 200)
 *
 * Returns items sorted by recency-weighted-by-tier — confirmed > reported,
 * and within tier, newer first. Used by /api/scan/game enrichRoster() so
 * fresh tea immediately surfaces in scan/scout per-player results.
 *
 * News-tier live items are NEVER returned here — they belong in the Tea tab
 * feed only. See loadLiveNews() in live-tea-blobs.ts for that read path.
 */

import gossipData from '@/data/players-gossip.json';
import { loadLiveGossip } from './live-tea-blobs';
import type { GossipItem, GossipSource } from './tea-types';

// Re-export for callers
export type { GossipItem, GossipSource };

type CuratedPlayer = {
  player_id: string;
  name: string;
  team: string;
  league: string;
  items: GossipItem[];
};

// players-gossip.json is keyed by player_id at the top level — a Record, not an array.
// (Wrapped here as Record<string, CuratedPlayer> so the lookup `CURATED[id]` is O(1)
// and matches the existing /api/scan/game pattern.)
const CURATED: Record<string, CuratedPlayer> = gossipData as unknown as Record<string, CuratedPlayer>;

const TIER_RANK: Record<string, number> = {
  confirmed: 4,
  reported: 3,
  speculation: 2,
  rumor: 1,
};

/* ───────────── public API ───────────── */

/**
 * One-shot "give me everything about this player" — curated + live, deduped,
 * sorted by tier then recency. Used wherever we render tea for a single
 * player (scan/scout result, future /player/[id] page).
 */
export async function getTeaForPlayer(playerId: string): Promise<GossipItem[]> {
  const curated = CURATED[playerId]?.items ?? [];
  const live = await loadLiveGossip();
  const livePlayerItems = live.items.filter((i) => i.player_id === playerId);

  // Dedup by id (live items might have been promoted from pending and then
  // also accidentally re-ingested — defense in depth)
  const seen = new Set<string>();
  const merged: GossipItem[] = [];
  for (const item of [...livePlayerItems, ...curated]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return sortByTierThenRecency(merged);
}

/**
 * Synchronous variant for hot paths that don't await — falls back to curated only.
 * Currently used by /api/scan/game's enrichRoster which is fully async, so
 * prefer getTeaForPlayer() everywhere. Kept for backward compat.
 */
export function getCuratedTeaForPlayer(playerId: string): GossipItem[] {
  const curated = CURATED[playerId]?.items ?? [];
  return sortByTierThenRecency([...curated]);
}

/**
 * Pick top N tea items for a player — preferring higher tier, then recency.
 * Awaitable variant of pickTopTea() that includes live-gossip items.
 */
export async function pickTopTeaWithLive(
  playerId: string,
  n: number,
): Promise<GossipItem[]> {
  const all = await getTeaForPlayer(playerId);
  return all.slice(0, n);
}

/* ───────────── internal sort ───────────── */

function sortByTierThenRecency(items: GossipItem[]): GossipItem[] {
  return [...items].sort((a, b) => {
    const tierDiff = (TIER_RANK[b.tier] ?? 0) - (TIER_RANK[a.tier] ?? 0);
    if (tierDiff !== 0) return tierDiff;
    // Within tier — newer source date first
    const aDate = a.sources[0]?.date ?? '';
    const bDate = b.sources[0]?.date ?? '';
    return bDate.localeCompare(aDate);
  });
}

/**
 * Returns true if an item was added to the live blob within the last 24h.
 * Used by UI to render the "FRESH" badge. Curated items always return false.
 */
export function isFreshItem(item: GossipItem, liveItemMap: Map<string, string>): boolean {
  const ingestedAt = liveItemMap.get(item.id);
  if (!ingestedAt) return false;
  const ageMs = Date.now() - Date.parse(ingestedAt);
  return ageMs >= 0 && ageMs < 24 * 60 * 60 * 1000;
}
