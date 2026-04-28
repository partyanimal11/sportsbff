'use client';

/**
 * Tea'd Up — Tea tab.
 *
 * Sports tarot deck. 3 daily cards, each a tarot-styled portrait card with
 * a sports archetype (THE DRAMA / THE COURT / THE STUDY). Tap to flip.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomTabs, BottomTabsSpacer } from '@/components/BottomTabs';
import { ModeToggle, type Mode } from '@/components/ModeToggle';
import { TierPill, parseTierPills } from '@/components/TierPill';
import { Markdown } from '@/lib/markdown';
import { getProfile, setProfile } from '@/lib/profile';

type TeaResponse = {
  date: string;
  drama?: { prompt: string; response: string };
  players?: { id: string; name: string; team: string; league: 'nfl' | 'nba'; number: number }[];
  lesson?: { title: string; body: string };
  cached?: boolean;
  fallback?: boolean;
};

export default function TeaPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TeaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modes, setModes] = useState<Mode[]>(['drama', 'on_field', 'learn']);
  const [activeIdx, setActiveIdx] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setMounted(true);
    const p = getProfile();
    if (p.displayName) setDisplayName(p.displayName);
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

  // Build the visible tarot card list based on active modes
  type CardDef = { key: string; archetype: string; numeral: string; title: string; render: () => React.ReactNode };
  const cards: CardDef[] = [];
  if (data) {
    if (modes.includes('drama') && data.drama) {
      cards.push({
        key: 'drama',
        archetype: 'THE TOWER',
        numeral: 'XVI',
        title: data.drama.prompt,
        render: () => <DramaContent drama={data.drama!} />,
      });
    }
    if (modes.includes('on_field') && data.players && data.players.length > 0) {
      cards.push({
        key: 'court',
        archetype: 'THE COURT',
        numeral: 'XX',
        title: 'players to know',
        render: () => <PlayersContent players={data.players!} />,
      });
    }
    if (modes.includes('learn') && data.lesson) {
      cards.push({
        key: 'study',
        archetype: 'THE STUDY',
        numeral: 'V',
        title: data.lesson.title,
        render: () => <LessonContent lesson={data.lesson!} />,
      });
    }
  }

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const monthDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();

  return (
    <main className="min-h-screen flex flex-col" style={{ minHeight: '100dvh', background: '#F5F0E5' }}>
      {/* Header */}
      <div className="px-4 sm:px-6 pt-6 pb-3">
        <div className="max-w-md mx-auto flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="font-display italic text-2xl sm:text-[28px] font-bold text-green leading-[1.1]">
              good morning, {displayName.toLowerCase() || 'friend'}.
            </h1>
            <p className="mt-0.5 text-[11px] font-mono tracking-wider uppercase text-tangerine">
              {dayName} · {monthDay} · today's reading
            </p>
          </div>
          {/* Streak chip */}
          <div className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-[var(--hairline)]">
            <span aria-hidden>☕</span>
            <span className="text-[10px] font-bold tracking-wider text-tangerine" style={{ fontFamily: 'monospace' }}>
              5d STREAK
            </span>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      {mounted && cards.length > 0 && (
        <div className="px-4 sm:px-6 pb-4">
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

      {/* Tarot card stack */}
      <section className="flex-1 px-4 sm:px-6 py-2">
        <div className="max-w-md mx-auto">
          {loading && <CardSkeleton />}
          {!loading && error && (
            <div className="text-center mt-12 text-muted">
              <p className="text-sm">Couldn't shuffle today's deck.</p>
              <button onClick={() => fetchTea()} className="mt-3 text-tangerine font-semibold hover:underline">Try again</button>
            </div>
          )}
          {!loading && !error && cards.length === 0 && (
            <div className="text-center mt-12 text-muted">
              <p className="text-sm">No cards drawn. Toggle a mode above.</p>
            </div>
          )}
          {!loading && !error && cards.length > 0 && (
            <>
              <TarotCard
                key={activeIdx}
                idx={activeIdx + 1}
                total={cards.length}
                archetype={cards[Math.min(activeIdx, cards.length - 1)].archetype}
                numeral={cards[Math.min(activeIdx, cards.length - 1)].numeral}
                title={cards[Math.min(activeIdx, cards.length - 1)].title}
                isFlipped={!!flipped[activeIdx]}
                onFlip={() => setFlipped((f) => ({ ...f, [activeIdx]: !f[activeIdx] }))}
              >
                {cards[Math.min(activeIdx, cards.length - 1)].render()}
              </TarotCard>

              {/* Page indicator dots */}
              {cards.length > 1 && (
                <div className="flex items-center justify-center gap-2 mt-5">
                  {cards.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveIdx(i); setFlipped({}); }}
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
                    onClick={() => { setActiveIdx((i) => Math.max(0, i - 1)); setFlipped({}); }}
                    disabled={activeIdx === 0}
                    className="text-[12px] text-ink-soft hover:text-ink disabled:opacity-30"
                  >
                    ← previous card
                  </button>
                  <button
                    onClick={() => { setActiveIdx((i) => Math.min(cards.length - 1, i + 1)); setFlipped({}); }}
                    disabled={activeIdx === cards.length - 1}
                    className="text-[12px] text-ink-soft hover:text-ink disabled:opacity-30"
                  >
                    next card →
                  </button>
                </div>
              )}

              {data?.fallback && (
                <p className="text-[10px] text-muted text-center mt-4 italic">
                  Showing evergreen deck — set OPENAI_API_KEY for fresh daily readings.
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <BottomTabsSpacer />
      <BottomTabs />
    </main>
  );
}

/* =================================================================
   Tarot card chrome — portrait 2:3, decorative borders, archetype reveal
   ================================================================= */

function TarotCard({
  idx,
  total,
  archetype,
  numeral,
  title,
  isFlipped,
  onFlip,
  children,
}: {
  idx: number;
  total: number;
  archetype: string;
  numeral: string;
  title: string;
  isFlipped: boolean;
  onFlip: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative" style={{ perspective: 1000 }}>
      <div className="text-center text-[10px] font-mono tracking-wider uppercase text-muted mb-2">
        Card {idx} of {total} · {isFlipped ? 'reading' : 'tap to reveal'}
      </div>
      <button
        onClick={onFlip}
        aria-label={isFlipped ? 'Flip card back' : 'Flip card to reveal'}
        className="block w-full text-left"
        style={{
          aspectRatio: '2 / 3',
          maxHeight: '70vh',
        }}
      >
        <div
          className="relative w-full h-full transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front of card — tarot face */}
          <div
            className="absolute inset-0 rounded-[20px] overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              background: '#FAF7EE',
              border: '3px solid #FF6B3D',
              boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 12px 32px -10px rgba(13,45,36,0.18)',
            }}
          >
            {/* Inner ornamental frame */}
            <div className="absolute inset-2 border border-tangerine/30 rounded-[14px] pointer-events-none" />

            {/* Corner stars */}
            <span className="absolute top-3 left-3 text-tangerine text-sm" aria-hidden>✦</span>
            <span className="absolute top-3 right-3 text-tangerine text-sm" aria-hidden>✦</span>
            <span className="absolute bottom-3 left-3 text-tangerine text-sm" aria-hidden>✦</span>
            <span className="absolute bottom-3 right-3 text-tangerine text-sm" aria-hidden>✦</span>

            <div className="relative h-full flex flex-col items-center justify-between p-6 sm:p-7">
              {/* Top: roman numeral + archetype label */}
              <div className="text-center w-full">
                <div className="font-mono text-[11px] tracking-[0.18em] text-tangerine">{numeral}</div>
                <div className="font-display italic text-[10px] tracking-[0.16em] uppercase text-ink-soft mt-1">
                  · {archetype} ·
                </div>
              </div>

              {/* Center: ornamental illustration */}
              <div className="flex flex-col items-center justify-center flex-1 w-full">
                <ArchetypeIcon archetype={archetype} />
                <h2 className="font-display text-[26px] sm:text-[28px] font-bold text-green leading-[1.05] tracking-tight text-center mt-5 px-2">
                  {title}
                </h2>
              </div>

              {/* Bottom: tap hint */}
              <div className="text-center">
                <div className="font-display italic text-[12px] text-ink-soft">tap to reveal</div>
                <div className="font-mono text-[11px] tracking-[0.18em] text-tangerine mt-1.5">{numeral}</div>
              </div>
            </div>
          </div>

          {/* Back of card — content reading */}
          <div
            className="absolute inset-0 rounded-[20px] overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: '#FFFFFF',
              border: '3px solid #FF6B3D',
              boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 12px 32px -10px rgba(13,45,36,0.18)',
            }}
          >
            <div className="absolute inset-2 border border-tangerine/20 rounded-[14px] pointer-events-none" />
            <span className="absolute top-3 left-3 text-tangerine text-sm" aria-hidden>✦</span>
            <span className="absolute top-3 right-3 text-tangerine text-sm" aria-hidden>✦</span>
            <span className="absolute bottom-3 left-3 text-tangerine text-sm" aria-hidden>✦</span>
            <span className="absolute bottom-3 right-3 text-tangerine text-sm" aria-hidden>✦</span>

            <div className="relative h-full flex flex-col p-5 sm:p-6 overflow-hidden">
              <div className="text-center mb-3 shrink-0">
                <div className="font-mono text-[10px] tracking-[0.16em] text-tangerine">{numeral} · {archetype}</div>
              </div>
              <div className="flex-1 overflow-y-auto text-left">
                {children}
              </div>
              <div className="text-center mt-3 shrink-0">
                <div className="text-[10px] font-mono tracking-wider text-muted">tap to flip back</div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

/* =================================================================
   Archetype icons — tarot-style central illustrations
   ================================================================= */

function ArchetypeIcon({ archetype }: { archetype: string }) {
  if (archetype === 'THE TOWER') {
    // Lightning hits a tower
    return (
      <svg viewBox="0 0 100 120" width="80" height="96" aria-hidden>
        <rect x="38" y="40" width="24" height="60" fill="none" stroke="#FF6B3D" strokeWidth="2" />
        <rect x="34" y="34" width="32" height="8" fill="none" stroke="#FF6B3D" strokeWidth="2" />
        <rect x="44" y="50" width="4" height="8" fill="#FF6B3D" />
        <rect x="52" y="50" width="4" height="8" fill="#FF6B3D" />
        <rect x="44" y="66" width="4" height="8" fill="#FF6B3D" />
        <rect x="52" y="66" width="4" height="8" fill="#FF6B3D" />
        <path d="M 50 10 L 42 28 L 50 28 L 38 50" stroke="#FF6B3D" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (archetype === 'THE COURT') {
    // Four figures in a court
    return (
      <svg viewBox="0 0 100 120" width="80" height="96" aria-hidden>
        {/* Four player silhouettes */}
        {[
          { cx: 30, cy: 50 },
          { cx: 70, cy: 50 },
          { cx: 30, cy: 80 },
          { cx: 70, cy: 80 },
        ].map((p, i) => (
          <g key={i}>
            <circle cx={p.cx} cy={p.cy - 5} r="6" fill="none" stroke="#FF6B3D" strokeWidth="2" />
            <path d={`M ${p.cx - 9} ${p.cy + 16} Q ${p.cx} ${p.cy + 4} ${p.cx + 9} ${p.cy + 16}`} fill="none" stroke="#FF6B3D" strokeWidth="2" />
          </g>
        ))}
        {/* Court line */}
        <line x1="20" y1="65" x2="80" y2="65" stroke="#FF6B3D" strokeWidth="0.5" strokeDasharray="2 2" />
      </svg>
    );
  }
  // THE STUDY (or fallback)
  // Open book
  return (
    <svg viewBox="0 0 100 120" width="80" height="96" aria-hidden>
      <path d="M 20 35 L 50 30 L 80 35 L 80 90 L 50 85 L 20 90 Z" fill="none" stroke="#FF6B3D" strokeWidth="2" strokeLinejoin="round" />
      <line x1="50" y1="30" x2="50" y2="85" stroke="#FF6B3D" strokeWidth="2" />
      <line x1="28" y1="48" x2="44" y2="46" stroke="#FF6B3D" strokeWidth="1" />
      <line x1="28" y1="55" x2="44" y2="53" stroke="#FF6B3D" strokeWidth="1" />
      <line x1="28" y1="62" x2="44" y2="60" stroke="#FF6B3D" strokeWidth="1" />
      <line x1="56" y1="46" x2="72" y2="48" stroke="#FF6B3D" strokeWidth="1" />
      <line x1="56" y1="53" x2="72" y2="55" stroke="#FF6B3D" strokeWidth="1" />
      <line x1="56" y1="60" x2="72" y2="62" stroke="#FF6B3D" strokeWidth="1" />
    </svg>
  );
}

/* =================================================================
   Card content variants
   ================================================================= */

function DramaContent({ drama }: { drama: { prompt: string; response: string } }) {
  return (
    <div className="text-[14px] text-ink leading-[1.6]">
      <Markdown text={drama.response} />
      <div className="mt-3 pt-3 border-t border-[var(--hairline)]">
        <Link href={`/chat?seed=${encodeURIComponent(drama.prompt)}`} className="inline-block text-[12px] text-tangerine font-semibold hover:underline">
          ▸ open in chat
        </Link>
      </div>
    </div>
  );
}

function PlayersContent({ players }: { players: { id: string; name: string; team: string; league: 'nfl' | 'nba'; number: number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-1">
      {players.slice(0, 4).map((p) => (
        <Link
          key={p.id}
          href={`/chat?seed=${encodeURIComponent(`Tell me about ${p.name}.`)}`}
          className="rounded-xl border border-tangerine/30 p-2.5 bg-tangerine/5 hover:bg-tangerine/10 transition"
        >
          <div className="font-display font-bold text-[20px] text-tangerine">#{p.number || '·'}</div>
          <div className="font-display font-bold text-[12px] text-green truncate">{p.name}</div>
          <div className="text-[9px] uppercase tracking-wider text-muted">{p.team.toUpperCase()} · {p.league.toUpperCase()}</div>
        </Link>
      ))}
    </div>
  );
}

function LessonContent({ lesson }: { lesson: { title: string; body: string } }) {
  return (
    <div className="text-[13.5px] text-ink leading-[1.65] whitespace-pre-line">
      <Markdown text={lesson.body} />
      <div className="mt-3 pt-3 border-t border-[var(--hairline)]">
        <Link href="/learn" className="inline-block text-[12px] text-tangerine font-semibold hover:underline">
          ▸ open in learn
        </Link>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="relative w-full" style={{ aspectRatio: '2 / 3', maxHeight: '70vh' }}>
      <div className="absolute inset-0 rounded-[20px] border-2 border-[var(--hairline)] flex items-center justify-center" style={{ background: '#FAF7EE' }}>
        <span className="inline-block w-8 h-8 rounded-full border-2 border-tangerine border-t-transparent animate-spin" />
      </div>
    </div>
  );
}
