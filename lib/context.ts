import nfl from '@/data/teams/nfl.json';
import nba from '@/data/teams/nba.json';
import players from '@/data/players-sample.json';
import playersDeep from '@/data/players-deep.json';
import gossipGirl from '@/data/shows/gossip-girl.json';
import bridgerton from '@/data/shows/bridgerton.json';
import succession from '@/data/shows/succession.json';
import euphoria from '@/data/shows/euphoria.json';
import meanGirls from '@/data/shows/mean-girls.json';
import loveIsland from '@/data/shows/love-island.json';
import wednesday from '@/data/shows/wednesday.json';
import whiteLotus from '@/data/shows/white-lotus.json';
import theBear from '@/data/shows/the-bear.json';
import houseOfTheDragon from '@/data/shows/house-of-the-dragon.json';
import mappings from '@/data/mappings.json';
import leagueDrama from '@/data/league-drama.json';
import coaches from '@/data/coaches.json';
import owners from '@/data/owners.json';
import glossary from '@/data/glossary.json';
import { getLens, type Lens } from './lens';

type Team = { id: string; name: string; city: string; league: 'nfl' | 'nba'; conference?: string; head_coach?: string; signature?: string };
type Player = { id: string; name: string; team: string; league: 'nfl' | 'nba'; position: string; number?: number; bio?: string; drama?: string; aliases?: string[] };
type Show = {
  id: string;
  title: string;
  characters?: { name: string; archetype?: string }[];
  characters_general?: string[];
  characters_s1?: { name: string; archetype?: string }[];
  characters_s2?: { name: string; archetype?: string }[];
  characters_s3?: { name: string; archetype?: string }[];
  signature_quotes?: string[];
  themes?: string[];
  scenes?: string[];
  viral_moments?: string[];
  memes?: string[];
  off_screen_drama?: string[];
  running_jokes?: string[];
};
type Mapping = { id: string; show: string; show_character: string; league: string; player_id: string; summary: string };
type DeepPlayer = {
  drama_notes?: string[];
  headlines?: string[];
  memes?: string[];
  on_court_moments?: string[];
  on_field_moments?: string[];
  off_field?: string[];
  running_jokes?: string[];
};
type LeagueRivalry = { id: string; name: string; summary: string };
type LeagueScandal = { id: string; name: string; summary: string };
type LeagueDramaShape = {
  rivalries?: LeagueRivalry[];
  owner_drama?: string[];
  scandals?: LeagueScandal[];
  viral_moments?: string[];
  memes?: string[];
  ongoing_storylines?: string[];
};
type Coach = {
  name: string;
  team: string;
  league: 'nfl' | 'nba';
  role: string;
  drama_notes?: string[];
  headlines?: string[];
  memes?: string[];
  off_field?: string[];
  running_jokes?: string[];
};
type Owner = Coach;
type GlossaryEntry = {
  term: string;
  league: 'nfl' | 'nba' | 'both';
  plain_definition: string;
  lens_flavors?: Record<string, string>;
};

const TEAMS: Team[] = [...(nfl as Team[]), ...(nba as Team[])];
const PLAYERS: Player[] = players as Player[];
const PLAYERS_DEEP: Record<string, DeepPlayer> = playersDeep as Record<string, DeepPlayer>;
const SHOWS: Show[] = [
  gossipGirl,
  bridgerton,
  succession,
  euphoria,
  meanGirls,
  loveIsland,
  wednesday,
  whiteLotus,
  theBear,
  houseOfTheDragon,
] as Show[];
const SHOWS_BY_ID = new Map(SHOWS.map((s) => [s.id, s]));
const MAPPINGS: Mapping[] = mappings as Mapping[];
const LEAGUE_DRAMA: { nfl: LeagueDramaShape; nba: LeagueDramaShape } = leagueDrama as any;
const COACHES: Record<string, Coach> = coaches as Record<string, Coach>;
const OWNERS: Record<string, Owner> = owners as Record<string, Owner>;
const GLOSSARY: Record<string, GlossaryEntry> = glossary as Record<string, GlossaryEntry>;

