'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

/**
 * Scan UI — Phase 1 (demo mode).
 * Real photo upload + camera capture, but the "vision" is a cycling mock.
 * Once OPENAI_API_KEY is wired and we add a /api/scan route, this swaps to
 * a real GPT-4o-vision call.
 */

type ScanResult = {
  player_name: string;
  number: number;
  position: string;
  team: string;
  jersey_color: 'red' | 'blue' | 'green' | 'purple' | 'yellow' | 'white';
  blurb: string;
  game?: { home: string; home_score: number; away: string; away_score: number; clock: string };
};

const MOCK_RESULTS: ScanResult[] = [
  {
    player_name: 'Travis Kelce',
    number: 87,
    position: 'Tight End',
    team: 'Kansas City Chiefs',
    jersey_color: 'red',
    blurb: 'Future Hall of Famer. Three rings. Yes — he\'s the one dating Taylor Swift.',
    game: { home: 'KC', home_score: 24, away: 'DAL', away_score: 17, clock: '4Q 2:14' },
  },
  {
    player_name: 'Patrick Mahomes',
    number: 15,
    position: 'Quarterback',
    team: 'Kansas City Chiefs',
    jersey_color: 'red',
    blurb: 'Three-time Super Bowl MVP. The face of the league. Side-arm passes that look like physics violations.',
    game: { home: 'KC', home_score: 24, away: 'DAL', away_score: 17, clock: '4Q 2:14' },
  },
  {
    player_name: 'Shai Gilgeous-Alexander',
    number: 2,
    position: 'Guard',
    team: 'Oklahoma City Thunder',
    jersey_color: 'blue',
    blurb: 'Reigning MVP. Tailored cardigans postgame. Two-word answers. Says everything with his chest.',
    game: { home: 'OKC', home_score: 108, away: 'BOS', away_score: 102, clock: '3Q 4:32' },
  },
  {
    player_name: 'Victor Wembanyama',
    number: 1,
    position: 'Center',
    team: 'San Antonio Spurs',
    jersey_color: 'white',
    blurb: '7\'4 French unicorn. Defensive Player of the Year favorite. Plays like LeBron and Dirk had a child raised by Pop.',
    game: { home: 'SAS', home_score: 96, away: 'DEN', away_score: 91, clock: '4Q 6:08' },
  },
];

const JERSEY_GRADIENT: Record<ScanResult['jersey_color'], string> = {
  red: 'linear-gradient(180deg, #C8202A 0%, #921620 100%)',
  blue: 'linear-gradient(180deg, #1F4FBA 0%, #0F347E 100%)',
  green: 'linear-gradient(180deg, #2A6E47 0%, #163C25 100%)',
  purple: 'linear-gradient(180deg, #6B3DAA 0%, #3F1B6E 100%)',
  yellow: 'linear-gradient(180deg, #FBC531 0%, #C28A00 100%)',
  white: 'linear-gradient(180deg, #F5F5F5 0%, #BFBFBF 100%)',
};

