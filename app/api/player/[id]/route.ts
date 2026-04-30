/**
 * GET /api/player/[id]
 *
 * Returns a fully-hydrated scan result for a player by playerId, without
 * spending a vision call. Used by the iOS Phase 2 OCR confirmation flow:
 * once the user taps "Yes, that's them" on the confirmation card, we already
 * know who they are — we just need the same ScanResult shape that /api/scan
 * would have returned.
 *
 * Response shape matches /api/scan exactly so the iOS decoder is shared.
 */
import { NextRequest, NextResponse } from 'next/server';
import gossipData from '@/data/players-gossip.json';
import rostersData from '@/data/rosters.json';

type GossipSource = { name: string; url: string; date: string };
type GossipItem = {
  id: string;
  tier: 'confirmed' | 'reported' | 'speculation' | 'rumor';
  category: string;
  headline: string;
  summary: string;
  sources: GossipSource[];
};
type GossipPlayer = {
  player_id: string;
  name: string;
  team: string;
  league: string;
  items: GossipItem[];
};

type RosterPlayer = { id: string; name: string; jersey: string; pos: string };

const GOSSIP: Record<string, GossipPlayer> = gossipData as Record<string, GossipPlayer>;
const ROSTERS = (rostersData as { rosters: Record<string, RosterPlayer[]> }).rosters;
const DRAMA_CATEGORIES = new Set(['romance', 'family', 'legal', 'culture', 'off_field']);

const TEAM_NAMES: Record<string, string> = {
  // NBA
  'nba/atl': 'Atlanta Hawks', 'nba/bos': 'Boston Celtics', 'nba/bkn': 'Brooklyn Nets',
  'nba/cha': 'Charlotte Hornets', 'nba/chi': 'Chicago Bulls', 'nba/cle': 'Cleveland Cavaliers',
  'nba/dal': 'Dallas Mavericks', 'nba/den': 'Denver Nuggets', 'nba/det': 'Detroit Pistons',
  'nba/gs':  'Golden State Warriors', 'nba/hou': 'Houston Rockets', 'nba/ind': 'Indiana Pacers',
  'nba/lac': 'LA Clippers', 'nba/lal': 'LA Lakers', 'nba/mem': 'Memphis Grizzlies',
  'nba/mia': 'Miami Heat', 'nba/mil': 'Milwaukee Bucks', 'nba/min': 'Minnesota Timberwolves',
  'nba/no':  'New Orleans Pelicans', 'nba/ny':  'New York Knicks', 'nba/okc': 'Oklahoma City Thunder',
  'nba/orl': 'Orlando Magic', 'nba/phi': 'Philadelphia 76ers', 'nba/phx': 'Phoenix Suns',
  'nba/por': 'Portland Trail Blazers', 'nba/sa':  'San Antonio Spurs', 'nba/sac': 'Sacramento Kings',
  'nba/tor': 'Toronto Raptors', 'nba/utah':'Utah Jazz', 'nba/wsh': 'Washington Wizards',
  // WNBA
  'wnba/atl':'Atlanta Dream', 'wnba/chi':'Chicago Sky', 'wnba/con':'Connecticut Sun',
  'wnba/dal':'Dallas Wings', 'wnba/gs': 'Golden State Valkyries', 'wnba/ind':'Indiana Fever',
  'wnba/la': 'LA Sparks', 'wnba/lv': 'Las Vegas Aces', 'wnba/min':'Minnesota Lynx',
  'wnba/ny': 'New York Liberty', 'wnba/phx':'Phoenix Mercury', 'wnba/por':'Portland Fire',
  'wnba/sea':'Seattle Storm', 'wnba/tor':'Toronto Tempo', 'wnba/wsh':'Washington Mystics',
  // NFL (subset — most-frequently-scanned)
  'nfl/ari':'Arizona Cardinals', 'nfl/atl':'Atlanta Falcons', 'nfl/bal':'Baltimore Ravens',
  'nfl/buf':'Buffalo Bills', 'nfl/car':'Carolina Panthers', 'nfl/chi':'Chicago Bears',
  'nfl/cin':'Cincinnati Bengals', 'nfl/cle':'Cleveland Browns', 'nfl/dal':'Dallas Cowboys',
  'nfl/den':'Denver Broncos', 'nfl/det':'Detroit Lions', 'nfl/gb': 'Green Bay Packers',
  'nfl/hou':'Houston Texans', 'nfl/ind':'Indianapolis Colts', 'nfl/jax':'Jacksonville Jaguars',
  'nfl/kc': 'Kansas City Chiefs', 'nfl/lac':'LA Chargers', 'nfl/lar':'LA Rams',
  'nfl/lv': 'Las Vegas Raiders', 'nfl/mia':'Miami Dolphins', 'nfl/min':'Minnesota Vikings',
  'nfl/ne': 'New England Patriots', 'nfl/no': 'New Orleans Saints', 'nfl/nyg':'New York Giants',
  'nfl/nyj':'New York Jets', 'nfl/phi':'Philadelphia Eagles', 'nfl/pit':'Pittsburgh Steelers',
  'nfl/sea':'Seattle Seahawks', 'nfl/sf': 'San Francisco 49ers', 'nfl/tb': 'Tampa Bay Buccaneers',
  'nfl/ten':'Tennessee Titans', 'nfl/wsh':'Washington Commanders',
};

