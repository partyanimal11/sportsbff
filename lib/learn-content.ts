/**
 * Learn-tab content layer.
 *
 * Loads lesson / quiz / flashcard data from the JSON files in /data and
 * exposes typed helpers. This is the single source of truth the API
 * routes call into.
 */
import lessonsData from '@/data/lessons.json';
import quizzesData from '@/data/quizzes.json';
import flashcardsData from '@/data/flashcards.json';

export type LessonSection =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; title: string; body: string }
  | { type: 'keyterm'; term: string; def: string }
  | { type: 'pullquote'; text: string }
  | { type: 'chat-prompt'; prompts: string[] };

export type Lesson = {
  slug: string;
  league: 'nfl' | 'nba' | 'wnba';
  title: string;
  subtitle: string;
  minutes: number;
  difficulty: 'Brand new' | 'Beginner' | 'Intermediate';
  intro: string;
  sections: LessonSection[];
  /** Premium / lens-locked content. iOS hides unless toggle ON. */
  lensLocked?: 'euphoria';
  /** XP awarded for full mastery. Default 100, Euphoria specials = 200. */
  xp: number;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type Quiz = {
  lessonSlug: string;
  questions: QuizQuestion[];
};

export type FlashcardDeck = {
  lessonSlug: string;
  cards: { front: string; back: string }[];
};

const LESSONS: Lesson[] = (lessonsData as { lessons: Lesson[] }).lessons;
const QUIZZES: Quiz[] = (quizzesData as { quizzes: Quiz[] }).quizzes;
const FLASHCARDS: FlashcardDeck[] = (flashcardsData as { decks: FlashcardDeck[] }).decks;

const LESSONS_BY_SLUG = new Map(LESSONS.map((l) => [l.slug, l]));
const QUIZZES_BY_SLUG = new Map(QUIZZES.map((q) => [q.lessonSlug, q]));
const FLASHCARDS_BY_SLUG = new Map(FLASHCARDS.map((f) => [f.lessonSlug, f]));

/* ────────────────────────────────────────────────────────────────────────── */

export type LessonSummary = {
  slug: string;
  league: 'nfl' | 'nba' | 'wnba';
  title: string;
  subtitle: string;
  minutes: number;
  difficulty: Lesson['difficulty'];
  xp: number;
  lensLocked?: 'euphoria';
};

/**
 * List all lessons (summary only — no full sections).
 *
 * If `lensesUnlocked` is provided, only include lensLocked lessons whose
 * lens is in that set. Default: hide all lensLocked lessons.
 */
export function listLessons(
  opts: { lensesUnlocked?: string[]; league?: 'nfl' | 'nba' | 'wnba' } = {}
): LessonSummary[] {
  const lensesSet = new Set(opts.lensesUnlocked ?? []);
  return LESSONS.filter((l) => {
    if (l.lensLocked && !lensesSet.has(l.lensLocked)) return false;
    if (opts.league && l.league !== opts.league) return false;
    return true;
  }).map((l) => ({
    slug: l.slug,
    league: l.league,
    title: l.title,
    subtitle: l.subtitle,
    minutes: l.minutes,
    difficulty: l.difficulty,
    xp: l.xp,
    lensLocked: l.lensLocked,
  }));
}

export function getLesson(slug: string): Lesson | null {
  return LESSONS_BY_SLUG.get(slug) ?? null;
}

export function getQuiz(slug: string): Quiz | null {
  return QUIZZES_BY_SLUG.get(slug) ?? null;
}

export function getFlashcards(slug: string): FlashcardDeck | null {
  return FLASHCARDS_BY_SLUG.get(slug) ?? null;
}

/**
 * Grade a submitted quiz answer set.
 * Returns per-question correctness + total score + pass/fail (4/5 or better passes).
 */
export function gradeQuiz(
  slug: string,
  answers: number[]
): {
  found: boolean;
  total: number;
  correct: number;
  passed: boolean;
  perQuestion: Array<{
    id: string;
    correct: boolean;
    correctIndex: number;
    explanation: string;
  }>;
} {
  const quiz = QUIZZES_BY_SLUG.get(slug);
  if (!quiz) {
    return { found: false, total: 0, correct: 0, passed: false, perQuestion: [] };
  }
  const perQuestion = quiz.questions.map((q, i) => ({
    id: q.id,
    correct: answers[i] === q.correctIndex,
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  }));
  const correct = perQuestion.filter((p) => p.correct).length;
  return {
    found: true,
    total: quiz.questions.length,
    correct,
    passed: correct >= 4, // 4 of 5 passes (or proportional for non-5-question quizzes)
    perQuestion,
  };
}

/**
 * Used by /api/chat to seed Goldie with the current lesson's context when the
 * user asks a question from inside a lesson view.
 */
export function getLessonChatContext(slug: string): string | null {
  const lesson = LESSONS_BY_SLUG.get(slug);
  if (!lesson) return null;

  const sectionText = lesson.sections
    .map((s) => {
      if (s.type === 'h2') return `\n## ${s.text}`;
      if (s.type === 'p') return s.text;
      if (s.type === 'list') return s.items.join('; ');
      if (s.type === 'callout') return `[${s.title}] ${s.body}`;
      if (s.type === 'keyterm') return `${s.term}: ${s.def}`;
      if (s.type === 'pullquote') return s.text;
      return '';
    })
    .filter(Boolean)
    .join('\n');

  return `LESSON CONTEXT (the user is currently reading "${lesson.title}" — ${lesson.subtitle}):\n\n${lesson.intro}\n${sectionText}\n\n— Use this context to answer follow-up questions. If asked about something not in the lesson, say "good question — that's beyond this lesson, but here's the quick version" and answer briefly.`;
}
