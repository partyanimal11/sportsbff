import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-white">
      <div className="max-w-md w-full text-center">
        <div className="font-display text-7xl font-bold text-tangerine">404</div>
        <h1 className="mt-4 font-display text-3xl font-bold text-green">
          Out of bounds.
        </h1>
        <p className="mt-3 text-ink-soft">
          That page doesn't exist. Maybe you meant one of these?
        </p>
        <div className="mt-7 flex gap-2 justify-center flex-wrap">
          <Link href="/" className="btn btn-primary">Home</Link>
          <Link href="/chat" className="btn btn-secondary">Chat</Link>
          <Link href="/scan" className="btn btn-secondary">Scan</Link>
          <Link href="/lessons" className="btn btn-secondary">Lessons</Link>
        </div>
      </div>
    </main>
  );
}
