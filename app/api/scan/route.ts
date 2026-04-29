import { NextRequest } from 'next/server';
import { getOpenAI, MODELS, hasOpenAIKey } from '@/lib/openai';
import gossipData from '@/data/players-gossip.json';

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
  // No API key → return a rich pre-authored sample
  // ─────────────────────────────────────────────────────────
  if (!hasOpenAIKey()) {
    return returnSample(nextSample());
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
  // ─────────────────────────────────────────────────────────

  // Build the system prompt — different shape based on whether modes were requested
  const systemPromptBase = `You are sportsBFF's vision analyst. Identify the NFL or NBA player in the image.

THREE SIGNALS — these are the ONLY reliable ones. Collect every signal you can read, then commit only when they CORROBORATE each other.

1. FACE — Recognize the face from your training. You've seen millions of photos of every active NFL + NBA player. For top-tier stars (Mahomes, LeBron, Curry, Kelce, Wemby, SGA, Booker, Brunson, Luka, Ja, Tatum, KD, Zion, Caleb Williams, CJ Stroud, Burrow, Allen, Jefferson, Hill, Anthony Edwards, Jalen Hurts, etc.) the face IS reliable — they're some of the most-photographed people on Earth. Use it confidently when the face is clearly visible and front- or three-quarter-facing.

2. TEAM NAME ON JERSEY — Read the LITERAL TEXT printed on the jersey or warmup. NFL away jerseys say "BRONCOS" / "EAGLES" / "CHIEFS" across the chest. NBA jerseys say "LAKERS" / "WARRIORS" / "BOSTON" / "MIAMI" / "BROOKLYN". This is the team identifier — read the text, do not infer from colors. Many alternate / throwback / city-edition jerseys swap the team's normal palette entirely (cream Lakers, white Chiefs, all-black 49ers, royal-blue Mavs, etc.) so colors LIE. The lettering on the jersey does not lie.

3. JERSEY NUMBER — Read the digits on the chest, back, sleeve, or shorts. A number alone narrows a team's roster to 1 player almost always. Number + team name = guaranteed unique ID.

DO NOT use these as identification signals (they're too noisy):
- Team colors alone (alts and throwbacks invert palettes)
- Stadium / court / field — at most a tiebreaker, never a primary
- "Athletic vibe" or guessing a famous person because the photo "feels NFL"

THE CORROBORATION RULE:
- Commit confidently when ≥2 of {face, team name, jersey number} AGREE on the same player.
- Commit confidently when face alone is one of the top-15 most-photographed athletes (LeBron / Curry / Mahomes / Kelce / Wemby tier) AND nothing in the image CONTRADICTS that ID. A clear front-facing LeBron press-conference shot with no jersey visible is still LeBron.
- DO NOT COMMIT when signals CONFLICT. (e.g. face vibes "Mahomes" but the jersey says "SUNS" → return Unknown. The conflict means you guessed face wrong.)
- DO NOT COMMIT when you have 0 signals beyond "athletic vibe."
- Same image, scanned twice, must produce the same answer. If you'd answer differently on a hypothetical retry, you're guessing — return Unknown.

NEVER substitute a famous-athlete answer just because the photo "feels NFL" or the user probably wants a hit. Wrong IDs destroy user trust. Unknown is strictly better than a wrong guess.

Output a "confidence" field 0.0-1.0 reflecting your real certainty:
- 0.90-1.00 = ≥2 signals agree, or face is unmistakable top-15-photographed tier
- 0.75-0.89 = one strong signal, no conflicts
- 0.60-0.74 = best guess from limited evidence — iOS will hedge with "looks like…"
- < 0.60 = return Unknown instead

ONLY return Unknown when:
- Face isn't clearly recognizable AND
- No jersey team name readable AND
- No jersey number readable

If you can read the team name but not the specific player, return Unknown rather than guessing the team's most-famous star.

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
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
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
          'X-Scan-Vision-Error': String(err).slice(0, 80),
          ...CORS_HEADERS,
        },
      },
    );
  }
}
