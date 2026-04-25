import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPlayer } from '@/lib/players';
import { PlayerProfile } from '@/components/PlayerProfile';

/**
 * Standalone player profile page — used for direct links / shares.
 * Inside the chat, players open as an overlay instead (see PlayerOverlay).
 */
export default function PlayerPage({ params }: { params: { slug: string } }) {
  const player = getPlayer(params.slug);
  if (!player) notFound();

  return (
    <main className="min-h-screen bg-white">
      <header className="px-6 md:px-8 py-3 border-b border-[var(--hairline)] flex items-center justify-between bg-white sticky top-0 z-20 backdrop-blur">
        <Link href="/" className="font-display text-xl font-extrabold text-green tracking-wide uppercase">
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        <nav className="flex gap-7 text-sm text-ink-soft">
          <Link href="/scan" className="hover:text-ink">Scan</Link>
          <Link href="/chat" className="hover:text-ink">Chat</Link>
          <Link href="/lessons" className="hover:text-ink">Lessons</Link>
        </nav>
      </header>

      <PlayerProfile slug={params.slug} />

      <footer className="bg-green-dark text-white px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="font-display text-sm font-extrabold uppercase tracking-wide">
            SPORTS<span className="text-tangerine">★</span>BFF
          </div>
          <Link href="/chat" className="text-[13px] text-lemon hover:text-white">
            Open the chat →
          </Link>
        </div>
      </footer>
    </main>
  );
}
