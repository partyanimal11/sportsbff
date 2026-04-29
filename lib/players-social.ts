/**
 * Player → social handles lookup.
 *
 * Just IG for now — keeps the scan result legally clean (no hosting, no copyright,
 * no right-of-publicity issues — we just link out). Add Twitter/X, TikTok, etc.
 * to this file later as needed.
 *
 * Handles are username only (without the @). Construct the URL via instagramUrl().
 *
 * Last verified: 2026-04-29.
 */

export type PlayerSocial = {
  /** Instagram username (no @ prefix) */
  instagram?: string;
  /** Twitter / X username (no @ prefix) */
  twitter?: string;
};

/** Map of slug-id → social handles. Slug = lowercase-hyphenated full name. */
export const PLAYER_SOCIAL: Record<string, PlayerSocial> = {
  // ── NFL ──
  'patrick-mahomes': { instagram: 'patrickmahomes', twitter: 'PatrickMahomes' },
  'travis-kelce': { instagram: 'killatrav', twitter: 'tkelce' },
  'josh-allen': { instagram: 'joshallenqb', twitter: 'JoshAllenQB' },
  'joe-burrow': { instagram: 'joeyb_9', twitter: 'JoeyB' },
  'lamar-jackson': { instagram: 'newera8', twitter: 'Lj_era8' },
  'justin-jefferson': { instagram: 'jjettas2', twitter: 'JJettas2' },
  'saquon-barkley': { instagram: 'saquon', twitter: 'saquon' },
  'tyreek-hill': { instagram: 'cheetah', twitter: 'cheetah' },
  'caleb-williams': { instagram: 'calebcwilliams', twitter: 'CALEBcsw' },
  'cj-stroud': { instagram: 'cj7stroud', twitter: 'CJ7STROUD' },
  'tua-tagovailoa': { instagram: 'tuamoa', twitter: 'Tua' },
  'jalen-hurts': { instagram: 'jalenhurts', twitter: 'JalenHurts' },
  // round 2
  'bill-belichick': { instagram: 'billbelichick', twitter: 'BillBelichick' },
  'aaron-rodgers': { instagram: 'aaronrodgers12' },
  'trevor-lawrence': { instagram: 'trevorlawrencee', twitter: 'Trevorlawrencee' },
  'jerry-jones': { instagram: 'dallascowboys' },
  'justin-herbert': { instagram: 'justinherbert10' },
  'bo-nix': { instagram: 'bonix10', twitter: 'BoNix10' },
  'jayden-daniels': { instagram: 'jayd__5', twitter: 'JayD__5' },
  'russell-wilson': { instagram: 'dangerusswilson', twitter: 'DangeRussWilson' },
  'aidan-hutchinson': { instagram: 'aidanhutch97', twitter: 'aidanhutch97' },
  'drake-maye': { instagram: 'drakemaye2', twitter: 'drakemaye2' },

  // ── NBA ──
  'lebron-james': { instagram: 'kingjames', twitter: 'KingJames' },
  'stephen-curry': { instagram: 'stephencurry30', twitter: 'StephenCurry30' },
  'kevin-durant': { instagram: 'easymoneysniper', twitter: 'KDTrey5' },
  'victor-wembanyama': { instagram: 'wemby', twitter: 'wemby' },
  'shai-gilgeous-alexander': { instagram: 'shai', twitter: 'shaigilgeous' },
  'devin-booker': { instagram: 'dbook', twitter: 'DevinBook' },
  'anthony-edwards': { instagram: 'theanthonyedwards_', twitter: 'theantedwards_' },
  'luka-doncic': { instagram: 'luka7doncic', twitter: 'luka7doncic' },
  'jayson-tatum': { instagram: 'jaytatum0', twitter: 'jaytatum0' },
  'joel-embiid': { instagram: 'joelembiid', twitter: 'JoelEmbiid' },
  'bronny-james': { instagram: 'bronny', twitter: 'BronnyJames' },
  // (Jokic famously doesn't do social media — intentionally omitted)
};

/** Convert a player display name to a slug ID. e.g. "Devin Booker" → "devin-booker" */
export function playerNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Look up social handles by player display name. */
export function getSocial(playerName: string): PlayerSocial | null {
  if (!playerName || playerName === 'Unknown') return null;
  const slug = playerNameToSlug(playerName);
  return PLAYER_SOCIAL[slug] ?? null;
}

export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle}`;
}

export function twitterUrl(handle: string): string {
  return `https://x.com/${handle}`;
}
