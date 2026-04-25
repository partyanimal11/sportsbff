'use client';

import { createContext, useContext } from 'react';

/**
 * Allows the chat page (or any page) to register a handler that opens
 * a player profile in an overlay instead of navigating away.
 *
 * lib/markdown.tsx checks this context — if a handler is registered,
 * player-name links call it. Otherwise they fall back to <Link> navigation.
 */
export type OpenPlayerFn = (slug: string) => void;

export const PlayerOverlayContext = createContext<OpenPlayerFn | null>(null);

export function usePlayerOverlay(): OpenPlayerFn | null {
  return useContext(PlayerOverlayContext);
}
