'use client';

/**
 * Tea'd Up — root.
 *
 * Mobile-first landing that immediately routes into the Scan tab if the user
 * is already onboarded. First-time visitors see a slim brand reveal + Get
 * Started CTA.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isOnboarded } from '@/lib/profile';

export default function Root() {
  const router = useRouter();

  useEffect(() => {
    // If they've onboarded, drop them straight into Scan.
    if (isOnboarded()) {
      router.replace('/scan');
    }
  }, [router]);

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{
        minHeight: '100dvh',
        background: '#000000',
      }}
    >
      <div className="text-center max-w-md w-full">
        {/* Logo block — beeper-style display */}
        <div
          className="inline-block px-8 py-7 rounded-3xl mb-6"
          style={{
            background: 'rgba(110, 195, 145, 0.55)',
            boxShadow: '0 1px 0 rgba(255,255,255,0.25) inset, 0 8px 28px -10px rgba(13,45,36,0.45)',
          }}
        >
          <div
            className="rounded-2xl px-6 py-5 text-center"
            style={{
              background: '#1C1108',
              minWidth: 220,
            }}
          >
            <svg viewBox="0 0 100 100" width="64" height="64" className="mx-auto mb-2" aria-hidden>
              <path d="M 48 14 Q 46 10 50 6 Q 54 2 50 -2" stroke="#FF8B4D" strokeWidth="2" fill="none" opacity="0.5" />
              <path d="M 26 30 Q 26 70 38 80 L 56 80 Q 68 70 68 30 Z" fill="#FF8B4D" />
              <ellipse cx="48" cy="83" rx="20" ry="3" fill="#FF8B4D" />
              <path d="M 68 38 Q 80 42 80 56 Q 80 66 68 70" stroke="#FF8B4D" strokeWidth="3" fill="none" />
              <path d="M 26 30 L 68 30" stroke="#1C1108" strokeWidth="1.5" />
              <path d="M 38 30 Q 47 55 38 80" stroke="#1C1108" strokeWidth="2" fill="none" />
              <path d="M 56 30 Q 47 55 56 80" stroke="#1C1108" strokeWidth="2" fill="none" />
              <path d="M 26 50 Q 47 55 68 50" stroke="#1C1108" strokeWidth="2" fill="none" />
            </svg>
            <h1
              className="font-bold uppercase mb-1"
              style={{
                color: '#FF8B4D',
                fontFamily: 'monospace',
                letterSpacing: '0.04em',
                fontSize: 32,
                textShadow: '0 0 6px rgba(255,139,77,0.4)',
              }}
            >
              Tea'd Up
            </h1>
            <p
              style={{
                color: '#A85A2C',
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: '0.08em',
              }}
            >
              your AI sports BFF
            </p>
          </div>
        </div>

        <h2 className="font-display text-[28px] sm:text-[32px] font-bold text-white leading-[1.05] tracking-tight mb-4">
          Scan a player.
          <br />
          <span className="italic font-medium" style={{ color: '#FF8B4D' }}>
            Get the tea.
          </span>
        </h2>
        <p className="text-[14px] sm:text-[15px] text-white/70 leading-relaxed max-w-xs mx-auto mb-8">
          Camera, screenshot, or live broadcast. We ID the player and serve the gossip.
          Confirmed, reported, speculated — never guessed.
        </p>

        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center gap-2 bg-tangerine text-white font-semibold rounded-full px-7 py-3.5 text-[15px] hover:bg-tangerine-dark transition shadow-[0_8px_28px_-6px_rgba(255,107,61,0.5)]"
        >
          Get started →
        </Link>
        <div className="mt-3">
          <Link href="/scan" className="text-[12px] text-white/50 hover:text-white/80 transition">
            Skip — try the scan first →
          </Link>
        </div>

        <p className="mt-12 text-[10px] text-white/30 font-mono tracking-widest uppercase">
          v1.0 · spring 2026
        </p>
      </div>
    </main>
  );
}
