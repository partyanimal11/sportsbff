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

import { useEffect, useRef, useState } from 'react';
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
type Partner = {
  name: string;
  relationship: string;            // "wife" | "girlfriend" | "fiancee" | "single" | etc
  since: string | null;
  ig_handle: string | null;
  ig_url: string | null;
  known_for: string | null;
  tier: 'confirmed' | 'reported' | 'speculation' | 'rumor';
  source: { name: string; url: string; date: string };
};
type Player = {
  id: string;
  name: string;
  jersey: string;
  pos: string;
  headshot: string | null;
  tea: TeaSnippet[];
  hasTea: boolean;
  partner: Partner | null;
  hasPartner: boolean;
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
  context: string;
  lens: 'plain' | 'euphoria';
  explainer: { whats_happening: string; rules_explainer: string; close_game: boolean };
  matchup_tea: TeaCard[];
  stats: {
    home_roster_size: number;
    away_roster_size: number;
    home_players_with_tea: number;
    away_players_with_tea: number;
    home_players_with_partner?: number;
    away_players_with_partner?: number;
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

/* ─────────────────── scout mode types ─────────────────── */
type ScoutGame = {
  espn_id: string;
  status: 'in_progress' | 'scheduled' | 'final' | 'postponed' | 'unknown';
  status_label: string;
  home: { team: string; name: string; score: number };
  away: { team: string; name: string; score: number };
  clock: string;
  period: number;
  period_label: string;
  broadcasts: string[];
  start_time: string | null;
};
type ScoutGamesResponse = { league: string; games: ScoutGame[]; count: number };

/* ─────────────────── page ─────────────────── */
export default function GameScanPage() {
  const [scanMode, setScanMode] = useState<'scan' | 'scout'>('scan');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Reading the scoreboard…');
  const [result, setResult] = useState<GameScanResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Preserve the original captured file so we can re-fetch with ?lens=euphoria
  // without forcing the user to scan again
  const [lastFile, setLastFile] = useState<File | null>(null);
  // SCOUT mode — preserve the last picked matchup so the lens toggle can re-fetch
  const [lastScoutMatchup, setLastScoutMatchup] = useState<{
    league: string;
    home_team: string;
    away_team: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File, opts: { lens?: 'plain' | 'euphoria' } = {}) {
    setError(null);
    setLoading(true);
    setLoadingMsg(opts.lens === 'euphoria' ? 'Through Euphoria…' : 'Reading the scoreboard…');
    setLastFile(file);
    if (!opts.lens) {
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null); // Fresh scan, clear old result
    }

    // Cycle loading messages while waiting (skip on lens swap — fast enough)
    const t1 = !opts.lens ? setTimeout(() => setLoadingMsg('Pulling rosters…'), 3000) : null;
    const t2 = !opts.lens ? setTimeout(() => setLoadingMsg('Loading the tea…'), 6000) : null;

    try {
      const fd = new FormData();
      fd.append('image', file);
      const lensParam = opts.lens === 'euphoria' ? '?lens=euphoria' : '';
      const res = await fetch('/api/scan/game' + lensParam, { method: 'POST', body: fd });
      const data = await res.json();
      if (data && data.error) {
        setError(data.message || friendlyErrorMessage(data.error));
      } else {
        setResult(data as GameScanResponse);
      }
    } catch {
      setError('Network error — check connection and try again.');
    } finally {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setPreviewUrl(null);
    setLastFile(null);
    setLastScoutMatchup(null);
  }

  /**
   * SCOUT-mode submit. User picked a game from the picker (or set a custom
   * matchup). Hits /api/scan/game with JSON body — server skips vision.
   */
  async function submitScout(
    league: string,
    home_team: string,
    away_team: string,
    opts: { lens?: 'plain' | 'euphoria' } = {},
  ) {
    setError(null);
    setLoading(true);
    setLoadingMsg(opts.lens === 'euphoria' ? 'Through Euphoria…' : 'Loading the matchup…');
    setLastScoutMatchup({ league, home_team, away_team });
    if (!opts.lens) {
      setPreviewUrl(null);
      setResult(null);
    }
    const t1 = !opts.lens ? setTimeout(() => setLoadingMsg('Pulling rosters…'), 1500) : null;
    const t2 = !opts.lens ? setTimeout(() => setLoadingMsg('Loading the tea…'), 3000) : null;
    try {
      const lensParam = opts.lens === 'euphoria' ? '?lens=euphoria' : '';
      const res = await fetch('/api/scan/game' + lensParam, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ league, home_team, away_team }),
      });
      const data = await res.json();
      if (data && data.error) {
        setError(data.message || friendlyErrorMessage(data.error));
      } else {
        setResult(data as GameScanResponse);
      }
    } catch {
      setError('Network error — check connection and try again.');
    } finally {
      if (t1) clearTimeout(t1);
      if (t2) clearTimeout(t2);
      setLoading(false);
    }
  }

  function toggleLens(toLens: 'plain' | 'euphoria') {
    if (loading) return;
    // Lens toggle works for both SCAN and SCOUT — pick the right re-fetch path
    if (lastFile) {
      handleFile(lastFile, { lens: toLens });
    } else if (lastScoutMatchup) {
      submitScout(
        lastScoutMatchup.league,
        lastScoutMatchup.home_team,
        lastScoutMatchup.away_team,
        { lens: toLens },
      );
    }
  }

  return (
    <main className="min-h-screen bg-white" style={{ minHeight: '100dvh' }}>
      <Header />

      {!result && !loading && (
        <>
          <ModeToggle mode={scanMode} onChange={setScanMode} />
          {scanMode === 'scan' ? (
            <ScanCamera
              onCapture={handleFile}
              onPickFromLibrary={() => fileRef.current?.click()}
              error={error}
              onRetry={() => setError(null)}
            />
          ) : (
            <ScoutPicker
              onPick={submitScout}
              error={error}
              onRetry={() => setError(null)}
            />
          )}
        </>
      )}

      {loading && <LoadingState imageUrl={previewUrl} message={loadingMsg} />}

      {result && <ResultView result={result} onScanAnother={reset} onToggleLens={toggleLens} />}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
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

/* ─────────────────── mode toggle (SCAN / SCOUT) ─────────────────── */
function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'scan' | 'scout';
  onChange: (m: 'scan' | 'scout') => void;
}) {
  return (
    <div className="px-4 sm:px-6 max-w-3xl mx-auto pt-6">
      <div className="bg-cream-warm/60 border border-[var(--hairline)] rounded-full p-1 flex w-full max-w-xs mx-auto">
        <button
          onClick={() => onChange('scan')}
          className={`flex-1 py-2 px-4 rounded-full text-[13px] font-semibold transition flex items-center justify-center gap-1.5 ${
            mode === 'scan'
              ? 'bg-tangerine text-white shadow-[0_2px_8px_-2px_rgba(255,107,61,0.5)]'
              : 'text-ink-soft hover:text-ink'
          }`}
          aria-pressed={mode === 'scan'}
        >
          <span aria-hidden>📷</span> Scan
        </button>
        <button
          onClick={() => onChange('scout')}
          className={`flex-1 py-2 px-4 rounded-full text-[13px] font-semibold transition flex items-center justify-center gap-1.5 ${
            mode === 'scout'
              ? 'bg-green text-white shadow-[0_2px_8px_-2px_rgba(13,45,36,0.4)]'
              : 'text-ink-soft hover:text-ink'
          }`}
          aria-pressed={mode === 'scout'}
        >
          <span aria-hidden>✦</span> Scout
        </button>
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-soft italic">
        {mode === 'scan' ? 'Watching on TV — point your phone' : 'Pick any game — no TV needed'}
      </p>
    </div>
  );
}

