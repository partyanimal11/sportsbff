'use client';

import Link from 'next/link';
import {
  getPlayer,
  getTeam,
  getMappingsForPlayer,
  getRelatedPlayers,
  type Mapping,
} from '@/lib/players';
import { listLenses, type Lens } from '@/lib/lens';
import { usePlayerOverlay } from '@/lib/player-overlay-context';

/**
 * Shared player profile UI — used by both /player/[slug] page (full route)
 * AND the chat overlay (modal). Decides between navigation vs. overlay open
 * based on whether PlayerOverlayContext is present.
 */

const TEAM_COLORS: Record<string, { primary: string; secondary: string; ink: string }> = {
  // NFL
  'nfl:kc':  { primary: '#E31837', secondary: '#FFB81C', ink: '#FFFFFF' },
  'nfl:buf': { primary: '#00338D', secondary: '#C60C30', ink: '#FFFFFF' },
  'nfl:phi': { primary: '#004C54', secondary: '#A5ACAF', ink: '#FFFFFF' },
  'nfl:cin': { primary: '#FB4F14', secondary: '#000000', ink: '#FFFFFF' },
  'nfl:bal': { primary: '#241773', secondary: '#9E7C0C', ink: '#FFFFFF' },
  'nfl:mia': { primary: '#008E97', secondary: '#FC4C02', ink: '#FFFFFF' },
  'nfl:min': { primary: '#4F2683', secondary: '#FFC62F', ink: '#FFFFFF' },
  'nfl:dal': { primary: '#003594', secondary: '#869397', ink: '#FFFFFF' },
  'nfl:sf':  { primary: '#AA0000', secondary: '#B3995D', ink: '#FFFFFF' },
  'nfl:det': { primary: '#0076B6', secondary: '#B0B7BC', ink: '#FFFFFF' },
  'nfl:gb':  { primary: '#203731', secondary: '#FFB612', ink: '#FFFFFF' },
  'nfl:lar': { primary: '#003594', secondary: '#FFD100', ink: '#FFFFFF' },
  'nfl:lac': { primary: '#0080C6', secondary: '#FFC20E', ink: '#FFFFFF' },
  'nfl:atl': { primary: '#A71930', secondary: '#000000', ink: '#FFFFFF' },
  'nfl:car': { primary: '#0085CA', secondary: '#101820', ink: '#FFFFFF' },
  'nfl:chi': { primary: '#0B162A', secondary: '#C83803', ink: '#FFFFFF' },
  'nfl:cle': { primary: '#311D00', secondary: '#FF3C00', ink: '#FFFFFF' },
  'nfl:den': { primary: '#FB4F14', secondary: '#002244', ink: '#FFFFFF' },
  'nfl:hou': { primary: '#03202F', secondary: '#A71930', ink: '#FFFFFF' },
  'nfl:ind': { primary: '#002C5F', secondary: '#A2AAAD', ink: '#FFFFFF' },
  'nfl:jax': { primary: '#101820', secondary: '#9F792C', ink: '#FFFFFF' },
  'nfl:lv':  { primary: '#000000', secondary: '#A5ACAF', ink: '#FFFFFF' },
  'nfl:ne':  { primary: '#002244', secondary: '#C60C30', ink: '#FFFFFF' },
  'nfl:no':  { primary: '#101820', secondary: '#D3BC8D', ink: '#FFFFFF' },
  'nfl:nyg': { primary: '#0B2265', secondary: '#A71930', ink: '#FFFFFF' },
  'nfl:nyj': { primary: '#125740', secondary: '#FFFFFF', ink: '#FFFFFF' },
  'nfl:pit': { primary: '#FFB612', secondary: '#101820', ink: '#000000' },
  'nfl:sea': { primary: '#002244', secondary: '#69BE28', ink: '#FFFFFF' },
  'nfl:tb':  { primary: '#D50A0A', secondary: '#34302B', ink: '#FFFFFF' },
  'nfl:ten': { primary: '#0C2340', secondary: '#4B92DB', ink: '#FFFFFF' },
  'nfl:was': { primary: '#5A1414', secondary: '#FFB612', ink: '#FFFFFF' },
  'nfl:ari': { primary: '#97233F', secondary: '#000000', ink: '#FFFFFF' },
  // NBA
  'nba:bos': { primary: '#007A33', secondary: '#BA9653', ink: '#FFFFFF' },
  'nba:lal': { primary: '#552583', secondary: '#FDB927', ink: '#FFFFFF' },
  'nba:gsw': { primary: '#1D428A', secondary: '#FFC72C', ink: '#FFFFFF' },
  'nba:mia': { primary: '#98002E', secondary: '#F9A01B', ink: '#FFFFFF' },
  'nba:nyk': { primary: '#006BB6', secondary: '#F58426', ink: '#FFFFFF' },
  'nba:bkn': { primary: '#000000', secondary: '#FFFFFF', ink: '#FFFFFF' },
  'nba:phi': { primary: '#006BB6', secondary: '#ED174C', ink: '#FFFFFF' },
  'nba:tor': { primary: '#CE1141', secondary: '#000000', ink: '#FFFFFF' },
  'nba:chi': { primary: '#CE1141', secondary: '#000000', ink: '#FFFFFF' },
  'nba:mil': { primary: '#00471B', secondary: '#EEE1C6', ink: '#FFFFFF' },
  'nba:cle': { primary: '#860038', secondary: '#FDBB30', ink: '#FFFFFF' },
  'nba:det': { primary: '#C8102E', secondary: '#1D42BA', ink: '#FFFFFF' },
  'nba:ind': { primary: '#002D62', secondary: '#FDBB30', ink: '#FFFFFF' },
  'nba:atl': { primary: '#E03A3E', secondary: '#C1D32F', ink: '#FFFFFF' },
  'nba:cha': { primary: '#1D1160', secondary: '#00788C', ink: '#FFFFFF' },
  'nba:was': { primary: '#002B5C', secondary: '#E31837', ink: '#FFFFFF' },
  'nba:orl': { primary: '#0077C0', secondary: '#C4CED4', ink: '#FFFFFF' },
  'nba:dal': { primary: '#00538C', secondary: '#002B5E', ink: '#FFFFFF' },
  'nba:hou': { primary: '#CE1141', secondary: '#000000', ink: '#FFFFFF' },
  'nba:mem': { primary: '#5D76A9', secondary: '#12173F', ink: '#FFFFFF' },
  'nba:nop': { primary: '#0C2340', secondary: '#C8102E', ink: '#FFFFFF' },
  'nba:sas': { primary: '#C4CED4', secondary: '#000000', ink: '#000000' },
  'nba:den': { primary: '#0E2240', secondary: '#FEC524', ink: '#FFFFFF' },
  'nba:min': { primary: '#0C2340', secondary: '#236192', ink: '#FFFFFF' },
  'nba:okc': { primary: '#007AC1', secondary: '#EF3B24', ink: '#FFFFFF' },
  'nba:por': { primary: '#E03A3E', secondary: '#000000', ink: '#FFFFFF' },
  'nba:uta': { primary: '#002B5C', secondary: '#00471B', ink: '#FFFFFF' },
  'nba:phx': { primary: '#1D1160', secondary: '#E56020', ink: '#FFFFFF' },
  'nba:lac': { primary: '#C8102E', secondary: '#1D428A', ink: '#FFFFFF' },
  'nba:sac': { primary: '#5A2D81', secondary: '#63727A', ink: '#FFFFFF' },
};

