'use client';

import { useEffect } from 'react';
import { PlayerProfile } from './PlayerProfile';

/**
 * Modal overlay for viewing a player profile without leaving the chat.
 * - Click the backdrop or the X to close.
 * - ESC closes.
 * - Body scroll locked while open.
 */
export function PlayerOverlay({ slug, onClose }: { slug: string; onClose: () => void }) {
  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ESC to close
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch md:items-center md:justify-center" role="dialog" aria-modal>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: 'fadeBg .25s ease both' }}
      />

      {/* Sheet */}
      <div
        className="relative w-full md:max-w-4xl bg-white md:rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[100vh] md:max-h-[88vh]"
        style={{ animation: 'slideUp .35s cubic-bezier(.2,.7,.2,1.05) both' }}
      >
        {/* Floating close button */}
        <button
          onClick={onClose}
          aria-label="Close player profile"
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur hover:bg-white shadow-md flex items-center justify-center text-ink"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 3 L13 13 M13 3 L3 13" />
          </svg>
        </button>

        {/* Scrollable profile content */}
        <div className="overflow-y-auto">
          <PlayerProfile slug={slug} />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeBg { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
