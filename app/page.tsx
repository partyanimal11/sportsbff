'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isOnboarded } from '@/lib/profile';

export default function HomePage() {
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    setOnboarded(isOnboarded());
  }, []);

  const ctaHref = onboarded ? '/chat' : '/onboarding';
  const ctaLabel = onboarded ? 'Continue learning →' : 'Get started — 30 seconds →';

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Nav */}
      <header className="px-6 md:px-8 py-3 border-b border-[var(--hairline)] flex items-center justify-between bg-white sticky top-0 z-20 backdrop-blur">
        <Link href="/" className="font-display text-xl font-extrabold text-green tracking-wide uppercase">
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        <nav className="hidden md:flex gap-7 text-sm text-ink-soft">
          <Link href="/scan" className="hover:text-ink">Scan</Link>
          <Link href="/chat" className="hover:text-ink">Chat</Link>
          <Link href="/lessons" className="hover:text-ink">Lessons</Link>
        </nav>
        <Link className="btn btn-primary" href={ctaHref}>
          {onboarded ? 'Open the app →' : 'Get started →'}
        </Link>
      </header>

      {/* HERO — "Your Sports BFF" */}
      <section className="relative flex-1 px-6 py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full bg-tangerine/30 blur-[80px]" />
          <div className="absolute top-40 -right-40 w-[540px] h-[540px] rounded-full bg-magenta/25 blur-[80px]" />
          <div className="absolute -bottom-32 left-1/3 w-[380px] h-[380px] rounded-full bg-lemon/30 blur-[80px]" />
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-[1.05fr_0.95fr] gap-10 md:gap-14 items-center">
          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[var(--hairline)] text-xs text-ink-soft mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-tangerine animate-pulse" />
              Closed beta · iOS + web · Spring 2026
            </div>
            <h1 className="font-display text-[44px] sm:text-6xl md:text-[72px] font-bold text-green leading-[0.94] tracking-tight">
              Meet your<br/>
              <span className="italic font-medium text-tangerine">Sports&nbsp;BFF.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-soft max-w-lg leading-relaxed">
              sportsBFF knows <strong className="text-ink">every player</strong> and <strong className="text-ink">every piece of gossip</strong>. Who's dating who. Who's beefing on Twitter. Who got traded at 2 AM. Plus the actual rules — explained without the gatekeeping.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 items-center">
              <Link className="btn btn-primary" href={ctaHref}>{ctaLabel}</Link>
              <Link className="btn btn-secondary" href="/chat">Text her now →</Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted">
              <span>Free during beta</span>
              <span className="w-1 h-1 rounded-full bg-current opacity-50" />
              <span>iOS + web</span>
              <span className="w-1 h-1 rounded-full bg-current opacity-50" />
              <span>Built for new fans</span>
            </div>
            <div className="mt-6 font-script text-magenta text-xl rotate-[-1.5deg] inline-block">
              — knows every player. knows all the tea. zero gatekeeping.
            </div>
          </div>

          {/* BFF chat preview — scan + chat in one visual */}
          <div className="relative">
            <BFFThread />
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="bg-cream-warm border-t border-[var(--hairline)] px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[var(--hairline)] text-xs text-tangerine font-semibold tracking-widest uppercase mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-tangerine" />
              Four things she does
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-green leading-tight tracking-tight">
              How your <span className="italic font-medium text-tangerine">BFF</span> shows up.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <FeatureCard
              href="/scan"
              accent="tangerine"
              icon={<ScanIcon />}
              title="Scan"
              tagline="Point your camera. Know who's playing."
              num="01"
            />
            <FeatureCard
              href="/chat"
              accent="magenta"
              icon={<ChatIcon />}
              title="Chat"
              tagline="Ask anything. No question is dumb."
              num="02"
            />
            <FeatureCard
              href="/lessons"
              accent="sapphire"
              icon={<LessonsIcon />}
              title="Lessons"
              tagline="Five-minute lessons. Made for beginners."
              num="03"
            />
            <FeatureCard
              accent="sage"
              icon={<VideosIcon />}
              title="Videos"
              tagline="Coming next sprint."
              num="04"
              soon
            />
          </div>
        </div>
      </section>

      <footer className="bg-green-dark text-white px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="font-display text-sm font-extrabold uppercase tracking-wide">
            SPORTS<span className="text-tangerine">★</span>BFF
          </div>
          <div className="font-script text-lemon text-xl">XOXO, sportsBFF.</div>
        </div>
      </footer>
    </main>
  );
}

/* =============================================================
   BFF THREAD — the magic visual
   Combines scan + chat in one iMessage-feeling card.
   ============================================================= */

