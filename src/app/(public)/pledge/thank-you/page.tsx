import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Thank you for your pledge',
  robots: { index: false },
  alternates: { canonical: '/pledge/thank-you' },
};

export default function PledgeThankYouPage() {
  return (
    <section className="section">
      <div className="container max-w-xl py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gold/15">
          <CheckCircle2 className="h-9 w-9 text-gold" />
        </div>
        <h1 className="text-4xl font-serif font-medium">Thank you for your generosity</h1>
        <p className="mt-4 text-lg text-foreground/70">
          Your pledge has been received. We are grateful for your partnership in the mission of
          New Life Tagum.
        </p>
        <p className="mx-auto mt-6 max-w-md rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Please note: payments are not automatically verified. Keep your reference number — our
          team will follow up to confirm your gift.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pledge">Back to giving</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
