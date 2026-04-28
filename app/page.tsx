'use client';

/**
 * Tea'd Up — landing page.
 *
 * Premium white throughout. v5-style hero with phone mockup showing the scan
 * result + confirmation tier pills as the marketing image. Real-time daily
 * Tea feed (not tarot). Strong serif typography, tangerine CTAs.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isOnboarded } from '@/lib/profile';

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    if (isOnboarded()) router.replace('/scan');
  }, [router]);

  return (
    <main className="bg-white" style={{ minHeight: '100dvh' }}>
      <Nav />
      <Hero />
      <ScanScene />
      <BFFScene />
      <TeaScene />
      <LearnScene />
      <FinalCTA />
      <Footer />
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   NAV — sticky top, premium white
   ──────────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[var(--hairline)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg viewBox="0 0 100 100" width="22" height="22" aria-hidden>
            <path d="M 26 30 Q 26 70 38 80 L 56 80 Q 68 70 68 30 Z" fill="#0D2D24" />
            <ellipse cx="48" cy="83" rx="20" ry="2.5" fill="#0D2D24" />
            <path d="M 68 38 Q 80 42 80 56 Q 80 66 68 70" stroke="#0D2D24" strokeWidth="3" fill="none" />
            <path d="M 38 30 Q 47 55 38 80" stroke="#FF6B3D" strokeWidth="2" fill="none" />
            <path d="M 56 30 Q 47 55 56 80" stroke="#FF6B3D" strokeWidth="2" fill="none" />
            <path d="M 26 50 Q 47 55 68 50" stroke="#FF6B3D" strokeWidth="2" fill="none" />
          </svg>
          <span className="font-display font-extrabold text-[15px] sm:text-[16px] tracking-wide text-green uppercase">
            Tea'd Up
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[13px] text-ink-soft">
          <Link href="/scan" className="hover:text-ink">Scan</Link>
          <Link href="/chat" className="hover:text-ink">BFF</Link>
          <Link href="/tea" className="hover:text-ink">Tea</Link>
          <Link href="/learn" className="hover:text-ink">Learn</Link>
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
   HERO — premium white, headline + scan result phone mockup
   ──────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Soft ambient color washes — subtle, premium */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[400px] h-[400px] rounded-full bg-tangerine/[0.06] blur-[100px]" />
        <div className="absolute top-32 -right-24 w-[360px] h-[360px] rounded-full bg-magenta/[0.05] blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-16 pb-16 sm:pb-20 grid md:grid-cols-[1.05fr_0.95fr] gap-8 md:gap-14 items-center">
        {/* Copy */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[var(--hairline)] text-[11px] text-ink-soft mb-5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
            Closed beta · iOS + web · Spring 2026
          </div>

          <h1 className="font-display text-[44px] sm:text-[64px] md:text-[72px] font-bold text-green leading-[0.92] tracking-tight">
            Learn the tea.
            <br />
            <span className="italic font-medium text-tangerine">Learn the game.</span>
          </h1>

          <p className="mt-4 text-[14px] tracking-[0.04em] uppercase font-bold text-tangerine">
            Your sports BFF.
          </p>

          <p className="mt-4 text-[16px] sm:text-[18px] text-ink-soft leading-relaxed max-w-md">
            Scan any player. Ask anything. <strong className="text-ink">Get the tea, the rules, and the storylines</strong> — confirmed, reported, never guessed. For everyone who's been told they wouldn't get it.
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
              className="inline-flex items-center gap-2 bg-white text-green font-semibold rounded-full px-6 py-3 text-[14.5px] border border-[var(--hairline)] hover:bg-cream-warm transition"
            >
              See the scan →
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px] text-muted">
            <span>Free during beta</span>
            <span className="w-1 h-1 rounded-full bg-current opacity-50" />
            <span>NFL + NBA</span>
            <span className="w-1 h-1 rounded-full bg-current opacity-50" />
            <span>For first-timers + die-hards</span>
          </div>

          <div className="mt-6 font-script text-magenta text-[20px] rotate-[-1.5deg] inline-block">
            — built by a Gen Z founder who didn't know what a touchdown was last year.
          </div>
        </div>

        {/* Hero image — phone mockup with scan result */}
        <div className="relative">
          <ScanResultMockup />
          <div className="font-script text-magenta text-[16px] rotate-[-2deg] text-center mt-3">
            scan any player → get the tea ✏
          </div>
        </div>
      </div>
    </section>
  );
}

