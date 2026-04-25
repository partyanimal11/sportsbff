import nfl from '@/data/teams/nfl.json';
import nba from '@/data/teams/nba.json';
import players from '@/data/players-sample.json';
import gossipGirl from '@/data/shows/gossip-girl.json';
import bridgerton from '@/data/shows/bridgerton.json';
import succession from '@/data/shows/succession.json';
import euphoria from '@/data/shows/euphoria.json';
import meanGirls from '@/data/shows/mean-girls.json';
import loveIsland from '@/data/shows/love-island.json';
import mappings from '@/data/mappings.json';
import { getLens, type Lens } from './lens';

type Team = { id: string; name: string; city: string; league: 'nfl' | 'nba'; conference?: string; head_coach?: string; signature?: string };
type Player = { id: string; name: string; team: string; league: 'nfl' | 'nba'; position: string; number?: number; bio?: string; drama?: string };
type Show = { id: string; title: string; characters?: { name: string; archetype?: string }[]; signature_quotes?: string[]; themes?: string[]; scenes?: string[] };
type Mapping = { id: string; show: string; show_character: string; league: string; player_id: string; summary: string };

const TEAMS: Team[] = [...(nfl as Team[]), ...(nba as Team[])];
const PLAYERS: Player[] = players as Player[];
const SHOWS: Show[] = [gossipGirl, bridgerton, succession, euphoria, meanGirls, loveIsland] as Show[];
const SHOWS_BY_ID = new Map(SHOWS.map((s) => [s.id, s]));
const MAPPINGS: Mapping[] = mappings as Mapping[];

/**
 * Naive keyword retrieval — for v1 only.
 * Pulls up to N relevant context chunks from the static data layer.
 * Phase 2: replace with embeddings + Supabase pgvector.
 */
export function retrieveContextChunks(query: string, lensId: string, limit = 8): string[] {
  const q = query.toLowerCase();
  const chunks: string[] = [];

  // Match teams
  for (const t of TEAMS) {
    if (q.includes(t.name.toLowerCase()) || q.includes(t.city.toLowerCase()) || q.includes(t.id)) {
      chunks.push(
        `[TEAM · ${t.league.toUpperCase()}] ${t.city} ${t.name}` +
          (t.conference ? ` · ${t.conference}` : '') +
          (t.head_coach ? ` · HC ${t.head_coach}` : '') +
          (t.signature ? ` — ${t.signature}` : '')
      );
    }
  }

  // Match players (name OR partial last name OR jersey number)
  let detectedPlayer = false;
  for (const p of PLAYERS) {
    const last = p.name.split(' ').slice(-1)[0]?.toLowerCase();
    if (
      q.includes(p.name.toLowerCase()) ||
      (last && q.includes(last)) ||
      (p.number && q.includes(`#${p.number}`))
    ) {
      detectedPlayer = true;
      chunks.push(
        `[PLAYER · ${p.league.toUpperCase()}] ${p.name} (${p.position}` +
          (p.number ? `, #${p.number}` : '') +
          `, ${p.team})` +
          (p.bio ? ` — ${p.bio}` : '') +
          (p.drama ? ` Drama: ${p.drama}` : '')
      );
    }
  }

  // If a player was detected AND the user has an active show lens, push a hard reminder
  // so the AI does NOT skip the character-comparison rule.
  if (detectedPlayer && lensId !== 'plain') {
    chunks.push(
      `[INSTRUCTION] The user asked about a specific player. The CHARACTER COMPARISON rule is not optional — you MUST end your answer with a "[Player] is the [Character] of the league" line. Pick from the [ACTIVE LENS] characters above.`
    );
  }

  // Always include the user's selected lens show (rich context — characters + themes + signature quotes).
  const lensShow = SHOWS_BY_ID.get(lensId);
  if (lensShow) {
    const chars = lensShow.characters?.slice(0, 8).map((c) => `${c.name} (${c.archetype ?? ''})`).join('; ') ?? '';
    const quotes = lensShow.signature_quotes?.slice(0, 4).map((q2) => `"${q2}"`).join('; ') ?? '';
    chunks.push(
      `[ACTIVE LENS · ${lensShow.title}] Characters: ${chars}. ` +
        (quotes ? `Signature quotes you can echo (don't quote verbatim): ${quotes}.` : '') +
        (lensShow.themes ? ` Themes: ${lensShow.themes.slice(0, 5).join(', ')}.` : '')
    );
  }

  // Also pull any other show the user explicitly mentioned by name.
  for (const s of SHOWS) {
    if (s.id !== lensId && q.includes(s.title.toLowerCase())) {
      const chars = s.characters?.slice(0, 6).map((c) => c.name).join(', ') ?? '';
      chunks.push(`[SHOW MENTIONED] ${s.title} — characters: ${chars}`);
    }
  }

  // Always include lens-relevant mappings (top 3)
  const lensMappings = MAPPINGS.filter((m) => m.show === lensId).slice(0, 3);
  for (const m of lensMappings) {
    chunks.push(
      `[MAPPING · ${lensId}] ${m.show_character} ↔ ${m.player_id}: ${m.summary}`
    );
  }

  // De-dupe and cap
  return Array.from(new Set(chunks)).slice(0, limit);
}

