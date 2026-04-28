'use client';

/**
 * Tea'd Up — root landing page.
 *
 * 5-scene scroll-driven landing that introduces the brand + 3 features.
 * Color system: white = Scan, cream = BFF, grey = Learn. Tangerine threads through.
 * If user is already onboarded, redirects straight to /scan.
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
    <main style={{ minHeight: '100dvh' }}>
      {/* SCENE 1 — Hero (cream-warm) */}
      <Hero />

      {/* SCENE 2 — Scan (white) */}
      <ScanScene />

      {/* SCENE 3 — BFF (cream-warm, iMessage preview) */}
      <BFFScene />

      {/* SCENE 4 — Learn (light grey) */}
      <LearnScene />

      {/* SCENE 5 — Final CTA (cream-warm) */}
      <FinalCTA />

      {/* Footer */}
      <footer className="px-6 py-8 bg-green-deep text-white text-center" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 2rem)' }}>
        <div className="font-display font-bold text-base tracking-wide">
          Tea'd Up
        </div>
        <div className="font-display italic text-xs text-white/60 mt-1">your sports BFF</div>
        <div className="mt-3 text-[10px] text-white/40 font-mono tracking-widest uppercase">v1.0 · spring 2026 · NFL + NBA</div>
      </footer>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCENE 1 — Hero (cream-warm)
   ──────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section
      className="relative px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 overflow-hidden"
      style={{ background: '#F5F0E5' }}
    >
      {/* Subtle floating elements */}
      <div className="absolute top-8 right-6 text-tangerine text-2xl rotate-12" aria-hidden>✦</div>
      <div className="absolute top-32 left-6 text-tangerine/40 text-lg -rotate-12" aria-hidden>✦</div>

      <div className="max-w-md mx-auto text-center">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-7">
          <svg viewBox="0 0 100 100" width="64" height="64" aria-hidden>
            <path d="M 48 14 Q 46 10 50 6 Q 54 2 50 -2" stroke="#FF6B3D" strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M 26 30 Q 26 70 38 80 L 56 80 Q 68 70 68 30 Z" fill="#0D2D24" />
            <ellipse cx="48" cy="83" rx="20" ry="2.5" fill="#0D2D24" />
            <path d="M 68 38 Q 80 42 80 56 Q 80 66 68 70" stroke="#0D2D24" strokeWidth="3" fill="none" />
            <path d="M 26 30 L 68 30" stroke="#FF6B3D" strokeWidth="1.5" />
            <path d="M 38 30 Q 47 55 38 80" stroke="#FF6B3D" strokeWidth="2" fill="none" />
            <path d="M 56 30 Q 47 55 56 80" stroke="#FF6B3D" strokeWidth="2" fill="none" />
            <path d="M 26 50 Q 47 55 68 50" stroke="#FF6B3D" strokeWidth="2" fill="none" />
          </svg>
          <div className="font-display font-extrabold text-[20px] uppercase tracking-wider text-green mt-3">
            Tea'd Up
          </div>
        </div>

        <h1 className="font-display text-[44px] sm:text-[56px] font-bold text-green leading-[0.95] tracking-tight">
          your sports
          <br />
          <span className="italic font-medium text-tangerine">BFF.</span>
        </h1>

        <p className="mt-5 text-[15.5px] sm:text-[17px] text-ink-soft leading-relaxed max-w-sm mx-auto">
          Scan any player. Get the tea. Plus the rules — confirmed, reported, speculated. <span className="italic text-tangerine">Never guessed.</span>
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/onboarding"
            className="w-full inline-flex items-center justify-center gap-2 bg-tangerine text-white font-semibold rounded-full py-4 text-[15px] hover:bg-tangerine-dark transition shadow-[0_8px_28px_-6px_rgba(255,107,61,0.5)]"
          >
            Get started — free →
          </Link>
          <Link href="/scan" className="text-[13px] text-ink-soft hover:text-ink underline-offset-2 hover:underline">
            or peek at the scan first
          </Link>
        </div>

        <div className="mt-12 flex items-center justify-center gap-3 text-[11px] text-muted">
          <span>NFL + NBA</span>
          <span className="w-1 h-1 rounded-full bg-current" />
          <span>iOS coming</span>
          <span className="w-1 h-1 rounded-full bg-current" />
          <span>4.9 ★</span>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCENE 2 — Scan (white)
   ──────────────────────────────────────────────────────────────── */

