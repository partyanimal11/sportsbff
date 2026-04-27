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
  // ─────────────────────────────────────────────────────────
  // No API key → return a sample so the demo never breaks
  // ─────────────────────────────────────────────────────────
  if (!hasOpenAIKey()) {
    return new Response(JSON.stringify(nextSample()), {
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
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: MODELS.VISION,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a sports broadcast analyst. The user has uploaded a photo of a TV broadcast or photo of an NFL or NBA player. Identify the player visible in the image and return a single JSON object with these exact fields:

{
  "player_name": "<full name>",
  "number": <jersey number as integer>,
  "position": "<full position name like 'Quarterback' or 'Point Guard'>",
  "team": "<full team name like 'Kansas City Chiefs' or 'Boston Celtics'>",
  "jersey_color": "<one of: red, blue, green, purple, yellow, white>",
  "blurb": "<2-sentence sportsBFF-voice description: one factual line + one personality/drama line. Max 35 words.>",
  "game": <if a scoreboard or score chyron is visible, include {home, home_score, away, away_score, clock} where home/away are 3-letter team codes; otherwise omit this field>
}

Rules:
- Return ONLY the JSON object, no preamble.
- If you cannot identify any player, return: {"player_name":"Unknown","number":0,"position":"Unknown","team":"Unknown","jersey_color":"white","blurb":"I couldn't quite ID this one — try another angle or a clearer crop on the jersey."}
- For jersey_color, pick the closest match to the visible jersey color from the allowed list.
- Voice for blurb: confident, knowing, gossipy-but-warm. Like a friend who follows the league.`,
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
      max_tokens: 400,
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
