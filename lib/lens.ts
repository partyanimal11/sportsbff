import lenses from '@/data/lenses.json';

export type Lens = {
  id: string;
  name: string;
  league_bias?: 'nfl' | 'nba' | null;
  voice_profile: string;
  example_phrasings: string[];
  accent_color: string;
  card_color: string;
};

const LENSES: Lens[] = lenses as Lens[];
const LENS_BY_ID = new Map(LENSES.map((l) => [l.id, l]));

export const DEFAULT_LENS_ID = 'plain';

export function listLenses(): Lens[] {
  return LENSES;
}

export function getLens(id?: string | null): Lens {
  if (!id) return LENS_BY_ID.get(DEFAULT_LENS_ID)!;
  return LENS_BY_ID.get(id) ?? LENS_BY_ID.get(DEFAULT_LENS_ID)!;
}

export function isValidLens(id: string): boolean {
  return LENS_BY_ID.has(id);
}

/**
 * OpenAI TTS voices available: alloy, ash, ballad, coral, echo, fable, nova,
 * onyx, sage, shimmer, verse.
 *
 * Each lens maps to the voice that best fits its persona. The user can override
 * via profile.voiceOverride.
 */
export type OpenAIVoice =
  | 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo'
  | 'fable' | 'nova' | 'onyx' | 'sage' | 'shimmer' | 'verse';

export const ALL_VOICES: OpenAIVoice[] = [
  'alloy', 'ash', 'ballad', 'coral', 'echo',
  'fable', 'nova', 'onyx', 'sage', 'shimmer', 'verse',
];

const LENS_VOICE_MAP: Record<string, OpenAIVoice> = {
  // Voice-only lenses (no show)
  'plain':            'nova',     // clean, neutral, warm female narrator
  'corporate-girlie': 'sage',     // knowing, slight LinkedIn cadence
  'just-the-tea':     'ballad',   // cozy friend-on-the-couch
  'swiftie':          'nova',     // bright, warm
  'bachelor':         'ballad',   // earnest, reality-show host
  'bravo':            'coral',    // perky reunion-couch energy

  // Show lenses
  'gossip-girl':      'coral',    // bright, conspiratorial Kristen-Bell-coded
  'bridgerton':       'fable',    // British-leaning narrator
  'succession':       'onyx',     // deep, authoritative, Logan Roy
  'euphoria':         'shimmer',  // breathy, cinematic, slightly dreamy
  'mean-girls':       'coral',    // perky-but-edged
  'love-island':      'fable',    // British, mocking, Iain-Stirling-coded
  'wednesday':        'echo',     // deadpan, calm-cold
  'white-lotus':      'verse',    // arched-eyebrow narrator
  'the-bear':         'ash',      // intense, kitchen-energy
  'house-of-the-dragon': 'onyx',  // regal, deep, Targaryen
};

const DEFAULT_VOICE: OpenAIVoice = 'nova';

export function getVoiceForLens(lensId: string): OpenAIVoice {
  return LENS_VOICE_MAP[lensId] ?? DEFAULT_VOICE;
}

export function isValidVoice(voice: string): voice is OpenAIVoice {
  return (ALL_VOICES as string[]).includes(voice);
}

/**
 * Human-friendly description of each voice — used in settings UI.
 */
export const VOICE_DESCRIPTIONS: Record<OpenAIVoice, string> = {
  alloy:   'Neutral, balanced',
  ash:     'Soft, intense',
  ballad:  'Warm, earnest',
  coral:   'Bright, perky',
  echo:    'Calm, deadpan',
  fable:   'British, narrator',
  nova:    'Clear, warm female (default)',
  onyx:    'Deep, authoritative',
  sage:    'Wise, knowing',
  shimmer: 'Breathy, cinematic',
  verse:   'Storytelling, arched-eyebrow',
};
