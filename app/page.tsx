'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isOnboarded } from '@/lib/profile';

/* =============================================================
   Lens demo data — same question, six different show voices.
   ============================================================= */
type LensDemo = {
  id: string;
  name: string;
  initials: string;
  league: string;
  cardColor: string;
  accent: string;
  answer: string;
};

const LENS_DEMOS: LensDemo[] = [
  {
    id: 'gg',
    name: 'Gossip Girl',
    initials: 'GG',
    league: 'NBA',
    cardColor: '#FFD7E5',
    accent: '#9C2454',
    answer:
      "A **sack** is when a defender catches the QB before he can throw — like Dan getting caught with the laptop in the finale. Play ends behind the line. *Spotted: a quarterback in the dirt.*",
  },
  {
    id: 'bridgerton',
    name: 'Bridgerton',
    initials: 'B',
    league: 'NBA',
    cardColor: '#C9DCEC',
    accent: '#1B3990',
    answer:
      "A **sack** is when an uninvited suitor arrives mid-proposal. The QB was nearly engaged. A defender — Anthony Bridgerton energy — entered the room and ended the courtship.",
  },
  {
    id: 'succession',
    name: 'Succession',
    initials: 'S',
    league: 'NFL',
    cardColor: '#2C1320',
    accent: '#FBB731',
    answer:
      "A **sack** is the moment Logan walks in unannounced. The QB had a plan. The defender had a better one. The QB ends up on the floor losing yards. Tom would call it a Tomlette.",
  },
  {
    id: 'euphoria',
    name: 'Euphoria',
    initials: 'E',
    league: 'NFL',
    cardColor: '#DCD0F4',
    accent: '#4A2380',
    answer:
      "A **sack** is Nate walking up uninvited to whatever Cassie was about to do. The QB was about to throw something beautiful. The defender (the Nate) got there first. Slow zoom on the helmet.",
  },
  {
    id: 'meangirls',
    name: 'Mean Girls',
    initials: 'MG',
    league: 'NBA',
    cardColor: '#FFD3BC',
    accent: '#9B3D17',
    answer:
      "A **sack** is Regina finding out you've been sitting at a different lunch table. The QB had a plan. Regina had better intel. He goes down behind the line. The Plastics dance.",
  },
  {
    id: 'loveisland',
    name: 'Love Island',
    initials: 'LI',
    league: 'NFL',
    cardColor: '#FFE9B0',
    accent: '#A86B00',
    answer:
      "A **sack** is a recoupling gone wrong. The QB chose his pass. The defender chose to go to him instead. The QB is now on the grass. *And just like that, the play ends in shame.*",
  },
  {
    id: 'plain',
    name: 'Just sports',
    initials: '—',
    league: 'No show',
    cardColor: '#F4F4F1',
    accent: '#0D2D24',
    answer:
      "A **sack** is when a defender catches the QB before he can throw the ball — and it costs the offense yards. The play ends right there, behind the line of scrimmage. Think of it as the QB being interrupted mid-sentence, except the sentence was a touchdown pass.",
  },
];

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
              Four ways in. Whichever one your brain prefers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <FeatureCard
              href="/scan"
              visual={<ScanVisual />}
              title="Scan"
              desc="Point your camera at any game. Get the player, the team, the storylines — instantly."
              ctaLabel="Try Scan"
            />
            <FeatureCard
              href="/chat"
              visual={<ChatVisual />}
              title="Chat"
              desc="Ask anything about the NFL or NBA. The dumb question was the right one."
              ctaLabel="Open Chat"
            />
            <FeatureCard
              href="/lessons"
              visual={<LessonsVisual />}
              title="Lessons"
              desc="Five-minute lessons that take you from zero to fluent. Rules, players, fantasy."
              ctaLabel="Start a lesson"
            />
            <FeatureCard
              visual={<VideosVisual />}
              title="Videos"
              desc="Short explainers in your show's voice. A library you'll actually watch."
              soon
            />
          </div>
        </div>
      </section>

      {/* Lens demo — pick what you know */}
      <PickWhatYouKnow />

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

/* =============================================================
   PickWhatYouKnow — interactive lens demo on the home page.
   ============================================================= */

