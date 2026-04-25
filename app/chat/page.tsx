'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { listLenses, DEFAULT_LENS_ID, getLens } from '@/lib/lens';
import { getProfile, setProfile } from '@/lib/profile';
import { renderMarkdown } from '@/lib/markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

export default function ChatPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ChatPage />
    </Suspense>
  );
}

const STARTER_PROMPTS = [
  "What's a sack?",
  'Who is Travis Kelce?',
  'How does fantasy football work?',
  'Why is everyone saying KD is Gossip Girl?',
  'Explain the salary cap.',
  "What's the trade deadline?",
];

function ChatPage() {
  const [lens, setLens] = useState<string>(DEFAULT_LENS_ID);
  const [displayName, setDisplayName] = useState<string>('');
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lenses = listLenses();
  const lensInfo = getLens(lens);
  const searchParams = useSearchParams();

  // Hydrate from localStorage on mount + auto-send any ?seed= prompt
  useEffect(() => {
    const p = getProfile();
    setLens(p.lens);
    if (p.displayName) setDisplayName(p.displayName);

    const seed = searchParams.get('seed');
    if (seed && messages.length === 0) {
      // Tiny delay so the lens is set first
      setTimeout(() => send(seed), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  function changeLens(id: string) {
    setLens(id);
    setProfile({ lens: id });
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
        body: JSON.stringify({ messages: next, lens }),
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
    <main className="min-h-screen flex flex-col">
      <header className="px-6 md:px-8 py-3 border-b border-[var(--hairline)] flex items-center justify-between bg-white sticky top-0 z-10 backdrop-blur">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="font-display text-xl font-extrabold text-green tracking-wide uppercase"
          >
            SPORTS<span className="text-tangerine">★</span>BFF
          </Link>
          {demoMode && (
            <span className="hidden md:inline-flex text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full bg-lemon/15 text-yellow-700 border border-lemon/30">
              ● Demo mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {displayName && (
            <span className="hidden md:block text-sm text-ink-soft">Hi, {displayName}</span>
          )}
          <select
            className="text-sm bg-white border border-[var(--hairline)] rounded-full px-3 py-1.5 text-ink-soft cursor-pointer"
            value={lens}
            onChange={(e) => changeLens(e.target.value)}
            disabled={streaming}
            title={`Lens: ${lensInfo.name}`}
          >
            {lenses.map((l) => (
              <option key={l.id} value={l.id}>
                Lens: {l.name}
              </option>
            ))}
          </select>
          <Link href="/settings" className="text-sm text-ink-soft hover:text-ink" title="Settings">
            ⚙
          </Link>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
        <div className="max-w-2xl mx-auto py-10 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="text-center mt-8">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-green leading-[0.95] tracking-tight">
                Ask anything.
                <br />
                <span className="italic font-medium text-tangerine">No question is dumb.</span>
              </h1>
              <p className="mt-4 text-ink-soft">Try one to start:</p>
              <div className="mt-5 flex flex-wrap gap-2 justify-center">
                {STARTER_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="text-sm bg-cream-warm border border-[var(--hairline)] rounded-full px-4 py-2 text-ink-soft hover:bg-green hover:text-white hover:border-green transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <Bubble key={i} m={m} streamingNow={streaming && i === messages.length - 1} />
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--hairline)] bg-white">
        <div className="max-w-2xl mx-auto p-4 flex gap-2 items-center">
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
            className="flex-1 bg-cream-warm border border-[var(--hairline)] rounded-full px-5 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-tangerine/30"
            disabled={streaming}
            autoFocus
          />
          <button
            onClick={() => send()}
            disabled={streaming || !input.trim()}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {streaming ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </main>
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
            ? renderMarkdown(m.content)
            : streamingNow
              ? '…'
              : ''
          : m.content}
      </div>
    </div>
  );
}
