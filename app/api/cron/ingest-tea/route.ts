/**
 * GET /api/cron/ingest-tea
 *
 * Daily tea-ingest cron. Runs once per day at 6am ET (10am UTC) — see
 * vercel.json for the schedule. Hits all enabled RSS feeds, classifies
 * each new item via GPT-4o-mini, routes results into three blob lanes:
 *
 *   - news-tier confident       → tea-live-news.json    (Tea tab feed only)
 *   - gossip-tier confident     → tea-live-gossip.json  (Tea tab + per-player)
 *   - low-confidence / no-match → tea-pending.json      (review queue)
 *
 * Security: Vercel cron sends `Authorization: Bearer ${CRON_SECRET}`. Manual
 * trigger via `?key=...` is also supported for testing.
 *
 * Also accepts a `?dryRun=1` query param — runs full classification but
 * skips blob writes. Useful for sanity-checking before deploying schedule changes.
 *
 * Response shape:
 * {
 *   ok: true,
 *   feedsProcessed: 12,
 *   itemsFetched: 142,
 *   itemsClassified: 142,
 *   newsAdded: 8,
 *   gossipAdded: 3,
 *   pendingAdded: 4,
 *   rejected: 127,
 *   elapsedMs: 24532,
 *   timestamp: "2026-05-03T10:00:14.532Z"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllFeeds, type RawFeedItem } from '@/lib/rss-feeds';
import { classifyBatch } from '@/lib/tea-classifier';
import {
  appendLiveNews,
  appendLiveGossip,
  appendPending,
} from '@/lib/live-tea-blobs';
import type { LiveTeaItem, PendingItem } from '@/lib/tea-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Vercel Hobby caps cron at 60s, Pro at 300s. We target ~25s actual work at
// concurrency 10, so 60 is plenty of headroom on either plan AND keeps the
// failure mode explicit (timeout error vs silent hang).
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // ─── Auth ───
  const auth = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.CRON_SECRET ?? ''}`;
  const url = new URL(req.url);
  const manualKey = url.searchParams.get('key');
  const isAuthorized =
    (process.env.CRON_SECRET && auth === expected) ||
    (process.env.CRON_SECRET && manualKey === process.env.CRON_SECRET);

  if (!isAuthorized) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = url.searchParams.get('dryRun') === '1';
  const startedAt = Date.now();

  // ─── Fetch all feeds ───
  let feedItems: RawFeedItem[];
  try {
    feedItems = await fetchAllFeeds({ maxAgeHours: 26 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'feed_fetch_failed', message: String(err).slice(0, 200) },
      { status: 500 },
    );
  }

  // ─── Classify ───
  // Cap items processed per run. ~$0.06/day = $22/year at 200 items.
  //
  // Two-level fairness:
  //   1. Per-tier cap (100 each) — keeps gossip from getting eclipsed by news
  //   2. Per-source cap (20 each) — keeps any single feed from monopolizing its tier
  //      (e.g. Daily Mail's 80+ Premier League items used to dominate the gossip
  //      pool before being disabled; ESPN's 4 feeds can collectively flood the
  //      news pool without this).
  const PER_TIER_CAP = 100;
  const PER_SOURCE_CAP = 20;
  const TOTAL_CAP = 200;

  function capPerSource(items: RawFeedItem[], perSourceMax: number): RawFeedItem[] {
    const counts = new Map<string, number>();
    return items.filter((i) => {
      const c = counts.get(i.source.name) ?? 0;
      if (c >= perSourceMax) return false;
      counts.set(i.source.name, c + 1);
      return true;
    });
  }

  const gossipPool = capPerSource(
    feedItems.filter((i) => i.source.tier === 'gossip'),
    PER_SOURCE_CAP,
  ).slice(0, PER_TIER_CAP);
  const newsPool = capPerSource(
    feedItems.filter((i) => i.source.tier === 'news'),
    PER_SOURCE_CAP,
  ).slice(0, PER_TIER_CAP);
  const capped = [...gossipPool, ...newsPool].slice(0, TOTAL_CAP);

  // Concurrency 15 = 200 items in ~17s (vs 25s at 10), giving ~40s headroom
  // below Vercel Hobby's 60s cron ceiling. gpt-4o-mini scales fine here.
  const classifications = await classifyBatch(capped, { concurrency: 15 });

  // ─── Route into lanes ───
  const newsItems: LiveTeaItem[] = [];
  const gossipItems: LiveTeaItem[] = [];
  const pendingItems: PendingItem[] = [];
  const rejectReasonCounts: Record<string, number> = {};
  let rejectedCount = 0;

  for (let i = 0; i < classifications.length; i++) {
    const result = classifications[i];
    const sourceTier = capped[i].source.tier;
    if (result.kind === 'live') {
      if (sourceTier === 'news') {
        newsItems.push(result.item);
      } else {
        gossipItems.push(result.item);
      }
    } else if (result.kind === 'pending') {
      pendingItems.push(result.item);
    } else {
      rejectedCount++;
      // Bucket rejection reasons by prefix for visibility — gives Aaron a
      // sense of WHY items get cut without dumping every reason string.
      const reasonBucket = result.reason.split(/[:_]/)[0] || 'unknown';
      rejectReasonCounts[reasonBucket] = (rejectReasonCounts[reasonBucket] ?? 0) + 1;
    }
  }

  // ─── Persist (unless dryRun) ───
  let newsAdded = 0;
  let gossipAdded = 0;
  let pendingAdded = 0;
  if (!dryRun) {
    [newsAdded, gossipAdded, pendingAdded] = await Promise.all([
      appendLiveNews(newsItems),
      appendLiveGossip(gossipItems),
      appendPending(pendingItems),
    ]);
  } else {
    newsAdded = newsItems.length;
    gossipAdded = gossipItems.length;
    pendingAdded = pendingItems.length;
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    feedsProcessed: new Set(capped.map((c) => c.source.name)).size,
    feedsAttempted: new Set(feedItems.map((c) => c.source.name)).size,
    itemsFetched: feedItems.length,
    itemsClassified: classifications.length,
    poolBreakdown: {
      gossipFetched: feedItems.filter((i) => i.source.tier === 'gossip').length,
      newsFetched: feedItems.filter((i) => i.source.tier === 'news').length,
      gossipClassified: capped.filter((i) => i.source.tier === 'gossip').length,
      newsClassified: capped.filter((i) => i.source.tier === 'news').length,
    },
    // Per-source counts in the classified batch — confirms per-source caps are
    // working and shows which feeds are pulling weight vs noise.
    sourceBreakdown: capped.reduce((acc, item) => {
      acc[item.source.name] = (acc[item.source.name] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    newsAdded,
    gossipAdded,
    pendingAdded,
    rejected: rejectedCount,
    rejectReasons: rejectReasonCounts,
    elapsedMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
}
