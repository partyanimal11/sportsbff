import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getPlayer,
  getTeam,
  getMappingsForPlayer,
  getRelatedPlayers,
  playerHref,
  type Player,
  type Mapping,
} from '@/lib/players';
import { listLenses, type Lens } from '@/lib/lens';

/**
 * Per-team color palette for the hero band — gives every player page
 * its own visual identity without needing a real photo. Phase 2: real
 * AI-generated illustrations replace the abstract jersey.
 */
const TEAM_COLORS: Record<string, { primary: string; secondary: string; ink: string }> = {
  // NFL — primary team colors
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
  // NBA — primary team colors
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

export default function PlayerPage({ params }: { params: { slug: string } }) {
  const player = getPlayer(params.slug);
  if (!player) notFound();

  const team = getTeam(player.team, player.league);
  const mappings = getMappingsForPlayer(player.id);
  const related = getRelatedPlayers(player, 4);
  const colors = TEAM_COLORS[`${player.league}:${player.team}`] ?? FALLBACK_COLORS;
  const lensList = listLenses().filter((l) => l.id !== 'plain');

  // Suggested chat prompts for this player
  const askPrompts = [
    `Tell me more about ${player.name}.`,
    `Why is ${player.name.split(' ')[0]} important right now?`,
    `What's ${player.name.split(' ')[0]}'s drama?`,
    `Who is ${player.name} like, in TV terms?`,
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Top nav */}
      <header className="px-6 md:px-8 py-3 border-b border-[var(--hairline)] flex items-center justify-between bg-white sticky top-0 z-20 backdrop-blur">
        <Link href="/" className="font-display text-xl font-extrabold text-green tracking-wide uppercase">
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        <nav className="flex gap-7 text-sm text-ink-soft">
          <Link href="/scan" className="hover:text-ink">Scan</Link>
          <Link href="/chat" className="hover:text-ink">Chat</Link>
          <Link href="/lessons" className="hover:text-ink">Lessons</Link>
        </nav>
      </header>

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
        <div className="relative max-w-5xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-[1fr_auto] gap-8 items-end">
          <div>
            <div className="text-[11px] font-bold tracking-[0.22em] uppercase mb-3" style={{ color: colors.ink, opacity: 0.78 }}>
              {team?.city} {team?.name} · {player.position}
              {player.number && ` · #${player.number}`}
            </div>
            <h1
              className="font-display font-bold leading-[0.92] tracking-tight"
              style={{
                color: colors.ink,
                fontSize: 'clamp(48px, 7vw, 88px)',
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

          {/* Big jersey number — placeholder for AI illustration in Phase 2 */}
          {player.number && (
            <div className="hidden md:flex shrink-0">
              <div
                className="font-display font-extrabold leading-none tracking-tight"
                style={{
                  color: colors.ink,
                  opacity: 0.18,
                  fontSize: '220px',
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
      <section className="max-w-5xl mx-auto px-6 py-14 md:py-20 grid md:grid-cols-[1.4fr_1fr] gap-12">
        {/* Left column — bio + drama + cross-references */}
        <div>
          {/* Bio */}
          {player.bio && (
            <div className="mb-10">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">
                Who they are
              </div>
              <p className="text-[18px] text-ink leading-relaxed">{player.bio}</p>
            </div>
          )}

          {/* Drama */}
          {player.drama && (
            <div className="mb-10 bg-cream-warm border-l-4 border-magenta rounded-r-2xl p-6">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-magenta mb-3">
                The drama
              </div>
              <p className="text-[16px] text-ink leading-relaxed font-display italic">
                {player.drama}
              </p>
            </div>
          )}

          {/* Cross-references — character mappings across all shows */}
          <div className="mb-10">
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-sapphire mb-3">
              Through the lens
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-green leading-tight tracking-tight">
              Who they are <span className="italic font-medium text-sapphire">in your shows.</span>
            </h2>
            <p className="mt-2 text-[15px] text-ink-soft">
              Pick a lens — same player, every show's version of them.
            </p>

            {mappings.length > 0 ? (
              <div className="mt-5 space-y-3">
                {mappings.map((m) => (
                  <CharacterMappingCard key={m.id} mapping={m} lensList={lensList} />
                ))}
              </div>
            ) : (
              <div className="mt-5 bg-cream-warm border border-[var(--hairline)] rounded-2xl p-6">
                <p className="text-[14px] text-ink-soft leading-relaxed">
                  We haven't mapped <strong className="text-ink">{player.name}</strong> to a TV character yet.
                  Ask the chat — it'll find one in your active lens.
                </p>
                <Link
                  href={`/chat?seed=${encodeURIComponent(`Who is ${player.name} like, in TV terms?`)}`}
                  className="btn btn-primary mt-4 inline-flex"
                >
                  Ask the chat →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right column — actions + related */}
        <aside className="md:sticky md:top-24 self-start">
          {/* Suggested questions */}
          <div className="bg-white border border-[var(--hairline)] rounded-2xl p-5 shadow-soft mb-6">
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-tangerine mb-3">
              Ask the chat
            </div>
            <div className="flex flex-col gap-2">
              {askPrompts.map((q) => (
                <Link
                  key={q}
                  href={`/chat?seed=${encodeURIComponent(q)}`}
                  className="text-left text-[14px] text-ink-soft bg-cream-warm border border-[var(--hairline)] rounded-xl px-3 py-2 hover:bg-green hover:text-white hover:border-green transition"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>

          {/* Team callout */}
          {team && (
            <div className="bg-white border border-[var(--hairline)] rounded-2xl p-5 shadow-soft mb-6">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-green mb-3">
                Their team
              </div>
              <div className="font-display font-bold text-xl text-green">
                {team.city} {team.name}
              </div>
              {team.head_coach && (
                <div className="text-[13px] text-ink-soft mt-1">HC {team.head_coach}</div>
              )}
              {team.signature && (
                <div className="text-[13px] text-ink leading-relaxed mt-3 font-display italic">
                  {team.signature}
                </div>
              )}
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div className="bg-white border border-[var(--hairline)] rounded-2xl p-5 shadow-soft">
              <div className="text-[11px] font-bold tracking-[0.18em] uppercase text-burgundy mb-3">
                Related players
              </div>
              <div className="flex flex-col gap-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={playerHref(r)}
                    className="group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-cream-warm transition"
                  >
                    <div
                      className="shrink-0 w-9 h-9 rounded-full text-white font-display font-extrabold text-[12px] flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${TEAM_COLORS[`${r.league}:${r.team}`]?.primary ?? '#0D2D24'} 0%, ${TEAM_COLORS[`${r.league}:${r.team}`]?.secondary ?? '#FF6B3D'} 100%)`,
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
                ))}
              </div>
            </div>
          )}
        </aside>
      </section>

      {/* Footer */}
      <footer className="bg-green-dark text-white px-6 py-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="font-display text-sm font-extrabold uppercase tracking-wide">
            SPORTS<span className="text-tangerine">★</span>BFF
          </div>
          <Link href="/chat" className="text-[13px] text-lemon hover:text-white">
            Open the chat →
          </Link>
        </div>
      </footer>
    </main>
  );
}

/* =============================================================
   CharacterMappingCard — one row per show mapping
   ============================================================= */

function CharacterMappingCard({ mapping, lensList }: { mapping: Mapping; lensList: Lens[] }) {
  const lens = lensList.find((l) => l.id === mapping.show);
  if (!lens) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden border bg-white"
      style={{
        borderColor: 'rgba(13,45,36,0.10)',
      }}
    >
      <div className="grid grid-cols-[80px_1fr] gap-0">
        {/* Show poster swatch */}
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
        {/* Mapping text */}
        <div className="p-4">
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase mb-1" style={{ color: lens.accent_color }}>
            {lens.name}
          </div>
          <div className="font-display font-bold text-[18px] text-green leading-tight">
            The {mapping.show_character} of the {mapping.league.toUpperCase()}
          </div>
          <p className="text-[14px] text-ink-soft leading-relaxed mt-2">
            {mapping.summary}
          </p>
        </div>
      </div>
    </div>
  );
}
