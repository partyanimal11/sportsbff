'use client';

/**
 * sportsBFF — landing page (premium redesign).
 *
 * Mobile-first hero with phone mockup ABOVE the fold. Premium white
 * throughout. Multi-device mockups in every scene. Generous spacing.
 * Trust signals row. App Store-style final CTA.
 *
 * Tea'd Up demoed live in the hero — flip the toggle, watch the mockup
 * pivot from clean info to gossip. Every other surface stays neutral.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isOnboarded } from '@/lib/profile';
import { TeaUpToggle } from '@/components/TeaUpToggle';
import { STARTER_PROMPTS } from '@/lib/prompts';

export default function Root() {
  const router = useRouter();
  useEffect(() => {
    if (isOnboarded()) router.replace('/scan');
  }, [router]);

  return (
    <main className="bg-white" style={{ minHeight: '100dvh' }}>
      <Nav />
      <Hero />
      <TrustStrip />
      <ScanScene />
      <BFFScene />
      <TodayScene />
      <LearnScene />
      <FinalCTA />
      <Footer />
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   NAV — minimal, sticky, premium
   ──────────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-[var(--hairline)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="font-display text-base sm:text-[17px] font-extrabold text-green tracking-wide uppercase shrink-0">
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-[13px] text-ink-soft">
          <Link href="/scan" className="hover:text-ink transition">Scan</Link>
          <Link href="/chat" className="hover:text-ink transition">Chat</Link>
          <Link href="/tea" className="hover:text-ink transition">Today</Link>
          <Link href="/learn" className="hover:text-ink transition">Learn</Link>
        </nav>
        <Link
          href="/onboarding"
          className="inline-flex items-center bg-tangerine text-white font-semibold rounded-full px-3.5 sm:px-5 py-2 sm:py-2.5 text-[12px] sm:text-[13px] hover:bg-tangerine-dark transition shadow-[0_4px_16px_-4px_rgba(255,107,61,0.4)]"
        >
          <span className="hidden sm:inline">Get started →</span>
          <span className="sm:hidden">Start →</span>
        </Link>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────────────────
   HERO — mobile-first: phone mockup ABOVE fold
   ──────────────────────────────────────────────────────────────── */

