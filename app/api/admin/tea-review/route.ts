/**
 * Admin tea-review endpoints.
 *
 *   GET  /api/admin/tea-review?t=TOKEN
 *     → Returns the current pending queue. Used by the review UI.
 *
 *   POST /api/admin/tea-review?t=TOKEN
 *     → Body: { action: 'approve_news', itemId } |
 *             { action: 'approve_gossip', itemId, playerId } |
 *             { action: 'reject', itemId }
 *
 * Token auth: ADMIN_TOKEN env var. Same value used as `t` query param on every
 * request. Single shared secret — Aaron-only access. Could swap for proper
 * auth later but YAGNI for v1.
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadPending, approvePending, rejectPending } from '@/lib/live-tea-blobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function checkAuth(req: NextRequest): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false; // fail closed if not configured
  const provided =
    new URL(req.url).searchParams.get('t') ||
    (req.headers.get('authorization') || '').replace(/^Bearer\s+/, '');
  return provided === token;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const pending = await loadPending();
  return NextResponse.json({
    ok: true,
    count: pending.count,
    items: pending.items,
  });
}

type ApproveNewsBody = { action: 'approve_news'; itemId: string };
type ApproveGossipBody = { action: 'approve_gossip'; itemId: string; playerId: string };
type RejectBody = { action: 'reject'; itemId: string };
type ReviewBody = ApproveNewsBody | ApproveGossipBody | RejectBody;

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: ReviewBody;
  try {
    body = (await req.json()) as ReviewBody;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  if (!body.itemId) {
    return NextResponse.json({ ok: false, error: 'missing_itemId' }, { status: 400 });
  }

  let success = false;
  switch (body.action) {
    case 'approve_news':
      success = await approvePending(body.itemId, 'news');
      break;
    case 'approve_gossip':
      if (!body.playerId) {
        return NextResponse.json(
          { ok: false, error: 'missing_playerId' },
          { status: 400 },
        );
      }
      success = await approvePending(body.itemId, 'gossip', body.playerId);
      break;
    case 'reject':
      success = await rejectPending(body.itemId);
      break;
    default:
      return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
  }

  if (!success) {
    return NextResponse.json(
      { ok: false, error: 'item_not_found_or_invalid' },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
