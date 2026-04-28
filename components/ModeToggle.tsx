'use client';

/**
 * Tea'd Up 3-mode toggle (Drama / On-field / Learn).
 *
 * Multi-select pill row. Used in headers of Scan, Chat, Tea, and (in default-
 * preferences form) Profile. At least one mode must always be active — the
 * last-tapped active mode can't be turned off.
 */

import { useCallback } from 'react';

export type Mode = 'drama' | 'on_field' | 'learn';

const MODE_META: Record<Mode, { label: string; emoji: string; full: string }> = {
  drama:    { label: 'Drama',    emoji: '🔥', full: 'Drama' },
  on_field: { label: 'On-field', emoji: '🏀', full: 'On-field' },
  learn:    { label: 'Learn',    emoji: '📚', full: 'Learn' },
};

type Props = {
  active: Mode[];
  onChange: (next: Mode[]) => void;
  disabled?: boolean;
  /** Subset of modes shown — defaults to all 3. */
  available?: Mode[];
  /** When true, locked modes show a tiny lock icon and tap = onLockedTap. */
  lockedModes?: Mode[];
  onLockedTap?: (mode: Mode) => void;
  size?: 'sm' | 'md';
};

export function ModeToggle({
  active,
  onChange,
  disabled = false,
  available = ['drama', 'on_field', 'learn'],
  lockedModes = [],
  onLockedTap,
  size = 'sm',
}: Props) {
  const toggle = useCallback(
    (m: Mode) => {
      if (disabled) return;

      // Locked → bounce to onLockedTap (paywall)
      if (lockedModes.includes(m)) {
        onLockedTap?.(m);
        return;
      }

      const isActive = active.includes(m);
      // Don't allow turning off the LAST active mode (keep at least one on)
      if (isActive && active.length === 1) return;

      const next = isActive ? active.filter((x) => x !== m) : [...active, m];
      onChange(next);
    },
    [active, disabled, onChange, lockedModes, onLockedTap]
  );

  const sizing =
    size === 'md'
      ? { paddingX: 14, paddingY: 8, fontSize: 14, gap: 8 }
      : { paddingX: 11, paddingY: 6, fontSize: 12, gap: 6 };

  return (
    <div className="inline-flex items-center" style={{ gap: sizing.gap }}>
      {available.map((m) => {
        const isActive = active.includes(m);
        const isLocked = lockedModes.includes(m);
        const meta = MODE_META[m];

        return (
          <button
            key={m}
            type="button"
            onClick={() => toggle(m)}
            disabled={disabled}
            aria-label={`${isActive ? 'Disable' : 'Enable'} ${meta.full} mode`}
            aria-pressed={isActive}
            className={`group inline-flex items-center font-semibold rounded-full transition-all duration-200 ${
              isActive
                ? 'text-white shadow-sm'
                : 'text-ink-soft bg-white border border-[var(--hairline)] hover:border-tangerine hover:text-tangerine'
            }`}
            style={{
              padding: `${sizing.paddingY}px ${sizing.paddingX}px`,
              fontSize: sizing.fontSize,
              gap: 4,
              ...(isActive
                ? {
                    background: '#FF6B3D',
                    boxShadow: '0 4px 12px -4px rgba(255,107,61,0.4)',
                  }
                : {}),
              ...(isLocked ? { opacity: 0.6 } : {}),
            }}
          >
            <span aria-hidden>{meta.emoji}</span>
            <span>{meta.label}</span>
            {isLocked && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
