'use client';

/**
 * Tea'd Up — Tea tab.
 *
 * Daily 3-card stack from /api/today. Beeper-style cards with translucent
 * green chrome + dark display + LED tangerine headers. Body text in Inter
 * for readability.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomTabs, BottomTabsSpacer } from '@/components/BottomTabs';
import { ModeToggle, type Mode } from '@/components/ModeToggle';
import { TierPill, parseTierPills } from '@/components/TierPill';
import { Markdown } from '@/lib/markdown';
import { getProfile, setProfile } from '@/lib/profile';

type TeaCard = {
  drama?: { prompt: string; response: string };
  players?: { id: string; name: string; team: string; league: 'nfl' | 'nba'; number: number }[];
  lesson?: { title: string; body: string };
};

type TeaResponse = TeaCard & { date: string; cached?: boolean; fallback?: boolean };

export default function TeaPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TeaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modes, setModes] = useState<Mode[]>(['drama', 'on_field', 'learn']);
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    setMounted(true);
    const p = getProfile();
    if (p.displayName) setDisplayName(p.displayName);
    if (p.defaultModes?.length) {
      // For Tea, default is all 3 unless user has explicitly narrowed
      setModes(['drama', 'on_field', 'learn']);
    }
    fetchTea(p);
  }, []);

  async function fetchTea(profile = getProfile()) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          league: profile.league ?? 'both',
          displayName: profile.displayName,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as TeaResponse;
      setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // Build the visible card list based on active modes
  const cards: { key: 'drama' | 'on_field' | 'learn'; node: React.ReactNode }[] = [];
  if (data) {
    if (modes.includes('drama') && data.drama) {
      cards.push({ key: 'drama', node: <DramaCard idx={1} total={cards.length + (modes.includes('on_field') ? 1 : 0) + (modes.includes('learn') ? 1 : 0)} drama={data.drama} /> });
    }
    if (modes.includes('on_field') && data.players && data.players.length > 0) {
      cards.push({ key: 'on_field', node: <PlayersCard players={data.players} /> });
    }
    if (modes.includes('learn') && data.lesson) {
      cards.push({ key: 'learn', node: <LessonCard lesson={data.lesson} /> });
    }
  }

  const visibleCard = cards[Math.min(activeIdx, cards.length - 1)];
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const monthDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();

  return (
    <main className="min-h-screen flex flex-col bg-cream-warm" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-3">
        <div className="max-w-md mx-auto flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="font-display italic text-2xl sm:text-[28px] font-bold text-green leading-[1.1]">
              good morning, {displayName.toLowerCase() || 'friend'}.
            </h1>
            <p className="mt-0.5 text-[11px] font-mono tracking-wider uppercase text-tangerine">
              {dayName} · {monthDay}
            </p>
          </div>
          {/* Streak chip */}
          <div className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full" style={{ background: '#1C1108', color: '#FF8B4D' }}>
            <span aria-hidden>☕</span>
            <span className="text-[10px] font-bold tracking-wider" style={{ fontFamily: 'monospace' }}>
              5d STREAK
            </span>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      {mounted && cards.length > 0 && (
        <div className="px-4 sm:px-6 pb-3">
          <div className="max-w-md mx-auto flex justify-center">
            <ModeToggle
              active={modes}
              onChange={(next) => {
                setModes(next);
                setActiveIdx(0);
              }}
              size="sm"
            />
          </div>
        </div>
      )}

      {/* Card stack */}
      <section className="flex-1 px-4 sm:px-6 py-2">
        <div className="max-w-md mx-auto">
          {loading && <CardSkeleton />}
          {!loading && error && (
            <div className="text-center mt-12 text-muted">
              <p className="text-sm">Couldn't brew today's tea. Pull to refresh or try again later.</p>
              <button onClick={() => fetchTea()} className="mt-3 text-tangerine font-semibold hover:underline">
                Try again
              </button>
            </div>
          )}
          {!loading && !error && cards.length === 0 && (
            <div className="text-center mt-12 text-muted">
              <p className="text-sm">No cards visible. Toggle a mode above.</p>
            </div>
          )}
          {!loading && !error && visibleCard && (
            <div>
              {visibleCard.node}
              {/* Page indicator dots */}
              {cards.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  {cards.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      aria-label={`Go to card ${i + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        i === activeIdx ? 'bg-tangerine w-6' : 'bg-[var(--hairline)] w-2'
                      }`}
                    />
                  ))}
                </div>
              )}
              {/* Prev/next */}
              {cards.length > 1 && (
                <div className="flex items-center justify-between mt-3 px-1">
                  <button
                    onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                    disabled={activeIdx === 0}
                    className="text-[12px] text-ink-soft hover:text-ink disabled:opacity-30"
                  >
                    ← previous
                  </button>
                  <button
                    onClick={() => setActiveIdx((i) => Math.min(cards.length - 1, i + 1))}
                    disabled={activeIdx === cards.length - 1}
                    className="text-[12px] text-ink-soft hover:text-ink disabled:opacity-30"
                  >
                    next →
                  </button>
                </div>
              )}
              {data?.fallback && (
                <p className="text-[10px] text-muted text-center mt-4 italic">
                  Showing evergreen tea — set OPENAI_API_KEY for fresh daily content.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <BottomTabsSpacer />
      <BottomTabs />
    </main>
  );
}

