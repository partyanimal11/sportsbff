'use client';

/**
 * Tea'd Up — Chat tab.
 *
 * Empty state: "Ask anything" big CTA + secondary NBA/NFL wizard cards.
 * Active conversation: streaming BFF bubbles with tier-pill rendering inline.
 * Voice mode: per-message Play button + auto-play toggle in header.
 */

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Markdown } from '@/lib/markdown';
import { getProfile, setProfile } from '@/lib/profile';
import { useVoicePlayer } from '@/lib/use-voice-player';
import { BottomTabs, BottomTabsSpacer } from '@/components/BottomTabs';
import { TeaUpToggle } from '@/components/TeaUpToggle';
import { TierPill, parseTierPills } from '@/components/TierPill';
import { PROMPT_LIBRARY, STARTER_PROMPTS } from '@/lib/prompts';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-warm" />}>
      <ChatPage />
    </Suspense>
  );
}

function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const [teadUp, setTeadUp] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState<string>('');
  const [league, setLeague] = useState<'nfl' | 'nba' | 'both'>('both');
  const [autoPlay, setAutoPlay] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const voicePlayer = useVoicePlayer();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
    const p = getProfile();
    setTeadUp(!!p.teadUpEnabled);
    if (p.displayName) setDisplayName(p.displayName);
    if (p.league) setLeague(p.league);
    if (p.autoPlayVoice) setAutoPlay(true);

    const seed = searchParams.get('seed');
    const seedTea = searchParams.get('teadUp');
    if (seedTea === 'true') setTeadUp(true);
    if (seedTea === 'false') setTeadUp(false);
    if (seed && messages.length === 0) {
      setTimeout(() => send(seed), 80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  function toggleTeadUp() {
    const next = !teadUp;
    setTeadUp(next);
    setProfile({ teadUpEnabled: next });
  }

  function toggleAutoPlay() {
    const next = !autoPlay;
    setAutoPlay(next);
    setProfile({ autoPlayVoice: next });
  }

  function clearConversation() {
    if (messages.length === 0) return;
    if (confirm('Clear this conversation?')) {
      setMessages([]);
      voicePlayer.stop();
    }
  }

  // Auto-play the latest assistant message when streaming finishes
  const autoPlayedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!autoPlay || streaming || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.role !== 'assistant' || !last.content) return;
    const key = `${messages.length - 1}|${last.content.slice(0, 60)}`;
    if (autoPlayedKeyRef.current === key) return;
    autoPlayedKeyRef.current = key;
    voicePlayer.play(`auto-${messages.length - 1}`, last.content, { lens: 'plain' });
  }, [streaming, messages, autoPlay, voicePlayer]);

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
        body: JSON.stringify({
          messages: next,
          teadUp,
          league,
          displayName: displayName || undefined,
          euphoriaLensEnabled: getProfile().euphoriaLensEnabled,
        }),
      });
      if (!res.ok || !res.body) {
        setMessages([...next, { role: 'assistant', content: '⚠︎ Something went wrong. Try again.' }]);
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

  function focusInput() {
    inputRef.current?.focus();
  }

  return (
    <main className="min-h-screen flex flex-col bg-white" style={{ minHeight: '100dvh' }}>
      {/* Header */}
      <header className="px-3 sm:px-6 py-2.5 border-b border-[var(--hairline)] flex items-center justify-between gap-2 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              aria-label="Clear conversation"
              className="w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-cream-warm transition shrink-0"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
          )}
          <Link href="/" className="font-display text-base sm:text-lg font-extrabold text-green tracking-wide uppercase shrink-0">
            SPORTS<span className="text-tangerine">★</span>BFF
          </Link>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {mounted && (
            <TeaUpToggle
              enabled={teadUp}
              onToggle={toggleTeadUp}
              disabled={streaming}
            />
          )}
          <button
            onClick={toggleAutoPlay}
            disabled={streaming}
            aria-label={autoPlay ? 'Turn voice off' : 'Turn voice on'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
              autoPlay ? 'bg-tangerine text-white shadow-sm' : 'text-ink-soft hover:bg-cream-warm'
            }`}
          >
            {autoPlay ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="22" y1="9" x2="16" y2="15" />
                <line x1="16" y1="9" x2="22" y2="15" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Demo banner */}
      {demoMode && (
        <div className="text-center text-[10px] font-bold tracking-widest uppercase py-1.5 bg-lemon/15 text-yellow-700 border-b border-lemon/30">
          ● Demo mode — set OPENAI_API_KEY for live answers
        </div>
      )}

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 overscroll-contain">
        <div className="max-w-2xl mx-auto py-5 md:py-8 flex flex-col gap-3.5">
          {messages.length === 0 ? (
            <EmptyState teadUp={teadUp} onAsk={focusInput} onPick={(p) => send(p)} onBrowse={() => setBrowseOpen(true)} league={league} onPickLeague={(l) => { setLeague(l); setProfile({ league: l }); }} onToggleTeadUp={toggleTeadUp} />
          ) : (
            messages.map((m, i) => (
              <Bubble
                key={i}
                m={m}
                streamingNow={streaming && i === messages.length - 1}
                messageId={`msg-${i}`}
                voicePlayer={voicePlayer}
                isLastMessage={i === messages.length - 1}
              />
            ))
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t border-[var(--hairline)] bg-white" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-2xl mx-auto px-3 md:px-4 py-3 flex gap-2 items-center">
          <button
            onClick={() => setBrowseOpen(true)}
            disabled={streaming}
            aria-label="Browse prompts"
            className="shrink-0 w-11 h-11 rounded-full bg-cream-warm border border-[var(--hairline)] flex items-center justify-center text-tangerine hover:bg-tangerine hover:text-white hover:border-tangerine transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-4 12.7c.7.7 1 1.6 1 2.5V18h6v-.8c0-.9.4-1.8 1-2.5A7 7 0 0 0 12 2Z" />
            </svg>
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="ask the BFF…"
            className="flex-1 min-w-0 bg-cream-warm border border-[var(--hairline)] rounded-full px-4 md:px-5 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-tangerine/30"
            disabled={streaming}
            enterKeyHint="send"
            autoComplete="off"
            autoCorrect="off"
          />
          <button
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            aria-label="Send"
            className="shrink-0 h-11 w-11 sm:w-auto sm:px-5 rounded-full bg-green text-white font-semibold text-[14px] hover:bg-green-2 transition disabled:opacity-50"
          >
            {streaming ? '…' : (
              <>
                <span className="hidden sm:inline">Send</span>
                <svg className="sm:hidden mx-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 11.5L21 3l-8.5 18-2.5-7.5L3 11.5z" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      <BottomTabsSpacer />
      <BottomTabs />

      {browseOpen && <BrowsePrompts onPick={(p) => { setBrowseOpen(false); send(p); }} onClose={() => setBrowseOpen(false)} />}
    </main>
  );
}

/* =================================================================
   Empty state — Ask anything CTA primary, wizard secondary
   ================================================================= */

function EmptyState({
  teadUp,
  onPick,
  onBrowse,
  onToggleTeadUp,
}: {
  teadUp: boolean;
  onAsk: () => void;
  onPick: (p: string) => void;
  onBrowse: () => void;
  league: 'nfl' | 'nba' | 'both';
  onPickLeague: (l: 'nfl' | 'nba' | 'both') => void;
  onToggleTeadUp: () => void;
}) {
  return (
    <div className="mt-2 sm:mt-4 px-1">
      {/* Goldie intro */}
      <div className="flex flex-col items-center text-center">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-pink-soft mb-3"
          style={{ background: '#FDEEF1' }}
        >
          <img
            src="/brand/goldie.png"
            alt="Goldie, your sports BFF"
            className="w-full h-full object-cover object-top"
          />
        </div>

        <h1 className="font-display text-[28px] sm:text-[32px] font-bold text-green leading-[1.05] tracking-tight">
          {teadUp ? (
            <>Spill the tea, Goldie.<br /><span className="italic text-magenta">I want everything.</span></>
          ) : (
            <>Ask anything.<br /><span className="italic text-tangerine">No question is dumb.</span></>
          )}
        </h1>
        <p className="mt-2 text-[13px] sm:text-[14px] text-ink-soft max-w-xs">
          {teadUp
            ? "I'll share what I know — confirmed, reported, or rumor. Tier-tagged so you know the source."
            : "Rules, players, storylines — the league, decoded. Flip Tea'd Up on if you want the gossip layer too."}
        </p>
      </div>

      {/* TEA'D UP — huge promotion banner */}
      <button
        onClick={onToggleTeadUp}
        aria-pressed={teadUp}
        className="mt-5 w-full block rounded-3xl p-4 sm:p-5 text-left transition shadow-[0_8px_22px_-10px_rgba(232,75,122,0.4)]"
        style={{
          background: teadUp
            ? 'linear-gradient(135deg, #E84B7A 0%, #FF6B3D 100%)'
            : 'linear-gradient(135deg, #FDEEF1 0%, #FFE7DB 100%)',
          color: teadUp ? '#FFFFFF' : '#0D2D24',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className={`text-3xl shrink-0 ${teadUp ? 'animate-pulse' : ''}`} aria-hidden>☕</span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-[0.22em] uppercase opacity-80">
                Tea'd Up · {teadUp ? 'ON' : 'OFF'}
              </div>
              <div className="font-display font-bold text-[18px] sm:text-[20px] leading-tight mt-0.5">
                {teadUp ? "You're getting the gossip layer" : "Want the gossip layer?"}
              </div>
              <div className="text-[12px] sm:text-[13px] opacity-90 leading-snug mt-0.5">
                {teadUp
                  ? "Drama, beefs, burner accounts — every claim tier-tagged. Tap to turn off."
                  : "Drama, beefs, burner accounts — tap to flip it on."}
              </div>
            </div>
          </div>
          <span className="text-[20px] shrink-0" aria-hidden>{teadUp ? '✓' : '→'}</span>
        </div>
      </button>

      {/* Main CTA — opens prompt browser */}
      <button
        onClick={onBrowse}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-tangerine text-white font-semibold rounded-full py-4 text-[15px] hover:bg-tangerine-dark transition shadow-[0_4px_16px_-4px_rgba(255,107,61,0.4)]"
      >
        💬 Browse questions to ask →
      </button>

      {/* Find a player — clearly framed */}
      <div className="mt-7 flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--hairline)]" />
        <span className="text-[11px] text-muted tracking-wider uppercase">or look up a player</span>
        <div className="flex-1 h-px bg-[var(--hairline)]" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {[
          { id: 'nba' as const, label: 'NBA player', sub: 'Tell me about a star', emoji: '🏀', seed: 'I want to learn about a specific NBA player. Suggest 5 stars I should know about, with one sentence on each.' },
          { id: 'nfl' as const, label: 'NFL player', sub: 'Tell me about a star', emoji: '🏈', seed: 'I want to learn about a specific NFL player. Suggest 5 stars I should know about, with one sentence on each.' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => onPick(s.seed)}
            className="bg-white border border-[var(--hairline)] rounded-2xl p-4 text-left hover:bg-cream-warm hover:border-tangerine/40 transition shadow-[0_8px_24px_-12px_rgba(13,45,36,0.10)]"
          >
            <div className="text-3xl mb-2" aria-hidden>{s.emoji}</div>
            <div className="font-display font-bold text-[16px] text-green leading-tight">{s.label}</div>
            <div className="text-[11px] text-ink-soft mt-0.5 italic">{s.sub} →</div>
          </button>
        ))}
      </div>

      {/* Quick prompts */}
      <p className="mt-7 text-[11px] text-muted text-center">Or try one of these to start:</p>
      <div className="mt-3 flex flex-col gap-2">
        {STARTER_PROMPTS.slice(0, 4).map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="w-full text-left text-[13px] sm:text-[14px] bg-white border border-[var(--hairline)] rounded-2xl px-4 py-3 text-green hover:bg-cream-warm hover:border-tangerine/40 transition flex items-center justify-between gap-2"
          >
            <span>{q}</span>
            <span className="text-tangerine shrink-0">→</span>
          </button>
        ))}
      </div>

      <button onClick={onBrowse} className="mt-5 w-full inline-flex items-center justify-center gap-2 text-[13px] font-semibold text-tangerine hover:text-tangerine-dark">
        Browse 100+ more questions →
      </button>
    </div>
  );
}

/* =================================================================
   Bubble with tier pill rendering + voice play button
   ================================================================= */

function Bubble({
  m,
  streamingNow,
  messageId,
  voicePlayer,
  isLastMessage,
}: {
  m: Msg;
  streamingNow: boolean;
  messageId: string;
  voicePlayer: ReturnType<typeof useVoicePlayer>;
  isLastMessage?: boolean;
}) {
  const isAssistant = m.role === 'assistant';
  const canPlay = isAssistant && !!m.content && !streamingNow;
  const isPlaying = voicePlayer.playingId === messageId;
  const isLoading = voicePlayer.loading && voicePlayer.playingId === null;
  const showTyping = isAssistant && streamingNow && !m.content;

  function handlePlay() {
    voicePlayer.play(messageId, m.content, { lens: 'plain' });
  }

  // Typing indicator — three animated dots, with Goldie avatar
  if (showTyping) {
    return (
      <div className="flex gap-2 items-end">
        <GoldieAvatar />
        <div
          className="rounded-[20px] px-4 py-3 inline-flex items-center gap-1"
          style={{
            background: '#F1EFE8',
            borderBottomLeftRadius: 4,
          }}
        >
          <span className="w-2 h-2 rounded-full bg-ink-soft" style={{ animation: 'typingDot 1.2s ease-in-out infinite', animationDelay: '0s' }} />
          <span className="w-2 h-2 rounded-full bg-ink-soft" style={{ animation: 'typingDot 1.2s ease-in-out infinite', animationDelay: '0.2s' }} />
          <span className="w-2 h-2 rounded-full bg-ink-soft" style={{ animation: 'typingDot 1.2s ease-in-out infinite', animationDelay: '0.4s' }} />
        </div>
        <style jsx>{`
          @keyframes typingDot {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-3px); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  // iMessage-style bubble (BFF cream + deep-green user)
  return (
    <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-1`}>
      <div className={`flex ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 ${m.role === 'user' ? 'self-end' : 'self-start'} max-w-[88%]`}>
        {isAssistant && <GoldieAvatar />}
        <div
          className={`px-4 py-2.5 text-[15px] leading-[1.45] ${
            m.role === 'user' ? 'text-white' : 'text-ink'
          }`}
          style={{
            background: m.role === 'user'
              ? 'linear-gradient(180deg, #143A2E 0%, #0D2D24 100%)'
              : '#F1EFE8',
            borderRadius: 20,
            borderBottomRightRadius: m.role === 'user' ? 6 : 20,
            borderBottomLeftRadius: m.role === 'user' ? 20 : 6,
            boxShadow: m.role === 'user'
              ? '0 1px 0 rgba(255,255,255,0.15) inset, 0 4px 12px -4px rgba(13,45,36,0.4)'
              : '0 1px 0 rgba(255,255,255,0.6) inset, 0 1px 2px rgba(13,45,36,0.04)',
          }}
        >
          {isAssistant ? (
            <BFFContent text={m.content} />
          ) : (
            <span className="whitespace-pre-wrap">{m.content}</span>
          )}
        </div>
      </div>

      {/* Read receipt + read-aloud button row, only on the last assistant message */}
      {(canPlay || (isLastMessage && m.role === 'user')) && (
        <div className={`flex items-center gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'pl-9'} mt-0.5`}>
          {isLastMessage && m.role === 'user' && (
            <span className="text-[10px] text-muted">Delivered</span>
          )}
          {canPlay && (
            <button
              type="button"
              onClick={handlePlay}
              disabled={isLoading}
              aria-label={isPlaying ? 'Stop reading' : 'Read this answer aloud'}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                isPlaying
                  ? 'bg-tangerine text-white'
                  : 'text-ink-soft bg-white border border-[var(--hairline)] hover:border-tangerine hover:text-tangerine'
              }`}
              title="Have Goldie read this answer aloud"
            >
              {isLoading ? (
                <span className="inline-block w-3 h-3 rounded-full border-[1.5px] border-current border-t-transparent animate-spin" />
              ) : isPlaying ? (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="2" width="3" height="8" rx="0.5" /><rect x="7" y="2" width="3" height="8" rx="0.5" /></svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
              <span>{isLoading ? 'Loading…' : isPlaying ? 'Stop' : 'Read aloud'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Goldie avatar — small circular portrait shown next to BFF messages.
 */
function GoldieAvatar() {
  return (
    <div
      className="shrink-0 w-7 h-7 rounded-full overflow-hidden border border-[var(--hairline)] mb-0.5"
      style={{ background: '#FDEEF1' }}
      aria-hidden
    >
      <img
        src="/brand/goldie.png"
        alt=""
        className="w-full h-full object-cover object-top"
      />
    </div>
  );
}

/**
 * Render BFF message content with [TIER] tokens replaced by tier pills inline,
 * plus markdown formatting (bold, italic).
 */
function BFFContent({ text }: { text: string }) {
  const parts = parseTierPills(text);
  return (
    <span>
      {parts.map((p, i) =>
        typeof p === 'string' ? <Markdown key={i} text={p} /> : <span key={i}>{p}</span>
      )}
    </span>
  );
}

/* =================================================================
   Browse prompts modal — categorized library (carryover from sportsBFF)
   ================================================================= */

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  tangerine: { bg: 'bg-tangerine/10', text: 'text-tangerine' },
  magenta: { bg: 'bg-magenta/10', text: 'text-magenta' },
  sapphire: { bg: 'bg-sapphire/10', text: 'text-sapphire' },
  sage: { bg: 'bg-sage/10', text: 'text-sage' },
  lemon: { bg: 'bg-lemon/15', text: 'text-yellow-700' },
  lilac: { bg: 'bg-lilac/15', text: 'text-lilac' },
  burgundy: { bg: 'bg-burgundy/10', text: 'text-burgundy' },
};

function BrowsePrompts({ onPick, onClose }: { onPick: (p: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  // On mobile, show a 2-step picker: categories grid → prompts list. On desktop, side-by-side.
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filteredCats = q
    ? PROMPT_LIBRARY.map((c) => ({ ...c, prompts: c.prompts.filter((p) => p.toLowerCase().includes(q)) })).filter((c) => c.prompts.length > 0)
    : PROMPT_LIBRARY;

  // When searching, just show all matching prompts mixed across categories
  const searchResults: string[] = q
    ? filteredCats.flatMap((c) => c.prompts).slice(0, 50)
    : [];

  const cat = filteredCats.find((c) => c.id === activeCat) ?? null;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function pickRandom() {
    const all = PROMPT_LIBRARY.flatMap((c) => c.prompts);
    onPick(all[Math.floor(Math.random() * all.length)]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-3xl bg-white md:rounded-[28px] rounded-t-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh] md:max-h-[82vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--hairline)] flex items-center gap-3">
          {/* Mobile-only back button when a category is open */}
          {cat && !q && (
            <button
              onClick={() => setActiveCat(null)}
              aria-label="Back to all categories"
              className="md:hidden w-9 h-9 rounded-full hover:bg-cream-warm transition flex items-center justify-center text-ink-soft"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M10 13 L4 8 L10 3" />
              </svg>
            </button>
          )}
          <div className="font-display text-lg font-bold text-green flex-1 min-w-0 truncate">
            {cat && !q ? <><span aria-hidden>{cat.emoji}</span> {cat.name}</> : 'Ask Goldie anything.'}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-cream-warm transition flex items-center justify-center text-ink-soft" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3 L13 13 M13 3 L3 13" /></svg>
          </button>
        </div>

        {/* Search + Surprise me */}
        <div className="px-5 pt-3 pb-3 border-b border-[var(--hairline)] flex items-center gap-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 100+ prompts…"
            className="flex-1 min-w-0 bg-cream-warm border border-[var(--hairline)] rounded-full px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-tangerine/30"
          />
          <button
            onClick={pickRandom}
            className="shrink-0 inline-flex items-center gap-1 bg-tangerine text-white font-semibold rounded-full px-3.5 py-2.5 text-[12px] hover:bg-tangerine-dark transition"
            title="Pick a random prompt"
          >
            🎲 <span className="hidden sm:inline">Surprise me</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Search-mode: flat list of matching prompts */}
          {q && (
            <div className="flex-1 overflow-y-auto p-4">
              {searchResults.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {searchResults.map((p) => (
                    <button
                      key={p}
                      onClick={() => onPick(p)}
                      className="text-left bg-white border border-[var(--hairline)] rounded-2xl px-4 py-3 text-[14px] text-ink hover:border-tangerine hover:bg-cream-warm transition flex items-center justify-between gap-2"
                    >
                      <span>{p}</span>
                      <span className="text-tangerine shrink-0">→</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-12">No prompts match &quot;{query}&quot;.</div>
              )}
            </div>
          )}

          {/* Browse-mode: category sidebar (desktop) + prompts list (right) / category grid (mobile) */}
          {!q && (
            <>
              {/* Desktop sidebar — vertical category list */}
              <nav className="hidden md:block md:w-56 md:border-r border-[var(--hairline)] md:overflow-y-auto py-3 px-2">
                <div className="flex flex-col gap-1">
                  {PROMPT_LIBRARY.map((c) => {
                    const isActive = activeCat === c.id || (!activeCat && c === PROMPT_LIBRARY[0]);
                    const colors = COLOR_MAP[c.color] ?? COLOR_MAP.tangerine;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveCat(c.id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium transition ${
                          isActive ? `${colors.bg} ${colors.text}` : 'text-ink-soft hover:bg-cream-warm'
                        }`}
                      >
                        <span className="text-base">{c.emoji}</span>
                        <span className="flex-1">{c.name}</span>
                        <span className="text-[10px] text-muted">{c.prompts.length}</span>
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Mobile: 2-column category grid (when no category picked) */}
              {!cat && (
                <div className="md:hidden flex-1 overflow-y-auto p-4">
                  <p className="text-[11px] text-muted uppercase tracking-wider mb-3 text-center">Pick a category</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {PROMPT_LIBRARY.map((c) => {
                      const colors = COLOR_MAP[c.color] ?? COLOR_MAP.tangerine;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setActiveCat(c.id)}
                          className={`bg-white border border-[var(--hairline)] rounded-2xl p-4 text-left hover:bg-cream-warm transition shadow-[0_4px_12px_-6px_rgba(13,45,36,0.08)] flex flex-col gap-1.5 min-h-[112px]`}
                        >
                          <div className={`text-3xl mb-1 ${colors.text}`} aria-hidden>{c.emoji}</div>
                          <div className="font-display font-bold text-[14px] text-green leading-tight">{c.name}</div>
                          <div className="text-[10px] text-ink-soft italic line-clamp-2">{c.description}</div>
                          <div className="text-[10px] text-muted mt-auto">{c.prompts.length} prompts →</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Prompts list (desktop always; mobile when category picked) */}
              <div className={`flex-1 overflow-y-auto p-4 ${!cat ? 'hidden md:block' : ''}`}>
                {(cat ?? PROMPT_LIBRARY[0]).prompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => onPick(p)}
                    className="block w-full text-left bg-white border border-[var(--hairline)] rounded-2xl px-4 py-3 text-[14px] text-ink hover:border-tangerine hover:bg-cream-warm transition mb-2 flex items-center justify-between gap-2"
                  >
                    <span>{p}</span>
                    <span className="text-tangerine shrink-0">→</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