function Hero() {
  const [demoTeaUp, setDemoTeaUp] = useState(true);

  return (
    <section className="relative overflow-hidden bg-white">
      {/* Soft ambient washes — premium, not loud */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-tangerine/[0.04] blur-[120px]" />
        <div className="absolute top-32 -right-32 w-[440px] h-[440px] rounded-full bg-magenta/[0.04] blur-[120px]" />
      </div>

      {/* Mobile order: badge → headline → subhead → body → CTAs → phone mockup → script
          Desktop: copy on left, mockup on right (side-by-side) */}
      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 pb-16 sm:pt-14 sm:pb-24">
        <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-10 md:gap-14 items-center">
          {/* COPY — first everywhere */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[var(--hairline)] text-[11px] text-ink-soft mb-5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
              Closed beta · iOS + web · Spring 2026
            </div>

            <h1 className="font-display text-[48px] sm:text-[60px] md:text-[72px] font-bold text-green leading-[0.95] tracking-tight">
              Learn the players.
              <br />
              <span className="italic font-medium text-tangerine">Get the tea.</span>
            </h1>

            <p className="mt-4 font-display italic text-[24px] sm:text-[26px] font-medium text-green leading-tight">
              Your Sports BFF.
            </p>

            <p className="mt-5 text-[16px] sm:text-[17px] text-ink-soft leading-relaxed max-w-md">
              Scan any TV or image to learn <strong className="text-ink">the players, the rules, and the storylines.</strong> Flip Tea'd Up on for the gossip.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 items-center">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 bg-tangerine text-white font-semibold rounded-full px-6 py-3 text-[14.5px] hover:bg-tangerine-dark transition shadow-[0_8px_22px_-10px_rgba(255,107,61,0.55)]"
              >
                Get started — free →
              </Link>
              <Link
                href="/scan"
                className="inline-flex items-center gap-2 bg-white text-green font-semibold rounded-full px-6 py-3 text-[14.5px] border border-[var(--hairline)] hover:border-tangerine hover:text-tangerine transition"
              >
                Try the scan →
              </Link>
            </div>

            <div className="mt-6 font-script text-magenta text-[20px] sm:text-[22px] rotate-[-1.5deg] inline-block">
              — sports for the rest of us.
            </div>
          </div>

          {/* PHONE MOCKUP — second on mobile, second on desktop */}
          <div className="relative mt-4 md:mt-0">
            {/* Toggle demo — sits ABOVE the mockup on mobile (no overlap), top-right on desktop */}
            <div className="flex md:absolute md:-top-1 md:right-0 md:z-10 items-center md:items-end justify-center md:flex-col gap-2 md:gap-1.5 mb-4 md:mb-0">
              <span className="text-[10px] font-mono tracking-wider uppercase text-muted">
                tap to flip the vibe <span className="hidden md:inline">↓</span><span className="md:hidden">→</span>
              </span>
              <TeaUpToggle enabled={demoTeaUp} onToggle={() => setDemoTeaUp((v) => !v)} />
            </div>
            <ScanResultMockup teadUp={demoTeaUp} />
            <div className="font-script text-magenta text-[14px] sm:text-[15px] rotate-[-2deg] text-center mt-3">
              scan any player → get the {demoTeaUp ? 'tea' : 'breakdown'} ✏
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScanResultMockup({ teadUp }: { teadUp: boolean }) {
  return (
    <div className="relative max-w-[280px] sm:max-w-[340px] mx-auto">
      {/* Multi-layer ambient glow for depth */}
      <div className="absolute -inset-12 bg-gradient-to-br from-tangerine/[0.18] via-magenta/[0.12] to-lemon/[0.15] blur-3xl rounded-[60px] -z-10" />
      <div className="absolute -inset-2 bg-gradient-to-br from-white/40 to-white/0 blur-xl rounded-[44px] -z-10" />

      {/* Background secondary device — peek of another screen behind */}
      <div className="absolute -right-6 sm:-right-10 top-12 w-[60%] aspect-[9/16] rounded-[28px] bg-cream-warm/40 -z-10 hidden sm:block" />

      <div
        className="relative rounded-[36px] overflow-hidden bg-white"
        style={{
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.9) inset, ' +
            '0 0 0 1px rgba(13,45,36,0.06), ' +
            '0 24px 48px -16px rgba(13,45,36,0.18), ' +
            '0 56px 80px -32px rgba(13,45,36,0.22)',
        }}
      >
        <div className="px-5 pt-4 pb-2 flex items-center justify-between text-[10px] text-muted-soft font-mono tracking-wider">
          <span>9:41</span>
          <span className="font-bold tracking-widest text-tangerine">● SCAN MODE</span>
          <span>●●●●</span>
        </div>

        <div
          className="relative"
          style={{
            background: 'linear-gradient(135deg, #006BB6 0%, #006BB6 50%, #ED174C 200%)',
          }}
        >
          <div className="absolute inset-0 opacity-15" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 60px, rgba(255,255,255,0.4) 60px 61px)' }} />
          <div className="relative p-5 pt-4 flex items-end justify-between gap-3 min-h-[124px]">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/85 mb-1.5">
                Center · Philadelphia · #21
              </div>
              <div className="font-display font-bold text-white leading-[0.92] tracking-tight" style={{ fontSize: 'clamp(26px, 5.5vw, 34px)' }}>
                Joel Embiid
              </div>
              <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider text-white" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                PHI 102 · MIA 98 · 4Q 2:14
              </div>
            </div>
            <div
              className="shrink-0 rounded-full text-white font-display font-extrabold text-xl flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                background: '#ED174C',
                boxShadow: '0 0 0 3px rgba(255,255,255,0.18) inset, 0 8px 22px -6px rgba(0,0,0,0.4)',
              }}
            >
              21
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          {teadUp ? (
            <>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] uppercase text-magenta mb-3">
                <span aria-hidden>🔥</span> Drama
              </div>
              <div className="bg-white rounded-2xl p-4 border border-[var(--hairline)] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,_0_4px_12px_-6px_rgba(13,45,36,0.08)]">
                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ background: '#FAEEDA', color: '#854F0B' }}>
                  Speculation
                </span>
                <h3 className="font-display font-bold text-[16px] text-green leading-tight">Did he ask out?</h3>
                <p className="mt-1 text-[13px] text-ink leading-relaxed">
                  Locker-room sources hint Embiid considered a trade in March. Sixers brass denied on the record.
                </p>
                <div className="mt-2 text-[11px] text-tangerine font-semibold">▾ See sources (1)</div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">
                <span aria-hidden>🏀</span> The story
              </div>
              <div className="bg-white rounded-2xl p-4 border border-[var(--hairline)] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,_0_4px_12px_-6px_rgba(13,45,36,0.08)]">
                <h3 className="font-display font-bold text-[16px] text-green leading-tight">"Best center alive" debate</h3>
                <p className="mt-1 text-[13px] text-ink leading-relaxed">
                  2023 MVP. 7'0, 280, post-up game from another era. The injury history is the asterisk on every conversation.
                </p>
                <div className="mt-2 text-[11px] text-tangerine font-semibold">▾ Why it matters</div>
              </div>
            </>
          )}
        </div>

        <div className="px-4 pb-4 flex items-center gap-2">
          <button className="flex-1 inline-flex items-center justify-center gap-1.5 bg-cream-warm rounded-xl py-2.5 text-[11px] font-semibold text-ink border border-[var(--hairline)]">
            💬 Ask follow-up
          </button>
          <button className="inline-flex items-center justify-center w-10 h-10 bg-cream-warm rounded-xl border border-[var(--hairline)] text-ink-soft" aria-label="Save">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button className="inline-flex items-center justify-center w-10 h-10 bg-cream-warm rounded-xl border border-[var(--hairline)] text-ink-soft" aria-label="Share">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   TRUST STRIP — credibility row right below hero
   ──────────────────────────────────────────────────────────────── */

