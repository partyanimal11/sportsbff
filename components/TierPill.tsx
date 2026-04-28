'use client';

/**
 * Confirmation tier pill — the legal moat.
 *
 * Renders inline before a drama claim with one of 4 tier labels.
 * Used in scan results, chat responses (parsed from [TIER] markdown), and
 * Tea cards.
 */

export type Tier = 'confirmed' | 'reported' | 'speculation' | 'rumor';

const TIER_STYLES: Record<Tier, { bg: string; text: string; label: string }> = {
  confirmed:    { bg: '#E8F0EC', text: '#0F6E56', label: 'Confirmed' },
  reported:     { bg: '#E6F1FB', text: '#185FA5', label: 'Reported' },
  speculation:  { bg: '#FAEEDA', text: '#854F0B', label: 'Speculation' },
  rumor:        { bg: '#F1EFE8', text: '#5F5E5A', label: 'Rumor' },
};

export function TierPill({ tier, size = 'sm' }: { tier: Tier; size?: 'sm' | 'md' }) {
  const s = TIER_STYLES[tier];
  const sizing =
    size === 'md'
      ? { fontSize: 11, padding: '3px 10px' }
      : { fontSize: 10, padding: '2px 8px' };

  return (
    <span
      className="inline-flex items-center font-semibold uppercase tracking-wider rounded-full"
      style={{
        backgroundColor: s.bg,
        color: s.text,
        fontSize: sizing.fontSize,
        padding: sizing.padding,
        letterSpacing: '0.06em',
      }}
    >
      {s.label}
    </span>
  );
}

/**
 * Parse a chat/scan text body for inline `[TIER]` tokens and replace them with
 * <TierPill /> components. Returns a flat ReactNode array.
 */
export function parseTierPills(text: string): React.ReactNode[] {
  const TIER_RE = /\[(CONFIRMED|REPORTED|SPECULATION|RUMOR)\]\s*/gi;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = TIER_RE.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    const tier = match[1].toLowerCase() as Tier;
    parts.push(
      <span key={`tier-${match.index}`} style={{ marginRight: 6, verticalAlign: 'baseline' }}>
        <TierPill tier={tier} />
      </span>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts;
}