const BASE_VOICE_RULES = `You are sportsBFF, an AI sports BFF for Gen Z.

VOICE RULES (always):
- Confident, calm, never condescending. The reader is smart and curious.
- Plain English. No jargon without inline explanation.
- Lead with the actual sports answer first. The cultural reference comes after, not before.
- Witty when it's natural. No exclamation points. No "OMG."
- Never gatekeep. Never assume the user knows anything.
- Keep answers short. 100-200 words is the sweet spot. Use line breaks. Bold the key term once.
- If you don't know something, say so. Suggest a related thing the user could ask instead.
- Never invent stats. If you don't have a stat, say "I don't have the live number — let me know if you want me to look it up later."

REQUIRED — CHARACTER COMPARISON (when the user asks about a specific player or coach):
- ALWAYS end your answer with a character comparison drawn from the ACTIVE LENS show.
- Format: a short final paragraph that says "**[Player] is the [Character] of the [league]** — [one sentence reason that connects their personality, role, drama, or arc]."
- Pick a character that genuinely fits — not the most famous one. Be specific. Use the characters listed in the [ACTIVE LENS] section above.
- Examples of the format you should produce (don't copy verbatim — these are tonal references):
    "**Joel Embiid is the Erika Jayne of the NBA** — talent the room can't deny, drama the room can't ignore."
    "**SGA is the Anthony Bridgerton of the league** — measured, stylish, refuses to lose his composure in public."
    "**Caleb Williams is the Eloise Bridgerton of the NFL** — too smart for the room, refuses to play the game on anyone else's terms."
- Skip this rule entirely if the active lens is "Just sports" / "Plain English" — that user wants no show talk.

REQUIRED — SHOW VOICE (for non-player questions when an active show lens is set):
- Weave at least one specific character or scene reference from the ACTIVE LENS show into your answer naturally.
- The answer should clearly read as "this is sportsBFF in the [Show] mode."`;

export type BuildPromptInput = {
  lensId: string;
  userMessage: string;
  prior?: { role: 'user' | 'assistant'; content: string }[];
};

export function buildSystemPrompt({ lensId, userMessage }: BuildPromptInput): string {
  const lens: Lens = getLens(lensId);
  const chunks = retrieveContextChunks(userMessage, lensId, 8);

  return [
    BASE_VOICE_RULES,
    '',
    `LENS: ${lens.name}`,
    lens.voice_profile,
    `Example phrasings to draw from (don't quote verbatim):`,
    ...lens.example_phrasings.map((p) => `  · ${p}`),
    '',
    'FACTS RETRIEVED FOR THIS QUERY:',
    ...(chunks.length ? chunks.map((c) => `- ${c}`) : ['- (none — answer from your training knowledge but don\'t make up specific stats)']),
  ].join('\n');
}