/* The hero phone mockup — the marketing image. Shows a scan result with the
   team-colored hero band + tier pill + drama claim. Communicates the product
   in a single visual. */
function ScanResultMockup() {
  return (
    <div className="relative max-w-md mx-auto">
      {/* Floating glow */}
      <div className="absolute -inset-8 bg-gradient-to-br from-tangerine/15 via-magenta/12 to-lemon/15 blur-2xl rounded-[60px] -z-10" />

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
        {/* Status bar pretender */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between text-[10px] text-muted-soft font-mono tracking-wider">
          <span>9:41</span>
          <span className="font-bold tracking-widest text-tangerine">● SCAN MODE</span>
          <span>●●●●</span>
        </div>

        {/* Mode toggle pills */}
        <div className="px-4 pb-3 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tangerine text-white text-[11px] font-semibold shadow-sm">
            🔥 Drama
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-ink-soft text-[11px] font-semibold border border-[var(--hairline)]">
            🏀 On-field
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-ink-soft text-[11px] font-semibold border border-[var(--hairline)]">
            📚 Learn
          </span>
        </div>

        {/* Hero band — Sixers colors for Embiid */}
        <div
          className="relative"
          style={{
            background:
              'linear-gradient(135deg, #006BB6 0%, #006BB6 50%, #ED174C 200%)',
          }}
        >
          <div className="absolute inset-0 opacity-15" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 60px, rgba(255,255,255,0.4) 60px 61px)' }} />
          <div className="relative p-5 pt-4 flex items-end justify-between gap-3 min-h-[124px]">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/85 mb-1.5">
                Center · Philadelphia · #21
              </div>
              <div className="font-display font-bold text-white leading-[0.92] tracking-tight" style={{ fontSize: 'clamp(28px, 5.5vw, 36px)' }}>
                Joel Embiid
              </div>
              {/* Live game chip */}
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

        {/* Drama section */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">
            <span aria-hidden>🔥</span> Drama
          </div>
          <div className="bg-white rounded-2xl p-4 border border-[var(--hairline)] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,_0_4px_12px_-6px_rgba(13,45,36,0.08)]">
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ background: '#FAEEDA', color: '#854F0B' }}>
              Speculation
            </span>
            <h3 className="font-display font-bold text-[16px] text-green leading-tight">
              Did he ask out?
            </h3>
            <p className="mt-1 text-[13px] text-ink leading-relaxed">
              Locker-room sources hint Embiid considered a trade in March. Sixers brass denied on the record.
            </p>
            <div className="mt-2 text-[11px] text-tangerine font-semibold">
              ▾ See sources (1)
            </div>
          </div>
        </div>

        {/* Footer actions — minimal */}
        <div className="px-4 pb-4 flex items-center gap-2">
          <button className="flex-1 inline-flex items-center justify-center gap-1.5 bg-cream-warm rounded-xl py-2.5 text-[11.5px] font-semibold text-ink border border-[var(--hairline)]">
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
   SCENE 2 — Scan section (white)
   ──────────────────────────────────────────────────────────────── */

function ScanScene() {
  return (
    <section className="relative px-5 sm:px-8 py-16 sm:py-24 bg-white border-t border-[var(--hairline)]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">① Scan</div>
          <h2 className="font-display text-[40px] sm:text-[52px] font-bold text-green leading-[0.96] tracking-tight">
            Point. ID. <span className="italic text-tangerine">Tea.</span>
          </h2>
          <p className="mt-4 text-[16px] text-ink-soft leading-relaxed max-w-md mx-auto">
            Camera, screenshot, or live broadcast. Tea'd Up reads the player and serves the gossip in seconds.
          </p>
        </div>

        {/* Tier pills as proof points */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#E8F0EC', color: '#0F6E56' }}>✓ Confirmed</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#E6F1FB', color: '#185FA5' }}>📰 Reported</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#FAEEDA', color: '#854F0B' }}>💭 Speculation</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#F1EFE8', color: '#5F5E5A' }}>❓ Rumor</span>
        </div>
        <p className="text-center text-[13px] text-ink-soft italic max-w-md mx-auto">
          Every drama claim labeled. Sourced. Hedged. <strong className="not-italic text-tangerine">Never guessed.</strong>
        </p>

        <div className="mt-10 text-center">
          <Link href="/scan" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-tangerine hover:underline">
            Try the scan now →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCENE 3 — BFF chat (white, gossip emphasis)
   ──────────────────────────────────────────────────────────────── */

function BFFScene() {
  return (
    <section className="relative px-5 sm:px-8 py-16 sm:py-24 bg-white border-t border-[var(--hairline)]">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[0.95fr_1.05fr] gap-10 md:gap-14 items-center">
        <div>
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">② Your BFF · the gossip</div>
          <h2 className="font-display text-[40px] sm:text-[52px] font-bold text-green leading-[0.95] tracking-tight">
            She's got the tea. <span className="italic text-tangerine">And the receipts.</span>
          </h2>
          <p className="mt-4 text-[16px] text-ink-soft leading-relaxed">
            Confirmed beefs. Reported drama. Off-the-record speculation. Every storyline traced to a source — or labeled <span className="italic text-tangerine font-semibold">never confirmed</span>.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { label: 'Trade rumors', emoji: '🔄' },
              { label: 'Locker-room beefs', emoji: '👀' },
              { label: 'Burner accounts', emoji: '📱' },
              { label: 'Contract chaos', emoji: '💰' },
            ].map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[var(--hairline)] text-[12px] text-ink-soft font-semibold">
                <span aria-hidden>{p.emoji}</span>
                {p.label}
              </span>
            ))}
          </div>

          <div className="mt-7 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="font-display text-[28px] font-bold text-green leading-none">200+</div>
              <div className="text-[10px] text-muted uppercase tracking-wider mt-1">players</div>
            </div>
            <div>
              <div className="font-display text-[28px] font-bold text-green leading-none">85</div>
              <div className="text-[10px] text-muted uppercase tracking-wider mt-1">storylines</div>
            </div>
            <div>
              <div className="font-display text-[28px] font-bold text-green leading-none">4</div>
              <div className="text-[10px] text-muted uppercase tracking-wider mt-1">tiers</div>
            </div>
          </div>

          <p className="mt-6 text-[13px] text-ink-soft italic">
            Voice mode reads it aloud. Drama mode goes harder. <span className="text-tangerine font-semibold not-italic">Never invents.</span>
          </p>

          <div className="mt-6">
            <Link href="/chat" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-tangerine hover:underline">
              Spill some tea →
            </Link>
          </div>
        </div>

        <BFFThreadMockup />
      </div>
    </section>
  );
}

