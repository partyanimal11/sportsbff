'use client';

/**
 * sportsBFF — landing page.
 *
 * Premium white throughout. Scan-result phone mockup as hero image (v5 pattern).
 * Tea'd Up demoed as the master toggle — flip it to see how the same scan
 * pivots from clean info to gossip. Four feature scenes follow:
 * Scan / BFF / Today / Learn.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isOnboarded } from '@/lib/profile';
import { TeaUpToggle } from '@/components/TeaUpToggle';

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
      <TodayScene />
      <LearnScene />
      <FinalCTA />
      <Footer />
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   NAV
   ──────────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[var(--hairline)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="font-display text-base sm:text-[17px] font-extrabold text-green tracking-wide uppercase shrink-0">
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-[13px] text-ink-soft">
          <Link href="/scan" className="hover:text-ink">Scan</Link>
          <Link href="/chat" className="hover:text-ink">Chat</Link>
          <Link href="/tea" className="hover:text-ink">Today</Link>
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
   HERO — your sports BFF + scan-result phone mockup
   ──────────────────────────────────────────────────────────────── */

function Hero() {
  // Demo state — flipping Tea'd Up live so the visitor sees the toggle in action
  const [demoTeaUp, setDemoTeaUp] = useState(true);

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 -left-24 w-[440px] h-[440px] rounded-full bg-tangerine/[0.07] blur-[100px]" />
        <div className="absolute top-32 -right-24 w-[380px] h-[380px] rounded-full bg-magenta/[0.05] blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-16 pb-16 sm:pb-20 grid md:grid-cols-[1.05fr_0.95fr] gap-8 md:gap-14 items-center">
        {/* Copy */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[var(--hairline)] text-[11px] text-ink-soft mb-5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
            Closed beta · iOS + web · Spring 2026
          </div>

          <h1 className="font-display text-[44px] sm:text-[60px] md:text-[68px] font-bold text-green leading-[0.92] tracking-tight">
            Learn the game.
            <br />
            <span className="italic font-medium text-tangerine">Get the tea.</span>
          </h1>

          <p className="mt-3 text-[12px] tracking-[0.18em] uppercase font-bold text-tangerine">
            Your sports BFF.
          </p>

          <p className="mt-5 text-[16px] sm:text-[17px] text-ink-soft leading-relaxed max-w-md">
            <strong className="text-ink">Scan any player.</strong> Get the storylines, the rules, and (if you flip it on) the gossip — confirmed, reported, never guessed. For everyone who's been told they wouldn't get it.
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
              Try the scan →
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

        {/* Phone mockup — scan result with live Tea'd Up demo toggle */}
        <div className="relative">
          <div className="absolute -top-2 right-0 z-10 flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-mono tracking-wider uppercase text-muted">tap to flip the vibe →</span>
            <TeaUpToggle enabled={demoTeaUp} onToggle={() => setDemoTeaUp((v) => !v)} />
          </div>
          <ScanResultMockup teadUp={demoTeaUp} />
          <div className="font-script text-magenta text-[16px] rotate-[-2deg] text-center mt-3">
            scan any player → get the {demoTeaUp ? 'tea' : 'breakdown'} ✏
          </div>
        </div>
      </div>
    </section>
  );
}

/* The hero phone mockup. Re-renders content based on Tea'd Up toggle state —
   so the visitor literally sees what flipping the toggle does. */