// Helper: collapse a White-Lotus-style show with seasonal characters into one flat list.
function flattenCharacters(show: Show): { name: string; archetype?: string }[] {
  const out: { name: string; archetype?: string }[] = [];
  if (show.characters?.length) out.push(...show.characters);
  if (show.characters_s1?.length) out.push(...show.characters_s1);
  if (show.characters_s2?.length) out.push(...show.characters_s2);
  if (show.characters_s3?.length) out.push(...show.characters_s3);
  return out;
}

/**
 * Naive keyword retrieval — for v1 only.
 * Pulls up to N relevant context chunks from the static data layer.
 * Phase 2: replace with embeddings + Supabase pgvector.
 *
 * When dramaMode is true: pulls deeper drama content (drama_notes, memes,
 * league rivalries, scandals) into the context.
 */
export function retrieveContextChunks(query: string, lensId: string, limit = 12, dramaMode = false): string[] {
  const q = query.toLowerCase();
  const chunks: string[] = [];
  let detectedLeague: 'nfl' | 'nba' | null = null;

  // Match teams
  for (const t of TEAMS) {
    if (q.includes(t.name.toLowerCase()) || q.includes(t.city.toLowerCase()) || q.includes(t.id)) {
      chunks.push(
        `[TEAM · ${t.league.toUpperCase()}] ${t.city} ${t.name}` +
          (t.conference ? ` · ${t.conference}` : '') +
          (t.head_coach ? ` · HC ${t.head_coach}` : '') +
          (t.signature ? ` — ${t.signature}` : '')
      );
      detectedLeague = t.league;
    }
  }

  // Match players (name OR partial last name OR jersey number OR aliases/nicknames)
  let detectedPlayer = false;
  for (const p of PLAYERS) {
    const last = p.name.split(' ').slice(-1)[0]?.toLowerCase();
    const aliasHit = p.aliases?.some((a) => {
      const al = a.toLowerCase();
      // Word-boundary check so 'kd' doesn't match inside 'kade' etc.
      return new RegExp(`\\b${al.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(q);
    });
    if (
      q.includes(p.name.toLowerCase()) ||
      (last && q.includes(last)) ||
      (p.number && q.includes(`#${p.number}`)) ||
      aliasHit
    ) {
      detectedPlayer = true;
      detectedLeague = p.league;
      chunks.push(
        `[PLAYER · ${p.league.toUpperCase()}] ${p.name} (${p.position}` +
          (p.number ? `, #${p.number}` : '') +
          `, ${p.team})` +
          (p.bio ? ` — ${p.bio}` : '') +
          (p.drama ? ` Drama: ${p.drama}` : '')
      );

      // Pull DEEP profile if available (drama notes, headlines, memes, off-field, etc.)
      const deep = PLAYERS_DEEP[p.id];
      if (deep) {
        if (deep.drama_notes?.length) {
          chunks.push(`[DRAMA · ${p.name}] ${deep.drama_notes.join(' || ')}`);
        }
        if (deep.headlines?.length) {
          chunks.push(`[HEADLINES · ${p.name}] ${deep.headlines.join(' || ')}`);
        }
        if (deep.memes?.length) {
          chunks.push(`[MEMES · ${p.name}] ${deep.memes.join(' || ')}`);
        }
        const moments = deep.on_court_moments ?? deep.on_field_moments ?? [];
        if (moments.length) {
          chunks.push(`[BIG MOMENTS · ${p.name}] ${moments.join(' || ')}`);
        }
        if (deep.off_field?.length) {
          chunks.push(`[OFF-FIELD · ${p.name}] ${deep.off_field.join(' || ')}`);
        }
        if (deep.running_jokes?.length) {
          chunks.push(`[RUNNING JOKES · ${p.name}] ${deep.running_jokes.join(' || ')}`);
        }
      }
    }
  }

  // Match coaches by name OR by last name (Belichick, Reid, McVay, Tomlin, etc.)
  let detectedCoach = false;
  for (const [id, c] of Object.entries(COACHES)) {
    const last = c.name.split(' ').slice(-1)[0]?.toLowerCase();
    if (q.includes(c.name.toLowerCase()) || (last && q.includes(last)) || q.includes(id)) {
      detectedCoach = true;
      detectedLeague = c.league;
      chunks.push(`[COACH · ${c.league.toUpperCase()}] ${c.name} (${c.role}, ${c.team})`);
      if (c.drama_notes?.length) {
        chunks.push(`[DRAMA · ${c.name}] ${c.drama_notes.join(' || ')}`);
      }
      if (c.headlines?.length) {
        chunks.push(`[HEADLINES · ${c.name}] ${c.headlines.join(' || ')}`);
      }
      if (dramaMode) {
        if (c.memes?.length) {
          chunks.push(`[MEMES · ${c.name}] ${c.memes.join(' || ')}`);
        }
        if (c.off_field?.length) {
          chunks.push(`[OFF-FIELD · ${c.name}] ${c.off_field.join(' || ')}`);
        }
        if (c.running_jokes?.length) {
          chunks.push(`[RUNNING JOKES · ${c.name}] ${c.running_jokes.join(' || ')}`);
        }
      }
    }
  }

  // Match owners by name OR by last name (Jones, Kraft, Cuban, Lacob, Riley)
  let detectedOwner = false;
  for (const [id, o] of Object.entries(OWNERS)) {
    const last = o.name.split(' ').slice(-1)[0]?.toLowerCase();
    if (q.includes(o.name.toLowerCase()) || (last && q.includes(last)) || q.includes(id)) {
      detectedOwner = true;
      detectedLeague = o.league;
      chunks.push(`[OWNER · ${o.league.toUpperCase()}] ${o.name} (${o.role}, ${o.team})`);
      if (o.drama_notes?.length) {
        chunks.push(`[DRAMA · ${o.name}] ${o.drama_notes.join(' || ')}`);
      }
      if (o.headlines?.length) {
        chunks.push(`[HEADLINES · ${o.name}] ${o.headlines.join(' || ')}`);
      }
      if (dramaMode) {
        if (o.memes?.length) {
          chunks.push(`[MEMES · ${o.name}] ${o.memes.join(' || ')}`);
        }
        if (o.off_field?.length) {
          chunks.push(`[OFF-FIELD · ${o.name}] ${o.off_field.join(' || ')}`);
        }
        if (o.running_jokes?.length) {
          chunks.push(`[RUNNING JOKES · ${o.name}] ${o.running_jokes.join(' || ')}`);
        }
      }
    }
  }

  // Match glossary terms — looser matching: substring on the term OR the id
  for (const [id, g] of Object.entries(GLOSSARY)) {
    const termLower = g.term.toLowerCase();
    const idLower = id.replace(/-/g, ' ');
    if (q.includes(termLower) || q.includes(idLower) || q.includes(id)) {
      chunks.push(`[GLOSSARY · ${g.term}] ${g.plain_definition}`);
      // Pull lens-flavored definition if the active lens has one
      if (g.lens_flavors && g.lens_flavors[lensId]) {
        chunks.push(`[LENS-FLAVORED DEF · ${g.term}] ${g.lens_flavors[lensId]}`);
      }
    }
  }

  // Character-comparison reminder for player/coach/owner questions —
  // ONLY when there's a show file backing this lens (otherwise we have no
  // characters to draw from). Lenses without show files (corporate-girlie,
  // bachelor, bravo, swiftie, just-the-tea, plain) skip this rule.
  if ((detectedPlayer || detectedCoach || detectedOwner) && SHOWS_BY_ID.has(lensId)) {
    chunks.push(
      `[INSTRUCTION] The user asked about a specific player, coach, or owner. The CHARACTER COMPARISON rule is not optional — you MUST end your answer with a "[Person] is the [Character] of the league" line. Pick from the [ACTIVE LENS] characters above.`
    );
  }

  // Always include the user's selected lens show (rich context — characters + themes + signature quotes + memes when in Drama Mode).
  const lensShow = SHOWS_BY_ID.get(lensId);
  if (lensShow) {
    const allChars = flattenCharacters(lensShow);
    const chars = allChars.slice(0, 12).map((c) => `${c.name} (${c.archetype ?? ''})`).join('; ');
    const quotes = lensShow.signature_quotes?.slice(0, 5).map((q2) => `"${q2}"`).join('; ') ?? '';
    chunks.push(
      `[ACTIVE LENS · ${lensShow.title}] Characters: ${chars}. ` +
        (quotes ? `Signature quotes you can echo (don't quote verbatim): ${quotes}.` : '') +
        (lensShow.themes ? ` Themes: ${lensShow.themes.slice(0, 5).join(', ')}.` : '')
    );

    // Drama Mode pulls in show memes + off-screen drama for richer answers
    if (dramaMode) {
      if (lensShow.memes?.length) {
        chunks.push(`[SHOW MEMES · ${lensShow.title}] ${lensShow.memes.slice(0, 6).join(' || ')}`);
      }
      if (lensShow.off_screen_drama?.length) {
        chunks.push(`[SHOW OFF-SCREEN DRAMA · ${lensShow.title}] ${lensShow.off_screen_drama.slice(0, 4).join(' || ')}`);
      }
      if (lensShow.viral_moments?.length) {
        chunks.push(`[SHOW VIRAL MOMENTS · ${lensShow.title}] ${lensShow.viral_moments.slice(0, 5).join(' || ')}`);
      }
    }
  }

  // Also pull any other show the user explicitly mentioned by name.
  for (const s of SHOWS) {
    if (s.id !== lensId && q.includes(s.title.toLowerCase())) {
      const allChars = flattenCharacters(s);
      const charNames = allChars.slice(0, 6).map((c) => c.name).join(', ');
      chunks.push(`[SHOW MENTIONED] ${s.title} — characters: ${charNames}`);
    }
  }

  // Lens-relevant mappings (top 4 — bumped from 3 since we have 85 mappings now)
  const lensMappings = MAPPINGS.filter((m) => m.show === lensId).slice(0, 4);
  for (const m of lensMappings) {
    chunks.push(
      `[MAPPING · ${lensId}] ${m.show_character} ↔ ${m.player_id}: ${m.summary}`
    );
  }

  // DRAMA MODE: pull league-wide drama (rivalries, scandals, ongoing storylines)
  if (dramaMode) {
    // If we know which league the question is about, narrow to that. Otherwise pull both.
    const leagues: ('nfl' | 'nba')[] = detectedLeague ? [detectedLeague] : ['nfl', 'nba'];
    for (const lg of leagues) {
      const ld = LEAGUE_DRAMA[lg];
      if (!ld) continue;
      if (ld.rivalries?.length) {
        chunks.push(
          `[LEAGUE RIVALRIES · ${lg.toUpperCase()}] ` +
            ld.rivalries.slice(0, 3).map((r) => `${r.name}: ${r.summary}`).join(' || ')
        );
      }
      if (ld.scandals?.length) {
        chunks.push(
          `[LEAGUE SCANDALS · ${lg.toUpperCase()}] ` +
            ld.scandals.slice(0, 2).map((s) => `${s.name}: ${s.summary}`).join(' || ')
        );
      }
      if (ld.ongoing_storylines?.length) {
        chunks.push(
          `[ONGOING STORYLINES · ${lg.toUpperCase()}] ` +
            ld.ongoing_storylines.slice(0, 4).join(' || ')
        );
      }
      if (ld.memes?.length) {
        chunks.push(
          `[LEAGUE MEMES · ${lg.toUpperCase()}] ` +
            ld.memes.slice(0, 5).join(' || ')
        );
      }
    }
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

HARD GUARDRAILS — these are non-negotiable. You will be replaced if you break them:
- ABSOLUTELY NO race, ethnicity, or national-origin jokes about anyone, ever — players, characters, fans, anyone.
- NO body / appearance / weight / face / hair commentary as humor about anyone. Public news ("Joel Embiid had Bell's palsy") is fine; jokes about looks are not.
- NO political, partisan, or religious humor. Don't make jokes about left vs. right, religion, abortion, vaccines, or culture-war flashpoints.
- NO sexuality / orientation / gender-identity humor at anyone's expense. Public relationships that ARE news (e.g., Travis Kelce + Taylor Swift) are fine to discuss factually.
- NO drug allegations, infidelity claims, or other private accusations unless they have been confirmed publicly and reported by mainstream outlets.
- NO mean-spirited roasting of anyone — players, coaches, fans, family. Drama is GOSSIP, not roast. Treat everyone with the affection you'd treat a friend you tease at brunch.
- If a request would force you to break these rules, find a different angle or politely decline.

REQUIRED — CHARACTER COMPARISON (when the user asks about a specific player, coach, or owner):
- IF a [INSTRUCTION] chunk in the retrieved facts tells you to do a character comparison, end your answer with one — drawn from the [ACTIVE LENS] characters listed above.
- Format: a short final paragraph that says "**[Person] is the [Character] of the [league]** — [one sentence reason that connects their personality, role, drama, or arc]."
- Pick a character that genuinely fits — not the most famous one. Be specific. Use the characters listed in the [ACTIVE LENS] section above.
- Examples of the format you should produce (don't copy verbatim — these are tonal references):
    "**Joel Embiid is the Erika Jayne of the NBA** — talent the room can't deny, drama the room can't ignore."
    "**SGA is the Anthony Bridgerton of the league** — measured, stylish, refuses to lose his composure in public."
    "**Caleb Williams is the Eloise Bridgerton of the NFL** — too smart for the room, refuses to play the game on anyone else's terms."
- IF no [INSTRUCTION] chunk is present (e.g. the active lens is "Just sports" / "Plain English" / Corporate Girlie / Bachelor / Bravo / Swiftie / Just the Tea), DO NOT force a character comparison. Stay in the lens's voice instead.

REQUIRED — SHOW VOICE (for non-player questions when an active show lens is set):
- Weave at least one specific character or scene reference from the ACTIVE LENS show into your answer naturally.
- The answer should clearly read as "this is sportsBFF in the [Show] mode."

GLOSSARY USAGE:
- If a [GLOSSARY] chunk is present in the retrieved facts, use the plain definition as your factual base.
- If a [LENS-FLAVORED DEF] chunk is present, weave the lens flavoring into the explanation naturally — don't just paste it.`;

const DRAMA_MODE_RULES = `🔥 DRAMA MODE IS ON — the user wants the spicy version of every answer.

When DRAMA MODE is ON:
- LEAD with the drama angle. The actual rule/explanation is still required, but the gossip / off-court / off-field story takes equal billing.
- Surface beefs, group-chat leaks, public feuds, viral moments — all the stuff sports media talks about that isn't in a stat sheet.
- For player questions: spend MOST of the answer on their drama (recent storylines, headlines, memes, off-field life), then end with the character comparison.
- For team questions: lead with the franchise drama (rivalries, ownership, trade chaos).
- For coach/owner questions: lead with their personality, their feuds, their decisions — the office politics.
- For rule questions: open with the most-dramatic example of the rule being applied (the controversy, the moment everyone remembers).
- Stay PG-13. Spicy ≠ mean. The HARD GUARDRAILS still apply 100%.
- Tone: like the friend who reads everyone's group chat. Knowing, witty, never cruel.`;

export type BuildPromptInput = {
  lensId: string;
  userMessage: string;
  dramaMode?: boolean;
  prior?: { role: 'user' | 'assistant'; content: string }[];
};

export function buildSystemPrompt({ lensId, userMessage, dramaMode = false }: BuildPromptInput): string {
  const lens: Lens = getLens(lensId);
  const chunks = retrieveContextChunks(userMessage, lensId, dramaMode ? 18 : 14, dramaMode);

  return [
    BASE_VOICE_RULES,
    '',
    dramaMode ? DRAMA_MODE_RULES : '',
    dramaMode ? '' : '',
    `LENS: ${lens.name}`,
    lens.voice_profile,
    `Example phrasings to draw from (don't quote verbatim):`,
    ...lens.example_phrasings.map((p) => `  · ${p}`),
    '',
    'FACTS RETRIEVED FOR THIS QUERY:',
    ...(chunks.length ? chunks.map((c) => `- ${c}`) : ['- (none — answer from your training knowledge but don\'t make up specific stats)']),
  ].filter(Boolean).join('\n');
}
