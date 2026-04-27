'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * useVoicePlayer — fetch + play TTS audio from /api/voice.
 *
 * Caches Blob URLs per (text, lens, voice) so re-clicking a message doesn't
 * re-fetch. Tracks which message ID is currently playing so the UI can show
 * a "playing" indicator.
 */

export type VoicePlayerState = {
  /** ID of the message currently playing, or null. */
  playingId: string | null;
  /** Whether a fetch is in flight. */
  loading: boolean;
  /** Error from the last play attempt. */
  error: string | null;
  /** Demo mode — voice unavailable without API key. */
  demoMode: boolean;
};

export function useVoicePlayer() {
  const [state, setState] = useState<VoicePlayerState>({
    playingId: null,
    loading: false,
    error: null,
    demoMode: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map()); // key → blob URL

  const cacheKey = (text: string, voice: string) => `${voice}|${text.slice(0, 200)}`;

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState((s) => ({ ...s, playingId: null }));
  }, []);

  /**
   * Play the audio for a given message.
   * If the same message is already playing, stops it (toggle behavior).
   */
  const play = useCallback(
    async (id: string, text: string, opts: { lens?: string; voice?: string } = {}) => {
      // Toggle: if this exact message is currently playing, stop it
      if (state.playingId === id) {
        stop();
        return;
      }

      // Stop anything else that's playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }

      setState({ playingId: null, loading: true, error: null, demoMode: false });

      const voiceLabel = opts.voice ?? opts.lens ?? 'default';
      const key = cacheKey(text, voiceLabel);

      // Check cache
      let blobUrl = cacheRef.current.get(key);
      if (!blobUrl) {
        try {
          const res = await fetch('/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              lens: opts.lens,
              voice: opts.voice,
            }),
          });

          if (res.status === 503) {
            // Demo mode — voice not available
            const body = await res.json().catch(() => ({}));
            setState({
              playingId: null,
              loading: false,
              error: body.hint || 'Voice mode not available in demo mode.',
              demoMode: true,
            });
            return;
          }
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `HTTP ${res.status}`);
          }

          const blob = await res.blob();
          blobUrl = URL.createObjectURL(blob);
          cacheRef.current.set(key, blobUrl);
        } catch (err) {
          setState({
            playingId: null,
            loading: false,
            error: String(err),
            demoMode: false,
          });
          return;
        }
      }

      // Create or reuse the audio element and play
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = 'auto';
      }
      audioRef.current.src = blobUrl;
      audioRef.current.onended = () => setState((s) => ({ ...s, playingId: null }));
      audioRef.current.onerror = () =>
        setState((s) => ({ ...s, playingId: null, error: 'Playback failed.' }));

      try {
        await audioRef.current.play();
        setState({ playingId: id, loading: false, error: null, demoMode: false });
      } catch (err) {
        setState({ playingId: null, loading: false, error: String(err), demoMode: false });
      }
    },
    [state.playingId, stop]
  );

  return { ...state, play, stop };
}
