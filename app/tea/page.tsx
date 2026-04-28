'use client';

/**
 * Tea'd Up — Tea tab.
 *
 * Real-time live feed of sports tea. Chronological, timestamped, tier-pilled.
 * Like Bleacher Report or a sports-focused Twitter feed but every entry has
 * a confirmation tier and a deep-link to chat.
 *
 * Premium white background. No tarot — just the tea, fresh and timestamped.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomTabs, BottomTabsSpacer } from '@/components/BottomTabs';
import { TeaUpToggle } from '@/components/TeaUpToggle';
import { TierPill, type Tier } from '@/components/TierPill';
import { getProfile, setProfile } from '@/lib/profile';

type TodayResponse = {
  date: string;
  drama?: { prompt: string; response: string };
  players?: { id: string; name: string; team: string; league: 'nfl' | 'nba'; number: number }[];
  lesson?: { title: string; body: string };
  cached?: boolean;
  fallback?: boolean;
};

type FeedItem = {
  id: string;
  time: string;        // "32 min ago"
  league: 'NFL' | 'NBA';
  tier: Tier;
  headline: string;
  summary: string;
  source: string;
  category: 'drama' | 'on_field' | 'learn';
  seedPrompt?: string; // pre-fills chat when tapped
};

export default function TeaPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teadUp, setTeadUp] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const p = getProfile();
    if (p.displayName) setDisplayName(p.displayName);
    setTeadUp(!!p.teadUpEnabled);
    fetchTea(p);
  }, []);

  function toggleTeadUp() {
    const next = !teadUp;
    setTeadUp(next);
    setProfile({ teadUpEnabled: next });
  }

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
      const json = (await res.json()) as TodayResponse;
      setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    await fetchTea();
    setRefreshing(false);
  }

  // When Tea'd Up is ON, show drama-heavy feed. When OFF, just on-field + learn.
  const activeCategories: ('drama' | 'on_field' | 'learn')[] = teadUp
    ? ['drama', 'on_field', 'learn']
    : ['on_field', 'learn'];
  const feed: FeedItem[] = buildFeed(data, activeCategories);

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const monthDay = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase();

  return (
    <main className="min-h-screen flex flex-col bg-white" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 border-b border-[var(--hairline)] sticky top-0 z-20 bg-white/95 backdrop-blur">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between gap-3 mb-3">
            <Link href="/" className="font-display text-base sm:text-lg font-extrabold text-green tracking-wide uppercase shrink-0">
              SPORTS<span className="text-tangerine">★</span>BFF
            </Link>
          </div>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="font-display italic text-[26px] font-bold text-green leading-[1.1]">
                today{displayName ? `, ${displayName.toLowerCase()}.` : '.'}
              </h1>
              <div className="mt-1 text-[10px] font-mono tracking-wider uppercase text-tangerine flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
                {dayName} · {monthDay} · live
              </div>
            </div>
            <button
              onClick={refresh}
              disabled={refreshing || loading}
              aria-label="Refresh feed"
              className="shrink-0 w-10 h-10 rounded-full border border-[var(--hairline)] flex items-center justify-center text-ink-soft hover:bg-cream-warm transition disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={refreshing ? 'animate-spin' : ''} aria-hidden>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>

          {mounted && (
            <div className="flex justify-center">
              <TeaUpToggle enabled={teadUp} onToggle={toggleTeadUp} size="sm" />
            </div>
          )}
        </div>
      </header>

      {/* Feed */}
      <section className="flex-1 px-4 sm:px-6">
        <div className="max-w-md mx-auto">
          {loading && <FeedSkeleton />}
          {!loading && error && (
            <div className="text-center mt-12 text-muted">
              <p className="text-sm">Couldn't pour today's tea.</p>
              <button onClick={refresh} className="mt-3 text-tangerine font-semibold hover:underline">Try again</button>
            </div>
          )}
          {!loading && !error && feed.length === 0 && (
            <div className="text-center mt-12 text-muted">
              <p className="text-sm">No drops match the current filter. Toggle a mode above.</p>
            </div>
          )}
          {!loading && !error && feed.length > 0 && (
            <ul className="divide-y divide-[var(--hairline)]">
              {feed.map((it) => (
                <FeedRow key={it.id} item={it} />
              ))}
            </ul>
          )}
          {data?.fallback && (
            <p className="text-[10px] text-muted text-center mt-6 italic mb-2">
              Showing evergreen drops — set OPENAI_API_KEY for fresh hourly tea.
            </p>
          )}
        </div>
      </section>

      <BottomTabsSpacer />
      <BottomTabs />
    </main>
  );
}

/* =================================================================
   Build the feed from /api/today data + bundled evergreen items
   ================================================================= */

