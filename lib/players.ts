/**
 * Centralized player + team + cross-reference lookups.
 * Used by the player profile page (/player/[slug]) and any future surface
 * that needs structured access to the context layer.
 */

import players from '@/data/players-sample.json';
import nfl from '@/data/teams/nfl.json';
import nba from '@/data/teams/nba.json';
import mappings from '@/data/mappings.json';

export type Player = {
  id: string;
  name: string;
  team: string;
  league: 'nfl' | 'nba';
  position: string;
  number?: number;
  age?: number;
  hometown?: string;
  bio?: string;
  drama?: string;
};

export type Team = {
  id: string;
  league: 'nfl' | 'nba';
  name: string;
  city: string;
  conference?: string;
  head_coach?: string;
  signature?: string;
};

export type Mapping = {
  id: string;
  show: string;
  show_character: string;
  league: string;
  player_id: string;
  summary: string;
  evidence?: string[];
};

const PLAYERS: Player[] = players as Player[];
const TEAMS: Team[] = [...(nfl as Team[]), ...(nba as Team[])];
const MAPPINGS: Mapping[] = mappings as Mapping[];

const PLAYERS_BY_ID = new Map(PLAYERS.map((p) => [p.id, p]));
const TEAMS_BY_KEY = new Map(TEAMS.map((t) => [`${t.league}:${t.id}`, t]));

export function getPlayer(slug: string): Player | undefined {
  return PLAYERS_BY_ID.get(slug);
}

export function listAllPlayers(): Player[] {
  return PLAYERS;
}

export function listPlayersByLeague(league: 'nfl' | 'nba'): Player[] {
  return PLAYERS.filter((p) => p.league === league);
}

export function listPlayersByTeam(teamId: string, league: 'nfl' | 'nba'): Player[] {
  return PLAYERS.filter((p) => p.team === teamId && p.league === league);
}

export function getTeam(teamId: string, league: 'nfl' | 'nba'): Team | undefined {
  return TEAMS_BY_KEY.get(`${league}:${teamId}`);
}

/**
 * All character mappings tied to this player (across every show).
 */
export function getMappingsForPlayer(playerId: string): Mapping[] {
  return MAPPINGS.filter((m) => m.player_id === playerId);
}

/**
 * Find related players — same team first, then same position in same league.
 */
export function getRelatedPlayers(player: Player, limit = 4): Player[] {
  const teammates = PLAYERS.filter(
    (p) => p.id !== player.id && p.team === player.team && p.league === player.league
  );
  const positional = PLAYERS.filter(
    (p) =>
      p.id !== player.id &&
      p.team !== player.team &&
      p.league === player.league &&
      p.position === player.position
  );
  return [...teammates, ...positional].slice(0, limit);
}

/**
 * Quick label for nice player URLs / share-cards.
 */
export function playerHref(player: Player): string {
  return `/player/${player.id}`;
}
