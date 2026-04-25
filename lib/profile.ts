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
};

const DEFAULT: Profile = { lens: 'plain', dramaMode: false };

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
