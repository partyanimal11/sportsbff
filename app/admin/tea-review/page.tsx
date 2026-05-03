'use client';

/**
 * Tea Review queue — Aaron's morning approval pass over the prior day's
 * low-confidence ingest items.
 *
 * URL: /admin/tea-review?t=ADMIN_TOKEN
 *
 * Mobile-first — Aaron does this on his phone over coffee. Each item has
 * three actions:
 *   - Approve to news    → goes to Tea tab feed only
 *   - Approve to gossip  → pick a player_id, indexed for scan/scout too
 *   - Reject             → permanently dropped
 *
 * The page is gated by the `t` query param matching ADMIN_TOKEN env var.
 * Everything (load, approve, reject) goes through /api/admin/tea-review
 * with the same token attached.
 */

import { useEffect, useState, useCallback } from 'react';

type PendingItem = {
  id: string;
  tier: 'confirmed' | 'reported' | 'speculation' | 'rumor';
  category: string;
  headline: string;
  summary: string;
  sources: { name: string; url: string; date: string }[];
  ingested_at: string;
  player_id: string | null;
  confidence: number;
  source_url: string;
  league: 'nba' | 'nfl' | 'wnba' | 'general';
  pending_reason: string;
  guessed_player_id: string | null;
};

type PlayerMatch = {
  player_id: string;
  name: string;
  team: string;
  league: string;
};

const TIER_COLOR: Record<PendingItem['tier'], string> = {
  confirmed: '#0F6E56',
  reported: '#185FA5',
  speculation: '#854F0B',
  rumor: '#5F5E5A',
};

export default function TeaReviewPage() {
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [actionInflight, setActionInflight] = useState<Set<string>>(new Set());

  // Pull token from URL once mounted (avoids SSR hydration mismatch)
  useEffect(() => {
    const t = new URL(window.location.href).searchParams.get('t');
    if (!t) {
      setAuthError('Missing token. Append ?t=YOUR_ADMIN_TOKEN to the URL.');
      setLoading(false);
      return;
    }
    setToken(t);
  }, []);

  const loadQueue = useCallback(async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tea-review?t=${encodeURIComponent(t)}`);
      const data = await res.json();
      if (!data.ok) {
        setAuthError(data.error === 'unauthorized' ? 'Invalid token.' : 'Error loading queue.');
        setItems([]);
      } else {
        setItems(data.items as PendingItem[]);
        setAuthError(null);
      }
    } catch {
      setAuthError('Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) loadQueue(token);
  }, [token, loadQueue]);

  async function postAction(
    action: 'approve_news' | 'approve_gossip' | 'reject',
    itemId: string,
    playerId?: string,
  ) {
    if (!token) return;
    setActionInflight((prev) => new Set(prev).add(itemId));
    try {
      const res = await fetch(`/api/admin/tea-review?t=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, itemId, ...(playerId ? { playerId } : {}) }),
      });
      const data = await res.json();
      if (data.ok) {
        // Optimistic remove from list
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        alert('Action failed: ' + (data.error || 'unknown'));
      }
    } catch {
      alert('Network error');
    } finally {
      setActionInflight((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }

  if (authError) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold text-burgundy mb-2">
            Tea Review · auth required
          </h1>
          <p className="text-sm text-ink-soft">{authError}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white" style={{ minHeight: '100dvh' }}>
      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-md border-b border-[var(--hairline)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-base font-extrabold text-green tracking-wide">
              TEA REVIEW
            </h1>
            <p className="text-[11px] text-ink-soft mt-0.5">
              {loading ? 'loading…' : `${items.length} pending`}
            </p>
          </div>
          <button
            onClick={() => token && loadQueue(token)}
            className="text-[12px] text-tangerine hover:underline font-semibold"
          >
            Refresh ↻
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-tangerine border-t-transparent rounded-full animate-spin" />
            <div className="mt-3 text-[13px] text-ink-soft">Loading queue…</div>
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl bg-cream-warm/60 border border-[var(--hairline)] p-8 text-center">
            <div className="text-3xl mb-2">☕</div>
            <div className="font-display font-bold text-base text-green">All caught up</div>
            <div className="mt-1 text-[12px] text-ink-soft italic">
              No pending tea items. The cron will pull a fresh batch overnight.
            </div>
          </div>
        )}

        {items.map((item) => (
          <ReviewCard
            key={item.id}
            item={item}
            token={token!}
            inflight={actionInflight.has(item.id)}
            onAction={postAction}
          />
        ))}
      </div>
    </main>
  );
}

/* ─────────────────── card ─────────────────── */

