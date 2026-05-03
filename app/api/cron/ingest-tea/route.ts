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
import { fetchAllFeeds } from '@/lib/rss-feeds';
import { classifyBatch } from '@/lib/tea-classifier';
import {
  appendLiveNews,
  appendLiveGossip,
  appendPending,
} from '@/lib/live-tea-blobs';
import type { LiveTeaItem, PendingItem } from '@/lib/tea-types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes — comfortably above worst case

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
  let feedItems;
  try {
    feedItems = await fetchAllFeeds({ maxAgeHours: 26 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'feed_fetch_failed', message: String(err).slice(0, 200) },
      { status: 500 },
    );
  }

  // ─── Classify ───
  // Cap items processed per run to keep cost bounded. 80 items × 5 concurrent
  // = ~16s of LLM time; well within budget. RSS feeds may surface dupes from
  // prior runs — those get filtered out at append time by source URL.
  const capped = feedItems.slice(0, 80);
  const classifications = await classifyBatch(capped, { concurrency: 5 });

  // ─── Route into lanes ───
  const newsItems: LiveTeaItem[] = [];
  const gossipItems: LiveTeaItem[] = [];
  const pendingItems: PendingItem[] = [];
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
    itemsFetched: feedItems.length,
    itemsClassified: classifications.length,
    newsAdded,
    gossipAdded,
    pendingAdded,
    rejected: rejectedCount,
    elapsedMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  });
}
