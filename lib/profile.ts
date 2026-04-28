/**
 * Local profile storage.
 *
 * Phase 1: localStorage only. No Supabase required to play with the app.
 * Phase 2: this becomes a Supabase-backed profile (lib/supabase.ts) and the
 * shape stays the same — we'll just swap the implementation.
 */

const KEY = 'sportsbff.profile';

export type Profile = {
  displayName?: string;
  league?: 'nfl' | 'nba' | 'both';
  lens: string;
  onboardedAt?: string;
  dramaMode?: boolean;
  /** When ON, every BFF response auto-plays via TTS after streaming finishes. */
  autoPlayVoice?: boolean;
  /** Override for the lens-default voice. If unset, uses getVoiceForLens(lens). */
  voiceOverride?: string;
  // Tea'd Up additions
  /** Active mode pills (Drama / On-field / Learn). Default: ['drama']. */
  defaultModes?: ('drama' | 'on_field' | 'learn')[];
  /** When true, Learn mode uses the Euphoria voice for explanations. */
  euphoriaLensEnabled?: boolean;
  /** Set once on first install (Tea'd Up onboarding). */
  firstSeenAt?: string;
};

const DEFAULT: Profile = {
  lens: 'plain',
  dramaMode: false,
  autoPlayVoice: false,
  defaultModes: ['drama'],
  euphoriaLensEnabled: false,
};

export function getProfile(): Profile {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setProfile(p: Partial<Profile>): Profile {
  if (typeof window === 'undefined') return DEFAULT;
  const next = { ...getProfile(), ...p };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function isOnboarded(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(getProfile().onboardedAt);
}

export function clearProfile() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
