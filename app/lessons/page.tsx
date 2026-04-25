import Link from 'next/link';
import { listLessonsForLibrary } from '@/lib/lessons';

export default function LessonsPage() {
  const lessons = listLessonsForLibrary();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-6 md:px-8 py-3 border-b border-[var(--hairline)] flex items-center justify-between bg-white sticky top-0 z-10">
        <Link href="/" className="font-display text-xl font-extrabold text-green tracking-wide uppercase">
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        <nav className="flex gap-7 text-sm text-ink-soft">
          <Link href="/scan">Scan</Link>
          <Link href="/chat">Chat</Link>
          <Link href="/lessons" className="text-green font-semibold">Lessons</Link>
        </nav>
      </header>

      <section className="flex-1 px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cream-warm text-xs text-ink-soft mb-5">
              <span className="w-2 h-2 rounded-full bg-tangerine animate-pulse" />
              {lessons.length} starter lessons · more launching weekly
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold text-green leading-[0.95] tracking-tight">
              Master both leagues.
              <br />
              <span className="italic font-medium text-sapphire">Five minutes at a time.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-soft max-w-xl mx-auto">
              Short, structured, made for absolute beginners. Every lesson has a chat built in for the "wait, what?" moments.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {lessons.map((lesson) => (
              <Link
                key={lesson.slug}
                href={`/lessons/${lesson.slug}`}
                className="group block bg-white border border-[var(--hairline)] rounded-2xl p-6 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-md ${
                      lesson.league === 'nfl' ? 'bg-magenta/10 text-magenta' : 'bg-sapphire/10 text-sapphire'
                    }`}
                  >
                    {lesson.league.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted">{lesson.minutes} min · {lesson.difficulty}</span>
                </div>
                <h3 className="font-display font-bold text-xl text-green leading-snug">{lesson.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">{lesson.subtitle}</p>
                <div className="mt-4 text-sm text-tangerine font-semibold opacity-0 group-hover:opacity-100 transition">
                  Start lesson →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
