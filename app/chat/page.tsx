'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { listLenses, DEFAULT_LENS_ID, getLens } from '@/lib/lens';
import { getProfile, setProfile } from '@/lib/profile';
import { Markdown } from '@/lib/markdown';
import { PROMPT_LIBRARY, STARTER_PROMPTS } from '@/lib/prompts';
import { PlayerOverlayContext } from '@/lib/player-overlay-context';
import { PlayerOverlay } from '@/components/PlayerOverlay';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ChatPage />
    </Suspense>
  );
}

function ChatPage() {
  const [lens, setLens] = useState<string>(DEFAULT_LENS_ID);
  const [displayName, setDisplayName] = useState<string>('');
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [dramaMode, setDramaMode] = useState<boolean>(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [overlayPlayer, setOverlayPlayer] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lenses = listLenses();
  const lensInfo = getLens(lens);
  const searchParams = useSearchParams();

  // Hydrate from localStorage on mount + auto-send any ?seed= prompt
  useEffect(() => {
    const p = getProfile();
    setLens(p.lens);
    setDramaMode(!!p.dramaMode);
    if (p.displayName) setDisplayName(p.displayName);

    const seed = searchParams.get('seed');
    if (seed && messages.length === 0) {
      setTimeout(() => send(seed), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleDrama() {
    const next = !dramaMode;
    setDramaMode(next);
    setProfile({ dramaMode: next });
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  // Lock body scroll when browse panel is open
  useEffect(() => {
    if (browseOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [browseOpen]);

  function changeLens(id: string) {
    setLens(id);
    setProfile({ lens: id });
  }

  function pickPrompt(text: string) {
    setBrowseOpen(false);
    send(text);
  }

  async function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value || streaming) return;
    if (!text) setInput('');
    const next: Msg[] = [...messages, { role: 'user', content: value }];
    setMessages(next);
    setStreaming(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, lens, dramaMode }),
      });
      if (!res.ok || !res.body) {
        setMessages([
          ...next,
          { role: 'assistant', content: '⚠︎ Something went wrong. Try again.' },
        ]);
        setStreaming(false);
        return;
      }
      setMessages([...next, { role: 'assistant', content: '' }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(chunk, { stream: true });
        const events = buf.split('\n\n');
        buf = events.pop() ?? '';
        for (const ev of events) {
          if (!ev.startsWith('data:')) continue;
          const data = ev.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            if (json.meta?.demo) setDemoMode(true);
            if (json.delta) {
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = {
                  role: 'assistant',
                  content: (copy[copy.length - 1].content ?? '') + json.delta,
                };
                return copy;
              });
            }
          } catch {}
        }
      }
    } finally {
      setStreaming(false);
    }
  }

  return (
    <PlayerOverlayContext.Provider value={setOverlayPlayer}>
    <main
      className="min-h-screen flex flex-col transition-colors duration-500"
      style={{
        // Use dynamic viewport height on iOS so the input isn't hidden by the URL bar.
        // dvh falls back to vh on older browsers via the className above.
        minHeight: '100dvh',
        ...(dramaMode
          ? { background: 'radial-gradient(ellipse at top, rgba(232,75,122,0.06), transparent 50%), radial-gradient(ellipse at bottom, rgba(255,107,61,0.05), transparent 50%), #FFFFFF' }
          : {}),
      }}
    >
      <header className="px-3 md:px-8 py-2.5 md:py-3 border-b border-[var(--hairline)] flex items-center justify-between gap-2 bg-white/80 sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <Link
            href="/"
            className="font-display text-base md:text-xl font-extrabold text-green tracking-wide uppercase shrink-0"
          >
            SPORTS<span className="text-tangerine">★</span>BFF
          </Link>
          {demoMode && (
            <span className="hidden md:inline-flex text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full bg-lemon/15 text-yellow-700 border border-lemon/30">
              ● Demo mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          {displayName && (
            <span className="hidden lg:block text-sm text-ink-soft mr-1">Hi, {displayName}</span>
          )}
          {/* Drama: icon-only on mobile, full pill on md+ */}
          <button
            type="button"
            onClick={toggleDrama}
            disabled={streaming}
            aria-label={dramaMode ? 'Turn Drama Mode off' : 'Turn Drama Mode on'}
            className={`group inline-flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 h-9 rounded-full text-[12px] md:text-[13px] font-semibold transition-all duration-200 ${
              dramaMode
                ? 'text-white shadow-md'
                : 'text-ink-soft bg-white border border-[var(--hairline)] hover:border-magenta hover:text-magenta'
            }`}
            style={
              dramaMode
                ? {
                    background: 'linear-gradient(135deg, #E84B7A 0%, #FF6B3D 100%)',
                    boxShadow: '0 6px 16px -6px rgba(232,75,122,0.5)',
                  }
                : undefined
            }
            title={dramaMode ? 'Drama Mode is ON — every answer leads with the spicy version' : 'Turn on Drama Mode'}
          >
            <span className={dramaMode ? 'animate-pulse' : ''}>🔥</span>
            <span className="hidden sm:inline">Drama</span>
            <span className={`text-[9px] md:text-[10px] font-bold tracking-widest uppercase ${dramaMode ? 'opacity-90' : 'opacity-60'}`}>
              {dramaMode ? 'ON' : 'OFF'}
            </span>
          </button>
          {/* Lens dropdown — compact on mobile (no "Lens:" prefix) */}
          <select
            className="text-[12px] md:text-sm bg-white border border-[var(--hairline)] rounded-full pl-3 pr-7 h-9 text-ink-soft cursor-pointer max-w-[120px] md:max-w-none truncate appearance-none bg-no-repeat bg-[right_8px_center]"
            style={{
              backgroundImage:
                'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' viewBox=\'0 0 12 8\' fill=\'none\'><path d=\'M1 1.5L6 6.5L11 1.5\' stroke=\'%23556B66\' stroke-width=\'1.6\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/></svg>")',
            }}
            value={lens}
            onChange={(e) => changeLens(e.target.value)}
            disabled={streaming}
            title={`Lens: ${lensInfo.name}`}
            aria-label="Choose lens"
          >
            {lenses.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          {/* Settings — proper 36x36 touch target */}
          <Link
            href="/settings"
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:text-ink hover:bg-cream-warm transition"
            title="Settings"
            aria-label="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </div>
      </header>
      {/* Demo banner on mobile only — moved out of overstuffed header */}
      {demoMode && (
        <div className="md:hidden text-center text-[10px] font-bold tracking-widest uppercase py-1.5 bg-lemon/15 text-yellow-700 border-b border-lemon/30">
          ● Demo mode
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 overscroll-contain">
        <div className="max-w-2xl mx-auto py-6 md:py-10 flex flex-col gap-3 md:gap-4">
          {messages.length === 0 && (
            <EmptyState onPick={(p) => send(p)} onBrowse={() => setBrowseOpen(true)} />
          )}

          {messages.map((m, i) => (
            <Bubble key={i} m={m} streamingNow={streaming && i === messages.length - 1} />
          ))}
        </div>
      </div>

      <div
        className="border-t border-[var(--hairline)] bg-white"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-2xl mx-auto px-3 md:px-4 py-3 md:py-4 flex gap-2 items-center">
          <button
            onClick={() => setBrowseOpen(true)}
            disabled={streaming}
            aria-label="Browse prompts"
            className="shrink-0 w-11 h-11 rounded-full bg-cream-warm border border-[var(--hairline)] flex items-center justify-center text-tangerine hover:bg-tangerine hover:text-white hover:border-tangerine transition-all duration-200 disabled:opacity-50"
            title="Browse prompts"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-4 12.7c.7.7 1 1.6 1 2.5V18h6v-.8c0-.9.4-1.8 1-2.5A7 7 0 0 0 12 2Z" />
            </svg>
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask anything about the NFL or NBA…"
            className="flex-1 min-w-0 bg-cream-warm border border-[var(--hairline)] rounded-full px-4 md:px-5 py-3 text-[16px] md:text-[15px] focus:outline-none focus:ring-2 focus:ring-tangerine/30"
            disabled={streaming}
            enterKeyHint="send"
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
          />
          <button
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            aria-label="Send"
            className="shrink-0 h-11 px-4 md:px-5 rounded-full bg-green text-white font-semibold text-[14px] md:text-[15px] hover:bg-green-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {streaming ? '…' : (
              <>
                <span className="hidden sm:inline">Send</span>
                <svg className="sm:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 11.5L21 3l-8.5 18-2.5-7.5L3 11.5z" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Browse prompts modal */}
      {browseOpen && (
        <BrowsePrompts onPick={pickPrompt} onClose={() => setBrowseOpen(false)} />
      )}

      {/* Player profile overlay — opens when a player name in chat is clicked */}
      {overlayPlayer && (
        <PlayerOverlay slug={overlayPlayer} onClose={() => setOverlayPlayer(null)} />
      )}
    </main>
    </PlayerOverlayContext.Provider>
  );
}

/* =============================================================
   Empty state — has a "Browse all" hint
   ============================================================= */

function EmptyState({ onPick, onBrowse }: { onPick: (p: string) => void; onBrowse: () => void }) {
  return (
    <div className="text-center mt-2 sm:mt-8 px-1">
      <h1 className="font-display text-[34px] sm:text-4xl md:text-5xl font-bold text-green leading-[0.95] tracking-tight">
        Ask anything.
        <br />
        <span className="italic font-medium text-tangerine">No question is dumb.</span>
      </h1>
      <p className="mt-3 sm:mt-4 text-ink-soft text-[14px] md:text-base">Try one to start:</p>
      <div className="mt-4 sm:mt-5 flex flex-wrap gap-1.5 sm:gap-2 justify-center">
        {STARTER_PROMPTS.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="text-[12px] sm:text-sm bg-cream-warm border border-[var(--hairline)] rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-ink-soft hover:bg-green hover:text-white hover:border-green transition"
          >
            {q}
          </button>
        ))}
      </div>
      <button
        onClick={onBrowse}
        className="mt-5 sm:mt-6 inline-flex items-center gap-2 text-sm font-semibold text-tangerine hover:text-tangerine-dark"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12.7c.7.7 1 1.6 1 2.5V18h6v-.8c0-.9.4-1.8 1-2.5A7 7 0 0 0 12 2Z" />
        </svg>
        Browse 100+ more questions →
      </button>
    </div>
  );
}

/* =============================================================
   Browse prompts modal — categorized library
   ============================================================= */

const COLOR_MAP: Record<string, { bg: string; text: string; ring: string }> = {
  tangerine: { bg: 'bg-tangerine/10', text: 'text-tangerine', ring: 'ring-tangerine/30' },
  magenta:   { bg: 'bg-magenta/10',   text: 'text-magenta',   ring: 'ring-magenta/30'   },
  sapphire:  { bg: 'bg-sapphire/10',  text: 'text-sapphire',  ring: 'ring-sapphire/30'  },
  sage:      { bg: 'bg-sage/10',      text: 'text-sage',      ring: 'ring-sage/30'      },
  lemon:     { bg: 'bg-lemon/15',     text: 'text-yellow-700',ring: 'ring-lemon/30'     },
  lilac:     { bg: 'bg-lilac/15',     text: 'text-lilac',     ring: 'ring-lilac/30'     },
  burgundy:  { bg: 'bg-burgundy/10',  text: 'text-burgundy',  ring: 'ring-burgundy/30'  },
};

function BrowsePrompts({ onPick, onClose }: { onPick: (p: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string>(PROMPT_LIBRARY[0].id);

  const q = query.trim().toLowerCase();
  const filteredCats = q
    ? PROMPT_LIBRARY.map((c) => ({
        ...c,
        prompts: c.prompts.filter((p) => p.toLowerCase().includes(q)),
      })).filter((c) => c.prompts.length > 0)
    : PROMPT_LIBRARY;

  // Auto-pick first category that has results when filtering
  useEffect(() => {
    if (q && filteredCats.length > 0 && !filteredCats.find((c) => c.id === activeCat)) {
      setActiveCat(filteredCats[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const cat = filteredCats.find((c) => c.id === activeCat) ?? filteredCats[0];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeBg .25s ease both' }}
      />

      {/* Sheet */}
      <div
        className="relative w-full md:max-w-3xl bg-white md:rounded-[28px] rounded-t-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[80vh]"
        style={{ animation: 'slideUp .35s cubic-bezier(.2,.7,.2,1.05) both' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--hairline)] flex items-center gap-3">
          <div className="font-display text-xl font-bold text-green flex-1">
            Ask anything.
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-cream-warm transition flex items-center justify-center text-ink-soft"
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 3 L13 13 M13 3 L3 13" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2 border-b border-[var(--hairline)]">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11 L14 14" />
            </svg>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search prompts…"
              className="w-full bg-cream-warm border border-[var(--hairline)] rounded-full pl-10 pr-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-tangerine/30"
            />
          </div>
        </div>

        {/* Body — categories on left (desktop) / tabs (mobile) + prompts on right */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Category tabs */}
          <nav className="md:w-56 md:border-r border-[var(--hairline)] md:overflow-y-auto md:py-3 px-3 md:px-2 py-3">
            <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible">
              {filteredCats.map((c) => {
                const isActive = c.id === cat?.id;
                const colors = COLOR_MAP[c.color];
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    className={`shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-[13px] font-medium transition whitespace-nowrap md:whitespace-normal ${
                      isActive
                        ? `${colors.bg} ${colors.text}`
                        : 'text-ink-soft hover:bg-cream-warm'
                    }`}
                  >
                    <span className="text-base">{c.emoji}</span>
                    <span className="flex-1">{c.name}</span>
                    <span className="text-[10px] font-bold opacity-60">{c.prompts.length}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Prompts list */}
          <div className="flex-1 overflow-y-auto p-5">
            {cat ? (
              <>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 ${COLOR_MAP[cat.color].bg} ${COLOR_MAP[cat.color].text}`}>
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </div>
                <p className="text-sm text-ink-soft mb-4">{cat.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.prompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => onPick(p)}
                      className="text-left bg-white border border-[var(--hairline)] rounded-xl px-4 py-3 text-[14px] text-ink hover:border-green hover:bg-cream-warm hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-muted py-12">
                No prompts match "{query}".
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeBg { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

function Bubble({ m, streamingNow }: { m: Msg; streamingNow: boolean }) {
  return (
    <div className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-display text-xs font-bold ${
          m.role === 'user' ? 'bg-tangerine text-white' : 'bg-green text-white'
        }`}
      >
        {m.role === 'user' ? 'YOU' : 'SB'}
      </div>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed ${
          m.role === 'user'
            ? 'bg-green text-white whitespace-pre-wrap'
            : 'bg-cream-warm border border-[var(--hairline)] text-ink'
        }`}
      >
        {m.role === 'assistant'
          ? m.content
            ? <Markdown text={m.content} />
            : streamingNow
              ? '…'
              : ''
          : m.content}
      </div>
    </div>
  );
}