function TrustStrip() {
  return (
    <section className="px-4 sm:px-8 py-8 sm:py-10 border-y border-[var(--hairline)] bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
          {[
            { num: '200+', label: 'Players' },
            { num: '85', label: 'Storylines' },
            { num: '4', label: 'Confirmation tiers' },
            { num: '0', label: 'Invented gossip' },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display text-[26px] sm:text-[32px] font-bold text-green leading-none">{s.num}</div>
              <div className="text-[10px] sm:text-[11px] text-muted uppercase tracking-[0.16em] mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCAN SCENE — dual phone mockup (idle viewfinder + result card)
   ──────────────────────────────────────────────────────────────── */

function ScanScene() {
  return (
    <section
      className="relative px-4 sm:px-8 py-20 sm:py-28 border-t border-[var(--hairline)] overflow-hidden"
      style={{ background: '#FAF8F4' }}
    >
      {/* Warm off-white base + barely-there tangerine wash */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-tangerine/[0.04] blur-[140px]" />
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-tangerine mb-5">
            ① Scan
          </div>
          <h2 className="font-display text-[32px] sm:text-[44px] md:text-[52px] font-bold text-green leading-[1.04] tracking-tight">
            Point your camera at any TV, scan a screenshot, snap a poster — works on all things sports.
          </h2>
          <p className="mt-5 font-display italic text-[22px] sm:text-[26px] md:text-[30px] font-medium text-tangerine leading-tight tracking-tight">
            Every player decoded in seconds.
          </p>
        </div>

        {/* Dual mockup — viewfinder → result */}
        <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-6 sm:gap-8 items-center max-w-4xl mx-auto">
          <ScanIdleMockup />
          <div className="hidden sm:flex items-center justify-center text-tangerine text-2xl">→</div>
          <div className="sm:hidden flex items-center justify-center text-tangerine text-2xl">↓</div>
          <ScanResultThumbnail />
        </div>

        {/* Tier pills */}
        <div className="mt-14 sm:mt-16 max-w-2xl mx-auto">
          <p className="text-center text-[11px] font-bold tracking-[0.22em] uppercase text-muted mb-4">
            Every drama claim ships with a tier
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#E8F0EC', color: '#0F6E56' }}>✓ Confirmed</span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#E6F1FB', color: '#185FA5' }}>📰 Reported</span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#FAEEDA', color: '#854F0B' }}>💭 Speculation</span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#F1EFE8', color: '#5F5E5A' }}>❓ Rumor</span>
          </div>
          <p className="mt-4 text-center text-[13px] text-ink-soft italic">
            Sourced. Hedged. <strong className="not-italic text-tangerine">Never guessed.</strong>
          </p>
        </div>

        <div className="mt-12 text-center">
          <Link href="/scan" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-tangerine hover:underline">
            Try the scan now →
          </Link>
        </div>
      </div>
    </section>
  );
}

function ScanIdleMockup() {
  return (
    <div className="relative">
      <div
        className="rounded-[28px] overflow-hidden bg-white p-6 sm:p-7 max-w-[260px] sm:max-w-[280px] mx-auto"
        style={{
          boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 0 0 1px rgba(13,45,36,0.06), 0 16px 32px -12px rgba(13,45,36,0.14)',
        }}
      >
        <div className="text-[9px] font-bold tracking-widest uppercase text-tangerine flex items-center gap-1.5 justify-center mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
          READY TO SCAN
        </div>
        <div className="aspect-square relative rounded-2xl border border-[var(--hairline)] bg-cream-warm/30 overflow-hidden">
          <div className="absolute top-2 left-2 w-4 h-4 border-t-[2.5px] border-l-[2.5px] border-tangerine" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-[2.5px] border-r-[2.5px] border-tangerine" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-[2.5px] border-l-[2.5px] border-tangerine" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-[2.5px] border-r-[2.5px] border-tangerine" />
          {/* Scan line */}
          <div className="absolute left-2 right-2 h-0.5 bg-tangerine shadow-[0_0_10px_rgba(255,107,61,0.7)]" style={{ animation: 'scanLineMockup 1.8s ease-in-out infinite' }} />
          {/* Center logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" width="56" height="56" aria-hidden>
              <path d="M 26 30 Q 26 70 38 80 L 56 80 Q 68 70 68 30 Z" fill="#0D2D24" />
              <ellipse cx="48" cy="83" rx="20" ry="2.5" fill="#0D2D24" />
              <path d="M 68 38 Q 80 42 80 56 Q 80 66 68 70" stroke="#0D2D24" strokeWidth="3" fill="none" />
              <path d="M 38 30 Q 47 55 38 80" stroke="#FF6B3D" strokeWidth="2" fill="none" />
              <path d="M 56 30 Q 47 55 56 80" stroke="#FF6B3D" strokeWidth="2" fill="none" />
              <path d="M 26 50 Q 47 55 68 50" stroke="#FF6B3D" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="font-display font-bold text-[16px] text-green leading-tight">Scan a player.</div>
          <div className="text-[12px] text-ink-soft mt-1 italic">Get the tea.</div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scanLineMockup {
          0% { top: 8px; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: calc(100% - 10px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ScanResultThumbnail() {
  return (
    <div className="relative">
      <div
        className="rounded-[28px] overflow-hidden bg-white max-w-[260px] sm:max-w-[280px] mx-auto"
        style={{
          boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 0 0 1px rgba(13,45,36,0.06), 0 16px 32px -12px rgba(13,45,36,0.14)',
        }}
      >
        <div
          className="relative h-32"
          style={{ background: 'linear-gradient(135deg, #007AC1 0%, #007AC1 50%, #EF3B24 200%)' }}
        >
          <div className="absolute inset-0 opacity-15" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 50px, rgba(255,255,255,0.4) 50px 51px)' }} />
          <div className="relative p-4 flex items-end justify-between h-full">
            <div>
              <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-white/85 mb-1">Guard · OKC · #2</div>
              <div className="font-display font-bold text-white text-[20px] leading-tight">SGA</div>
            </div>
            <div
              className="rounded-full text-white font-display font-extrabold text-base flex items-center justify-center"
              style={{
                width: 40, height: 40,
                background: '#EF3B24',
                boxShadow: '0 0 0 2px rgba(255,255,255,0.2) inset',
              }}
            >
              2
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-tangerine mb-2">🏀 The story</div>
          <div className="bg-cream-warm/50 rounded-xl p-3 border border-[var(--hairline)]">
            <span className="inline-block px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wider mb-1" style={{ background: '#E6F1FB', color: '#185FA5' }}>Reported</span>
            <h3 className="font-display font-bold text-[13px] text-green leading-tight">Back-to-back MVP track</h3>
            <p className="mt-0.5 text-[11px] text-ink leading-relaxed">
              Reigning MVP. ESPN straw poll has him #1 again.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   BFF SCENE — chat with multi-message preview
   ──────────────────────────────────────────────────────────────── */

function BFFScene() {
  return (
    <section
      className="relative px-4 sm:px-8 py-20 sm:py-28 border-t border-[var(--hairline)]"
      style={{ background: '#F8F4ED' }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Headline ABOVE the chat window — stacked layout */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-green mb-4">② Chat</div>
          <h2 className="font-display text-[42px] sm:text-[60px] font-bold text-green leading-[0.96] tracking-tight">
            Ask anything. <span className="italic">No judgment.</span>
          </h2>
          <p className="mt-5 text-[16px] sm:text-[18px] text-ink-soft leading-relaxed max-w-lg mx-auto">
            Tap any of the 100+ pre-loaded prompts to start — beginner rules, juicy drama, or anything you've been too afraid to ask. Your BFF doesn't gatekeep.
          </p>
        </div>

        {/* Functional chat — clickable prompts, drop → type → reveal */}
        <BFFLiveChatMockup />

        <p className="mt-8 text-center text-[13px] text-ink-soft italic">
          Voice mode reads it aloud. Tea'd Up adds the gossip. <span className="text-green font-semibold not-italic">Never invents.</span>
        </p>

        <div className="mt-6 text-center">
          <Link href="/chat" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-green hover:underline">
            Open the full chat →
          </Link>
        </div>
      </div>
    </section>
  );
}

// Hand-written fake responses — landing page demos without burning the API budget.
// Voice matches /api/chat: lowercase, casual, occasional emoji, never condescending.
const BFF_DEMO_RESPONSES: Record<string, string> = {
  "What's a sack?":
    "when a defender tackles the QB behind the line of scrimmage *while he still has the ball*. costs the offense yards + a down. the all-time leaders get their own stat line — bruce smith has 200. they make tiktoks of their celebrations now ☕",
  "Why is everyone saying KD is Gossip Girl?":
    "burner accounts. KD got caught running anonymous twitter alts (@gethigher77 was the famous one) to defend himself in NBA arguments. same energy as dan humphrey writing about the upper east side from the outside while *being* the upper east side. spotted: a forward with too much time 👀",
  "How does the salary cap work?":
    "every team gets the same money pool to spend on players (~$255M in the NBA this season, ~$255M in the NFL — wild coincidence). go over → penalties, lost picks, taxes that snowball if you keep doing it. it's the league's way of forcing parity. without it, the lakers would just buy everyone.",
  "What's the trade deadline?":
    "the cutoff date when teams can swap players. after it passes → rosters are locked for the rest of the regular season. NBA: usually early february. NFL: late october. the 24 hours before are *unhinged* — front offices speed-run blockbuster trades while we all refresh twitter 📱",
  "How does fantasy football work?":
    "you draft real NFL players to a pretend team. each week, your players' real stats = your fantasy points. highest score in your league wins the matchup. win enough → playoffs → ring (no actual ring). it's why your friends suddenly care about the jaguars in october.",
  "Who is Travis Kelce?":
    "tight end for the kansas city chiefs. best at his position for a decade running. 3x super bowl champ. co-hosts *new heights* podcast with his brother jason (also famous, also retired). currently dating taylor swift, which single-handedly broke the NFL's viewership records. somehow beloved by everyone, even rival fans 💛",
};

type BFFMessage = { id: number; role: 'user' | 'bff'; content: string };

function BFFLiveChatMockup() {
  const livePrompts = STARTER_PROMPTS.slice(0, 6);
  const [thread, setThread] = useState<BFFMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [usedPrompts, setUsedPrompts] = useState<Set<string>>(new Set());
  const nextId = useRef(1);

  function handlePrompt(prompt: string) {
    if (isTyping) return;
    const answer = BFF_DEMO_RESPONSES[prompt] ?? "let me think about that one...";
    const userMsg: BFFMessage = { id: nextId.current++, role: 'user', content: prompt };
    setThread((prev) => [...prev, userMsg]);
    setUsedPrompts((prev) => new Set(prev).add(prompt));
    setIsTyping(true);
    setStreamingText('');

    // Pause for "typing dots" feel, then stream characters in
    const TYPING_DELAY = 700;
    const CHAR_INTERVAL = 18; // ms per character group
    const CHARS_PER_TICK = 2;

    setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        i += CHARS_PER_TICK;
        if (i >= answer.length) {
          clearInterval(interval);
          setStreamingText('');
          setThread((prev) => [...prev, { id: nextId.current++, role: 'bff', content: answer }]);
          setIsTyping(false);
        } else {
          setStreamingText(answer.slice(0, i));
        }
      }, CHAR_INTERVAL);
    }, TYPING_DELAY);
  }

  function reset() {
    setThread([]);
    setStreamingText('');
    setIsTyping(false);
    setUsedPrompts(new Set());
  }

  const hasContent = thread.length > 0 || isTyping;

  return (
    <div className="relative max-w-md mx-auto w-full">
      {/* Soft green-tinted glow — matches section's BFF mood */}
      <div className="absolute -inset-6 bg-gradient-to-br from-green/[0.06] via-cream-warm/[0.4] to-transparent blur-2xl rounded-[60px] -z-10" />

      <div
        className="bg-white rounded-3xl border border-[var(--hairline)] overflow-hidden flex flex-col"
        style={{
          boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 24px 48px -16px rgba(13,45,36,0.18)',
        }}
      >
        {/* Header — like an iMessage chat with a contact */}
        <div className="px-5 py-3.5 border-b border-[var(--hairline)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green flex items-center justify-center text-white font-display font-bold text-[11px]">
              B
            </div>
            <div className="leading-tight">
              <div className="text-[12px] font-semibold text-green">sportsBFF</div>
              <div className="text-[10px] text-muted font-mono">{isTyping ? 'typing…' : 'online'}</div>
            </div>
          </div>
          {hasContent && (
            <button
              onClick={reset}
              className="text-[11px] text-muted hover:text-green font-mono tracking-wider transition"
            >
              ↻ reset
            </button>
          )}
        </div>

        {/* Thread area — fixed min height so the box doesn't jump */}
        <div className="flex-1 px-5 py-4 flex flex-col gap-2.5 min-h-[280px] max-h-[420px] overflow-y-auto">
          {/* Empty state */}
          {!hasContent && (
            <>
              <div className="flex">
                <div
                  className="px-4 py-2.5 text-ink text-[14px] max-w-[88%]"
                  style={{ background: '#F1EFE8', borderRadius: 20, borderBottomLeftRadius: 6 }}
                >
                  hey 👋 i'm sportsBFF. tap a prompt below to start — or pretend i can hear you ☕
                </div>
              </div>
              <div className="text-center text-[10px] text-muted font-mono uppercase tracking-wider mt-2">
                ↓ pre-loaded prompts ↓
              </div>
            </>
          )}

          {/* Rendered thread */}
          {thread.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="flex justify-end">
                <div
                  className="px-4 py-2.5 text-white text-[14.5px] max-w-[78%]"
                  style={{
                    background: 'linear-gradient(180deg, #143A2E 0%, #0D2D24 100%)',
                    borderRadius: 20,
                    borderBottomRightRadius: 6,
                  }}
                >
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex">
                <div
                  className="px-4 py-2.5 text-ink text-[14px] max-w-[88%] leading-relaxed"
                  style={{ background: '#F1EFE8', borderRadius: 20, borderBottomLeftRadius: 6 }}
                  dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(m.content) }}
                />
              </div>
            )
          )}

          {/* Streaming bubble — currently being typed */}
          {streamingText && (
            <div className="flex">
              <div
                className="px-4 py-2.5 text-ink text-[14px] max-w-[88%] leading-relaxed"
                style={{ background: '#F1EFE8', borderRadius: 20, borderBottomLeftRadius: 6 }}
              >
                <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(streamingText) }} />
                <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-green/60 animate-pulse" />
              </div>
            </div>
          )}

          {/* Typing dots — between user-message and stream-start */}
          {isTyping && !streamingText && (
            <div className="flex">
              <div
                className="px-4 py-2.5 inline-flex items-center gap-1"
                style={{ background: '#F1EFE8', borderRadius: 20, borderBottomLeftRadius: 6 }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-ink-soft" style={{ animation: 'bffDot 1.2s ease-in-out infinite', animationDelay: '0s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-soft" style={{ animation: 'bffDot 1.2s ease-in-out infinite', animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-ink-soft" style={{ animation: 'bffDot 1.2s ease-in-out infinite', animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
        </div>

        {/* Sticky prompt chips at the bottom — the actual interaction surface */}
        <div className="px-4 py-4 border-t border-[var(--hairline)]" style={{ background: '#FAF7F1' }}>
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted mb-2.5">
            Try a prompt
          </div>
          <div className="flex flex-wrap gap-1.5">
            {livePrompts.map((p) => {
              const used = usedPrompts.has(p);
              return (
                <button
                  key={p}
                  onClick={() => handlePrompt(p)}
                  disabled={isTyping || used}
                  className={`text-[12.5px] px-3 py-1.5 rounded-full border font-medium transition ${
                    used
                      ? 'bg-cream-warm/60 border-[var(--hairline)] text-muted cursor-not-allowed'
                      : isTyping
                      ? 'bg-white/60 border-[var(--hairline)] text-muted cursor-wait'
                      : 'bg-white border-[var(--hairline)] text-green hover:border-green hover:bg-green hover:text-white cursor-pointer'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <div className="mt-3 pt-2.5 border-t border-[var(--hairline)] flex items-center justify-between gap-3">
            <span className="text-[10px] text-muted font-mono tracking-wider">
              {usedPrompts.size > 0 ? `${usedPrompts.size}/6 tried` : 'tap any prompt →'}
            </span>
            <Link href="/chat" className="text-[11px] text-green font-semibold hover:underline">
              See all 100+ →
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes bffDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Tiny inline markdown — supports *italic* and **bold** only, escapes everything else.
function renderInlineMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

/* ─────────────────────────────────────────────────────────────────
   TODAY SCENE — live feed mockup
   ──────────────────────────────────────────────────────────────── */

function TodayScene() {
  return (
    <section
      className="relative px-4 sm:px-8 py-20 sm:py-28 border-t border-[var(--hairline)] overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #FDEEF1 0%, #FFFFFF 100%)' }}
    >
      {/* Soft magenta wash to anchor the blush mood */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] rounded-full bg-magenta/[0.06] blur-[140px]" />
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-[1.05fr_0.95fr] gap-12 md:gap-16 items-center">
        <div className="order-2 md:order-1">
          <TodayFeedMockup />
        </div>

        <div className="order-1 md:order-2">
          <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-magenta mb-4">③ Tea · live</div>
          <h2 className="font-display text-[42px] sm:text-[60px] font-bold text-green leading-[0.95] tracking-tight">
            Fresh tea. <span className="italic text-magenta">Every morning.</span>
          </h2>
          <p className="mt-5 text-[16px] sm:text-[18px] text-ink-soft leading-relaxed">
            A morning drop with what's actually happening across the NFL + NBA — sourced, tier-labeled, never invented. Built to forward to the group chat before your coffee's done.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--hairline)] text-[12px]">
              <span className="w-1.5 h-1.5 rounded-full bg-magenta animate-pulse" />
              <span className="text-ink-soft font-semibold">Refreshed daily</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--hairline)] text-[12px]">
              <span className="text-ink-soft font-semibold">📱 Tap to ask</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--hairline)] text-[12px]">
              <span className="text-ink-soft font-semibold">📤 Built to share</span>
            </div>
          </div>

          <p className="mt-7 text-[13px] text-ink-soft italic">
            Like a group chat that watches every game. <span className="text-magenta font-semibold not-italic">Without the bros.</span>
          </p>

          <div className="mt-7">
            <Link href="/tea" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-magenta hover:underline">
              See today's feed →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TodayFeedMockup() {
  const items = [
    { time: '32m', league: 'NBA', tier: 'reported', tBg: '#E6F1FB', tColor: '#185FA5', headline: 'Embiid trade chatter, again', summary: 'Sixers and three teams in "exploratory" talks per The Athletic.', src: 'The Athletic' },
    { time: '1h', league: 'NFL', tier: 'confirmed', tBg: '#E8F0EC', tColor: '#0F6E56', headline: 'Mahomes on the three-peat', summary: '"We want it." Postgame presser. Reid grinned in the back.', src: 'NFL Network' },
    { time: '2h', league: 'NBA', tier: 'speculation', tBg: '#FAEEDA', tColor: '#854F0B', headline: 'KD reply guy spotted, again?', summary: '@gethigher77 quote-tweeted a Wemby highlight at 2:14 AM.', src: 'Twitter' },
  ];

  return (
    <div className="relative max-w-md mx-auto w-full">
      <div className="absolute -inset-6 bg-gradient-to-br from-magenta/[0.10] via-tangerine/[0.08] to-transparent blur-2xl rounded-[60px] -z-10" />

      <div
        className="bg-white rounded-3xl border border-[var(--hairline)] overflow-hidden"
        style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 24px 48px -16px rgba(13,45,36,0.18)' }}
      >
        <div className="px-5 pt-4 pb-3 border-b border-[var(--hairline)] flex items-center justify-between">
          <div>
            <div className="font-display italic text-[18px] font-bold text-green leading-none">today.</div>
            <div className="text-[10px] text-muted font-mono uppercase tracking-wider mt-1">tuesday · apr 28 · live</div>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-magenta">
            <span className="w-1.5 h-1.5 rounded-full bg-magenta animate-pulse" />
            LIVE
          </div>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          {items.map((it, i) => (
            <div key={i} className="px-5 py-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-block px-1.5 py-px rounded text-[8px] font-bold tracking-widest uppercase" style={{ background: it.league === 'NBA' ? '#E6F1FB' : '#FCE4EC', color: it.league === 'NBA' ? '#185FA5' : '#9C2454' }}>
                  {it.league}
                </span>
                <span className="inline-block px-1.5 py-px rounded-full text-[8px] font-semibold uppercase tracking-wider" style={{ background: it.tBg, color: it.tColor }}>
                  {it.tier}
                </span>
                <span className="text-[10px] text-muted ml-auto font-mono">{it.time} ago</span>
              </div>
              <h3 className="font-display font-bold text-[14.5px] text-green leading-tight">{it.headline}</h3>
              <p className="mt-1 text-[12.5px] text-ink-soft leading-relaxed">{it.summary}</p>
              <div className="mt-1.5 text-[10px] text-muted italic">{it.src}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   LEARN SCENE — light grey, lesson cards
   ──────────────────────────────────────────────────────────────── */

function LearnScene() {
  return (
    <section
      className="relative px-4 sm:px-8 py-20 sm:py-28 border-t border-[var(--hairline)] overflow-hidden"
      style={{ background: '#EFEAF5' }}
    >
      {/* Soft sapphire wash to anchor the academic mood */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-20 -left-20 w-[500px] h-[400px] rounded-full bg-sapphire/[0.05] blur-[140px]" />
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-[0.95fr_1.05fr] gap-12 md:gap-16 items-center">
        <div>
          <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-sapphire mb-4">④ Lessons</div>
          <h2 className="font-display text-[42px] sm:text-[60px] font-bold text-green leading-[0.95] tracking-tight">
            Master the rules. <span className="italic text-sapphire">5 minutes a day.</span>
          </h2>
          <p className="mt-5 text-[16px] sm:text-[18px] text-ink-soft leading-relaxed">
            Bite-sized lessons in plain English. The rules, the positions, the strategy — broken down so it actually clicks. Plus Euphoria mode for more cinematic explanations.
          </p>

          <div className="mt-7">
            <Link href="/learn" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-sapphire hover:underline">
              Start a lesson →
            </Link>
          </div>
        </div>

        <div className="space-y-2.5 max-w-md mx-auto w-full">
          {[
            { league: 'NFL', title: 'Football, in 5 minutes', sub: 'the rules, in plain english', color: '#E84B7A' },
            { league: 'NBA', title: 'Basketball, in 5 minutes', sub: 'shot clock, fouls, & vibes', color: '#2D4ED1' },
            { league: 'BOTH', title: 'The salary cap, decoded', sub: "why your team can't just sign anyone", color: '#FBB731' },
          ].map((l) => (
            <div key={l.title} className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-[var(--hairline)] shadow-[0_4px_16px_-10px_rgba(13,45,36,0.08)]">
              <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest" style={{ background: `${l.color}15`, color: l.color }}>
                {l.league}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[14.5px] text-green truncate">{l.title}</div>
                <div className="text-[11.5px] text-ink-soft italic truncate">{l.sub}</div>
              </div>
              <span className="text-muted text-[11px] shrink-0">5 min</span>
            </div>
          ))}

          <div className="mt-3 bg-white rounded-2xl p-4 border border-[var(--hairline)] flex items-center gap-3">
            <div
              className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center font-display font-extrabold text-xl"
              style={{
                background: 'linear-gradient(135deg, #DCD0F4 0%, #4A2D6B 200%)',
                color: '#4A2D6B',
              }}
            >
              E
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-[13.5px] text-green">✨ Euphoria mode</div>
              <div className="text-[11.5px] text-ink-soft italic mt-0.5">tunnel fits as armor · more shows soon</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FINAL CTA — App Store-style mockup + big CTA
   ──────────────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="relative px-4 sm:px-8 py-24 sm:py-32 text-center bg-white border-t border-[var(--hairline)] overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-tangerine/[0.06] blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* App Store-style preview card */}
        <div className="inline-flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3 sm:py-3.5 bg-white rounded-2xl border border-[var(--hairline)] shadow-[0_8px_28px_-10px_rgba(13,45,36,0.12)] mb-10">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0D2D24, #143A2E)' }}>
            <span className="font-display font-extrabold text-white text-xl sm:text-2xl">B</span>
          </div>
          <div className="text-left">
            <div className="font-display font-bold text-[14px] sm:text-[15px] text-green">sportsBFF</div>
            <div className="text-[11px] sm:text-[12px] text-ink-soft">Sports · Free</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-tangerine">★★★★★</span>
              <span className="text-[10px] text-muted">· 4.9 (beta)</span>
            </div>
          </div>
          <div className="hidden sm:block ml-2 px-3 py-1.5 rounded-full bg-tangerine text-white text-[11px] font-semibold">
            GET
          </div>
        </div>

        <h2 className="font-display text-[36px] sm:text-[56px] font-bold text-green leading-[1.03] tracking-tight">
          Built for the group chat that just wants to <span className="italic text-tangerine">keep up.</span>
        </h2>

        <Link
          href="/onboarding"
          className="mt-10 inline-flex items-center gap-2 bg-tangerine text-white font-semibold rounded-full px-8 sm:px-10 py-4 sm:py-4.5 text-[15.5px] sm:text-[16px] hover:bg-tangerine-dark transition shadow-[0_8px_28px_-6px_rgba(255,107,61,0.5)]"
        >
          Get started — free →
        </Link>

        <p className="mt-5 text-[12px] sm:text-[13px] text-muted">
          NFL + NBA. iOS coming. Free during beta.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   FOOTER
   ──────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="px-6 py-12 bg-green-deep text-white" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 3rem)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <div className="font-display font-extrabold text-base tracking-wide uppercase">SPORTS<span className="text-tangerine">★</span>BFF</div>
            <div className="font-display italic text-xs text-white/60 mt-1">your sports BFF</div>
          </div>
          <div className="flex items-center gap-6 text-[12px] text-white/70">
            <Link href="/scan" className="hover:text-white transition">Scan</Link>
            <Link href="/chat" className="hover:text-white transition">Chat</Link>
            <Link href="/tea" className="hover:text-white transition">Today</Link>
            <Link href="/learn" className="hover:text-white transition">Learn</Link>
          </div>
          <div className="text-[10px] text-white/40 font-mono tracking-widest uppercase">v1.0 · spring 2026</div>
        </div>
      </div>
    </footer>
  );
}