/* ─────────────────── scout picker — manual game lookup ─────────────────── */
function ScoutPicker({
  onPick,
  error,
  onRetry,
}: {
  onPick: (league: string, home: string, away: string) => void;
  error: string | null;
  onRetry: () => void;
}) {
  const [league, setLeague] = useState<'nba' | 'nfl' | 'wnba'>('nba');
  const [games, setGames] = useState<ScoutGame[] | null>(null);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPickerLoading(true);
    setPickerError(null);
    setGames(null);
    fetch(`/api/games/today?league=${league}`)
      .then((r) => r.json())
      .then((d: ScoutGamesResponse) => {
        if (cancelled) return;
        setGames(d.games || []);
      })
      .catch(() => {
        if (cancelled) return;
        setPickerError("Couldn't load today's games — check your connection.");
      })
      .finally(() => {
        if (!cancelled) setPickerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [league]);

  return (
    <section className="px-4 sm:px-6 pt-4 pb-16 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center">
        <h1 className="font-display text-[32px] sm:text-[44px] font-bold text-green leading-[0.95] tracking-tight">
          Pick the game.
          <br />
          <span className="italic font-medium text-tangerine">We'll do the rest.</span>
        </h1>
        <p className="mt-3 text-[14px] sm:text-[15px] text-ink-soft leading-relaxed max-w-md mx-auto">
          No TV needed. Tap a live game, scout one before tipoff, or look up a game that already ended.
        </p>
      </div>

      {/* League chips */}
      <div className="mt-6 flex justify-center gap-2">
        {(['nba', 'nfl', 'wnba'] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLeague(l)}
            className={`px-4 py-2 rounded-full text-[12px] font-bold uppercase tracking-wider transition ${
              league === l
                ? 'bg-green text-white'
                : 'bg-white border border-[var(--hairline)] text-ink-soft hover:text-ink'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Today's games */}
      <div className="mt-6 max-w-md mx-auto">
        <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-tangerine mb-3 text-center">
          Today · {league.toUpperCase()}
        </p>

        {pickerLoading && (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-2 border-tangerine border-t-transparent rounded-full animate-spin" />
            <div className="mt-2 text-[12px] text-ink-soft">Loading today's games…</div>
          </div>
        )}

        {pickerError && (
          <div className="rounded-2xl bg-burgundy/5 border border-burgundy/30 p-4 text-center">
            <div className="text-[13px] text-ink leading-relaxed">{pickerError}</div>
          </div>
        )}

        {games && games.length === 0 && !pickerLoading && (
          <div className="rounded-2xl bg-cream-warm/60 border border-[var(--hairline)] p-5 text-center">
            <div className="font-display font-bold text-[15px] text-green">No {league.toUpperCase()} games today</div>
            <div className="mt-1 text-[12px] text-ink-soft italic">Try another league, or use a custom matchup below.</div>
          </div>
        )}

        {games && games.length > 0 && (
          <div className="space-y-2">
            {games.map((g) => (
              <ScoutGameTile key={g.espn_id} game={g} onTap={() => onPick(league, g.home.team, g.away.team)} />
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mt-6 mx-auto max-w-md rounded-2xl bg-burgundy/5 border border-burgundy/30 p-4 text-center">
          <div className="font-display font-bold text-[14px] text-burgundy">Couldn't load this matchup</div>
          <div className="mt-1 text-[13px] text-ink leading-relaxed">{error}</div>
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center justify-center gap-1.5 bg-burgundy text-white font-semibold rounded-full px-5 py-2 text-[12.5px] hover:opacity-90 transition"
          >
            Try again →
          </button>
        </div>
      )}
    </section>
  );
}

function ScoutGameTile({ game, onTap }: { game: ScoutGame; onTap: () => void }) {
  const isLive = game.status === 'in_progress';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';
  const startTime = game.start_time
    ? new Date(game.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;
  return (
    <button
      onClick={onTap}
      className="w-full text-left bg-white border border-[var(--hairline)] rounded-2xl p-3.5 hover:bg-cream-warm/40 hover:border-tangerine/50 transition shadow-[0_2px_8px_-4px_rgba(13,45,36,0.06)]"
    >
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <div className="shrink-0 w-14 flex flex-col items-center">
          {isLive && (
            <>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[8px] font-bold tracking-widest uppercase">
                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
              <span className="mt-1 text-[10px] font-mono tabular-nums text-ink-soft">{game.period_label || `Q${game.period}`}</span>
              {game.clock && <span className="text-[10px] font-mono tabular-nums text-tangerine">{game.clock}</span>}
            </>
          )}
          {isFinal && (
            <>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-ink/10 text-ink text-[8px] font-bold tracking-widest uppercase">
                FINAL
              </span>
            </>
          )}
          {isScheduled && (
            <>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-tangerine/10 text-tangerine text-[8px] font-bold tracking-widest uppercase">
                SOON
              </span>
              {startTime && <span className="mt-1 text-[10px] font-mono text-ink-soft">{startTime}</span>}
            </>
          )}
        </div>

        {/* Matchup */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-[14px] tracking-wider text-green">
              {game.away.team}
            </span>
            {(isLive || isFinal) && (
              <span className="font-display font-bold text-[16px] tabular-nums text-ink">
                {game.away.score}
              </span>
            )}
            <span className="text-[11px] text-muted">@</span>
            <span className="font-display font-extrabold text-[14px] tracking-wider text-green">
              {game.home.team}
            </span>
            {(isLive || isFinal) && (
              <span className="font-display font-bold text-[16px] tabular-nums text-ink">
                {game.home.score}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[11px] text-ink-soft truncate">
            {game.away.name} at {game.home.name}
            {game.broadcasts.length > 0 && (
              <span className="text-tangerine"> · on {game.broadcasts.slice(0, 2).join(' / ')}</span>
            )}
          </div>
        </div>

        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft shrink-0" aria-hidden>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  );
}

/* ─────────────────── live camera viewfinder ─────────────────── */
function ScanCamera({
  onCapture,
  onPickFromLibrary,
  error,
  onRetry,
}: {
  onCapture: (file: File) => void;
  onPickFromLibrary: () => void;
  error: string | null;
  onRetry: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'idle' | 'requesting' | 'live' | 'denied' | 'unavailable'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Start the camera. Async so we can await getUserMedia.
  async function startCamera() {
    setCameraState('requesting');
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('unavailable');
        setCameraError('Your browser doesn\'t support live camera access. Use the upload option below.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // back camera on phones
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('live');
    } catch (err) {
      const msg = String(err);
      if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
        setCameraState('denied');
        setCameraError('Camera permission denied. Use the upload option below or change permissions in browser settings.');
      } else if (msg.includes('NotFoundError') || msg.includes('NotReadableError')) {
        setCameraState('unavailable');
        setCameraError('No camera found. Use the upload option below.');
      } else {
        setCameraState('unavailable');
        setCameraError(`Camera couldn't start: ${msg.slice(0, 80)}. Use upload below.`);
      }
    }
  }

  // Stop the stream when the component unmounts or camera state goes back to idle
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Capture a still frame from the video and pass it up
  function captureFrame() {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
        // Stop the camera stream — we have what we need
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        setCameraState('idle');
        onCapture(file);
      },
      'image/jpeg',
      0.85,
    );
  }

  return (
    <section className="px-4 sm:px-6 pt-6 pb-16 max-w-3xl mx-auto">
      {/* Hero copy */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[var(--hairline)] text-[11px] text-ink-soft mb-5 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
          Live demo · works during any game
        </div>
        <h1 className="font-display text-[40px] sm:text-[56px] md:text-[68px] font-bold text-green leading-[0.92] tracking-tight">
          Watching sports?
          <br />
          <span className="italic font-medium text-tangerine">Point your phone.</span>
        </h1>
        <p className="mt-5 text-[16px] sm:text-[17px] text-ink-soft leading-relaxed max-w-lg mx-auto">
          Scan the TV during any live <strong className="text-ink">NFL, NBA, or WNBA</strong> game. Get the score, the lineups, the rules, and <strong className="text-ink">the tea</strong> on every player on the floor.
        </p>
      </div>

      {/* "What's a scorebug?" example illustration */}
      <ScorebugExample />

      {/* Camera viewfinder OR start-camera prompt */}
      <div className="mt-8 mx-auto max-w-md">
        {cameraState === 'idle' && (
          <div
            className="relative rounded-3xl overflow-hidden bg-green/95 aspect-[9/12] flex flex-col items-center justify-center text-center cursor-pointer group shadow-[0_24px_48px_-16px_rgba(13,45,36,0.18)]"
            onClick={startCamera}
          >
            {/* Corner brackets */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-[3px] border-l-[3px] border-tangerine rounded-tl" />
            <div className="absolute top-4 right-4 w-8 h-8 border-t-[3px] border-r-[3px] border-tangerine rounded-tr" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-[3px] border-l-[3px] border-tangerine rounded-bl" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-[3px] border-r-[3px] border-tangerine rounded-br" />
            {/* Camera icon + tap-to-start */}
            <div className="w-20 h-20 rounded-full bg-tangerine flex items-center justify-center mb-5 shadow-[0_8px_28px_-6px_rgba(255,107,61,0.6)] group-hover:scale-105 transition">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div className="font-display font-bold text-white text-[20px] leading-tight px-6">
              Tap to start camera
            </div>
            <div className="mt-2 text-[12.5px] text-white/70 italic px-8">
              Point at the scorebug on your TV
            </div>
          </div>
        )}

        {cameraState === 'requesting' && (
          <div className="rounded-3xl bg-cream-warm border border-[var(--hairline)] aspect-[9/12] flex items-center justify-center text-center px-8">
            <div>
              <div className="inline-block w-8 h-8 border-2 border-tangerine border-t-transparent rounded-full animate-spin mb-3" />
              <div className="text-[14px] text-ink-soft">Allow camera access in the prompt…</div>
            </div>
          </div>
        )}

        {cameraState === 'live' && (
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden bg-black aspect-[9/12] shadow-[0_24px_48px_-16px_rgba(13,45,36,0.25)]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Corner brackets */}
              <div className="absolute top-4 left-4 w-10 h-10 border-t-[3px] border-l-[3px] border-tangerine rounded-tl pointer-events-none" />
              <div className="absolute top-4 right-4 w-10 h-10 border-t-[3px] border-r-[3px] border-tangerine rounded-tr pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-10 h-10 border-b-[3px] border-l-[3px] border-tangerine rounded-bl pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-10 h-10 border-b-[3px] border-r-[3px] border-tangerine rounded-br pointer-events-none" />
              {/* Animated scan line */}
              <div
                className="absolute left-4 right-4 h-0.5 bg-tangerine shadow-[0_0_12px_rgba(255,107,61,0.7)] pointer-events-none"
                style={{ animation: 'scanline 2s ease-in-out infinite' }}
              />
              {/* Helper text overlay */}
              <div className="absolute top-16 left-0 right-0 text-center pointer-events-none">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-black/50 text-white/90 text-[11px] font-mono backdrop-blur">
                  Frame the scorebug
                </div>
              </div>
            </div>
            {/* Shutter button */}
            <div className="mt-6 flex flex-col items-center">
              <button
                onClick={captureFrame}
                aria-label="Capture"
                className="w-20 h-20 rounded-full bg-tangerine border-4 border-white shadow-[0_8px_28px_-6px_rgba(255,107,61,0.6)] hover:scale-105 active:scale-95 transition"
              >
                <span className="block w-full h-full rounded-full ring-2 ring-tangerine ring-offset-2" />
              </button>
              <div className="mt-3 text-[12px] text-ink-soft italic">Tap to scan</div>
            </div>
          </div>
        )}

        {(cameraState === 'denied' || cameraState === 'unavailable') && (
          <div className="rounded-3xl bg-cream-warm border border-[var(--hairline)] p-6 text-center">
            <div className="font-display font-bold text-[15px] text-green mb-2">Camera unavailable</div>
            <div className="text-[13px] text-ink-soft leading-relaxed mb-4">{cameraError}</div>
            <button
              onClick={onPickFromLibrary}
              className="inline-flex items-center bg-tangerine text-white font-semibold rounded-full px-6 py-2.5 text-[13.5px] hover:bg-tangerine-dark transition"
            >
              Pick a screenshot →
            </button>
          </div>
        )}
      </div>

      {/* Pick-from-library backup link (always visible when camera is idle/live) */}
      {(cameraState === 'idle' || cameraState === 'live') && (
        <div className="mt-4 text-center">
          <button
            onClick={onPickFromLibrary}
            className="text-[13px] text-ink-soft hover:text-ink underline underline-offset-2"
          >
            or pick a screenshot from your library
          </button>
        </div>
      )}

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

      <style jsx>{`
        @keyframes scanline {
          0% { top: 16px; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: calc(100% - 18px); opacity: 0; }
        }
      `}</style>
    </section>
  );
}

