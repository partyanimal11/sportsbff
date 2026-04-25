'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listLenses } from '@/lib/lens';
import { setProfile } from '@/lib/profile';

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [league, setLeague] = useState<'nfl' | 'nba' | 'both'>('both');
  const [lens, setLens] = useState<string>('gossip-girl');
  const [name, setName] = useState<string>('');

  const lenses = listLenses();

  function finish() {
    setProfile({
      league,
      lens,
      displayName: name.trim() || undefined,
      onboardedAt: new Date().toISOString(),
    });
    router.push('/chat');
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-8 py-4 border-b border-[var(--hairline)] flex items-center justify-between bg-white">
        <Link href="/" className="font-display text-xl font-extrabold text-green tracking-wide uppercase">
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`w-8 h-1 rounded-full transition ${
                i <= step ? 'bg-tangerine' : 'bg-[var(--hairline)]'
              }`}
            />
          ))}
        </div>
      </header>

      <section className="flex-1 px-6 py-12 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Step 1 — League */}
          {step === 1 && (
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-tangerine mb-3">Step 1 of 3</p>
              <h1 className="font-display text-5xl font-bold text-green leading-tight tracking-tight">
                Which sport?
              </h1>
              <p className="mt-3 text-lg text-ink-soft">Pick one. We can add the other anytime.</p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'nfl', label: 'NFL only', desc: '32 teams · Sunday is the day' },
                  { id: 'nba', label: 'NBA only', desc: '30 teams · 82 games a season' },
                  { id: 'both', label: 'Both, please', desc: 'Why choose · Recommended' },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLeague(l.id as any)}
                    className={`text-left rounded-2xl border p-5 transition ${
                      league === l.id
                        ? 'border-tangerine bg-tangerine/5 shadow-soft'
                        : 'border-[var(--hairline)] bg-white hover:border-ink-soft'
                    }`}
                  >
                    <div className="font-display font-bold text-xl text-green">{l.label}</div>
                    <div className="mt-1 text-sm text-ink-soft">{l.desc}</div>
                  </button>
                ))}
              </div>

              <div className="mt-10 flex justify-end">
                <button className="btn btn-primary" onClick={() => setStep(2)}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Lens */}
          {step === 2 && (
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-tangerine mb-3">Step 2 of 3</p>
              <h1 className="font-display text-5xl font-bold text-green leading-tight tracking-tight">
                Pick a show <span className="italic font-medium text-tangerine">you already love.</span>
              </h1>
              <p className="mt-3 text-lg text-ink-soft">
                Your chat answers and lesson examples will start speaking that show's language. Change it anytime.
              </p>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                {lenses.map((l) => {
                  const isActive = lens === l.id;
                  const initials = l.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setLens(l.id)}
                      className={`group relative rounded-2xl overflow-hidden bg-white text-left transition-all duration-200 ${
                        isActive
                          ? 'shadow-lift -translate-y-1'
                          : 'shadow-soft hover:shadow-lift hover:-translate-y-0.5 border border-[var(--hairline)]'
                      }`}
                      style={
                        isActive
                          ? { boxShadow: `0 0 0 3px ${l.accent_color}, 0 28px 56px -16px rgba(13,45,36,0.16)` }
                          : {}
                      }
                    >
                      {/* Poster art */}
                      <div
                        className="relative aspect-[3/4] flex items-center justify-center overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${l.card_color} 0%, ${l.accent_color} 200%)`,
                        }}
                      >
                        <span
                          className="font-display font-bold text-5xl tracking-tight transition-transform duration-300 group-hover:scale-110"
                          style={{
                            color: l.accent_color,
                            textShadow: '0 2px 8px rgba(0,0,0,0.08)',
                          }}
                        >
                          {initials}
                        </span>
                        {/* Subtle paper grain */}
                        <div className="absolute inset-0 mix-blend-overlay opacity-30 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                          }}
                        />
                        {/* Active checkmark */}
                        {isActive && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <svg viewBox="0 0 12 12" width="11" height="11" fill="none">
                              <path d="M2 6.2 L4.8 9 L10 3.5" stroke={l.accent_color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <div className="font-display font-bold text-[15px] leading-tight text-green truncate">
                          {l.name}
                        </div>
                        <div className="text-[10px] font-bold tracking-widest uppercase mt-1 text-muted">
                          {l.league_bias ?? 'Both'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-10 flex justify-between items-center">
                <button className="text-sm text-ink-soft" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button className="btn btn-primary" onClick={() => setStep(3)}>
                  Next →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Name */}
          {step === 3 && (
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-tangerine mb-3">Step 3 of 3</p>
              <h1 className="font-display text-5xl font-bold text-green leading-tight tracking-tight">
                What should we <span className="italic font-medium text-tangerine">call you?</span>
              </h1>
              <p className="mt-3 text-lg text-ink-soft">Optional. We'll just use it in the chat header.</p>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional)"
                className="mt-8 w-full bg-white border border-[var(--hairline)] rounded-full px-6 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-tangerine/30"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finish();
                }}
              />

              <div className="mt-10 flex justify-between items-center">
                <button className="text-sm text-ink-soft" onClick={() => setStep(2)}>
                  ← Back
                </button>
                <button className="btn btn-primary" onClick={finish}>
                  Take me in →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
