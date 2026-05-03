import { NextRequest } from 'next/server';
import { getOpenAI, MODELS, hasOpenAIKey } from '@/lib/openai';
import gossipData from '@/data/players-gossip.json';
import rostersData from '@/data/rosters.json';
import { rosterLookup } from '@/lib/roster-lookup';
import {
  verifyAgainstCandidates,
  getFaceEntry,
  findCandidatesByTeamAndNumber,
} from '@/lib/face-match';

/**
 * Build a fast index: player_id → { league, team, jersey } from rosters.json.
 * Used to verify vision's claimed player against their ACTUAL current roster
 * entry. If vision says "SGA #1 Nuggets" but rosters has "SGA #2 Thunder",
 * vision invented the number/team to match a face it guessed wrong → reject.
 */
type RosterIndex = Record<string, { league: string; team: string; jersey: string; pos: string }>;
const ROSTER_INDEX: RosterIndex = (() => {
  const idx: RosterIndex = {};
  const rosters = (rostersData as { rosters: Record<string, { id: string; jersey: string; pos: string }[]> }).rosters;
  for (const [key, list] of Object.entries(rosters)) {
    const [league, team] = key.split('/');
    for (const p of list) {
      // First write wins — if a player appears on multiple rosters (rare; usually a stale entry),
      // the first one is the canonical current team
      if (!idx[p.id]) idx[p.id] = { league, team, jersey: p.jersey, pos: p.pos };
    }
  }
  return idx;
})();

/**
 * Quality gate: confidence threshold. Vision returns a self-rated 0.0-1.0
 * confidence. Below this, we override to Unknown — but ONLY when the
 * roster cross-check hasn't confirmed the player.
 *
 * 0.65 chosen 2026-05-01: previously 0.85 (set after MPJ → SGA misfire), which
 * killed correct mid-confidence face-only IDs (e.g. Miles Bridges from a
 * headshot, returning vision conf 0.78). Now that roster cross-check runs
 * BEFORE the floor, the floor only fires when there's no roster data to
 * verify against. Lowering to 0.65 lets confident face-only IDs through
 * for non-superstars, while still blocking obvious garbage (< 0.65).
 */
const CONFIDENCE_FLOOR = 0.65;

/**
 * Map a team string returned by GPT-4o vision (e.g. "Oklahoma City Thunder",
 * "LA Lakers", "Kansas City Chiefs", "Indiana Fever") to our short team code
 * used across rosters.json + face indexes. Falls back to null if no match.
 *
 * Covers: NBA (30), NFL (32), WNBA (15) — 77 team mappings total.
 */
const TEAM_NAME_TO_CODE: Record<string, string> = {
  // ───── NBA (30) ─────
  'atlanta hawks':'atl','boston celtics':'bos','brooklyn nets':'bkn','charlotte hornets':'cha',
  'chicago bulls':'chi','cleveland cavaliers':'cle','dallas mavericks':'dal','denver nuggets':'den',
  'detroit pistons':'det','golden state warriors':'gs','houston rockets':'hou','indiana pacers':'ind',
  'la clippers':'lac','los angeles clippers':'lac','la lakers':'lal','los angeles lakers':'lal',
  'memphis grizzlies':'mem','miami heat':'mia','milwaukee bucks':'mil','minnesota timberwolves':'min',
  'new orleans pelicans':'no','new york knicks':'ny','oklahoma city thunder':'okc','orlando magic':'orl',
  'philadelphia 76ers':'phi','philadelphia sixers':'phi','phoenix suns':'phx',
  'portland trail blazers':'por','san antonio spurs':'sa','sacramento kings':'sac',
  'toronto raptors':'tor','utah jazz':'utah','washington wizards':'wsh',
  // ───── NFL (32) ─────
  'arizona cardinals':'ari','atlanta falcons':'atl','baltimore ravens':'bal','buffalo bills':'buf',
  'carolina panthers':'car','chicago bears':'chi','cincinnati bengals':'cin','cleveland browns':'cle',
  'dallas cowboys':'dal','denver broncos':'den','detroit lions':'det','green bay packers':'gb',
  'houston texans':'hou','indianapolis colts':'ind','jacksonville jaguars':'jax','kansas city chiefs':'kc',
  'las vegas raiders':'lv','los angeles chargers':'lac','la chargers':'lac',
  'los angeles rams':'lar','la rams':'lar','miami dolphins':'mia','minnesota vikings':'min',
  'new england patriots':'ne','new orleans saints':'no','new york giants':'nyg','new york jets':'nyj',
  'philadelphia eagles':'phi','pittsburgh steelers':'pit','san francisco 49ers':'sf','seattle seahawks':'sea',
  'tampa bay buccaneers':'tb','tennessee titans':'ten','washington commanders':'wsh',
  // ───── WNBA (15) ─────
  'atlanta dream':'atl','chicago sky':'chi','connecticut sun':'con','dallas wings':'dal',
  'golden state valkyries':'gs','indiana fever':'ind','los angeles sparks':'la','la sparks':'la',
  'las vegas aces':'lv','minnesota lynx':'min','new york liberty':'ny','phoenix mercury':'phx',
  'portland fire':'por','seattle storm':'sea','toronto tempo':'tor','washington mystics':'wsh',
};
function extractTeamCode(visionTeam?: string | null): string | null {
  if (!visionTeam) return null;
  const lower = visionTeam.toLowerCase().trim();
  if (TEAM_NAME_TO_CODE[lower]) return TEAM_NAME_TO_CODE[lower];
  // Try matching individual tokens against team names
  for (const [name, code] of Object.entries(TEAM_NAME_TO_CODE)) {
    if (lower.includes(name) || name.includes(lower)) return code;
  }
  return null;
}


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
  league: 'nfl' | 'nba';
  items: GossipItem[];
};
const GOSSIP: Record<string, GossipPlayer> = gossipData as Record<string, GossipPlayer>;
const DRAMA_CATEGORIES = new Set(['romance', 'family', 'legal', 'culture', 'off_field']);