function BFFThreadMockup() {
  return (
    <div className="relative max-w-md mx-auto w-full">
      <div className="bg-white rounded-3xl p-5 border border-[var(--hairline)] shadow-[0_24px_48px_-16px_rgba(13,45,36,0.18),_0_1px_0_rgba(255,255,255,0.9)_inset]">
        <div className="text-center mb-4 text-[10px] tracking-wider uppercase text-muted font-mono">
          iMessage · today 8:14 PM
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-end">
            <div className="px-4 py-2.5 text-white text-[14.5px] max-w-[78%]" style={{ background: 'linear-gradient(180deg, #FF7A52 0%, #FF5723 100%)', borderRadius: 20, borderBottomRightRadius: 6 }}>
              what's the embiid drama 👀
            </div>
          </div>
          <div className="flex">
            <div className="px-4 py-2.5 text-ink text-[14px] max-w-[88%]" style={{ background: '#F1EFE8', borderRadius: 20, borderBottomLeftRadius: 6 }}>
              <span className="inline-flex items-center px-1.5 py-px rounded-full text-[8px] font-semibold uppercase tracking-wider mr-1.5" style={{ background: '#FAEEDA', color: '#854F0B' }}>Speculation</span>
              <span>locker-room whispers say embiid wanted out in march. sixers denied on the record. but the room knows ☕</span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="px-4 py-2.5 text-white text-[14.5px] max-w-[78%]" style={{ background: 'linear-gradient(180deg, #FF7A52 0%, #FF5723 100%)', borderRadius: 20, borderBottomRightRadius: 6 }}>
              wait who told you this
            </div>
          </div>
          <div className="flex">
            <div className="px-4 py-2.5 text-ink text-[14px] max-w-[88%]" style={{ background: '#F1EFE8', borderRadius: 20, borderBottomLeftRadius: 6 }}>
              <span className="inline-flex items-center px-1.5 py-px rounded-full text-[8px] font-semibold uppercase tracking-wider mr-1.5" style={{ background: '#E6F1FB', color: '#185FA5' }}>Reported</span>
              <span>the athletic ran it april 3rd. one source on record. so it stays reported — not confirmed. i never lie. ☕</span>
            </div>
          </div>
          <div className="flex">
            <div className="px-4 py-2.5 inline-flex items-center gap-1" style={{ background: '#F1EFE8', borderRadius: 20, borderBottomLeftRadius: 6 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-ink-soft" style={{ animation: 'tdot 1.2s ease-in-out infinite', animationDelay: '0s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-ink-soft" style={{ animation: 'tdot 1.2s ease-in-out infinite', animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-ink-soft" style={{ animation: 'tdot 1.2s ease-in-out infinite', animationDelay: '0.4s' }} />
            </div>
          </div>
          <div className="text-right text-[10px] text-muted mt-1">Read · 8:15 PM</div>
        </div>
      </div>
      <style jsx>{`
        @keyframes tdot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCENE 4 — Daily Tea (real-time live feed, NOT tarot)
   ──────────────────────────────────────────────────────────────── */

function TeaScene() {
  return (
    <section className="relative px-5 sm:px-8 py-16 sm:py-24 bg-white border-t border-[var(--hairline)]">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[1.05fr_0.95fr] gap-10 md:gap-14 items-center">
        {/* Live feed mockup */}
        <div className="order-2 md:order-1">
          <TeaFeedMockup />
        </div>

        <div className="order-1 md:order-2">
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">③ Daily Tea · live</div>
          <h2 className="font-display text-[40px] sm:text-[52px] font-bold text-green leading-[0.95] tracking-tight">
            The tea. <span className="italic text-tangerine">Real time.</span>
          </h2>
          <p className="mt-4 text-[16px] text-ink-soft leading-relaxed">
            Every hour, fresh drops from across the league. Trade reports. Locker-room beefs. Burner-account moments. Every entry sourced and tier-labeled.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-[12px]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--hairline)]">
              <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
              <span className="text-ink-soft font-semibold">Updated hourly</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--hairline)]">
              <span className="text-ink-soft font-semibold">📱 Tap to open in chat</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--hairline)]">
              <span className="text-ink-soft font-semibold">📤 Built to share</span>
            </div>
          </div>

          <p className="mt-6 text-[13px] text-ink-soft italic">
            Like a group chat that watches every game. <span className="text-tangerine font-semibold not-italic">Without the bros.</span>
          </p>

          <div className="mt-6">
            <Link href="/tea" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-tangerine hover:underline">
              See today's tea →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function TeaFeedMockup() {
  const items = [
    {
      time: '32 min ago',
      league: 'NBA',
      tier: 'reported',
      tierLabel: 'Reported',
      tierBg: '#E6F1FB',
      tierColor: '#185FA5',
      headline: 'Embiid trade chatter, again',
      summary: 'The Athletic: Sixers and three teams have had "exploratory conversations" about a trade package centered on Embiid.',
      source: 'The Athletic · 32m',
    },
    {
      time: '1 hr ago',
      league: 'NFL',
      tier: 'confirmed',
      tierLabel: 'Confirmed',
      tierBg: '#E8F0EC',
      tierColor: '#0F6E56',
      headline: 'Mahomes on the three-peat: "we want it"',
      summary: "Postgame presser. He's said it before, he said it louder tonight. Reid grinned in the back.",
      source: 'NFL Network · 1h',
    },
    {
      time: '2 hr ago',
      league: 'NBA',
      tier: 'speculation',
      tierLabel: 'Speculation',
      tierBg: '#FAEEDA',
      tierColor: '#854F0B',
      headline: 'KD reply guy spotted again?',
      summary: "@gethigher77 quote-tweeted a Wemby highlight at 2:14 AM. The account is, allegedly, KD's. Allegedly.",
      source: 'Twitter · 2h',
    },
    {
      time: '4 hr ago',
      league: 'NFL',
      tier: 'rumor',
      tierLabel: 'Rumor',
      tierBg: '#F1EFE8',
      tierColor: '#5F5E5A',
      headline: 'Belichick + Bills coordinator role?',
      summary: "Twitter rumor mill churning. No outlet has touched it. Filed under: probably not but stay tuned.",
      source: 'Reddit · 4h',
    },
  ];

  return (
    <div className="relative max-w-md mx-auto w-full">
      {/* Phone-frame styled feed */}
      <div className="bg-white rounded-3xl border border-[var(--hairline)] overflow-hidden shadow-[0_24px_48px_-16px_rgba(13,45,36,0.18)]">
        <div className="px-5 pt-4 pb-3 border-b border-[var(--hairline)] flex items-center justify-between">
          <div>
            <div className="font-display italic text-[18px] font-bold text-green leading-none">today's tea</div>
            <div className="text-[10px] text-muted font-mono uppercase tracking-wider mt-1">tuesday · apr 28 · live</div>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-tangerine">
            <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
            LIVE
          </div>
        </div>
        <div className="divide-y divide-[var(--hairline)]">
          {items.map((it, i) => (
            <div key={i} className="px-5 py-3.5 hover:bg-cream-warm transition cursor-pointer">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-block px-1.5 py-px rounded text-[8px] font-bold tracking-widest uppercase" style={{ background: it.league === 'NBA' ? '#E6F1FB' : '#FCE4EC', color: it.league === 'NBA' ? '#185FA5' : '#9C2454' }}>
                  {it.league}
                </span>
                <span className="inline-block px-1.5 py-px rounded-full text-[8px] font-semibold uppercase tracking-wider" style={{ background: it.tierBg, color: it.tierColor }}>
                  {it.tierLabel}
                </span>
                <span className="text-[10px] text-muted ml-auto font-mono">{it.time}</span>
              </div>
              <h3 className="font-display font-bold text-[14.5px] text-green leading-tight">{it.headline}</h3>
              <p className="mt-1 text-[12.5px] text-ink-soft leading-relaxed">{it.summary}</p>
              <div className="mt-1.5 text-[10px] text-muted italic">{it.source}</div>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 bg-cream-warm/40 text-center">
          <span className="text-[11px] text-tangerine font-semibold">Pull for fresh tea ↓</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCENE 5 — Learn (light grey, the only non-white surface)
   ──────────────────────────────────────────────────────────────── */

function LearnScene() {
  return (
    <section className="relative px-5 sm:px-8 py-16 sm:py-24 border-t border-[var(--hairline)]" style={{ background: '#ECEAE3' }}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-[0.95fr_1.05fr] gap-10 md:gap-14 items-center">
        <div>
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">④ Learn</div>
          <h2 className="font-display text-[40px] sm:text-[52px] font-bold text-green leading-[0.95] tracking-tight">
            Learn the league. <span className="italic text-tangerine">5 minutes</span> at a time.
          </h2>
          <p className="mt-4 text-[16px] text-ink-soft leading-relaxed">
            Bite-sized lessons. Glossary in plain English. Plus Euphoria mode — more shows coming.
          </p>

          <div className="mt-6">
            <Link href="/learn" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-tangerine hover:underline">
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
   FINAL CTA (white)
   ──────────────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="relative px-5 sm:px-8 py-20 sm:py-28 text-center bg-white border-t border-[var(--hairline)] overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-tangerine/[0.06] blur-[100px]" />
      </div>

      <div className="max-w-3xl mx-auto">
        <h2 className="font-display text-[36px] sm:text-[52px] font-bold text-green leading-[1.05] tracking-tight">
          Built for the group chat that just wants to <span className="italic text-tangerine">keep up.</span>
        </h2>

        <Link
          href="/onboarding"
          className="mt-9 inline-flex items-center gap-2 bg-tangerine text-white font-semibold rounded-full px-8 py-4 text-[15.5px] hover:bg-tangerine-dark transition shadow-[0_8px_28px_-6px_rgba(255,107,61,0.5)]"
        >
          Get started — free →
        </Link>

        <p className="mt-4 text-[12.5px] text-muted">
          NFL + NBA. iOS coming. Free during beta.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Footer
   ──────────────────────────────────────────────────────────────── */

function Footer() {
  return (
    <footer className="px-6 py-10 bg-green-deep text-white" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2.5rem)' }}>
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <div className="font-display font-bold text-base tracking-wide">Tea'd Up</div>
          <div className="font-display italic text-xs text-white/60 mt-1">your sports BFF</div>
        </div>
        <div className="text-[10px] text-white/40 font-mono tracking-widest uppercase">v1.0 · spring 2026 · NFL + NBA</div>
      </div>
    </footer>
  );
}
