'use client';

/**
 * Tea'd Up master toggle.
 *
 * Single on/off switch that controls whether sportsBFF responses include the
 * gossip/drama layer. The brand-within-the-brand: sportsBFF is the app, Tea'd
 * Up is the spicy mode.
 *
 * - ON  = magenta→tangerine gradient, white text, soft glow. Every scan + chat
 *         response gets drama claims with confirmation tier pills.
 * - OFF = white pill, ink-soft text, hairline border. Clean sports info only.
 */

type Props = {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  /** Optional small description shown beside the toggle. */
  showLabel?: boolean;
};

export function TeaUpToggle({ enabled, onToggle, disabled = false, size = 'sm', showLabel = false }: Props) {
  const sizing =
    size === 'md'
      ? { paddingX: 14, paddingY: 8, fontSize: 13, gap: 8 }
      : { paddingX: 11, paddingY: 6.5, fontSize: 12, gap: 6 };

  return (
    <div className="inline-flex items-center gap-2.5">
      {showLabel && (
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft hidden sm:inline">
          Tea'd Up
        </span>
      )}
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={enabled ? "Turn Tea'd Up off — clean sports only" : "Turn Tea'd Up on — get the gossip"}
        aria-pressed={enabled}
        title={enabled ? "Tea'd Up is ON — every reply has the tea" : "Tea'd Up is OFF — clean sports info only"}
        className="group inline-flex items-center font-semibold rounded-full transition-all duration-300"
        style={{
          padding: `${sizing.paddingY}px ${sizing.paddingX}px`,
          fontSize: sizing.fontSize,
          gap: 6,
          ...(enabled
            ? {
                background: 'linear-gradient(135deg, #E84B7A 0%, #FF6B3D 100%)',
                color: '#FFFFFF',
                boxShadow: '0 6px 16px -6px rgba(232,75,122,0.5)',
              }
            : {
                background: '#FFFFFF',
                color: '#3A3A3D',
                border: '1px solid rgba(13,45,36,0.08)',
              }),
          ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        }}
      >
        <span className={enabled ? 'animate-pulse' : ''} aria-hidden style={{ fontSize: sizing.fontSize + 1 }}>
          ☕
        </span>
        <span>Tea'd Up</span>
        <span
          className={`text-[9px] font-bold tracking-widest uppercase ${
            enabled ? 'opacity-95' : 'opacity-55'
          }`}
        >
          {enabled ? 'ON' : 'OFF'}
        </span>
      </button>
    </div>
  );
}
