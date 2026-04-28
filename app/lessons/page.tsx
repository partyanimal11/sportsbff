'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Tea'd Up renamed /lessons → /learn (with multi-tab Lessons / Glossary / Lens).
// Lesson detail pages still live at /lessons/[...slug] for backward compat.
export default function LessonsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/learn');
  }, [router]);
  return <main className="min-h-screen bg-cream-warm" />;
}