const FALLBACK_COLORS = { primary: '#0D2D24', secondary: '#FF6B3D', ink: '#FFFFFF' };

export function PlayerProfile({ slug }: { slug: string }) {
  const player = getPlayer(slug);
  const openOverlay = usePlayerOverlay();

  if (!player) {
    return (
      <div className="px-6 py-12 text-center">
        <h1 className="font-display text-3xl font-bold text-green">Player not found</h1>
        <p className="mt-2 text-ink-soft">We don't have a profile for "{slug}" yet.</p>
      </div>
    );
  }

  const team = getTeam(player.team, player.league);
  const mappings = getMappingsForPlayer(player.id);
  const related = getRelatedPlayers(player, 4);
  const colors = TEAM_COLORS[`${player.league}:${player.team}`] ?? FALLBACK_COLORS;
  const lensList = listLenses().filter((l) => l.id !== 'plain');

  const askPrompts = [
    `Tell me more about ${player.name}.`,
    `Why is ${player.name.split(' ')[0]} important right now?`,
    `What's ${player.name.split(' ')[0]}'s drama?`,
    `Who is ${player.name} like, in TV terms?`,
  ];

  return (
    <article className="bg-white">
      {/* Hero band — team-colored */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary} 50%, ${colors.secondary} 200%)`,
        }}
      >
        <div className="absolute inset-0 opacity-15"
          style={{
            background: 'repeating-linear-gradient(90deg, transparent 0 60px, rgba(255,255,255,0.4) 60px 61px)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-6 py-12 md:py-16 grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <div>
            <div className="text-[11px] font-bold tracking-[0.22em] uppercase mb-3" style={{ color: colors.ink, opacity: 0.78 }}>
              {team?.city} {team?.name} · {player.position}
              {player.number && ` · #${player.number}`}
            </div>
            <h1
              className="font-display font-bold leading-[0.92] tracking-tight"
              style={{
                color: colors.ink,
                fontSize: 'clamp(40px, 5.5vw, 72px)',
              }}
            >
              {player.name}
            </h1>
            {player.hometown && (
              <div className="mt-4 text-[14px]" style={{ color: colors.ink, opacity: 0.78 }}>
                <span className="font-display italic">From</span> {player.hometown}
                {player.age && ` · ${player.age} years old`}
              </div>
            )}
          </div>

          {player.number && (
            <div className="hidden md:flex shrink-0">
              <div
                className="font-display font-extrabold leading-none tracking-tight"
                style={{
                  color: colors.ink,
                  opacity: 0.18,
                  fontSize: '180px',
                  textShadow: '0 6px 20px rgba(0,0,0,0.25)',
                }}
              >
                {player.number}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="max-w-5xl mx-auto px-6 py-10 md:py-14 grid md:grid-cols-[1.4fr_1fr] gap-8 md:gap-12">
        {/* Left column */}
        <div>
          {player.bio && (
            <div className="mb-8">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">
                Who they are
              </div>
              <p className="text-[17px] text-ink leading-relaxed">{player.bio}</p>
            </div>
          )}

          {player.drama && (
            <div className="mb-8 bg-cream-warm border-l-4 border-magenta rounded-r-2xl p-5">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-magenta mb-2">
                The drama
              </div>
              <p className="text-[15px] text-ink leading-relaxed font-display italic">
                {player.drama}
              </p>
            </div>
          )}

          <div className="mb-8">
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-sapphire mb-3">
              Through the lens
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-green leading-tight tracking-tight">
              Who they are <span className="italic font-medium text-sapphire">in your shows.</span>
            </h2>

            {mappings.length > 0 ? (
              <div className="mt-4 space-y-3">
                {mappings.map((m) => (
                  <CharacterMappingCard key={m.id} mapping={m} lensList={lensList} />
                ))}
              </div>
            ) : (
              <div className="mt-4 bg-cream-warm border border-[var(--hairline)] rounded-2xl p-5">
                <p className="text-[14px] text-ink-soft leading-relaxed">
                  We haven't mapped <strong className="text-ink">{player.name}</strong> to a TV character yet.
                  Ask the chat — it'll find one in your active lens.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <aside className="self-start space-y-5">
          <div className="bg-white border border-[var(--hairline)] rounded-2xl p-5 shadow-soft">
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">
              Ask the chat
            </div>
            <div className="flex flex-col gap-2">
              {askPrompts.map((q) => (
                <Link
                  key={q}
                  href={`/chat?seed=${encodeURIComponent(q)}`}
                  className="text-left text-[13.5px] text-ink-soft bg-cream-warm border border-[var(--hairline)] rounded-xl px-3 py-2 hover:bg-green hover:text-white hover:border-green transition"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>

          {team && (
            <div className="bg-white border border-[var(--hairline)] rounded-2xl p-5 shadow-soft">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-green mb-2">
                Their team
              </div>
              <div className="font-display font-bold text-lg text-green">
                {team.city} {team.name}
              </div>
              {team.head_coach && (
                <div className="text-[12.5px] text-ink-soft mt-1">HC {team.head_coach}</div>
              )}
              {team.signature && (
                <div className="text-[13px] text-ink leading-relaxed mt-3 font-display italic">
                  {team.signature}
                </div>
              )}
            </div>
          )}

          {related.length > 0 && (
            <div className="bg-white border border-[var(--hairline)] rounded-2xl p-5 shadow-soft">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-burgundy mb-3">
                Related players
              </div>
              <div className="flex flex-col gap-1">
                {related.map((r) => {
                  const cTeam = TEAM_COLORS[`${r.league}:${r.team}`] ?? FALLBACK_COLORS;
                  const handleClick = (e: React.MouseEvent) => {
                    if (openOverlay) {
                      e.preventDefault();
                      openOverlay(r.id);
                    }
                  };
                  return (
                    <Link
                      key={r.id}
                      href={`/player/${r.id}`}
                      onClick={handleClick}
                      className="group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-cream-warm transition"
                    >
                      <div
                        className="shrink-0 w-9 h-9 rounded-full text-white font-display font-extrabold text-[12px] flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${cTeam.primary} 0%, ${cTeam.secondary} 100%)`,
                        }}
                      >
                        {r.number ?? '·'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-display font-bold text-[14px] text-green truncate group-hover:text-tangerine transition">
                          {r.name}
                        </div>
                        <div className="text-[11px] text-muted">
                          {r.position} · {r.team.toUpperCase()}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </aside>
      </section>
    </article>
  );
}

function CharacterMappingCard({ mapping, lensList }: { mapping: Mapping; lensList: Lens[] }) {
  const lens = lensList.find((l) => l.id === mapping.show);
  if (!lens) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden border bg-white"
      style={{ borderColor: 'rgba(13,45,36,0.10)' }}
    >
      <div className="grid grid-cols-[72px_1fr] gap-0">
        <div
          className="flex items-center justify-center font-display font-bold text-3xl"
          style={{
            background: `linear-gradient(135deg, ${lens.card_color} 0%, ${lens.accent_color} 220%)`,
            color: lens.accent_color,
          }}
        >
          {lens.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div className="p-4">
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: lens.accent_color }}>
            {lens.name}
          </div>
          <div className="font-display font-bold text-[16px] text-green leading-tight">
            The {mapping.show_character} of the {mapping.league.toUpperCase()}
          </div>
          <p className="text-[13.5px] text-ink-soft leading-relaxed mt-1.5">
            {mapping.summary}
          </p>
        </div>
      </div>
    </div>
  );
}
