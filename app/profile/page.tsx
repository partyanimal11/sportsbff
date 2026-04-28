'use client';

/**
 * Tea'd Up — Profile tab.
 *
 * Display name + league + default modes + voice prefs + Euphoria toggle + reset.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BottomTabs, BottomTabsSpacer } from '@/components/BottomTabs';
import { ModeToggle, type Mode } from '@/components/ModeToggle';
import { ALL_VOICES, VOICE_DESCRIPTIONS, type OpenAIVoice } from '@/lib/lens';
import { clearProfile, getProfile, setProfile, type Profile } from '@/lib/profile';

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [profile, setLocalProfile] = useState<Profile>({
    lens: 'plain',
    dramaMode: false,
    autoPlayVoice: false,
    defaultModes: ['drama'],
    euphoriaLensEnabled: false,
  });
  const [name, setName] = useState('');

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
    if (!confirm('Clear your profile and start over?')) return;
    clearProfile();
    router.push('/onboarding');
  }

  if (!mounted) {
    return <main className="min-h-screen bg-white" />;
  }

  return (
    <main className="min-h-screen flex flex-col bg-white" style={{ minHeight: '100dvh' }}>
      <header className="px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-md mx-auto">
          <h1 className="font-display text-[36px] font-bold text-green leading-tight tracking-tight">Profile</h1>
          <p className="mt-1.5 text-[14px] text-ink-soft italic">All saved on your device. Nothing leaves.</p>
        </div>
      </header>

      <section className="flex-1 px-4 sm:px-6">
        <div className="max-w-md mx-auto space-y-5">
          {/* Display name */}
          <div>
            <label className="text-[11px] font-bold tracking-widest uppercase text-tangerine">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => update('displayName', name.trim() || undefined)}
              placeholder="What should we call you?"
              className="mt-2 w-full bg-white border border-[var(--hairline)] rounded-full px-4 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-tangerine/30"
              autoComplete="given-name"
            />
          </div>

          {/* League */}
          <div>
            <label className="text-[11px] font-bold tracking-widest uppercase text-tangerine">Sport</label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(['nfl', 'nba', 'both'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => update('league', l)}
                  className={`rounded-xl border p-3 transition ${
                    profile.league === l
                      ? 'border-tangerine bg-tangerine/5 shadow-[0_4px_12px_-4px_rgba(255,107,61,0.3)]'
                      : 'border-[var(--hairline)] bg-white hover:border-ink-soft'
                  }`}
                >
                  <div className="font-display font-bold text-[15px] text-green uppercase">
                    {l === 'both' ? 'Both' : l.toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Default modes */}
          <div>
            <label className="text-[11px] font-bold tracking-widest uppercase text-tangerine">Default modes</label>
            <p className="mt-1 text-[12.5px] text-ink-soft">Which modes pre-on when scan/chat opens.</p>
            <div className="mt-3 flex justify-start">
              <ModeToggle
                active={(profile.defaultModes as Mode[]) ?? ['drama']}
                onChange={(next) => update('defaultModes', next)}
                size="md"
              />
            </div>
          </div>

          {/* Voice */}
          <div className="bg-white rounded-2xl border border-[var(--hairline)] p-4 shadow-[0_4px_16px_-10px_rgba(13,45,36,0.08)]">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[15px] text-green">Auto-play voice</div>
                <div className="text-[12px] text-ink-soft mt-0.5">Every BFF response reads aloud after streaming.</div>
              </div>
              <button
                onClick={() => update('autoPlayVoice', !profile.autoPlayVoice)}
                aria-label="Toggle auto-play"
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
            <label className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">Voice</label>
            <select
              className="mt-1.5 w-full bg-white border border-[var(--hairline)] rounded-full px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-tangerine/30"
              value={profile.voiceOverride ?? ''}
              onChange={(e) => update('voiceOverride', (e.target.value || undefined) as Profile['voiceOverride'])}
            >
              <option value="">Default (nova)</option>
              {ALL_VOICES.map((v) => (
                <option key={v} value={v}>
                  {v} — {VOICE_DESCRIPTIONS[v as OpenAIVoice]}
                </option>
              ))}
            </select>
          </div>

          {/* Euphoria lens */}
          <div className="bg-white rounded-2xl border border-[var(--hairline)] p-4 shadow-[0_4px_16px_-10px_rgba(13,45,36,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[15px] text-green flex items-center gap-1.5">
                  ✨ Euphoria lens
                </div>
                <div className="text-[12px] text-ink-soft mt-0.5">Cinematic show voice in Learn mode.</div>
              </div>
              <button
                onClick={() => update('euphoriaLensEnabled', !profile.euphoriaLensEnabled)}
                aria-label="Toggle Euphoria lens"
                className={`shrink-0 relative w-12 h-7 rounded-full transition-colors ${
                  profile.euphoriaLensEnabled ? 'bg-lilac' : 'bg-[var(--hairline)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    profile.euphoriaLensEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Reset */}
          <div className="pt-4 border-t border-[var(--hairline)]">
            <button
              onClick={reset}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold text-burgundy border border-burgundy/30 hover:bg-burgundy hover:text-white transition"
            >
              Clear profile
            </button>
          </div>
        </div>
      </section>

      <BottomTabsSpacer />
      <BottomTabs />
    </main>
  );
}
