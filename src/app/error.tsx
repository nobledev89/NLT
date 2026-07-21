'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * Route-level error boundary. Catches errors thrown while rendering a page or
 * its Server Component data fetches (e.g. a Supabase query failing) and shows a
 * branded, recoverable screen instead of a raw 500.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced to server logs / monitoring in production.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-grain px-6 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 font-serif text-display">We hit a snag</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        An unexpected error stopped this page from loading. Please try again —
        if it keeps happening, let us know.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
}
