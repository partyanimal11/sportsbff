import React from 'react';

/**
 * Tiny markdown renderer for chat messages.
 * Handles: **bold**, *italic*, line breaks, simple bullet lists, and inline code `...`.
 * No HTML injection — everything is JSX, so it's safe.
 */
export function renderMarkdown(text: string): React.ReactNode {
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
            <li key={i}>{renderInline(item)}</li>
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
            {renderInline(line)}
            {li < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </p>
    );
  });
}

function renderInline(text: string): React.ReactNode {
  // Tokenize: split on **bold**, *italic*, `code`
  const tokens: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.slice(lastIndex, match.index));
    }
    const m = match[0];
    if (m.startsWith('**')) {
      tokens.push(<strong key={key++} className="font-semibold text-ink">{m.slice(2, -2)}</strong>);
    } else if (m.startsWith('*')) {
      tokens.push(<em key={key++}>{m.slice(1, -1)}</em>);
    } else if (m.startsWith('`')) {
      tokens.push(
        <code key={key++} className="bg-cream-warm border border-[var(--hairline)] rounded px-1.5 py-0.5 text-[13px]">
          {m.slice(1, -1)}
        </code>
      );
    }
    lastIndex = match.index + m.length;
  }
  if (lastIndex < text.length) {
    tokens.push(text.slice(lastIndex));
  }
  return tokens;
}
