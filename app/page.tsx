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
      <section
        className="border-t border-[var(--hairline)] px-6 py-24 md:py-32 relative overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse at top left, rgba(255,107,61,0.06), transparent 40%), ' +
            'radial-gradient(ellipse at bottom right, rgba(45,78,209,0.05), transparent 40%), ' +
            '#F4F4F1',
        }}
      >
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[var(--hairline)] text-[11px] text-tangerine font-semibold tracking-[0.18em] uppercase mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
              Four things she does
            </div>
            <h2 className="font-display text-5xl md:text-6xl font-bold text-green leading-[0.96] tracking-tight max-w-3xl mx-auto">
              How your <span className="italic font-medium text-tangerine">BFF</span> shows up.
            </h2>
            <p className="mt-5 text-lg text-ink-soft max-w-xl mx-auto">
              Two ways to learn. Two ways to make every game make sense.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard
              href="/scan"
              accent="tangerine"
              icon={<ScanIcon />}
              title="Scan"
              tagline="Point your camera."
              desc="Know who's playing in 0.5 seconds."
              num="01"
            />
            <FeatureCard
              href="/chat"
              accent="magenta"
              icon={<ChatIcon />}
              title="Chat"
              tagline="Ask anything."
              desc="No question is too dumb. Ever."
              num="02"
            />
            <FeatureCard
              href="/lessons"
              accent="sapphire"
              icon={<LessonsIcon />}
              title="Lessons"
              tagline="Five-minute lessons."
              desc="Made for absolute beginners."
              num="03"
            />
            <FeatureCard
              accent="sage"
              icon={<VideosIcon />}
              title="Videos"
              tagline="Coming next sprint."
              desc="Watchable, shareable, finally explained."
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
      {/* Multi-layer ambient glow — gives the card a real "floating" feel */}
      <div className="absolute -inset-12 bg-gradient-to-br from-tangerine/15 via-magenta/12 to-lemon/15 blur-3xl rounded-[60px] -z-10" />
      <div className="absolute -inset-2 bg-gradient-to-br from-white/40 to-white/0 blur-xl rounded-[44px] -z-10" />

      {/* Outer device — subtle gradient, refined shadow stack, soft top edge highlight */}
      <div
        className="relative rounded-[36px] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #FCFCFA 100%)',
          boxShadow:
            '0 1px 0 rgba(255,255,255,0.9) inset, ' +
            '0 0 0 1px rgba(13,45,36,0.06), ' +
            '0 2px 4px rgba(13,45,36,0.04), ' +
            '0 24px 40px -16px rgba(13,45,36,0.16), ' +
            '0 56px 80px -32px rgba(13,45,36,0.22)',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[var(--hairline)] flex items-center gap-3 relative">
          {/* Avatar with multi-layer treatment */}
          <div className="relative shrink-0">
            <div
              className="absolute -inset-1 rounded-full opacity-60 blur-md"
              style={{ background: 'linear-gradient(135deg, #FF6B3D, #E84B7A)' }}
            />
            <div
              className="relative w-11 h-11 rounded-full flex items-center justify-center font-display font-extrabold text-white text-sm tracking-wide"
              style={{
                background: 'linear-gradient(135deg, #FF6B3D 0%, #E84B7A 100%)',
                boxShadow: '0 1px 0 rgba(255,255,255,0.4) inset, 0 6px 14px -4px rgba(232,75,122,0.5)',
              }}
            >
              SB
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-sage border-[2.5px] border-white shadow-[0_0_0_2px_rgba(91,160,132,0.18)]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-green text-[15px] leading-none flex items-center gap-1.5">
              sportsBFF
              <svg viewBox="0 0 14 14" width="11" height="11" className="text-sapphire">
                <path d="M7 1 L13 4 L13 8 C13 11 7 13 7 13 C7 13 1 11 1 8 L1 4 Z" fill="currentColor" />
                <path d="M4.5 7 L6.2 8.5 L9.5 5.2" stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="text-[11px] text-muted mt-1.5 flex items-center gap-1.5">
              <span className="inline-block w-1 h-1 rounded-full bg-sage" />
              Active now <span className="opacity-50">·</span> your sports bff
            </div>
          </div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-muted-soft">8:14&thinsp;PM</div>
        </div>

        {/* Messages */}
        <div
          className="px-4 py-6 flex flex-col gap-3 relative"
          style={{
            background:
              'radial-gradient(ellipse at top, rgba(252,220,230,0.20), transparent 50%), ' +
              'radial-gradient(ellipse at bottom right, rgba(252,237,209,0.25), transparent 50%), ' +
              '#FCFCFA',
          }}
        >
          <DateChip>Today · 8:13 PM</DateChip>

          <BubbleSB delay={0}>
            spotted travis kelce on screen 👀 want me to break him down?
          </BubbleSB>

          <BubbleSB delay={0.15} pad="p-2">
            <ScanCard />
          </BubbleSB>

          <BubbleYou delay={0.45}>omg ya is he the one dating taylor</BubbleYou>
          <ReadReceipt />

          <BubbleSB delay={0.6}>
            yes 💁‍♀️ that one. future hall of famer, 3 rings. <em className="text-ink-soft">also btw</em> his brother jason just retired, the kelce family runs the most-listened-to NFL podcast.
          </BubbleSB>

          <BubbleYou delay={0.85}>and what just happened?? he caught it & they all ran</BubbleYou>

          <BubbleSB delay={1.0}>
            <strong className="text-magenta font-semibold">touchdown 🏈</strong> 6 points. KC pulling away. taylor in the suite is going to be on every camera in 3… 2… 1…
          </BubbleSB>
        </div>

        {/* Composer */}
        <div className="px-3 py-3 border-t border-[var(--hairline)] bg-white flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-cream-warm border border-[var(--hairline)] flex items-center justify-center text-tangerine hover:bg-tangerine hover:text-white hover:border-tangerine transition-all duration-200 shrink-0">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9a2 2 0 0 1 2-2h2l1-2h8l1 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
          <div
            className="flex-1 rounded-full px-4 py-2.5 text-[13px] text-muted border"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FCFCFA 100%)',
              borderColor: 'rgba(13,45,36,0.10)',
              boxShadow: 'inset 0 1px 2px rgba(13,45,36,0.04)',
            }}
          >
            ask anything…
          </div>
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0 hover:scale-105 transition-transform"
            style={{
              background: 'linear-gradient(135deg, #FF6B3D 0%, #FF5723 100%)',
              boxShadow: '0 4px 10px -2px rgba(255,107,61,0.45), 0 1px 0 rgba(255,255,255,0.3) inset',
            }}
          >
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none">
              <path d="M2 7H12 M7 2 L12 7 L7 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function DateChip({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center my-1">
      <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase text-muted-soft bg-white/60 backdrop-blur-sm">
        {children}
      </span>
    </div>
  );
}

