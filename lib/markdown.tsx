'use client';

import React from 'react';
import Link from 'next/link';
import { listAllPlayers } from './players';
import { usePlayerOverlay } from './player-overlay-context';

/**
 * Tiny markdown renderer for chat messages.
 * Handles: **bold**, *italic*, line breaks, bullet lists, inline code.
 * Bonus: detects known player names and links them to /player/[slug].
 */

// Pre-compute the player name lookup table (longest names first so multi-word
// names like "Patrick Mahomes" win over "Mahomes" alone).
const PLAYER_INDEX = listAllPlayers()
  .map((p) => ({
    id: p.id,
    name: p.name,
    re: new RegExp(`\\b(${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'g'),
    last: p.name.split(' ').slice(-1)[0],
  }))
  .sort((a, b) => b.name.length - a.name.length);

/**
 * Public API: a React component that renders markdown.
 * Has to be a component (not a plain function) so we can read overlay context.
 */
export function Markdown({ text }: { text: string }) {
  const openOverlay = usePlayerOverlay();
  return <>{renderMarkdownInternal(text, openOverlay)}</>;
}

/**
 * Backwards-compat: function form. Always uses Link navigation (no overlay).
 * Used by surfaces outside the chat that don't provide overlay context.
 */
export function renderMarkdown(text: string): React.ReactNode {
  return renderMarkdownInternal(text, null);
}

function renderMarkdownInternal(text: string, openOverlay: ((slug: string) => void) | null): React.ReactNode {
  // Split into paragraphs by double-newline
  const blocks = text.split(/\n\n+/);
  return blocks.map((block, bi) => {
    // Bullet list block
    if (/^\s*[-*]\s/.test(block.trim())) {
      const items = block
        .split('\n')
        .filter((l) => /^\s*[-*]\s/.test(l))
        .map((l) => l.replace(/^\s*[-*]\s/, ''));
      return (
        <ul key={bi} className="list-disc list-outside pl-5 my-2 space-y-1">
          {items.map((item, i) => (
            <li key={i}>{renderInline(item, openOverlay)}</li>
          ))}
        </ul>
      );
    }
    // Regular paragraph (preserve single line breaks as <br/>)
    const lines = block.split('\n');
    return (
      <p key={bi} className={bi > 0 ? 'mt-2' : ''}>
        {lines.map((line, li) => (
          <React.Fragment key={li}>
            {renderInline(line, openOverlay)}
            {li < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

function renderInline(text: string, openOverlay: ((slug: string) => void) | null): React.ReactNode {
  // First pass: tokenize markdown (**bold**, *italic*, `code`)
  const mdTokens: { kind: 'text' | 'bold' | 'italic' | 'code'; value: string }[] = [];
  const mdRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = mdRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      mdTokens.push({ kind: 'text', value: text.slice(lastIndex, match.index) });
    }
    const m = match[0];
    if (m.startsWith('**')) mdTokens.push({ kind: 'bold', value: m.slice(2, -2) });
    else if (m.startsWith('*')) mdTokens.push({ kind: 'italic', value: m.slice(1, -1) });
    else if (m.startsWith('`')) mdTokens.push({ kind: 'code', value: m.slice(1, -1) });
    lastIndex = match.index + m.length;
  }
  if (lastIndex < text.length) {
    mdTokens.push({ kind: 'text', value: text.slice(lastIndex) });
  }

  // Second pass: linkify player names inside each token
  let key = 0;
  return mdTokens.map((tok) => {
    if (tok.kind === 'text') {
      return <React.Fragment key={key++}>{linkifyPlayers(tok.value, () => key++, openOverlay)}</React.Fragment>;
    }
    if (tok.kind === 'bold') {
      return (
        <strong key={key++} className="font-semibold text-ink">
          {linkifyPlayers(tok.value, () => key++, openOverlay)}
        </strong>
      );
    }
    if (tok.kind === 'italic') {
      return <em key={key++}>{linkifyPlayers(tok.value, () => key++, openOverlay)}</em>;
    }
    return (
      <code key={key++} className="bg-cream-warm border border-[var(--hairline)] rounded px-1.5 py-0.5 text-[13px]">
        {tok.value}
      </code>
    );
  });
}

/**
 * Walks a string and turns any known player name into either:
 *  - a button that opens the player overlay (when overlay context is set, e.g. inside chat)
 *  - a Link to /player/[slug] (everywhere else)
 */
function linkifyPlayers(text: string, nextKey: () => number, openOverlay: ((slug: string) => void) | null): React.ReactNode {
  const out: React.ReactNode[] = [];
  let cursor = 0;
  while (cursor < text.length) {
    let bestMatch: { start: number; end: number; id: string; name: string } | null = null;
    for (const p of PLAYER_INDEX) {
      const i = text.indexOf(p.name, cursor);
      if (i >= 0 && (!bestMatch || i < bestMatch.start)) {
        bestMatch = { start: i, end: i + p.name.length, id: p.id, name: p.name };
      }
    }
    if (!bestMatch) {
      out.push(text.slice(cursor));
      break;
    }
    if (bestMatch.start > cursor) {
      out.push(text.slice(cursor, bestMatch.start));
    }

    const k = `pl-${nextKey()}-${bestMatch.id}`;
    const className =
      'text-tangerine hover:text-tangerine-dark underline decoration-tangerine/40 underline-offset-2 hover:decoration-tangerine/80 transition cursor-pointer';

    if (openOverlay) {
      const slug = bestMatch.id;
      out.push(
        <button
          key={k}
          type="button"
          onClick={() => openOverlay(slug)}
          className={className + ' bg-transparent border-0 p-0 m-0 inline font-inherit'}
          style={{ font: 'inherit' }}
        >
          {bestMatch.name}
        </button>
      );
    } else {
      out.push(
        <Link key={k} href={`/player/${bestMatch.id}`} className={className}>
          {bestMatch.name}
        </Link>
      );
    }

    cursor = bestMatch.end;
  }
  return out;
}
