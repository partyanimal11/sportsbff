import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLesson, type LessonSection } from '@/lib/lessons';

/**
 * Lesson player. Renders typed sections.
 * Slug is a catch-all so /lessons/nfl/01-the-rules works (with the slash).
 */
export default function LessonPage({ params }: { params: { slug: string[] } }) {
  const slug = params.slug.join('/');
  const lesson = getLesson(slug);
  if (!lesson) notFound();

  return (
    <main className="min-h-screen flex flex-col">
      <header className="px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 border-b border-[var(--hairline)] flex items-center justify-between gap-3 bg-white sticky top-0 z-10">
        <Link href="/" className="font-display text-base sm:text-xl font-extrabold text-green tracking-wide uppercase shrink-0">
          SPORTS<span className="text-tangerine">★</span>BFF
        </Link>
        <Link href="/lessons" className="text-[13px] sm:text-sm text-ink-soft hover:text-ink shrink-0">← All lessons</Link>
      </header>

      <article className="flex-1 px-4 sm:px-6 py-10 sm:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span
              className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-md ${
                lesson.league === 'nfl' ? 'bg-magenta/10 text-magenta' : 'bg-sapphire/10 text-sapphire'
              }`}
            >
              {lesson.league.toUpperCase()}
            </span>
            <span className="text-xs text-muted">{lesson.minutes} min · {lesson.difficulty}</span>
          </div>

          <h1 className="font-display text-[34px] sm:text-5xl font-bold text-green leading-[0.95] tracking-tight">
            {lesson.title}
          </h1>
          <p className="mt-2 sm:mt-3 text-[17px] sm:text-xl text-ink-soft font-display italic">{lesson.subtitle}</p>

          <p className="mt-6 sm:mt-8 text-[16px] sm:text-lg leading-relaxed text-ink">{lesson.intro}</p>

          <div className="mt-8 flex flex-col gap-5">
            {lesson.sections.map((section, i) => (
              <Section key={i} section={section} />
            ))}
          </div>

          <div className="mt-16 border-t border-[var(--hairline)] pt-10 text-center">
            <p className="font-display italic text-2xl text-green">You finished the lesson.</p>
            <p className="mt-3 text-ink-soft">
              Got more questions? Hop in the chat — your lesson context comes with you.
            </p>
            <Link href="/chat" className="btn btn-primary mt-6 inline-flex">
              Open the chat →
            </Link>
            <div className="mt-12">
              <Link href="/lessons" className="text-sm text-ink-soft hover:text-ink">← Back to lessons</Link>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}

function Section({ section }: { section: LessonSection }) {
  switch (section.type) {
    case 'h2':
      return (
        <h2 className="font-display text-3xl font-bold text-green mt-6 leading-tight tracking-tight">
          {section.text}
        </h2>
      );
    case 'p':
      return <p className="text-[17px] leading-relaxed text-ink" dangerouslySetInnerHTML={{ __html: inline(section.text) }} />;
    case 'list':
      return (
        <ul className="list-disc list-outside pl-5 space-y-2 text-[17px] text-ink">
          {section.items.map((item, i) => (
            <li key={i} className="leading-relaxed" dangerouslySetInnerHTML={{ __html: inline(item) }} />
          ))}
        </ul>
      );
    case 'callout':
      return (
        <aside className="bg-cream-warm border-l-4 border-tangerine rounded-r-2xl p-5">
          <div className="text-xs font-bold tracking-widest uppercase text-tangerine mb-2">{section.title}</div>
          <p className="text-[15px] leading-relaxed text-ink whitespace-pre-line" dangerouslySetInnerHTML={{ __html: inline(section.body) }} />
        </aside>
      );
    case 'keyterm':
      return (
        <div className="bg-white border border-[var(--hairline)] rounded-xl px-4 py-3">
          <div className="font-display font-bold text-lg text-green">{section.term}</div>
          <p className="text-sm text-ink-soft mt-0.5" dangerouslySetInnerHTML={{ __html: inline(section.def) }} />
        </div>
      );
    case 'pullquote':
      return (
        <blockquote className="font-display italic text-2xl text-green border-l-4 border-lemon pl-5 my-4">
          "{section.text}"
        </blockquote>
      );
    case 'chat-prompt':
      return (
        <div className="bg-green/5 border border-green/15 rounded-2xl p-5 mt-4">
          <div className="text-xs font-bold tracking-widest uppercase text-green mb-3">
            Try asking the chat
          </div>
          <div className="flex flex-wrap gap-2">
            {section.prompts.map((p, i) => (
              <Link
                key={i}
                href={`/chat?seed=${encodeURIComponent(p)}`}
                className="text-sm bg-white border border-[var(--hairline)] rounded-full px-4 py-2 text-ink-soft hover:bg-green hover:text-white hover:border-green transition"
              >
                {p}
              </Link>
            ))}
          </div>
        </div>
      );
  }
}

/** Tiny inline-markdown renderer: **bold** and *italic*. */
function inline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}