function ReadReceipt() {
  return (
    <div className="flex justify-end -mt-2 -mb-1 pr-1">
      <span className="text-[10px] text-muted-soft">Read · 8:14 PM</span>
    </div>
  );
}

function ScanCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden border bg-white"
      style={{
        borderColor: 'rgba(13,45,36,0.08)',
        boxShadow: '0 4px 12px -4px rgba(13,45,36,0.08), 0 1px 0 rgba(255,255,255,0.8) inset',
      }}
    >
      {/* Faux TV/field — refined gradient with vignette + scan brackets */}
      <div
        className="h-24 relative"
        style={{
          background:
            'radial-gradient(ellipse at center, #2F7A4D 0%, #1F5535 55%, #143C26 100%)',
        }}
      >
        {/* Subtle yard lines */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background:
              'repeating-linear-gradient(90deg, transparent 0 28px, rgba(255,255,255,0.3) 28px 29px)',
          }}
        />
        {/* Player jersey */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative w-14 h-14 rounded-full flex items-center justify-center text-white font-display font-extrabold text-lg"
            style={{
              background: 'linear-gradient(180deg, #C8202A 0%, #861420 100%)',
              boxShadow:
                '0 1px 0 rgba(255,255,255,0.3) inset, ' +
                '0 0 0 2px rgba(255,255,255,0.85), ' +
                '0 6px 14px -4px rgba(0,0,0,0.5)',
            }}
          >
            87
          </div>
        </div>
        {/* Scan corner brackets */}
        <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-tangerine/80" />
        <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-tangerine/80" />
        <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-tangerine/80" />
        <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-tangerine/80" />
        {/* Live scoreboard chip */}
        <div
          className="absolute top-2 left-2 px-2 py-1 rounded-md text-white text-[9px] font-bold tracking-wider flex items-center gap-1.5"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
        >
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-red-500 opacity-50 animate-ping" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-red-500" />
          </span>
          KC <span className="text-lemon">24</span> · DAL 17
        </div>
      </div>

      {/* Player info */}
      <div className="p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="font-display font-bold text-green text-[15px] leading-tight tracking-tight truncate">Travis Kelce</div>
          <div className="text-[11px] text-muted mt-0.5">Tight End · Chiefs · #87</div>
        </div>
        <div
          className="text-[10px] font-bold tracking-widest uppercase text-tangerine px-2 py-1 rounded-full bg-tangerine/10 shrink-0"
        >
          ID'd
        </div>
      </div>
    </div>
  );
}

function BubbleSB({ children, delay = 0, pad = 'px-3.5 py-2.5' }: { children: React.ReactNode; delay?: number; pad?: string }) {
  return (
    <div
      className={`max-w-[88%] rounded-[18px] rounded-tl-md text-[14px] leading-relaxed text-ink ${pad}`}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFAF6 100%)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.9) inset, ' +
          '0 0 0 1px rgba(13,45,36,0.06), ' +
          '0 1px 2px rgba(13,45,36,0.05), ' +
          '0 6px 16px -8px rgba(13,45,36,0.10)',
        animation: `fadeUp .55s cubic-bezier(.2,.7,.2,1.05) ${delay}s both`,
      }}
    >
      {children}
      <style jsx>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