function ReviewCard({
  item,
  token,
  inflight,
  onAction,
}: {
  item: PendingItem;
  token: string;
  inflight: boolean;
  onAction: (action: 'approve_news' | 'approve_gossip' | 'reject', itemId: string, playerId?: string) => void;
}) {
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerResults, setPickerResults] = useState<PlayerMatch[]>([]);
  const [chosenPlayer, setChosenPlayer] = useState<PlayerMatch | null>(null);

  // Player search
  useEffect(() => {
    if (!showPlayerPicker || pickerQuery.length < 2) {
      setPickerResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/players-search?t=${encodeURIComponent(token)}&q=${encodeURIComponent(pickerQuery)}`,
          { signal: ctrl.signal },
        );
        const data = await res.json();
        if (data.ok) setPickerResults(data.players as PlayerMatch[]);
      } catch {
        // ignore (probably aborted)
      }
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [pickerQuery, showPlayerPicker, token]);

  const tierColor = TIER_COLOR[item.tier];
  const ageHours = Math.floor((Date.now() - Date.parse(item.ingested_at)) / 3_600_000);

  return (
    <article className="bg-white rounded-2xl border border-[var(--hairline)] p-4 shadow-[0_2px_8px_-4px_rgba(13,45,36,0.08)]">
      {/* Meta strip */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
          style={{ background: tierColor + '20', color: tierColor }}
        >
          {item.tier}
        </span>
        <span className="text-[10px] text-ink-soft uppercase tracking-wide">{item.category}</span>
        <span className="text-[10px] text-ink-soft">·</span>
        <span className="text-[10px] text-ink-soft">{item.league.toUpperCase()}</span>
        <span className="text-[10px] text-ink-soft">·</span>
        <span className="text-[10px] text-ink-soft">{item.sources[0]?.name}</span>
        <span className="ml-auto text-[10px] text-tangerine font-mono">
          {Math.round(item.confidence * 100)}%
        </span>
      </div>

      {/* Headline + summary */}
      <h2 className="font-display font-bold text-[15px] leading-tight text-green">
        {item.headline}
      </h2>
      <p className="mt-1.5 text-[13px] text-ink leading-snug">{item.summary}</p>

      {/* Pending reason hint */}
      <div className="mt-2 inline-flex items-center gap-1.5 text-[10px] text-ink-soft italic">
        <span>⚠</span>
        <span>{prettyReason(item.pending_reason)}</span>
        {item.guessed_player_id && (
          <span className="text-tangerine">· guessed: {item.guessed_player_id}</span>
        )}
      </div>

      {/* Source link */}
      <a
        href={item.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-[11px] text-magenta hover:underline"
      >
        Read source ↗
      </a>
      <span className="ml-2 text-[10px] text-muted">{ageHours}h ago</span>

      {/* Player picker (collapsed by default) */}
      {showPlayerPicker && (
        <div className="mt-3 rounded-xl bg-cream-warm/60 border border-[var(--hairline)] p-3">
          <input
            type="text"
            placeholder="Type player name…"
            value={pickerQuery}
            onChange={(e) => setPickerQuery(e.target.value)}
            className="w-full bg-white border border-[var(--hairline)] rounded-lg px-3 py-2 text-[13px]"
            autoFocus
          />
          {pickerResults.length > 0 && (
            <ul className="mt-2 max-h-48 overflow-y-auto space-y-0.5">
              {pickerResults.map((p) => (
                <li key={p.player_id}>
                  <button
                    onClick={() => {
                      setChosenPlayer(p);
                      setPickerQuery(p.name);
                      setPickerResults([]);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded text-[12px] hover:bg-tangerine/10 ${
                      chosenPlayer?.player_id === p.player_id ? 'bg-tangerine/15 font-semibold' : ''
                    }`}
                  >
                    <span className="font-semibold text-green">{p.name}</span>
                    <span className="text-ink-soft"> · {p.team} ({p.league.toUpperCase()})</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {chosenPlayer && (
            <button
              onClick={() => onAction('approve_gossip', item.id, chosenPlayer.player_id)}
              disabled={inflight}
              className="mt-3 w-full bg-magenta text-white font-semibold rounded-full px-4 py-2 text-[13px] disabled:opacity-50"
            >
              {inflight ? 'Saving…' : `Approve as gossip on ${chosenPlayer.name} →`}
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          onClick={() => onAction('approve_news', item.id)}
          disabled={inflight}
          className="flex-1 min-w-0 bg-green text-white font-semibold rounded-full px-3 py-2 text-[12px] disabled:opacity-50"
        >
          {inflight ? '…' : '✓ News only'}
        </button>
        <button
          onClick={() => setShowPlayerPicker((v) => !v)}
          disabled={inflight}
          className="flex-1 min-w-0 bg-magenta/10 text-magenta border border-magenta/30 font-semibold rounded-full px-3 py-2 text-[12px] disabled:opacity-50"
        >
          ✿ Pick player
        </button>
        <button
          onClick={() => onAction('reject', item.id)}
          disabled={inflight}
          className="bg-burgundy/10 text-burgundy font-semibold rounded-full px-3 py-2 text-[12px] disabled:opacity-50"
        >
          ✕ Reject
        </button>
      </div>
    </article>
  );
}

function prettyReason(reason: string): string {
  if (reason.startsWith('low_confidence_')) {
    return `Low confidence (${reason.replace('low_confidence_', '')})`;
  }
  if (reason.startsWith('unknown_player_')) {
    return `Player not in DB: "${reason.replace('unknown_player_', '')}"`;
  }
  if (reason === 'no_player_named') {
    return 'No player named in headline';
  }
  return reason;
}