function PickWhatYouKnow() {
  const [selected, setSelected] = useState<string>('gg');
  const lens = LENS_DEMOS.find((l) => l.id === selected) ?? LENS_DEMOS[0];

  return (
    <section
      className="px-6 py-24 md:py-32 border-t border-[var(--hairline)] relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top right, rgba(232,75,122,0.06), transparent 45%), ' +
          'radial-gradient(ellipse at bottom left, rgba(123,91,196,0.05), transparent 45%), ' +
          '#FFFFFF',
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[var(--hairline)] text-[11px] text-magenta font-semibold tracking-[0.18em] uppercase mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-magenta animate-pulse" />
            Your shortcut
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-green leading-[0.96] tracking-tight max-w-3xl mx-auto">
            You already know this.<br/>
            <span className="italic font-medium" style={{ color: lens.accent }}>
              Just in another language.
            </span>
          </h2>
          <p className="mt-5 text-lg text-ink-soft max-w-xl mx-auto">
            Pick a show you've watched twice. We translate the league through its voice — the fastest path to fluency is the one you've already walked.
          </p>
        </div>

        <div className="grid md:grid-cols-[0.95fr_1.05fr] gap-8 md:gap-12 items-start">
          {/* Picker */}
          <div>
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-muted mb-4">
              Your reference
            </div>
            <div className="grid grid-cols-3 gap-3">
              {LENS_DEMOS.map((l) => {
                const isActive = l.id === selected;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setSelected(l.id)}
                    className={`group relative rounded-2xl overflow-hidden bg-white text-left transition-all duration-200 ${
                      isActive ? '-translate-y-1' : 'hover:-translate-y-0.5'
                    }`}
                    style={{
                      boxShadow: isActive
                        ? `0 0 0 2.5px ${l.accent}, 0 18px 32px -16px rgba(13,45,36,0.18)`
                        : '0 0 0 1px rgba(13,45,36,0.08), 0 4px 12px -6px rgba(13,45,36,0.08)',
                    }}
                  >
                    <div
                      className="aspect-[3/4] flex items-center justify-center relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${l.cardColor} 0%, ${l.accent} 220%)`,
                      }}
                    >
                      <span
                        className="font-display font-bold text-4xl tracking-tight"
                        style={{ color: l.accent, textShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      >
                        {l.initials}
                      </span>
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
                            <path d="M2 6.2 L4.8 9 L10 3.5" stroke={l.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="font-display font-bold text-[12.5px] leading-tight text-green truncate">
                        {l.name}
                      </div>
                      <div className="text-[9px] font-bold tracking-widest uppercase mt-0.5 text-muted">
                        {l.league}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* "Don't know any of these?" — full-width Just-Sports option */}
            <button
              type="button"
              onClick={() => setSelected('plain')}
              className={`mt-3 w-full group relative rounded-2xl overflow-hidden bg-white text-left transition-all duration-200 ${
                selected === 'plain' ? '-translate-y-0.5' : 'hover:-translate-y-0.5'
              }`}
              style={{
                boxShadow:
                  selected === 'plain'
                    ? '0 0 0 2.5px #0D2D24, 0 18px 32px -16px rgba(13,45,36,0.18)'
                    : '0 0 0 1px rgba(13,45,36,0.08), 0 4px 12px -6px rgba(13,45,36,0.08)',
              }}
            >
              <div className="flex items-center gap-4 p-4">
                <div
                  className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #F4F4F1 0%, #DDDDD8 100%)',
                    boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset',
                  }}
                >
                  <span className="font-display font-bold text-2xl text-green">—</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-[15px] leading-tight text-green">
                    Don't know any of these?
                  </div>
                  <div className="text-[12.5px] text-ink-soft mt-0.5">
                    Pick <strong className="text-green">Just sports</strong> — clean, plain English. No show needed.
                  </div>
                </div>
                {selected === 'plain' && (
                  <div className="shrink-0 w-6 h-6 rounded-full bg-green flex items-center justify-center">
                    <svg viewBox="0 0 12 12" width="9" height="9" fill="none">
                      <path d="M2 6.2 L4.8 9 L10 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            </button>

            {/* Just-sports answer for the demo */}
            {/* (Demo data covers it via the LENS_DEMOS array — needs the entry back) */}
          </div>

          {/* Sample chat */}
          <div>
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-muted mb-4 flex items-center justify-between">
              <span>Sample · "What's a sack?"</span>
              <span className="font-display italic font-medium normal-case tracking-normal text-[14px]" style={{ color: lens.accent }}>
                — through {lens.name}
              </span>
            </div>
            <div
              className="rounded-3xl bg-white p-6 relative overflow-hidden"
              style={{
                boxShadow:
                  '0 1px 0 rgba(255,255,255,0.9) inset, ' +
                  '0 0 0 1px rgba(13,45,36,0.06), ' +
                  '0 24px 48px -20px rgba(13,45,36,0.18)',
              }}
            >
              {/* You bubble */}
              <div className="flex justify-end mb-3">
                <div
                  className="max-w-[80%] rounded-[16px] rounded-tr-md text-white text-[14.5px] leading-relaxed px-4 py-2.5"
                  style={{
                    background: 'linear-gradient(135deg, #FF7A52 0%, #FF5723 100%)',
                    boxShadow: '0 4px 12px -4px rgba(255,107,61,0.4)',
                  }}
                >
                  what's a sack?
                </div>
              </div>

              {/* Sportsball reply — keyed to lens.id so React re-mounts on change for fade-in */}
              <div className="flex gap-2 items-start" key={lens.id}>
                <div
                  className="shrink-0 w-8 h-8 rounded-full font-display font-extrabold text-white text-[11px] flex items-center justify-center mt-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #FF6B3D 0%, #E84B7A 100%)',
                    boxShadow: '0 4px 10px -4px rgba(232,75,122,0.4)',
                  }}
                >
                  SB
                </div>
                <div
                  className="max-w-[88%] rounded-[16px] rounded-tl-md text-[14.5px] leading-relaxed text-ink px-4 py-2.5"
                  style={{
                    background: 'linear-gradient(180deg, #FFFFFF 0%, #FBFAF6 100%)',
                    boxShadow:
                      '0 0 0 1px rgba(13,45,36,0.06), 0 6px 16px -8px rgba(13,45,36,0.12)',
                    animation: 'fadeUpLens .55s cubic-bezier(.2,.7,.2,1.05) both',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: lens.answer
                      .replace(/\*\*(.+?)\*\*/g, `<strong style="color:${lens.accent}">$1</strong>`)
                      .replace(/\*(.+?)\*/g, '<em>$1</em>'),
                  }}
                />
              </div>

              {/* Footer hint */}
              <div className="mt-5 pt-4 border-t border-[var(--hairline)] text-[12px] text-muted flex items-center justify-between">
                <span>Click another show — same question, new voice.</span>
                <span style={{ color: lens.accent }} className="font-display italic">↑</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeUpLens {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </section>
  );
}

function FeatureCard({
  href,
  visual,
  title,
  desc,
  ctaLabel = 'Open',
  soon,
}: {
  href?: string;
  visual: React.ReactNode;
  title: string;
  desc: string;
  ctaLabel?: string;
  soon?: boolean;
}) {
  const inner = (
    <div
      className="group h-full bg-white rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
      style={{
        border: '1px solid rgba(13,45,36,0.08)',
        boxShadow: '0 1px 2px rgba(13,45,36,0.04), 0 8px 20px -10px rgba(13,45,36,0.10)',
      }}
    >
      {/* Visual — actual product preview */}
      <div className="relative aspect-[5/3] overflow-hidden">{visual}</div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="font-display font-bold text-[24px] text-green leading-tight tracking-tight">
          {title}
        </h3>
        <p className="mt-1.5 text-[14.5px] text-ink-soft leading-relaxed flex-1">
          {desc}
        </p>
        <div className="mt-5 flex items-center justify-between text-[13px]">
          {soon ? (
            <span className="font-medium text-muted">Coming soon</span>
          ) : (
            <>
              <span className="font-medium text-green">{ctaLabel}</span>
              <span className="font-display italic text-base text-tangerine transition-transform duration-300 group-hover:translate-x-1">
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

/* ======================
   Per-card mini visuals
   ====================== */

function ScanVisual() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: 'radial-gradient(ellipse at center, #2F7A4D 0%, #1F5535 55%, #143C26 100%)',
      }}
    >
      {/* yard lines */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            'repeating-linear-gradient(90deg, transparent 0 24px, rgba(255,255,255,0.4) 24px 25px)',
        }}
      />
      {/* jersey */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative w-14 h-14 rounded-full flex items-center justify-center text-white font-display font-extrabold text-lg"
          style={{
            background: 'linear-gradient(180deg, #C8202A 0%, #861420 100%)',
            boxShadow:
              '0 1px 0 rgba(255,255,255,0.3) inset, 0 0 0 2px rgba(255,255,255,0.85), 0 6px 14px -4px rgba(0,0,0,0.5)',
          }}
        >
          87
        </div>
      </div>
      {/* corner brackets */}
      <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-tangerine" />
      <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-tangerine" />
      <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-tangerine" />
      <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-tangerine" />
      {/* live chip */}
      <div
        className="absolute top-2.5 left-2.5 px-1.5 py-0.5 rounded text-white text-[9px] font-bold tracking-wider flex items-center gap-1"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      >
        <span className="w-1 h-1 rounded-full bg-red-500" />
        KC 24 · DAL 17
      </div>
    </div>
  );
}

function ChatVisual() {
  return (
    <div
      className="absolute inset-0 p-5 flex flex-col justify-end gap-2"
      style={{
        background:
          'linear-gradient(180deg, #FFE5D6 0%, #FCDCE6 100%)',
      }}
    >
      {/* SB bubble */}
      <div
        className="self-start max-w-[80%] rounded-[14px] rounded-tl-md px-3 py-2 text-[12.5px] leading-snug text-ink"
        style={{
          background: '#FFFFFF',
          boxShadow: '0 0 0 1px rgba(13,45,36,0.06), 0 4px 10px -4px rgba(13,45,36,0.08)',
        }}
      >
        spotted travis kelce 👀 he's the one dating taylor
      </div>
      {/* You bubble */}
      <div
        className="self-end max-w-[78%] rounded-[14px] rounded-tr-md px-3 py-2 text-[12.5px] leading-snug text-white"
        style={{
          background: 'linear-gradient(135deg, #FF7A52 0%, #FF5723 100%)',
          boxShadow: '0 4px 10px -4px rgba(255,107,61,0.4)',
        }}
      >
        omg ya what just happened
      </div>
    </div>
  );
}

function LessonsVisual() {
  return (
    <div
      className="absolute inset-0 flex items-end justify-center gap-2 pb-3 px-5"
      style={{
        background: 'linear-gradient(180deg, #DDE7F1 0%, #EEF3F8 100%)',
      }}
    >
      {/* Stack of "lesson spines" */}
      {[
        { tag: 'NFL', tagColor: '#E84B7A', tagBg: 'rgba(232,75,122,0.13)', title: 'The rules', h: '78%' },
        { tag: 'NBA', tagColor: '#2D4ED1', tagBg: 'rgba(45,78,209,0.13)', title: 'Pick & roll', h: '92%' },
        { tag: 'NFL', tagColor: '#E84B7A', tagBg: 'rgba(232,75,122,0.13)', title: 'Fantasy 101', h: '70%' },
      ].map((l, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-xl bg-white p-3 flex flex-col gap-1.5 transition-transform duration-300 hover:-translate-y-1"
          style={{
            height: l.h,
            boxShadow: '0 0 0 1px rgba(13,45,36,0.08), 0 -4px 12px -4px rgba(13,45,36,0.08)',
          }}
        >
          <span
            className="text-[8px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded self-start"
            style={{ color: l.tagColor, background: l.tagBg }}
          >
            {l.tag}
          </span>
          <div className="font-display font-bold text-[12px] text-green leading-tight mt-auto">
            {l.title}
          </div>
        </div>
      ))}
    </div>
  );
}

function VideosVisual() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #DCD0F4 0%, #C9DCEC 100%)',
      }}
    >
      {/* Video frame with play button */}
      <div
        className="relative w-[60%] aspect-[16/9] rounded-lg overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #143C26 0%, #0D2D24 100%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.4), 0 12px 28px -8px rgba(13,45,36,0.3)',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-10 h-10 rounded-full bg-white/95 flex items-center justify-center"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
          >
            <div
              className="w-0 h-0 ml-0.5"
              style={{
                borderLeft: '10px solid #0D2D24',
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
              }}
            />
          </div>
        </div>
        {/* duration chip */}
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[8px] font-bold tracking-wider">
          0:42
        </div>
      </div>
    </div>
  );
}