export default function ScanPage() {
  const [phase, setPhase] = useState<'idle' | 'preview' | 'scanning' | 'result'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanIndex, setScanIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPhase('preview');
    // Auto-start scan
    setTimeout(() => runScan(), 600);
  }

  function runScan() {
    setPhase('scanning');
    // Simulate vision API latency
    setTimeout(() => {
      const next = MOCK_RESULTS[scanIndex % MOCK_RESULTS.length];
      setScanIndex((i) => i + 1);
      setResult(next);
      setPhase('result');
    }, 1800);
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setPhase('idle');
  }

  function trySample() {
    setPhase('scanning');
    setTimeout(() => {
      const next = MOCK_RESULTS[scanIndex % MOCK_RESULTS.length];
      setScanIndex((i) => i + 1);
      setResult(next);
      setPhase('result');
    }, 1400);
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 border-b border-[var(--hairline)] flex items-center justify-between gap-3 bg-white sticky top-0 z-10">
        <Link href="/" className="font-display text-base sm:text-xl font-extrabold text-green tracking-wide uppercase shrink-0">
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        <nav className="flex gap-4 sm:gap-7 text-[13px] sm:text-sm text-ink-soft">
          <Link href="/scan" className="text-green font-semibold">Scan</Link>
          <Link href="/chat" className="hover:text-ink">Chat</Link>
          <Link href="/lessons" className="hover:text-ink">Lessons</Link>
        </nav>
      </header>

      <section className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-warm text-[11px] sm:text-xs text-ink-soft mb-5 sm:mb-6">
            <span className="w-2 h-2 rounded-full bg-tangerine animate-pulse" />
            Demo mode · vision API not wired yet
          </div>
          <h1 className="font-display text-[36px] sm:text-5xl md:text-6xl font-bold text-green leading-[0.95] tracking-tight">
            Scan a game.
            <br />
            <span className="italic font-medium text-tangerine">Know who's playing.</span>
          </h1>
          <p className="mt-4 sm:mt-5 text-[15px] sm:text-lg text-ink-soft max-w-xl mx-auto">
            Point your camera at any NFL or NBA broadcast — sportsBFF reads the scoreboard, identifies the players in frame, and gives you the bio, the stats, the drama.
          </p>

          {phase === 'idle' && (
            <>
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button className="btn btn-primary" onClick={() => cameraRef.current?.click()}>
                  📷 Take a photo
                </button>
                <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
                  Upload from device
                </button>
                <button className="text-tangerine font-semibold text-sm hover:underline" onClick={trySample}>
                  or try a sample →
                </button>
              </div>
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <p className="mt-6 text-xs text-muted">
                Point your phone at any NFL or NBA game on TV. Or drop a screenshot.
              </p>
            </>
          )}

          {(phase === 'preview' || phase === 'scanning') && (
            <div className="mt-10 max-w-md mx-auto bg-white rounded-3xl border border-[var(--hairline)] shadow-lift overflow-hidden">
              <div className="relative h-72 bg-black">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Your scan" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#2A6E47] via-[#1F5535] to-[#163C25]" />
                )}
                {/* Scan overlay */}
                <div className="absolute inset-8 pointer-events-none">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-tangerine" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-tangerine" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-tangerine" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-tangerine" />
                  {phase === 'scanning' && (
                    <div
                      className="absolute left-0 right-0 h-0.5 bg-tangerine shadow-[0_0_12px_rgba(255,107,61,0.8)]"
                      style={{
                        animation: 'scanline 1.6s ease-in-out infinite',
                      }}
                    />
                  )}
                </div>
              </div>
              <div className="px-5 py-4 text-sm text-ink-soft flex items-center justify-between">
                <span>{phase === 'scanning' ? 'Scanning…' : 'Preview ready'}</span>
                {phase === 'preview' && (
                  <button className="text-tangerine font-semibold text-sm" onClick={runScan}>
                    Identify →
                  </button>
                )}
              </div>
            </div>
          )}

          {phase === 'result' && result && (
            <div className="mt-10 max-w-md mx-auto">
              <div className="bg-white rounded-3xl border border-[var(--hairline)] shadow-lift overflow-hidden text-left animate-[fadeUp_0.6s_ease]">
                {result.game && (
                  <div className="px-4 py-3 border-b border-[var(--hairline)] flex items-center justify-between text-xs uppercase tracking-widest text-muted">
                    <span className="text-sage">● Scan complete</span>
                    <span className="text-green font-semibold">
                      {result.game.home} {result.game.home_score} vs {result.game.away}{' '}
                      {result.game.away_score} · {result.game.clock}
                    </span>
                  </div>
                )}
                <div className="h-44 relative" style={{ background: 'linear-gradient(135deg, #2A6E47 0%, #1F5535 50%, #163C25 100%)' }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white font-display font-extrabold text-xl"
                      style={{ background: JERSEY_GRADIENT[result.jersey_color] }}
                    >
                      {result.number}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-display font-bold text-2xl text-green leading-tight">
                        {result.player_name}
                      </div>
                      <div className="text-sm text-muted mt-1">
                        {result.position} · {result.team} · #{result.number}
                      </div>
                    </div>
                  </div>
                  <p className="text-[15px] text-ink leading-relaxed">{result.blurb}</p>
                  <div className="mt-5 flex items-center gap-2">
                    <Link
                      href={`/chat?seed=${encodeURIComponent(`Tell me more about ${result.player_name}.`)}`}
                      className="btn btn-dark"
                    >
                      💬 Ask more →
                    </Link>
                    <button className="btn btn-secondary" onClick={reset}>
                      Scan another
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted">
                Sample result — real vision pipeline lands when OpenAI is wired.
              </p>
            </div>
          )}
        </div>
      </section>

      <style jsx global>{`
        @keyframes scanline {
          0% {
            top: 0;
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </main>
  );
}
