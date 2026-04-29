'use client';

/**
 * Tea'd Up — Scan tab.
 *
 * Hero feature. Camera/upload → /api/scan with modes → mode-organized result
 * with confirmation tier pills + storyline narrative + concept explainer.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { BottomTabs, BottomTabsSpacer } from '@/components/BottomTabs';
import { TeaUpToggle } from '@/components/TeaUpToggle';
import { TierPill, type Tier } from '@/components/TierPill';
import { getProfile, setProfile } from '@/lib/profile';
import { getSocial, instagramUrl } from '@/lib/players-social';

type ScanModes = {
  drama?: { tier: Tier; headline: string; summary: string }[];
  on_field?: string;
  learn?: string;
};

type ScanResult = {
  player_name: string;
  number: number;
  position: string;
  team: string;
  jersey_color: 'red' | 'blue' | 'green' | 'purple' | 'yellow' | 'white';
  blurb: string;
  game?: { home: string; home_score: number; away: string; away_score: number; clock: string };
  modes?: ScanModes;
};

const RANDOM_ATHLETES = [
  'travis-kelce', 'patrick-mahomes', 'shai-gilgeous-alexander', 'victor-wembanyama',
  'lebron-james', 'luka-doncic', 'kawhi-leonard', 'joel-embiid', 'josh-allen', 'lamar-jackson',
];

export default function ScanPage() {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<'idle' | 'live' | 'preview' | 'scanning' | 'result' | 'unknown'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [teadUp, setTeadUp] = useState<boolean>(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  // Hydrate from profile (avoids SSR mismatch)
  useEffect(() => {
    setMounted(true);
    const p = getProfile();
    setTeadUp(!!p.teadUpEnabled);
  }, []);

  function toggleTeadUp() {
    const next = !teadUp;
    setTeadUp(next);
    setProfile({ teadUpEnabled: next });
  }

  // Active modes derived from teadUp — drama is gated by the master toggle
  const modes = teadUp
    ? (['drama', 'on_field', 'learn'] as const)
    : (['on_field', 'learn'] as const);

  async function handleFile(file: File) {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPhase('scanning');
    setError(null);

    try {
      // Downscale on the client so phone photos (~5-15 MB) become ~300-800 KB.
      // Vision API errors silently on huge payloads — this fixes most "it didn't work" cases.
      const compressed = await downscaleImage(file, 1280, 0.85);

      const form = new FormData();
      form.append('image', compressed);
      const qs = `?teadUp=${teadUp ? 'true' : 'false'}`;
      const res = await fetch(`/api/scan${qs}`, { method: 'POST', body: form });
      if (!res.ok) {
        if (res.status === 404) {
          setPhase('unknown');
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as ScanResult;
      if (data.player_name === 'Unknown' || !data.player_name) {
        setPhase('unknown');
        return;
      }
      setResult(data);
      setPhase('result');
    } catch (err) {
      setError(String(err));
      setPhase('unknown');
    }
  }

  /**
   * Downscale an image to a max dimension and re-encode as JPEG.
   * Reduces phone photos from ~10 MB to under 1 MB so the vision API
   * doesn't time out or reject the payload.
   */
  async function downscaleImage(file: File, maxDim: number, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          },
          'image/jpeg',
          quality,
        );
      };
      img.onerror = () => reject(new Error('Image decode failed'));
      img.src = URL.createObjectURL(file);
    });
  }

  async function trySample() {
    setPhase('scanning');
    setError(null);
    setPreviewUrl(null);
    try {
      // No image — backend returns a sample
      const qs = `?teadUp=${teadUp ? 'true' : 'false'}&sample=${RANDOM_ATHLETES[Math.floor(Math.random() * RANDOM_ATHLETES.length)]}`;
      const res = await fetch(`/api/scan${qs}`, { method: 'POST', body: new FormData() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as ScanResult;
      setResult(data);
      setPhase('result');
    } catch (err) {
      setError(String(err));
      setPhase('idle');
    }
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setPhase('idle');
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 border-b border-[var(--hairline)] flex items-center justify-between gap-3 bg-white sticky top-0 z-10">
        <Link href="/" className="font-display text-base sm:text-lg font-extrabold text-green tracking-wide uppercase shrink-0">
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        {mounted && (
          <TeaUpToggle enabled={teadUp} onToggle={toggleTeadUp} disabled={phase === 'scanning'} />
        )}
      </header>

      <section className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-md mx-auto">
          {phase === 'idle' && (
            <IdleState
              onLiveScan={() => setPhase('live')}
              onUpload={() => fileRef.current?.click()}
              onSample={trySample}
            />
          )}
          {phase === 'live' && (
            <LiveCamera
              onCapture={(blob) => handleFile(new File([blob], 'scan.jpg', { type: 'image/jpeg' }))}
              onCancel={() => setPhase('idle')}
              onFallbackUpload={() => {
                setPhase('idle');
                setTimeout(() => fileRef.current?.click(), 50);
              }}
            />
          )}
          {(phase === 'scanning') && <ScanningState previewUrl={previewUrl} />}
          {phase === 'result' && result && <ResultCard result={result} modes={[...modes]} onReset={reset} />}
          {phase === 'unknown' && <UnknownState onReset={reset} error={error} />}

          {/* Hidden file inputs */}
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
        </div>
      </section>

      <BottomTabsSpacer />
      <BottomTabs />
    </main>
  );
}

/* =================================================================
   Idle state — viewfinder hero + 3 CTAs
   ================================================================= */

function IdleState({ onLiveScan, onUpload, onSample }: { onLiveScan: () => void; onUpload: () => void; onSample: () => void }) {
  return (
    <div className="text-center mt-2 sm:mt-4">
      {/* Camera-viewfinder hero with scanning animation */}
      <div className="mx-auto w-44 h-44 sm:w-48 sm:h-48 relative mb-6 sm:mb-7" aria-hidden>
        <div className="absolute inset-0 rounded-3xl border border-[var(--hairline)] bg-white/40 overflow-hidden">
          {/* Rule-of-thirds grid */}
          <div className="absolute inset-0">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-[rgba(13,45,36,0.08)]" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-[rgba(13,45,36,0.08)]" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-[rgba(13,45,36,0.08)]" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-[rgba(13,45,36,0.08)]" />
          </div>
          {/* Corner brackets */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-tangerine" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-tangerine" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-tangerine" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-tangerine" />
          {/* Scan line */}
          <div className="absolute left-2 right-2 h-0.5 bg-tangerine shadow-[0_0_10px_rgba(255,107,61,0.7)]" style={{ animation: 'scanLineIdle 1.8s ease-in-out infinite' }} />
          {/* Center teacup logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" width="60" height="60" aria-hidden>
              <path d="M 26 30 Q 26 70 38 80 L 56 80 Q 68 70 68 30 Z" fill="#0D2D24" />
              <ellipse cx="48" cy="83" rx="20" ry="2.5" fill="#0D2D24" />
              <path d="M 68 38 Q 80 42 80 56 Q 80 66 68 70" stroke="#0D2D24" strokeWidth="3" fill="none" />
              <path d="M 26 30 L 68 30" stroke="#FF6B3D" strokeWidth="1.5" />
              <path d="M 38 30 Q 47 55 38 80" stroke="#FF6B3D" strokeWidth="2" fill="none" />
              <path d="M 56 30 Q 47 55 56 80" stroke="#FF6B3D" strokeWidth="2" fill="none" />
              <path d="M 26 50 Q 47 55 68 50" stroke="#FF6B3D" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>
        <div className="mt-2 text-[10px] font-bold tracking-widest uppercase text-tangerine flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
          Ready to scan
        </div>
      </div>

      <h1 className="font-display text-[28px] sm:text-[34px] font-bold text-green leading-[1.05] tracking-tight">
        Point your camera at any TV, scan a screenshot, snap a poster.
      </h1>
      <p className="mt-3 sm:mt-4 font-display italic text-[20px] sm:text-[24px] font-medium text-tangerine leading-tight tracking-tight">
        Every player decoded in seconds.
      </p>
      <p className="mt-4 text-[14px] sm:text-[15px] text-ink-soft max-w-xs mx-auto leading-relaxed">
        Works on all things sports — NFL + NBA. We never store your photos.
      </p>

      <div className="mt-7 sm:mt-9 flex flex-col gap-2.5">
        <button
          onClick={onLiveScan}
          className="w-full inline-flex items-center justify-center gap-2 bg-tangerine text-white font-semibold rounded-full py-3.5 text-[15px] transition active:scale-[0.98] hover:bg-tangerine-dark"
          style={{
            boxShadow: '0 1px 2px rgba(255,107,61,0.18), 0 12px 24px -10px rgba(255,107,61,0.40)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Scan
        </button>
        <button
          onClick={onUpload}
          className="w-full inline-flex items-center justify-center gap-2 bg-white text-green font-semibold rounded-full py-3.5 text-[15px] transition active:scale-[0.98] hover:bg-cream-warm"
          style={{ border: '0.5px solid rgba(13,45,36,0.18)' }}
        >
          Upload a photo
        </button>
        <button
          onClick={onSample}
          className="text-ink-soft text-[13px] font-medium hover:text-tangerine transition mt-2"
        >
          🎲 Try a random athlete →
        </button>
      </div>

      <p className="mt-6 text-[11px] text-muted">
        We never store your photos.
      </p>

      <style jsx>{`
        @keyframes scanLineIdle {
          0% { top: 8px; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: calc(100% - 10px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* =================================================================
   Scanning state — preview + brewing teacup animation
   ================================================================= */

/* =================================================================
   Live camera — in-page video stream + tap-to-capture
   ================================================================= */

function LiveCamera({
  onCapture,
  onCancel,
  onFallbackUpload,
}: {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
  onFallbackUpload: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setError('Your browser doesn’t support live camera. Try uploading a photo instead.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          v.play().catch(() => {});
        }
        setReady(true);
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string };
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setError('Camera permission was denied. Allow camera access in your browser, or upload a photo instead.');
        } else if (e.name === 'NotFoundError') {
          setError('No camera found on this device. Upload a photo instead.');
        } else {
          setError(e.message || 'Couldn’t open the camera.');
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facingMode]);

  function captureFrame() {
    const v = videoRef.current;
    if (!v || !v.videoWidth || !v.videoHeight) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(blob);
      },
      'image/jpeg',
      0.85,
    );
  }

  function flipCamera() {
    setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'));
    setReady(false);
  }

  // Permission/error fallback state
  if (error) {
    return (
      <div className="text-center mt-6">
        <div className="text-5xl mb-4" aria-hidden>📷</div>
        <h2 className="font-display text-2xl font-bold text-green leading-tight">
          Camera not available
        </h2>
        <p className="mt-3 text-ink-soft text-[14px] max-w-xs mx-auto leading-relaxed">{error}</p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onFallbackUpload}
            className="w-full inline-flex items-center justify-center gap-2 bg-tangerine text-white font-semibold rounded-full py-3.5 text-[15px] hover:bg-tangerine-dark transition"
          >
            Upload a photo instead
          </button>
          <button onClick={onCancel} className="text-[13px] text-muted hover:text-ink py-2">
            ← back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* Live viewfinder — tall aspect ratio, scan-line overlay */}
      <div
        className="relative mx-auto w-full max-w-sm bg-black rounded-3xl overflow-hidden shadow-[0_8px_24px_-12px_rgba(13,45,36,0.18)]"
        style={{ aspectRatio: '3 / 4' }}
      >
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Loading shimmer until ready */}
        {!ready && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2A6E47] via-[#1F5535] to-[#163C25] flex items-center justify-center">
            <span className="inline-block w-5 h-5 rounded-full border-2 border-tangerine border-t-transparent animate-spin" />
          </div>
        )}

        {/* Viewfinder overlay — corner brackets + scan line */}
        <div className="absolute inset-6 pointer-events-none">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-[2.5px] border-l-[2.5px] border-tangerine" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-[2.5px] border-r-[2.5px] border-tangerine" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[2.5px] border-l-[2.5px] border-tangerine" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[2.5px] border-r-[2.5px] border-tangerine" />
          {ready && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-tangerine shadow-[0_0_12px_rgba(255,107,61,0.8)]"
              style={{ animation: 'liveScanline 1.6s ease-in-out infinite' }}
            />
          )}
        </div>

        {/* Top status bar */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur text-[10px] font-bold tracking-widest uppercase text-tangerine">
            <span className="w-1.5 h-1.5 rounded-full bg-tangerine animate-pulse" />
            LIVE · point at a player
          </span>
          <button
            onClick={flipCamera}
            aria-label="Flip camera"
            className="w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="1 4 1 10 7 10" />
              <polyline points="23 20 23 14 17 14" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Capture controls */}
      <div className="mt-5 flex items-center justify-center gap-5">
        <button
          onClick={onCancel}
          aria-label="Cancel"
          className="w-12 h-12 rounded-full bg-white border border-[var(--hairline)] flex items-center justify-center text-ink-soft hover:bg-cream-warm transition"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M3 3 L13 13 M13 3 L3 13" />
          </svg>
        </button>

        {/* The big capture button */}
        <button
          onClick={captureFrame}
          disabled={!ready}
          aria-label="Capture and scan"
          className="w-20 h-20 rounded-full bg-white border-4 border-tangerine flex items-center justify-center transition hover:scale-105 active:scale-95 disabled:opacity-50 shadow-[0_8px_22px_-10px_rgba(255,107,61,0.55)]"
        >
          <span className="block w-14 h-14 rounded-full bg-tangerine" />
        </button>

        <button
          onClick={onFallbackUpload}
          aria-label="Upload from device instead"
          className="w-12 h-12 rounded-full bg-white border border-[var(--hairline)] flex items-center justify-center text-ink-soft hover:bg-cream-warm transition"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </button>
      </div>

      <p className="mt-4 text-[12px] text-muted">
        Frame the player's jersey. Tap the orange button to scan.
      </p>

      <style jsx>{`
        @keyframes liveScanline {
          0% { top: 0; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ScanningState({ previewUrl }: { previewUrl: string | null }) {
  return (
    <div className="text-center mt-4">
      <div className="mx-auto w-full max-w-sm bg-white rounded-3xl border border-[var(--hairline)] overflow-hidden shadow-[0_8px_24px_-12px_rgba(13,45,36,0.10)]">
        <div className="relative h-72 bg-black">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Your scan" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#2A6E47] via-[#1F5535] to-[#163C25]" />
          )}
          <div className="absolute inset-6 pointer-events-none">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-tangerine" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-tangerine" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-tangerine" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-tangerine" />
            <div
              className="absolute left-0 right-0 h-0.5 bg-tangerine shadow-[0_0_12px_rgba(255,107,61,0.8)]"
              style={{ animation: 'scanline 1.6s ease-in-out infinite' }}
            />
          </div>
        </div>
        <div className="px-5 py-4 flex items-center justify-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-tangerine border-t-transparent animate-spin" />
          <span className="text-sm text-ink-soft">Brewing the tea…</span>
        </div>
      </div>
      <style jsx global>{`
        @keyframes scanline {
          0% { top: 0; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* =================================================================
   Unknown state — never guess, ask the user
   ================================================================= */

function UnknownState({ onReset, error }: { onReset: () => void; error: string | null }) {
  return (
    <div className="text-center mt-6">
      <div className="text-5xl mb-4" aria-hidden>☕</div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-green leading-tight">
        Hmm. Not sure who this is.
      </h2>
      <p className="mt-3 text-ink-soft max-w-xs mx-auto">
        Help me out — try a clearer crop on the jersey, or pick a random athlete.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <button onClick={onReset} className="w-full inline-flex items-center justify-center gap-2 bg-tangerine text-white font-semibold rounded-full py-4 text-[15px]">
          Try another photo
        </button>
        <p className="text-xs text-muted mt-2">
          I never guess. If I can't tell, I ask.
        </p>
      </div>
      {error && process.env.NODE_ENV === 'development' && (
        <p className="mt-4 text-xs text-burgundy font-mono">{error}</p>
      )}
    </div>
  );
}

/* =================================================================
   Result card — hero band + mode-tabbed sections + actions
   ================================================================= */

type LocalMode = 'drama' | 'on_field' | 'learn';

function ResultCard({ result, modes, onReset }: { result: ScanResult; modes: LocalMode[]; onReset: () => void }) {
  const teamColors = getTeamColors(result.team);
  const social = getSocial(result.player_name);

  return (
    <div className="space-y-4">
      {/* Hero band */}
      <div
        className="rounded-3xl overflow-hidden relative shadow-[0_8px_24px_-12px_rgba(13,45,36,0.18)]"
        style={{
          background: `linear-gradient(135deg, ${teamColors.primary} 0%, ${teamColors.primary} 50%, ${teamColors.secondary} 200%)`,
        }}
      >
        <div className="absolute inset-0 opacity-15" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 60px, rgba(255,255,255,0.4) 60px 61px)' }} />
        <div className="relative p-5 sm:p-6 flex items-end justify-between gap-4 min-h-[140px]">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: teamColors.ink, opacity: 0.78 }}>
              {result.position} · {result.team}
              {result.number ? ` · #${result.number}` : ''}
            </div>
            <h1 className="font-display font-bold leading-[0.92] tracking-tight" style={{ color: teamColors.ink, fontSize: 'clamp(28px, 6.5vw, 40px)' }}>
              {result.player_name}
            </h1>
            {/* Instagram link — direct to the player's IG. Editorial-safe (just a hyperlink, no hosted image). */}
            {social?.instagram && (
              <a
                href={instagramUrl(social.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition active:scale-[0.96] hover:bg-white/10"
                style={{
                  color: teamColors.ink,
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.25)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                @{social.instagram}
              </a>
            )}
            {result.game && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold tracking-wider text-white" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {result.game.home} {result.game.home_score} · {result.game.away} {result.game.away_score} · {result.game.clock}
              </div>
            )}
          </div>
          {result.number > 0 && (
            <div
              className="shrink-0 rounded-full text-white font-display font-extrabold text-2xl flex items-center justify-center"
              style={{
                width: 64,
                height: 64,
                background: teamColors.secondary,
                boxShadow: '0 0 0 4px rgba(255,255,255,0.15) inset, 0 12px 32px -8px rgba(0,0,0,0.4)',
              }}
            >
              {result.number}
            </div>
          )}
        </div>
      </div>

      {/* DRAMA — primary card, always lead. Scaled up + magenta accent for visual hierarchy. */}
      {modes.includes('drama') && result.modes?.drama && result.modes.drama.length > 0 && (
        <DramaSection items={result.modes.drama} />
      )}

      {/* SECONDARY — on-field + learn rendered as collapsible smaller cards below the gossip. */}
      {((modes.includes('on_field') && result.modes?.on_field) ||
        (modes.includes('learn') && result.modes?.learn)) && (
        <details className="group bg-cream-warm/40 rounded-2xl border border-[var(--hairline)] overflow-hidden">
          <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none hover:bg-cream-warm transition">
            <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-soft">
              Also: the sports stuff
            </span>
            <span className="text-ink-soft group-open:rotate-180 transition-transform">▾</span>
          </summary>
          <div className="px-4 pb-4 space-y-3 pt-1">
            {modes.includes('on_field') && result.modes?.on_field && (
              <SecondaryModeSection emoji="🏀" label="On-field" body={result.modes.on_field} />
            )}
            {modes.includes('learn') && result.modes?.learn && (
              <SecondaryModeSection emoji="📚" label="Learn" body={result.modes.learn} />
            )}
          </div>
        </details>
      )}

      {/* Fallback when no modes payload — show the legacy blurb prominently */}
      {(!result.modes || (!result.modes.drama && !result.modes.on_field && !result.modes.learn)) && result.blurb && (
        <ModeSection emoji="☕" label="Tea" body={result.blurb} />
      )}

      {/* Primary follow-up CTA — solid tangerine, premium feel */}
      <Link
        href={`/chat?seed=${encodeURIComponent(`Tell me more about ${result.player_name}.`)}&modes=${modes.join(',')}`}
        className="block w-full text-center bg-tangerine text-white font-semibold rounded-full py-3.5 text-[14.5px] mt-2 transition active:scale-[0.98] hover:bg-tangerine-dark"
        style={{
          boxShadow: '0 1px 2px rgba(255,107,61,0.18), 0 12px 24px -10px rgba(255,107,61,0.40)',
        }}
      >
        Ask Goldie a follow-up →
      </Link>

      {/* Secondary actions — subtle row, hairline borders */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        <button
          onClick={() => alert('Saved to your scan history')}
          className="flex flex-col items-center justify-center gap-1 bg-white rounded-2xl py-3 transition active:scale-[0.98] hover:bg-cream-warm"
          style={{ border: '0.5px solid rgba(13,45,36,0.10)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft" aria-hidden>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Save</span>
        </button>
        <button
          onClick={() => {
            if (typeof navigator !== 'undefined' && (navigator as any).share) {
              (navigator as any).share({
                title: `sportsBFF · ${result.player_name}`,
                text: `${result.player_name} (${result.team}) — ${result.blurb}`,
                url: typeof window !== 'undefined' ? window.location.origin : 'https://sportsbff.app',
              }).catch(() => {});
            } else {
              alert('Sharing not supported in this browser');
            }
          }}
          className="flex flex-col items-center justify-center gap-1 bg-white rounded-2xl py-3 transition active:scale-[0.98] hover:bg-cream-warm"
          style={{ border: '0.5px solid rgba(13,45,36,0.10)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft" aria-hidden>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Share</span>
        </button>
        <button
          onClick={onReset}
          className="flex flex-col items-center justify-center gap-1 bg-white rounded-2xl py-3 transition active:scale-[0.98] hover:bg-cream-warm"
          style={{ border: '0.5px solid rgba(13,45,36,0.10)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft" aria-hidden>
            <path d="M3 7V5a2 2 0 0 1 2-2h2 M17 3h2a2 2 0 0 1 2 2v2 M21 17v2a2 2 0 0 1-2 2h-2 M7 21H5a2 2 0 0 1-2-2v-2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="text-[10px] font-semibold text-ink-soft uppercase tracking-wider">Scan again</span>
        </button>
      </div>
    </div>
  );
}

function DramaSection({ items }: { items: { tier: Tier; headline: string; summary: string }[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-magenta-dusty">
          ☕ The tea
        </span>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted">· lead with the gossip</span>
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,_0_12px_32px_-12px_rgba(212,64,122,0.18)]"
          style={{ border: '1.5px solid rgba(212,64,122,0.18)' }}
        >
          <div className="mb-2"><TierPill tier={item.tier} /></div>
          <h3 className="font-display font-bold text-[19px] text-green leading-tight">{item.headline}</h3>
          <p className="mt-2 text-[15px] text-ink leading-relaxed">{item.summary}</p>
        </div>
      ))}
    </div>
  );
}

function ModeSection({ emoji, label, body }: { emoji: string; label: string; body: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] uppercase text-tangerine">
        <span aria-hidden>{emoji}</span> {label}
      </div>
      <div className="bg-white rounded-2xl p-4 border border-[var(--hairline)] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,_0_8px_24px_-12px_rgba(13,45,36,0.10)]">
        <p className="text-[14.5px] text-ink leading-relaxed whitespace-pre-line">{body}</p>
      </div>
    </div>
  );
}

/**
 * Secondary mode section — smaller, quieter treatment for the "also: the sports stuff"
 * collapsible. Used for on-field + learn when drama is the primary content.
 */
function SecondaryModeSection({ emoji, label, body }: { emoji: string; label: string; body: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] uppercase text-ink-soft mb-1.5">
        <span aria-hidden>{emoji}</span> {label}
      </div>
      <p className="text-[13px] text-ink leading-relaxed whitespace-pre-line">{body}</p>
    </div>
  );
}

/* =================================================================
   Team color lookup — mirrors PlayerProfile.tsx team colors
   ================================================================= */

function getTeamColors(team: string): { primary: string; secondary: string; ink: string } {
  const t = team.toLowerCase();
  if (t.includes('chiefs')) return { primary: '#E31837', secondary: '#FFB81C', ink: '#FFFFFF' };
  if (t.includes('bills')) return { primary: '#00338D', secondary: '#C60C30', ink: '#FFFFFF' };
  if (t.includes('eagles')) return { primary: '#004C54', secondary: '#A5ACAF', ink: '#FFFFFF' };
  if (t.includes('cowboys')) return { primary: '#003594', secondary: '#869397', ink: '#FFFFFF' };
  if (t.includes('ravens')) return { primary: '#241773', secondary: '#9E7C0C', ink: '#FFFFFF' };
  if (t.includes('lakers')) return { primary: '#552583', secondary: '#FDB927', ink: '#FFFFFF' };
  if (t.includes('warriors')) return { primary: '#1D428A', secondary: '#FFC72C', ink: '#FFFFFF' };
  if (t.includes('celtics')) return { primary: '#007A33', secondary: '#BA9653', ink: '#FFFFFF' };
  if (t.includes('thunder')) return { primary: '#007AC1', secondary: '#EF3B24', ink: '#FFFFFF' };
  if (t.includes('spurs')) return { primary: '#C4CED4', secondary: '#000000', ink: '#000000' };
  if (t.includes('76ers') || t.includes('sixers')) return { primary: '#006BB6', secondary: '#ED174C', ink: '#FFFFFF' };
  if (t.includes('heat')) return { primary: '#98002E', secondary: '#F9A01B', ink: '#FFFFFF' };
  if (t.includes('knicks')) return { primary: '#006BB6', secondary: '#F58426', ink: '#FFFFFF' };
  if (t.includes('clippers')) return { primary: '#C8102E', secondary: '#1D428A', ink: '#FFFFFF' };
  if (t.includes('mavericks') || t.includes('mavs')) return { primary: '#00538C', secondary: '#002B5E', ink: '#FFFFFF' };
  if (t.includes('nuggets')) return { primary: '#0E2240', secondary: '#FEC524', ink: '#FFFFFF' };
  return { primary: '#0D2D24', secondary: '#FF6B3D', ink: '#FFFFFF' };
}