// Per-team primary jersey color (one of: red, blue, green, purple, yellow, white)
const TEAM_JERSEY_COLOR: Record<string, 'red' | 'blue' | 'green' | 'purple' | 'yellow' | 'white'> = {
  'nba/atl':'red','nba/bos':'green','nba/bkn':'white','nba/cha':'purple','nba/chi':'red',
  'nba/cle':'red','nba/dal':'blue','nba/den':'blue','nba/det':'red','nba/gs':'blue',
  'nba/hou':'red','nba/ind':'yellow','nba/lac':'red','nba/lal':'purple','nba/mem':'blue',
  'nba/mia':'red','nba/mil':'green','nba/min':'blue','nba/no':'blue','nba/ny':'blue',
  'nba/okc':'blue','nba/orl':'blue','nba/phi':'blue','nba/phx':'purple','nba/por':'red',
  'nba/sa':'white','nba/sac':'purple','nba/tor':'red','nba/utah':'blue','nba/wsh':'red',
  'wnba/atl':'red','wnba/chi':'blue','wnba/con':'red','wnba/dal':'blue','wnba/gs':'purple',
  'wnba/ind':'yellow','wnba/la':'purple','wnba/lv':'red','wnba/min':'blue','wnba/ny':'green',
  'wnba/phx':'purple','wnba/por':'red','wnba/sea':'green','wnba/tor':'red','wnba/wsh':'blue',
  'nfl/ari':'red','nfl/atl':'red','nfl/bal':'purple','nfl/buf':'blue','nfl/car':'blue',
  'nfl/chi':'blue','nfl/cin':'red','nfl/cle':'red','nfl/dal':'blue','nfl/den':'blue',
  'nfl/det':'blue','nfl/gb':'green','nfl/hou':'blue','nfl/ind':'blue','nfl/jax':'green',
  'nfl/kc':'red','nfl/lac':'blue','nfl/lar':'blue','nfl/lv':'white','nfl/mia':'red',
  'nfl/min':'purple','nfl/ne':'blue','nfl/no':'yellow','nfl/nyg':'blue','nfl/nyj':'green',
  'nfl/phi':'green','nfl/pit':'yellow','nfl/sea':'blue','nfl/sf':'red','nfl/tb':'red',
  'nfl/ten':'blue','nfl/wsh':'red',
};

function findRosterPlayer(playerId: string, league: string, team: string): RosterPlayer | null {
  const roster = ROSTERS[`${league}/${team}`] || [];
  return roster.find((p) => p.id === playerId) || null;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const player = GOSSIP[id];

  if (!player) {
    return NextResponse.json(
      {
        player_name: 'Unknown',
        number: 0,
        position: 'Unknown',
        team: 'Unknown',
        jersey_color: 'white',
        blurb: `No player found for id "${id}".`,
        confidence: 0,
      },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const teamKey = `${player.league}/${player.team}`;
  const teamName = TEAM_NAMES[teamKey] || player.team.toUpperCase();
  const jerseyColor = TEAM_JERSEY_COLOR[teamKey] || 'white';
  const rosterEntry = findRosterPlayer(id, player.league, player.team);

  const dramaItems = (player.items || [])
    .filter((it) => DRAMA_CATEGORIES.has(it.category))
    .slice(0, 3);

  const blurb =
    dramaItems[0]
      ? `${dramaItems[0].headline}.`
      : `${player.name} — ${teamName}.`;

  return NextResponse.json(
    {
      player_name: player.name,
      number: rosterEntry?.jersey ? Number(rosterEntry.jersey) || 0 : 0,
      position: rosterEntry?.pos || 'Unknown',
      team: teamName,
      jersey_color: jerseyColor,
      blurb,
      confidence: 1.0,
      modes: {
        drama: dramaItems.map((it) => ({
          tier: it.tier,
          headline: it.headline,
          summary: `${it.summary} (Sources: ${it.sources.map((s) => s.name).join(', ')})`,
        })),
        on_field: '',
        learn: '',
      },
    },
    { status: 200, headers: CORS_HEADERS }
  );
}