function BubbleYou({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div
      className="max-w-[80%] ml-auto rounded-[18px] rounded-tr-md text-white text-[14px] leading-relaxed px-3.5 py-2.5"
      style={{
        background: 'linear-gradient(135deg, #FF7A52 0%, #FF5723 100%)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.25) inset, ' +
          '0 4px 12px -4px rgba(255,107,61,0.4), ' +
          '0 1px 2px rgba(13,45,36,0.06)',
        animation: `fadeUpYou .55s cubic-bezier(.2,.7,.2,1.05) ${delay}s both`,
      }}
    >
      {children}
      <style jsx>{`
        @keyframes fadeUpYou {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

/* =============================================================
   FEATURE CARDS
   ============================================================= */

const ACCENT_HEX: Record<string, { color: string; cardTint: string; iconBg: string; glow: string }> = {
  tangerine: { color: '#FF6B3D', cardTint: 'rgba(255,107,61,0.05)', iconBg: 'rgba(255,107,61,0.13)', glow: 'rgba(255,107,61,0.35)' },
  magenta:   { color: '#E84B7A', cardTint: 'rgba(232,75,122,0.05)', iconBg: 'rgba(232,75,122,0.13)', glow: 'rgba(232,75,122,0.35)' },
  sapphire:  { color: '#2D4ED1', cardTint: 'rgba(45,78,209,0.05)',  iconBg: 'rgba(45,78,209,0.13)',  glow: 'rgba(45,78,209,0.30)'  },
  sage:      { color: '#5BA084', cardTint: 'rgba(91,160,132,0.05)', iconBg: 'rgba(91,160,132,0.15)', glow: 'rgba(91,160,132,0.30)' },
};

function FeatureCard({
  href,
  accent,
  icon,
  title,
  tagline,
  desc,
  num,
  soon,
}: {
  href?: string;
  accent: keyof typeof ACCENT_HEX;
  icon: React.ReactNode;
  title: string;
  tagline: string;
  desc?: string;
  num: string;
  soon?: boolean;
}) {
  const a = ACCENT_HEX[accent];

  const inner = (
    <div
      className="relative group rounded-3xl overflow-hidden h-full transition-all duration-300 hover:-translate-y-1.5"
      style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FCFCFA 100%)',
        boxShadow:
          '0 1px 0 rgba(255,255,255,0.9) inset, ' +
          '0 0 0 1px rgba(13,45,36,0.06), ' +
          '0 2px 4px rgba(13,45,36,0.04), ' +
          '0 12px 28px -10px rgba(13,45,36,0.10)',
      }}
    >
      {/* Hover-only accent gradient backdrop */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(160deg, ${a.cardTint} 0%, transparent 60%)`,
        }}
      />

      {/* Top accent bar — gradient */}
      <div
        className="absolute inset-x-0 top-0 h-1 transition-all duration-300 group-hover:h-1.5"
        style={{
          background: `linear-gradient(90deg, ${a.color} 0%, ${a.color}cc 100%)`,
        }}
      />

      {/* Massive italic number — top-right */}
      <div
        className="absolute top-6 right-6 font-display italic font-semibold text-[44px] leading-none tracking-tight transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-3deg]"
        style={{ color: a.color, opacity: 0.85 }}
      >
        {num}
      </div>

      <div className="relative p-7 pt-9 flex flex-col h-full">
        {/* Icon orb with soft glow */}
        <div className="relative mb-7">
          <div
            className="absolute -inset-3 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: a.glow }}
          />
          <div
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
            style={{
              background: a.iconBg,
              color: a.color,
              boxShadow: `0 1px 0 rgba(255,255,255,0.6) inset, 0 6px 14px -4px ${a.glow}`,
            }}
          >
            {icon}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-[28px] text-green leading-[1.05] tracking-tight">
          {title}
        </h3>

        {/* Tagline (italic, accent-colored) */}
        <p
          className="font-display italic font-medium text-[15px] mt-1.5 leading-snug"
          style={{ color: a.color }}
        >
          {tagline}
        </p>

        {/* Description */}
        {desc && (
          <p className="text-[14px] text-ink-soft mt-2 leading-relaxed flex-1">
            {desc}
          </p>
        )}

        {/* Footer link */}
        <div
          className="mt-6 pt-4 border-t flex items-center justify-between"
          style={{ borderColor: 'rgba(13,45,36,0.08)' }}
        >
          {soon ? (
            <span
              className="text-[10px] font-bold tracking-[0.18em] uppercase inline-flex items-center gap-1.5"
              style={{ color: a.color }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: a.color }}
              />
              Coming soon
            </span>
          ) : (
            <>
              <span
                className="text-[10px] font-bold tracking-[0.18em] uppercase"
                style={{ color: a.color }}
              >
                Try it
              </span>
              <span
                className="font-display italic text-lg transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: a.color }}
              >
                →
              </span>
            </>
          )}
        </div>
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
