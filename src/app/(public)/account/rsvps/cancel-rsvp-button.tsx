'use client';

import { useTransition } from 'react';
import { cancelMyRsvp } from '../account-actions';
import { Button } from '@/components/ui/button';

export function CancelRsvpButton({ rsvpId }: { rsvpId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => void cancelMyRsvp(rsvpId))}
    >
      {pending ? 'Cancelling…' : 'Cancel RSVP'}
    </Button>
  );
}
