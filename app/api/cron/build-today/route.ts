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
import { getCachedTodayFeed } from '@/lib/today-feed';

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

  // Step 1: invalidate the cache
  revalidateTag('today-feed');

  // Step 2: pre-warm via the CACHED wrapper so the result actually lands
  // in unstable_cache's data store. Calling buildTodayFeed() directly
  // would rebuild the cards but skip the cache write — meaning the next
  // user request would still pay the 20-second LLM rebuild cost. This
  // line is the difference between "cron worked but iOS times out" and
  // "cron worked and iOS gets cached cards instantly."
  let cardCount = 0;
  let buildError: string | null = null;
  try {
    const cards = await getCachedTodayFeed();
    cardCount = cards.length;
  } catch (err) {
    buildError = String(err).slice(0, 200);
  }

  const elapsedMs = Date.now() - startedAt;

  return NextResponse.json({
    ok: true,
    invalidatedTag: 'today-feed',
    rebuiltCards: cardCount,
    elapsedMs,
    buildError,
    timestamp: new Date().toISOString(),
  });
}
