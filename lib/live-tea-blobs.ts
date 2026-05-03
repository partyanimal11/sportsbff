/**
 * Blob-storage layer for the live tea pipeline.
 *
 * Three blobs:
 *   - tea-live-news.json   → auto-approved hard-news items (ESPN, AP, etc).
 *                            Surfaced in Tea tab feed only. Capped at 200.
 *   - tea-live-gossip.json → auto-approved gossip items with player_id.
 *                            Surfaced in Tea tab feed AND in scan/scout per-player. Capped at 200.
 *   - tea-pending.json     → low-confidence items awaiting Aaron's review at /admin/tea-review.
 *                            Capped at 100 (older items dropped — they go stale fast).
 *
 * Mirror of lib/today-storage.ts — same put/list/del pattern, same env vars.
 *
 * Dedup: every item has a stable `id` derived from the source URL. The append
 * helpers refuse to add an item whose id already exists in the store.
 */

import { put, list, del } from '@vercel/blob';
import type { LiveTeaItem, PendingItem, LiveTeaFile, PendingFile } from './tea-types';

// Re-export for callers that already import from this module
export type { LiveTeaItem, PendingItem, LiveTeaFile, PendingFile };

const BLOB_PATH_NEWS = 'tea-live-news.json';
const BLOB_PATH_GOSSIP = 'tea-live-gossip.json';
const BLOB_PATH_PENDING = 'tea-pending.json';

const CAP_LIVE = 200;
const CAP_PENDING = 100;

/* ───────────── helpers ───────────── */

function hasBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readBlob<T>(pathname: string): Promise<T | null> {
  if (!hasBlobConfigured()) return null;
  try {
    const result = await list({ prefix: pathname });
    const blob = result.blobs.find((b) => b.pathname === pathname);
    if (!blob) return null;
    const res = await fetch(blob.url, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function writeBlob(pathname: string, payload: unknown): Promise<{ url: string } | null> {
  if (!hasBlobConfigured()) return null;
  try {
    const existing = await list({ prefix: pathname });
    for (const b of existing.blobs) {
      await del(b.url).catch(() => undefined);
    }
  } catch {
    // ignore
  }
  const result = await put(pathname, JSON.stringify(payload), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return { url: result.url };
}

/* ───────────── public read API ───────────── */

/**
 * Load the news-tier live blob. Returns empty file shape if blob is missing
 * or unconfigured — never throws. Tea tab feed is happy with empty.
 */
export async function loadLiveNews(): Promise<LiveTeaFile> {
  const stored = await readBlob<LiveTeaFile>(BLOB_PATH_NEWS);
  return stored ?? { generated_at: new Date(0).toISOString(), count: 0, items: [] };
}

/**
 * Load the gossip-tier live blob. Same fallback pattern.
 */
export async function loadLiveGossip(): Promise<LiveTeaFile> {
  const stored = await readBlob<LiveTeaFile>(BLOB_PATH_GOSSIP);
  return stored ?? { generated_at: new Date(0).toISOString(), count: 0, items: [] };
}

/**
 * Load the pending review queue.
 */
export async function loadPending(): Promise<PendingFile> {
  const stored = await readBlob<PendingFile>(BLOB_PATH_PENDING);
  return stored ?? { generated_at: new Date(0).toISOString(), count: 0, items: [] };
}

/* ───────────── public write API ───────────── */

/**
 * Append items to the news blob, dedupe by source_url, cap at CAP_LIVE.
 * Returns count of newly added items (after dedup).
 */
export async function appendLiveNews(newItems: LiveTeaItem[]): Promise<number> {
  if (newItems.length === 0) return 0;
  const current = await loadLiveNews();
  const existingUrls = new Set(current.items.map((i) => i.source_url));
  const fresh = newItems.filter((i) => !existingUrls.has(i.source_url));
  if (fresh.length === 0) return 0;

  // Newest first, cap to CAP_LIVE
  const merged = [...fresh, ...current.items]
    .sort((a, b) => Date.parse(b.ingested_at) - Date.parse(a.ingested_at))
    .slice(0, CAP_LIVE);

  await writeBlob(BLOB_PATH_NEWS, {
    generated_at: new Date().toISOString(),
    count: merged.length,
    items: merged,
  });
  return fresh.length;
}

/**
 * Append items to the gossip blob, dedupe by source_url, cap at CAP_LIVE.
 * Items MUST have player_id set. Items without player_id are silently dropped.
 */
export async function appendLiveGossip(newItems: LiveTeaItem[]): Promise<number> {
  const valid = newItems.filter((i) => i.player_id !== null);
  if (valid.length === 0) return 0;
  const current = await loadLiveGossip();
  const existingUrls = new Set(current.items.map((i) => i.source_url));
  const fresh = valid.filter((i) => !existingUrls.has(i.source_url));
  if (fresh.length === 0) return 0;

  const merged = [...fresh, ...current.items]
    .sort((a, b) => Date.parse(b.ingested_at) - Date.parse(a.ingested_at))
    .slice(0, CAP_LIVE);

  await writeBlob(BLOB_PATH_GOSSIP, {
    generated_at: new Date().toISOString(),
    count: merged.length,
    items: merged,
  });
  return fresh.length;
}

/**
 * Append items to the pending queue, dedupe by source_url, cap at CAP_PENDING.
 */
export async function appendPending(newItems: PendingItem[]): Promise<number> {
  if (newItems.length === 0) return 0;
  const current = await loadPending();
  const existingUrls = new Set(current.items.map((i) => i.source_url));
  const fresh = newItems.filter((i) => !existingUrls.has(i.source_url));
  if (fresh.length === 0) return 0;

  const merged = [...fresh, ...current.items]
    .sort((a, b) => Date.parse(b.ingested_at) - Date.parse(a.ingested_at))
    .slice(0, CAP_PENDING);

  await writeBlob(BLOB_PATH_PENDING, {
    generated_at: new Date().toISOString(),
    count: merged.length,
    items: merged,
  });
  return fresh.length;
}

/* ───────────── review actions ───────────── */

/**
 * Approve a pending item — moves it from tea-pending.json to either
 * tea-live-news.json or tea-live-gossip.json based on `targetTier`.
 *
 * For gossip approvals, `playerIdOverride` lets Aaron set the correct player
 * at review time (the classifier may have guessed wrong or none at all).
 *
 * Returns true on success, false if item not found in pending queue.
 */
export async function approvePending(
  itemId: string,
  targetTier: 'news' | 'gossip',
  playerIdOverride?: string,
): Promise<boolean> {
  const pending = await loadPending();
  const item = pending.items.find((i) => i.id === itemId);
  if (!item) return false;

  // Strip pending-only fields, ensure player_id is set correctly
  const promoted: LiveTeaItem = {
    id: item.id,
    tier: item.tier,
    category: item.category,
    headline: item.headline,
    summary: item.summary,
    sources: item.sources,
    ingested_at: new Date().toISOString(), // re-stamp so it shows as FRESH
    player_id: targetTier === 'gossip' ? (playerIdOverride ?? item.guessed_player_id) : null,
    confidence: 1.0, // human-reviewed = max confidence
    source_url: item.source_url,
    league: item.league,
  };

  if (targetTier === 'news') {
    await appendLiveNews([promoted]);
  } else {
    if (!promoted.player_id) return false; // gossip without a player is invalid
    await appendLiveGossip([promoted]);
  }

  // Remove from pending
  const remaining = pending.items.filter((i) => i.id !== itemId);
  await writeBlob(BLOB_PATH_PENDING, {
    generated_at: new Date().toISOString(),
    count: remaining.length,
    items: remaining,
  });
  return true;
}

/**
 * Reject a pending item — removes from queue, never appears anywhere.
 * Returns true on success, false if item not found.
 */
export async function rejectPending(itemId: string): Promise<boolean> {
  const pending = await loadPending();
  if (!pending.items.find((i) => i.id === itemId)) return false;
  const remaining = pending.items.filter((i) => i.id !== itemId);
  await writeBlob(BLOB_PATH_PENDING, {
    generated_at: new Date().toISOString(),
    count: remaining.length,
    items: remaining,
  });
  return true;
}

/**
 * Purge an item from a live blob — used when a published item turns out to
 * be wrong (factually incorrect summary, mis-attributed player, hallucinated
 * detail) and needs to be removed AFTER it already cleared the auto-publish
 * gate. Returns true on success, false if not found in either blob.
 *
 * Searches both live-news and live-gossip — Aaron just provides the item id,
 * we figure out where it lives.
 */
export async function purgeFromLive(itemId: string): Promise<{ removed: boolean; from: 'news' | 'gossip' | null }> {
  const news = await loadLiveNews();
  if (news.items.find((i) => i.id === itemId)) {
    const remaining = news.items.filter((i) => i.id !== itemId);
    await writeBlob(BLOB_PATH_NEWS, {
      generated_at: new Date().toISOString(),
      count: remaining.length,
      items: remaining,
    });
    return { removed: true, from: 'news' };
  }
  const gossip = await loadLiveGossip();
  if (gossip.items.find((i) => i.id === itemId)) {
    const remaining = gossip.items.filter((i) => i.id !== itemId);
    await writeBlob(BLOB_PATH_GOSSIP, {
      generated_at: new Date().toISOString(),
      count: remaining.length,
      items: remaining,
    });
    return { removed: true, from: 'gossip' };
  }
  return { removed: false, from: null };
}
