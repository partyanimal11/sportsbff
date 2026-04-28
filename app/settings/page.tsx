'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Tea'd Up renamed Settings → Profile. Keep this route alive as a redirect
// for backward compat with any older shared links.
export default function SettingsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/profile');
  }, [router]);
  return <main className="min-h-screen bg-cream-warm" />;
}