function ScanResultMockup({ teadUp }: { teadUp: boolean }) {
  return (
    <div className="relative max-w-md mx-auto">
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
        <div className="px-5 pt-4 pb-2 flex items-center justify-between text-[10px] text-muted-soft font-mono tracking-wider">
          <span>9:41</span>
          <span className="font-bold tracking-widest text-tangerine">● SCAN MODE</span>
          <span>●●●●</span>
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

        {/* Content varies based on Tea'd Up state */}
        <div className="px-5 py-4">
          {teadUp ? (
            // Tea'd Up ON — drama section with tier pill
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
            // Tea'd Up OFF — clean storyline + concept
            <>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">
                <span aria-hidden>🏀</span> The story
              </div>
              <div className="bg-white rounded-2xl p-4 border border-[var(--hairline)] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,_0_4px_12px_-6px_rgba(13,45,36,0.08)]">
                <h3 className="font-display font-bold text-[16px] text-green leading-tight">"Best center alive" debate</h3>
                <p className="mt-1 text-[13px] text-ink leading-relaxed">
                  2023 MVP. 7'0, 280, post-up game from another era. The injury history is the asterisk on every conversation about him.
                </p>
                <div className="mt-2 text-[11px] text-tangerine font-semibold">▾ Why it matters</div>
              </div>
            </>
          )}
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
   SCENE 2 — Scan
   ──────────────────────────────────────────────────────────────── */

function ScanScene() {
  return (
    <section className="relative px-5 sm:px-8 py-16 sm:py-24 bg-white border-t border-[var(--hairline)]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">① Scan</div>
          <h2 className="font-display text-[40px] sm:text-[52px] font-bold text-green leading-[0.96] tracking-tight">
            Point. ID. <span className="italic text-tangerine">Decoded.</span>
          </h2>
          <p className="mt-4 text-[16px] text-ink-soft leading-relaxed max-w-md mx-auto">
            Camera, screenshot, or live broadcast. We ID the player and serve the storylines in seconds.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#E8F0EC', color: '#0F6E56' }}>✓ Confirmed</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#E6F1FB', color: '#185FA5' }}>📰 Reported</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#FAEEDA', color: '#854F0B' }}>💭 Speculation</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#F1EFE8', color: '#5F5E5A' }}>❓ Rumor</span>
        </div>
        <p className="text-center text-[13px] text-ink-soft italic max-w-md mx-auto">
          Flip Tea'd Up on and every drama claim ships labeled. <strong className="not-italic text-tangerine">Sourced. Hedged. Never guessed.</strong>
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
   SCENE 3 — BFF (chat) with iMessage preview
   ──────────────────────────────────────────────────────────────── */

function BFFScene() {
  return (
    <section className="relative px-5 sm:px-8 py-16 sm:py-24 bg-white border-t border-[var(--hairline)]">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[0.95fr_1.05fr] gap-10 md:gap-14 items-center">
        <div>
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">② Chat</div>
          <h2 className="font-display text-[40px] sm:text-[52px] font-bold text-green leading-[0.95] tracking-tight">
            Ask anything. <span className="italic text-tangerine">No question is dumb.</span>
          </h2>
          <p className="mt-4 text-[16px] text-ink-soft leading-relaxed">
            The friend who knows every player AND patiently explains a third down. Drill into any team, any storyline, any rule — at your pace.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { label: '"What\'s a sack?"', emoji: '🏈' },
              { label: '"Why is OKC so good?"', emoji: '🏀' },
              { label: '"What happened with KD?"', emoji: '👀' },
              { label: '"How does the cap work?"', emoji: '💰' },
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
              <div className="font-display text-[28px] font-bold text-green leading-none">∞</div>
              <div className="text-[10px] text-muted uppercase tracking-wider mt-1">questions</div>
            </div>
          </div>

          <p className="mt-6 text-[13px] text-ink-soft italic">
            Voice mode reads it aloud. Tea'd Up adds the gossip. <span className="text-tangerine font-semibold not-italic">Never invents.</span>
          </p>

          <div className="mt-6">
            <Link href="/chat" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-tangerine hover:underline">
              Open the chat →
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
              what does first down mean
            </div>
          </div>
          <div className="flex">
            <div className="px-4 py-2.5 text-ink text-[14px] max-w-[88%]" style={{ background: '#F1EFE8', borderRadius: 20, borderBottomLeftRadius: 6 }}>
              the offense gets 4 tries to move the ball 10 yards. if they make it → another 4 tries (a "first down"). if not → the other team gets the ball ☕
            </div>
          </div>
          <div className="flex justify-end">
            <div className="px-4 py-2.5 text-white text-[14.5px] max-w-[78%]" style={{ background: 'linear-gradient(180deg, #FF7A52 0%, #FF5723 100%)', borderRadius: 20, borderBottomRightRadius: 6 }}>
              ok and embiid drama 👀
            </div>
          </div>
          <div className="flex">
            <div className="px-4 py-2.5 text-ink text-[14px] max-w-[88%]" style={{ background: '#F1EFE8', borderRadius: 20, borderBottomLeftRadius: 6 }}>
              <span className="inline-flex items-center px-1.5 py-px rounded-full text-[8px] font-semibold uppercase tracking-wider mr-1.5" style={{ background: '#FAEEDA', color: '#854F0B' }}>Speculation</span>
              <span>flip Tea'd Up on and i'll spill. or stay clean — your call.</span>
            </div>
          </div>
          <div className="flex">
            <div className="px-4 py-2.5 inline-flex items-center gap-1" style={{ background: '#F1EFE8', borderRadius: 20, borderBottomLeftRadius: 6 }}>
              <span className="w-1.5 h-1.5 rounded-full bg-ink-soft" style={{ animation: 'tdotL 1.2s ease-in-out infinite', animationDelay: '0s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-ink-soft" style={{ animation: 'tdotL 1.2s ease-in-out infinite', animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-ink-soft" style={{ animation: 'tdotL 1.2s ease-in-out infinite', animationDelay: '0.4s' }} />
            </div>
          </div>
          <div className="text-right text-[10px] text-muted mt-1">Read · 8:15 PM</div>
        </div>
      </div>
      <style jsx>{`
        @keyframes tdotL {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCENE 4 — Today (live feed)
   ──────────────────────────────────────────────────────────────── */

function TodayScene() {
  return (
    <section className="relative px-5 sm:px-8 py-16 sm:py-24 bg-white border-t border-[var(--hairline)]">
      <div className="max-w-5xl mx-auto grid md:grid-cols-[1.05fr_0.95fr] gap-10 md:gap-14 items-center">
        <div className="order-2 md:order-1">
          <TodayFeedMockup />
        </div>

        <div className="order-1 md:order-2">
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">③ Today · live</div>
          <h2 className="font-display text-[40px] sm:text-[52px] font-bold text-green leading-[0.95] tracking-tight">
            What's happening, <span className="italic text-tangerine">right now.</span>
          </h2>
          <p className="mt-4 text-[16px] text-ink-soft leading-relaxed">
            Real-time drops from across the league. Trade reports, on-court moments, breaking news — sourced and tier-labeled. Toggle Tea'd Up on for the gossip layer.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-[12px]">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--hairline)]">
              <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
              <span className="text-ink-soft font-semibold">Updated hourly</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[var(--hairline)]">
              <span className="text-ink-soft font-semibold">📱 Tap to ask</span>
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
    { time: '4h', league: 'NFL', tier: 'rumor', tBg: '#F1EFE8', tColor: '#5F5E5A', headline: 'Belichick + Bills coordinator role?', summary: 'Twitter rumor. No outlet has touched it.', src: 'Reddit' },
  ];

  return (
    <div className="relative max-w-md mx-auto w-full">
      <div className="bg-white rounded-3xl border border-[var(--hairline)] overflow-hidden shadow-[0_24px_48px_-16px_rgba(13,45,36,0.18)]">
        <div className="px-5 pt-4 pb-3 border-b border-[var(--hairline)] flex items-center justify-between">
          <div>
            <div className="font-display italic text-[18px] font-bold text-green leading-none">today.</div>
            <div className="text-[10px] text-muted font-mono uppercase tracking-wider mt-1">tuesday · apr 28 · live</div>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-tangerine">
            <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
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
   SCENE 5 — Learn (light grey)
   ──────────────────────────────────────────────────────────────── */

function LearnScene() {
  return (
    <section className="relative px-5 sm:px-8 py-16 sm:py-24 border-t border-[var(--hairline)]" style={{ background: '#ECEAE3' }}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-[0.95fr_1.05fr] gap-10 md:gap-14 items-center">
        <div>
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">④ Learn</div>
          <h2 className="font-display text-[40px] sm:text-[52px] font-bold text-green leading-[0.95] tracking-tight">
            Master both leagues. <span className="italic text-tangerine">5 minutes</span> at a time.
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
   FINAL CTA
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
          <div className="font-display font-extrabold text-base tracking-wide uppercase">SPORTS<span className="text-tangerine">★</span>BFF</div>
          <div className="font-display italic text-xs text-white/60 mt-1">your sports BFF</div>
        </div>
        <div className="text-[10px] text-white/40 font-mono tracking-widest uppercase">v1.0 · spring 2026 · NFL + NBA</div>
      </div>
    </footer>
  );
}
