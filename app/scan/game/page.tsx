'use client';

/**
 * Scoreboard scan — the v1 hero demo.
 *
 * Point your camera at a scorebug → we OCR the matchup → return both rosters
 * + per-player tea + game-state explainer + top matchup tea cards.
 *
 * Pure web demo (no auth, no account). Calls /api/scan/game directly.
 *
 * Built 2026-05-05 after the BIPA/face-scan pivot (see
 * project_session_2026_05_05_scorebug_pivot.md).
 */

import { useRef, useState } from 'react';
import Link from 'next/link';

/* ─────────────────── types (mirror /api/scan/game) ─────────────────── */
type TeaSource = { name: string; url: string; date: string };
type TeaSnippet = {
  tier: 'confirmed' | 'reported' | 'speculation' | 'rumor';
  category: string;
  headline: string;
  summary: string;
  source: TeaSource | null;
};
type Player = {
  id: string;
  name: string;
  jersey: string;
  pos: string;
  headshot: string | null;
  tea: TeaSnippet[];
  hasTea: boolean;
};
type TeaCard = {
  player_id: string;
  player_name: string;
  team: string;
  headshot: string | null;
  tier: TeaSnippet['tier'];
  category: string;
  headline: string;
  summary: string;
  source: TeaSource | null;
};
type LiveGameInfo = {
  espn_id?: string;
  status?: 'in_progress' | 'scheduled' | 'final' | 'postponed' | 'unknown';
  status_label?: string;
  broadcasts?: string[];
  start_time?: string;
  verified: boolean;
};
type GameScanResponse = {
  league: 'nba' | 'nfl' | 'wnba';
  matchup: {
    home: { team: string; name: string; score: number };
    away: { team: string; name: string; score: number };
    clock: string;
    period: number;
    period_label: string;
  };
  live_game: LiveGameInfo;
  rosters: { home: Player[]; away: Player[] };
  blurb: string;
  explainer: { whats_happening: string; rules_explainer: string; close_game: boolean };
  matchup_tea: TeaCard[];
  stats: {
    home_roster_size: number;
    away_roster_size: number;
    home_players_with_tea: number;
    away_players_with_tea: number;
    total_tea_items: number;
  };
};

/* ─────────────────── tier styling ─────────────────── */
const TIER: Record<TeaSnippet['tier'], { label: string; bg: string; fg: string; dot: string }> = {
  confirmed: { label: 'Confirmed', bg: '#E8F0EC', fg: '#0F6E56', dot: '#0F6E56' },
  reported: { label: 'Reported', bg: '#E6F1FB', fg: '#185FA5', dot: '#185FA5' },
  speculation: { label: 'Speculation', bg: '#FAEEDA', fg: '#854F0B', dot: '#854F0B' },
  rumor: { label: 'Rumor', bg: '#F1EFE8', fg: '#5F5E5A', dot: '#5F5E5A' },
};

/* ─────────────────── page ─────────────────── */
export default function GameScanPage() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Reading the scoreboard…');
  const [result, setResult] = useState<GameScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setResult(null);
    setLoading(true);
    setLoadingMsg('Reading the scoreboard…');
    setPreviewUrl(URL.createObjectURL(file));

    // Cycle loading messages while waiting
    const t1 = setTimeout(() => setLoadingMsg('Pulling rosters…'), 3000);
    const t2 = setTimeout(() => setLoadingMsg('Loading the tea…'), 6000);

    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/scan/game', { method: 'POST', body: fd });
      const data = await res.json();
      if (data && data.error) {
        setError(data.message || friendlyErrorMessage(data.error));
      } else {
        setResult(data as GameScanResponse);
      }
    } catch {
      setError('Network error — check connection and try again.');
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setPreviewUrl(null);
  }

  return (
    <main className="min-h-screen bg-white" style={{ minHeight: '100dvh' }}>
      <Header />

      {!result && !loading && (
        <Hero
          onPick={() => fileRef.current?.click()}
          error={error}
          onRetry={() => setError(null)}
        />
      )}

      {loading && <LoadingState imageUrl={previewUrl} message={loadingMsg} />}

      {result && <ResultView result={result} onScanAnother={reset} />}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </main>
  );
}

function friendlyErrorMessage(code: string): string {
  switch (code) {
    case 'no_scoreboard':
      return "Couldn't read a scoreboard — try framing the corner scorebug more squarely.";
    case 'unknown_teams':
      return "Read the scoreboard but couldn't match the teams to a known roster.";
    case 'vision_error':
      return 'Vision service hit an error — try again in a moment.';
    case 'no_key':
      return 'Scan is offline right now.';
    default:
      return 'Something went wrong — try again.';
  }
}

