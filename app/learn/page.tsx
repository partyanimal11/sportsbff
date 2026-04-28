'use client';

/**
 * Tea'd Up — Learn tab.
 *
 * Three sections: Lessons / Glossary / Lens (Euphoria toggle).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BottomTabs, BottomTabsSpacer } from '@/components/BottomTabs';
import { listLessonsForLibrary } from '@/lib/lessons';
import { getProfile, setProfile } from '@/lib/profile';
import glossaryData from '@/data/glossary.json';

type GlossaryEntry = {
  term: string;
  league: 'nfl' | 'nba' | 'both';
  plain_definition: string;
  lens_flavors?: Record<string, string>;
};

export default function LearnPage() {
  const [tab, setTab] = useState<'lessons' | 'glossary' | 'lens'>('lessons');
  const [mounted, setMounted] = useState(false);
  const [euphoriaEnabled, setEuphoriaEnabled] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEuphoriaEnabled(!!getProfile().euphoriaLensEnabled);
  }, []);

  function toggleEuphoria() {
    const next = !euphoriaEnabled;
    setEuphoriaEnabled(next);
    setProfile({ euphoriaLensEnabled: next });
  }

  return (
    <main className="min-h-screen flex flex-col bg-cream-warm" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-md mx-auto">
          <h1 className="font-display text-[36px] font-bold text-green leading-tight tracking-tight">Learn</h1>
          <p className="mt-1.5 text-[14px] text-ink-soft italic">5 minutes a day. From clueless to confident.</p>
        </div>
      </header>

      {/* Sub-tabs */}
      <div className="px-4 sm:px-6 mb-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-full border border-[var(--hairline)] p-1 flex">
            {(['lessons', 'glossary', 'lens'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2 text-[13px] font-semibold rounded-full transition ${
                  tab === t ? 'bg-tangerine text-white shadow-sm' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {t === 'lens' ? 'Lens' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="flex-1 px-4 sm:px-6">
        <div className="max-w-md mx-auto pb-4">
          {tab === 'lessons' && <LessonsList />}
          {tab === 'glossary' && mounted && <GlossaryList euphoriaEnabled={euphoriaEnabled} />}
          {tab === 'lens' && mounted && <LensSection enabled={euphoriaEnabled} onToggle={toggleEuphoria} />}
        </div>
      </section>

      <BottomTabsSpacer />
      <BottomTabs />
    </main>
  );
}

function LessonsList() {
  const lessons = listLessonsForLibrary();
  return (
    <div className="space-y-3">
      {lessons.map((lesson) => (
        <Link
          key={lesson.slug}
          href={`/lessons/${lesson.slug}`}
          className="group block bg-white border border-[var(--hairline)] rounded-2xl p-5 shadow-[0_8px_24px_-12px_rgba(13,45,36,0.10)] hover:-translate-y-0.5 transition"
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-md ${
                lesson.league === 'nfl' ? 'bg-magenta/10 text-magenta' : 'bg-sapphire/10 text-sapphire'
              }`}
            >
              {lesson.league.toUpperCase()}
            </span>
            <span className="text-[11px] text-muted">{lesson.minutes} min · {lesson.difficulty}</span>
          </div>
          <h3 className="font-display font-bold text-[19px] text-green leading-snug">{lesson.title}</h3>
          <p className="mt-1 text-[13.5px] text-ink-soft italic">{lesson.subtitle}</p>
          <div className="mt-3 text-[12px] text-tangerine font-semibold opacity-0 group-hover:opacity-100 transition">
            Start →
          </div>
        </Link>
      ))}
    </div>
  );
}

function GlossaryList({ euphoriaEnabled }: { euphoriaEnabled: boolean }) {
  const [search, setSearch] = useState('');
  const entries = Object.entries(glossaryData as Record<string, GlossaryEntry>);
  const filtered = search
    ? entries.filter(([id, g]) => g.term.toLowerCase().includes(search.toLowerCase()) || g.plain_definition.toLowerCase().includes(search.toLowerCase()))
    : entries;

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search terms…"
        className="w-full bg-white border border-[var(--hairline)] rounded-full px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-tangerine/30 mb-3"
      />
      <div className="space-y-2.5">
        {filtered.map(([id, g]) => (
          <div key={id} className="bg-white border border-[var(--hairline)] rounded-2xl p-4 shadow-[0_4px_16px_-10px_rgba(13,45,36,0.08)]">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-[16px] text-green">{g.term}</h3>
              <span className="text-[9px] font-bold tracking-widest uppercase text-muted bg-cream-warm px-1.5 py-0.5 rounded">
                {g.league === 'both' ? 'NFL · NBA' : g.league.toUpperCase()}
              </span>
            </div>
            <p className="text-[13.5px] text-ink leading-relaxed">{g.plain_definition}</p>
            {euphoriaEnabled && g.lens_flavors?.euphoria && (
              <div className="mt-2.5 pt-2.5 border-t border-[var(--hairline)]">
                <div className="text-[9px] font-bold tracking-widest uppercase text-lilac mb-1">
                  ✨ Through Euphoria
                </div>
                <p className="text-[13px] italic text-ink-soft leading-relaxed">{g.lens_flavors.euphoria}</p>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-muted py-8 text-sm">No terms match "{search}".</p>
        )}
      </div>
    </div>
  );
}

function LensSection({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <div>
      <div className="bg-white border border-[var(--hairline)] rounded-2xl p-5 shadow-[0_8px_24px_-12px_rgba(13,45,36,0.10)]">
        <div className="flex items-start gap-4">
          <div
            className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center font-display font-extrabold text-2xl"
            style={{
              background: 'linear-gradient(135deg, #DCD0F4 0%, #4A2D6B 200%)',
              color: '#4A2D6B',
              boxShadow: '0 0 0 3px #4A2D6B, 0 14px 32px -10px rgba(13,45,36,0.18)',
            }}
          >
            E
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-[18px] text-green leading-tight">
              Through Euphoria
            </div>
            <div className="text-[11px] font-bold tracking-widest uppercase text-muted mt-0.5">
              NBA · NFL
            </div>
            <p className="mt-2 text-[13.5px] text-ink-soft leading-relaxed">
              Slow zooms. Tunnel fits as armor. Every locker room a Maddy/Cassie standoff. When ON, lessons + glossary entries get a cinematic Euphoria voice.
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`w-full mt-4 inline-flex items-center justify-center gap-2 rounded-full py-3 text-[14px] font-semibold transition ${
            enabled ? 'bg-tangerine text-white' : 'bg-cream-warm border border-[var(--hairline)] text-ink hover:bg-white'
          }`}
        >
          {enabled ? '✓ Euphoria ON — slow zoom' : 'Turn on Euphoria lens'}
        </button>
      </div>

      <p className="mt-5 text-[12px] text-muted text-center px-4">
        More show lenses are coming. For now, only Euphoria.
      </p>
    </div>
  );
}