function buildFeed(data: TodayResponse | null, activeModes: ('drama' | 'on_field' | 'learn')[]): FeedItem[] {
  const items: FeedItem[] = [];

  // Evergreen items — always present (give the feed real depth even on first load)
  const evergreen: FeedItem[] = [
    {
      id: 'embiid-trade',
      time: '32 min ago',
      league: 'NBA',
      tier: 'reported',
      category: 'drama',
      headline: 'Embiid trade chatter, again',
      summary: 'The Athletic: Sixers and three teams have had "exploratory conversations" about a package centered on Embiid. Front office denies on the record.',
      source: 'The Athletic · 32m',
      seedPrompt: "What's the latest on Joel Embiid trade rumors?",
    },
    {
      id: 'mahomes-three-peat',
      time: '1 hr ago',
      league: 'NFL',
      tier: 'confirmed',
      category: 'on_field',
      headline: 'Mahomes on the three-peat: "we want it"',
      summary: "Postgame presser. He's said it before, he said it louder tonight. Reid grinned in the back. Only the 1965-67 Packers have done it.",
      source: 'NFL Network · 1h',
      seedPrompt: "Tell me about the Chiefs' three-peat hunt.",
    },
    {
      id: 'kd-burner',
      time: '2 hr ago',
      league: 'NBA',
      tier: 'speculation',
      category: 'drama',
      headline: 'KD reply guy spotted, again?',
      summary: "@gethigher77 quote-tweeted a Wemby highlight at 2:14 AM. The account is, allegedly, KD's. Allegedly.",
      source: 'Twitter · 2h',
      seedPrompt: "What's the deal with KD's burner accounts?",
    },
    {
      id: 'belichick-bills',
      time: '4 hr ago',
      league: 'NFL',
      tier: 'rumor',
      category: 'drama',
      headline: 'Belichick + Bills coordinator role?',
      summary: 'Twitter rumor mill churning. No outlet has touched it. Filed under: probably not, but stay tuned.',
      source: 'Reddit · 4h',
      seedPrompt: 'Where does Bill Belichick coach next?',
    },
    {
      id: 'sga-mvp',
      time: '5 hr ago',
      league: 'NBA',
      tier: 'reported',
      category: 'on_field',
      headline: "SGA on track for back-to-back MVP",
      summary: "ESPN's MVP straw poll has Shai #1 by a wide margin. The Thunder are running away with the West.",
      source: 'ESPN · 5h',
      seedPrompt: "Why is SGA the favorite for MVP?",
    },
    {
      id: 'salary-cap-explainer',
      time: '7 hr ago',
      league: 'NBA',
      tier: 'confirmed',
      category: 'learn',
      headline: 'The "second apron" — why your team can\'t keep their squad',
      summary: 'Quick primer on how the new NBA CBA second apron is breaking up the Celtics, Warriors, and Bucks. Punitive enough that no team wants to live there.',
      source: 'Tea\'d Up · 7h',
      seedPrompt: "Explain the NBA's second apron.",
    },
    {
      id: 'kelce-swift',
      time: '9 hr ago',
      league: 'NFL',
      tier: 'confirmed',
      category: 'drama',
      headline: 'Travis & Taylor at the Met Gala — confirmed via paparazzi',
      summary: "Multiple outlets confirmed both attending the same after-party. They've been together since summer 2023. Public, casual, unbothered.",
      source: 'Page Six · 9h',
      seedPrompt: "What's the Travis Kelce + Taylor Swift timeline?",
    },
  ];

  // Promote /api/today drama as a fresh top item if available
  if (data?.drama) {
    items.push({
      id: 'today-drama',
      time: 'just now',
      league: 'NBA',
      tier: 'reported',
      category: 'drama',
      headline: data.drama.prompt,
      summary: data.drama.response.slice(0, 200) + (data.drama.response.length > 200 ? '...' : ''),
      source: "Tea'd Up · just now",
      seedPrompt: data.drama.prompt,
    });
  }
  if (data?.lesson) {
    items.push({
      id: 'today-lesson',
      time: 'today',
      league: 'NBA',
      tier: 'confirmed',
      category: 'learn',
      headline: data.lesson.title,
      summary: data.lesson.body.slice(0, 200) + (data.lesson.body.length > 200 ? '...' : ''),
      source: "Tea'd Up · today",
      seedPrompt: `Tell me more about: ${data.lesson.title}`,
    });
  }

  items.push(...evergreen);

  // Filter by active modes
  return items.filter((it) => activeModes.includes(it.category));
}

/* =================================================================
   Feed row — minimal, scannable, tappable
   ================================================================= */

function FeedRow({ item }: { item: FeedItem }) {
  const href = item.seedPrompt
    ? `/chat?seed=${encodeURIComponent(item.seedPrompt)}`
    : '/chat';

  return (
    <li>
      <Link href={href} className="block py-4 hover:bg-cream-warm/40 -mx-2 px-2 rounded-lg transition">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <LeagueBadge league={item.league} />
          <TierPill tier={item.tier} />
          <span className="text-[10px] text-muted ml-auto font-mono">{item.time}</span>
        </div>
        <h3 className="font-display font-bold text-[16px] text-green leading-[1.25]">{item.headline}</h3>
        <p className="mt-1 text-[13.5px] text-ink-soft leading-relaxed">{item.summary}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted italic">{item.source}</span>
          <span className="text-[11px] text-tangerine font-semibold">open in chat →</span>
        </div>
      </Link>
    </li>
  );
}

function LeagueBadge({ league }: { league: 'NFL' | 'NBA' }) {
  return (
    <span
      className="inline-block px-1.5 py-px rounded text-[8px] font-bold tracking-widest uppercase"
      style={{
        background: league === 'NBA' ? '#E6F1FB' : '#FCE4EC',
        color: league === 'NBA' ? '#185FA5' : '#9C2454',
      }}
    >
      {league}
    </span>
  );
}

function FeedSkeleton() {
  return (
    <div className="divide-y divide-[var(--hairline)]">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-10 h-3 rounded bg-cream-warm animate-pulse" />
            <span className="w-16 h-3 rounded bg-cream-warm animate-pulse" />
          </div>
          <div className="w-3/4 h-4 rounded bg-cream-warm animate-pulse mb-2" />
          <div className="w-full h-3 rounded bg-cream-warm animate-pulse mb-1" />
          <div className="w-5/6 h-3 rounded bg-cream-warm animate-pulse" />
        </div>
      ))}
    </div>
  );
}