/**
 * RECOVERY: when vision returns Unknown but says it read team + number off the jersey,
 * try to resolve the player from our roster index. Vision often correctly reads "INDIANA
 * FEVER" + "22" off a back-of-jersey shot but doesn't connect it to Caitlin Clark
 * (especially newer players whose face it hasn't strongly memorized).
 *
 * Walks each whitespace-separated token in the team string against our jersey-text
 * alias map, picks the token that returns the fewest candidates (most specific), and
 * filters to the matching jersey number. Returns the candidate if and only if the
 * lookup narrows to exactly one player.
 */
function recoverFromVisionTextSignals(
  visionTeam: string | undefined,
  visionNumber: number | string | undefined,
): { name: string; team: string; league: string; position: string; jerseyNumber: string } | null {
  if (!visionTeam || visionNumber == null) return null;
  const numStr = String(visionNumber).trim();
  if (!numStr || numStr === '0') return null;

  const tokens = visionTeam
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((t) => t.length >= 3);

  let best: ReturnType<typeof rosterLookup>['candidates'] | null = null;
  for (const token of tokens) {
    const { candidates } = rosterLookup({ teamHint: token, number: numStr });
    if (candidates.length === 0) continue;
    if (!best || candidates.length < best.length) best = candidates;
    if (best.length === 1) break;
  }

  if (!best || best.length !== 1) return null;
  const c = best[0];
  return {
    name: c.name,
    team: c.team,
    league: c.league,
    position: c.position,
    jerseyNumber: c.jerseyNumber,
  };
}

/** Convert a player name to slug-id format and look up gossip. Tries exact + partial match. */
function lookupGossipByName(playerName: string): GossipPlayer | null {
  if (!playerName || playerName === 'Unknown') return null;
  const slug = playerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (GOSSIP[slug]) return GOSSIP[slug];
  // Try matching by full name
  for (const [, p] of Object.entries(GOSSIP)) {
    if (p.name.toLowerCase() === playerName.toLowerCase()) return p;
  }
  return null;
}

/** Extract drama-only items (off-court only — no career/health/sports stats). */
function getDramaItems(player: GossipPlayer): GossipItem[] {
  return player.items.filter((i) => DRAMA_CATEGORIES.has(i.category));
}

/** Extract on-field items (career, health, sports stats). */
function getOnFieldItems(player: GossipPlayer): GossipItem[] {
  return player.items.filter((i) => !DRAMA_CATEGORIES.has(i.category));
}

/**
 * POST /api/scan
 *
 * Accepts multipart/form-data with field `image` = JPEG/PNG bytes.
 * Returns JSON with the player identified.
 *
 * If OPENAI_API_KEY is set: gpt-4o vision call to identify player from photo.
 * If no key OR vision fails: cycles through 4 bundled sample results so the
 * mobile Snap tab never breaks during demos.
 *
 * Response shape:
 * {
 *   player_name: string,
 *   number: number,
 *   position: string,
 *   team: string,
 *   jersey_color: 'red'|'blue'|'green'|'purple'|'yellow'|'white',
 *   blurb: string,
 *   game?: { home, home_score, away, away_score, clock }
 * }
 */

export const runtime = 'nodejs';
// 2026-05-01 fix: scan was getting killed at Vercel's default function timeout
// (10s Hobby / 15s Pro) mid-flight, causing client-side 60s curl hangs. Vision
// can be 4-8s and face-match 5-15s on top, so the function legitimately needs
// up to 30s. Set explicit maxDuration so the function completes instead of
// being killed mid-response.
export const maxDuration = 30;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

type ScanResult = {
  player_name: string;
  number: number;
  position: string;
  team: string;
  jersey_color: 'red' | 'blue' | 'green' | 'purple' | 'yellow' | 'white';
  blurb: string;
  /** Vision model's self-reported certainty 0.0-1.0. Sample / fallback paths default to 1.0. */
  confidence?: number;
  game?: { home: string; home_score: number; away: string; away_score: number; clock: string };
  // Tea'd Up modes-organized response (when modes=drama,on_field,learn requested)
  modes?: {
    drama?: { tier: 'confirmed' | 'reported' | 'speculation' | 'rumor'; headline: string; summary: string }[];
    on_field?: string;
    learn?: string;
  };
};

