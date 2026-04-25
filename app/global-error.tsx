'use client';

/**
 * Root-level error boundary. Catches errors in app/layout.tsx itself.
 * Must include <html> + <body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#FFFFFF', color: '#18181B' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 560, textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>⚠︎</div>
            <h1 style={{ fontSize: 32, margin: '0 0 8px', color: '#0D2D24' }}>
              Something broke at the root.
            </h1>
            <p style={{ color: '#74746E', marginBottom: 24 }}>
              The whole app failed to render. Hard reset:
            </p>
            <pre style={{ textAlign: 'left', background: '#F4F4F1', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 13 }}>
{`# in your terminal:
Ctrl+C
rm -rf .next
npm run dev`}
            </pre>
            {error.message && (
              <details style={{ marginTop: 24, textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#FF6B3D' }}>Error details</summary>
                <pre style={{ background: '#F4F4F1', padding: 12, borderRadius: 6, fontSize: 12, marginTop: 8, whiteSpace: 'pre-wrap' }}>
                  {error.message}
                  {error.digest && `\n\ndigest: ${error.digest}`}
                </pre>
              </details>
            )}
            <div style={{ marginTop: 24 }}>
              <button
                onClick={reset}
                style={{
                  background: '#FF6B3D',
                  color: 'white',
                  border: 'none',
                  borderRadius: 999,
                  padding: '10px 22px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