function BFFThread() {
  return (
    <div className="relative max-w-md mx-auto">
      {/* Soft floating shadow */}
      <div className="absolute -inset-4 bg-gradient-to-br from-tangerine/10 via-magenta/10 to-lemon/10 blur-2xl rounded-[40px]" />

      <div className="relative bg-white rounded-[32px] border border-[var(--hairline)] shadow-lift overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--hairline)] flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-tangerine to-magenta flex items-center justify-center font-display font-bold text-white text-sm">
              SB
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-sage rounded-full border-2 border-white" />
          </div>
          <div className="flex-1">
            <div className="font-display font-bold text-green text-[15px] leading-none">
              sportsBFF
            </div>
            <div className="text-[11px] text-muted mt-1">Active now · your sports bff</div>
          </div>
          <div className="text-[11px] text-muted">8:14 PM</div>
        </div>

        {/* Messages */}
        <div className="px-4 py-5 flex flex-col gap-3 bg-cream">
          {/* SB intro message */}
          <BubbleSB delay={0}>
            spotted travis kelce on screen 👀 want me to break him down?
          </BubbleSB>

          {/* SB scan card */}
          <BubbleSB delay={0.15} pad="p-2">
            <div className="rounded-xl overflow-hidden border border-[var(--hairline)] bg-white">
              <div className="h-20 relative" style={{ background: 'linear-gradient(135deg, #2A6E47 0%, #1F5535 50%, #163C25 100%)' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-white font-display font-extrabold text-base"
                    style={{ background: 'linear-gradient(180deg, #C8202A 0%, #921620 100%)' }}>
                    87
                  </div>
                </div>
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/55 text-white text-[9px] font-bold tracking-wider flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-500" />
                  KC 24 · DAL 17
                </div>
              </div>
              <div className="p-3">
                <div className="font-display font-bold text-green text-[15px] leading-tight">Travis Kelce</div>
                <div className="text-[11px] text-muted mt-0.5">Tight End · Kansas City Chiefs · 11 yrs in</div>
              </div>
            </div>
          </BubbleSB>

          {/* You */}
          <BubbleYou delay={0.4}>omg ya is he the one dating taylor</BubbleYou>

          {/* SB reply with gossip */}
          <BubbleSB delay={0.55}>
            yes 💁‍♀️ that one. future hall of famer, 3 rings. <em>also btw</em> his brother jason just retired, the kelce family runs the most-listened-to NFL podcast.
          </BubbleSB>

          {/* You */}
          <BubbleYou delay={0.8}>and what just happened?? he caught it & they all ran</BubbleYou>

          {/* SB reply */}
          <BubbleSB delay={0.95}>
            <strong className="text-magenta font-semibold">touchdown 🏈</strong> 6 points. KC pulling away. taylor in the suite is going to be on every camera in 3… 2… 1…
          </BubbleSB>
        </div>

        {/* Footer composer */}
        <div className="px-3 py-3 border-t border-[var(--hairline)] bg-white flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-cream-warm border border-[var(--hairline)] flex items-center justify-center text-tangerine">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9a2 2 0 0 1 2-2h2l1-2h8l1 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div className="flex-1 bg-cream-warm rounded-full px-4 py-2 text-[13px] text-muted border border-[var(--hairline)]">
            ask anything…
          </div>
          <div className="w-7 h-7 rounded-full bg-tangerine flex items-center justify-center text-white">
            <svg viewBox="0 0 14 14" width="11" height="11" fill="none">
              <path d="M2 7H12 M7 2 L12 7 L7 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function BubbleSB({ children, delay = 0, pad = 'px-3.5 py-2.5' }: { children: React.ReactNode; delay?: number; pad?: string }) {
  return (
    <div
      className={`max-w-[88%] bg-white rounded-2xl rounded-tl-md border border-[var(--hairline)] text-[14px] leading-relaxed text-ink ${pad} shadow-[0_1px_0_rgba(13,45,36,0.04)]`}
      style={{
        animation: `fadeUp .55s ease ${delay}s both`,
      }}
    >
      {children}
      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

function BubbleYou({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div
      className="max-w-[80%] ml-auto bg-tangerine text-white rounded-2xl rounded-tr-md text-[14px] leading-relaxed px-3.5 py-2.5"
      style={{
        animation: `fadeUpYou .55s ease ${delay}s both`,
      }}
    >
      {children}
      <style jsx>{`
        @keyframes fadeUpYou {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

/* =============================================================
   FEATURE CARDS
   ============================================================= */

const ACCENT_MAP = {
  tangerine: { bg: 'bg-tangerine/15', text: 'text-tangerine', bar: 'bg-tangerine' },
  magenta: { bg: 'bg-magenta/15', text: 'text-magenta', bar: 'bg-magenta' },
  sapphire: { bg: 'bg-sapphire/15', text: 'text-sapphire', bar: 'bg-sapphire' },
  sage: { bg: 'bg-sage/15', text: 'text-sage', bar: 'bg-sage' },
} as const;

function FeatureCard({
  href,
  accent,
  icon,
  title,
  tagline,
  num,
  soon,
}: {
  href?: string;
  accent: keyof typeof ACCENT_MAP;
  icon: React.ReactNode;
  title: string;
  tagline: string;
  num: string;
  soon?: boolean;
}) {
  const a = ACCENT_MAP[accent];
  const inner = (
    <div className="relative group bg-white rounded-2xl border border-[var(--hairline)] shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 overflow-hidden h-full">
      <div className={`absolute inset-x-0 top-0 h-1 ${a.bar}`} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div className={`w-11 h-11 rounded-xl ${a.bg} ${a.text} flex items-center justify-center`}>
            {icon}
          </div>
          <div className={`font-display italic font-semibold text-xl ${a.text}`}>{num}</div>
        </div>
        <div className="font-display font-bold text-xl text-green leading-tight">{title}</div>
        <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">{tagline}</p>
        {soon && (
          <div className="mt-3 inline-block text-[10px] font-bold tracking-widest uppercase text-sage">
            ◯ Coming soon
          </div>
        )}
      </div>
    </div>
  );
  if (href && !soon) return <Link href={href}>{inner}</Link>;
  return <div>{inner}</div>;
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8V5a1 1 0 0 1 1-1h3" />
      <path d="M16 4h3a1 1 0 0 1 1 1v3" />
      <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
      <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3 1.5-5A4 4 0 0 1 3 14V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}
function LessonsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5a2 2 0 0 1 2-2h11l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}
function VideosIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M10 10l5 3-5 3Z" fill="currentColor" />
    </svg>
  );
}