/* ─────────────────── header ─────────────────── */
function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-[var(--hairline)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="font-display text-base sm:text-lg font-extrabold text-green tracking-wide uppercase"
        >
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        <Link href="/" className="text-[12px] text-ink-soft hover:text-ink transition">
          ← back
        </Link>
      </div>
    </header>
  );
}

/* ─────────────────── hero / upload ─────────────────── */
function Hero({
  onPick,
  error,
  onRetry,
}: {
  onPick: () => void;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <section className="px-4 sm:px-6 pt-8 pb-16 max-w-3xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[var(--hairline)] text-[11px] text-ink-soft mb-5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
          Live demo · works during any game
        </div>
        <h1 className="font-display text-[44px] sm:text-[60px] md:text-[72px] font-bold text-green leading-[0.92] tracking-tight">
          Watching sports?
          <br />
          <span className="italic font-medium text-tangerine">Point your phone.</span>
        </h1>
        <p className="mt-6 text-[17px] sm:text-[18px] text-ink-soft leading-relaxed max-w-lg mx-auto">
          Scan the TV during any live <strong className="text-ink">NFL, NBA, or WNBA</strong> game. Get the score, the lineups, the rules, and <strong className="text-ink">the tea</strong> on every player on the floor — explained for whatever you don't know.
        </p>
      </div>

      {/* Upload card */}
      <div
        className="mt-10 mx-auto max-w-md rounded-3xl bg-cream-warm/40 border-2 border-dashed border-[var(--hairline)] p-8 text-center cursor-pointer hover:border-tangerine/60 hover:bg-tangerine/5 transition"
        onClick={onPick}
      >
        <div className="mx-auto w-16 h-16 rounded-2xl bg-tangerine flex items-center justify-center mb-4 shadow-[0_8px_22px_-8px_rgba(255,107,61,0.5)]">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
        <div className="font-display font-bold text-[19px] text-green leading-tight">
          Snap the TV (or pick a screenshot)
        </div>
        <div className="mt-1.5 text-[12.5px] text-ink-soft italic">
          Frame the corner scorebug. We'll handle the rest.
        </div>
        <div className="mt-5 inline-flex items-center justify-center bg-tangerine text-white font-semibold rounded-full px-6 py-2.5 text-[13.5px] hover:bg-tangerine-dark transition">
          Open camera →
        </div>
      </div>

      {error && (
        <div className="mt-6 mx-auto max-w-md rounded-2xl bg-burgundy/5 border border-burgundy/30 p-4 text-center">
          <div className="font-display font-bold text-[14px] text-burgundy">Couldn't read this one</div>
          <div className="mt-1 text-[13px] text-ink leading-relaxed">{error}</div>
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center justify-center gap-1.5 bg-burgundy text-white font-semibold rounded-full px-5 py-2 text-[12.5px] hover:opacity-90 transition"
          >
            Try again →
          </button>
        </div>
      )}

      {/* Helper section */}
      <div className="mt-12 max-w-md mx-auto">
        <p className="text-center text-[11px] font-bold tracking-[0.22em] uppercase text-muted mb-4">
          One scan gets you
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Helper icon="🏟" label="The score, live" />
          <Helper icon="👥" label="Every player" />
          <Helper icon="📖" label="Rules in plain English" />
          <Helper icon="☕" label="The tea on each guy" />
        </div>
        <p className="mt-6 text-center text-[12px] text-ink-soft italic px-6">
          The smart-friend mode for watching sports. No box scores. No analytics. Just what's happening + who's on the floor + what you'd want to gossip about.
        </p>
      </div>
    </section>
  );
}

function Helper({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[var(--hairline)] p-3.5 shadow-[0_4px_16px_-10px_rgba(13,45,36,0.08)]">
      <div className="text-2xl">{icon}</div>
      <div className="mt-1 text-[12px] font-semibold text-ink leading-tight">{label}</div>
    </div>
  );
}

