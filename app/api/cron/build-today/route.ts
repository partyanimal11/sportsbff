/**
 * GET /api/cron/build-today
 *
 * Vercel cron endpoint — invalidates the daily Tea feed cache and pre-warms
 * a fresh build. Scheduled in vercel.json to run once per day (7am ET / 11am UTC).
 *
 * Security: Vercel automatically attaches `Authorization: Bearer ${CRON_SECRET}`
 * to scheduled cron requests. We verify that header before doing any work.
 *
 * What it does:
 *   1. Verify the cron secret
 *   2. Bust the today-feed cache via revalidateTag
 *   3. Optionally pre-warm by triggering one rebuild now (so the first user
 *      of the day doesn't pay the LLM latency cost)
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { buildTodayFeed, getCachedTodayFeed } from '@/lib/today-feed';
import { saveCards } from '@/lib/today-storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel attaches this automatically for scheduled crons)
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    // Allow GET ?key=... as a manual trigger fallback (handy for testing)
    const key = new URL(req.url).searchParams.get('key');
    if (!key || key !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  const startedAt = Date.now();

  // STALE-WHILE-REVALIDATE FLOW:
  //   1. Build fresh cards via raw buildTodayFeed (~30 sec)
  //   2. Atomically swap them into Vercel Blob storage
  //   3. Bust the unstable_cache so next /api/today read picks up the new blob
  //
  // While this cron is running, /api/today keeps serving WHATEVER IS CURRENTLY
  // IN THE BLOB (yesterday's cards). Users see no cold-cache window. Once the
  // blob swap completes, the next read picks up the new cards instantly.
  let cardCount = 0;
  let buildError: string | null = null;
  let blobUrl: string | null = null;
  let usedFallback = false;

  try {
    const cards = await buildTodayFeed();
    cardCount = cards.length;

    if (cards.length > 0) {
      // Atomic swap: write new cards to blob (overwrites previous)
      const result = await saveCards(cards);
      blobUrl = result?.url ?? null;
    }

    // Bust the unstable_cache fallback layer too, so it stays in sync
    // with the blob for any code path that reads it.
    revalidateTag('today-feed');

    // Pre-warm the unstable_cache fallback with the same cards (so if blob
    // is unavailable for some reason, the cache still has fresh data)
    try {
      await getCachedTodayFeed();
    } catch {
      usedFallback = true;
    }
  } catch (err) {
    buildError = String(err).slice(0, 200);
  }

  const elapsedMs = Date.now() - startedAt;

  return NextResponse.json({
    ok: true,
    rebuiltCards: cardCount,
    blobUrl,
    elapsedMs,
    buildError,
    usedFallback,
    timestamp: new Date().toISOString(),
  });
}