/* =================================================================
   Beeper card chrome (reusable)
   ================================================================= */

function BeeperCard({
  page,
  total,
  title,
  children,
  onShare,
}: {
  page: string;
  total: number;
  title: string;
  children: React.ReactNode;
  onShare?: () => void;
}) {
  return (
    <div
      className="relative rounded-[28px] p-3"
      style={{
        background: 'rgba(110, 195, 145, 0.55)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 28px -10px rgba(13,45,36,0.25)',
      }}
    >
      <div
        className="rounded-[16px] p-5 relative"
        style={{
          background: '#1C1108',
          border: '1px solid #0A0604',
          minHeight: 380,
        }}
      >
        {/* Header strip */}
        <div className="flex items-center justify-between mb-4 text-[11px]" style={{ color: '#A85A2C', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF8B4D] animate-pulse" />
            PAGE {page}
          </span>
          {onShare && (
            <button
              onClick={onShare}
              aria-label="Share this card"
              className="w-9 h-9 -m-2 flex items-center justify-center hover:opacity-100 opacity-70 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          )}
        </div>
        {/* Title in LED font */}
        <h2 className="text-2xl sm:text-[26px] font-bold uppercase leading-[0.95] mb-4" style={{ color: '#FF8B4D', fontFamily: 'monospace', letterSpacing: '0.04em', textShadow: '0 0 6px rgba(255,139,77,0.4)' }}>
          {title}
        </h2>
        {/* Body */}
        <div className="text-[15px] leading-[1.55]" style={{ color: '#FF8B4D' }}>
          {children}
        </div>
        {/* Subtle scanlines */}
        <div className="pointer-events-none absolute inset-0 rounded-[16px]" style={{ background: 'repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.18) 2px 3px)', mixBlendMode: 'multiply', opacity: 0.4 }} />
      </div>
    </div>
  );
}

function DramaCard({ drama, idx, total }: { drama: { prompt: string; response: string }; idx: number; total: number }) {
  const sharePayload = `Spotted from Tea'd Up · ${drama.prompt}\n\n${drama.response.slice(0, 200)}…\n\nteadup.app`;
  const onShare = () => {
    if (typeof navigator !== 'undefined' && (navigator as any).share) {
      (navigator as any).share({ title: "Tea'd Up", text: sharePayload }).catch(() => {});
    }
  };
  return (
    <BeeperCard page={`1 of ${total}`} total={total} title="incoming drama" onShare={onShare}>
      <div className="font-bold mb-2" style={{ color: '#FFA56B' }}>{drama.prompt}</div>
      <div>
        <Markdown text={drama.response} />
      </div>
    </BeeperCard>
  );
}

function PlayersCard({ players }: { players: { id: string; name: string; team: string; league: 'nfl' | 'nba'; number: number }[] }) {
  return (
    <BeeperCard page={`2 of 3`} total={3} title="players to know">
      <div className="grid grid-cols-2 gap-2.5 mt-2">
        {players.slice(0, 4).map((p) => (
          <Link
            key={p.id}
            href={`/chat?seed=${encodeURIComponent(`Tell me about ${p.name}.`)}`}
            className="rounded-xl border p-3"
            style={{ borderColor: 'rgba(255,139,77,0.4)', background: 'rgba(255,139,77,0.05)' }}
          >
            <div className="text-2xl font-bold" style={{ color: '#FFA56B', fontFamily: 'monospace' }}>
              #{p.number || '·'}
            </div>
            <div className="font-bold text-[13px] truncate mt-1" style={{ color: '#FF8B4D' }}>
              {p.name}
            </div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: '#A85A2C' }}>
              {p.team.toUpperCase()} · {p.league.toUpperCase()}
            </div>
          </Link>
        ))}
      </div>
    </BeeperCard>
  );
}

function LessonCard({ lesson }: { lesson: { title: string; body: string } }) {
  return (
    <BeeperCard page={`3 of 3`} total={3} title="study hall">
      <div className="font-bold mb-2" style={{ color: '#FFA56B' }}>{lesson.title}</div>
      <div className="whitespace-pre-line"><Markdown text={lesson.body} /></div>
      <Link href="/learn" className="inline-block mt-3 text-[12px] underline" style={{ color: '#FFA56B' }}>
        ▸ open in learn
      </Link>
    </BeeperCard>
  );
}

function CardSkeleton() {
  return (
    <div className="relative rounded-[28px] p-3" style={{ background: 'rgba(110, 195, 145, 0.35)' }}>
      <div className="rounded-[16px] p-5" style={{ background: '#1C1108', minHeight: 380 }}>
        <div className="flex items-center justify-center h-[300px]">
          <span className="inline-block w-8 h-8 rounded-full border-2 border-[#FF8B4D] border-t-transparent animate-spin" />
        </div>
      </div>
    </div>
  );
}
