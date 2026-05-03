/**
 * Legacy /scan route — redirects to /scan/game.
 *
 * 2026-05-05 pivot: scoreboard scan replaced face/player scan as the v1 hero
 * (BIPA face-recognition risk + the scoreboard demo is a richer answer).
 * The full original implementation is preserved in git history at SHA
 * 1492ee3 (and earlier). If we ever want to revive a player-scan flow, pull
 * it from there. For now, every page reference funnels into /scan/game.
 *
 * Server-side redirect via Next.js — no client flash, no localStorage call,
 * works for direct URL hits, links, and bookmarks.
 */
import { redirect } from 'next/navigation';

export default function LegacyScanRedirect(): never {
  redirect('/scan/game');
}
