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