function ScanScene() {
  return (
    <section className="relative px-6 py-16 sm:py-24 bg-white border-t border-[var(--hairline)]">
      <div className="max-w-md mx-auto">
        <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">
          ① Scan
        </div>
        <h2 className="font-display text-[36px] sm:text-[42px] font-bold text-green leading-[0.95] tracking-tight">
          Point. ID. <span className="italic text-tangerine">Tea.</span>
        </h2>
        <p className="mt-4 text-[15px] text-ink-soft leading-relaxed">
          Camera, screenshot, or live broadcast. Tea'd Up reads the player and serves the gossip. We never guess.
        </p>

        {/* Viewfinder mockup */}
        <div className="mt-8 mx-auto aspect-square max-w-[260px] relative" aria-hidden>
          <div className="absolute inset-0 rounded-3xl border border-[var(--hairline)] bg-cream-warm/30 overflow-hidden">
            {/* Rule-of-thirds grid */}
            <div className="absolute inset-0">
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-[rgba(13,45,36,0.08)]" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-[rgba(13,45,36,0.08)]" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-[rgba(13,45,36,0.08)]" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-[rgba(13,45,36,0.08)]" />
            </div>
            {/* Corner brackets */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-[2.5px] border-l-[2.5px] border-tangerine" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-[2.5px] border-r-[2.5px] border-tangerine" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-[2.5px] border-l-[2.5px] border-tangerine" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-[2.5px] border-r-[2.5px] border-tangerine" />
            {/* Scan line */}
            <div className="absolute left-3 right-3 h-0.5 bg-tangerine shadow-[0_0_10px_rgba(255,107,61,0.7)]" style={{ animation: 'scanLineLanding 1.8s ease-in-out infinite' }} />
            {/* Center logo */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" width="84" height="84" aria-hidden>
                <path d="M 26 30 Q 26 70 38 80 L 56 80 Q 68 70 68 30 Z" fill="#0D2D24" />
                <ellipse cx="48" cy="83" rx="20" ry="2.5" fill="#0D2D24" />
                <path d="M 68 38 Q 80 42 80 56 Q 80 66 68 70" stroke="#0D2D24" strokeWidth="3" fill="none" />
                <path d="M 26 30 L 68 30" stroke="#FF6B3D" strokeWidth="1.5" />
                <path d="M 38 30 Q 47 55 38 80" stroke="#FF6B3D" strokeWidth="2" fill="none" />
                <path d="M 56 30 Q 47 55 56 80" stroke="#FF6B3D" strokeWidth="2" fill="none" />
                <path d="M 26 50 Q 47 55 68 50" stroke="#FF6B3D" strokeWidth="2" fill="none" />
              </svg>
            </div>
          </div>
        </div>

        {/* 3 confirmation tier pills as proof points */}
        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#E8F0EC', color: '#0F6E56' }}>Confirmed</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#E6F1FB', color: '#185FA5' }}>Reported</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#FAEEDA', color: '#854F0B' }}>Speculation</span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider" style={{ background: '#F1EFE8', color: '#5F5E5A' }}>Rumor</span>
        </div>
        <p className="mt-3 text-[12px] text-muted text-center italic">
          Every drama claim ships with a confirmation tier. Sourced. Hedged. Never guessed.
        </p>

        <div className="mt-8 text-center">
          <Link href="/scan" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-tangerine hover:underline">
            Try the scan now →
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes scanLineLanding {
          0% { top: 8px; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: calc(100% - 10px); opacity: 0; }
        }
      `}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCENE 3 — BFF chat (cream-warm, iMessage preview)
   ──────────────────────────────────────────────────────────────── */

function BFFScene() {
  return (
    <section className="relative px-6 py-16 sm:py-24" style={{ background: '#F5F0E5' }}>
      <div className="max-w-md mx-auto">
        <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">
          ② BFF
        </div>
        <h2 className="font-display text-[36px] sm:text-[42px] font-bold text-green leading-[0.95] tracking-tight">
          The friend with <span className="italic text-tangerine">the tea.</span>
        </h2>
        <p className="mt-4 text-[15px] text-ink-soft leading-relaxed">
          Ask anything about any team. Drill into any storyline. Drama, on-field narratives, and the rules — your way.
        </p>

        {/* Mocked-up iMessage preview */}
        <div className="mt-8 bg-white rounded-3xl p-5 border border-[var(--hairline)] shadow-[0_12px_32px_-12px_rgba(13,45,36,0.12)]">
          <div className="text-center mb-4 text-[10px] tracking-wider uppercase text-muted font-mono">
            iMessage · today 8:14 PM
          </div>
          <div className="flex flex-col gap-2.5">
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="px-4 py-2.5 text-white text-[14.5px] max-w-[78%]" style={{ background: 'linear-gradient(180deg, #FF7A52 0%, #FF5723 100%)', borderRadius: 20, borderBottomRightRadius: 6 }}>
                what's the embiid drama
              </div>
            </div>
            {/* BFF bubble */}
            <div className="flex">
              <div className="px-4 py-2.5 text-ink text-[14px] max-w-[88%]" style={{ background: '#F1EFE8', borderRadius: 20, borderBottomLeftRadius: 6 }}>
                <span className="inline-flex items-center px-1.5 py-px rounded-full text-[8px] font-semibold uppercase tracking-wider mr-1.5" style={{ background: '#FAEEDA', color: '#854F0B' }}>Speculation</span>
                <span>Locker-room sources hint Embiid considered a trade request in March. Sixers brass denied it on the record.</span>
              </div>
            </div>
            {/* User bubble */}
            <div className="flex justify-end">
              <div className="px-4 py-2.5 text-white text-[14.5px] max-w-[78%]" style={{ background: 'linear-gradient(180deg, #FF7A52 0%, #FF5723 100%)', borderRadius: 20, borderBottomRightRadius: 6 }}>
                wait who told you this
              </div>
            </div>
            {/* BFF bubble with tier */}
            <div className="flex">
              <div className="px-4 py-2.5 text-ink text-[14px] max-w-[88%]" style={{ background: '#F1EFE8', borderRadius: 20, borderBottomLeftRadius: 6 }}>
                <span className="inline-flex items-center px-1.5 py-px rounded-full text-[8px] font-semibold uppercase tracking-wider mr-1.5" style={{ background: '#E6F1FB', color: '#185FA5' }}>Reported</span>
                <span>The Athletic ran it April 3, citing 'people familiar with the matter.' Solo source, so it stays Reported, not Confirmed. ☕</span>
              </div>
            </div>
            {/* Read receipt */}
            <div className="text-right text-[10px] text-muted mt-1">Read · 8:15 PM</div>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-display text-[26px] font-bold text-green leading-none">200+</div>
            <div className="text-[10px] text-muted uppercase tracking-wider mt-1">players</div>
          </div>
          <div>
            <div className="font-display text-[26px] font-bold text-green leading-none">85</div>
            <div className="text-[10px] text-muted uppercase tracking-wider mt-1">storylines</div>
          </div>
          <div>
            <div className="font-display text-[26px] font-bold text-green leading-none">4</div>
            <div className="text-[10px] text-muted uppercase tracking-wider mt-1">tiers</div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/chat" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-tangerine hover:underline">
            Open the chat →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCENE 4 — Learn (light grey)
   ──────────────────────────────────────────────────────────────── */

function LearnScene() {
  return (
    <section className="relative px-6 py-16 sm:py-24 border-t border-[var(--hairline)]" style={{ background: '#ECEAE3' }}>
      <div className="max-w-md mx-auto">
        <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">
          ③ Learn
        </div>
        <h2 className="font-display text-[36px] sm:text-[42px] font-bold text-green leading-[0.95] tracking-tight">
          Learn the league. <span className="italic text-tangerine">5 minutes</span> at a time.
        </h2>
        <p className="mt-4 text-[15px] text-ink-soft leading-relaxed">
          Bite-sized lessons. Glossary in plain English. Plus Euphoria mode (more shows soon).
        </p>

        {/* 3 minimalist lesson cards */}
        <div className="mt-7 space-y-2.5">
          {[
            { league: 'NFL', title: 'Football, in 5 minutes', sub: 'the rules, in plain english', color: '#E84B7A' },
            { league: 'NBA', title: 'Basketball, in 5 minutes', sub: 'shot clock, fouls, & vibes', color: '#2D4ED1' },
            { league: 'BOTH', title: 'The salary cap, decoded', sub: 'why your team can\'t just sign anyone', color: '#FBB731' },
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
        </div>

        {/* Euphoria callout */}
        <div className="mt-6 bg-white rounded-2xl p-4 border border-[var(--hairline)] flex items-center gap-3">
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
            <div className="text-[11.5px] text-ink-soft italic mt-0.5">tunnel fits as armor · more shows coming</div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/learn" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-tangerine hover:underline">
            Start a lesson →
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SCENE 5 — Final CTA (cream-warm)
   ──────────────────────────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="relative px-6 py-20 sm:py-28 text-center overflow-hidden" style={{ background: '#F5F0E5' }}>
      <div className="absolute top-12 left-12 text-tangerine/30 text-3xl rotate-12" aria-hidden>✦</div>
      <div className="absolute bottom-12 right-12 text-tangerine/30 text-3xl -rotate-12" aria-hidden>✦</div>

      <div className="max-w-md mx-auto">
        <h2 className="font-display text-[34px] sm:text-[40px] font-bold text-green leading-[1.05] tracking-tight">
          Built for the group chat that just wants to <span className="italic text-tangerine">keep up.</span>
        </h2>

        <Link
          href="/onboarding"
          className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-tangerine text-white font-semibold rounded-full py-4 text-[15px] hover:bg-tangerine-dark transition shadow-[0_8px_28px_-6px_rgba(255,107,61,0.5)]"
        >
          Get started — free →
        </Link>

        <p className="mt-4 text-[12px] text-muted">
          NFL + NBA. iOS coming. Free during beta.
        </p>
      </div>
    </section>
  );
}
