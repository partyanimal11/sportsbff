/**
 * Stale-while-revalidate storage for the daily Tea feed.
 *
 * Why: unstable_cache + revalidateTag has a brief "cache cold" window during
 * a rebuild — the cache is busted, the next request triggers a 30-second LLM
 * rebuild, and any user request hitting in that window times out.
 *
 * Fix: persist cards in Vercel Blob. The cron builds new cards INTO the blob,
 * users always read whatever's currently in the blob (which is the previous
 * day's cards until the cron's atomic swap completes). Zero cold-cache window.
 *
 * Setup (one-time, in Vercel dashboard):
 *   1. Project Settings → Storage → Connect a Database → Blob → Create
 *   2. Vercel auto-injects BLOB_READ_WRITE_TOKEN env var
 *   3. Push code that imports @vercel/blob — Vercel installs the dep on next build
 *
 * Failure mode: if Blob is unavailable, /api/today falls through to the
 * unstable_cache fallback (still better than a hard error).
 */
import { put, list, del } from '@vercel/blob';
import type { TeaCard } from './today-feed';

const BLOB_PATH = 'today-feed.json';

export type StoredFeed = {
  generatedAt: string;       // ISO timestamp
  date: string;               // YYYY-MM-DD
  cards: TeaCard[];
  count: number;
};

/** True if we have the Blob env var configured. */
function hasBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Write the latest cards to Blob storage. Called by the cron once per day.
 * Uses allowOverwrite + fixed pathname so we always replace, never accumulate.
 */
export async function saveCards(cards: TeaCard[]): Promise<{ url: string } | null> {
  if (!hasBlobConfigured()) return null;
  if (cards.length === 0) {
    // Don't overwrite a good blob with an empty one — keep yesterday's cards
    // serving while we figure out what went wrong.
    return null;
  }

  const payload: StoredFeed = {
    generatedAt: new Date().toISOString(),
    date: new Date().toISOString().slice(0, 10),
    cards,
    count: cards.length,
  };

  // Best-effort cleanup: list any stale duplicates before writing
  try {
    const existing = await list({ prefix: BLOB_PATH });
    for (const blob of existing.blobs) {
      if (blob.pathname !== BLOB_PATH) {
        await del(blob.url).catch(() => undefined);
      }
    }
  } catch {
    // ignore — we'll still try to write
  }

  const result = await put(BLOB_PATH, JSON.stringify(payload), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return { url: result.url };
}

/**
 * Read the latest cards from Blob storage. Returns null if Blob isn't configured
 * or no cards have been written yet. Always returns whatever's currently
 * stored — even if it's "stale" (from yesterday's cron). Zero rebuild latency.
 */
export async function loadCards(): Promise<StoredFeed | null> {
  if (!hasBlobConfigured()) return null;

  try {
    const result = await list({ prefix: BLOB_PATH });
    const blob = result.blobs.find((b) => b.pathname === BLOB_PATH);
    if (!blob) return null;

    // Fetch the JSON content. Vercel Blob URLs are public, edge-cached.
    const res = await fetch(blob.url, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as StoredFeed;
    return data;
  } catch {
    return null;
  }
}
