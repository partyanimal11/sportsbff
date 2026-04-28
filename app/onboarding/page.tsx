'use client';

/**
 * Tea'd Up — Welcome intake (2 screens: league + name).
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setProfile } from '@/lib/profile';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [league, setLeague] = useState<'nfl' | 'nba' | 'both'>('both');
  const [name, setName] = useState('');

  function finish() {
    setProfile({
      league,
      lens: 'plain',
      displayName: name.trim() || undefined,
      defaultModes: ['drama'],
      onboardedAt: new Date().toISOString(),
      firstSeenAt: new Date().toISOString(),
    });
    router.push('/scan');
  }

  return (
    <main className="min-h-screen flex flex-col bg-white" style={{ minHeight: '100dvh' }}>
      <header className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="font-display text-base sm:text-lg font-extrabold text-green tracking-wide shrink-0">
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        <div className="flex gap-1.5">
          {[1, 2].map((i) => (
            <span
              key={i}
              className={`w-6 h-1 rounded-full transition ${
                i <= step ? 'bg-tangerine' : 'bg-[var(--hairline)]'
              }`}
            />
          ))}
        </div>
      </header>

      {/* PAGE X/2 status chip */}
      <div className="px-4 sm:px-6 mb-2 flex justify-center">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest"
          style={{ background: '#1C1108', color: '#FF8B4D', fontFamily: 'monospace' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF8B4D] animate-pulse" />
          PAGE {step}/2
        </span>
      </div>

      <section className="flex-1 px-4 sm:px-6 py-6">
        <div className="max-w-md mx-auto">
          {step === 1 && (
            <div>
              <h1 className="font-display text-[34px] sm:text-[36px] font-bold text-green leading-tight tracking-tight">
                Which league?
              </h1>
              <p className="mt-2 text-[15px] text-ink-soft italic">(or both — there's no wrong answer)</p>

              <div className="mt-6 space-y-3">
                {[
                  { id: 'nfl' as const, label: 'NFL only', sub: '32 teams · Sundays', emoji: '🏈' },
                  { id: 'nba' as const, label: 'NBA only', sub: '30 teams · 82 games', emoji: '🏀' },
                  { id: 'both' as const, label: 'Both, please', sub: 'Recommended · the full year of tea', emoji: '✨' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLeague(l.id)}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition flex items-center gap-3 ${
                      league === l.id
                        ? 'border-tangerine bg-white shadow-[0_4px_16px_-4px_rgba(255,107,61,0.3)]'
                        : 'border-[var(--hairline)] bg-white hover:border-ink-soft'
                    }`}
                  >
                    <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                      league === l.id ? 'bg-tangerine text-white' : 'bg-white text-ink'
                    }`}>
                      {l.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-bold text-[18px] text-green">{l.label}</div>
                      <div className="text-[12.5px] text-ink-soft">{l.sub}</div>
                    </div>
                    {league === l.id && (
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-tangerine shrink-0" aria-hidden>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                className="mt-8 w-full inline-flex items-center justify-center gap-2 bg-tangerine text-white font-semibold rounded-full py-4 text-[15px] hover:bg-tangerine-dark transition shadow-[0_4px_16px_-4px_rgba(255,107,61,0.4)]"
              >
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="font-display text-[34px] sm:text-[36px] font-bold text-green leading-tight tracking-tight">
                What should I call you?
              </h1>
              <p className="mt-2 text-[15px] text-ink-soft italic">Just for the chat. You can skip this.</p>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="type your name..."
                className="mt-6 w-full bg-white border-2 border-[var(--hairline)] rounded-full px-5 py-4 text-[16px] focus:outline-none focus:border-tangerine focus:ring-4 focus:ring-tangerine/10"
                autoComplete="given-name"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') finish(); }}
              />

              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={finish}
                  className="w-full inline-flex items-center justify-center gap-2 bg-tangerine text-white font-semibold rounded-full py-4 text-[15px] hover:bg-tangerine-dark transition shadow-[0_4px_16px_-4px_rgba(255,107,61,0.4)]"
                >
                  Take me in →
                </button>
                <button onClick={() => setStep(1)} className="text-[13px] text-ink-soft hover:text-ink">
                  ← Back
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
