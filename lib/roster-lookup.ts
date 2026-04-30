/**
 * Roster lookup — narrow scan candidates from on-device OCR signals.
 *
 * The iOS app reads jersey text + number with Apple Vision (free, ~50ms),
 * then calls /api/roster-lookup with whatever it found. We resolve the team
 * via team-aliases.json and filter by jersey number to return a tiny list
 * (ideally exactly 1) of candidates. The app then either shows a confirmation
 * card ("Looks like Devin Booker — yes?") or falls through to GPT-4o vision
 * if the candidate set is ambiguous.
 *
 * No network calls — both data files are bundled with the deploy.
 */
import rostersData from '@/data/rosters.json';
import aliasesData from '@/data/team-aliases.json';
import { getSocial } from '@/lib/players-social';

export type League = 'nba' | 'wnba' | 'nfl';

type RosterPlayer = {
  id: string;       // slug-id (matches gossip DB player_id)
  name: string;
  jersey: string;
  pos: string;
};

type AliasMatch = { league: League; team: string };

const ROSTERS = (rostersData as { rosters: Record<string, RosterPlayer[]> }).rosters;
const ALIASES = (aliasesData as { aliases: Record<string, AliasMatch[]> }).aliases;

export type Candidate = {
  playerId: string;
  name: string;
  team: string;
  league: League;
  jerseyNumber: string;
  position: string;
  /** Initials for the bold-initials avatar (Phase 1) — derived from name */
  initials: string;
  /** Instagram handle (no @) if known, for the confirmation card */
  instagram?: string;
};

export type RosterLookupArgs = {
  /** Uppercase jersey-text token, e.g. "LAKERS", "FEVER" */
  teamHint?: string | null;
  /** Jersey number as a string (preserves leading zeros) */
  number?: string | null;
  /** Optional — narrow to a specific league if iOS already knows */
  league?: League;
};

function getInitials(name: string): string {
  const parts = name
    .replace(/['.]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildCandidate(p: RosterPlayer, league: League, team: string): Candidate {
  const social = getSocial(p.name);
  return {
    playerId: p.id,
    name: p.name,
    team,
    league,
    jerseyNumber: p.jersey,
    position: p.pos,
    initials: getInitials(p.name),
    instagram: social?.instagram,
  };
}

/**
 * Resolve a jersey-text alias to one or more {league, team} pairs.
 * Returns null if the token doesn't match any known team.
 *
 * If `forceLeague` is provided, results are filtered to that league.
 */
function resolveAlias(token: string, forceLeague?: League): AliasMatch[] | null {
  if (!token) return null;
  const normalized = token.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const matches = ALIASES[normalized];
  if (!matches || matches.length === 0) return null;
  if (forceLeague) {
    const filtered = matches.filter((m) => m.league === forceLeague);
    return filtered.length > 0 ? filtered : null;
  }
  return matches;
}

/**
 * Main lookup. Behavior:
 *
 * 1. If `teamHint` resolves to a single (league, team) and `number` is given:
 *    return the player(s) on that roster wearing that number.
 * 2. If `teamHint` resolves to multiple (league, team) (e.g. "ATLANTA" matches
 *    Hawks, Dream, Falcons) and `number` is given: return all matching players
 *    across those rosters (the app should show a small confirm list).
 * 3. If only `number` is given: return nothing — far too ambiguous.
 * 4. If only `teamHint` is given: return that team's full roster (rare path,
 *    mostly for debugging).
 *
 * The returned list is what the iOS app uses to decide:
 *   - 1 candidate → show confirmation card
 *   - 2-4 candidates → show small picker
 *   - 0 or 5+ → fall through to GPT-4o vision
 */
export function rosterLookup(args: RosterLookupArgs): {
  resolvedTeams: AliasMatch[] | null;
  candidates: Candidate[];
} {
  const { teamHint, number, league } = args;

  // 1. Resolve team alias if any
  const resolved = teamHint ? resolveAlias(teamHint, league) : null;

  // No team hint → too ambiguous, refuse to enumerate
  if (!resolved || resolved.length === 0) {
    return { resolvedTeams: null, candidates: [] };
  }

  // 2. Look up roster(s)
  const candidates: Candidate[] = [];
  for (const { league: lg, team } of resolved) {
    const key = `${lg}/${team}`;
    const roster = ROSTERS[key];
    if (!roster) continue;

    if (number && number.trim()) {
      // Filter to matching jersey number (strip leading zeros for comparison)
      const wanted = number.trim().replace(/^0+/, '') || '0';
      for (const p of roster) {
        const jersey = (p.jersey || '').replace(/^0+/, '') || '0';
        if (jersey === wanted) {
          candidates.push(buildCandidate(p, lg, team));
        }
      }
    } else {
      // No number → return whole roster (debug / power-user path)
      for (const p of roster) {
        candidates.push(buildCandidate(p, lg, team));
      }
    }
  }

  return { resolvedTeams: resolved, candidates };
}

/** Direct-lookup helper — get a roster by league + team. */
export function getRoster(league: League, team: string): Candidate[] {
  const key = `${league}/${team}`;
  const roster = ROSTERS[key];
  if (!roster) return [];
  return roster.map((p) => buildCandidate(p, league, team));
}

/** Quick sanity check — does this team alias exist? */
export function isKnownAlias(token: string): boolean {
  if (!token) return false;
  const normalized = token.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return Boolean(ALIASES[normalized]);
}