// Rich sample results — each one includes mode-organized content with confirmed
// drama claims, on-field narratives, and learn explainers. This way the
// "Try a random athlete" demo looks like a real scan, not a placeholder.
const SAMPLE_RESULTS: ScanResult[] = [
  {
    player_name: 'Travis Kelce',
    number: 87,
    position: 'Tight End',
    team: 'Kansas City Chiefs',
    jersey_color: 'red',
    blurb: "Future Hall of Famer. Three rings. Yes — he's the one dating Taylor Swift.",
    game: { home: 'KC', home_score: 24, away: 'DAL', away_score: 17, clock: '4Q 2:14' },
    modes: {
      drama: [
        { tier: 'confirmed', headline: 'Dating Taylor Swift since summer 2023', summary: "She's been at most home games. The Eras Tour cameo, the postgame hugs, the Pinkett Mahomes bestie pact — this one's been on every camera in the league." },
        { tier: 'confirmed', headline: 'Co-hosts the New Heights podcast with brother Jason', summary: "The two-Kelce-brothers pod has been one of the most-listened sports shows in America since 2022. Jason retired in 2024 — Travis kept the mic." },
        { tier: 'reported', headline: "Quietly the Chiefs' second-most-valuable player after Mahomes", summary: 'Per multiple league sources, his role in the offense and locker room is irreplaceable. The retirement watch every offseason is a national event.' },
      ],
      on_field: "The greatest receiving tight end of his generation. 3 Super Bowls. 4-time First-Team All-Pro. The Mahomes-Kelce connection is the most-productive QB-TE duo in NFL history. He's 36 and somehow still elite. Andy Reid has run the same Cover-2-beater concept off play-action to him for 11 years and defensive coordinators STILL haven't solved it.",
      learn: "A 'tight end' is half-blocker, half-receiver — a hybrid position that lines up next to the offensive tackle. Most tight ends are blocking specialists who occasionally catch passes. Kelce inverted that — he's a receiver who occasionally blocks. That's why he's an NFL revolution: he made the position what it is today.",
    },
  },
  {
    player_name: 'Patrick Mahomes',
    number: 15,
    position: 'Quarterback',
    team: 'Kansas City Chiefs',
    jersey_color: 'red',
    blurb: 'Three-time Super Bowl MVP. The face of the league. Side-arm passes that look like physics violations.',
    game: { home: 'KC', home_score: 24, away: 'DAL', away_score: 17, clock: '4Q 2:14' },
    modes: {
      drama: [
        { tier: 'confirmed', headline: 'Chasing the three-peat — only the 1965-67 Packers have ever done it', summary: "Won Super Bowls LIV, LVII, LVIII. Going for back-to-back-to-back is the storyline of the 2025-26 season." },
        { tier: 'reported', headline: "His brother Jackson and wife Brittany are perpetual tabloid storylines", summary: 'Jackson has had multiple TikTok controversies. Brittany is a polarizing main character who feuds publicly. Patrick stays out of it.' },
        { tier: 'speculation', headline: 'Rumored to be one of the 5 richest athletes globally by 2030', summary: '$450M Chiefs extension, equity in KC Royals, State Farm campaigns, plus growing entertainment ventures.' },
      ],
      on_field: "The clearest GOAT-trajectory player since Brady. 3 Super Bowls + 3 SB MVPs by age 28 — both records. The side-arm 'no-look' pass is his signature, the unscripted scramble drill is his ceiling. Andy Reid is his Phil Jackson. The Chiefs offense is a machine: Reid's 5-step drop, Mahomes's 7-step extension, Kelce's option route.",
      learn: "A 'quarterback' calls the play, takes the snap, and decides where the ball goes — pass, hand-off, or run. Modern QBs have to read defensive shells (Cover 1, 2, 3, 4) pre-snap, then improvise post-snap when the play breaks down. Mahomes's gift is 'extending plays' — when the original design fails he stays alive in the pocket and creates from chaos.",
    },
  },
  {
    player_name: 'Shai Gilgeous-Alexander',
    number: 2,
    position: 'Guard',
    team: 'Oklahoma City Thunder',
    jersey_color: 'blue',
    blurb: 'Reigning MVP. Postgame cardigans. Two-word answers. Says everything with his chest.',
    game: { home: 'OKC', home_score: 108, away: 'BOS', away_score: 102, clock: '3Q 4:32' },
    modes: {
      drama: [
        { tier: 'confirmed', headline: '2024 NBA MVP — quiet, undeniable, undefeated narrative', summary: 'First Canadian MVP in NBA history. Beat Jokic and Luka in voting. Now leading OKC to the #1 seed in the West, on track for back-to-back.' },
        { tier: 'confirmed', headline: 'Postgame cardigan economy is real', summary: 'Every postgame interview becomes a Vogue editorial. The fits drive merch sales for the Thunder beyond what any small-market team has ever pulled.' },
        { tier: 'speculation', headline: "He'll be the first $300M+ extension in NBA history", summary: 'Contract talks loom. Insiders say OKC is fully prepared to lock him in long-term whatever the cost.' },
      ],
      on_field: "The smoothest mid-range scorer in basketball. Mr. Cardigan plays like Kobe in his footwork, like Harden in his foul-drawing, like Steph in his lift. The Thunder are running a basketball-historical experiment: youngest starting 5 in modern history, anchored by SGA's calm. He doesn't dunk often. He doesn't need to.",
      learn: "A 'guard' is a backcourt player — the 1 (point guard, runs the offense) or 2 (shooting guard, scores). SGA is the 1 with 2 instincts. Modern positionless basketball blurred the lines, but his job is to bring the ball up, set the team into a play, and create his own shot if nothing develops. He averages 30+ a game doing it.",
    },
  },
  {
    player_name: 'Victor Wembanyama',
    number: 1,
    position: 'Center',
    team: 'San Antonio Spurs',
    jersey_color: 'white',
    blurb: "7'4 French unicorn. Defensive Player of the Year favorite. Plays like LeBron and Dirk had a child raised by Pop.",
    game: { home: 'SAS', home_score: 96, away: 'DEN', away_score: 91, clock: '4Q 6:08' },
    modes: {
      drama: [
        { tier: 'confirmed', headline: 'Pop suffered a stroke in November 2024 — Wemby is now the franchise face', summary: 'Greg Popovich, the all-time wins leader, collapsed at a team dinner. Mitch Johnson is interim. Wemby is leading the team without his architect.' },
        { tier: 'confirmed', headline: '2024 Rookie of the Year, unanimous', summary: 'First rookie since LeBron with that combination of media attention + production. Averaged 21/10/4 with 3.6 blocks. Set the rookie 5x5 record.' },
        { tier: 'speculation', headline: 'The "next-Jordan" mantle finally lands on someone who might earn it', summary: "Insiders say his work ethic + frame + skill set is unprecedented in NBA history. Expectations: 5+ MVPs, 3+ rings if healthy." },
      ],
      on_field: "Imagine 7'4 with guard skills. He shoots 3s. He handles. He blocks shots like Olajuwon. He's been compared to KD plus Bol Bol plus a young Dirk. The Spurs are tanking around him on purpose to give him another lottery pick. The 2025 season was his transition from prospect to proven elite. The ceiling is genuinely without precedent.",
      learn: "A 'center' is the tallest player on the court, traditionally responsible for rebounding, rim defense, and putbacks. Modern centers (like Wemby, Embiid, Jokic) also handle, pass, and shoot — they're called 'unicorns' because their skill set used to be impossible. Wemby's reach is so absurd he can contest every shot near the rim while standing flat-footed.",
    },
  },
];

