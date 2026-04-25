'use client';

import Link from 'next/link';

/**
 * Page-level error boundary. Catches errors in any non-root page.
 * Wraps the page; root layout still renders.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-xl w-full text-center">
        <div className="text-5xl mb-3">😬</div>
        <h1 className="font-display text-4xl font-bold text-green leading-tight">
          This page hit a snag.
        </h1>
        <p className="mt-3 text-ink-soft">
          Try the action below. If it keeps happening, restart the dev server.
        </p>

        {error.message && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-tangerine font-semibold">
              Show me the error
            </summary>
            <pre className="mt-2 bg-cream-warm border border-[var(--hairline)] rounded-lg p-4 text-xs whitespace-pre-wrap overflow-auto">
              {error.message}
              {error.digest && `\n\ndigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div className="mt-8 flex gap-2 justify-center">
          <button onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <Link href="/" className="btn btn-secondary">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