/**
 * PartnerCard — the WAG / SO sidecar shown inline when a player row is expanded.
 * Highlights: partner name, relationship label, IG link, "known for" caption,
 * tier pill + source citation. Generic for any league.
 */
function PartnerCard({ partner, playerName }: { partner: Partner; playerName: string }) {
  const tier = TIER[partner.tier];
  const isSingle = partner.relationship === 'single';
  const initials = partner.name
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const relLabel: Record<string, string> = {
    wife: 'WIFE',
    husband: 'HUSBAND',
    fiancee: 'FIANCÉE',
    fiance: 'FIANCÉ',
    girlfriend: 'GIRLFRIEND',
    boyfriend: 'BOYFRIEND',
    partner: 'PARTNER',
    'long-term partner': 'LONG-TERM PARTNER',
    single: 'CURRENTLY SINGLE',
  };
  return (
    <div className="bg-white rounded-2xl border border-[var(--hairline)] p-3.5 shadow-[0_2px_8px_-4px_rgba(13,45,36,0.06)]">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase text-magenta">
          ✿ {relLabel[partner.relationship] || 'PARTNER'}
        </span>
        <span
          className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
          style={{ background: tier.bg, color: tier.fg }}
        >
          {tier.label}
        </span>
      </div>
      <div className="flex items-start gap-3">
        {/* Avatar placeholder — initials in a soft pink circle */}
        <div
          className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-[14px] text-magenta"
          style={{ background: 'linear-gradient(135deg, #FCE4EC, #F4B6C2)' }}
        >
          {isSingle ? '◯' : initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-[15px] text-green leading-tight">
            {partner.name}
          </div>
          {partner.known_for && (
            <p className="mt-0.5 text-[12.5px] text-ink-soft leading-snug">{partner.known_for}</p>
          )}
          {partner.ig_url && (
            <a
              href={partner.ig_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-magenta hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <span aria-hidden>📸</span>
              <span>@{partner.ig_handle}</span>
            </a>
          )}
          {partner.since && !isSingle && (
            <div className="mt-1 text-[10.5px] text-muted">since {partner.since}</div>
          )}
          <div className="mt-1.5 text-[10px] text-muted italic">
            via{' '}
            <a
              href={partner.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-magenta hover:underline not-italic"
              onClick={(e) => e.stopPropagation()}
            >
              {partner.source.name}
            </a>{' '}
            · {partner.source.date}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generic scorebug illustration. Pure SVG, no real team logos / colors / abbrevs.
 * Helps non-sports-fans recognize what "the scorebug" is on a TV broadcast.
 *
 * Two abstract team color blocks (sage + warm orange — generic, brand-friendly),
 * placeholder "HOM" / "AWY" abbrevs, fake scores, period chip. Pulse animation
 * on the period chip mimics live-game energy.
 */
function ScorebugExample() {
  return (
    <div className="mt-8 mx-auto max-w-md">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-warm border border-[var(--hairline)] text-[11px] text-ink-soft">
          <span className="font-semibold text-ink">Not sure what to scan?</span>
          Look for this in the corner of the TV
        </div>
      </div>

      {/* The mockup */}
      <div className="mt-4 mx-auto max-w-[320px] relative">
        {/* Hand-drawn arrow loop */}
        <svg
          aria-hidden
          width="100%"
          height="56"
          viewBox="0 0 320 56"
          className="absolute -top-2 left-0 right-0 pointer-events-none opacity-70"
        >
          <path
            d="M 30 12 Q 80 0, 140 18 Q 200 36, 250 14"
            stroke="#FF6B3D"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            strokeDasharray="4 3"
          />
          <path
            d="M 245 8 L 252 14 L 245 22"
            stroke="#FF6B3D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <div className="text-right pr-1 mb-2">
          <span className="font-script text-tangerine text-[16px] rotate-[-2deg] inline-block">
            this thing →
          </span>
        </div>

        {/* The scorebug itself */}
        <div
          className="relative rounded-xl overflow-hidden shadow-[0_12px_32px_-10px_rgba(13,45,36,0.25)] ring-1 ring-black/5"
          style={{ background: '#0D2D24' }}
        >
          <div className="flex items-stretch text-white text-sm">
            {/* Away team */}
            <div className="flex-1 px-3 py-3 flex items-center gap-3" style={{ background: '#0F6E56' }}>
              <span className="inline-block w-6 h-6 rounded-full bg-white/20 border border-white/30" />
              <span className="font-display font-extrabold tracking-wider text-[15px]">AWY</span>
              <span className="ml-auto font-display font-bold text-[22px] tabular-nums">79</span>
            </div>
            {/* Home team */}
            <div className="flex-1 px-3 py-3 flex items-center gap-3 border-l border-white/10" style={{ background: '#FF6B3D' }}>
              <span className="inline-block w-6 h-6 rounded-full bg-white/25 border border-white/40" />
              <span className="font-display font-extrabold tracking-wider text-[15px]">HOM</span>
              <span className="ml-auto font-display font-bold text-[22px] tabular-nums">84</span>
            </div>
          </div>
          {/* Period strip */}
          <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-mono tracking-wider text-white/85" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </span>
            <span>Q3 · 4:21</span>
            <span className="opacity-60">SPORTSBFF</span>
          </div>
        </div>

        <p className="mt-3 text-center text-[12px] text-ink-soft italic px-4">
          Every NFL, NBA, and WNBA broadcast has one. Usually corner of the screen, with team abbreviations and the score.
        </p>
      </div>
    </div>
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
  onToggleLens,
}: {
  result: GameScanResponse;
  onScanAnother: () => void;
  onToggleLens: (lens: 'plain' | 'euphoria') => void;
}) {
  const isEuphoria = result.lens === 'euphoria';
  return (
    <section className="px-4 sm:px-6 pt-6 pb-16 max-w-3xl mx-auto space-y-6">
      {/* Matchup hero */}
      <MatchupHero
        matchup={result.matchup}
        closeGame={result.explainer.close_game}
        league={result.league}
        liveGame={result.live_game}
      />

      {/* Lens toggle — Euphoria voice on/off */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onToggleLens('plain')}
          className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition ${
            !isEuphoria
              ? 'bg-green text-white shadow-[0_4px_12px_-4px_rgba(13,45,36,0.3)]'
              : 'bg-white border border-[var(--hairline)] text-ink-soft hover:text-ink'
          }`}
        >
          sportsBFF voice
        </button>
        <button
          onClick={() => onToggleLens('euphoria')}
          className={`px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition ${
            isEuphoria
              ? 'text-white shadow-[0_4px_12px_-4px_rgba(74,45,107,0.4)]'
              : 'bg-white border border-[var(--hairline)] text-ink-soft hover:text-ink'
          }`}
          style={isEuphoria ? { background: 'linear-gradient(135deg, #DCD0F4 0%, #4A2D6B 200%)' } : undefined}
        >
          ✨ Through Euphoria
        </button>
      </div>

      {/* Blurb */}
      {result.blurb && (
        <p
          className={`text-center font-display italic text-[18px] sm:text-[20px] leading-snug px-4 ${
            isEuphoria ? 'text-lilac' : 'text-green'
          }`}
        >
          <span className={`${isEuphoria ? 'text-lilac' : 'text-tangerine'} text-2xl leading-none`}>"</span>
          {result.blurb}
          <span className={`${isEuphoria ? 'text-lilac' : 'text-tangerine'} text-2xl leading-none`}>"</span>
        </p>
      )}

      {/* Game context narrative */}
      {result.context && (
        <div
          className="rounded-3xl border p-5 sm:p-6"
          style={
            isEuphoria
              ? { background: 'linear-gradient(180deg, #FBF6FF 0%, #F4ECFF 100%)', borderColor: '#DCD0F4' }
              : { background: '#FCF8F2', borderColor: 'var(--hairline)' }
          }
        >
          <div
            className={`text-[10px] font-bold tracking-[0.22em] uppercase mb-2 ${
              isEuphoria ? 'text-lilac' : 'text-tangerine'
            }`}
          >
            {isEuphoria ? '✨ Through Euphoria' : 'The bigger story'}
          </div>
          <p className={`text-[14.5px] leading-relaxed ${isEuphoria ? 'text-ink italic' : 'text-ink'}`}>
            {result.context}
          </p>
        </div>
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
  // Per-player expansion state — tracks which player rows have been tapped
  // open. Multiple can be open at once.
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());

  function togglePlayer(id: string) {
    setExpandedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
          {players.map((p) => {
            const isExpanded = expandedPlayers.has(p.id);
            return (
              <div key={p.id}>
                <button
                  onClick={() => togglePlayer(p.id)}
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-cream-warm/20 transition text-left"
                >
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
                    {p.tea[0] && !isExpanded && (
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
                    {!p.hasTea && !isExpanded && (
                      <div className="mt-1 text-[11px] text-muted italic">no tea yet</div>
                    )}
                  </div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-ink-soft shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {/* Inline expanded view — full tea + partner */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-1 bg-cream-warm/40 border-t border-[var(--hairline)]/50 space-y-3">
                    {p.partner && <PartnerCard partner={p.partner} playerName={p.name} />}
                    {p.hasTea ? (
                      p.tea.map((t, i) => {
                        const tier = TIER[t.tier];
                        return (
                          <div
                            key={i}
                            className="bg-white rounded-2xl border border-[var(--hairline)] p-3.5 shadow-[0_2px_8px_-4px_rgba(13,45,36,0.06)]"
                          >
                            <div className="flex items-start justify-between gap-3 mb-1.5">
                              <span
                                className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                                style={{ background: tier.bg, color: tier.fg }}
                              >
                                {tier.label}
                              </span>
                              <span className="text-[10px] text-muted">{t.category}</span>
                            </div>
                            <h4 className="font-display font-bold text-[14px] text-green leading-snug">
                              {t.headline}
                            </h4>
                            <p className="mt-1 text-[12.5px] text-ink leading-relaxed">{t.summary}</p>
                            {t.source && (
                              <div className="mt-2 text-[10.5px] text-muted italic">
                                via{' '}
                                <a
                                  href={t.source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-tangerine hover:underline not-italic"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {t.source.name}
                                </a>{' '}
                                · {t.source.date}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-3 text-[12px] text-muted italic">
                        No tea on file for this one yet — we add new drama daily.
                      </div>
                    )}
                    <Link
                      href={`/player/${p.id}`}
                      className="block text-center text-[11px] text-tangerine font-semibold hover:underline pt-1"
                    >
                      Open full profile →
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