/* ─────────────────── loading ─────────────────── */
function LoadingState({ imageUrl, message }: { imageUrl: string | null; message: string }) {
  return (
    <section className="px-4 sm:px-6 pt-8 pb-16 max-w-3xl mx-auto">
      <div className="mx-auto max-w-md">
        {imageUrl && (
          <div className="relative rounded-3xl overflow-hidden border border-[var(--hairline)] shadow-[0_24px_48px_-16px_rgba(13,45,36,0.18)]">
            <img src={imageUrl} alt="" className="w-full h-auto block" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-tangerine/[0.08] to-tangerine/[0.18]" />
            <div
              className="absolute left-0 right-0 h-0.5 bg-tangerine shadow-[0_0_12px_rgba(255,107,61,0.7)]"
              style={{ animation: 'scanline 1.8s ease-in-out infinite' }}
            />
          </div>
        )}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cream-warm border border-[var(--hairline)] text-[12px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
            {message}
          </div>
          <div className="mt-3 text-[12px] text-ink-soft italic">
            Usually 5-10 seconds.
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes scanline {
          0% { top: 0; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: calc(100% - 2px); opacity: 0; }
        }
      `}</style>
    </section>
  );
}

/* ─────────────────── result view ─────────────────── */
function ResultView({
  result,
  onScanAnother,
}: {
  result: GameScanResponse;
  onScanAnother: () => void;
}) {
  return (
    <section className="px-4 sm:px-6 pt-6 pb-16 max-w-3xl mx-auto space-y-6">
      {/* Matchup hero */}
      <MatchupHero
        matchup={result.matchup}
        closeGame={result.explainer.close_game}
        league={result.league}
        liveGame={result.live_game}
      />

      {/* Blurb */}
      {result.blurb && (
        <p className="text-center font-display italic text-[18px] sm:text-[20px] text-green leading-snug px-4">
          <span className="text-tangerine text-2xl leading-none">"</span>
          {result.blurb}
          <span className="text-tangerine text-2xl leading-none">"</span>
        </p>
      )}

      {/* What's happening + what this means */}
      <ExplainerCard explainer={result.explainer} />

      {/* Top matchup tea cards */}
      {result.matchup_tea.length > 0 && <TopTea cards={result.matchup_tea} />}

      {/* Roster sheets */}
      <RosterSection
        title={result.matchup.home.name}
        teamCode={result.matchup.home.team}
        players={result.rosters.home}
      />
      <RosterSection
        title={result.matchup.away.name}
        teamCode={result.matchup.away.team}
        players={result.rosters.away}
      />

      {/* Footer actions */}
      <div className="pt-2 flex flex-col sm:flex-row gap-3">
        <button
          onClick={onScanAnother}
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-[var(--hairline)] hover:border-tangerine hover:text-tangerine text-green font-semibold rounded-full px-6 py-3 text-[14px] transition"
        >
          ← Scan another
        </button>
        <Link
          href="/onboarding"
          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-tangerine text-white font-semibold rounded-full px-6 py-3 text-[14px] hover:bg-tangerine-dark transition shadow-[0_8px_22px_-8px_rgba(255,107,61,0.5)]"
        >
          Get the app →
        </Link>
      </div>
    </section>
  );
}

function MatchupHero({
  matchup,
  closeGame,
  league,
  liveGame,
}: {
  matchup: GameScanResponse['matchup'];
  closeGame: boolean;
  league: string;
  liveGame: LiveGameInfo;
}) {
  const isLive = liveGame.verified && liveGame.status === 'in_progress';
  const isFinal = liveGame.verified && liveGame.status === 'final';
  const isScheduled = liveGame.verified && liveGame.status === 'scheduled';
  const broadcastLabel = liveGame.broadcasts && liveGame.broadcasts.length
    ? liveGame.broadcasts.slice(0, 2).join(' · ')
    : null;
  return (
    <div
      className="relative rounded-3xl overflow-hidden border border-[var(--hairline)] shadow-[0_24px_48px_-16px_rgba(13,45,36,0.18)]"
      style={{ background: 'linear-gradient(135deg, #0D2D24 0%, #143A2E 100%)' }}
    >
      {/* Top status strip — LIVE / FINAL / verification badge */}
      {liveGame.verified && (
        <div className="px-5 sm:px-7 pt-3 flex items-center justify-between text-white/80">
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live
              </span>
            )}
            {isFinal && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-bold tracking-widest uppercase">
                Final
              </span>
            )}
            {isScheduled && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold tracking-widest uppercase">
                Pre-game
              </span>
            )}
            <span className="text-[10px] uppercase tracking-widest text-white/50">
              ✓ verified · espn
            </span>
          </div>
          {broadcastLabel && (
            <span className="text-[10.5px] uppercase tracking-wider text-tangerine font-semibold">
              on {broadcastLabel}
            </span>
          )}
        </div>
      )}

      <div className="px-5 sm:px-7 py-6 sm:py-8 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            {/* Home */}
            <div className="flex items-center gap-3">
              <div className="font-display font-extrabold text-[28px] sm:text-[34px] tracking-wider">
                {matchup.home.team}
              </div>
              <div className="font-display font-bold text-[44px] sm:text-[56px] leading-none tabular-nums">
                {matchup.home.score}
              </div>
            </div>
            <div className="text-[12px] text-white/70 ml-1">{matchup.home.name}</div>
            <div className="border-t border-white/15 w-32" />
            {/* Away */}
            <div className="flex items-center gap-3">
              <div className="font-display font-extrabold text-[28px] sm:text-[34px] tracking-wider">
                {matchup.away.team}
              </div>
              <div className="font-display font-bold text-[44px] sm:text-[56px] leading-none tabular-nums">
                {matchup.away.score}
              </div>
            </div>
            <div className="text-[12px] text-white/70 ml-1">{matchup.away.name}</div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/10 backdrop-blur text-[11px] font-mono font-bold tracking-wider">
              {matchup.period_label || `Q${matchup.period}`}
              {matchup.clock && <span className="ml-2 text-tangerine">· {matchup.clock}</span>}
            </div>
            {closeGame && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-tangerine text-white text-[10px] font-bold tracking-widest uppercase shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Close
              </div>
            )}
            <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">
              {league.toUpperCase()}
            </div>
          </div>
        </div>
        {!liveGame.verified && (
          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/50 italic">
            Read from scoreboard only — couldn't match against today's live games.
          </div>
        )}
      </div>
    </div>
  );
}

function ExplainerCard({ explainer }: { explainer: GameScanResponse['explainer'] }) {
  return (
    <div className="bg-cream-warm/60 border border-[var(--hairline)] rounded-3xl p-5 sm:p-6">
      <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-tangerine mb-2">
        What's happening
      </div>
      <p className="font-display font-bold text-[18px] sm:text-[20px] text-green leading-snug">
        {explainer.whats_happening}
      </p>
      {explainer.rules_explainer && (
        <>
          <div className="mt-4 pt-4 border-t border-[var(--hairline)]">
            <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-tangerine mb-2">
              What this means
            </div>
            <p className="text-[14.5px] text-ink leading-relaxed">{explainer.rules_explainer}</p>
          </div>
        </>
      )}
    </div>
  );
}

function TopTea({ cards }: { cards: TeaCard[] }) {
  return (
    <div>
      <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-tangerine mb-3 px-1">
        ☕ What to know about this game
      </div>
      <div className="space-y-3">
        {cards.map((c) => {
          const tier = TIER[c.tier];
          return (
            <div
              key={c.player_id + c.headline}
              className="bg-white rounded-2xl border border-[var(--hairline)] p-4 shadow-[0_4px_16px_-10px_rgba(13,45,36,0.08)]"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {c.headshot ? (
                    <img
                      src={c.headshot}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover bg-cream-warm border border-[var(--hairline)]"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-cream-warm border border-[var(--hairline)] flex items-center justify-center text-xs font-bold text-ink-soft">
                      {c.player_name
                        .split(' ')
                        .map((s) => s[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-display font-bold text-[14px] text-green truncate">
                      {c.player_name}
                    </div>
                    <div className="text-[10.5px] text-muted">
                      {c.team} · {c.category}
                    </div>
                  </div>
                </div>
                <span
                  className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                  style={{ background: tier.bg, color: tier.fg }}
                >
                  {tier.label}
                </span>
              </div>
              <h3 className="font-display font-bold text-[15px] text-green leading-snug">
                {c.headline}
              </h3>
              <p className="mt-1 text-[13px] text-ink leading-relaxed">{c.summary}</p>
              {c.source && (
                <div className="mt-2 text-[10.5px] text-muted italic">
                  via{' '}
                  <a
                    href={c.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-tangerine hover:underline not-italic"
                  >
                    {c.source.name}
                  </a>{' '}
                  · {c.source.date}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RosterSection({
  title,
  teamCode,
  players,
}: {
  title: string;
  teamCode: string;
  players: Player[];
}) {
  const [open, setOpen] = useState(false);
  const withTea = players.filter((p) => p.hasTea).length;

  return (
    <div className="bg-white rounded-2xl border border-[var(--hairline)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-cream-warm/30 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-widest uppercase bg-green text-white">
            {teamCode}
          </span>
          <span className="font-display font-bold text-[15px] text-green truncate">{title}</span>
          <span className="text-[11px] text-muted shrink-0">
            {players.length} players · {withTea} w/ tea
          </span>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-[var(--hairline)] divide-y divide-[var(--hairline)]">
          {players.map((p) => (
            <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-cream-warm/20 transition">
              {p.headshot ? (
                <img
                  src={p.headshot}
                  alt=""
                  className="w-10 h-10 rounded-full object-cover bg-cream-warm border border-[var(--hairline)] shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-cream-warm border border-[var(--hairline)] flex items-center justify-center text-xs font-bold text-ink-soft shrink-0">
                  {p.name
                    .split(' ')
                    .map((s) => s[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-[14px] text-green truncate">{p.name}</div>
                <div className="text-[11px] text-muted">
                  {p.pos}
                  {p.jersey && ` · #${p.jersey}`}
                </div>
                {p.tea[0] && (
                  <div className="mt-1 flex items-start gap-1.5">
                    <span
                      className="shrink-0 inline-block w-1.5 h-1.5 rounded-full mt-1.5"
                      style={{ background: TIER[p.tea[0].tier].dot }}
                    />
                    <span className="text-[12px] text-ink-soft leading-snug line-clamp-2">
                      {p.tea[0].headline}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
