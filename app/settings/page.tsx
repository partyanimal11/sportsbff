'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { listLenses, DEFAULT_LENS_ID, ALL_VOICES, VOICE_DESCRIPTIONS, getVoiceForLens, type OpenAIVoice } from '@/lib/lens';
import { clearProfile, getProfile, setProfile, type Profile } from '@/lib/profile';

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setLocalProfile] = useState<Profile>({ lens: DEFAULT_LENS_ID });
  const [name, setName] = useState('');
  const lenses = listLenses();

  useEffect(() => {
    setMounted(true);
    const p = getProfile();
    setLocalProfile(p);
    setName(p.displayName ?? '');
  }, []);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    const next = { ...profile, [key]: value };
    setLocalProfile(next);
    setProfile({ [key]: value });
  }

  function reset() {
    if (!confirm('Clear your profile and start over? Your chat history is not affected.')) return;
    clearProfile();
    router.push('/onboarding');
  }

  if (!mounted) {
    // Avoid hydration mismatch — render a minimal shell until localStorage is read.
    return (
      <main className="min-h-screen bg-white">
        <header className="px-6 md:px-8 py-3 border-b border-[var(--hairline)] flex items-center justify-between bg-white">
          <Link href="/" className="font-display text-xl font-extrabold text-green tracking-wide uppercase">
            SPORTS<span className="text-tangerine">★</span>BFF
          </Link>
        </header>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <header className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 border-b border-[var(--hairline)] flex items-center justify-between gap-2 bg-white sticky top-0 z-10">
        <Link href="/" className="font-display text-base sm:text-xl font-extrabold text-green tracking-wide uppercase shrink-0">
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        <Link href="/chat" className="text-[13px] sm:text-sm text-ink-soft hover:text-ink shrink-0">← Back to chat</Link>
      </header>

      <section className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-[36px] sm:text-5xl font-bold text-green leading-tight tracking-tight">
            Settings.
          </h1>
          <p className="mt-2 sm:mt-3 text-[15px] sm:text-lg text-ink-soft">
            All saved locally for now — Supabase auth wires in beta.
          </p>

          {/* Display name */}
          <section className="mt-8 sm:mt-10">
            <label className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-tangerine">
              Display name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => update('displayName', name.trim() || undefined)}
              placeholder="What should we call you?"
              className="mt-2 w-full bg-white border border-[var(--hairline)] rounded-full px-4 sm:px-5 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-tangerine/30"
              autoComplete="given-name"
            />
          </section>

          {/* League */}
          <section className="mt-8 sm:mt-10">
            <label className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-tangerine">
              Sport
            </label>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(['nfl', 'nba', 'both'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => update('league', l)}
                  className={`text-center rounded-xl border p-3 sm:p-4 transition ${
                    profile.league === l
                      ? 'border-tangerine bg-tangerine/5 shadow-soft'
                      : 'border-[var(--hairline)] bg-white hover:border-ink-soft'
                  }`}
                >
                  <div className="font-display font-bold text-[15px] sm:text-base text-green uppercase">
                    {l === 'both' ? 'Both' : l.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Lens */}
          <section className="mt-8 sm:mt-10">
            <label className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-tangerine">
              Show lens
            </label>
            <p className="mt-2 text-[13px] sm:text-sm text-ink-soft">
              Your chat answers and lesson examples speak this show's language.
            </p>
            <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
              {lenses.map((l) => {
                const isActive = profile.lens === l.id;
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
                    onClick={() => update('lens', l.id)}
                    className={`group relative rounded-xl overflow-hidden bg-white text-left transition-all duration-200 ${
                      isActive
                        ? 'shadow-lift -translate-y-0.5'
                        : 'shadow-soft hover:shadow-lift hover:-translate-y-0.5 border border-[var(--hairline)]'
                    }`}
                    style={isActive ? { boxShadow: `0 0 0 2.5px ${l.accent_color}, 0 14px 32px -10px rgba(13,45,36,0.18)` } : {}}
                  >
                    <div
                      className="relative aspect-[3/4] flex items-center justify-center overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${l.card_color} 0%, ${l.accent_color} 200%)` }}
                    >
                      <span
                        className="font-display font-bold text-4xl tracking-tight"
                        style={{ color: l.accent_color, textShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      >
                        {initials}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <div className="font-display font-bold text-[13px] leading-tight text-green truncate">
                        {l.name}
                      </div>
                      <div className="text-[9px] font-bold tracking-widest uppercase mt-0.5 text-muted">
                        {l.league_bias ?? 'Both'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Voice */}
          <section className="mt-8 sm:mt-10">
            <label className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-tangerine">
              Voice
            </label>
            <p className="mt-2 text-[13px] sm:text-sm text-ink-soft">
              Have your sportsBFF read answers aloud. Voice mode requires an OpenAI key on the server.
            </p>

            {/* Auto-play toggle */}
            <div className="mt-4 flex items-center justify-between gap-4 bg-cream-warm border border-[var(--hairline)] rounded-2xl p-4">
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[15px] text-green">Auto-play</div>
                <div className="text-[12.5px] text-ink-soft mt-0.5">
                  Every BFF response reads aloud after streaming finishes.
                </div>
              </div>
              <button
                type="button"
                onClick={() => update('autoPlayVoice', !profile.autoPlayVoice)}
                aria-label={profile.autoPlayVoice ? 'Turn auto-play off' : 'Turn auto-play on'}
                className={`shrink-0 relative w-12 h-7 rounded-full transition-colors ${
                  profile.autoPlayVoice ? 'bg-tangerine' : 'bg-[var(--hairline)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    profile.autoPlayVoice ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Voice picker */}
            <div className="mt-4">
              <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Voice
              </label>
              <select
                className="mt-2 w-full bg-white border border-[var(--hairline)] rounded-full px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-tangerine/30"
                value={profile.voiceOverride ?? ''}
                onChange={(e) => update('voiceOverride', (e.target.value || undefined) as Profile['voiceOverride'])}
              >
                <option value="">Use lens default ({getVoiceForLens(profile.lens ?? 'plain')})</option>
                {ALL_VOICES.map((v) => (
                  <option key={v} value={v}>
                    {v} — {VOICE_DESCRIPTIONS[v as OpenAIVoice]}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-[12.5px] text-ink-soft">
                Each show lens has a default voice that fits its persona. Override here if you want a different one for every answer.
              </p>
            </div>
          </section>

          {/* Danger zone */}
          <section className="mt-12 pt-8 border-t border-[var(--hairline)]">
            <label className="text-xs font-bold tracking-widest uppercase text-burgundy">
              Reset
            </label>
            <p className="mt-2 text-sm text-ink-soft">
              Clears your saved profile (lens, league, name) and sends you back through onboarding.
            </p>
            <button
              onClick={reset}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-burgundy border border-burgundy/30 hover:bg-burgundy hover:text-white transition"
            >
              Clear profile
            </button>
          </section>

          <div className="mt-12 text-center">
            <Link href="/chat" className="btn btn-primary">Back to chat →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
