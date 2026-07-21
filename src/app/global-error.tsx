'use client';

import { useEffect } from 'react';

/**
 * Last-resort boundary that catches errors in the root layout itself. Because
 * it replaces the entire document (including globals.css), it renders its own
 * <html>/<body> with inline styles so it still looks on-brand.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1.5rem',
          textAlign: 'center',
          background: 'hsl(20 14% 5%)',
          color: 'hsl(30 20% 92%)',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'hsl(24 92% 58%)',
          }}
        >
          Something went wrong
        </p>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 600 }}>
          We hit a snag
        </h1>
        <p
          style={{
            margin: 0,
            maxWidth: '28rem',
            color: 'hsl(28 10% 63%)',
          }}
        >
          An unexpected error stopped the site from loading. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '0.5rem',
            cursor: 'pointer',
            borderRadius: '0.5rem',
            border: 'none',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 500,
            color: 'hsl(24 45% 8%)',
            background: 'hsl(22 90% 56%)',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
