import { NextRequest } from 'next/server';
import { getOpenAI, MODELS, hasOpenAIKey } from '@/lib/openai';

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
  game?: { home: string; home_score: number; away: string; away_score: number; clock: string };
  // Tea'd Up modes-organized response (when modes=drama,on_field,learn requested)
  modes?: {
    drama?: { tier: 'confirmed' | 'reported' | 'speculation' | 'rumor'; headline: string; summary: string }[];
    on_field?: string;
    learn?: string;
  };
};

const SAMPLE_RESULTS: ScanResult[] = [
  {
    player_name: 'Travis Kelce',
    number: 87,
    position: 'Tight End',
    team: 'Kansas City Chiefs',
    jersey_color: 'red',
    blurb: "Future Hall of Famer. Three rings. Yes — he's the one dating Taylor Swift.",
    game: { home: 'KC', home_score: 24, away: 'DAL', away_score: 17, clock: '4Q 2:14' },
  },
  {
    player_name: 'Patrick Mahomes',
    number: 15,
    position: 'Quarterback',
    team: 'Kansas City Chiefs',
    jersey_color: 'red',
    blurb: 'Three-time Super Bowl MVP. The face of the league. Side-arm passes that look like physics violations.',
    game: { home: 'KC', home_score: 24, away: 'DAL', away_score: 17, clock: '4Q 2:14' },
  },
  {
    player_name: 'Shai Gilgeous-Alexander',
    number: 2,
    position: 'Guard',
    team: 'Oklahoma City Thunder',
    jersey_color: 'blue',
    blurb: 'Reigning MVP. Postgame cardigans. Two-word answers. Says everything with his chest.',
    game: { home: 'OKC', home_score: 108, away: 'BOS', away_score: 102, clock: '3Q 4:32' },
  },
  {
    player_name: 'Victor Wembanyama',
    number: 1,
    position: 'Center',
    team: 'San Antonio Spurs',
    jersey_color: 'white',
    blurb: "7'4 French unicorn. Defensive Player of the Year favorite. Plays like LeBron and Dirk had a child raised by Pop.",
    game: { home: 'SAS', home_score: 96, away: 'DEN', away_score: 91, clock: '4Q 6:08' },
  },
];

// In-memory rotating index so successive calls without an API key cycle the samples.
let _sampleIndex = 0;
function nextSample(): ScanResult {
  const r = SAMPLE_RESULTS[_sampleIndex % SAMPLE_RESULTS.length];
  _sampleIndex += 1;
  return r;
}

export async function POST(req: NextRequest) {
  // Parse query string for modes flag (Tea'd Up clients send `?modes=drama,on_field,learn`)
  const url = new URL(req.url);
  const modesParam = url.searchParams.get('modes');
  const modes = modesParam
    ? modesParam.split(',').filter((m): m is 'drama' | 'on_field' | 'learn' =>
        ['drama', 'on_field', 'learn'].includes(m)
      )
    : [];
  const wantsModes = modes.length > 0;

  // ─────────────────────────────────────────────────────────
  // No API key → return a sample so the demo never breaks
  // ─────────────────────────────────────────────────────────
  if (!hasOpenAIKey()) {
    const sample = nextSample();
    if (wantsModes) {
      // Wrap the sample blurb into the modes shape so clients still get a usable response
      sample.modes = {
        drama: modes.includes('drama')
          ? [{ tier: 'speculation', headline: 'Demo mode', summary: sample.blurb }]
          : undefined,
        on_field: modes.includes('on_field') ? sample.blurb : undefined,
        learn: modes.includes('learn') ? `${sample.player_name} plays ${sample.position} for the ${sample.team}.` : undefined,
      };
    }
    return new Response(JSON.stringify(sample), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
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
  const systemPromptBase = `You are Tea'd Up's vision analyst. Identify the NFL or NBA player in the image.

🚨 GOLDEN RULE: Never guess. If you can't reliably ID the player, return:
{"player_name":"Unknown","number":0,"position":"Unknown","team":"Unknown","jersey_color":"white","blurb":"I couldn't quite ID this one — try another angle or a clearer crop on the jersey."}

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
      temperature: 0.4,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw) as ScanResult;
    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err) {
    // Vision failed (rate limit, JSON parse, network) → graceful fallback to a sample
    // so the user never sees a broken Snap experience.
    return new Response(JSON.stringify(nextSample()), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Scan-Fallback': '1',
        ...CORS_HEADERS,
      },
    });
  }
}