// In-memory rotating index so successive calls without an API key cycle the samples.
let _sampleIndex = 0;
function nextSample(): ScanResult {
  // Deep clone so subsequent mutation (sample.modes assignment in fallback path) doesn't pollute the cache
  const r = SAMPLE_RESULTS[_sampleIndex % SAMPLE_RESULTS.length];
  _sampleIndex += 1;
  return JSON.parse(JSON.stringify(r));
}

export async function POST(req: NextRequest) {
  // Parse query string. New: ?teadUp=true (single master toggle).
  // Legacy: ?modes=drama,on_field,learn (still supported).
  // Demo: ?sample=<id> returns a pre-authored sample (no image required).
  const url = new URL(req.url);
  const teadUpParam = url.searchParams.get('teadUp');
  const modesParam = url.searchParams.get('modes');
  const sampleParam = url.searchParams.get('sample');

  let modes: ('drama' | 'on_field' | 'learn')[] = [];
  if (teadUpParam !== null) {
    // teadUp=true → all three modes including drama
    // teadUp=false → on_field + learn only (no drama)
    const teadUpOn = teadUpParam === 'true' || teadUpParam === '1';
    modes = teadUpOn ? ['drama', 'on_field', 'learn'] : ['on_field', 'learn'];
  } else if (modesParam) {
    modes = modesParam.split(',').filter((m): m is 'drama' | 'on_field' | 'learn' =>
      ['drama', 'on_field', 'learn'].includes(m)
    );
  }
  const wantsModes = modes.length > 0;

  /** Helper: return a sample with the modes-payload filtered to the requested modes. */
  function returnSample(s: ScanResult, fallback = false): Response {
    const sample = JSON.parse(JSON.stringify(s)) as ScanResult;
    if (wantsModes && sample.modes) {
      sample.modes = {
        drama: modes.includes('drama') ? sample.modes.drama : undefined,
        on_field: modes.includes('on_field') ? sample.modes.on_field : undefined,
        learn: modes.includes('learn') ? sample.modes.learn : undefined,
      };
    } else if (!wantsModes) {
      delete sample.modes;
    }
    return new Response(JSON.stringify(sample), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...(fallback ? { 'X-Scan-Fallback': '1' } : {}),
        ...CORS_HEADERS,
      },
    });
  }

  // ─────────────────────────────────────────────────────────
  // ?sample=<id> → demo mode: return a specific or random sample
  // (also: ?sample=random or ?sample alone). No image required.
  // ─────────────────────────────────────────────────────────
  if (sampleParam !== null) {
    const slug = sampleParam.trim().toLowerCase();
    // Try to match by slug fragments of the player name (e.g. 'travis-kelce' → matches 'Travis Kelce')
    const match =
      slug && slug !== 'random'
        ? SAMPLE_RESULTS.find((s) =>
            s.player_name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .includes(slug.replace(/[^a-z0-9]+/g, '-'))
          )
        : null;
    const picked = match ?? SAMPLE_RESULTS[Math.floor(Math.random() * SAMPLE_RESULTS.length)];
    return returnSample(picked);
  }

  // ─────────────────────────────────────────────────────────
  // No API key → return Unknown (NOT a fake sample).
  //
  // Bug fix 2026-05-01: previously fell through to nextSample() on missing
  // key. Because Vercel cold-starts reset _sampleIndex to 0 every time, the
  // first sample in the array (Travis Kelce) was returned for *every* scan
  // when the key was missing in production — giving users a confidently
  // wrong, real-player answer regardless of what they actually scanned
  // (e.g. Miles Bridges → "Travis Kelce").
  //
  // Better failure mode: return Unknown with a clear status header so the
  // problem is visible. Demo samples are still reachable via ?sample=… for
  // intentional testing only.
  // ─────────────────────────────────────────────────────────
  if (!hasOpenAIKey()) {
    return new Response(
      JSON.stringify({
        player_name: 'Unknown',
        number: 0,
        position: 'Unknown',
        team: 'Unknown',
        jersey_color: 'white',
        blurb: "Scan is offline right now — try again in a moment.",
      } satisfies ScanResult),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Scan-Mode': 'no_key',
          ...CORS_HEADERS,
        },
      },
    );
  }

  let imageBase64: string | null = null;
  try {
    const form = await req.formData();
    const file = form.get('image');
    if (!(file instanceof Blob)) throw new Error('no image field');
    const bytes = new Uint8Array(await file.arrayBuffer());
    imageBase64 = Buffer.from(bytes).toString('base64');
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid image upload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  }

  // ─────────────────────────────────────────────────────────
  // Vision call — return structured JSON player identification
  // (Face-match verification runs AFTER vision returns its claim,
  //  using vision's team/number to narrow candidates.)
  // ─────────────────────────────────────────────────────────

  // Build the system prompt — different shape based on whether modes were requested
  const systemPromptBase = `You are sportsBFF's vision analyst. Identify the NFL, NBA, or WNBA player in the image.

THREE SIGNALS — these are the ONLY reliable ones. Collect every signal you can read, then commit only when they CORROBORATE each other.

1. FACE — Recognize the face from your training. You've seen millions of photos of every active NFL + NBA + WNBA player AND retired stars AND current broadcasters. The face IS the strongest single signal for any face you confidently recognize. Three explicit cases the prompt previously under-served:

   (a) **Pregame / warmup shots** — players in suits, t-shirts, hoodies, walking in, on the bench, in the tunnel. NO jersey visible. If you recognize the face confidently as an active player, COMMIT. The whole point of the app is to ID them in this exact moment.

   (b) **Retired stars & broadcasters** — Carmelo Anthony, Shaq, Charles Barkley, Kenny Smith, Reggie Miller, Tom Brady (now FOX), Tony Romo (CBS), Stephen A. Smith, Pat McAfee, Doris Burke, Mike Breen, Bill Belichick (now Carolina), Peyton + Eli Manning (Omaha), Magic Johnson, Dwyane Wade, JJ Redick (now Lakers HC), Erin Andrews, Kirk Herbstreit, etc. These appear on TV constantly. If you recognize the face, COMMIT — even though they're not on a current roster.

   (c) **Owners & coaches on the sideline** — Jerry Jones, Mark Cuban, James Dolan, Steve Kerr, Erik Spoelstra, etc. Same rule: recognize the face, commit.

We have downstream verification (face-similarity matching against ESPN headshots, roster cross-check) that catches hallucinations, so a moderately-confident face ID will get validated or rejected automatically. Returning Unknown when you'd actually recognize the face is a missed catch.

2. TEAM NAME ON JERSEY — Read the LITERAL TEXT printed on the jersey or warmup. NFL away jerseys say "BRONCOS" / "EAGLES" / "CHIEFS" across the chest. NBA jerseys say "LAKERS" / "WARRIORS" / "BOSTON" / "MIAMI" / "BROOKLYN". WNBA jerseys say "FEVER" / "DREAM" / "ACES" / "LIBERTY" / "SPARKS" / "LYNX" / "MERCURY" / "STORM" / "WINGS" / "SKY" / "MYSTICS" / "SUN" / "VALKYRIES" / "TEMPO" / "FIRE". This is the team identifier — read the text, do not infer from colors. Many alternate / throwback / city-edition jerseys swap the team's normal palette entirely (cream Lakers, white Chiefs, all-black 49ers, royal-blue Mavs, etc.) so colors LIE. The lettering on the jersey does not lie.

3. JERSEY NUMBER — Read the digits on the chest, back, sleeve, or shorts. A number alone narrows a team's roster to 1 player almost always. Number + team name = guaranteed unique ID.

DO NOT use these as identification signals (they're too noisy):
- Team colors alone (alts and throwbacks invert palettes)
- Stadium / court / field — at most a tiebreaker, never a primary
- "Athletic vibe" or guessing a famous person because the photo "feels NFL"

THE CORROBORATION RULE:
- Commit when face alone identifies any active player you recognize (any tier, not just superstars). Downstream face-similarity matching + roster cross-check will validate or reject — you don't need to be the only line of defense.
- Commit confidently (high confidence ≥ 0.85) when ≥2 of {face, team name, jersey number} AGREE on the same player.
- Commit moderately (0.65 - 0.84) when only the face is recognized clearly with no contradicting signals.
- DO NOT COMMIT when signals CONFLICT. (e.g. face vibes "Mahomes" but the jersey says "SUNS" → return Unknown. The conflict means you guessed face wrong.)
- DO NOT COMMIT when you have 0 signals — face is unrecognizable AND no jersey text AND no jersey number AND not even a generic athletic context.
- Same image, scanned twice, must produce the same answer. If you'd answer differently on a hypothetical retry, you're guessing — return Unknown.

NEVER substitute a famous-athlete answer just because the photo "feels NFL" or the user probably wants a hit. Wrong IDs destroy user trust. Unknown is strictly better than a wrong guess.

Output a "confidence" field 0.0-1.0 reflecting your real certainty:
- 0.90-1.00 = ≥2 signals agree, OR face is an unmistakable superstar (LeBron / Curry / Mahomes tier)
- 0.75-0.89 = face alone for any clearly-recognized active player, no conflicts
- 0.60-0.74 = best guess from limited evidence — frontend will hedge with "looks like…"
- < 0.60 = return Unknown instead

ONLY return Unknown when:
- Face isn't clearly recognizable AND
- No jersey team name readable AND
- No jersey number readable

If you can read the team name but not the specific player, return Unknown rather than guessing the team's most-famous star.

For retired stars / broadcasters / coaches / owners, set the position field to their CURRENT role:
- Retired playing → e.g. "NBA Retired / Inside the NBA Analyst" (Shaq)
- Currently broadcasting → e.g. "FOX Lead Color Commentator" (Tom Brady)
- Coach → e.g. "Lakers Head Coach" (JJ Redick)
- Owner → e.g. "Cowboys Owner" (Jerry Jones)
And set the team field to their current affiliation ("FOX", "ESPN", "Lakers", "Cowboys", etc.) NOT their old playing team.

Unknown response shape (use sparingly):
{"player_name":"Unknown","number":0,"position":"Unknown","team":"Unknown","jersey_color":"white","blurb":"I couldn't quite ID this one — try a clearer crop on the jersey or a different angle."}

Voice: confident, knowing, gossipy-but-warm. PG-13 always. NEVER race/body/political/religious humor. NEVER unverified accusations.`;

  const systemPromptLegacy = `${systemPromptBase}

Return a single JSON object with these exact fields:
{
  "player_name": "<full name>",
  "number": <jersey number as integer>,
  "position": "<full position name>",
  "team": "<full team name>",
  "jersey_color": "<one of: red, blue, green, purple, yellow, white>",
  "blurb": "<2-sentence sportsBFF-voice: one factual line + one drama line. Max 35 words.>",
  "game": <if scoreboard visible: {home, home_score, away, away_score, clock} (3-letter codes); else omit>
}`;

  const systemPromptModes = `${systemPromptBase}

Return JSON with both legacy + modes-organized content. Active modes: ${modes.join(', ')}.

🚫 CRITICAL — "drama" is NEVER sports content. Never put career stats, MVPs, contracts, playoff runs, championships, draft picks, or game performances in the drama array. Those go in on_field.

✅ DRAMA = OFF-COURT/OFF-FIELD ONLY:
- Romance / dating / breakups / engagements (Travis-Taylor, Booker-Kendall, Booker-Bad-Bunny diss exchange, Hailee Steinfeld, etc.)
- Family drama (Brittany Mahomes, Jackson Mahomes legal stuff, Kelce brothers podcast, Bronny James)
- Legal incidents (Tyreek Hill detainment, Jackson Mahomes battery)
- Cultural moments (Vogue runway, fashion, viral interviews, Caleb's painted nails, KD's burner accounts)
- Internet / social-media moments

❌ NOT DRAMA: stats, scoring records, MVPs, All-Star selections, contract extensions, salary, trades, championships, game-winners, injury timelines.

If you don't know real off-court drama for this player, return drama as an empty array []. Never invent. Never substitute career content as a placeholder.

CONFIRMATION TIERS for drama claims:
[CONFIRMED] = 2+ mainstream outlets reported
[REPORTED]  = 1 mainstream outlet on the record
[SPECULATION] = insider buzz, off-the-record
[RUMOR] = unverified, fan/Twitter origin

For tier below CONFIRMED, hedge: "alleged", "according to", "some insiders said". Never state legal accusations as fact.

Return:
{
  "player_name": "<full name>",
  "number": <int>,
  "position": "<full position>",
  "team": "<full team name>",
  "jersey_color": "<red|blue|green|purple|yellow|white>",
  "blurb": "<2-sentence summary, max 35 words>",
  "game": <{home, home_score, away, away_score, clock} if scoreboard visible; else omit>,
  "modes": {
    ${modes.includes('drama') ? `"drama": [
      { "tier": "confirmed|reported|speculation|rumor", "headline": "<short headline>", "summary": "<1-2 sentence summary>" },
      ... (1-3 items)
    ],` : ''}
    ${modes.includes('on_field') ? `"on_field": "<2-3 sentence on-field storyline narrative — career chapters, GOAT debate, what-if arc, mythology. NOT just stats.>",` : ''}
    ${modes.includes('learn') ? `"learn": "<2-3 sentence concept explainer tied to this player — a rule, mechanic, or 'why-it-matters' relevant to them>"` : ''}
  }
}

Apply GOLDEN RULE at every level: if you don't know specific drama for this player, drama array can be empty. If on_field narrative isn't grounded, omit. NEVER invent.`;

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: MODELS.VISION,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: wantsModes ? systemPromptModes : systemPromptLegacy,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Who is this player?' },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: wantsModes ? 800 : 400,
      // Low temperature = deterministic IDs across repeat scans of the same image.
      // Was 0.4, which produced inconsistent results (e.g. Booker → Kelce on retry).
      temperature: 0.1,
      // Even more determinism: same prompt + same image should produce the same answer.
      seed: 42,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as ScanResult;

    // Snapshot of what vision said BEFORE any gates fire — for diagnostics.
    // Headers below report this so we can see whether failures are vision
    // refusing to commit vs. our gates rejecting a vision answer.
    const visionRaw = {
      player_name: parsed.player_name ?? 'Unknown',
      team: parsed.team ?? 'Unknown',
      number: parsed.number ?? 0,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    };

    // ════════════════════════════════════════════════════════════════════
    // FAST-PATH ROSTER CHECK (free, ~0ms — runs before Replicate)
    // ════════════════════════════════════════════════════════════════════
    // 2026-05-01 perf: previously face-match (5-15s) ALWAYS ran when vision
    // returned a player. But if our 3,646-player roster confirms vision's
    // claim (right player + right jersey number), we already KNOW it's right
    // — running Replicate just to confirm a known-good answer wastes 5-15s.
    //
    // Order now: roster check FIRST (in-memory, instant). If confirmed, ship
    // it and skip Replicate. Only run face-match when roster has no opinion
    // (player not in our DB, or no jersey number from vision) — exactly the
    // cases where we actually need Replicate's help to verify.
    let rosterFastPath: 'confirmed' | 'mismatch' | 'no_data' = 'no_data';
    if (
      parsed.player_name &&
      parsed.player_name !== 'Unknown' &&
      parsed.number &&
      parsed.number > 0
    ) {
      const slug = parsed.player_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const rosterEntry = ROSTER_INDEX[slug];
      if (rosterEntry) {
        const rNum = (rosterEntry.jersey || '').replace(/^0+/, '') || '0';
        const vNum = String(parsed.number).replace(/^0+/, '') || '0';
        rosterFastPath = rNum === vNum ? 'confirmed' : 'mismatch';
      }
    }

    // ════════════════════════════════════════════════════════════════════
    // FACE-MATCH VERIFICATION (skipped when roster fast-path already won)
    // ════════════════════════════════════════════════════════════════════
    // Only runs when:
    //   - Replicate token is set
    //   - Vision returned a real player_name (not Unknown)
    //   - Roster fast-path didn't confirm (i.e. player not in DB, or no
    //     jersey number, or roster says player wears a different number)
    //
    // When it runs, only verifies vision's named candidate (1 Replicate
    // call instead of up to 4) — that's enough to catch hallucinations.
    //
    // Failure modes (matter a lot — see 2026-05-01 perf incident):
    //   - similarity ≥ 0.65  →  verified, ship it
    //   - similarity < 0.65  →  Replicate explicitly rejected, kill to Unknown
    //   - Replicate timeout/error → couldn't verify, KEEP vision's answer
    //                                (don't kill correct IDs because Replicate
    //                                 had a cold start)
    let faceVerification: 'skipped' | 'no_candidates' | 'no_match' | 'verified' | 'unverifiable' = 'skipped';
    let faceMatchId: string | null = null;
    let faceMatchSim = 0;

    const shouldRunFaceMatch =
      process.env.REPLICATE_API_TOKEN &&
      parsed.player_name &&
      parsed.player_name !== 'Unknown' &&
      rosterFastPath !== 'confirmed';

    if (shouldRunFaceMatch) {
      try {
        const userImageDataUri = `data:image/jpeg;base64,${imageBase64}`;
        const visionSlug = parsed.player_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        const visionCandidate = getFaceEntry(visionSlug);

        // Single-candidate verification — much faster than the old 4-candidate
        // sweep. The roster check above already handles the "vision named the
        // wrong player" case; face-match just confirms the named one is real.
        const candidates = visionCandidate ? [visionCandidate] : [];

        if (candidates.length === 0) {
          faceVerification = 'no_candidates';
        } else {
          const result = await verifyAgainstCandidates(userImageDataUri, candidates, 0.65);
          if (result.bestMatch) {
            faceMatchId = result.bestMatch.entry.id;
            faceMatchSim = result.bestMatch.similarity;
            faceVerification = 'verified';
            const gossipPlayer = GOSSIP[faceMatchId];
            if (gossipPlayer) {
              parsed.player_name = gossipPlayer.name;
            } else {
              parsed.player_name = result.bestMatch.entry.name;
            }
            parsed.confidence = Math.max(parsed.confidence ?? 0, faceMatchSim);
          } else {
            // Distinguish two failure modes:
            //   - All scored candidates returned similarity 0 → Replicate
            //     errored/timed out, we couldn't verify. Keep vision's answer.
            //   - At least one candidate scored > 0 but below threshold →
            //     Replicate compared and explicitly rejected. Kill to Unknown.
            const explicitlyRejected = result.scored.some((s) => s.similarity > 0);
            if (explicitlyRejected) {
              faceVerification = 'no_match';
              parsed.player_name = 'Unknown';
            } else {
              // Couldn't verify — but vision's answer is still our best guess.
              faceVerification = 'unverifiable';
            }
          }
        }
      } catch {
        // Silent — face verification is additive. Keep vision's answer.
        faceVerification = 'unverifiable';
      }
    }

    // ════════════════════════════════════════════════════════════════════
    // QUALITY GATES — roster cross-check first, then confidence floor
    // ════════════════════════════════════════════════════════════════════
    // 2026-05-01: previously the confidence floor (0.85) fired BEFORE the
    // roster check, killing correct moderate-confidence IDs (e.g. Miles
    // Bridges at conf 0.78, even though he genuinely wears #0 for the
    // Hornets and the roster would have confirmed). The fix: run the
    // roster cross-check first. If roster CONFIRMS the player+number,
    // vision was right — ship it regardless of self-reported confidence.
    // If roster MISMATCHES, vision hallucinated — kill it. Only fall back
    // to the confidence floor when the roster has no opinion (player not
    // in our DB, or no jersey number returned).
    let qualityGate: 'passed' | 'low_confidence' | 'roster_mismatch' | 'roster_confirmed' = 'passed';
    let rosterCheck: 'confirmed' | 'mismatch' | 'no_data' = 'no_data';

    if (
      parsed.player_name &&
      parsed.player_name !== 'Unknown' &&
      parsed.number &&
      parsed.number > 0
    ) {
      const playerSlug = parsed.player_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const rosterEntry = ROSTER_INDEX[playerSlug];
      if (rosterEntry) {
        const rosterNum = (rosterEntry.jersey || '').replace(/^0+/, '') || '0';
        const visionNum = String(parsed.number).replace(/^0+/, '') || '0';
        rosterCheck = rosterNum === visionNum ? 'confirmed' : 'mismatch';
      }
    }

    if (rosterCheck === 'mismatch') {
      // Vision-claimed player doesn't wear that number — hallucination.
      qualityGate = 'roster_mismatch';
      parsed.player_name = 'Unknown';
    } else if (rosterCheck === 'confirmed') {
      // Roster verifies the ID — trust it. Roster is harder evidence
      // than vision's self-rated confidence.
      qualityGate = 'roster_confirmed';
      parsed.confidence = Math.max(parsed.confidence ?? 0, 0.9);
    } else if (
      parsed.player_name &&
      parsed.player_name !== 'Unknown' &&
      typeof parsed.confidence === 'number' &&
      parsed.confidence < CONFIDENCE_FLOOR
    ) {
      // No roster data and low confidence — likely a hallucination.
      qualityGate = 'low_confidence';
      parsed.player_name = 'Unknown';
    }

    // ════════════════════════════════════════════════════════════════════
    // ROSTER-LOOKUP RECOVERY (fallback)
    // ════════════════════════════════════════════════════════════════════
    // If vision returned Unknown (or we just downgraded to Unknown above)
    // but read team + number off the jersey, try to resolve via our roster
    // index. This is what saves Caitlin Clark when vision sees "FEVER + 22"
    // but can't ID her face. Now also rescues cases where we rejected a
    // hallucinated face but the jersey signals were actually clean.
    let recoveryFired: 'none' | 'recovered' | 'no_match' = 'none';
    if (parsed.player_name === 'Unknown' || !parsed.player_name) {
      recoveryFired = 'no_match';
      const recovered = recoverFromVisionTextSignals(parsed.team, parsed.number);
      if (recovered) {
        parsed.player_name = recovered.name;
        parsed.position = recovered.position || parsed.position;
        parsed.number = Number(recovered.jerseyNumber) || parsed.number;
        parsed.confidence = 0.85;
        parsed.blurb = `${recovered.name} — based on the jersey signals.`;
        recoveryFired = 'recovered';
      }
    }

    // After all gates: if still Unknown, ensure clean Unknown response shape
    if (parsed.player_name === 'Unknown') {
      parsed.number = 0;
      parsed.position = 'Unknown';
      parsed.team = 'Unknown';
      parsed.confidence = 0;
      parsed.blurb = "I couldn't quite ID this one — try a clearer crop on the jersey or a different angle.";
    }

    // OVERRIDE drama with curated, sourced gossip from the database when we have it.
    // The vision model often invents sports-stat content as "drama"; the curated DB is
    // off-court only with real citations. Database wins over vision for drama claims.
    const playerGossip = lookupGossipByName(parsed.player_name);
    if (playerGossip && wantsModes && parsed.modes) {
      if (modes.includes('drama')) {
        const dramaItems = getDramaItems(playerGossip).slice(0, 3);
        if (dramaItems.length > 0) {
          parsed.modes.drama = dramaItems.map((it) => ({
            tier: it.tier,
            headline: it.headline,
            summary: `${it.summary} (Sources: ${it.sources.map((s) => s.name).join(', ')})`,
          }));
        }
      }
      // For on_field, also let curated DB inform if available — but as a narrative paragraph.
      // We keep the vision-generated on_field UNLESS the DB has solid items. Keep things simple
      // for v1 and just augment drama; on_field can be improved in a v2.
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Scan-Mode': 'vision',
        'X-Scan-Recovery': recoveryFired,
        'X-Scan-Quality-Gate': qualityGate,
        'X-Scan-Roster-Check': rosterCheck,
        'X-Scan-Face-Verify': faceVerification,
        'X-Scan-Face-Match': faceMatchId ? `${faceMatchId}@${faceMatchSim.toFixed(3)}` : 'none',
        'X-Scan-Vision-Player': String(visionRaw.player_name).slice(0, 60),
        'X-Scan-Vision-Confidence': visionRaw.confidence.toFixed(2),
        'X-Scan-Vision-Team': String(visionRaw.team).slice(0, 60),
        'X-Scan-Vision-Number': String(visionRaw.number),
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    // Vision failed (rate limit, JSON parse, network). Return an Unknown response
    // so the frontend shows the proper "try another angle" UX — no silent wrong
    // answers via random sample fallback.
    return new Response(
      JSON.stringify({
        player_name: 'Unknown',
        number: 0,
        position: 'Unknown',
        team: 'Unknown',
        jersey_color: 'white',
        blurb: "I couldn't quite ID this one — try a clearer crop on the jersey or a different angle.",
      } satisfies ScanResult),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Scan-Mode': 'vision_error',
          'X-Scan-Vision-Error': String(err).slice(0, 80),
          ...CORS_HEADERS,
        },
      },
    );
  }
}
